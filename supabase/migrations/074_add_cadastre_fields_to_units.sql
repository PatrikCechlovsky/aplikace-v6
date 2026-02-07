-- Migration: Add cadastre fields to units table
-- Date: 2026-01-31
-- Purpose: Doplnění katastrálních údajů pro jednotky (podle UnitDetailForm.tsx)
-- Reason: Některé jednotky mohou mít odlišné katastrální údaje než celá nemovitost

-- ============================================================================
-- ADD CADASTRE COLUMNS
-- ============================================================================

-- Add cadastral_area column
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS cadastral_area TEXT;

-- Add parcel_number column
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS parcel_number TEXT;

-- Add lv_number column (list vlastnictví)
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS lv_number TEXT;

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

-- Index for searching by cadastral area
CREATE INDEX IF NOT EXISTS idx_units_cadastral_area 
ON public.units(cadastral_area) 
WHERE is_archived = FALSE AND cadastral_area IS NOT NULL;

-- Index for searching by parcel number
CREATE INDEX IF NOT EXISTS idx_units_parcel_number 
ON public.units(parcel_number) 
WHERE is_archived = FALSE AND parcel_number IS NOT NULL;

-- ============================================================================
-- ADD COMMENTS
-- ============================================================================

COMMENT ON COLUMN public.units.cadastral_area IS 'Katastrální území jednotky (může být jiné než u nemovitosti)';
COMMENT ON COLUMN public.units.parcel_number IS 'Číslo parcely pro jednotku (např. 123/45)';
COMMENT ON COLUMN public.units.lv_number IS 'List vlastnictví pro jednotku (např. LV-1234)';

-- ============================================================================
-- ADD CONSTRAINTS
-- ============================================================================

-- Length constraints for cadastre fields
ALTER TABLE public.units 
ADD CONSTRAINT units_cadastral_area_length 
CHECK (cadastral_area IS NULL OR length(cadastral_area) <= 100);

ALTER TABLE public.units 
ADD CONSTRAINT units_parcel_number_length 
CHECK (parcel_number IS NULL OR length(parcel_number) <= 50);

ALTER TABLE public.units 
ADD CONSTRAINT units_lv_number_length 
CHECK (lv_number IS NULL OR length(lv_number) <= 50);

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================

-- 📋 Context:
-- UnitDetailForm.tsx obsahuje sekci "Katastr" s poli:
-- - cadastral_area (katastrální území)
-- - parcel_number (číslo parcely)
-- - lv_number (list vlastnictví)
--
-- Tyto údaje mohou být pro jednotku specifické (např. u bytů ve spoluvlastnictví,
-- garáží na samostatné parcele, atd.), proto je potřebujeme i na úrovni jednotky.
--
-- Pokud jednotka nemá vlastní katastrální údaje, UI může zobrazit údaje z properties.

-- ✅ After this migration:
-- - Units mají všechna pole z UnitDetailForm.tsx
-- - Properties mají všechna pole z PropertyDetailForm.ts
-- - Databáze je konzistentní s formuláři
