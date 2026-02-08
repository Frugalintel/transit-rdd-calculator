-- Training Steps Table
create table public.training_steps (
    id text primary key,
    title text not null,
    content text not null,
    type text not null check (type in ('info', 'input', 'quiz', 'decision')),
    icon text not null,
    next_step text references public.training_steps(id) on delete set null,
    options jsonb default '[]'::jsonb, -- Array of {label, nextStep, isCorrect}
    display_order integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS Policies
alter table public.training_steps enable row level security;

-- Public read access
create policy "Public read access" on public.training_steps for select using (true);

-- Admin only write access (will be enforced by admin check in application)
create policy "Admin insert access" on public.training_steps for insert 
    with check (public.is_admin());

create policy "Admin update access" on public.training_steps for update 
    using (public.is_admin());

create policy "Admin delete access" on public.training_steps for delete 
    using (public.is_admin());

-- Function to update updated_at timestamp
create or replace function public.update_training_steps_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- Trigger for updated_at
create trigger update_training_steps_updated_at
    before update on public.training_steps
    for each row
    execute procedure public.update_training_steps_updated_at();

