-- FILE: supabase/migrations/081_assign_icons_to_equipment_types.sql
-- PURPOSE: Přiřazení ikon k typům vybavení, které měly ❓
-- DATE: 2025-02-01
-- AUTHOR: AI Coding Agent
-- NOTES: Ikony vybrány podle kontextu z ikons.md

-- Aktualizace ikon pro typy vybavení
UPDATE public.generic_types 
SET icon = 'plug' 
WHERE type_category = 'equipment_types' AND code = 'spotrebice';

UPDATE public.generic_types 
SET icon = 'couch' 
WHERE type_category = 'equipment_types' AND code = 'nabytek';

UPDATE public.generic_types 
SET icon = 'shower' 
WHERE type_category = 'equipment_types' AND code = 'koupelna';

UPDATE public.generic_types 
SET icon = 'kitchen' 
WHERE type_category = 'equipment_types' AND code = 'kuchyne';

UPDATE public.generic_types 
SET icon = 'fire' 
WHERE type_category = 'equipment_types' AND code = 'vytapeni';

UPDATE public.generic_types 
SET icon = 'laptop' 
WHERE type_category = 'equipment_types' AND code = 'technika';

UPDATE public.generic_types 
SET icon = 'sun' 
WHERE type_category = 'equipment_types' AND code = 'osvetleni';

UPDATE public.generic_types 
SET icon = 'leaf' 
WHERE type_category = 'equipment_types' AND code = 'zahrada';

UPDATE public.generic_types 
SET icon = 'question' 
WHERE type_category = 'equipment_types' AND code = 'jine';
