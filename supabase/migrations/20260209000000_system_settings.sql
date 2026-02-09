-- Create system_settings table for app-wide configuration
create table if not exists public.system_settings (
    key text primary key,
    value jsonb not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()),
    updated_by uuid references auth.users(id)
);

-- RLS Policies
alter table public.system_settings enable row level security;

-- Public read access
create policy "Public read access" on public.system_settings
    for select
    using (true);

-- Admin write access (using existing is_admin function)
create policy "Admins can update system settings" on public.system_settings
    for all
    using (public.is_admin());

-- Insert default training_coming_soon setting
insert into public.system_settings (key, value)
values (
    'training_coming_soon',
    '{
        "enabled": true,
        "minecraft_message": "Training modules are being prepared. Check back soon!",
        "fallout_message": "TRAINING MODULE STATUS: OFFLINE\nCONTENT UNDER DEVELOPMENT\nCHECK BACK LATER FOR UPDATES"
    }'::jsonb
)
on conflict (key) do nothing;
