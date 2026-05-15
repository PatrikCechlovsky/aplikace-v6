-- FILE: supabase/migrations/087_add_service_generic_types.sql
-- PURPOSE: Přidání kategorií pro služby do generic_types + seed základních hodnot
-- DATE: 2026-02-08
-- NOTES: service_types, service_billing_types, vat_rates, service_units

-- ============================================================================
-- STEP 1: Update category constraint to include services categories
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
  'service_units'
));

COMMENT ON CONSTRAINT generic_types_category_check ON public.generic_types IS
'Povolené kategorie: subject_types, property_types, unit_types, equipment_types, unit_dispositions, room_types, equipment_states, service_types, service_billing_types, vat_rates, service_units';

-- ============================================================================
-- STEP 2: Seed service_types
-- ============================================================================

INSERT INTO public.generic_types (id, category, code, name, description, order_index, active) VALUES
(gen_random_uuid(), 'service_types', 'energie', 'Energie', 'Energie (teplo, elektřina, plyn, TUV)', 10, true),
(gen_random_uuid(), 'service_types', 'voda', 'Voda', 'Studená, teplá, stočné', 20, true),
(gen_random_uuid(), 'service_types', 'spravni_poplatky', 'Správní poplatky', 'Administrativa, pojištění, správa domu', 30, true),
(gen_random_uuid(), 'service_types', 'doplnkove_sluzby', 'Doplňkové služby', 'Odvoz odpadu, úklid, další služby', 40, true),
(gen_random_uuid(), 'service_types', 'najemne', 'Nájemné', 'Nájemné a související platby', 50, true),
(gen_random_uuid(), 'service_types', 'jine_sluzby', 'Jiné služby', 'Ostatní služby', 60, true)
ON CONFLICT (category, code) DO NOTHING;

-- ============================================================================
-- STEP 3: Seed service_billing_types
-- ============================================================================

INSERT INTO public.generic_types (id, category, code, name, description, order_index, active) VALUES
(gen_random_uuid(), 'service_billing_types', 'pevna_sazba', 'Pevná sazba', 'Fixní částka', 10, true),
(gen_random_uuid(), 'service_billing_types', 'merena_spotreba', 'Měřená spotřeba', 'Účtování podle měřidla', 20, true),
(gen_random_uuid(), 'service_billing_types', 'na_pocet_osob', 'Na počet osob', 'Rozúčtování podle počtu osob', 30, true),
(gen_random_uuid(), 'service_billing_types', 'na_m2', 'Na m²', 'Rozúčtování podle plochy', 40, true),
(gen_random_uuid(), 'service_billing_types', 'procento_z_najmu', 'Procento z nájmu', 'Procento z nájemného', 50, true),
(gen_random_uuid(), 'service_billing_types', 'pomer_plochy', 'Poměr plochy', 'Poměr k celkové ploše nemovitosti', 60, true)
ON CONFLICT (category, code) DO NOTHING;

-- ============================================================================
-- STEP 4: Seed vat_rates
-- ============================================================================

INSERT INTO public.generic_types (id, category, code, name, description, order_index, active) VALUES
(gen_random_uuid(), 'vat_rates', 'vat_0', '0 %', 'DPH 0 %', 10, true),
(gen_random_uuid(), 'vat_rates', 'vat_10', '10 %', 'DPH 10 %', 20, true),
(gen_random_uuid(), 'vat_rates', 'vat_12', '12 %', 'DPH 12 %', 30, true),
(gen_random_uuid(), 'vat_rates', 'vat_15', '15 %', 'DPH 15 %', 40, true),
(gen_random_uuid(), 'vat_rates', 'vat_21', '21 %', 'DPH 21 %', 50, true)
ON CONFLICT (category, code) DO NOTHING;

-- ============================================================================
-- STEP 5: Seed service_units
-- ============================================================================

INSERT INTO public.generic_types (id, category, code, name, description, order_index, active) VALUES
(gen_random_uuid(), 'service_units', 'czk', 'Kč', 'Česká koruna', 10, true),
(gen_random_uuid(), 'service_units', 'czk_mesic', 'Kč/měsíc', 'Kč za měsíc', 20, true),
(gen_random_uuid(), 'service_units', 'czk_ctvrtrok', 'Kč/čtvrtrok', 'Kč za čtvrtletí', 30, true),
(gen_random_uuid(), 'service_units', 'czk_pulrok', 'Kč/půlrok', 'Kč za půlrok', 40, true),
(gen_random_uuid(), 'service_units', 'czk_rok', 'Kč/rok', 'Kč za rok', 50, true),
(gen_random_uuid(), 'service_units', 'czk_m3', 'Kč/m³', 'Kč za metr krychlový', 60, true),
(gen_random_uuid(), 'service_units', 'czk_kwh', 'Kč/kWh', 'Kč za kilowatthodinu', 70, true),
(gen_random_uuid(), 'service_units', 'czk_m2', 'Kč/m²', 'Kč za metr čtvereční', 80, true),
(gen_random_uuid(), 'service_units', 'czk_osoba', 'Kč/osoba', 'Kč na osobu', 90, true),
(gen_random_uuid(), 'service_units', 'czk_ks', 'Kč/ks', 'Kč za kus', 100, true)
ON CONFLICT (category, code) DO NOTHING;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 087 complete: service_* generic types seeded.';
END $$;
