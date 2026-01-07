-- FILE: supabase/migrations/005_add_address_to_subjects.sql
-- PURPOSE: Přidání sloupců pro adresu do tabulky subjects

-- Přidání sloupců pro adresu
ALTER TABLE public.subjects
  ADD COLUMN IF NOT EXISTS street TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS zip TEXT,
  ADD COLUMN IF NOT EXISTS house_number TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'CZ';

-- Komentáře pro dokumentaci
COMMENT ON COLUMN public.subjects.street IS 'Název ulice';
COMMENT ON COLUMN public.subjects.city IS 'Název města/obce';
COMMENT ON COLUMN public.subjects.zip IS 'PSČ';
COMMENT ON COLUMN public.subjects.house_number IS 'Číslo popisné/orientační';
COMMENT ON COLUMN public.subjects.country IS 'Kód státu (ISO 3166-1 alpha-2, např. CZ, SK)';

