-- Migration: Update property_types icons to emoji
-- Date: 2026-01-18
-- Purpose: Oprava ikon typů nemovitostí - změna textových kódů na emoji

-- ============================================================================
-- UPDATE PROPERTY_TYPES ICONS
-- ============================================================================

-- Update icons to emoji according to module 900 settings
UPDATE public.property_types SET icon = '🏠' WHERE code = 'rodinny_dum';
UPDATE public.property_types SET icon = '🏢' WHERE code = 'bytovy_dum';
UPDATE public.property_types SET icon = '🏭' WHERE code = 'prumyslovy_objekt';
UPDATE public.property_types SET icon = '💼' WHERE code = 'admin_budova';
UPDATE public.property_types SET icon = '🟦' WHERE code = 'jiny_objekt';
UPDATE public.property_types SET icon = '🗺️' WHERE code = 'pozemek';
