-- Migration: Přidání příznaků zástupců a údržby do tabulky subjects
-- Date: 2026-02-09
-- Purpose: Umožnit rolím zástupců a údržby na subjektu (zobrazení v modulu Subjekty)

ALTER TABLE public.subjects
  ADD COLUMN IF NOT EXISTS is_landlord_delegate boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_tenant_delegate boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_maintenance boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_maintenance_delegate boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_subjects_is_landlord_delegate ON public.subjects(is_landlord_delegate) WHERE is_landlord_delegate = true;
CREATE INDEX IF NOT EXISTS idx_subjects_is_tenant_delegate ON public.subjects(is_tenant_delegate) WHERE is_tenant_delegate = true;
CREATE INDEX IF NOT EXISTS idx_subjects_is_maintenance ON public.subjects(is_maintenance) WHERE is_maintenance = true;
CREATE INDEX IF NOT EXISTS idx_subjects_is_maintenance_delegate ON public.subjects(is_maintenance_delegate) WHERE is_maintenance_delegate = true;

COMMENT ON COLUMN public.subjects.is_landlord_delegate IS 'Příznak zda je subjekt zástupce pronajimatele';
COMMENT ON COLUMN public.subjects.is_tenant_delegate IS 'Příznak zda je subjekt zástupce nájemníka';
COMMENT ON COLUMN public.subjects.is_maintenance IS 'Příznak zda je subjekt údržba';
COMMENT ON COLUMN public.subjects.is_maintenance_delegate IS 'Příznak zda je subjekt zástupce údržby';
