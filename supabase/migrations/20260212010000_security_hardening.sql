-- Security hardening: function search_path safety + tighter usage log insert policy.

-- Harden security definer helper used by RLS checks.
create or replace function public.is_admin()
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
  );
$$;

-- Harden profile bootstrap trigger function.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;

-- Replace broad insert policy with least-privilege checks.
drop policy if exists "Anyone can insert usage logs" on public.usage_logs;
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
            'admin_invite_blocked'
          ]::text[]
        )
      )
    )
    and coalesce(length(details::text), 0) <= 8000
  );
