-- Create User Role Enum
create type user_role as enum ('user', 'admin');

-- Add role to profiles
alter table public.profiles 
add column role user_role default 'user';

-- Create a security definer function to check admin status
-- This avoids infinite recursion in RLS policies
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role = 'admin'
  );
$$ language sql security definer stable;

-- Create Usage Logs Table (for anonymous and detailed tracking)
create table public.usage_logs (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete set null,
    action_type text not null, -- 'calculation', 'login', 'page_view'
    details jsonb,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS for Usage Logs
alter table public.usage_logs enable row level security;

-- Admins can view all usage logs
create policy "Admins can view all usage logs" on public.usage_logs
    for select
    using (public.is_admin());

-- Insert policy for server-side logging (or authenticated users logging actions)
create policy "Anyone can insert usage logs" on public.usage_logs
    for insert
    with check (true);

-- Update Calculations Policies to allow Admin access
create policy "Admins can view all calculations" on public.calculations
    for select
    using (public.is_admin());

-- Allow Admins to manage reference data
create policy "Admins can manage transit weights" on public.transit_weights
    for all
    using (public.is_admin());

create policy "Admins can manage transit distances" on public.transit_distances
    for all
    using (public.is_admin());

create policy "Admins can manage transit times" on public.transit_times
    for all
    using (public.is_admin());

create policy "Admins can manage federal holidays" on public.federal_holidays
    for all
    using (public.is_admin());

create policy "Admins can manage peak seasons" on public.peak_seasons
    for all
    using (public.is_admin());
