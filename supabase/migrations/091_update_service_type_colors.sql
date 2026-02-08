-- FILE: supabase/migrations/091_update_service_type_colors.sql
-- PURPOSE: Nastavit barvy pro kategorie služeb a typy účtování
-- DATE: 2026-02-08
-- NOTES: Používá generic_types (service_types, service_billing_types)

-- ============================================================================
-- SERVICE TYPES COLORS
-- ============================================================================

UPDATE public.generic_types SET color = '#2563EB' WHERE category = 'service_types' AND code = 'energie';
UPDATE public.generic_types SET color = '#0EA5E9' WHERE category = 'service_types' AND code = 'voda';
UPDATE public.generic_types SET color = '#7C3AED' WHERE category = 'service_types' AND code = 'spravni_poplatky';
UPDATE public.generic_types SET color = '#16A34A' WHERE category = 'service_types' AND code = 'doplnkove_sluzby';
UPDATE public.generic_types SET color = '#F59E0B' WHERE category = 'service_types' AND code = 'najemne';
UPDATE public.generic_types SET color = '#6B7280' WHERE category = 'service_types' AND code = 'jine_sluzby';

-- ============================================================================
-- SERVICE BILLING TYPES COLORS
-- ============================================================================

UPDATE public.generic_types SET color = '#0F766E' WHERE category = 'service_billing_types' AND code = 'pevna_sazba';
UPDATE public.generic_types SET color = '#DC2626' WHERE category = 'service_billing_types' AND code = 'merena_spotreba';
UPDATE public.generic_types SET color = '#9333EA' WHERE category = 'service_billing_types' AND code = 'na_pocet_osob';
UPDATE public.generic_types SET color = '#0284C7' WHERE category = 'service_billing_types' AND code = 'na_m2';
UPDATE public.generic_types SET color = '#EA580C' WHERE category = 'service_billing_types' AND code = 'procento_z_najmu';
UPDATE public.generic_types SET color = '#059669' WHERE category = 'service_billing_types' AND code = 'pomer_plochy';

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 091 complete: service type colors updated';
END $$;
