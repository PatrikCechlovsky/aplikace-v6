-- FILE: supabase/migrations/051_seed_test_tenants.sql
-- PURPOSE: Vytvoření testovacích nájemníků - 2x pro každý typ subjektu
-- DATE: 2026-01-16

-- 2x OSOBA (fyzická osoba bez IČ)
INSERT INTO public.subjects (
  subject_type,
  display_name,
  email,
  phone,
  is_tenant,
  -- Person fields
  title_before,
  first_name,
  last_name,
  birth_date,
  personal_id_number,
  id_doc_type,
  id_doc_number,
  -- Address
  street,
  house_number,
  city,
  zip,
  country,
  -- Origin
  origin_module,
  -- Poznámka
  note,
  is_archived
) VALUES 
(
  'osoba',
  'Petr Dvořák',
  'petr.dvorak@test.cz',
  '+420 606 111 222',
  true,
  -- Person fields
  NULL,
  'Petr',
  'Dvořák',
  '1995-03-10',
  '9503102345',
  'OP',
  'EF111222',
  -- Address
  'Krátká',
  '12',
  'Praha',
  '13000',
  'CZ',
  -- Origin
  '050',
  -- Poznámka
  'Testovací nájemník - osoba #1',
  false
),
(
  'osoba',
  'Eva Horáková',
  'eva.horakova@test.cz',
  '+420 606 222 333',
  true,
  -- Person fields
  NULL,
  'Eva',
  'Horáková',
  '1992-07-25',
  '9207255678',
  'OP',
  'GH333444',
  -- Address
  'Zahradní',
  '34',
  'Brno',
  '61200',
  'CZ',
  -- Origin
  '050',
  -- Poznámka
  'Testovací nájemník - osoba #2',
  false
);

-- 2x OSVČ
INSERT INTO public.subjects (
  subject_type,
  display_name,
  email,
  phone,
  is_tenant,
  -- Person fields
  title_before,
  first_name,
  last_name,
  birth_date,
  personal_id_number,
  id_doc_type,
  id_doc_number,
  -- Company fields
  company_name,
  ic,
  dic,
  ic_valid,
  dic_valid,
  -- Address
  street,
  house_number,
  city,
  zip,
  country,
  -- Origin
  origin_module,
  -- Poznámka
  note,
  is_archived
) VALUES 
(
  'osvc',
  'Tomáš Černý - OSVČ',
  'tomas.cerny.osvc@test.cz',
  '+420 606 333 444',
  true,
  -- Person fields
  'Mgr.',
  'Tomáš',
  'Černý',
  '1988-11-05',
  '8811056789',
  'OP',
  'IJ555666',
  -- Company fields
  'Tomáš Černý - grafické studio',
  '11223344',
  'CZ11223344',
  true,
  true,
  -- Address
  'Nová',
  '56',
  'Ostrava',
  '70200',
  'CZ',
  -- Origin
  '050',
  -- Poznámka
  'Testovací nájemník - OSVČ #1',
  false
),
(
  'osvc',
  'Lucie Malá - OSVČ',
  'lucie.mala.osvc@test.cz',
  '+420 606 444 555',
  true,
  -- Person fields
  NULL,
  'Lucie',
  'Malá',
  '1993-04-18',
  '9304185432',
  'OP',
  'KL777888',
  -- Company fields
  'Lucie Malá - kosmetické služby',
  '22334455',
  'CZ22334455',
  true,
  true,
  -- Address
  'Jižní',
  '78',
  'Plzeň',
  '30100',
  'CZ',
  -- Origin
  '050',
  -- Poznámka
  'Testovací nájemník - OSVČ #2',
  false
);

-- 2x FIRMA
INSERT INTO public.subjects (
  subject_type,
  display_name,
  email,
  phone,
  is_tenant,
  -- Company fields
  company_name,
  ic,
  dic,
  ic_valid,
  dic_valid,
  -- Address
  street,
  house_number,
  city,
  zip,
  country,
  -- Origin
  origin_module,
  -- Poznámka
  note,
  is_archived
) VALUES 
(
  'firma',
  'IT Solutions s.r.o.',
  'info@itsolutions.cz',
  '+420 606 555 666',
  true,
  -- Company fields
  'IT Solutions s.r.o.',
  '33445566',
  'CZ33445566',
  true,
  true,
  -- Address
  'Průmyslová',
  '90',
  'Praha',
  '14000',
  'CZ',
  -- Origin
  '050',
  -- Poznámka
  'Testovací nájemník - firma #1',
  false
),
(
  'firma',
  'Design Studio a.s.',
  'kontakt@designstudio.cz',
  '+420 606 666 777',
  true,
  -- Company fields
  'Design Studio a.s.',
  '44556677',
  'CZ44556677',
  true,
  true,
  -- Address
  'Umělecká',
  '12',
  'Brno',
  '60200',
  'CZ',
  -- Origin
  '050',
  -- Poznámka
  'Testovací nájemník - firma #2',
  false
);

-- 2x SPOLEK
INSERT INTO public.subjects (
  subject_type,
  display_name,
  email,
  phone,
  is_tenant,
  -- Company fields
  company_name,
  ic,
  dic,
  ic_valid,
  dic_valid,
  -- Address
  street,
  house_number,
  city,
  zip,
  country,
  -- Origin
  origin_module,
  -- Poznámka
  note,
  is_archived
) VALUES 
(
  'spolek',
  'Klub turistů',
  'info@klubtouristu.cz',
  '+420 606 777 888',
  true,
  -- Company fields
  'Klub turistů, z.s.',
  '55667788',
  'CZ55667788',
  true,
  true,
  -- Address
  'Horská',
  '34',
  'Liberec',
  '46001',
  'CZ',
  -- Origin
  '050',
  -- Poznámka
  'Testovací nájemník - spolek #1',
  false
),
(
  'spolek',
  'Sportovní klub Sokol',
  'info@sokol.cz',
  '+420 606 888 999',
  true,
  -- Company fields
  'Sportovní klub Sokol, z.s.',
  '66778899',
  'CZ66778899',
  true,
  true,
  -- Address
  'Sokolská',
  '56',
  'České Budějovice',
  '37001',
  'CZ',
  -- Origin
  '050',
  -- Poznámka
  'Testovací nájemník - spolek #2',
  false
);

-- 2x STÁTNÍ INSTITUCE
INSERT INTO public.subjects (
  subject_type,
  display_name,
  email,
  phone,
  is_tenant,
  -- Company fields
  company_name,
  ic,
  dic,
  ic_valid,
  dic_valid,
  -- Address
  street,
  house_number,
  city,
  zip,
  country,
  -- Origin
  origin_module,
  -- Poznámka
  note,
  is_archived
) VALUES 
(
  'statni',
  'Městský úřad Štětí',
  'urad@mestosteti.cz',
  '+420 606 000 111',
  true,
  -- Company fields
  'Městský úřad Štětí',
  '00263958',
  NULL,
  true,
  NULL,
  -- Address
  'Mírové náměstí',
  '1',
  'Štětí',
  '41108',
  'CZ',
  -- Origin
  '050',
  -- Poznámka
  'Testovací nájemník - státní instituce #1',
  false
),
(
  'statni',
  'Krajský úřad Ústeckého kraje',
  'posta@kr-ustecky.cz',
  '+420 606 000 222',
  true,
  -- Company fields
  'Krajský úřad Ústeckého kraje',
  '70892156',
  NULL,
  true,
  NULL,
  -- Address
  'Velká Hradební',
  '3118/48',
  'Ústí nad Labem',
  '40001',
  'CZ',
  -- Origin
  '050',
  -- Poznámka
  'Testovací nájemník - státní instituce #2',
  false
);

-- 2x ZÁSTUPCE
INSERT INTO public.subjects (
  subject_type,
  display_name,
  email,
  phone,
  is_tenant,
  -- Person fields
  title_before,
  first_name,
  last_name,
  birth_date,
  personal_id_number,
  id_doc_type,
  id_doc_number,
  -- Address
  street,
  house_number,
  city,
  zip,
  country,
  -- Origin
  origin_module,
  -- Poznámka
  note,
  is_archived
) VALUES 
(
  'zastupce',
  'Karel Novotný - zástupce',
  'karel.novotny@zastupce.cz',
  '+420 606 111 000',
  true,
  -- Person fields
  'JUDr.',
  'Karel',
  'Novotný',
  '1975-02-14',
  '7502146789',
  'OP',
  'MN111222',
  -- Address
  'Právnická',
  '90',
  'Praha',
  '11000',
  'CZ',
  -- Origin
  '050',
  -- Poznámka
  'Testovací nájemník - zástupce #1 (právní zástupce)',
  false
),
(
  'zastupce',
  'Jana Procházková - zástupce',
  'jana.prochazkova@zastupce.cz',
  '+420 606 222 000',
  true,
  -- Person fields
  'Mgr.',
  'Jana',
  'Procházková',
  '1982-09-08',
  '8209085432',
  'OP',
  'OP333444',
  -- Address
  'Zastupitelská',
  '12',
  'Brno',
  '60200',
  'CZ',
  -- Origin
  '050',
  -- Poznámka
  'Testovací nájemník - zástupce #2 (finanční zástupce)',
  false
);

-- Závěrečný přehled
-- Celkem vytvořeno 12 testovacích nájemníků:
-- - 2x osoba (fyzická osoba bez IČ)
-- - 2x osvc (OSVČ s IČ)
-- - 2x firma (s.r.o., a.s.)
-- - 2x spolek (z.s.)
-- - 2x statni (státní instituce)
-- - 2x zastupce (právní/finanční zástupce)
