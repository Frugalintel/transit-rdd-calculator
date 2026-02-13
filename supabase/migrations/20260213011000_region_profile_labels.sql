-- Normalize legacy region labels to canonical Region 1..5 names/slugs.
-- Preserve existing user assignments while merging duplicate rows safely.

do $$
declare
    mapping record;
begin
    for mapping in
        select *
        from (
            values
                ('northeast', 'region1', 'Region 1'),
                ('southeast', 'region2', 'Region 2'),
                ('midwest', 'region3', 'Region 3'),
                ('southwest', 'region4', 'Region 4'),
                ('west', 'region5', 'Region 5')
        ) as m(old_slug, new_slug, new_name)
    loop
        if exists (select 1 from public.regions where slug = mapping.old_slug) then
            if exists (select 1 from public.regions where slug = mapping.new_slug) then
                -- Merge assignments from legacy row into canonical row, then remove legacy.
                update public.regions target
                set
                    user_1_id = coalesce(target.user_1_id, legacy.user_1_id),
                    user_2_id = coalesce(target.user_2_id, legacy.user_2_id),
                    name = mapping.new_name
                from public.regions legacy
                where target.slug = mapping.new_slug
                  and legacy.slug = mapping.old_slug;

                delete from public.regions
                where slug = mapping.old_slug;
            else
                update public.regions
                set
                    slug = mapping.new_slug,
                    name = mapping.new_name
                where slug = mapping.old_slug;
            end if;
        end if;
    end loop;
end $$;

-- Ensure canonical rows exist for all 5 regions.
insert into public.regions (name, slug)
values
    ('Region 1', 'region1'),
    ('Region 2', 'region2'),
    ('Region 3', 'region3'),
    ('Region 4', 'region4'),
    ('Region 5', 'region5')
on conflict (slug) do update
set name = excluded.name;

-- Prevent assigning the same user to both seats in one region.
alter table public.regions
    drop constraint if exists regions_distinct_user_slots;

alter table public.regions
    add constraint regions_distinct_user_slots
    check (
        user_1_id is null
        or user_2_id is null
        or user_1_id <> user_2_id
    );
