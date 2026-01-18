-- FILE: supabase/migrations/007_create_subject_delegates.sql
-- PURPOSE: Vytvoření tabulky pro N:N vztah mezi pronajímateli a jejich zástupci

-- Vytvoření tabulky subject_delegates (N:N vztah mezi pronajímateli a zástupci)
CREATE TABLE IF NOT EXISTS public.subject_delegates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  delegate_subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ,
  updated_by UUID REFERENCES auth.users(id),
  
  -- UNIQUE constraint - jeden zástupce může být přiřazen jednou k jednomu pronajímateli
  CONSTRAINT subject_delegates_unique UNIQUE (subject_id, delegate_subject_id),
  
  -- Zabránit self-reference (pronajímatel nemůže být svůj vlastní zástupce)
  CONSTRAINT subject_delegates_no_self_reference CHECK (subject_id != delegate_subject_id)
);

-- Komentáře pro dokumentaci
COMMENT ON TABLE public.subject_delegates IS 'N:N vztah mezi pronajímateli a jejich zástupci. Zástupce může být typ "zastupce" ze seznamu pronajímatelů, nebo osoba ze seznamu uživatelů s rolí pronajímatel/manager/správce.';
COMMENT ON COLUMN public.subject_delegates.subject_id IS 'FK na subjects.id - pronajímatel (firma, spolek, statni)';
COMMENT ON COLUMN public.subject_delegates.delegate_subject_id IS 'FK na subjects.id - zástupce (typ "zastupce" nebo osoba s rolí pronajímatel/manager/správce)';

-- Indexy pro rychlejší dotazy
CREATE INDEX IF NOT EXISTS idx_subject_delegates_subject_id ON public.subject_delegates(subject_id);
CREATE INDEX IF NOT EXISTS idx_subject_delegates_delegate_subject_id ON public.subject_delegates(delegate_subject_id);

-- RLS (Row Level Security)
ALTER TABLE public.subject_delegates ENABLE ROW LEVEL SECURITY;

-- Politika pro SELECT - uživatel vidí zástupce pro pronajímatele, které může vidět
CREATE POLICY "Users can view delegates for subjects they can view"
  ON public.subject_delegates
  FOR SELECT
  USING (
    -- Zatím povolíme všem (bude upraveno podle RLS na subjects tabulce)
    true
  );

-- Politika pro INSERT - uživatel může přidat zástupce k pronajímateli, který může editovat
CREATE POLICY "Users can insert delegates for subjects they can edit"
  ON public.subject_delegates
  FOR INSERT
  WITH CHECK (
    -- Zatím povolíme všem (bude upraveno podle RLS na subjects tabulce)
    true
  );

-- Politika pro UPDATE - uživatel může upravit zástupce pro pronajímateli, který může editovat
CREATE POLICY "Users can update delegates for subjects they can edit"
  ON public.subject_delegates
  FOR UPDATE
  USING (
    -- Zatím povolíme všem (bude upraveno podle RLS na subjects tabulce)
    true
  );

-- Politika pro DELETE - uživatel může smazat zástupce pro pronajímateli, který může editovat
CREATE POLICY "Users can delete delegates for subjects they can edit"
  ON public.subject_delegates
  FOR DELETE
  USING (
    -- Zatím povolíme všem (bude upraveno podle RLS na subjects tabulce)
    true
  );

