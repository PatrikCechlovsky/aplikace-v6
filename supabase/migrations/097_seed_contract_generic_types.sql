-- FILE: supabase/migrations/097_seed_contract_generic_types.sql
-- PURPOSE: Přidání kategorií pro smlouvy + seed základních hodnot
-- DATE: 2026-02-09

-- ==========================================================================
-- STEP 1: Update category constraint to include contract_* a handover_protocol_*
-- ==========================================================================

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
  'service_periodicities',
  'contract_types',
  'contract_statuses',
  'handover_protocol_types',
  'handover_protocol_statuses'
));

COMMENT ON CONSTRAINT generic_types_category_check ON public.generic_types IS
'Povolené kategorie: subject_types, property_types, unit_types, equipment_types, unit_dispositions, room_types, equipment_states, service_types, service_billing_types, vat_rates, service_units, service_periodicities, contract_types, contract_statuses, handover_protocol_types, handover_protocol_statuses';

-- ==========================================================================
-- STEP 2: Seed contract_types
-- ==========================================================================

INSERT INTO public.generic_types (id, category, code, name, description, order_index, active) VALUES
(gen_random_uuid(), 'contract_types', 'najem', 'Nájemní smlouva', 'Standardní nájem', 10, true),
(gen_random_uuid(), 'contract_types', 'podnajem', 'Podnájemní smlouva', 'Podnájem', 20, true),
(gen_random_uuid(), 'contract_types', 'kratkodoby', 'Krátkodobý pronájem', 'Krátkodobé ubytování', 30, true)
ON CONFLICT (category, code) DO NOTHING;

-- ==========================================================================
-- STEP 3: Seed contract_statuses
-- ==========================================================================

INSERT INTO public.generic_types (id, category, code, name, description, order_index, active) VALUES
(gen_random_uuid(), 'contract_statuses', 'koncept', 'Koncept', 'Rozpracovaná smlouva', 10, true),
(gen_random_uuid(), 'contract_statuses', 'aktivni', 'Aktivní', 'Platná smlouva', 20, true),
(gen_random_uuid(), 'contract_statuses', 'ukoncena', 'Ukončená', 'Smlouva byla ukončena', 30, true),
(gen_random_uuid(), 'contract_statuses', 'archivovana', 'Archivovaná', 'Archivní smlouva', 40, true)
ON CONFLICT (category, code) DO NOTHING;

-- ==========================================================================
-- STEP 4: Seed handover_protocol_types
-- ==========================================================================

INSERT INTO public.generic_types (id, category, code, name, description, order_index, active) VALUES
(gen_random_uuid(), 'handover_protocol_types', 'predani', 'Předání', 'Předávací protokol', 10, true),
(gen_random_uuid(), 'handover_protocol_types', 'prevzeti', 'Převzetí', 'Převzetí jednotky', 20, true),
(gen_random_uuid(), 'handover_protocol_types', 'ukonceni', 'Ukončení nájmu', 'Předání při ukončení', 30, true)
ON CONFLICT (category, code) DO NOTHING;

-- ==========================================================================
-- STEP 5: Seed handover_protocol_statuses
-- ==========================================================================

INSERT INTO public.generic_types (id, category, code, name, description, order_index, active) VALUES
(gen_random_uuid(), 'handover_protocol_statuses', 'koncept', 'Koncept', 'Rozpracovaný protokol', 10, true),
(gen_random_uuid(), 'handover_protocol_statuses', 'podepsany', 'Podepsaný', 'Protokol je podepsán', 20, true),
(gen_random_uuid(), 'handover_protocol_statuses', 'archivovany', 'Archivovaný', 'Archivní protokol', 30, true)
ON CONFLICT (category, code) DO NOTHING;

-- ==========================================================================
-- COMPLETION MESSAGE
-- ==========================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 097 complete: contract + handover generic types seeded.';
END $$;
