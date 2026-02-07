-- FILE: supabase/migrations/086_make_equipment_id_nullable.sql
-- PURPOSE: Umožnit přidání vybavení bez odkazu na katalog (vlastní vybavení)
-- DATE: 2026-02-04
-- NOTES: equipment_id může být NULL, ale pak musí být vyplněno name

-- ============================================================================
-- ALTER UNIT_EQUIPMENT TABLE
-- ============================================================================

ALTER TABLE public.unit_equipment
ALTER COLUMN equipment_id DROP NOT NULL;

-- CHECK constraint: buď equipment_id nebo name musí být vyplněno
ALTER TABLE public.unit_equipment
ADD CONSTRAINT unit_equipment_has_reference_or_name 
CHECK (equipment_id IS NOT NULL OR (name IS NOT NULL AND name != ''));

COMMENT ON CONSTRAINT unit_equipment_has_reference_or_name ON public.unit_equipment IS 
'Zajišťuje, že každé vybavení má buď odkaz na katalog (equipment_id) nebo vlastní název (name)';

-- ============================================================================
-- ALTER PROPERTY_EQUIPMENT TABLE
-- ============================================================================

ALTER TABLE public.property_equipment
ALTER COLUMN equipment_id DROP NOT NULL;

-- CHECK constraint: buď equipment_id nebo name musí být vyplněno
ALTER TABLE public.property_equipment
ADD CONSTRAINT property_equipment_has_reference_or_name 
CHECK (equipment_id IS NOT NULL OR (name IS NOT NULL AND name != ''));

COMMENT ON CONSTRAINT property_equipment_has_reference_or_name ON public.property_equipment IS 
'Zajišťuje, že každé vybavení má buď odkaz na katalog (equipment_id) nebo vlastní název (name)';

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 086 complete: equipment_id is now nullable';
  RAISE NOTICE '📍 Can add custom equipment without catalog reference';
  RAISE NOTICE '🔧 CHECK constraint ensures either equipment_id or name is present';
END $$;
