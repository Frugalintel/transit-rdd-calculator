-- Allow successful anonymous calculations to be persisted in public.calculations
-- while keeping per-user visibility boundaries for non-admin users.

-- Remove legacy/superseded insert policies, if present.
drop policy if exists "Users can insert own calculations" on public.calculations;
drop policy if exists "Authenticated users can insert own calculations" on public.calculations;
drop policy if exists "Anonymous users can insert anonymous calculations" on public.calculations;

-- Authenticated users can insert rows tied to their own user_id.
create policy "Authenticated users can insert own calculations" on public.calculations
    for insert
    to authenticated
    with check (auth.uid() = user_id);

-- Anonymous users can insert only anonymous rows.
create policy "Anonymous users can insert anonymous calculations" on public.calculations
    for insert
    to anon
    with check (user_id is null);
