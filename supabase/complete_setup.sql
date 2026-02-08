-- ========================================
-- COMPLETE SUPABASE DATABASE SETUP
-- Run this script in Supabase SQL Editor
-- ========================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ========================================
-- MIGRATION 1: Init Schema
-- ========================================

-- 1. Transit Weights
create table if not exists public.transit_weights (
    id serial primary key,
    min_weight integer not null,
    max_weight integer not null -- Use 2147483647 (Integer Max) for Infinity
);

-- 2. Transit Distances
create table if not exists public.transit_distances (
    id serial primary key,
    min_dist integer not null,
    max_dist integer not null
);

-- 3. Transit Times
create table if not exists public.transit_times (
    id serial primary key,
    weight_id integer references public.transit_weights(id) not null,
    distance_id integer references public.transit_distances(id) not null,
    days integer not null,
    unique(weight_id, distance_id)
);

-- 4. Federal Holidays
create table if not exists public.federal_holidays (
    id uuid default uuid_generate_v4() primary key,
    date date not null unique,
    name text
);

-- 5. Peak Seasons
create table if not exists public.peak_seasons (
    id uuid default uuid_generate_v4() primary key,
    start_date date not null,
    end_date date not null,
    name text
);

-- 6. Profiles (User Settings)
create table if not exists public.profiles (
    id uuid references auth.users(id) on delete cascade primary key,
    theme_settings jsonb default '{"hue": 151, "saturation": 89, "lightness": 55}'::jsonb,
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 7. Calculations (History)
create table if not exists public.calculations (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade,
    input_data jsonb not null,
    result_data jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS Policies
alter table public.transit_weights enable row level security;
alter table public.transit_distances enable row level security;
alter table public.transit_times enable row level security;
alter table public.federal_holidays enable row level security;
alter table public.peak_seasons enable row level security;
alter table public.profiles enable row level security;
alter table public.calculations enable row level security;

-- Public Read Access for Config
drop policy if exists "Public read access" on public.transit_weights;
create policy "Public read access" on public.transit_weights for select using (true);

drop policy if exists "Public read access" on public.transit_distances;
create policy "Public read access" on public.transit_distances for select using (true);

drop policy if exists "Public read access" on public.transit_times;
create policy "Public read access" on public.transit_times for select using (true);

drop policy if exists "Public read access" on public.federal_holidays;
create policy "Public read access" on public.federal_holidays for select using (true);

drop policy if exists "Public read access" on public.peak_seasons;
create policy "Public read access" on public.peak_seasons for select using (true);

-- User Access for Profiles
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- User Access for Calculations
drop policy if exists "Users can view own calculations" on public.calculations;
create policy "Users can view own calculations" on public.calculations for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own calculations" on public.calculations;
create policy "Users can insert own calculations" on public.calculations for insert with check (auth.uid() = user_id);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ========================================
-- MIGRATION 2: Admin Features
-- ========================================

-- Create User Role Enum
do $$ begin
    create type user_role as enum ('user', 'admin');
exception
    when duplicate_object then null;
end $$;

-- Add role to profiles
alter table public.profiles 
add column if not exists role user_role default 'user';

-- Create a security definer function to check admin status
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role = 'admin'
  );
$$ language sql security definer stable;

-- Create Usage Logs Table
create table if not exists public.usage_logs (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete set null,
    action_type text not null,
    details jsonb,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS for Usage Logs
alter table public.usage_logs enable row level security;

drop policy if exists "Admins can view all usage logs" on public.usage_logs;
create policy "Admins can view all usage logs" on public.usage_logs
    for select using (public.is_admin());

drop policy if exists "Anyone can insert usage logs" on public.usage_logs;
create policy "Anyone can insert usage logs" on public.usage_logs
    for insert with check (true);

-- Admin Calculation Access
drop policy if exists "Admins can view all calculations" on public.calculations;
create policy "Admins can view all calculations" on public.calculations
    for select using (public.is_admin());

-- Admin Data Management Policies
drop policy if exists "Admins can manage transit weights" on public.transit_weights;
create policy "Admins can manage transit weights" on public.transit_weights
    for all using (public.is_admin());

drop policy if exists "Admins can manage transit distances" on public.transit_distances;
create policy "Admins can manage transit distances" on public.transit_distances
    for all using (public.is_admin());

drop policy if exists "Admins can manage transit times" on public.transit_times;
create policy "Admins can manage transit times" on public.transit_times
    for all using (public.is_admin());

drop policy if exists "Admins can manage federal holidays" on public.federal_holidays;
create policy "Admins can manage federal holidays" on public.federal_holidays
    for all using (public.is_admin());

drop policy if exists "Admins can manage peak seasons" on public.peak_seasons;
create policy "Admins can manage peak seasons" on public.peak_seasons
    for all using (public.is_admin());

-- ========================================
-- MIGRATION 3: Training Steps
-- ========================================

create table if not exists public.training_steps (
    id text primary key,
    title text not null,
    content text not null,
    type text not null check (type in ('info', 'input', 'quiz', 'decision')),
    icon text not null,
    next_step text references public.training_steps(id) on delete set null,
    options jsonb default '[]'::jsonb,
    display_order integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.training_steps enable row level security;

drop policy if exists "Public read access" on public.training_steps;
create policy "Public read access" on public.training_steps for select using (true);

drop policy if exists "Admin insert access" on public.training_steps;
create policy "Admin insert access" on public.training_steps for insert 
    with check (public.is_admin());

drop policy if exists "Admin update access" on public.training_steps;
create policy "Admin update access" on public.training_steps for update 
    using (public.is_admin());

drop policy if exists "Admin delete access" on public.training_steps;
create policy "Admin delete access" on public.training_steps for delete 
    using (public.is_admin());

create or replace function public.update_training_steps_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

drop trigger if exists update_training_steps_updated_at on public.training_steps;
create trigger update_training_steps_updated_at
    before update on public.training_steps
    for each row
    execute procedure public.update_training_steps_updated_at();

-- ========================================
-- MIGRATION 4: Add Calculation Name
-- ========================================

alter table public.calculations 
add column if not exists name text;

-- ========================================
-- MIGRATION 5: Training Modules & Scenarios
-- ========================================

create table if not exists public.training_modules (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text,
    icon text not null default 'book',
    display_order integer default 0,
    is_published boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.training_scenarios (
    id uuid primary key default gen_random_uuid(),
    module_id uuid not null references public.training_modules(id) on delete cascade,
    title text not null,
    description text,
    icon text not null default 'compass',
    complexity_level text not null default 'simple' check (complexity_level in ('simple', 'intermediate', 'complex')),
    tags text[] default '{}',
    display_order integer default 0,
    is_published boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enhance training_steps table
alter table public.training_steps 
    add column if not exists scenario_id uuid references public.training_scenarios(id) on delete set null,
    add column if not exists rich_content jsonb default null,
    add column if not exists simulation_config jsonb default null,
    add column if not exists copy_template jsonb default null;

-- Update type check
alter table public.training_steps 
    drop constraint if exists training_steps_type_check;

alter table public.training_steps 
    add constraint training_steps_type_check 
    check (type in ('info', 'input', 'quiz', 'decision', 'simulation', 'copy_template'));

-- RLS for training_modules
alter table public.training_modules enable row level security;

drop policy if exists "Public read access for published modules" on public.training_modules;
create policy "Public read access for published modules" on public.training_modules 
    for select using (is_published = true or public.is_admin());

drop policy if exists "Admin insert access" on public.training_modules;
create policy "Admin insert access" on public.training_modules 
    for insert with check (public.is_admin());

drop policy if exists "Admin update access" on public.training_modules;
create policy "Admin update access" on public.training_modules 
    for update using (public.is_admin());

drop policy if exists "Admin delete access" on public.training_modules;
create policy "Admin delete access" on public.training_modules 
    for delete using (public.is_admin());

-- RLS for training_scenarios
alter table public.training_scenarios enable row level security;

drop policy if exists "Public read access for published scenarios" on public.training_scenarios;
create policy "Public read access for published scenarios" on public.training_scenarios 
    for select using (is_published = true or public.is_admin());

drop policy if exists "Admin insert access" on public.training_scenarios;
create policy "Admin insert access" on public.training_scenarios 
    for insert with check (public.is_admin());

drop policy if exists "Admin update access" on public.training_scenarios;
create policy "Admin update access" on public.training_scenarios 
    for update using (public.is_admin());

drop policy if exists "Admin delete access" on public.training_scenarios;
create policy "Admin delete access" on public.training_scenarios 
    for delete using (public.is_admin());

-- Triggers
create or replace function public.update_training_modules_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

drop trigger if exists update_training_modules_updated_at on public.training_modules;
create trigger update_training_modules_updated_at
    before update on public.training_modules
    for each row
    execute procedure public.update_training_modules_updated_at();

create or replace function public.update_training_scenarios_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

drop trigger if exists update_training_scenarios_updated_at on public.training_scenarios;
create trigger update_training_scenarios_updated_at
    before update on public.training_scenarios
    for each row
    execute procedure public.update_training_scenarios_updated_at();

-- Indexes
create index if not exists idx_training_scenarios_module_id on public.training_scenarios(module_id);
create index if not exists idx_training_steps_scenario_id on public.training_steps(scenario_id);
create index if not exists idx_training_modules_display_order on public.training_modules(display_order);
create index if not exists idx_training_scenarios_display_order on public.training_scenarios(display_order);

-- ========================================
-- SEED DATA
-- ========================================

-- Seed Weights
INSERT INTO public.transit_weights (id, min_weight, max_weight) VALUES
(1, 1, 999),
(2, 1000, 1999),
(3, 2000, 3999),
(4, 4000, 7999),
(5, 8000, 2147483647)
ON CONFLICT (id) DO UPDATE SET min_weight = EXCLUDED.min_weight, max_weight = EXCLUDED.max_weight;

-- Seed Distances
INSERT INTO public.transit_distances (id, min_dist, max_dist) VALUES
(1, 1, 250),
(2, 251, 500),
(3, 501, 750),
(4, 751, 1000),
(5, 1001, 1250),
(6, 1251, 1500),
(7, 1501, 1750),
(8, 1751, 2000),
(9, 2001, 2250),
(10, 2251, 2500),
(11, 2501, 2750),
(12, 2751, 3000),
(13, 3001, 7000)
ON CONFLICT (id) DO UPDATE SET min_dist = EXCLUDED.min_dist, max_dist = EXCLUDED.max_dist;

-- Seed Times (Matrix)
INSERT INTO public.transit_times (weight_id, distance_id, days) VALUES
(1, 1, 16), (1, 2, 19), (1, 3, 22), (1, 4, 24), (1, 5, 24), (1, 6, 25), (1, 7, 26), (1, 8, 27), (1, 9, 28), (1, 10, 29), (1, 11, 30), (1, 12, 31), (1, 13, 44),
(2, 1, 15), (2, 2, 18), (2, 3, 20), (2, 4, 22), (2, 5, 21), (2, 6, 22), (2, 7, 23), (2, 8, 25), (2, 9, 26), (2, 10, 27), (2, 11, 28), (2, 12, 29), (2, 13, 39),
(3, 1, 14), (3, 2, 15), (3, 3, 18), (3, 4, 19), (3, 5, 19), (3, 6, 20), (3, 7, 21), (3, 8, 22), (3, 9, 24), (3, 10, 25), (3, 11, 26), (3, 12, 27), (3, 13, 41),
(4, 1, 12), (4, 2, 14), (4, 3, 17), (4, 4, 18), (4, 5, 18), (4, 6, 19), (4, 7, 20), (4, 8, 21), (4, 9, 22), (4, 10, 23), (4, 11, 24), (4, 12, 25), (4, 13, 40),
(5, 1, 11), (5, 2, 12), (5, 3, 15), (5, 4, 16), (5, 5, 17), (5, 6, 18), (5, 7, 19), (5, 8, 20), (5, 9, 21), (5, 10, 22), (5, 11, 23), (5, 12, 24), (5, 13, 43)
ON CONFLICT (weight_id, distance_id) DO UPDATE SET days = EXCLUDED.days;

-- Seed Holidays (2024-2030)
INSERT INTO public.federal_holidays (date, name) VALUES
('2024-01-01', 'New Year''s Day'),
('2024-01-15', 'Martin Luther King Jr. Day'),
('2024-02-19', 'Washington''s Birthday'),
('2024-05-27', 'Memorial Day'),
('2024-06-19', 'Juneteenth National Independence Day'),
('2024-07-04', 'Independence Day'),
('2024-09-02', 'Labor Day'),
('2024-10-14', 'Columbus Day'),
('2024-11-11', 'Veterans Day'),
('2024-11-28', 'Thanksgiving Day'),
('2024-12-25', 'Christmas Day'),
('2025-01-01', 'New Year''s Day'),
('2025-01-20', 'Martin Luther King Jr. Day'),
('2025-02-17', 'Washington''s Birthday'),
('2025-05-26', 'Memorial Day'),
('2025-06-19', 'Juneteenth National Independence Day'),
('2025-07-04', 'Independence Day'),
('2025-09-01', 'Labor Day'),
('2025-10-13', 'Columbus Day'),
('2025-11-11', 'Veterans Day'),
('2025-11-27', 'Thanksgiving Day'),
('2025-12-25', 'Christmas Day'),
('2026-01-01', 'New Year''s Day'),
('2026-01-19', 'Martin Luther King Jr. Day'),
('2026-02-16', 'Washington''s Birthday'),
('2026-05-25', 'Memorial Day'),
('2026-06-19', 'Juneteenth National Independence Day'),
('2026-07-04', 'Independence Day'),
('2026-09-07', 'Labor Day'),
('2026-10-12', 'Columbus Day'),
('2026-11-11', 'Veterans Day'),
('2026-11-26', 'Thanksgiving Day'),
('2026-12-25', 'Christmas Day'),
('2027-01-01', 'New Year''s Day'),
('2027-01-18', 'Martin Luther King Jr. Day'),
('2027-02-15', 'Washington''s Birthday'),
('2027-05-31', 'Memorial Day'),
('2027-06-19', 'Juneteenth National Independence Day'),
('2027-07-04', 'Independence Day'),
('2027-09-06', 'Labor Day'),
('2027-10-11', 'Columbus Day'),
('2027-11-11', 'Veterans Day'),
('2027-11-25', 'Thanksgiving Day'),
('2027-12-25', 'Christmas Day'),
('2028-01-01', 'New Year''s Day'),
('2028-01-17', 'Martin Luther King Jr. Day'),
('2028-02-21', 'Washington''s Birthday'),
('2028-05-29', 'Memorial Day'),
('2028-06-19', 'Juneteenth National Independence Day'),
('2028-07-04', 'Independence Day'),
('2028-09-04', 'Labor Day'),
('2028-10-09', 'Columbus Day'),
('2028-11-11', 'Veterans Day'),
('2028-11-23', 'Thanksgiving Day'),
('2028-12-25', 'Christmas Day'),
('2029-01-01', 'New Year''s Day'),
('2029-01-15', 'Martin Luther King Jr. Day'),
('2029-02-19', 'Washington''s Birthday'),
('2029-05-28', 'Memorial Day'),
('2029-06-19', 'Juneteenth National Independence Day'),
('2029-07-04', 'Independence Day'),
('2029-09-03', 'Labor Day'),
('2029-10-08', 'Columbus Day'),
('2029-11-11', 'Veterans Day'),
('2029-11-22', 'Thanksgiving Day'),
('2029-12-25', 'Christmas Day'),
('2030-01-01', 'New Year''s Day'),
('2030-01-21', 'Martin Luther King Jr. Day'),
('2030-02-18', 'Washington''s Birthday'),
('2030-05-27', 'Memorial Day'),
('2030-06-19', 'Juneteenth National Independence Day'),
('2030-07-04', 'Independence Day'),
('2030-09-02', 'Labor Day'),
('2030-10-14', 'Columbus Day'),
('2030-11-11', 'Veterans Day'),
('2030-11-28', 'Thanksgiving Day'),
('2030-12-25', 'Christmas Day')
ON CONFLICT (date) DO NOTHING;

-- Seed Peak Season
INSERT INTO public.peak_seasons (start_date, end_date, name) VALUES
('2025-05-15', '2025-09-30', 'Peak Season 2025'),
('2026-05-15', '2026-09-30', 'Peak Season 2026'),
('2027-05-15', '2027-09-30', 'Peak Season 2027')
ON CONFLICT DO NOTHING;
