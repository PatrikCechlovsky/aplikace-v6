-- FILE: supabase/migrations/103_alter_contract_evidence_sheets_status.sql
-- PURPOSE: Dodatečná úprava evidenčních listů (status + valid_from nullable)
-- DATE: 2026-02-12

-- ==========================================================================
-- 1) Uvolnění valid_from (koncept může být bez data)
-- ==========================================================================

ALTER TABLE public.contract_evidence_sheets
  ALTER COLUMN valid_from DROP NOT NULL;

-- ==========================================================================
-- 2) Stav listu (draft | active | archived)
-- ==========================================================================

ALTER TABLE public.contract_evidence_sheets
  ADD COLUMN IF NOT EXISTS status TEXT;

UPDATE public.contract_evidence_sheets
SET status = CASE
  WHEN is_archived = TRUE THEN 'archived'
  WHEN valid_from IS NULL THEN 'draft'
  ELSE 'active'
END
WHERE status IS NULL;

ALTER TABLE public.contract_evidence_sheets
  ALTER COLUMN status SET DEFAULT 'draft',
  ALTER COLUMN status SET NOT NULL;

ALTER TABLE public.contract_evidence_sheets
  DROP CONSTRAINT IF EXISTS contract_evidence_sheets_status_check;

ALTER TABLE public.contract_evidence_sheets
  ADD CONSTRAINT contract_evidence_sheets_status_check
  CHECK (status IN ('draft', 'active', 'archived'));

COMMENT ON COLUMN public.contract_evidence_sheets.status IS 'draft|active|archived (stav listu)';

-- ==========================================================================
-- COMPLETION MESSAGE
-- ==========================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 103 complete: contract evidence sheets status + valid_from nullable.';
END $$;
