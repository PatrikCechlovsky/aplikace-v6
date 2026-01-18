-- Migration: Přidání příznaků rolí do tabulky subjects
-- Date: 2026-01-14
-- Purpose: Umožnit subjektu mít více rolí (pronajímatel, nájemník, uživatel, zástupce)
-- Note: Jeden subjekt může mít více příznaků nastavených na true

-- Přidat sloupce pro příznaky rolí
ALTER TABLE public.subjects
  ADD COLUMN IF NOT EXISTS is_landlord boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_tenant boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_user boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_delegate boolean DEFAULT false;

-- Přidat indexy pro rychlejší filtrování
CREATE INDEX IF NOT EXISTS idx_subjects_is_landlord ON public.subjects(is_landlord) WHERE is_landlord = true;
CREATE INDEX IF NOT EXISTS idx_subjects_is_tenant ON public.subjects(is_tenant) WHERE is_tenant = true;
CREATE INDEX IF NOT EXISTS idx_subjects_is_user ON public.subjects(is_user) WHERE is_user = true;
CREATE INDEX IF NOT EXISTS idx_subjects_is_delegate ON public.subjects(is_delegate) WHERE is_delegate = true;

-- Přidat komentáře pro dokumentaci
COMMENT ON COLUMN public.subjects.is_landlord IS 'Příznak zda je subjekt pronajímatel';
COMMENT ON COLUMN public.subjects.is_tenant IS 'Příznak zda je subjekt nájemník';
COMMENT ON COLUMN public.subjects.is_user IS 'Příznak zda je subjekt uživatel systému';
COMMENT ON COLUMN public.subjects.is_delegate IS 'Příznak zda je subjekt zástupce (jiného subjektu)';

-- Migrovat existující data podle subject_type
-- Poznámka: Toto je jednorázová migrace, poté se příznaky budou řídit samostatně
UPDATE public.subjects
SET is_user = true
WHERE subject_type = 'user' AND is_user = false;

UPDATE public.subjects
SET is_landlord = true
WHERE subject_type IN ('osoba', 'osvc', 'firma', 'spolek', 'statni') 
  AND is_landlord = false;

UPDATE public.subjects
SET is_delegate = true
WHERE subject_type = 'zastupce' AND is_delegate = false;

-- Přidat composite index pro kombinované dotazy
CREATE INDEX IF NOT EXISTS idx_subjects_roles_composite 
  ON public.subjects(is_landlord, is_tenant, is_user, is_delegate, is_archived);
