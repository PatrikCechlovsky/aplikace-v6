-- FILE: supabase/migrations/101_seed_units_ubytovani_hnevice.sql
-- PURPOSE: Vytvoření 8 jednotek pro nemovitost "Ubytování Hněvice"
-- DATE: 2026-02-10

-- Property: da467771-ebba-42b3-991d-4519a3573b3f
-- Landlord: 45ed734f-2ffc-4d41-96c7-1c6df1e887b9

WITH unit_type AS (
  SELECT id AS unit_type_id
  FROM public.generic_types
  WHERE category = 'unit_types' AND code = 'byt'
  LIMIT 1
)
INSERT INTO public.units (
  property_id,
  landlord_id,
  unit_type_id,
  display_name,
  area,
  disposition,
  rooms,
  floor,
  door_number,
  note,
  origin_module
)
SELECT
  'da467771-ebba-42b3-991d-4519a3573b3f'::uuid,
  '45ed734f-2ffc-4d41-96c7-1c6df1e887b9'::uuid,
  ut.unit_type_id,
  v.display_name,
  v.area,
  v.disposition,
  v.rooms,
  v.floor,
  v.door_number,
  v.note,
  '040-nemovitost'
FROM unit_type ut
CROSS JOIN (
  VALUES
    ('apartmán č. 1', 38.6, '1+1', 1, 1, '1', 'Budova A'),
    ('apartmán č. 2', 137.0, '3+1', 3, 2, '2', 'Budova A'),
    ('apartmán č. 3', 51.9, '1+kk', 1, 1, '2', 'Budova A'),
    ('apartmán č. 4', 49.9, '2+kk', 2, 2, '4', 'Budova A'),
    ('apartmán č. 5', 57.9, '2+1', 2, 1, '5', 'Budova B'),
    ('apartmán č. 6', 43.4, '1+kk', 1, 1, '6', 'Budova B'),
    ('apartmán č. 7', 32.8, '1+kk', 1, 1, '7', 'Budova B'),
    ('apartmán č. 8', 37.9, '1+kk', 1, 1, '8', 'Budova B')
) AS v(display_name, area, disposition, rooms, floor, door_number, note)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.units u
  WHERE u.property_id = 'da467771-ebba-42b3-991d-4519a3573b3f'::uuid
    AND u.display_name = v.display_name
    AND COALESCE(u.door_number, '') = COALESCE(v.door_number, '')
    AND u.is_archived = FALSE
);

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 101 complete: units seeded for Ubytování Hněvice.';
END $$;
