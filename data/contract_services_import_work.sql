-- FILE: data/contract_services_import_work.sql
-- PURPOSE: Import evidenčních listů a jejich služeb z contract_services_import_work.csv
-- NOTES:
-- - Předpokládá, že smlouvy z data/contracts_import_work.sql už jsou nahrané v public.contracts.
-- - Vytvoří / aktualizuje contract_evidence_sheets a znovu naplní contract_evidence_sheet_services.
-- - Nájemné se ukládá do contract_evidence_sheets.rent_amount, NE do tabulky služeb.
-- - Řádky pro Lucii Gragovou (ČSA 514) jsou záměrně vynechané, dokud nebude nahraná smlouva.

BEGIN;

WITH src AS (
  SELECT *
  FROM (
    VALUES
      -- Pavel Olša | Byt 477/19
      ('IMP-OST-47719-2025-12-20', 1, DATE '2026-01-01', DATE '2027-05-31', 'Pavel Olša', 'Byt 477/19', 'Nájemné', 11500::numeric, 'CZK', 1, 11500::numeric, 'Příloha ze dne 20.12.2025 | VS 47719'),
      ('IMP-OST-47719-2025-12-20', 1, DATE '2026-01-01', DATE '2027-05-31', 'Pavel Olša', 'Byt 477/19', 'Osvětlení', 40::numeric, 'CZK', 2, 20::numeric, 'Příloha ze dne 20.12.2025'),
      ('IMP-OST-47719-2025-12-20', 1, DATE '2026-01-01', DATE '2027-05-31', 'Pavel Olša', 'Byt 477/19', 'Užívání společných prostor', 0::numeric, 'CZK', 2, 0::numeric, 'Příloha ze dne 20.12.2025'),
      ('IMP-OST-47719-2025-12-20', 1, DATE '2026-01-01', DATE '2027-05-31', 'Pavel Olša', 'Byt 477/19', 'Úklid', 0::numeric, 'CZK', 1, 0::numeric, 'Příloha ze dne 20.12.2025'),
      ('IMP-OST-47719-2025-12-20', 1, DATE '2026-01-01', DATE '2027-05-31', 'Pavel Olša', 'Byt 477/19', 'Teplo', 1400::numeric, 'CZK', 1, 1400::numeric, 'Příloha ze dne 20.12.2025'),
      ('IMP-OST-47719-2025-12-20', 1, DATE '2026-01-01', DATE '2027-05-31', 'Pavel Olša', 'Byt 477/19', 'Vodné a stočné', 800::numeric, 'CZK', 1, 800::numeric, 'Příloha ze dne 20.12.2025'),
      ('IMP-OST-47719-2025-12-20', 1, DATE '2026-01-01', DATE '2027-05-31', 'Pavel Olša', 'Byt 477/19', 'Teplá voda', 1200::numeric, 'CZK', 1, 1200::numeric, 'Příloha ze dne 20.12.2025'),
      ('IMP-OST-47719-2025-12-20', 1, DATE '2026-01-01', DATE '2027-05-31', 'Pavel Olša', 'Byt 477/19', 'Elektrická energie', 2060::numeric, 'CZK', 1, 2060::numeric, 'Příloha ze dne 20.12.2025'),
      ('IMP-OST-47719-2025-12-20', 1, DATE '2026-01-01', DATE '2027-05-31', 'Pavel Olša', 'Byt 477/19', 'Administrativní poplatky', 0::numeric, 'CZK', 1, 0::numeric, 'Příloha ze dne 20.12.2025'),

      -- Erika Sýkorová | Byt 588/32
      ('IMP-RAD-58832-2025-12-30', 1, DATE '2026-01-01', DATE '2027-05-31', 'Erika Sýkorová', 'Byt 588/32', 'Nájemné', 10000::numeric, 'CZK', 1, 10000::numeric, 'Příloha ze dne 30.12.2025 | VS 58832'),
      ('IMP-RAD-58832-2025-12-30', 1, DATE '2026-01-01', DATE '2027-05-31', 'Erika Sýkorová', 'Byt 588/32', 'Osvětlení', 0::numeric, 'CZK', 2, 0::numeric, 'Příloha ze dne 30.12.2025'),
      ('IMP-RAD-58832-2025-12-30', 1, DATE '2026-01-01', DATE '2027-05-31', 'Erika Sýkorová', 'Byt 588/32', 'Užívání společných prostor', 0::numeric, 'CZK', 2, 0::numeric, 'Příloha ze dne 30.12.2025'),
      ('IMP-RAD-58832-2025-12-30', 1, DATE '2026-01-01', DATE '2027-05-31', 'Erika Sýkorová', 'Byt 588/32', 'Úklid', 150::numeric, 'CZK', 1, 150::numeric, 'Příloha ze dne 30.12.2025'),
      ('IMP-RAD-58832-2025-12-30', 1, DATE '2026-01-01', DATE '2027-05-31', 'Erika Sýkorová', 'Byt 588/32', 'Teplo', 500::numeric, 'CZK', 1, 500::numeric, 'Příloha ze dne 30.12.2025'),
      ('IMP-RAD-58832-2025-12-30', 1, DATE '2026-01-01', DATE '2027-05-31', 'Erika Sýkorová', 'Byt 588/32', 'Vodné a stočné', 350::numeric, 'CZK', 1, 350::numeric, 'Příloha ze dne 30.12.2025'),
      ('IMP-RAD-58832-2025-12-30', 1, DATE '2026-01-01', DATE '2027-05-31', 'Erika Sýkorová', 'Byt 588/32', 'Teplá voda', 950::numeric, 'CZK', 1, 950::numeric, 'Příloha ze dne 30.12.2025'),
      ('IMP-RAD-58832-2025-12-30', 1, DATE '2026-01-01', DATE '2027-05-31', 'Erika Sýkorová', 'Byt 588/32', 'Elektrická energie', 1300::numeric, 'CZK', 1, 1300::numeric, 'Příloha ze dne 30.12.2025'),
      ('IMP-RAD-58832-2025-12-30', 1, DATE '2026-01-01', DATE '2027-05-31', 'Erika Sýkorová', 'Byt 588/32', 'Administrativní poplatky', 0::numeric, 'CZK', 1, 0::numeric, 'Příloha ze dne 30.12.2025'),

      -- Lucie Kotlárová | Apartmán 2 | příloha č. 2
      ('IMP-HNEV-A2-2025-11-10', 2, DATE '2025-11-10', DATE '2026-05-31', 'Lucie Kotlárová', 'Apartmán č. 2', 'Nájemné', 19400::numeric, 'CZK', 1, 19400::numeric, 'Příloha č. 2 ze dne 20.05.2025, účinnost 10.11.2025 | VS 1002'),
      ('IMP-HNEV-A2-2025-11-10', 2, DATE '2025-11-10', DATE '2026-05-31', 'Lucie Kotlárová', 'Apartmán č. 2', 'Užívání společných prostor', 700::numeric, 'CZK', 5, 140::numeric, 'Příloha č. 2 ze dne 20.05.2025, účinnost 10.11.2025'),
      ('IMP-HNEV-A2-2025-11-10', 2, DATE '2025-11-10', DATE '2026-05-31', 'Lucie Kotlárová', 'Apartmán č. 2', 'Televize, internet', 1500::numeric, 'CZK', 1, 1500::numeric, 'Příloha č. 2 ze dne 20.05.2025, účinnost 10.11.2025'),
      ('IMP-HNEV-A2-2025-11-10', 2, DATE '2025-11-10', DATE '2026-05-31', 'Lucie Kotlárová', 'Apartmán č. 2', 'Teplo', 5350::numeric, 'CZK', 1, 5350::numeric, 'Příloha č. 2 ze dne 20.05.2025, účinnost 10.11.2025'),
      ('IMP-HNEV-A2-2025-11-10', 2, DATE '2025-11-10', DATE '2026-05-31', 'Lucie Kotlárová', 'Apartmán č. 2', 'Vodné a stočné', 750::numeric, 'CZK', 1, 750::numeric, 'Příloha č. 2 ze dne 20.05.2025, účinnost 10.11.2025'),
      ('IMP-HNEV-A2-2025-11-10', 2, DATE '2025-11-10', DATE '2026-05-31', 'Lucie Kotlárová', 'Apartmán č. 2', 'Čerpadlo užitkové vody', 200::numeric, 'CZK', 1, 200::numeric, 'Příloha č. 2 ze dne 20.05.2025, účinnost 10.11.2025'),
      ('IMP-HNEV-A2-2025-11-10', 2, DATE '2025-11-10', DATE '2026-05-31', 'Lucie Kotlárová', 'Apartmán č. 2', 'Elektrická energie', 8960::numeric, 'CZK', 1, 8960::numeric, 'Příloha č. 2 ze dne 20.05.2025, účinnost 10.11.2025'),

      -- Natálie Kotlárová | Apartmán 5
      ('IMP-HNEV-A5-2025-11-10', 1, DATE '2025-12-01', DATE '2026-05-31', 'Natálie Kotlárová', 'Apartmán č. 5', 'Nájemné', 16180::numeric, 'CZK', 1, 16180::numeric, 'Příloha ze dne 10.11.2025, účinnost 01.12.2025 | VS 1005'),
      ('IMP-HNEV-A5-2025-11-10', 1, DATE '2025-12-01', DATE '2026-05-31', 'Natálie Kotlárová', 'Apartmán č. 5', 'Užívání společných prostor', 140::numeric, 'CZK', 1, 140::numeric, 'Příloha ze dne 10.11.2025, účinnost 01.12.2025'),
      ('IMP-HNEV-A5-2025-11-10', 1, DATE '2025-12-01', DATE '2026-05-31', 'Natálie Kotlárová', 'Apartmán č. 5', 'Televize, internet', 800::numeric, 'CZK', 1, 800::numeric, 'Příloha ze dne 10.11.2025, účinnost 01.12.2025'),
      ('IMP-HNEV-A5-2025-11-10', 1, DATE '2025-12-01', DATE '2026-05-31', 'Natálie Kotlárová', 'Apartmán č. 5', 'Teplo', 2600::numeric, 'CZK', 1, 2600::numeric, 'Příloha ze dne 10.11.2025, účinnost 01.12.2025'),
      ('IMP-HNEV-A5-2025-11-10', 1, DATE '2025-12-01', DATE '2026-05-31', 'Natálie Kotlárová', 'Apartmán č. 5', 'Vodné a stočné', 600::numeric, 'CZK', 1, 600::numeric, 'Příloha ze dne 10.11.2025, účinnost 01.12.2025'),
      ('IMP-HNEV-A5-2025-11-10', 1, DATE '2025-12-01', DATE '2026-05-31', 'Natálie Kotlárová', 'Apartmán č. 5', 'Čerpadlo užitkové vody', 0::numeric, 'CZK', 0, 200::numeric, 'Příloha ze dne 10.11.2025, účinnost 01.12.2025'),
      ('IMP-HNEV-A5-2025-11-10', 1, DATE '2025-12-01', DATE '2026-05-31', 'Natálie Kotlárová', 'Apartmán č. 5', 'Elektrická energie', 1380::numeric, 'CZK', 1, 1380::numeric, 'Příloha ze dne 10.11.2025, účinnost 01.12.2025'),

      -- Lenka Novotná | Mánesovka
      ('IMP-MAN-2025-05-31', 1, DATE '2025-06-01', DATE '2026-05-31', 'Lenka Novotná', 'Mánesovka', 'Nájemné', 10995::numeric, 'CZK', 1, 10995::numeric, 'MÁNESOVKA | Příloha č. 1 ke smlouvě o nájmu bytu ze dne 31.05.2025'),
      ('IMP-MAN-2025-05-31', 1, DATE '2025-06-01', DATE '2026-05-31', 'Lenka Novotná', 'Mánesovka', 'Osvětlení', 5::numeric, 'CZK', 1, 5::numeric, 'MÁNESOVKA | Příloha č. 1 ke smlouvě o nájmu bytu ze dne 31.05.2025'),
      ('IMP-MAN-2025-05-31', 1, DATE '2025-06-01', DATE '2026-05-31', 'Lenka Novotná', 'Mánesovka', 'Užívání společných prostor', 20::numeric, 'CZK', 1, 20::numeric, 'MÁNESOVKA | Příloha č. 1 ke smlouvě o nájmu bytu ze dne 31.05.2025'),
      ('IMP-MAN-2025-05-31', 1, DATE '2025-06-01', DATE '2026-05-31', 'Lenka Novotná', 'Mánesovka', 'Úklid', 120::numeric, 'CZK', 1, 120::numeric, 'MÁNESOVKA | Příloha č. 1 ke smlouvě o nájmu bytu ze dne 31.05.2025'),
      ('IMP-MAN-2025-05-31', 1, DATE '2025-06-01', DATE '2026-05-31', 'Lenka Novotná', 'Mánesovka', 'Teplo', 411::numeric, 'CZK', 1, 411::numeric, 'MÁNESOVKA | Příloha č. 1 ke smlouvě o nájmu bytu ze dne 31.05.2025'),
      ('IMP-MAN-2025-05-31', 1, DATE '2025-06-01', DATE '2026-05-31', 'Lenka Novotná', 'Mánesovka', 'Vodné a stočné', 500::numeric, 'CZK', 1, 500::numeric, 'MÁNESOVKA | Příloha č. 1 ke smlouvě o nájmu bytu ze dne 31.05.2025'),
      ('IMP-MAN-2025-05-31', 1, DATE '2025-06-01', DATE '2026-05-31', 'Lenka Novotná', 'Mánesovka', 'Teplá voda', 1100::numeric, 'CZK', 1, 1100::numeric, 'MÁNESOVKA | Příloha č. 1 ke smlouvě o nájmu bytu ze dne 31.05.2025'),
      ('IMP-MAN-2025-05-31', 1, DATE '2025-06-01', DATE '2026-05-31', 'Lenka Novotná', 'Mánesovka', 'Elektrická energie', 650::numeric, 'CZK', 1, 650::numeric, 'MÁNESOVKA | Příloha č. 1 ke smlouvě o nájmu bytu ze dne 31.05.2025'),
      ('IMP-MAN-2025-05-31', 1, DATE '2025-06-01', DATE '2026-05-31', 'Lenka Novotná', 'Mánesovka', 'Administrativní poplatky', 186::numeric, 'CZK', 1, 186::numeric, 'MÁNESOVKA | Příloha č. 1 ke smlouvě o nájmu bytu ze dne 31.05.2025'),

      -- Kevin Stojka | Apartmán 1
      ('IMP-HNEV-A1-2025-05-20', 1, DATE '2025-06-01', DATE '2026-05-31', 'Kevin Stojka', 'Apartmán č. 1', 'Nájemné', 12200::numeric, 'CZK', 1, 12200::numeric, 'Příloha smlouvy o ubytování v apartmánu č. 1 ze dne 20.05.2025'),
      ('IMP-HNEV-A1-2025-05-20', 1, DATE '2025-06-01', DATE '2026-05-31', 'Kevin Stojka', 'Apartmán č. 1', 'Užívání společných prostor', 240::numeric, 'CZK', 2, 120::numeric, 'Příloha smlouvy o ubytování v apartmánu č. 1 ze dne 20.05.2025'),
      ('IMP-HNEV-A1-2025-05-20', 1, DATE '2025-06-01', DATE '2026-05-31', 'Kevin Stojka', 'Apartmán č. 1', 'Televize, internet', 800::numeric, 'CZK', 1, 800::numeric, 'Příloha smlouvy o ubytování v apartmánu č. 1 ze dne 20.05.2025'),
      ('IMP-HNEV-A1-2025-05-20', 1, DATE '2025-06-01', DATE '2026-05-31', 'Kevin Stojka', 'Apartmán č. 1', 'Teplo', 1500::numeric, 'CZK', 1, 1500::numeric, 'Příloha smlouvy o ubytování v apartmánu č. 1 ze dne 20.05.2025'),
      ('IMP-HNEV-A1-2025-05-20', 1, DATE '2025-06-01', DATE '2026-05-31', 'Kevin Stojka', 'Apartmán č. 1', 'Vodné a stočné', 200::numeric, 'CZK', 1, 200::numeric, 'Příloha smlouvy o ubytování v apartmánu č. 1 ze dne 20.05.2025'),
      ('IMP-HNEV-A1-2025-05-20', 1, DATE '2025-06-01', DATE '2026-05-31', 'Kevin Stojka', 'Apartmán č. 1', 'Čerpadlo užitkové vody', 100::numeric, 'CZK', 1, 100::numeric, 'Příloha smlouvy o ubytování v apartmánu č. 1 ze dne 20.05.2025'),
      ('IMP-HNEV-A1-2025-05-20', 1, DATE '2025-06-01', DATE '2026-05-31', 'Kevin Stojka', 'Apartmán č. 1', 'Elektrická energie', 3360::numeric, 'CZK', 1, 3360::numeric, 'Příloha smlouvy o ubytování v apartmánu č. 1 ze dne 20.05.2025'),

      -- Miroslav Šredl | Apartmán 3
      ('IMP-HNEV-A3-2025-08-29', 1, DATE '2025-09-01', DATE '2026-05-31', 'Miroslav Šredl', 'Apartmán č. 3', 'Nájemné', 8400::numeric, 'CZK', 1, 8400::numeric, 'Příloha smlouvy o ubytování v apartmánu č. 3 ze dne 29.08.2025'),
      ('IMP-HNEV-A3-2025-08-29', 1, DATE '2025-09-01', DATE '2026-05-31', 'Miroslav Šredl', 'Apartmán č. 3', 'Užívání společných prostor', 120::numeric, 'CZK', 1, 120::numeric, 'Příloha smlouvy o ubytování v apartmánu č. 3 ze dne 29.08.2025'),
      ('IMP-HNEV-A3-2025-08-29', 1, DATE '2025-09-01', DATE '2026-05-31', 'Miroslav Šredl', 'Apartmán č. 3', 'Televize, internet', 800::numeric, 'CZK', 1, 800::numeric, 'Příloha smlouvy o ubytování v apartmánu č. 3 ze dne 29.08.2025'),
      ('IMP-HNEV-A3-2025-08-29', 1, DATE '2025-09-01', DATE '2026-05-31', 'Miroslav Šredl', 'Apartmán č. 3', 'Teplo', 2050::numeric, 'CZK', 1, 2050::numeric, 'Příloha smlouvy o ubytování v apartmánu č. 3 ze dne 29.08.2025'),
      ('IMP-HNEV-A3-2025-08-29', 1, DATE '2025-09-01', DATE '2026-05-31', 'Miroslav Šredl', 'Apartmán č. 3', 'Vodné a stočné', 410::numeric, 'CZK', 1, 410::numeric, 'Příloha smlouvy o ubytování v apartmánu č. 3 ze dne 29.08.2025'),
      ('IMP-HNEV-A3-2025-08-29', 1, DATE '2025-09-01', DATE '2026-05-31', 'Miroslav Šredl', 'Apartmán č. 3', 'Čerpadlo užitkové vody', 0::numeric, 'CZK', 0, 0::numeric, 'Příloha smlouvy o ubytování v apartmánu č. 3 ze dne 29.08.2025'),
      ('IMP-HNEV-A3-2025-08-29', 1, DATE '2025-09-01', DATE '2026-05-31', 'Miroslav Šredl', 'Apartmán č. 3', 'Elektrická energie', 2220::numeric, 'CZK', 1, 2220::numeric, 'Příloha smlouvy o ubytování v apartmánu č. 3 ze dne 29.08.2025'),

      -- Oleksandr Diadyk | Apartmán 4
      ('IMP-HNEV-A4-2025-05-20', 1, DATE '2025-06-01', DATE '2026-05-31', 'Oleksandr Diadyk', 'Apartmán č. 4', 'Nájemné', 13500::numeric, 'CZK', 1, 13500::numeric, 'Příloha smlouvy o ubytování v apartmánu č. 4 ze dne 20.05.2025'),
      ('IMP-HNEV-A4-2025-05-20', 1, DATE '2025-06-01', DATE '2026-05-31', 'Oleksandr Diadyk', 'Apartmán č. 4', 'Užívání společných prostor', 480::numeric, 'CZK', 4, 120::numeric, 'Příloha smlouvy o ubytování v apartmánu č. 4 ze dne 20.05.2025'),
      ('IMP-HNEV-A4-2025-05-20', 1, DATE '2025-06-01', DATE '2026-05-31', 'Oleksandr Diadyk', 'Apartmán č. 4', 'Televize, internet', 800::numeric, 'CZK', 1, 800::numeric, 'Příloha smlouvy o ubytování v apartmánu č. 4 ze dne 20.05.2025'),
      ('IMP-HNEV-A4-2025-05-20', 1, DATE '2025-06-01', DATE '2026-05-31', 'Oleksandr Diadyk', 'Apartmán č. 4', 'Teplo', 1950::numeric, 'CZK', 1, 1950::numeric, 'Příloha smlouvy o ubytování v apartmánu č. 4 ze dne 20.05.2025'),
      ('IMP-HNEV-A4-2025-05-20', 1, DATE '2025-06-01', DATE '2026-05-31', 'Oleksandr Diadyk', 'Apartmán č. 4', 'Vodné a stočné', 1000::numeric, 'CZK', 1, 1000::numeric, 'Příloha smlouvy o ubytování v apartmánu č. 4 ze dne 20.05.2025'),
      ('IMP-HNEV-A4-2025-05-20', 1, DATE '2025-06-01', DATE '2026-05-31', 'Oleksandr Diadyk', 'Apartmán č. 4', 'Čerpadlo užitkové vody', 0::numeric, 'CZK', 0, 0::numeric, 'Příloha smlouvy o ubytování v apartmánu č. 4 ze dne 20.05.2025'),
      ('IMP-HNEV-A4-2025-05-20', 1, DATE '2025-06-01', DATE '2026-05-31', 'Oleksandr Diadyk', 'Apartmán č. 4', 'Elektrická energie', 3270::numeric, 'CZK', 1, 3270::numeric, 'Příloha smlouvy o ubytování v apartmánu č. 4 ze dne 20.05.2025'),

      -- Karel Mareček | Apartmán 6
      ('IMP-HNEV-A6-2025-05-20', 1, DATE '2025-06-01', DATE '2026-05-31', 'Karel Mareček', 'Apartmán č. 6', 'Nájemné', 11600::numeric, 'CZK', 1, 11600::numeric, 'Příloha smlouvy o ubytování v apartmánu č. 6 ze dne 20.05.2025'),
      ('IMP-HNEV-A6-2025-05-20', 1, DATE '2025-06-01', DATE '2026-05-31', 'Karel Mareček', 'Apartmán č. 6', 'Užívání společných prostor', 120::numeric, 'CZK', 1, 120::numeric, 'Příloha smlouvy o ubytování v apartmánu č. 6 ze dne 20.05.2025'),
      ('IMP-HNEV-A6-2025-05-20', 1, DATE '2025-06-01', DATE '2026-05-31', 'Karel Mareček', 'Apartmán č. 6', 'Televize, internet', 800::numeric, 'CZK', 1, 800::numeric, 'Příloha smlouvy o ubytování v apartmánu č. 6 ze dne 20.05.2025'),
      ('IMP-HNEV-A6-2025-05-20', 1, DATE '2025-06-01', DATE '2026-05-31', 'Karel Mareček', 'Apartmán č. 6', 'Teplo', 1550::numeric, 'CZK', 1, 1550::numeric, 'Příloha smlouvy o ubytování v apartmánu č. 6 ze dne 20.05.2025'),
      ('IMP-HNEV-A6-2025-05-20', 1, DATE '2025-06-01', DATE '2026-05-31', 'Karel Mareček', 'Apartmán č. 6', 'Vodné a stočné', 500::numeric, 'CZK', 1, 500::numeric, 'Příloha smlouvy o ubytování v apartmánu č. 6 ze dne 20.05.2025'),
      ('IMP-HNEV-A6-2025-05-20', 1, DATE '2025-06-01', DATE '2026-05-31', 'Karel Mareček', 'Apartmán č. 6', 'Čerpadlo užitkové vody', 0::numeric, 'CZK', 0, 0::numeric, 'Příloha smlouvy o ubytování v apartmánu č. 6 ze dne 20.05.2025'),
      ('IMP-HNEV-A6-2025-05-20', 1, DATE '2025-06-01', DATE '2026-05-31', 'Karel Mareček', 'Apartmán č. 6', 'Elektrická energie', 1030::numeric, 'CZK', 1, 1030::numeric, 'Příloha smlouvy o ubytování v apartmánu č. 6 ze dne 20.05.2025'),

      -- Lenka Kronová | Apartmán 8 | příloha č. 2
      ('IMP-HNEV-A8-2025-02-09', 2, DATE '2025-02-09', DATE '2025-05-31', 'Lenka Kronová', 'Apartmán č. 8', 'Nájemné', 12000::numeric, 'CZK', 1, 12000::numeric, 'Příloha č. 2 ke smlouvě o nájmu apartmánu č. 8 ze dne 09.02.2025'),
      ('IMP-HNEV-A8-2025-02-09', 2, DATE '2025-02-09', DATE '2025-05-31', 'Lenka Kronová', 'Apartmán č. 8', 'Teplo', 1560::numeric, 'CZK', 1, 1560::numeric, 'Příloha č. 2 ke smlouvě o nájmu apartmánu č. 8 ze dne 09.02.2025'),
      ('IMP-HNEV-A8-2025-02-09', 2, DATE '2025-02-09', DATE '2025-05-31', 'Lenka Kronová', 'Apartmán č. 8', 'Televize, internet', 800::numeric, 'CZK', 1, 800::numeric, 'Příloha č. 2 ke smlouvě o nájmu apartmánu č. 8 ze dne 09.02.2025'),
      ('IMP-HNEV-A8-2025-02-09', 2, DATE '2025-02-09', DATE '2025-05-31', 'Lenka Kronová', 'Apartmán č. 8', 'Vodné a stočné', 600::numeric, 'CZK', 1, 600::numeric, 'Příloha č. 2 ke smlouvě o nájmu apartmánu č. 8 ze dne 09.02.2025'),
      ('IMP-HNEV-A8-2025-02-09', 2, DATE '2025-02-09', DATE '2025-05-31', 'Lenka Kronová', 'Apartmán č. 8', 'Elektrická energie', 1600::numeric, 'CZK', 1, 1600::numeric, 'Příloha č. 2 ke smlouvě o nájmu apartmánu č. 8 ze dne 09.02.2025')
  ) AS t(
    contract_ref,
    sheet_number,
    valid_from,
    valid_to,
    tenant_name,
    unit_name,
    service_name,
    monthly_amount,
    currency,
    units_count,
    unit_price,
    note
  )
),
contracts_resolved AS (
  SELECT
    s.*,
    c.id AS contract_id
  FROM src s
  LEFT JOIN public.contracts c
    ON c.cislo_smlouvy = s.contract_ref
),
sheets_aggregated AS (
  SELECT
    contract_id,
    contract_ref,
    sheet_number,
    MIN(valid_from) AS valid_from,
    MAX(valid_to) AS valid_to,
    MAX(CASE WHEN service_name = 'Nájemné' THEN monthly_amount END) AS rent_amount,
    GREATEST(COALESCE(MAX(CASE WHEN service_name IN ('Osvětlení', 'Užívání společných prostor') THEN units_count END), 1), 1) AS total_persons,
    COALESCE(SUM(CASE WHEN service_name <> 'Nájemné' THEN monthly_amount ELSE 0 END), 0) AS services_total,
    COALESCE(SUM(monthly_amount), 0) AS total_amount,
    MAX(note) AS notes,
    CONCAT('Import z contract_services_import_work.csv | list č. ', sheet_number) AS description
  FROM contracts_resolved
  WHERE contract_id IS NOT NULL
  GROUP BY contract_id, contract_ref, sheet_number
),
upserted_sheets AS (
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
    notes,
    status,
    is_archived
  )
  SELECT
    sa.contract_id,
    sa.sheet_number,
    sa.valid_from,
    sa.valid_to,
    sa.rent_amount,
    sa.total_persons,
    sa.services_total,
    sa.total_amount,
    sa.description,
    sa.notes,
    'active',
    FALSE
  FROM sheets_aggregated sa
  ON CONFLICT (contract_id, sheet_number) DO UPDATE
  SET
    valid_from = EXCLUDED.valid_from,
    valid_to = EXCLUDED.valid_to,
    rent_amount = EXCLUDED.rent_amount,
    total_persons = EXCLUDED.total_persons,
    services_total = EXCLUDED.services_total,
    total_amount = EXCLUDED.total_amount,
    description = EXCLUDED.description,
    notes = EXCLUDED.notes,
    status = EXCLUDED.status,
    is_archived = EXCLUDED.is_archived,
    updated_at = NOW()
  RETURNING id, contract_id, sheet_number
),
all_target_sheets AS (
  SELECT ces.id, ces.contract_id, ces.sheet_number, ces.valid_from, ces.valid_to
  FROM public.contract_evidence_sheets ces
  JOIN sheets_aggregated sa
    ON sa.contract_id = ces.contract_id
   AND sa.sheet_number = ces.sheet_number
),
deleted_services AS (
  DELETE FROM public.contract_evidence_sheet_services s
  USING all_target_sheets ats
  WHERE s.sheet_id = ats.id
  RETURNING s.id
),
services_prepared AS (
  SELECT
    ats.id AS sheet_id,
    ats.valid_from,
    ats.valid_to,
    cr.service_name,
    CASE
      WHEN cr.service_name IN ('Osvětlení', 'Užívání společných prostor') THEN 'person'
      ELSE 'flat'
    END AS unit_type,
    cr.unit_price,
    cr.units_count AS quantity,
    cr.monthly_amount AS total_amount,
    ROW_NUMBER() OVER (
      PARTITION BY cr.contract_ref, cr.sheet_number
      ORDER BY
        CASE cr.service_name
          WHEN 'Osvětlení' THEN 10
          WHEN 'Užívání společných prostor' THEN 20
          WHEN 'Televize, internet' THEN 30
          WHEN 'Úklid' THEN 40
          WHEN 'Teplo' THEN 50
          WHEN 'Vodné a stočné' THEN 60
          WHEN 'Teplá voda' THEN 70
          WHEN 'Čerpadlo užitkové vody' THEN 80
          WHEN 'Elektrická energie' THEN 90
          WHEN 'Administrativní poplatky' THEN 100
          ELSE 999
        END,
        cr.service_name
    ) AS order_index
  FROM contracts_resolved cr
  JOIN all_target_sheets ats
    ON ats.contract_id = cr.contract_id
   AND ats.sheet_number = cr.sheet_number
  WHERE cr.contract_id IS NOT NULL
    AND cr.service_name <> 'Nájemné'
),
inserted_services AS (
  INSERT INTO public.contract_evidence_sheet_services (
    sheet_id,
    valid_from,
    valid_to,
    service_name,
    unit_type,
    unit_price,
    quantity,
    total_amount,
    order_index,
    is_archived
  )
  SELECT
    sp.sheet_id,
    sp.valid_from,
    sp.valid_to,
    sp.service_name,
    sp.unit_type,
    sp.unit_price,
    sp.quantity,
    sp.total_amount,
    sp.order_index,
    FALSE
  FROM services_prepared sp
  RETURNING id
)
SELECT 'SHEETS_UPSERTED' AS status, COUNT(*)::text AS count_or_name, NULL::text AS detail
FROM upserted_sheets
UNION ALL
SELECT 'SERVICES_INSERTED', COUNT(*)::text, NULL::text
FROM inserted_services
UNION ALL
SELECT
  'UNRESOLVED_CONTRACT',
  cr.contract_ref,
  CONCAT_WS(' | ', 'nenalezena smlouva', MAX(cr.tenant_name), MAX(cr.unit_name))
FROM contracts_resolved cr
WHERE cr.contract_id IS NULL
GROUP BY cr.contract_ref;

COMMIT;
