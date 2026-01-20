-- FILE: supabase/migrations/069_create_ui_view_prefs.sql
-- PURPOSE: Vytvoření tabulky pro uložení UI preferences uživatelů (sloupce v tabulkách, filtry, atd.)
-- DATE: 2026-01-20

-- ============================================================================
-- 1) Tabulka ui_view_prefs
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ui_view_prefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  view_key text NOT NULL,
  prefs jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Unique constraint pro user_id + view_key (jeden záznam per user per view)
  CONSTRAINT ui_view_prefs_user_view_unique UNIQUE (user_id, view_key)
);

-- Index pro rychlé vyhledávání podle user_id a view_key
CREATE INDEX IF NOT EXISTS idx_ui_view_prefs_user_view 
  ON public.ui_view_prefs(user_id, view_key);

-- ============================================================================
-- 2) RLS políčky
-- ============================================================================

ALTER TABLE public.ui_view_prefs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read their own view preferences" ON public.ui_view_prefs;
DROP POLICY IF EXISTS "Users can insert their own view preferences" ON public.ui_view_prefs;
DROP POLICY IF EXISTS "Users can update their own view preferences" ON public.ui_view_prefs;
DROP POLICY IF EXISTS "Users can delete their own view preferences" ON public.ui_view_prefs;

-- Uživatel může číst pouze své vlastní preferences
CREATE POLICY "Users can read their own view preferences"
  ON public.ui_view_prefs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Uživatel může vložit nové preferences pouze pro sebe
CREATE POLICY "Users can insert their own view preferences"
  ON public.ui_view_prefs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Uživatel může updatovat pouze své vlastní preferences
CREATE POLICY "Users can update their own view preferences"
  ON public.ui_view_prefs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Uživatel může smazat pouze své vlastní preferences
CREATE POLICY "Users can delete their own view preferences"
  ON public.ui_view_prefs
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 3) Trigger pro updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ui_view_prefs_updated_at ON public.ui_view_prefs;
CREATE TRIGGER update_ui_view_prefs_updated_at
  BEFORE UPDATE ON public.ui_view_prefs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 4) Grant permissions
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ui_view_prefs TO authenticated;
GRANT SELECT ON public.ui_view_prefs TO anon;
