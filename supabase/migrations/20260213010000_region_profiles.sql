-- Regions table for Region Profiles
-- Supports 5 regions with 2 assigned users each

create table if not exists public.regions (
    id uuid default gen_random_uuid() primary key,
    name text not null unique,
    slug text not null unique,
    
    -- The "Safe" Links
    user_1_id uuid references public.profiles(id) on delete set null,
    user_2_id uuid references public.profiles(id) on delete set null,
    
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.regions enable row level security;

-- Policies
drop policy if exists "Public read access" on public.regions;
create policy "Public read access" on public.regions
    for select using (true);

drop policy if exists "Admins can manage regions" on public.regions;
create policy "Admins can manage regions" on public.regions
    for all using (public.has_permission('data.manage'));

-- Seed Data (canonical Region 1..5 naming)
insert into public.regions (name, slug) values 
    ('Region 1', 'region1'),
    ('Region 2', 'region2'),
    ('Region 3', 'region3'),
    ('Region 4', 'region4'),
    ('Region 5', 'region5')
on conflict (slug) do nothing;

-- Update trigger
create or replace function public.update_regions_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists update_regions_updated_at on public.regions;
create trigger update_regions_updated_at
    before update on public.regions
    for each row
    execute procedure public.update_regions_updated_at();
