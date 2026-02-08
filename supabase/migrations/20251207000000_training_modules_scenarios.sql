-- Training Modules Table (top-level containers)
create table public.training_modules (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text,
    icon text not null default 'book',
    display_order integer default 0,
    is_published boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Training Scenarios Table (scenario paths within modules)
create table public.training_scenarios (
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

-- Enhance training_steps table with new fields
alter table public.training_steps 
    add column if not exists scenario_id uuid references public.training_scenarios(id) on delete set null,
    add column if not exists rich_content jsonb default null,
    add column if not exists simulation_config jsonb default null,
    add column if not exists copy_template jsonb default null;

-- Update type check to include new step types
alter table public.training_steps 
    drop constraint if exists training_steps_type_check;

alter table public.training_steps 
    add constraint training_steps_type_check 
    check (type in ('info', 'input', 'quiz', 'decision', 'simulation', 'copy_template'));

-- RLS Policies for training_modules
alter table public.training_modules enable row level security;

create policy "Public read access for published modules" on public.training_modules 
    for select using (is_published = true or public.is_admin());

create policy "Admin insert access" on public.training_modules 
    for insert with check (public.is_admin());

create policy "Admin update access" on public.training_modules 
    for update using (public.is_admin());

create policy "Admin delete access" on public.training_modules 
    for delete using (public.is_admin());

-- RLS Policies for training_scenarios
alter table public.training_scenarios enable row level security;

create policy "Public read access for published scenarios" on public.training_scenarios 
    for select using (is_published = true or public.is_admin());

create policy "Admin insert access" on public.training_scenarios 
    for insert with check (public.is_admin());

create policy "Admin update access" on public.training_scenarios 
    for update using (public.is_admin());

create policy "Admin delete access" on public.training_scenarios 
    for delete using (public.is_admin());

-- Updated_at triggers for new tables
create or replace function public.update_training_modules_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

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

create trigger update_training_scenarios_updated_at
    before update on public.training_scenarios
    for each row
    execute procedure public.update_training_scenarios_updated_at();

-- Indexes for better query performance
create index if not exists idx_training_scenarios_module_id on public.training_scenarios(module_id);
create index if not exists idx_training_steps_scenario_id on public.training_steps(scenario_id);
create index if not exists idx_training_modules_display_order on public.training_modules(display_order);
create index if not exists idx_training_scenarios_display_order on public.training_scenarios(display_order);
