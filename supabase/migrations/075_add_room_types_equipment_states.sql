-- Migration: Add room_types and equipment_states to generic_types
-- Date: 2026-02-01
-- Purpose: Doplnění room_types (místnosti) a equipment_states (stavy vybavení) jako nové kategorie
-- NOTES: Refaktorujeme equipment_types aby nekolidovaly s room_types + přidáme nové kategorie

-- ============================================================================
-- STEP 1: Rename equipment_types to avoid conflicts with room_types
-- ============================================================================

-- Přejmenování equipment_types aby nekolidovaly s room_types (Kuchyně vs Kuchyně)
UPDATE public.generic_types 
SET 
  name = 'Kuchyňské spotřebiče',
  description = 'Sporáky, lednice, mikrovlny, myčky'
WHERE category = 'equipment_types' AND code = 'kuchyne';

UPDATE public.generic_types 
SET 
  name = 'Sanitární technika',
  description = 'Vany, umyvadla, WC, sprchy, baterie'
WHERE category = 'equipment_types' AND code = 'koupelna';

UPDATE public.generic_types 
SET 
  name = 'Zahradní vybavení',
  description = 'Zahradní nábytek, nástroje, sekačky'
WHERE category = 'equipment_types' AND code = 'zahrada';

UPDATE public.generic_types 
SET 
  name = 'Ostatní',
  description = 'Ostatní vybavení, které nespadá do jiných kategorií'
WHERE category = 'equipment_types' AND code = 'jine';

-- ============================================================================
-- STEP 2: Update category constraint to include new categories
-- ============================================================================

-- Drop existing constraint
ALTER TABLE public.generic_types 
DROP CONSTRAINT IF EXISTS generic_types_category_check;

-- Add updated constraint with room_types and equipment_states
ALTER TABLE public.generic_types 
ADD CONSTRAINT generic_types_category_check CHECK (category IN (
  'subject_types',
  'property_types',
  'unit_types',
  'equipment_types',
  'unit_dispositions',
  'room_types',
  'equipment_states'
));

COMMENT ON CONSTRAINT generic_types_category_check ON public.generic_types IS 'Povolené kategorie: subject_types, property_types, unit_types, equipment_types, unit_dispositions, room_types, equipment_states';

-- ============================================================================
-- STEP 3: Seed room_types data
-- ============================================================================

-- Room types (typy místností)
INSERT INTO public.generic_types (id, category, code, name, description, color, icon, order_index, active) VALUES
(gen_random_uuid(), 'room_types', 'kuchyne', 'Kuchyně', 'Kuchyňský prostor', '#E67E22', '🍳', 10, true),
(gen_random_uuid(), 'room_types', 'koupelna', 'Koupelna', 'Koupelna a hygienické zázemí', '#3498DB', '🚿', 20, true),
(gen_random_uuid(), 'room_types', 'obyvaci_pokoj', 'Obývací pokoj', 'Hlavní obytný prostor', '#2ECC71', '🛋️', 30, true),
(gen_random_uuid(), 'room_types', 'loznice', 'Ložnice', 'Prostor na spaní', '#9B59B6', '🛏️', 40, true),
(gen_random_uuid(), 'room_types', 'chodba', 'Chodba', 'Průchozí prostor', '#95A5A6', '🚪', 50, true),
(gen_random_uuid(), 'room_types', 'wc', 'WC', 'Samostatné WC', '#3498DB', '🚽', 60, true),
(gen_random_uuid(), 'room_types', 'balkon', 'Balkon', 'Venkovní prostor', '#1ABC9C', '🌿', 70, true),
(gen_random_uuid(), 'room_types', 'terasa', 'Terasa', 'Venkovní terasa', '#16A085', '☀️', 80, true),
(gen_random_uuid(), 'room_types', 'spiz', 'Spíž', 'Úložný prostor, komora', '#7F8C8D', '📦', 90, true),
(gen_random_uuid(), 'room_types', 'sklipek', 'Sklípek', 'Malý sklepní prostor v bytě', '#34495E', '🏚️', 100, true),
(gen_random_uuid(), 'room_types', 'pracovna', 'Pracovna', 'Kancelářský prostor v bytě', '#E74C3C', '💼', 110, true),
(gen_random_uuid(), 'room_types', 'detsky_pokoj', 'Dětský pokoj', 'Prostor pro děti', '#F39C12', '🧸', 120, true),
(gen_random_uuid(), 'room_types', 'satna', 'Šatna', 'Šatní prostor', '#8E44AD', '👔', 130, true),
(gen_random_uuid(), 'room_types', 'technicka_mistnost', 'Technická místnost', 'Kotelna, rozvodna, prádelna', '#2C3E50', '⚙️', 140, true),
(gen_random_uuid(), 'room_types', 'jina_mistnost', 'Jiná místnost', 'Ostatní typy místností', '#BDC3C7', '❓', 150, true)
ON CONFLICT (category, code) DO NOTHING;

-- ============================================================================
-- STEP 4: Seed equipment_states data
-- ============================================================================

-- Equipment states (stavy vybavení)
INSERT INTO public.generic_types (id, category, code, name, description, color, icon, order_index, active) VALUES
(gen_random_uuid(), 'equipment_states', 'new', 'Nové', 'Nové vybavení, nepoužité', '#2ECC71', '✨', 10, true),
(gen_random_uuid(), 'equipment_states', 'good', 'Běžné opotřebení', 'Funkční vybavení v dobrém stavu', '#3498DB', '✅', 20, true),
(gen_random_uuid(), 'equipment_states', 'worn', 'Opotřebené', 'Vybavení se znaky opotřebení', '#F39C12', '⚠️', 30, true),
(gen_random_uuid(), 'equipment_states', 'damaged', 'Poškozené', 'Částečně poškozené, vyžaduje opravu', '#E67E22', '🔧', 40, true),
(gen_random_uuid(), 'equipment_states', 'to_replace', 'K výměně', 'Vybavení určené k výměně', '#E74C3C', '🔄', 50, true),
(gen_random_uuid(), 'equipment_states', 'broken', 'Nefunkční', 'Nefunkční vybavení, nutná výměna', '#C0392B', '❌', 60, true)
ON CONFLICT (category, code) DO NOTHING;

-- ============================================================================
-- STEP 5: Update comments
-- ============================================================================

COMMENT ON CONSTRAINT generic_types_category_check ON public.generic_types IS 
'Povolené kategorie: 
- subject_types (typy subjektů)
- property_types (typy nemovitostí)
- unit_types (typy jednotek)
- equipment_types (kategorie vybavení)
- unit_dispositions (dispozice jednotek)
- room_types (typy místností)
- equipment_states (stavy vybavení)';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Výpis všech kategorií a počet záznamů
DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'GENERIC_TYPES CATEGORIES SUMMARY:';
  RAISE NOTICE '========================================';
  
  FOR rec IN 
    SELECT category, COUNT(*) as count 
    FROM public.generic_types 
    GROUP BY category 
    ORDER BY category
  LOOP
    RAISE NOTICE '% - % records', rec.category, rec.count;
  END LOOP;
  
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================

-- 📋 Context:
-- 1. Equipment_types přejmenovány aby nekolidovaly s room_types:
--    - "Kuchyně" → "Kuchyňské spotřebiče"
--    - "Koupelna" → "Sanitární technika"
--    - "Zahrada" → "Zahradní vybavení"
--    - "Jiné" → "Ostatní"
--
-- 2. Nové kategorie přidány do generic_types:
--    - room_types: 15 typů místností (Kuchyně, Koupelna, Ložnice...)
--    - equipment_states: 6 stavů vybavení (Nové, Běžné, Poškozené...)
--
-- 3. Constraint aktualizován (7 kategorií celkem)
--
-- 4. Module 900 bude mít 2 nové tiles:
--    - RoomTypesTile (správa typů místností)
--    - EquipmentStatesTile (správa stavů vybavení)
--
-- 5. Equipment_catalog bude v další migraci změněn:
--    - equipment_type_id: TEXT → UUID FK na generic_types(id)

-- ✅ After this migration:
-- - Žádné duplicity mezi equipment_types a room_types
-- - Room_types spravovatelné v modulu 900
-- - Equipment_states spravovatelné v modulu 900
-- - Systém připravený na equipment_catalog refaktoring
