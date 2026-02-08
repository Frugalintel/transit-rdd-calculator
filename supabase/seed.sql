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
-- Row 1: Weight 1 (1-999)
INSERT INTO public.transit_times (weight_id, distance_id, days) VALUES
(1, 1, 16), (1, 2, 19), (1, 3, 22), (1, 4, 24), (1, 5, 24), (1, 6, 25), (1, 7, 26), (1, 8, 27), (1, 9, 28), (1, 10, 29), (1, 11, 30), (1, 12, 31), (1, 13, 44),
-- Row 2: Weight 2 (1000-1999)
(2, 1, 15), (2, 2, 18), (2, 3, 20), (2, 4, 22), (2, 5, 21), (2, 6, 22), (2, 7, 23), (2, 8, 25), (2, 9, 26), (2, 10, 27), (2, 11, 28), (2, 12, 29), (2, 13, 39),
-- Row 3: Weight 3 (2000-3999)
(3, 1, 14), (3, 2, 15), (3, 3, 18), (3, 4, 19), (3, 5, 19), (3, 6, 20), (3, 7, 21), (3, 8, 22), (3, 9, 24), (3, 10, 25), (3, 11, 26), (3, 12, 27), (3, 13, 41),
-- Row 4: Weight 4 (4000-7999)
(4, 1, 12), (4, 2, 14), (4, 3, 17), (4, 4, 18), (4, 5, 18), (4, 6, 19), (4, 7, 20), (4, 8, 21), (4, 9, 22), (4, 10, 23), (4, 11, 24), (4, 12, 25), (4, 13, 40),
-- Row 5: Weight 5 (8000+)
(5, 1, 11), (5, 2, 12), (5, 3, 15), (5, 4, 16), (5, 5, 17), (5, 6, 18), (5, 7, 19), (5, 8, 20), (5, 9, 21), (5, 10, 22), (5, 11, 23), (5, 12, 24), (5, 13, 43)
ON CONFLICT (weight_id, distance_id) DO UPDATE SET days = EXCLUDED.days;

-- Seed Holidays
INSERT INTO public.federal_holidays (date, name) VALUES
-- 2024
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
-- 2025
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
-- 2026
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
-- 2027
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
-- 2028
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
-- 2029
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
-- 2030
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
('2025-05-15', '2025-09-30', 'Peak Season 2025');

