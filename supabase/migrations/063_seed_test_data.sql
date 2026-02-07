-- Migration: Testovací nemovitosti a jednotky
-- Date: 2026-01-18
-- Purpose: Vytvoření testovacích nemovitostí a jednotek pro vývoj a testování
--          2x každý typ nemovitosti (12 properties) + 2x každý typ jednotky (12 units)

-- ============================================================================
-- HELPER: Get landlord IDs
-- ============================================================================

DO $$
DECLARE
  landlord1_id UUID;
  landlord2_id UUID;
  
  -- Property type IDs
  typ_rodinny_dum UUID;
  typ_bytovy_dum UUID;
  typ_byt UUID;
  typ_garaz UUID;
  typ_komercni UUID;
  typ_pozemek UUID;
  
  -- Unit type IDs
  typ_unit_byt TEXT;
  typ_unit_pokoj TEXT;
  typ_unit_garaz TEXT;
  typ_unit_dilna TEXT;
  typ_unit_kancelar TEXT;
  typ_unit_sklad TEXT;
  
  -- Created property IDs (for units)
  prop_rodinny1_id UUID;
  prop_rodinny2_id UUID;
  prop_bytovy1_id UUID;
  prop_bytovy2_id UUID;
  prop_byt1_id UUID;
  prop_byt2_id UUID;
  prop_komercni1_id UUID;
  prop_komercni2_id UUID;
  
BEGIN
  -- Get test landlords
  SELECT id INTO landlord1_id FROM public.subjects 
  WHERE email = 'jan.novak.osvc@test.cz' LIMIT 1;
  
  SELECT id INTO landlord2_id FROM public.subjects 
  WHERE email = 'marie.svobodova.osvc@test.cz' LIMIT 1;
  
  -- Get property type IDs (UUID from property_types)
  SELECT id INTO typ_rodinny_dum FROM public.property_types 
  WHERE code = 'rodinny_dum' LIMIT 1;
  
  SELECT id INTO typ_bytovy_dum FROM public.property_types 
  WHERE code = 'bytovy_dum' LIMIT 1;
  
  SELECT id INTO typ_byt FROM public.property_types 
  WHERE code = 'jiny_objekt' LIMIT 1;
  
  SELECT id INTO typ_garaz FROM public.property_types 
  WHERE code = 'jiny_objekt' LIMIT 1;
  
  SELECT id INTO typ_komercni FROM public.property_types 
  WHERE code = 'admin_budova' LIMIT 1;
  
  SELECT id INTO typ_pozemek FROM public.property_types 
  WHERE code = 'pozemek' LIMIT 1;
  
  -- Unit type codes (TEXT - direct reference)
  typ_unit_byt := 'byt';
  typ_unit_pokoj := 'jina_jednotka';
  typ_unit_garaz := 'garaz';
  typ_unit_dilna := 'jina_jednotka';
  typ_unit_kancelar := 'kancelar';
  typ_unit_sklad := 'sklad';

-- ============================================================================
-- PROPERTIES (12 records - 2x each type)
-- ============================================================================

-- 1. Rodinný dům #1
INSERT INTO public.properties (
  landlord_id, property_type_id, display_name, internal_code,
  street, house_number, city, zip, country, region,
  land_area, built_up_area, building_area, number_of_floors,
  build_year, reconstruction_year,
  cadastral_area, parcel_number, lv_number,
  note, is_archived
) VALUES (
  landlord1_id, typ_rodinny_dum, 'Rodinný dům Horní Počernice', 'RD-HP-001',
  'Náchodská', '15', 'Praha', '19300', 'CZ', 'PHA',
  850.00, 120.00, 180.00, 2,
  1998, 2018,
  'Horní Počernice', '123/45', 'LV-1234',
  'Rodinný dům s garáží, zahrada 850 m²', false
)
RETURNING id INTO prop_rodinny1_id;

-- 2. Rodinný dům #2
INSERT INTO public.properties (
  landlord_id, property_type_id, display_name, internal_code,
  street, house_number, city, zip, country, region,
  land_area, built_up_area, building_area, number_of_floors,
  build_year, reconstruction_year,
  cadastral_area, parcel_number, lv_number,
  note, is_archived
) VALUES (
  landlord2_id, typ_rodinny_dum, 'Vila Střešovice', 'RD-STR-002',
  'Patočkova', '88', 'Praha', '16000', 'CZ', 'PHA',
  1200.00, 200.00, 320.00, 3,
  2005, NULL,
  'Střešovice', '678/90', 'LV-5678',
  'Luxusní vila se třemi podlažími a výhledem', false
)
RETURNING id INTO prop_rodinny2_id;

-- 3. Bytový dům #1
INSERT INTO public.properties (
  landlord_id, property_type_id, display_name, internal_code,
  street, house_number, city, zip, country, region,
  land_area, built_up_area, building_area, number_of_floors,
  build_year, reconstruction_year,
  cadastral_area, parcel_number, lv_number,
  note, is_archived
) VALUES (
  landlord1_id, typ_bytovy_dum, 'Bytový dům Vinohrady', 'BD-VIN-001',
  'Korunní', '42', 'Praha', '12000', 'CZ', 'PHA',
  600.00, 400.00, 1800.00, 5,
  1936, 2015,
  'Vinohrady', '234/56', 'LV-2345',
  'Cihlový bytový dům s 12 byty', false
)
RETURNING id INTO prop_bytovy1_id;

-- 4. Bytový dům #2
INSERT INTO public.properties (
  landlord_id, property_type_id, display_name, internal_code,
  street, house_number, city, zip, country, region,
  land_area, built_up_area, building_area, number_of_floors,
  build_year, reconstruction_year,
  cadastral_area, parcel_number, lv_number,
  note, is_archived
) VALUES (
  landlord2_id, typ_bytovy_dum, 'Rezidence Letná', 'BD-LET-002',
  'Milady Horákové', '123', 'Praha', '17000', 'CZ', 'PHA',
  800.00, 500.00, 2400.00, 6,
  2020, NULL,
  'Bubeneč', '789/12', 'LV-7890',
  'Moderní bytový dům s 18 byty a výtahem', false
)
RETURNING id INTO prop_bytovy2_id;

-- 5. Byt #1
INSERT INTO public.properties (
  landlord_id, property_type_id, display_name, internal_code,
  street, house_number, city, zip, country, region,
  land_area, built_up_area, building_area, number_of_floors,
  build_year, reconstruction_year,
  cadastral_area, parcel_number, lv_number,
  note, is_archived
) VALUES (
  landlord1_id, typ_byt, 'Byt 3+1 Karlín', 'BYT-KAR-001',
  'Thámova', '17', 'Praha', '18600', 'CZ', 'PHA',
  NULL, NULL, 85.00, NULL,
  2010, NULL,
  'Karlín', '345/67', 'LV-3456',
  '3+1, 4. patro, balkon, šikovná dispozice', false
)
RETURNING id INTO prop_byt1_id;

-- 6. Byt #2
INSERT INTO public.properties (
  landlord_id, property_type_id, display_name, internal_code,
  street, house_number, city, zip, country, region,
  land_area, built_up_area, building_area, number_of_floors,
  build_year, reconstruction_year,
  cadastral_area, parcel_number, lv_number,
  note, is_archived
) VALUES (
  landlord2_id, typ_byt, 'Byt 2+kk Smíchov', 'BYT-SMI-002',
  'Plzeňská', '56', 'Praha', '15000', 'CZ', 'PHA',
  NULL, NULL, 52.00, NULL,
  2018, NULL,
  'Smíchov', '456/78', 'LV-4567',
  '2+kk, 2. patro, nová výstavba, parkovací místo', false
)
RETURNING id INTO prop_byt2_id;

-- 7. Garáž #1
INSERT INTO public.properties (
  landlord_id, property_type_id, display_name, internal_code,
  street, house_number, city, zip, country, region,
  land_area, built_up_area, building_area, number_of_floors,
  build_year, reconstruction_year,
  cadastral_area, parcel_number, lv_number,
  note, is_archived
) VALUES (
  landlord1_id, typ_garaz, 'Garáž Strašnice', 'GAR-STR-001',
  'Průmyslová', '8', 'Praha', '10000', 'CZ', 'PHA',
  NULL, 20.00, 20.00, 1,
  1985, 2010,
  'Strašnice', '567/89', 'LV-5678',
  'Samostatná zděná garáž, elektřina', false
);

-- 8. Garáž #2
INSERT INTO public.properties (
  landlord_id, property_type_id, display_name, internal_code,
  street, house_number, city, zip, country, region,
  land_area, built_up_area, building_area, number_of_floors,
  build_year, reconstruction_year,
  cadastral_area, parcel_number, lv_number,
  note, is_archived
) VALUES (
  landlord2_id, typ_garaz, 'Garážové stání Nové Butovice', 'GAR-BUT-002',
  'Radlická', '180', 'Praha', '15800', 'CZ', 'PHA',
  NULL, 15.00, 15.00, 1,
  2015, NULL,
  'Jinonice', '678/90', 'LV-6789',
  'Venkovní krytá stání, betonová', false
);

-- 9. Komerční prostor #1
INSERT INTO public.properties (
  landlord_id, property_type_id, display_name, internal_code,
  street, house_number, city, zip, country, region,
  land_area, built_up_area, building_area, number_of_floors,
  build_year, reconstruction_year,
  cadastral_area, parcel_number, lv_number,
  note, is_archived
) VALUES (
  landlord1_id, typ_komercni, 'Obchodní prostory Anděl', 'KOM-AND-001',
  'Nádražní', '25', 'Praha', '15000', 'CZ', 'PHA',
  NULL, 180.00, 180.00, 1,
  2008, 2019,
  'Smíchov', '789/12', 'LV-7891',
  'Prostory vhodné pro obchod nebo služby, přízemí', false
)
RETURNING id INTO prop_komercni1_id;

-- 10. Komerční prostor #2
INSERT INTO public.properties (
  landlord_id, property_type_id, display_name, internal_code,
  street, house_number, city, zip, country, region,
  land_area, built_up_area, building_area, number_of_floors,
  build_year, reconstruction_year,
  cadastral_area, parcel_number, lv_number,
  note, is_archived
) VALUES (
  landlord2_id, typ_komercni, 'Kanceláře Pankrác', 'KOM-PAN-002',
  'Na Pankráci', '86', 'Praha', '14000', 'CZ', 'PHA',
  NULL, 250.00, 250.00, 1,
  2012, NULL,
  'Nusle', '890/23', 'LV-8902',
  'Moderní kancelářské prostory, klimatizace, internet', false
)
RETURNING id INTO prop_komercni2_id;

-- 11. Pozemek #1
INSERT INTO public.properties (
  landlord_id, property_type_id, display_name, internal_code,
  street, house_number, city, zip, country, region,
  land_area, built_up_area, building_area, number_of_floors,
  build_year, reconstruction_year,
  cadastral_area, parcel_number, lv_number,
  note, is_archived
) VALUES (
  landlord1_id, typ_pozemek, 'Stavební pozemek Čakovice', 'POZ-CAK-001',
  'Ke Kašně', 'bez čp', 'Praha', '19600', 'CZ', 'PHA',
  1500.00, NULL, NULL, NULL,
  NULL, NULL,
  'Čakovice', '901/34', 'LV-9013',
  'Stavební pozemek pro RD, inženýrské sítě v dosahu', false
);

-- 12. Pozemek #2
INSERT INTO public.properties (
  landlord_id, property_type_id, display_name, internal_code,
  street, house_number, city, zip, country, region,
  land_area, built_up_area, building_area, number_of_floors,
  build_year, reconstruction_year,
  cadastral_area, parcel_number, lv_number,
  note, is_archived
) VALUES (
  landlord2_id, typ_pozemek, 'Orná půda Říčany', 'POZ-RIC-002',
  NULL, NULL, 'Říčany', '25101', 'CZ', 'STC',
  8000.00, NULL, NULL, NULL,
  NULL, NULL,
  'Říčany', '012/45', 'LV-0124',
  'Zemědělský pozemek, orná půda', false
);

-- ============================================================================
-- UNITS (12 records - 2x each type)
-- ============================================================================

-- 1. Byt #1 (v bytovém domě Vinohrady)
INSERT INTO public.units (
  property_id, unit_type_id, display_name, internal_code,
  street, house_number, city, zip, country, region,
  floor, door_number, area, rooms, status,
  note, is_archived
) VALUES (
  prop_bytovy1_id, typ_unit_byt, 'Byt 2+1, 3. patro', 'VIN-301',
  'Korunní', '42', 'Praha', '12000', 'CZ', 'PHA',
  3, '301', 65.00, 2.0, 'occupied',
  'Byt s balkonem, orientace jih', false
);

-- 2. Byt #2 (v bytovém domě Letná)
INSERT INTO public.units (
  property_id, unit_type_id, display_name, internal_code,
  street, house_number, city, zip, country, region,
  floor, door_number, area, rooms, status,
  note, is_archived
) VALUES (
  prop_bytovy2_id, typ_unit_byt, 'Byt 3+kk, 5. patro', 'LET-501',
  'Milady Horákové', '123', 'Praha', '17000', 'CZ', 'PHA',
  5, '501', 82.00, 3.0, 'available',
  'Nový byt, velký balkon, výhled na park', false
);

-- 3. Pokoj #1 (v rodinném domě)
INSERT INTO public.units (
  property_id, unit_type_id, display_name, internal_code,
  street, house_number, city, zip, country, region,
  floor, door_number, area, rooms, status,
  note, is_archived
) VALUES (
  prop_rodinny1_id, typ_unit_pokoj, 'Pokoj pro studenta', 'HP-P01',
  'Náchodská', '15', 'Praha', '19300', 'CZ', 'PHA',
  1, NULL, 18.00, 1.0, 'available',
  'Pokoj s kuchyňkou, vlastní WC', false
);

-- 4. Pokoj #2 (v rodinném domě)
INSERT INTO public.units (
  property_id, unit_type_id, display_name, internal_code,
  street, house_number, city, zip, country, region,
  floor, door_number, area, rooms, status,
  note, is_archived
) VALUES (
  prop_rodinny2_id, typ_unit_pokoj, 'Podkrovní pokoj', 'STR-P02',
  'Patočkova', '88', 'Praha', '16000', 'CZ', 'PHA',
  2, NULL, 22.00, 1.0, 'reserved',
  'Velký podkrovní pokoj, vlastní koupelna', false
);

-- 5. Garáž #1 (součást bytového domu)
INSERT INTO public.units (
  property_id, unit_type_id, display_name, internal_code,
  street, house_number, city, zip, country, region,
  floor, door_number, area, rooms, status,
  note, is_archived
) VALUES (
  prop_bytovy1_id, typ_unit_garaz, 'Garáž G12', 'VIN-G12',
  'Korunní', '42', 'Praha', '12000', 'CZ', 'PHA',
  -1, 'G12', 15.00, NULL, 'occupied',
  'Podzemní garáž, přístup výtahem', false
);

-- 6. Garáž #2 (součást bytového domu)
INSERT INTO public.units (
  property_id, unit_type_id, display_name, internal_code,
  street, house_number, city, zip, country, region,
  floor, door_number, area, rooms, status,
  note, is_archived
) VALUES (
  prop_bytovy2_id, typ_unit_garaz, 'Garáž G25', 'LET-G25',
  'Milady Horákové', '123', 'Praha', '17000', 'CZ', 'PHA',
  -1, 'G25', 18.00, NULL, 'available',
  'Podzemní garáž, vjezd automatickou branou', false
);

-- 7. Dílna #1 (součást RD)
INSERT INTO public.units (
  property_id, unit_type_id, display_name, internal_code,
  street, house_number, city, zip, country, region,
  floor, door_number, area, rooms, status,
  note, is_archived
) VALUES (
  prop_rodinny1_id, typ_unit_dilna, 'Dílna v přízemí', 'HP-D01',
  'Náchodská', '15', 'Praha', '19300', 'CZ', 'PHA',
  0, NULL, 25.00, NULL, 'renovation',
  'Dílna s pracovním stolem a regály', false
);

-- 8. Dílna #2 (součást RD)
INSERT INTO public.units (
  property_id, unit_type_id, display_name, internal_code,
  street, house_number, city, zip, country, region,
  floor, door_number, area, rooms, status,
  note, is_archived
) VALUES (
  prop_rodinny2_id, typ_unit_dilna, 'Truhlářská dílna', 'STR-D02',
  'Patočkova', '88', 'Praha', '16000', 'CZ', 'PHA',
  0, NULL, 35.00, NULL, 'available',
  'Prostorná dílna s vlastním vstupem', false
);

-- 9. Kancelář #1 (v komerčním prostoru)
INSERT INTO public.units (
  property_id, unit_type_id, display_name, internal_code,
  street, house_number, city, zip, country, region,
  floor, door_number, area, rooms, status,
  note, is_archived
) VALUES (
  prop_komercni1_id, typ_unit_kancelar, 'Kancelář 1A', 'KOM-K1A',
  'Nádražní', '25', 'Praha', '15000', 'CZ', 'PHA',
  1, '1A', 45.00, 2.0, 'occupied',
  'Kancelář pro 4 osoby, klimatizace', false
);

-- 10. Kancelář #2 (v komerčním prostoru)
INSERT INTO public.units (
  property_id, unit_type_id, display_name, internal_code,
  street, house_number, city, zip, country, region,
  floor, door_number, area, rooms, status,
  note, is_archived
) VALUES (
  prop_komercni2_id, typ_unit_kancelar, 'Kancelář 2B', 'KOM-K2B',
  'Na Pankráci', '86', 'Praha', '14000', 'CZ', 'PHA',
  2, '2B', 60.00, 3.0, 'available',
  'Open space kancelář, internet 1Gb/s', false
);

-- 11. Sklad #1 (v bytovém domě)
INSERT INTO public.units (
  property_id, unit_type_id, display_name, internal_code,
  street, house_number, city, zip, country, region,
  floor, door_number, area, rooms, status,
  note, is_archived
) VALUES (
  prop_bytovy1_id, typ_unit_sklad, 'Sklep S08', 'VIN-S08',
  'Korunní', '42', 'Praha', '12000', 'CZ', 'PHA',
  -1, 'S08', 8.00, NULL, 'occupied',
  'Sklep k bytu 301', false
);

-- 12. Sklad #2 (v bytovém domě)
INSERT INTO public.units (
  property_id, unit_type_id, display_name, internal_code,
  street, house_number, city, zip, country, region,
  floor, door_number, area, rooms, status,
  note, is_archived
) VALUES (
  prop_bytovy2_id, typ_unit_sklad, 'Komora K15', 'LET-K15',
  'Milady Horákové', '123', 'Praha', '17000', 'CZ', 'PHA',
  0, 'K15', 6.00, NULL, 'available',
  'Sklepní komora v přízemí', false
);

END $$;
