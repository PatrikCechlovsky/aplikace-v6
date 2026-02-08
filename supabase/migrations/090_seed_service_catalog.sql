-- FILE: supabase/migrations/090_seed_service_catalog.sql
-- PURPOSE: Seed základního katalogu služeb
-- DATE: 2026-02-08
-- NOTES: Mapuje kódy na generic_types (service_types, service_billing_types, service_units, vat_rates)

-- ============================================================================
-- SEED DATA
-- ============================================================================

INSERT INTO public.service_catalog (
  code,
  name,
  category_id,
  billing_type_id,
  unit_id,
  vat_rate_id,
  base_price,
  active,
  note
)
SELECT
  v.code,
  v.name,
  cat.id AS category_id,
  bill.id AS billing_type_id,
  unit.id AS unit_id,
  vat.id AS vat_rate_id,
  v.base_price,
  v.active,
  v.note
FROM (
  VALUES
    ('teplo', 'Teplo', 'energie', 'merena_spotreba', 'czk_kwh', 'vat_12', NULL, TRUE, NULL),
    ('teplo_tuv', 'Teplo TUV', 'energie', 'merena_spotreba', 'czk_kwh', 'vat_12', NULL, TRUE, NULL),
    ('elektrina', 'Elektřina', 'energie', 'merena_spotreba', 'czk_kwh', 'vat_21', NULL, TRUE, NULL),
    ('plyn', 'Plyn', 'energie', 'merena_spotreba', 'czk_m3', 'vat_21', NULL, TRUE, NULL),
    ('voda_studena', 'Studená voda', 'voda', 'merena_spotreba', 'czk_m3', 'vat_12', NULL, TRUE, NULL),
    ('voda_tepla', 'Teplá voda', 'voda', 'merena_spotreba', 'czk_m3', 'vat_12', NULL, TRUE, NULL),
    ('stocne', 'Stočné', 'voda', 'merena_spotreba', 'czk_m3', 'vat_12', NULL, TRUE, NULL),
    ('sprava_domu', 'Správa domu', 'spravni_poplatky', 'pevna_sazba', 'czk_mesic', 'vat_21', NULL, TRUE, NULL),
    ('pojisteni', 'Pojištění nemovitosti', 'spravni_poplatky', 'pevna_sazba', 'czk_rok', 'vat_21', NULL, TRUE, NULL),
    ('svj', 'SVJ poplatek', 'spravni_poplatky', 'pevna_sazba', 'czk_mesic', 'vat_0', NULL, TRUE, NULL),
    ('odvoz_odpadu', 'Odvoz odpadu', 'doplnkove_sluzby', 'na_pocet_osob', 'czk_osoba', 'vat_21', NULL, TRUE, NULL),
    ('uklid', 'Úklid společných prostor', 'doplnkove_sluzby', 'na_m2', 'czk_m2', 'vat_21', NULL, TRUE, NULL),
    ('internet', 'Internet', 'doplnkove_sluzby', 'pevna_sazba', 'czk_mesic', 'vat_21', NULL, TRUE, NULL),
    ('najemne', 'Nájemné', 'najemne', 'pevna_sazba', 'czk_mesic', 'vat_0', NULL, TRUE, NULL),
    ('fond_oprav', 'Fond oprav', 'jine_sluzby', 'pevna_sazba', 'czk_mesic', 'vat_0', NULL, TRUE, 'nerozúčtovatelné'),
    ('revize_kominu', 'Revize komínu', 'jine_sluzby', 'pevna_sazba', 'czk_rok', 'vat_21', NULL, TRUE, 'periodicita 2–5 let')
) AS v(code, name, category_code, billing_code, unit_code, vat_code, base_price, active, note)
JOIN public.generic_types cat ON cat.category = 'service_types' AND cat.code = v.category_code
JOIN public.generic_types bill ON bill.category = 'service_billing_types' AND bill.code = v.billing_code
JOIN public.generic_types unit ON unit.category = 'service_units' AND unit.code = v.unit_code
JOIN public.generic_types vat ON vat.category = 'vat_rates' AND vat.code = v.vat_code
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  billing_type_id = EXCLUDED.billing_type_id,
  unit_id = EXCLUDED.unit_id,
  vat_rate_id = EXCLUDED.vat_rate_id,
  base_price = EXCLUDED.base_price,
  active = EXCLUDED.active,
  note = EXCLUDED.note,
  updated_at = NOW();

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 090 complete: service_catalog seeded';
END $$;
