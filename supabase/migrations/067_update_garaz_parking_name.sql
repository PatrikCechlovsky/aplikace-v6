-- Migration: Update "Garáž/Parking" název na "Garáž - Parking"
-- Date: 2026-01-19
-- Purpose: Lepší zobrazení názvu v UI dlaždicích (vejde se na řádek)
-- NOTES: Slash (/) se nevejde dobře, pomlčka (-) je přehlednější

-- Aktualizovat název typu jednotky pro garáže
UPDATE public.generic_types
SET name = 'Garáž - Parking'
WHERE category = 'unit_types' 
  AND code = 'garaz' 
  AND name = 'Garáž/Parking';

-- Verification
DO $$
BEGIN
  RAISE NOTICE 'Aktualizován název typu garáže';
END $$;
