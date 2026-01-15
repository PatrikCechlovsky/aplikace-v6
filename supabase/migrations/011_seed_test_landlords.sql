-- Migration: Testovací pronajimatele
-- Date: 2026-01-15
-- Purpose: Vytvoření testovacích pronajímatelů různých typů pro vývoj a testování

-- 2x OSVČ
INSERT INTO public.subjects (
  subject_type,
  display_name,
  email,
  phone,
  is_landlord,
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
  -- Poznámka
  note,
  is_archived
) VALUES 
(
  'osvc',
  'Jan Novák - OSVČ',
  'jan.novak.osvc@test.cz',
  '+420 777 111 222',
  true,
  -- Person fields
  'Ing.',
  'Jan',
  'Novák',
  '1985-05-15',
  '8505156789',
  'OP',
  'AB123456',
  -- Company fields
  'Jan Novák - elektrikářské práce',
  '12345678',
  'CZ12345678',
  true,
  true,
  -- Address
  'Hlavní',
  '123',
  'Praha',
  '11000',
  'CZ',
  -- Poznámka
  'Testovací OSVČ pronajímatel #1',
  false
),
(
  'osvc',
  'Marie Svobodová - OSVČ',
  'marie.svobodova.osvc@test.cz',
  '+420 777 222 333',
  true,
  -- Person fields
  'Bc.',
  'Marie',
  'Svobodová',
  '1990-08-20',
  '9008205432',
  'OP',
  'CD987654',
  -- Company fields
  'Marie Svobodová - účetní služby',
  '87654321',
  'CZ87654321',
  true,
  true,
  -- Address
  'Krátká',
  '45',
  'Brno',
  '60200',
  'CZ',
  -- Poznámka
  'Testovací OSVČ pronajímatel #2',
  false
);

-- 2x Spolek
INSERT INTO public.subjects (
  subject_type,
  display_name,
  email,
  phone,
  is_landlord,
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
  -- Poznámka
  note,
  is_archived
) VALUES 
(
  'spolek',
  'Spolek přátel architektury',
  'info@architektura-spolek.cz',
  '+420 777 333 444',
  true,
  -- Company fields
  'Spolek přátel architektury, z.s.',
  '23456789',
  'CZ23456789',
  true,
  true,
  -- Address
  'Dlouhá',
  '67',
  'Praha',
  '11000',
  'CZ',
  -- Poznámka
  'Testovací spolek pronajímatel #1',
  false
),
(
  'spolek',
  'Český zahrádkářský svaz',
  'info@zahradkari.cz',
  '+420 777 444 555',
  true,
  -- Company fields
  'Český zahrádkářský svaz, z.s.',
  '34567890',
  'CZ34567890',
  true,
  true,
  -- Address
  'Zahradní',
  '89',
  'Olomouc',
  '77200',
  'CZ',
  -- Poznámka
  'Testovací spolek pronajímatel #2',
  false
);

-- 2x Zástupce
INSERT INTO public.subjects (
  subject_type,
  display_name,
  email,
  phone,
  is_landlord,
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
  -- Poznámka
  note,
  is_archived
) VALUES 
(
  'zastupce',
  'Petr Dvořák - Zástupce',
  'petr.dvorak@test.cz',
  '+420 777 555 666',
  true,
  -- Person fields
  'Mgr.',
  'Petr',
  'Dvořák',
  '1982-03-10',
  '8203105678',
  'OP',
  'EF456789',
  -- Address
  'Nová',
  '12',
  'Ostrava',
  '70200',
  'CZ',
  -- Poznámka
  'Testovací zástupce pronajímatel #1',
  false
),
(
  'zastupce',
  'Eva Procházková - Zástupce',
  'eva.prochazkova@test.cz',
  '+420 777 666 777',
  true,
  -- Person fields
  NULL,
  'Eva',
  'Procházková',
  '1995-11-25',
  '9511254321',
  'PAS',
  'GH123456',
  -- Address
  'Stará',
  '34',
  'Plzeň',
  '30100',
  'CZ',
  -- Poznámka
  'Testovací zástupce pronajímatel #2',
  false
);

-- 2x Státní
INSERT INTO public.subjects (
  subject_type,
  display_name,
  email,
  phone,
  is_landlord,
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
  -- Poznámka
  note,
  is_archived
) VALUES 
(
  'statni',
  'Magistrát města Prahy',
  'magistrat@praha.cz',
  '+420 777 777 888',
  true,
  -- Company fields
  'Hlavní město Praha',
  '00064581',
  'CZ00064581',
  true,
  true,
  -- Address
  'Mariánské náměstí',
  '2',
  'Praha 1',
  '11001',
  'CZ',
  -- Poznámka
  'Testovací státní subjekt pronajímatel #1',
  false
),
(
  'statni',
  'Český úřad zeměměřický',
  'info@cuzk.cz',
  '+420 777 888 999',
  true,
  -- Company fields
  'Český úřad zeměměřický a katastrální',
  '00025712',
  'CZ00025712',
  true,
  true,
  -- Address
  'Pod Sídlištěm',
  '1800',
  'Praha 8',
  '18211',
  'CZ',
  -- Poznámka
  'Testovací státní subjekt pronajímatel #2',
  false
);

-- Výpis vložených záznamů
SELECT 
  id,
  subject_type,
  display_name,
  company_name,
  CONCAT(first_name, ' ', last_name) as full_name,
  email,
  city
FROM public.subjects
WHERE email LIKE '%@test.cz' OR email LIKE '%@praha.cz' OR email LIKE '%@cuzk.cz' OR email LIKE '%spolek.cz'
ORDER BY subject_type, display_name;
