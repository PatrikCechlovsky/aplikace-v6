-- FILE: data/tenant_users_import_work.sql
-- PURPOSE: Import spolubydlících z tenant_users_import_work.csv
-- NOTES:
-- - Předpokládá, že smlouvy a evidenční listy jsou již nahrané.
-- - KROK 1: Vloží záznamy do public.tenant_users (jen pro osoby se známým datem narození).
-- - KROK 2: Propojí spolubydlící s nejnovějším evidenčním listem (contract_evidence_sheet_users).
-- - Diadykovi (3 osoby) nemají datum narození – vloží se jen do evidenčního listu bez FK na tenant_users.
-- - Idempotentní: tenant_users se nevkládají znovu pokud už existují, sheet_users se nejdřív smažou a znovu vloží.

BEGIN;

-- ==========================================================================
-- KROK 1: Vložení do tenant_users (jen záznamy se známým datem narození)
-- ==========================================================================
WITH src AS (
  SELECT *
  FROM (VALUES
    ('Pavel Olša',      'Monika',  'Olšová',    '1979-05-01', 'RČ: 795501/2681 | Příloha ke smlouvě ze dne 20.12.2025'),
    ('Erika Sýkorová',  'Aneta',   'Kustová',   '2007-11-23', 'RČ: 076123/5717 | Příloha ke smlouvě ze dne 30.12.2025'),
    ('Lucie Kotlárová', 'Jan',     'Mičuch',    '2016-11-30', 'RČ: 161130/1681 | Příloha ke smlouvě o ubytování v apartmánu č. 2 | účinnost 10.11.2025'),
    ('Lucie Kotlárová', 'Andrea',  'Kotlárová', '2007-10-16', 'RČ: 076016/5703 | Příloha ke smlouvě o ubytování v apartmánu č. 2 | účinnost 10.11.2025'),
    ('Lucie Kotlárová', 'Ketrin',  'Kudračová', '2010-03-29', 'RČ: 105329/5705 | Příloha ke smlouvě o ubytování v apartmánu č. 2 | účinnost 10.11.2025'),
    ('Lucie Kotlárová', 'Jan',     'Mičuch',    '1991-11-09', 'RČ: 911109/2826 | Příloha ke smlouvě o ubytování v apartmánu č. 2 | účinnost 10.11.2025')
  ) AS t(tenant_name, first_name, last_name, birth_date, note)
),
tenant_subjects AS (
  SELECT s.id AS subject_id, s.display_name
  FROM public.subjects s
  WHERE s.display_name ILIKE ANY(ARRAY['Pavel Olša', 'Erika Sýkorová', 'Lucie Kotlárová'])
    AND NOT s.is_archived
),
src_resolved AS (
  SELECT
    ts.subject_id,
    s.first_name,
    s.last_name,
    s.birth_date::date AS birth_date,
    s.note
  FROM src s
  JOIN tenant_subjects ts ON ts.display_name ILIKE s.tenant_name
),
inserted AS (
  INSERT INTO public.tenant_users (tenant_id, first_name, last_name, birth_date, note, is_archived)
  SELECT subject_id, first_name, last_name, birth_date, note, FALSE
  FROM src_resolved sr
  WHERE NOT EXISTS (
    SELECT 1 FROM public.tenant_users tu
    WHERE tu.tenant_id = sr.subject_id
      AND tu.first_name = sr.first_name
      AND tu.last_name = sr.last_name
      AND tu.birth_date = sr.birth_date
  )
  RETURNING id
)
SELECT 'TENANT_USERS_INSERTED' AS status, COUNT(*)::text AS count_or_name, NULL::text AS detail
FROM inserted;

-- ==========================================================================
-- KROK 2: Propojení spolubydlících s evidenčními listy
-- ==========================================================================
WITH src AS (
  SELECT *
  FROM (VALUES
    ('Pavel Olša',      'Monika',  'Olšová',    DATE '1979-05-01', 'RČ: 795501/2681 | Příloha ke smlouvě ze dne 20.12.2025'),
    ('Erika Sýkorová',  'Aneta',   'Kustová',   DATE '2007-11-23', 'RČ: 076123/5717 | Příloha ke smlouvě ze dne 30.12.2025'),
    ('Lucie Kotlárová', 'Jan',     'Mičuch',    DATE '2016-11-30', 'RČ: 161130/1681 | Příloha ke smlouvě o ubytování v apartmánu č. 2 | účinnost 10.11.2025'),
    ('Lucie Kotlárová', 'Andrea',  'Kotlárová', DATE '2007-10-16', 'RČ: 076016/5703 | Příloha ke smlouvě o ubytování v apartmánu č. 2 | účinnost 10.11.2025'),
    ('Lucie Kotlárová', 'Ketrin',  'Kudračová', DATE '2010-03-29', 'RČ: 105329/5705 | Příloha ke smlouvě o ubytování v apartmánu č. 2 | účinnost 10.11.2025'),
    ('Lucie Kotlárová', 'Jan',     'Mičuch',    DATE '1991-11-09', 'RČ: 911109/2826 | Příloha ke smlouvě o ubytování v apartmánu č. 2 | účinnost 10.11.2025'),
    -- Diadykovi – bez data narození (pouze doklad totožnosti)
    ('Oleksandr Diadyk', 'Maryna', 'Diadyk',    NULL::date,        'Doklad: EX758715 | Osoby spolubydlící z přílohy smlouvy apartmán č. 4 ze dne 20.05.2025'),
    ('Oleksandr Diadyk', 'Daria',  'Diadyk',    NULL::date,        'Doklad: 004154828 | Osoby spolubydlící z přílohy smlouvy apartmán č. 4 ze dne 20.05.2025'),
    ('Oleksandr Diadyk', 'Kira',   'Diadyk',    NULL::date,        'Doklad: FZ241100 | Osoby spolubydlící z přílohy smlouvy apartmán č. 4 ze dne 20.05.2025')
  ) AS t(tenant_name, first_name, last_name, birth_date, note)
),
tenant_subjects AS (
  SELECT s.id AS subject_id, s.display_name
  FROM public.subjects s
  WHERE s.display_name ILIKE ANY(ARRAY[
    'Pavel Olša', 'Erika Sýkorová', 'Lucie Kotlárová', 'Oleksandr Diadyk'
  ])
    AND NOT s.is_archived
),
latest_sheets AS (
  -- Nejnovější evidenční list na každou smlouvu každého nájemce
  SELECT DISTINCT ON (c.tenant_id)
    c.tenant_id,
    ces.id AS sheet_id
  FROM public.contracts c
  JOIN public.contract_evidence_sheets ces ON ces.contract_id = c.id
  WHERE NOT ces.is_archived
  ORDER BY c.tenant_id, ces.sheet_number DESC
),
src_resolved AS (
  SELECT
    s.first_name,
    s.last_name,
    s.birth_date,
    s.note,
    s.tenant_name,
    ts.subject_id,
    ls.sheet_id,
    tu.id AS tenant_user_id
  FROM src s
  LEFT JOIN tenant_subjects ts ON ts.display_name ILIKE s.tenant_name
  LEFT JOIN latest_sheets ls ON ls.tenant_id = ts.subject_id
  LEFT JOIN public.tenant_users tu
    ON tu.tenant_id = ts.subject_id
    AND tu.first_name = s.first_name
    AND tu.last_name = s.last_name
    AND tu.birth_date = s.birth_date
),
deleted_users AS (
  DELETE FROM public.contract_evidence_sheet_users ceu
  USING (
    SELECT DISTINCT sheet_id FROM src_resolved WHERE sheet_id IS NOT NULL
  ) target_sheets
  WHERE ceu.sheet_id = target_sheets.sheet_id
  RETURNING ceu.id
),
inserted AS (
  INSERT INTO public.contract_evidence_sheet_users (
    sheet_id,
    tenant_user_id,
    first_name,
    last_name,
    birth_date,
    note,
    is_archived
  )
  SELECT
    sheet_id,
    tenant_user_id,
    first_name,
    last_name,
    birth_date,
    note,
    FALSE
  FROM src_resolved
  WHERE sheet_id IS NOT NULL
    AND (SELECT COUNT(*) FROM deleted_users) >= 0  -- zajistí provedení deleted_users
  RETURNING id
)
SELECT 'SHEET_USERS_DELETED'  AS status, COUNT(*)::text AS count_or_name, NULL::text AS detail FROM deleted_users
UNION ALL
SELECT 'SHEET_USERS_INSERTED', COUNT(*)::text, NULL::text FROM inserted
UNION ALL
SELECT
  'UNRESOLVED_TENANT',
  sr.tenant_name,
  CASE
    WHEN sr.subject_id IS NULL THEN 'nenalezen subject'
    WHEN sr.sheet_id IS NULL   THEN 'nenalezen evidenční list'
    ELSE 'OK'
  END
FROM src_resolved sr
WHERE sr.subject_id IS NULL OR sr.sheet_id IS NULL
GROUP BY sr.tenant_name, sr.subject_id, sr.sheet_id;

COMMIT;
