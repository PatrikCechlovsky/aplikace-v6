-- FILE: data/contracts_import_work.sql
-- PURPOSE: Import smluv z contracts_import_work.csv do public.contracts
-- NOTES:
-- - Importuje pouze první CSV (smlouvy).
-- - SQL je idempotentní přes ON CONFLICT(cislo_smlouvy).
-- - Řádek pro Lucii Gragovou (ČSA 514) zde záměrně není, protože v CSV stále chybí datum od/do.
-- - U Mánesovky se jednotka dohledává jako první jednotka dané nemovitosti, protože v CSV není vyplněný název jednotky.

BEGIN;

WITH src AS (
  SELECT *
  FROM (
    VALUES
      (
        'IMP-HNEV-A8-2025-02-09',
        'aktivni',
        'FISH-COM CZ s.r.o.',
        'Lenka Kronová',
        NULL,
        'apartmán č. 8',
        DATE '2025-02-09',
        DATE '2025-01-01',
        DATE '2025-05-31',
        FALSE,
        12000::numeric,
        'mesic',
        'neuvedeno',
        NULL::boolean,
        NULL::numeric,
        'Příloha č. 1 ke smlouvě o nájmu apartmánu č. 8 ze dne 31.12.2024 + Příloha č. 2 ze dne 09.02.2025 | Nájemné 12.000 Kč | Teplo 1.560 Kč | Televize/internet 800 Kč | Vodné a stočné 600 Kč | Elektrická energie: původně 600 Kč, od přílohy č. 2 1.600 Kč | Trvale bytem: Hakenova 1545, Roudnice nad Labem | Doručovací adresa: Hněvice 10, 41108 Štětí | Tel: 739434177 | Email: kb621198@outlook.com'
      ),
      (
        'IMP-HNEV-A6-2025-05-20',
        'aktivni',
        'FISH-COM CZ s.r.o.',
        'Karel Mareček',
        NULL,
        'apartmán č. 6',
        DATE '2025-05-20',
        DATE '2025-06-01',
        DATE '2026-05-31',
        FALSE,
        11600::numeric,
        'mesic',
        'neuvedeno',
        TRUE,
        15000::numeric,
        'Příloha smlouvy o ubytování v apartmánu č. 6 ze dne 20.05.2025 | Trvalé bydliště nájemce: Hněvice 10, 41108 Štětí | Další uvedená adresa: Hrabůvka Horní č.p. 791/3, Ostrava | Potvrzeno vrácení původní kauce v plné výši a převzetí nové kauce 15.000 Kč | chybí splatnost a číslo OP'
      ),
      (
        'IMP-HNEV-A5-2025-11-10',
        'aktivni',
        'FISH-COM CZ s.r.o.',
        'Natálie Kotlárová',
        NULL,
        'apartmán č. 5',
        DATE '2025-11-10',
        DATE '2025-12-01',
        DATE '2026-05-31',
        FALSE,
        16180::numeric,
        'mesic',
        '1',
        TRUE,
        22000::numeric,
        'Smlouva o ubytování v apartmánu č. 5 | VS 1005 | Příloha ze dne 10.11.2025: nájem 16.180 Kč, kauce 22.000 Kč (složení do 4 měsíců od podpisu smlouvy) | Účinnost přílohy: 01.12.2025 | Splatnost: nejpozději k prvnímu dni měsíce'
      ),
      (
        'IMP-HNEV-A2-2025-11-10',
        'aktivni',
        'FISH-COM CZ s.r.o.',
        'Lucie Kotlárová',
        NULL,
        'apartmán č. 2',
        DATE '2025-11-10',
        DATE '2025-06-01',
        DATE '2026-05-31',
        FALSE,
        19400::numeric,
        'mesic',
        'neuvedeno',
        TRUE,
        28410::numeric,
        'Smlouva o ubytování v apartmánu č. 2 | VS 1002 | Příloha č. 2 nahrazující přílohu ze dne 20.05.2025 | Účinnost přílohy: 10.11.2025 | Splatnost: nejpozději k poslednímu dni předcházejícího měsíce'
      ),
      (
        'IMP-HNEV-A4-2025-05-20',
        'aktivni',
        'FISH-COM CZ s.r.o.',
        'Oleksandr Diadyk',
        NULL,
        'apartmán č. 4',
        DATE '2025-05-20',
        DATE '2025-06-01',
        DATE '2026-05-31',
        FALSE,
        13500::numeric,
        'mesic',
        'neuvedeno',
        TRUE,
        18000::numeric,
        'Příloha smlouvy o ubytování v apartmánu č. 4 ze dne 20.05.2025 | Trvale bytem: Smuska obl. Ohtyrka Ukrajina | Doručovací adresa: Hněvice 10, 41108 Štětí | Číslo pasu: FK894569 | Potvrzeno vrácení původní kauce v plné výši a převzetí nové kauce 18.000 Kč | chybí splatnost'
      ),
      (
        'IMP-HNEV-A3-2025-08-29',
        'aktivni',
        'FISH-COM CZ s.r.o.',
        'Miroslav Šredl',
        NULL,
        'apartmán č. 3',
        DATE '2025-08-29',
        DATE '2025-09-01',
        DATE '2026-05-31',
        FALSE,
        8400::numeric,
        'mesic',
        'neuvedeno',
        TRUE,
        12190::numeric,
        'Příloha smlouvy o ubytování v apartmánu č. 3 ze dne 29.08.2025 | Bytem: Hněvice 10, Štětí 41108 | Potvrzeno vrácení původní kauce v plné výši (smlouva 27.09.2023) a převzetí nové kauce 12.190 Kč | chybí splatnost'
      ),
      (
        'IMP-HNEV-A1-2025-05-20',
        'aktivni',
        'FISH-COM CZ s.r.o.',
        'Kevin Stojka',
        NULL,
        'apartmán č. 1',
        DATE '2025-05-20',
        DATE '2025-06-01',
        DATE '2026-05-31',
        FALSE,
        12200::numeric,
        'mesic',
        'neuvedeno',
        TRUE,
        15840::numeric,
        'Příloha smlouvy o ubytování v apartmánu č. 1 ze dne 20.05.2025 | Trvale bytem: Havlíčkova 172, Roudnice nad Labem | Doručovací adresa: Hněvice 10, 41108 Štětí | Číslo OP: 210791897 | Potvrzeno vrácení původní kauce v plné výši (smlouva 10.06.2024) a převzetí nové kauce 15.840 Kč | chybí splatnost'
      ),
      (
        'IMP-MAN-2025-05-31',
        'aktivni',
        'Patrik Čechlovský',
        'Lenka Novotná',
        NULL,
        'Mánesovka',
        DATE '2025-05-31',
        DATE '2025-06-01',
        DATE '2026-05-31',
        FALSE,
        11500::numeric,
        'mesic',
        'neuvedeno',
        TRUE,
        28000::numeric,
        'MÁNESOVKA | Příloha č. 1 ke smlouvě o nájmu bytu ze dne 31.05.2025 | Trvale bytem: ČS Armády 512, 41108 Štětí | Doručovací adresa: Mánesova 625, 41108 Štětí | Tel: 775543245 | Email: lenkanovot008@gmail.com | Kauce: vrácena původní 14.000 Kč (smlouva 24.07.2024), převzata nová 28.000 Kč'
      ),
      (
        'IMP-OST-47719-2025-12-20',
        'aktivni',
        'Veronika Čechlovská',
        'Pavel Olša',
        NULL,
        'Byt 477/19',
        DATE '2025-12-20',
        DATE '2026-01-01',
        DATE '2027-05-31',
        FALSE,
        11500::numeric,
        'mesic',
        '25',
        TRUE,
        19000::numeric,
        'Smlouva o nájmu bytu | Příloha ze dne 20.12.2025: nájem 11.500 Kč, kauce 19.000 Kč | Pronajímatel v zastoupení: Patrik Čechlovský (r.č. 730715/5185) | OP nájemce: 205950508 | VS 47719'
      ),
      (
        'IMP-RAD-58832-2025-12-30',
        'aktivni',
        'Veronika Čechlovská',
        'Erika Sýkorová',
        NULL,
        'Byt 588/32',
        DATE '2025-12-30',
        DATE '2026-01-01',
        DATE '2027-05-31',
        FALSE,
        10000::numeric,
        'mesic',
        '15',
        TRUE,
        17000::numeric,
        'Smlouva o nájmu bytu | Příloha ze dne 30.12.2025: nájem 10.000 Kč, kauce 17.000 Kč | Pronajímatel v zastoupení: Patrik Čechlovský (r.č. 730715/5185) | VS 58832 | Koresp. adresa nájemce: Radouňská 588, Štětí | Tel: 773218840'
      )
  ) AS t(
    cislo_smlouvy,
    stav,
    landlord_name,
    tenant_name,
    property_name,
    unit_name,
    datum_podpisu,
    datum_zacatek,
    datum_konec,
    doba_neurcita,
    najem_vyse,
    periodicita_najmu,
    den_platby,
    kauce_potreba,
    kauce_castka,
    poznamky
  )
),
resolved AS (
  SELECT
    s.*,
    COALESCE(landlord.id, unit_resolved.landlord_id) AS landlord_id,
    tenant.id AS tenant_id,
    unit_resolved.id AS unit_id,
    unit_resolved.property_id AS property_id
  FROM src s
  LEFT JOIN public.subjects landlord
    ON lower(landlord.display_name) = lower(s.landlord_name)
  LEFT JOIN public.subjects tenant
    ON lower(tenant.display_name) = lower(s.tenant_name)
  LEFT JOIN LATERAL (
    SELECT u.id, u.property_id, u.landlord_id
    FROM public.units u
    LEFT JOIN public.properties p ON p.id = u.property_id
    WHERE (
      s.unit_name IS NOT NULL
      AND u.display_name ILIKE '%' || s.unit_name || '%'
    )
    OR (
      s.unit_name IS NULL
      AND s.property_name IS NOT NULL
      AND p.display_name ILIKE '%' || s.property_name || '%'
    )
    ORDER BY
      CASE
        WHEN s.unit_name IS NOT NULL AND lower(u.display_name) = lower(s.unit_name) THEN 0
        WHEN s.property_name IS NOT NULL AND lower(p.display_name) = lower(s.property_name) THEN 0
        ELSE 1
      END,
      u.display_name
    LIMIT 1
  ) AS unit_resolved ON TRUE
),
upserted AS (
  INSERT INTO public.contracts (
    cislo_smlouvy,
    stav,
    landlord_id,
    tenant_id,
    property_id,
    unit_id,
    datum_podpisu,
    datum_zacatek,
    datum_konec,
    doba_neurcita,
    najem_vyse,
    periodicita_najmu,
    den_platby,
    kauce_potreba,
    kauce_castka,
    poznamky
  )
  SELECT
    r.cislo_smlouvy,
    r.stav,
    r.landlord_id,
    r.tenant_id,
    r.property_id,
    r.unit_id,
    r.datum_podpisu,
    r.datum_zacatek,
    r.datum_konec,
    r.doba_neurcita,
    r.najem_vyse,
    r.periodicita_najmu,
    r.den_platby,
    COALESCE(r.kauce_potreba, FALSE),
    r.kauce_castka,
    r.poznamky
  FROM resolved r
  WHERE r.landlord_id IS NOT NULL
    AND r.tenant_id IS NOT NULL
    AND r.unit_id IS NOT NULL
    AND r.property_id IS NOT NULL
    AND r.datum_zacatek IS NOT NULL
  ON CONFLICT (cislo_smlouvy) DO UPDATE
  SET
    stav = EXCLUDED.stav,
    landlord_id = EXCLUDED.landlord_id,
    tenant_id = EXCLUDED.tenant_id,
    property_id = EXCLUDED.property_id,
    unit_id = EXCLUDED.unit_id,
    datum_podpisu = EXCLUDED.datum_podpisu,
    datum_zacatek = EXCLUDED.datum_zacatek,
    datum_konec = EXCLUDED.datum_konec,
    doba_neurcita = EXCLUDED.doba_neurcita,
    najem_vyse = EXCLUDED.najem_vyse,
    periodicita_najmu = EXCLUDED.periodicita_najmu,
    den_platby = EXCLUDED.den_platby,
    kauce_potreba = EXCLUDED.kauce_potreba,
    kauce_castka = EXCLUDED.kauce_castka,
    poznamky = EXCLUDED.poznamky,
    updated_at = NOW()
  RETURNING cislo_smlouvy
)
SELECT
  'UPSERTED' AS status,
  COUNT(*)::text AS count_or_name,
  NULL::text AS detail
FROM upserted
UNION ALL
SELECT
  'UNRESOLVED',
  r.cislo_smlouvy,
  CONCAT_WS(
    ' | ',
    CASE WHEN r.landlord_id IS NULL THEN 'nenalezen pronajímatel' END,
    CASE WHEN r.tenant_id IS NULL THEN 'nenalezen nájemce' END,
    CASE WHEN r.unit_id IS NULL THEN 'nenalezena jednotka' END,
    CASE WHEN r.property_id IS NULL THEN 'nenalezena nemovitost' END,
    CASE WHEN r.datum_zacatek IS NULL THEN 'chybí datum_zacatek' END
  ) AS detail
FROM resolved r
WHERE r.landlord_id IS NULL
   OR r.tenant_id IS NULL
   OR r.unit_id IS NULL
   OR r.property_id IS NULL
   OR r.datum_zacatek IS NULL;

COMMIT;

-- TODO ručně doplnit a pak spustit samostatně:
-- Lucie Gragová | ČSA 514 | v CSV stále chybí datum od / datum do.
--
-- INSERT INTO public.contracts (
--   cislo_smlouvy, stav, landlord_id, tenant_id, property_id, unit_id,
--   datum_podpisu, datum_zacatek, datum_konec, doba_neurcita,
--   najem_vyse, periodicita_najmu, den_platby, poznamky
-- )
-- VALUES (...);
