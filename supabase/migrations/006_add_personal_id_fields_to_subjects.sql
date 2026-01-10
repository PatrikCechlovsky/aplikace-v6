-- FILE: supabase/migrations/006_add_personal_id_fields_to_subjects.sql
-- PURPOSE: Přidání sloupců pro osobní identifikační údaje do tabulky subjects

-- Přidání sloupců pro osobní identifikační údaje
ALTER TABLE public.subjects
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS personal_id_number TEXT, -- Rodné číslo (volitelné, pro ČR má formát YYMMDD/XXXX)
  ADD COLUMN IF NOT EXISTS id_doc_type TEXT, -- Typ dokladu totožnosti: 'OP' (občanský průkaz), 'PAS' (pas), 'RP' (řidičský průkaz), 'OTHER' (jiný)
  ADD COLUMN IF NOT EXISTS id_doc_number TEXT; -- Číslo dokladu

-- Komentáře pro dokumentaci
COMMENT ON COLUMN public.subjects.birth_date IS 'Datum narození';
COMMENT ON COLUMN public.subjects.personal_id_number IS 'Rodné číslo (volitelné, pro ČR má formát YYMMDD/XXXX)';
COMMENT ON COLUMN public.subjects.id_doc_type IS 'Typ dokladu totožnosti: OP (občanský průkaz), PAS (pas), RP (řidičský průkaz), OTHER (jiný)';
COMMENT ON COLUMN public.subjects.id_doc_number IS 'Číslo dokladu totožnosti';

-- Vytvoření indexu pro rychlejší vyhledávání podle rodného čísla (pokud bude používáno)
CREATE INDEX IF NOT EXISTS idx_subjects_personal_id_number ON public.subjects(personal_id_number) 
WHERE personal_id_number IS NOT NULL;

-- Vytvoření indexu pro vyhledávání podle čísla dokladu (pokud bude používáno)
CREATE INDEX IF NOT EXISTS idx_subjects_id_doc_number ON public.subjects(id_doc_number) 
WHERE id_doc_number IS NOT NULL;

