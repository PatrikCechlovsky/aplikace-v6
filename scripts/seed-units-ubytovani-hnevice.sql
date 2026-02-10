-- FILE: scripts/seed-units-ubytovani-hnevice.sql
-- PURPOSE: Vytvoření 8 jednotek pro nemovitost "Ubytování Hněvice"
-- NOTES: Spustit až po uložení nemovitosti a přiřazení pronajímatele FISH-COM

WITH target_property AS (
  SELECT p.id AS property_id, p.landlord_id
  FROM public.properties p
  JOIN public.subjects s ON s.id = p.landlord_id
  WHERE p.display_name = 'Ubytování Hněvice'
    AND s.display_name = 'FISH-COM'
  ORDER BY p.created_at DESC
  LIMIT 1
),
unit_type AS (
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
  note
)
SELECT
  tp.property_id,
  tp.landlord_id,
  ut.unit_type_id,
  v.display_name,
  v.area,
  v.disposition,
  v.rooms,
  v.floor,
  v.door_number,
  v.note
FROM target_property tp
CROSS JOIN unit_type ut
JOIN (
  VALUES
    ('apartmán č. 1', 38.6, '1+1', 1, 1, '1', 'Budova A'),
    ('apartmán č. 2', 137.0, '3+1', 3, 2, '2', 'Budova A'),
    ('apartmán č. 3', 51.9, '1+kk', 1, 1, '2', 'Budova A'),
    ('apartmán č. 4', 49.9, '2+kk', 2, 2, '4', 'Budova A'),
    ('apartmán č. 5', 57.9, '2+1', 2, 1, '5', 'Budova B'),
    ('apartmán č. 6', 43.4, '1+kk', 1, 1, '6', 'Budova B'),
    ('apartmán č. 7', 32.8, '1+kk', 1, 1, '7', 'Budova B'),
    ('apartmán č. 8', 37.9, '1+kk', 1, 1, '8', 'Budova B')
) AS v(display_name, area, disposition, rooms, floor, door_number, note);
