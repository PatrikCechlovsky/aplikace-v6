-- FILE: supabase/migrations/081_assign_icons_to_equipment_types.sql
-- PURPOSE: Přiřazení ikon k typům vybavení, které měly ❓
-- DATE: 2025-02-01
-- AUTHOR: AI Coding Agent
-- NOTES: Ikony vybrány podle kontextu z ikons.md

-- Aktualizace ikon pro typy vybavení
UPDATE public.generic_types 
SET icon = 'plug' 
WHERE category = 'equipment_types' AND code = 'spotrebice';

UPDATE public.generic_types 
SET icon = 'couch' 
WHERE category = 'equipment_types' AND code = 'nabytek';

UPDATE public.generic_types 
SET icon = 'shower' 
WHERE category = 'equipment_types' AND code = 'koupelna';

UPDATE public.generic_types 
SET icon = 'kitchen' 
WHERE category = 'equipment_types' AND code = 'kuchyne';

UPDATE public.generic_types 
SET icon = 'fire' 
WHERE category = 'equipment_types' AND code = 'vytapeni';

UPDATE public.generic_types 
SET icon = 'laptop' 
WHERE category = 'equipment_types' AND code = 'technika';

UPDATE public.generic_types 
SET icon = 'sun' 
WHERE category = 'equipment_types' AND code = 'osvetleni';

UPDATE public.generic_types 
SET icon = 'leaf' 
WHERE category = 'equipment_types' AND code = 'zahrada';

UPDATE public.generic_types 
SET icon = 'map' 
WHERE category = 'equipment_types' AND code = 'exterier';

UPDATE public.generic_types 
SET icon = 'question' 
WHERE category = 'equipment_types' AND code = 'jine';
