-- FILE: supabase/migrations/106_add_valid_dates_to_services.sql
-- PURPOSE: Přidat valid_from a valid_to sloupce do všech tabulek služeb (property, unit, evidence sheet)
-- DATE: 2026-02-15
-- NOTES: Umožňuje plánovat platnost služby a ceny v různých obdobích

-- ==========================================================================
-- 1) ALTER TABLE: property_services
-- ==========================================================================

ALTER TABLE public.property_services
ADD COLUMN IF NOT EXISTS valid_from DATE,
ADD COLUMN IF NOT EXISTS valid_to DATE;

COMMENT ON COLUMN public.property_services.valid_from IS 'Datum, od kterého je služba platná';
COMMENT ON COLUMN public.property_services.valid_to IS 'Datum, do kterého je služba platná (včetně)';

-- Vytvořit index pro efektivní filtrování podle období
CREATE INDEX IF NOT EXISTS idx_property_services_valid_dates
  ON public.property_services(property_id, valid_from, valid_to)
  WHERE is_archived = FALSE;

-- ==========================================================================
-- 2) ALTER TABLE: unit_services
-- ==========================================================================

ALTER TABLE public.unit_services
ADD COLUMN IF NOT EXISTS valid_from DATE,
ADD COLUMN IF NOT EXISTS valid_to DATE;

COMMENT ON COLUMN public.unit_services.valid_from IS 'Datum, od kterého je služba platná';
COMMENT ON COLUMN public.unit_services.valid_to IS 'Datum, do kterého je služba platná (včetně)';

-- Vytvořit index pro efektivní filtrování podle období
CREATE INDEX IF NOT EXISTS idx_unit_services_valid_dates
  ON public.unit_services(unit_id, valid_from, valid_to)
  WHERE is_archived = FALSE;

-- ==========================================================================
-- 3) ALTER TABLE: contract_evidence_sheet_services
-- ==========================================================================

ALTER TABLE public.contract_evidence_sheet_services
ADD COLUMN IF NOT EXISTS valid_from DATE,
ADD COLUMN IF NOT EXISTS valid_to DATE;

COMMENT ON COLUMN public.contract_evidence_sheet_services.valid_from IS 'Datum, od kterého je služba platná (nataženou z detailu EL)';
COMMENT ON COLUMN public.contract_evidence_sheet_services.valid_to IS 'Datum, do kterého je služba platná (nataženou z detailu EL)';

-- Vytvořit index pro efektivní filtrování podle období
CREATE INDEX IF NOT EXISTS idx_contract_evidence_sheet_services_valid_dates
  ON public.contract_evidence_sheet_services(sheet_id, valid_from, valid_to)
  WHERE is_archived = FALSE;

-- ==========================================================================
-- 4) UPDATE VIEW: v_property_services_list (pokud existuje)
-- ==========================================================================

-- Pokud je view již definován, je nutné jej znovu vytvořit s novými sloupci
-- (to provádí migrační skript po dobu evoluce aplikace)
-- Na tomto místě není nutné cokoliv měnit, neboť view přidá sloupce automaticky

-- ==========================================================================
-- 5) UPDATE VIEW: v_unit_services_list
-- ==========================================================================

-- Stejně jako u property_services - view bude zahrnovat nové sloupce automaticky
