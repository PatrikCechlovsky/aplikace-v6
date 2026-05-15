-- FILE: supabase/migrations/112_sync_evidence_service_dates_with_sheet.sql
-- PURPOSE: Vynutit, aby služby evidenčního listu vždy dědily valid_from/valid_to z hlavičky evidenčního listu
-- DATE: 2026-03-22
-- NOTES:
-- - Zabraňuje ručnímu rozjetí dat mezi hlavičkou EL a jednotlivými službami.
-- - Při změně data na EL se data automaticky propíší do všech služeb EL.

-- ============================================================================
-- 1) BEFORE trigger na služby: vždy nastav valid_from/valid_to podle parent sheet
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_evidence_service_valid_dates_from_sheet()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_valid_from DATE;
  v_valid_to DATE;
BEGIN
  SELECT es.valid_from, es.valid_to
    INTO v_valid_from, v_valid_to
  FROM public.contract_evidence_sheets es
  WHERE es.id = NEW.sheet_id;

  NEW.valid_from := v_valid_from;
  NEW.valid_to := v_valid_to;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_evidence_service_valid_dates_from_sheet
  ON public.contract_evidence_sheet_services;

CREATE TRIGGER trg_set_evidence_service_valid_dates_from_sheet
  BEFORE INSERT OR UPDATE OF sheet_id, valid_from, valid_to
  ON public.contract_evidence_sheet_services
  FOR EACH ROW
  EXECUTE FUNCTION public.set_evidence_service_valid_dates_from_sheet();

-- ============================================================================
-- 2) AFTER trigger na hlavičku EL: při změně data přepiš data všech služeb
-- ============================================================================

CREATE OR REPLACE FUNCTION public.propagate_evidence_sheet_dates_to_services()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.valid_from IS DISTINCT FROM OLD.valid_from
     OR NEW.valid_to IS DISTINCT FROM OLD.valid_to THEN
    UPDATE public.contract_evidence_sheet_services s
       SET valid_from = NEW.valid_from,
           valid_to = NEW.valid_to,
           updated_at = NOW()
     WHERE s.sheet_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_propagate_evidence_sheet_dates_to_services
  ON public.contract_evidence_sheets;

CREATE TRIGGER trg_propagate_evidence_sheet_dates_to_services
  AFTER UPDATE OF valid_from, valid_to
  ON public.contract_evidence_sheets
  FOR EACH ROW
  EXECUTE FUNCTION public.propagate_evidence_sheet_dates_to_services();

-- ============================================================================
-- 3) Backfill existujících dat
-- ============================================================================

UPDATE public.contract_evidence_sheet_services s
   SET valid_from = es.valid_from,
       valid_to = es.valid_to,
       updated_at = NOW()
  FROM public.contract_evidence_sheets es
 WHERE es.id = s.sheet_id
   AND (
     s.valid_from IS DISTINCT FROM es.valid_from
     OR s.valid_to IS DISTINCT FROM es.valid_to
   );
