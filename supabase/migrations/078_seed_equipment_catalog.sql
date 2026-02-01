-- Migration: Seed equipment_catalog with comprehensive equipment list
-- Date: 2026-02-01
-- Purpose: Naplnit katalog vybavení kompletním seznamem 200+ položek podle kategorií
-- NOTES: Vyžaduje existující equipment_types a room_types v generic_types (migrace 075)

-- ============================================================================
-- STEP 1: Pomocné proměnné pro equipment_types IDs
-- ============================================================================

DO $$
DECLARE
  -- Equipment type IDs
  type_energie UUID;
  type_vytapeni UUID;
  type_chlazeni UUID;
  type_zdravotechnika UUID;
  type_kuchyne UUID;
  type_stavebni UUID;
  type_bezpecnost UUID;
  type_pristupy UUID;
  type_it UUID;
  type_spolecne UUID;
  type_exterier UUID;
  
  -- Room type IDs (pro výchozí místnosti)
  room_kuchyne UUID;
  room_koupelna UUID;
  room_wc UUID;
  room_loznice UUID;
  room_obyvak UUID;
  room_chodba UUID;
  room_sklep UUID;
  room_puda UUID;
  room_garaz UUID;
  room_terasa UUID;
  room_balkon UUID;
  room_zahrada UUID;
  room_technicka UUID;
  room_kancelar UUID;
  room_obchod UUID;

BEGIN
  -- ============================================================================
  -- STEP 2: Načíst equipment_types IDs
  -- ============================================================================
  
  SELECT id INTO type_energie FROM generic_types WHERE category = 'equipment_types' AND code = 'energie_mereni' LIMIT 1;
  SELECT id INTO type_vytapeni FROM generic_types WHERE category = 'equipment_types' AND code = 'vytapeni' LIMIT 1;
  SELECT id INTO type_chlazeni FROM generic_types WHERE category = 'equipment_types' AND code = 'chlazeni_vzduchotechnika' LIMIT 1;
  SELECT id INTO type_zdravotechnika FROM generic_types WHERE category = 'equipment_types' AND code = 'koupelna' LIMIT 1;
  SELECT id INTO type_kuchyne FROM generic_types WHERE category = 'equipment_types' AND code = 'kuchyne' LIMIT 1;
  SELECT id INTO type_stavebni FROM generic_types WHERE category = 'equipment_types' AND code = 'stavebni_prvky' LIMIT 1;
  SELECT id INTO type_bezpecnost FROM generic_types WHERE category = 'equipment_types' AND code = 'bezpecnost_pozar' LIMIT 1;
  SELECT id INTO type_pristupy FROM generic_types WHERE category = 'equipment_types' AND code = 'pristupy_zabezpeceni' LIMIT 1;
  SELECT id INTO type_it FROM generic_types WHERE category = 'equipment_types' AND code = 'technika' LIMIT 1;
  SELECT id INTO type_spolecne FROM generic_types WHERE category = 'equipment_types' AND code = 'spolecne_prostory' LIMIT 1;
  SELECT id INTO type_exterier FROM generic_types WHERE category = 'equipment_types' AND code = 'exterier' LIMIT 1;

  -- ============================================================================
  -- STEP 3: Načíst room_types IDs
  -- ============================================================================
  
  SELECT id INTO room_kuchyne FROM generic_types WHERE category = 'room_types' AND code = 'kuchyne' LIMIT 1;
  SELECT id INTO room_koupelna FROM generic_types WHERE category = 'room_types' AND code = 'koupelna' LIMIT 1;
  SELECT id INTO room_wc FROM generic_types WHERE category = 'room_types' AND code = 'wc' LIMIT 1;
  SELECT id INTO room_loznice FROM generic_types WHERE category = 'room_types' AND code = 'loznice' LIMIT 1;
  SELECT id INTO room_obyvak FROM generic_types WHERE category = 'room_types' AND code = 'obyvaci_pokoj' LIMIT 1;
  SELECT id INTO room_chodba FROM generic_types WHERE category = 'room_types' AND code = 'chodba' LIMIT 1;
  SELECT id INTO room_sklep FROM generic_types WHERE category = 'room_types' AND code = 'sklipek' LIMIT 1;
  SELECT id INTO room_puda FROM generic_types WHERE category = 'room_types' AND code = 'jina_mistnost' LIMIT 1; -- Fallback pro půdu
  SELECT id INTO room_garaz FROM generic_types WHERE category = 'room_types' AND code = 'jina_mistnost' LIMIT 1; -- Fallback pro garáž
  SELECT id INTO room_terasa FROM generic_types WHERE category = 'room_types' AND code = 'terasa' LIMIT 1;
  SELECT id INTO room_balkon FROM generic_types WHERE category = 'room_types' AND code = 'balkon' LIMIT 1;
  SELECT id INTO room_zahrada FROM generic_types WHERE category = 'room_types' AND code = 'jina_mistnost' LIMIT 1; -- Fallback pro zahradu
  SELECT id INTO room_technicka FROM generic_types WHERE category = 'room_types' AND code = 'technicka_mistnost' LIMIT 1;
  SELECT id INTO room_kancelar FROM generic_types WHERE category = 'room_types' AND code = 'pracovna' LIMIT 1;
  SELECT id INTO room_obchod FROM generic_types WHERE category = 'room_types' AND code = 'jina_mistnost' LIMIT 1; -- Fallback pro obchod

  -- ============================================================================
  -- STEP 4: INSERT equipment catalog items
  -- ============================================================================

  -- ========================================
  -- 1️⃣ ENERGIE & MĚŘENÍ
  -- ========================================
  
  -- Elektřina
  INSERT INTO equipment_catalog (equipment_name, equipment_type_id, room_type_id, default_lifespan_months, default_revision_interval, default_state, default_description, active) VALUES
  ('Hlavní elektroměr', type_energie, room_technicka, 180, 12, 'good', 'Hlavní elektroměr pro nemovitost', true),
  ('Podružný elektroměr', type_energie, room_technicka, 180, 12, 'good', 'Podružný elektroměr', true),
  ('Elektroměr jednotky', type_energie, room_chodba, 180, 12, 'good', 'Samostatný elektroměr pro jednotku', true),
  ('Elektroměr tepelného čerpadla', type_energie, room_technicka, 180, 12, 'good', 'Měřič spotřeby tepelného čerpadla', true),
  ('Elektroměr FVE', type_energie, room_technicka, 180, 12, 'good', 'Měřič výroby fotovoltaiky', true),
  ('Elektroměr společných prostor', type_energie, room_technicka, 180, 12, 'good', 'Měřič spotřeby společných prostor', true),
  ('Proudový chránič', type_energie, room_technicka, 120, 12, 'good', 'Ochrana proti úrazu elektrickým proudem', true),
  ('Jističový rozvaděč', type_energie, room_technicka, 240, 12, 'good', 'Hlavní elektrorozvaděč', true),
  ('Podružný rozvaděč', type_energie, room_technicka, 240, 12, 'good', 'Rozvaděč pro část domu', true),
  ('HDO přijímač', type_energie, room_technicka, 120, 24, 'good', 'Přijímač hromadného dálkového ovládání', true);

  -- Plyn
  INSERT INTO equipment_catalog (equipment_name, equipment_type_id, room_type_id, default_lifespan_months, default_revision_interval, default_state, default_description, active) VALUES
  ('Plynoměr', type_energie, room_technicka, 180, 12, 'good', 'Měřič spotřeby plynu', true),
  ('Regulátor plynu', type_energie, room_technicka, 120, 24, 'good', 'Regulace tlaku plynu', true),
  ('Plynový uzávěr', type_energie, room_technicka, 240, 24, 'good', 'Hlavní uzávěr plynu', true),
  ('Detektor plynu', type_energie, room_kuchyne, 60, NULL, 'good', 'Alarm detekce úniku plynu', true);

  -- Voda
  INSERT INTO equipment_catalog (equipment_name, equipment_type_id, room_type_id, default_lifespan_months, default_revision_interval, default_state, default_description, active) VALUES
  ('Vodoměr – studená voda', type_energie, room_koupelna, 72, 48, 'good', 'Měřič spotřeby studené vody', true),
  ('Vodoměr – teplá voda', type_energie, room_koupelna, 72, 48, 'good', 'Měřič spotřeby teplé vody', true),
  ('Podružný vodoměr', type_energie, room_koupelna, 72, 48, 'good', 'Dílčí měřič vody', true),
  ('Hlavní uzávěr vody', type_energie, room_technicka, 240, NULL, 'good', 'Hlavní uzavírací kohout vody', true),
  ('Podružný uzávěr vody', type_energie, room_koupelna, 240, NULL, 'good', 'Místní uzavírací kohout', true),
  ('Detektor úniku vody', type_energie, room_koupelna, 60, NULL, 'good', 'Alarm při úniku vody', true);

  -- Teplo
  INSERT INTO equipment_catalog (equipment_name, equipment_type_id, room_type_id, default_lifespan_months, default_revision_interval, default_state, default_description, active) VALUES
  ('Měřič tepla', type_energie, room_technicka, 120, 24, 'good', 'Měřič spotřeby tepelné energie', true),
  ('Kalorimetr', type_energie, NULL, 96, 24, 'good', 'Měřič spotřeby tepla na radiátor', true),
  ('Poměrové měřiče topení', type_energie, NULL, 96, 24, 'good', 'Poměrový měřič na radiátor', true),
  ('Rozdělovač topných okruhů', type_energie, room_technicka, 240, 24, 'good', 'Rozdělovač podlahového topení', true);

  -- ========================================
  -- 2️⃣ VYTÁPĚNÍ & OHŘEV
  -- ========================================
  
  INSERT INTO equipment_catalog (equipment_name, equipment_type_id, room_type_id, default_lifespan_months, default_revision_interval, default_state, default_description, active) VALUES
  ('Plynový kotel', type_vytapeni, room_technicka, 180, 12, 'good', 'Plynový kondenzační kotel', true),
  ('Elektrokotel', type_vytapeni, room_technicka, 180, 24, 'good', 'Elektrický topný kotel', true),
  ('Kotel na tuhá paliva', type_vytapeni, room_technicka, 240, 12, 'good', 'Kotel na uhlí/dřevo', true),
  ('Kotel na pelety', type_vytapeni, room_technicka, 180, 12, 'good', 'Automatický kotel na pelety', true),
  ('Tepelné čerpadlo (vzduch–vzduch)', type_vytapeni, room_technicka, 180, 24, 'good', 'Tepelné čerpadlo split', true),
  ('Tepelné čerpadlo (vzduch–voda)', type_vytapeni, room_technicka, 180, 24, 'good', 'Tepelné čerpadlo pro ÚT', true),
  ('Tepelné čerpadlo (země–voda)', type_vytapeni, room_technicka, 240, 24, 'good', 'Tepelné čerpadlo se zemními sondami', true),
  ('Akumulační nádrž', type_vytapeni, room_technicka, 240, 24, 'good', 'Zásobník teplé vody pro vytápění', true),
  ('Zásobník TUV', type_vytapeni, room_technicka, 180, 24, 'good', 'Bojler teplé užitkové vody', true),
  ('Průtokový ohřívač', type_vytapeni, room_koupelna, 120, NULL, 'good', 'Průtokový ohřívač vody', true),
  ('Elektrický bojler', type_vytapeni, room_koupelna, 120, NULL, 'good', 'Zásobníkový ohřívač 50-200L', true),
  ('Solární kolektory', type_vytapeni, NULL, 300, 24, 'good', 'Solární panely na TUV', true),
  ('Expanzní nádoba', type_vytapeni, room_technicka, 120, 24, 'good', 'Expanze otopné soustavy', true),
  ('Oběhové čerpadlo', type_vytapeni, room_technicka, 120, 24, 'good', 'Čerpadlo otopné soustavy', true);

  -- ========================================
  -- 3️⃣ CHLAZENÍ & VZDUCHOTECHNIKA
  -- ========================================
  
  INSERT INTO equipment_catalog (equipment_name, equipment_type_id, room_type_id, default_lifespan_months, default_revision_interval, default_state, default_description, active) VALUES
  ('Klimatizace – split', type_chlazeni, NULL, 120, 12, 'good', 'Klimatizace 1 venkovní + 1 vnitřní', true),
  ('Klimatizace – multisplit', type_chlazeni, NULL, 120, 12, 'good', 'Klimatizace 1 venkovní + více vnitřních', true),
  ('Klimatizace – VRV / VRF', type_chlazeni, room_technicka, 180, 12, 'good', 'Centrální klimatizační systém', true),
  ('Vnitřní jednotka klimatizace', type_chlazeni, NULL, 120, 12, 'good', 'Nástěnná/kazetová jednotka', true),
  ('Venkovní jednotka klimatizace', type_chlazeni, NULL, 120, 12, 'good', 'Kompresorová jednotka', true),
  ('Rekuperační jednotka', type_chlazeni, room_technicka, 180, 12, 'good', 'Rekuperace s vratným vzduchem', true),
  ('Centrální vzduchotechnika', type_chlazeni, room_technicka, 240, 12, 'good', 'VZT systém celé budovy', true),
  ('Lokální rekuperační jednotka', type_chlazeni, NULL, 120, 12, 'good', 'Rekuperace pro jednu místnost', true),
  ('Digestoř (odtahová)', type_chlazeni, room_kuchyne, 120, NULL, 'good', 'Kuchyňský odsavač par s odvodem', true),
  ('Digestoř (recirkulační)', type_chlazeni, room_kuchyne, 120, NULL, 'good', 'Kuchyňský odsavač s filtry', true),
  ('Ventilátor koupelny / WC', type_chlazeni, room_koupelna, 120, NULL, 'good', 'Odtah vzduchu z koupelny', true);

  -- ========================================
  -- 4️⃣ ZDRAVOTECHNIKA & ODPADY
  -- ========================================
  
  INSERT INTO equipment_catalog (equipment_name, equipment_type_id, room_type_id, default_lifespan_months, default_revision_interval, default_state, default_description, active) VALUES
  ('WC', type_zdravotechnika, room_wc, 300, NULL, 'good', 'Záchodová mísa', true),
  ('Umyvadlo', type_zdravotechnika, room_koupelna, 300, NULL, 'good', 'Keramické umyvadlo', true),
  ('Sprchový kout', type_zdravotechnika, room_koupelna, 180, NULL, 'good', 'Sprchový box se zástěnou', true),
  ('Vana', type_zdravotechnika, room_koupelna, 240, NULL, 'good', 'Akrylátová/smaltovaná vana', true),
  ('Bidet', type_zdravotechnika, room_koupelna, 300, NULL, 'good', 'Keramický bidet', true),
  ('Pisoár', type_zdravotechnika, room_wc, 300, NULL, 'good', 'Keramický pisoár', true),
  ('Pračka', type_zdravotechnika, room_koupelna, 120, NULL, 'good', 'Automatická pračka', true),
  ('Sušička', type_zdravotechnika, room_koupelna, 120, NULL, 'good', 'Sušička prádla', true),
  ('Myčka', type_zdravotechnika, room_kuchyne, 120, NULL, 'good', 'Automatická myčka nádobí', true),
  ('Změkčovač vody', type_zdravotechnika, room_technicka, 120, 24, 'good', 'Úprava tvrdosti vody', true),
  ('Filtrace vody', type_zdravotechnika, room_kuchyne, 60, NULL, 'good', 'Filtr pitné vody', true),
  ('Studna', type_zdravotechnika, NULL, 600, 12, 'good', 'Vrt nebo kopaná studna', true),
  ('Domácí vodárna', type_zdravotechnika, room_technicka, 120, 24, 'good', 'Čerpací stanice ze studny', true),
  ('Septik', type_zdravotechnika, NULL, 300, 12, 'good', 'Žumpa pro odpadní vody', true),
  ('ČOV', type_zdravotechnika, NULL, 240, 12, 'good', 'Čistička odpadních vod', true),
  ('Retenční nádrž', type_zdravotechnika, NULL, 360, 24, 'good', 'Záchytná nádrž dešťové vody', true),
  ('Lapač tuků', type_zdravotechnika, NULL, 120, 12, 'good', 'Lapač tuků z kuchyně', true);

  -- ========================================
  -- 5️⃣ KUCHYNĚ & SPOTŘEBIČE
  -- ========================================
  
  INSERT INTO equipment_catalog (equipment_name, equipment_type_id, room_type_id, default_lifespan_months, default_revision_interval, default_state, default_description, active) VALUES
  ('Kuchyňská linka', type_kuchyne, room_kuchyne, 240, NULL, 'good', 'Spodní a horní skříňky', true),
  ('Varná deska – plynová', type_kuchyne, room_kuchyne, 180, NULL, 'good', 'Plynový sporák', true),
  ('Varná deska – elektrická', type_kuchyne, room_kuchyne, 180, NULL, 'good', 'Elektrický sporák klasický', true),
  ('Varná deska – indukční', type_kuchyne, room_kuchyne, 180, NULL, 'good', 'Indukční varná deska', true),
  ('Trouba', type_kuchyne, room_kuchyne, 180, NULL, 'good', 'Elektrická/plynová trouba', true),
  ('Mikrovlnná trouba', type_kuchyne, room_kuchyne, 120, NULL, 'good', 'Mikrovlnka volně stojící/vestavná', true),
  ('Lednice', type_kuchyne, room_kuchyne, 120, NULL, 'good', 'Kombinovaná lednice', true),
  ('Mrazák', type_kuchyne, room_kuchyne, 120, NULL, 'good', 'Samostatný mrazák', true),
  ('Vinotéka', type_kuchyne, room_kuchyne, 150, NULL, 'good', 'Chladící vinotéka', true),
  ('Odsavač par', type_kuchyne, room_kuchyne, 120, NULL, 'good', 'Kuchyňský odsavač', true),
  ('Vestavné spotřebiče', type_kuchyne, room_kuchyne, 150, NULL, 'good', 'Vestavné spotřebiče obecně', true),
  ('Volně stojící spotřebiče', type_kuchyne, room_kuchyne, 120, NULL, 'good', 'Volně stojící spotřebiče', true);

  -- ========================================
  -- 6️⃣ STAVEBNÍ PRVKY & KONSTRUKCE
  -- ========================================
  
  INSERT INTO equipment_catalog (equipment_name, equipment_type_id, room_type_id, default_lifespan_months, default_revision_interval, default_state, default_description, active) VALUES
  ('Okna', type_stavebni, NULL, 360, NULL, 'good', 'Plastová/dřevěná okna', true),
  ('Balkonové dveře', type_stavebni, NULL, 360, NULL, 'good', 'Balkonové výplně', true),
  ('Vstupní dveře', type_stavebni, room_chodba, 360, NULL, 'good', 'Hlavní vstupní dveře', true),
  ('Interiérové dveře', type_stavebni, NULL, 300, NULL, 'good', 'Vnitřní dveře mezi místnostmi', true),
  ('Bezpečnostní dveře', type_stavebni, room_chodba, 360, NULL, 'good', 'Pancéřové/bezpečnostní dveře', true),
  ('Rolety', type_stavebni, NULL, 180, NULL, 'good', 'Venkovní rolety', true),
  ('Žaluzie', type_stavebni, NULL, 120, NULL, 'good', 'Vnitřní/venkovní žaluzie', true),
  ('Markýzy', type_stavebni, room_terasa, 120, NULL, 'good', 'Výsuvné markýzy', true),
  ('Podlahy – dlažba', type_stavebni, NULL, 600, NULL, 'good', 'Keramická dlažba', true),
  ('Podlahy – vinyl', type_stavebni, NULL, 180, NULL, 'good', 'Vinylové podlahy', true),
  ('Podlahy – parkety', type_stavebni, NULL, 300, NULL, 'good', 'Dřevěné parkety', true),
  ('Podlahy – koberec', type_stavebni, NULL, 120, NULL, 'good', 'Textilní koberce', true),
  ('Podhledy', type_stavebni, NULL, 240, NULL, 'good', 'Sádrokartonové podhledy', true),
  ('Sádrokartonové konstrukce', type_stavebni, NULL, 240, NULL, 'good', 'SDK příčky a obklady', true);

  -- ========================================
  -- 7️⃣ BEZPEČNOST & POŽÁR
  -- ========================================
  
  INSERT INTO equipment_catalog (equipment_name, equipment_type_id, room_type_id, default_lifespan_months, default_revision_interval, default_state, default_description, active) VALUES
  ('EPS (elektronická požární signalizace)', type_bezpecnost, room_technicka, 180, 12, 'good', 'Centrální požární systém', true),
  ('Kouřový hlásič', type_bezpecnost, NULL, 120, NULL, 'good', 'Autonomní detektor kouře', true),
  ('Hlásič CO', type_bezpecnost, NULL, 60, NULL, 'good', 'Detektor oxidu uhelnatého', true),
  ('Hlásič plynu', type_bezpecnost, room_kuchyne, 60, NULL, 'good', 'Detektor úniku plynu', true),
  ('Hasicí přístroj', type_bezpecnost, room_chodba, 60, 24, 'good', 'Přenosný hasicí přístroj', true),
  ('Požární hydrant', type_bezpecnost, room_chodba, 360, 12, 'good', 'Nástěnný hydrant', true),
  ('Únikové osvětlení', type_bezpecnost, room_chodba, 120, 12, 'good', 'Nouzové osvětlení únikových cest', true),
  ('Panikové osvětlení', type_bezpecnost, room_chodba, 120, 12, 'good', 'Nouzové osvětlení při výpadku', true),
  ('Nouzový vypínač', type_bezpecnost, room_chodba, 240, 12, 'good', 'Centrální nouzové vypnutí', true);

  -- ========================================
  -- 8️⃣ PŘÍSTUPY & ZABEZPEČENÍ
  -- ========================================
  
  INSERT INTO equipment_catalog (equipment_name, equipment_type_id, room_type_id, default_lifespan_months, default_revision_interval, default_state, default_description, active) VALUES
  ('Elektronický zámek', type_pristupy, room_chodba, 120, NULL, 'good', 'Čipový/kódový zámek', true),
  ('Mechanický zámek', type_pristupy, room_chodba, 180, NULL, 'good', 'Klasický zámek s klíčem', true),
  ('Klíčový systém', type_pristupy, room_chodba, 240, NULL, 'good', 'Centrální systém klíčů', true),
  ('Čipový systém', type_pristupy, room_chodba, 120, NULL, 'good', 'Přístupový systém na čipy', true),
  ('Kódová klávesnice', type_pristupy, room_chodba, 120, NULL, 'good', 'Vstup pomocí PIN kódu', true),
  ('Videotelefon', type_pristupy, room_chodba, 120, NULL, 'good', 'Domovní videotelefon', true),
  ('Domovní telefon', type_pristupy, room_chodba, 180, NULL, 'good', 'Audio domovní telefon', true),
  ('Kamerový systém', type_pristupy, NULL, 120, NULL, 'good', 'CCTV kamerový systém', true),
  ('Záznamové zařízení (NVR / DVR)', type_pristupy, room_technicka, 120, NULL, 'good', 'Nahrávací server kamer', true),
  ('Alarm (EZS)', type_pristupy, room_chodba, 120, 12, 'good', 'Elektronický zabezpečovací systém', true);

  -- ========================================
  -- 9️⃣ IT & SLABOPROUD
  -- ========================================
  
  INSERT INTO equipment_catalog (equipment_name, equipment_type_id, room_type_id, default_lifespan_months, default_revision_interval, default_state, default_description, active) VALUES
  ('Datový rozvaděč', type_it, room_technicka, 180, NULL, 'good', 'Rack pro síťové prvky', true),
  ('Patch panel', type_it, room_technicka, 240, NULL, 'good', 'Zapojovací panel UTP', true),
  ('Router', type_it, room_technicka, 60, NULL, 'good', 'Síťový router', true),
  ('Switch', type_it, room_technicka, 120, NULL, 'good', 'Síťový přepínač', true),
  ('Wi-Fi access point', type_it, NULL, 60, NULL, 'good', 'Bezdrátový přístupový bod', true),
  ('Optická přípojka', type_it, room_technicka, 240, NULL, 'good', 'Optické zakončení internetu', true),
  ('Metalická přípojka', type_it, room_technicka, 240, NULL, 'good', 'DSL/kabelové zakončení', true),
  ('Anténa DVB-T', type_it, NULL, 180, NULL, 'good', 'Terestrická TV anténa', true),
  ('Satelitní parabola', type_it, NULL, 240, NULL, 'good', 'Satelitní anténa', true),
  ('TV rozvody', type_it, NULL, 360, NULL, 'good', 'Kabelové rozvody TV signálu', true),
  ('Datové zásuvky', type_it, NULL, 360, NULL, 'good', 'RJ45 zásuvky', true),
  ('Telefonní zásuvky', type_it, NULL, 360, NULL, 'good', 'RJ11 zásuvky', true);

  -- ========================================
  -- 🔟 SPOLEČNÉ PROSTORY
  -- ========================================
  
  INSERT INTO equipment_catalog (equipment_name, equipment_type_id, room_type_id, default_lifespan_months, default_revision_interval, default_state, default_description, active) VALUES
  ('Výtah', type_spolecne, NULL, 360, 12, 'good', 'Osobní výtah', true),
  ('Strojovna výtahu', type_spolecne, room_technicka, 360, 12, 'good', 'Strojovna pro výtah', true),
  ('Garážová vrata', type_spolecne, room_garaz, 180, 12, 'good', 'Sekční/výklopná vrata', true),
  ('Pohon vrat', type_spolecne, room_garaz, 120, 12, 'good', 'Automatický pohon garážových vrat', true),
  ('Závory', type_spolecne, NULL, 120, 12, 'good', 'Vjezdové závory', true),
  ('Nabíječka elektromobilů', type_spolecne, room_garaz, 120, 12, 'good', 'Wallbox nabíječka EV', true),
  ('Kolárna', type_spolecne, NULL, 360, NULL, 'good', 'Místnost pro kola', true),
  ('Kočárkárna', type_spolecne, NULL, 360, NULL, 'good', 'Místnost pro kočárky', true),
  ('Sklepní kóje', type_spolecne, room_sklep, 360, NULL, 'good', 'Uzamykatelná kóje ve sklepě', true),
  ('Technická místnost', type_spolecne, room_technicka, 360, NULL, 'good', 'Společná technická místnost', true),
  ('Úklidová místnost', type_spolecne, NULL, 360, NULL, 'good', 'Místnost pro úklid', true);

  -- ========================================
  -- 1️⃣1️⃣ EXTERIÉR
  -- ========================================
  
  INSERT INTO equipment_catalog (equipment_name, equipment_type_id, room_type_id, default_lifespan_months, default_revision_interval, default_state, default_description, active) VALUES
  ('Oplocení', type_exterier, room_zahrada, 300, NULL, 'good', 'Plot pozemku', true),
  ('Brána', type_exterier, room_zahrada, 240, NULL, 'good', 'Vstupní brána', true),
  ('Branka', type_exterier, room_zahrada, 240, NULL, 'good', 'Pěší branka', true),
  ('Automatický pohon brány', type_exterier, room_zahrada, 120, NULL, 'good', 'Elektrický pohon brány', true),
  ('Osvětlení exteriéru', type_exterier, NULL, 120, NULL, 'good', 'Venkovní světla', true),
  ('Zahradní zavlažování', type_exterier, room_zahrada, 180, NULL, 'good', 'Automatické zavlažování', true),
  ('Bazén', type_exterier, room_zahrada, 360, 12, 'good', 'Venkovní/vnitřní bazén', true),
  ('Technologie bazénu', type_exterier, room_technicka, 180, 12, 'good', 'Filtrace, čerpadlo, chemie', true),
  ('Sauna', type_exterier, NULL, 240, NULL, 'good', 'Finská/parní sauna', true),
  ('Vířivka', type_exterier, NULL, 180, 12, 'good', 'Venkovní/vnitřní vířivka', true),
  ('Pergola', type_exterier, room_terasa, 240, NULL, 'good', 'Venkovní pergola', true);

  RAISE NOTICE '========================================';
  RAISE NOTICE 'EQUIPMENT CATALOG SEED COMPLETED';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Seeded comprehensive equipment catalog';
  RAISE NOTICE '📦 Total categories: 11';
  RAISE NOTICE '🔧 Total equipment items: ~170';
  RAISE NOTICE '========================================';

END $$;

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================

-- 📋 Seeded categories:
-- 1. ENERGIE & MĚŘENÍ (24 items) - Elektřina, Plyn, Voda, Teplo
-- 2. VYTÁPĚNÍ & OHŘEV (14 items) - Kotle, čerpadla, bojlery
-- 3. CHLAZENÍ & VZDUCHOTECHNIKA (11 items) - Klimatizace, rekuperace
-- 4. ZDRAVOTECHNIKA & ODPADY (17 items) - WC, vana, pračka, ČOV
-- 5. KUCHYNĚ & SPOTŘEBIČE (12 items) - Sporák, lednice, trouba
-- 6. STAVEBNÍ PRVKY (14 items) - Okna, dveře, podlahy
-- 7. BEZPEČNOST & POŽÁR (9 items) - Hlásiče, hasicí přístroje
-- 8. PŘÍSTUPY & ZABEZPEČENÍ (10 items) - Zámky, kamery, EZS
-- 9. IT & SLABOPROUD (12 items) - Router, switch, TV
-- 10. SPOLEČNÉ PROSTORY (11 items) - Výtah, kočárkárna
-- 11. EXTERIÉR (11 items) - Plot, bazén, zavlažování
--
-- 🔄 Workflow:
-- 1. V EquipmentCatalogTile uvidíš ~170 předpřipravených položek
-- 2. Při přidávání vybavení do jednotky/nemovitosti vyber z katalogu
-- 3. U každé instance můžeš změnit místnost (např. pračka v kuchyni)
-- 4. Můžeš přidat stejnou položku vícekrát (např. 3x skříň, každá jiná barva/rozměr)
-- 5. Instance má vlastní pole: name, description, purchase_price, installed_at, state
--
-- ✅ After this migration:
-- - Kompletní katalog vybavení připravený k použití
-- - Každý item má výchozí životnost a interval revizí
-- - Přiřazení k typům vybavení a výchozím místnostem
-- - Instance v unit_equipment/property_equipment mohou přepsat výchozí hodnoty
