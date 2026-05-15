-- FILE: supabase/migrations/102_seed_evidence_sheets.sql
-- PURPOSE: Test data pro Evidence Sheets (volitelné)
-- DATE: 2026-02-12
-- USAGE: Spustit až po migraci 099

-- ==========================================================================
-- TEST DATA - Seed Evidence Sheets pro existující kontrakty
-- ==========================================================================

DO $$
DECLARE
  v_contract_id UUID;
  v_sheet_id UUID;
  v_user_id UUID;
BEGIN
  -- Vzít první testovací kontrakt
  SELECT id INTO v_contract_id 
  FROM public.contracts 
  WHERE is_archived = FALSE 
  LIMIT 1;

  IF v_contract_id IS NULL THEN
    RAISE NOTICE 'Žádný kontrakt nenalezen - přeskakuji seed';
    RETURN;
  END IF;

  RAISE NOTICE 'Vytvářím test Evidence Sheet pro kontrakt %', v_contract_id;

  -- Evidence Sheet #1
  INSERT INTO public.contract_evidence_sheets (
    contract_id,
    sheet_number,
    valid_from,
    valid_to,
    rent_amount,
    total_persons,
    services_total,
    total_amount,
    description,
    notes
  ) VALUES (
    v_contract_id,
    1,
    '2026-02-01'::DATE,
    '2026-02-28'::DATE,
    12000.00,
    1,
    2000.00,
    14000.00,
    'Evidenční list č. 1 - Únor 2026',
    'Test data'
  ) RETURNING id INTO v_sheet_id;

  RAISE NOTICE '✓ Evidence Sheet %', v_sheet_id;

  -- Přidej test uživatele (spolubydlící)
  INSERT INTO public.contract_evidence_sheet_users (
    sheet_id,
    first_name,
    last_name,
    birth_date,
    note
  ) VALUES (
    v_sheet_id,
    'Jan',
    'Novák',
    '1990-05-15'::DATE,
    'Spolubydlící'
  );

  RAISE NOTICE '✓ Přidán test uživatel';

  -- Přidej test služby
  INSERT INTO public.contract_evidence_sheet_services (
    sheet_id,
    service_name,
    unit_type,
    unit_price,
    quantity,
    total_amount,
    order_index
  ) VALUES
  (v_sheet_id, 'Vytápění', 'flat', 1000.00, 1, 1000.00, 1),
  (v_sheet_id, 'Voda', 'person', 500.00, 1, 500.00, 2);

  RAISE NOTICE '✓ Přidány test služby';

  COMMIT;
  RAISE NOTICE '✅ Seed data vytvořena úspěšně!';

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Chyba při vytváření seed dat: %', SQLERRM;
END $$;

-- ==========================================================================
-- COMPLETION MESSAGE
-- ==========================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 102 complete: evidence sheets test data (optional).';
END $$;
