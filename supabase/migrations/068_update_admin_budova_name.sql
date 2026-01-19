-- Migration: Update "Administrativní budova" název na "Admin. budova"
-- Date: 2026-01-19
-- Purpose: Lepší zobrazení názvu v UI dlaždicích (vejde se na řádek)
-- NOTES: Zkrácená forma je přehlednější a vejde se do dlaždice

-- Aktualizovat název typu nemovitosti pro administrativní budovy
UPDATE public.generic_types
SET name = 'Admin. budova'
WHERE category = 'property_types' 
  AND code = 'admin_budova' 
  AND name = 'Administrativní budova';

-- Verification
DO $$
BEGIN
  RAISE NOTICE 'Aktualizován název typu administrativní budovy';
END $$;
