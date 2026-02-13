-- User management upgrade:
-- - owner protection
-- - delegated admin permissions
-- - account status controls
-- - per-user copy template overrides

-- Account status enum for user lifecycle management.
do $$
begin
    create type public.account_status as enum ('invited', 'active', 'suspended', 'disabled');
exception
    when duplicate_object then null;
end $$;

alter table public.profiles
    add column if not exists email text,
    add column if not exists status public.account_status not null default 'active',
    add column if not exists is_owner boolean not null default false;

-- Keep status values sane in case older rows were backfilled manually.
update public.profiles
set status = 'active'
where status is null;

update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
  and p.email is null;

-- Allow at most one owner account.
create unique index if not exists profiles_single_owner_idx
    on public.profiles (is_owner)
    where is_owner = true;

-- Keep profile email synchronized with auth.users.email.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
    insert into public.profiles (id, email, status)
    values (new.id, new.email, 'active')
    on conflict (id) do update
        set email = excluded.email;
    return new;
end;
$$;

create or replace function public.sync_profile_email_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
    update public.profiles
    set email = new.email
    where id = new.id;
    return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
    after update of email on auth.users
    for each row
    when (old.email is distinct from new.email)
    execute procedure public.sync_profile_email_from_auth();

-- Owner helper.
create or replace function public.is_owner()
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
    select exists (
        select 1
        from public.profiles
        where id = auth.uid()
          and role = 'admin'
          and is_owner = true
          and status = 'active'
    );
$$;

-- Admin permission grants for restricted actions.
create table if not exists public.admin_permissions (
    user_id uuid not null references public.profiles(id) on delete cascade,
    permission_key text not null,
    granted_by uuid references public.profiles(id) on delete set null,
    granted_at timestamp with time zone not null default timezone('utc'::text, now()),
    primary key (user_id, permission_key),
    check (length(permission_key) >= 3 and length(permission_key) <= 80)
);

alter table public.admin_permissions enable row level security;

-- Per-user server-side template overrides.
create table if not exists public.user_template_overrides (
    target_user_id uuid not null references public.profiles(id) on delete cascade,
    format_key text not null,
    template_text text not null,
    updated_by uuid references public.profiles(id) on delete set null,
    updated_at timestamp with time zone not null default timezone('utc'::text, now()),
    primary key (target_user_id, format_key),
    check (format_key = any (array['simple', 'osnp', 'osp', 'isp', 'isnp', 'dpsr']::text[])),
    check (length(template_text) >= 1 and length(template_text) <= 10000)
);

alter table public.user_template_overrides enable row level security;

create or replace function public.touch_user_template_override_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$;

drop trigger if exists user_template_overrides_touch_updated_at on public.user_template_overrides;
create trigger user_template_overrides_touch_updated_at
    before update on public.user_template_overrides
    for each row
    execute procedure public.touch_user_template_override_updated_at();

-- Permission evaluator:
-- - owner: full access
-- - admin: default broad access, explicit grants for restricted actions
-- - any non-owner cannot target owner accounts for mutable actions
create or replace function public.has_permission(required_permission_key text, target_user_id uuid default null)
returns boolean
language plpgsql
security definer
stable
set search_path = public, pg_temp
as $$
declare
    actor_id uuid := auth.uid();
    actor_role public.user_role;
    actor_owner boolean;
    actor_status public.account_status;
    target_owner boolean := false;
begin
    if actor_id is null then
        return false;
    end if;

    select role, is_owner, status
    into actor_role, actor_owner, actor_status
    from public.profiles
    where id = actor_id;

    if actor_role is null then
        return false;
    end if;

    if actor_status <> 'active' then
        return false;
    end if;

    if actor_owner then
        return true;
    end if;

    if actor_role <> 'admin' then
        return false;
    end if;

    if target_user_id is not null then
        select coalesce(is_owner, false)
        into target_owner
        from public.profiles
        where id = target_user_id;

        if target_owner then
            return false;
        end if;
    end if;

    -- Default delegated-admin permissions.
    if required_permission_key = any (
        array[
            'admin.panel.access',
            'users.view',
            'users.create',
            'users.status.update',
            'templates.override',
            'data.manage',
            'training.manage',
            'logs.view'
        ]::text[]
    ) then
        return true;
    end if;

    return exists (
        select 1
        from public.admin_permissions ap
        where ap.user_id = actor_id
          and ap.permission_key = required_permission_key
    );
end;
$$;

-- Protect the owner profile from in-app mutation/deletion.
create or replace function public.enforce_owner_profile_guard()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    owner_exists boolean;
begin
    if tg_op = 'DELETE' then
        if old.is_owner then
            raise exception 'Owner account cannot be deleted.';
        end if;
        return old;
    end if;

    if tg_op = 'UPDATE' then
        if old.is_owner then
            if new.is_owner is distinct from true then
                raise exception 'Owner account cannot be demoted.';
            end if;
            if new.role <> 'admin' then
                raise exception 'Owner account role must remain admin.';
            end if;
            if new.status in ('suspended', 'disabled') then
                raise exception 'Owner account cannot be suspended or disabled.';
            end if;
        elsif new.is_owner = true then
            -- Only the current owner can transfer ownership when one exists.
            select exists(select 1 from public.profiles where is_owner = true)
            into owner_exists;
            if owner_exists and auth.uid() is not null and public.is_owner() <> true then
                raise exception 'Only the owner can transfer ownership.';
            end if;
            new.role := 'admin';
            new.status := 'active';
        end if;
        return new;
    end if;

    if tg_op = 'INSERT' and new.is_owner = true then
        select exists(select 1 from public.profiles where is_owner = true)
        into owner_exists;
        if owner_exists and auth.uid() is not null and public.is_owner() <> true then
            raise exception 'Only the owner can create another owner profile.';
        end if;
        new.role := 'admin';
        new.status := 'active';
    end if;

    return new;
end;
$$;

drop trigger if exists profiles_owner_guard on public.profiles;
create trigger profiles_owner_guard
    before insert or update or delete on public.profiles
    for each row
    execute procedure public.enforce_owner_profile_guard();

-- Ensure there is an owner after migration when possible.
do $$
begin
    if not exists (select 1 from public.profiles where is_owner = true) then
        update public.profiles
        set is_owner = true, role = 'admin', status = 'active'
        where id = (
            select p.id
            from public.profiles p
            where p.role = 'admin'
            order by p.updated_at asc nulls last
            limit 1
        );
    end if;
end $$;

-- Refresh profile policies with permission-aware admin access.
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;

create policy "Users can view own profile" on public.profiles
    for select
    using (auth.uid() = id or public.has_permission('users.view', id));

create policy "Users can update own profile" on public.profiles
    for update
    using (
        auth.uid() = id
        or public.has_permission('users.status.update', id)
        or public.has_permission('users.role.update', id)
        or public.has_permission('users.permissions.update', id)
        or public.has_permission('templates.override', id)
    )
    with check (
        auth.uid() = id
        or public.has_permission('users.status.update', id)
        or public.has_permission('users.role.update', id)
        or public.has_permission('users.permissions.update', id)
        or public.has_permission('templates.override', id)
    );

create policy "Users can insert own profile" on public.profiles
    for insert
    with check (auth.uid() = id or public.has_permission('users.create', id));

drop policy if exists "Admin permissions read" on public.admin_permissions;
drop policy if exists "Admin permissions manage" on public.admin_permissions;

create policy "Admin permissions read" on public.admin_permissions
    for select
    using (auth.uid() = user_id or public.has_permission('users.permissions.update', user_id));

create policy "Admin permissions manage" on public.admin_permissions
    for all
    using (public.has_permission('users.permissions.update', user_id))
    with check (public.has_permission('users.permissions.update', user_id));

drop policy if exists "Template overrides read" on public.user_template_overrides;
drop policy if exists "Template overrides manage" on public.user_template_overrides;

create policy "Template overrides read" on public.user_template_overrides
    for select
    using (
        auth.uid() = target_user_id
        or public.has_permission('templates.override', target_user_id)
    );

create policy "Template overrides manage" on public.user_template_overrides
    for all
    using (public.has_permission('templates.override', target_user_id))
    with check (public.has_permission('templates.override', target_user_id));

-- Expand usage_logs insert allowlist for new admin-management audit events.
drop policy if exists "Users can insert scoped usage logs" on public.usage_logs;

create policy "Users can insert scoped usage logs" on public.usage_logs
    for insert
    with check (
        (
            (
                auth.uid() is null
                and user_id is null
                and action_type = any (
                    array[
                        'calculation',
                        'page_view'
                    ]::text[]
                )
            )
            or (
                auth.uid() = user_id
                and action_type = any (
                    array[
                        'calculation',
                        'login',
                        'page_view',
                        'admin_invite_sent',
                        'admin_invite_blocked',
                        'admin_user_status_updated',
                        'admin_user_role_updated',
                        'admin_permission_granted',
                        'admin_permission_revoked',
                        'admin_template_override_upserted',
                        'admin_template_override_deleted'
                    ]::text[]
                )
            )
        )
        and coalesce(length(details::text), 0) <= 8000
    );
