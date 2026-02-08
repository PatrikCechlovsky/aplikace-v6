-- FILE: supabase/migrations/088_add_service_periodicities_generic_types.sql
-- PURPOSE: Přidání periodicit služeb do generic_types + seed hodnot
-- DATE: 2026-02-08
-- NOTES: Kategorie service_periodicities

-- ============================================================================
-- STEP 1: Update category constraint to include service_periodicities
-- ============================================================================

ALTER TABLE public.generic_types
DROP CONSTRAINT IF EXISTS generic_types_category_check;

ALTER TABLE public.generic_types
ADD CONSTRAINT generic_types_category_check CHECK (category IN (
  'subject_types',
  'property_types',
  'unit_types',
  'equipment_types',
  'unit_dispositions',
  'room_types',
  'equipment_states',
  'service_types',
  'service_billing_types',
  'vat_rates',
  'service_units',
  'service_periodicities'
));

COMMENT ON CONSTRAINT generic_types_category_check ON public.generic_types IS
'Povolené kategorie: subject_types, property_types, unit_types, equipment_types, unit_dispositions, room_types, equipment_states, service_types, service_billing_types, vat_rates, service_units, service_periodicities';

-- ============================================================================
-- STEP 2: Seed service_periodicities
-- ============================================================================

INSERT INTO public.generic_types (id, category, code, name, description, order_index, active) VALUES
(gen_random_uuid(), 'service_periodicities', 'mesicne', 'Měsíčně', 'Měsíční periodicita', 10, true),
(gen_random_uuid(), 'service_periodicities', 'ctvrtletne', 'Čtvrtletně', 'Čtvrtletní periodicita', 20, true),
(gen_random_uuid(), 'service_periodicities', 'pulrocne', 'Půlročně', 'Půlroční periodicita', 30, true),
(gen_random_uuid(), 'service_periodicities', 'rocne', 'Ročně', 'Roční periodicita', 40, true)
ON CONFLICT (category, code) DO NOTHING;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 088 complete: service_periodicities seeded.';
END $$;
