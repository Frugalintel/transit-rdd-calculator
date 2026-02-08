-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Transit Weights
create table public.transit_weights (
    id serial primary key,
    min_weight integer not null,
    max_weight integer not null -- Use 2147483647 (Integer Max) for Infinity
);

-- 2. Transit Distances
create table public.transit_distances (
    id serial primary key,
    min_dist integer not null,
    max_dist integer not null
);

-- 3. Transit Times
create table public.transit_times (
    id serial primary key,
    weight_id integer references public.transit_weights(id) not null,
    distance_id integer references public.transit_distances(id) not null,
    days integer not null,
    unique(weight_id, distance_id)
);

-- 4. Federal Holidays
create table public.federal_holidays (
    id uuid default uuid_generate_v4() primary key,
    date date not null unique,
    name text
);

-- 5. Peak Seasons
create table public.peak_seasons (
    id uuid default uuid_generate_v4() primary key,
    start_date date not null,
    end_date date not null,
    name text
);

-- 6. Profiles (User Settings)
create table public.profiles (
    id uuid references auth.users(id) on delete cascade primary key,
    theme_settings jsonb default '{"hue": 151, "saturation": 89, "lightness": 55}'::jsonb,
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 7. Calculations (History)
create table public.calculations (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade, -- Nullable for anonymous if needed, but we plan for auth
    input_data jsonb not null, -- {weight, distance, loadDate, packDate}
    result_data jsonb not null, -- {rdd, transitDays, isPeak}
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
create policy "Public read access" on public.transit_weights for select using (true);
create policy "Public read access" on public.transit_distances for select using (true);
create policy "Public read access" on public.transit_times for select using (true);
create policy "Public read access" on public.federal_holidays for select using (true);
create policy "Public read access" on public.peak_seasons for select using (true);

-- User Access for Profiles
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- User Access for Calculations
create policy "Users can view own calculations" on public.calculations for select using (auth.uid() = user_id);
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
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

