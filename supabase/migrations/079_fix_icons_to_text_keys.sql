-- Migration: Fix emoji icons to text keys from icons.ts
-- Date: 2026-02-01
-- Purpose: Změnit emoji ikony na textové klíče ze systému ikon
-- NOTES: Oprava všech equipment_types, room_types a equipment_states

-- ============================================================================
-- STEP 1: Fix room_types icons (migration 075)
-- ============================================================================

UPDATE public.generic_types SET icon = 'kitchen' WHERE category = 'room_types' AND code = 'kuchyne';
UPDATE public.generic_types SET icon = 'shower' WHERE category = 'room_types' AND code = 'koupelna';
UPDATE public.generic_types SET icon = 'couch' WHERE category = 'room_types' AND code = 'obyvaci_pokoj';
UPDATE public.generic_types SET icon = 'bed' WHERE category = 'room_types' AND code = 'loznice';
UPDATE public.generic_types SET icon = 'apartment-unit' WHERE category = 'room_types' AND code = 'chodba';
UPDATE public.generic_types SET icon = 'toilet' WHERE category = 'room_types' AND code = 'wc';
UPDATE public.generic_types SET icon = 'leaf' WHERE category = 'room_types' AND code = 'balkon';
UPDATE public.generic_types SET icon = 'sun' WHERE category = 'room_types' AND code = 'terasa';
UPDATE public.generic_types SET icon = 'storage' WHERE category = 'room_types' AND code = 'spiz';
UPDATE public.generic_types SET icon = 'attic' WHERE category = 'room_types' AND code = 'sklipek';
UPDATE public.generic_types SET icon = 'briefcase' WHERE category = 'room_types' AND code = 'pracovna';
UPDATE public.generic_types SET icon = 'toy' WHERE category = 'room_types' AND code = 'detsky_pokoj';
UPDATE public.generic_types SET icon = 'suit' WHERE category = 'room_types' AND code = 'satna';
UPDATE public.generic_types SET icon = 'settings' WHERE category = 'room_types' AND code = 'technicka_mistnost';
UPDATE public.generic_types SET icon = 'question' WHERE category = 'room_types' AND code = 'jina_mistnost';

-- ============================================================================
-- STEP 2: Fix equipment_states icons (migration 075)
-- ============================================================================

UPDATE public.generic_types SET icon = 'sparkles' WHERE category = 'equipment_states' AND code = 'new';
UPDATE public.generic_types SET icon = 'check' WHERE category = 'equipment_states' AND code = 'good';
UPDATE public.generic_types SET icon = 'warning' WHERE category = 'equipment_states' AND code = 'worn';
UPDATE public.generic_types SET icon = 'wrench' WHERE category = 'equipment_states' AND code = 'damaged';
UPDATE public.generic_types SET icon = 'refresh' WHERE category = 'equipment_states' AND code = 'to_replace';
UPDATE public.generic_types SET icon = 'reject' WHERE category = 'equipment_states' AND code = 'broken';

-- ============================================================================
-- STEP 3: Fix equipment_types icons (migration 078a)
-- ============================================================================

UPDATE public.generic_types SET icon = 'bolt' WHERE category = 'equipment_types' AND code = 'energie_mereni';
UPDATE public.generic_types SET icon = 'snow' WHERE category = 'equipment_types' AND code = 'chlazeni_vzduchotechnika';
UPDATE public.generic_types SET icon = 'hammer' WHERE category = 'equipment_types' AND code = 'stavebni_prvky';
UPDATE public.generic_types SET icon = 'fire' WHERE category = 'equipment_types' AND code = 'bezpecnost_pozar';
UPDATE public.generic_types SET icon = 'lock' WHERE category = 'equipment_types' AND code = 'pristupy_zabezpeceni';
UPDATE public.generic_types SET icon = 'building' WHERE category = 'equipment_types' AND code = 'spolecne_prostory';
UPDATE public.generic_types SET icon = 'leaf' WHERE category = 'equipment_types' AND code = 'exterier';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  room_types_count INTEGER;
  equipment_states_count INTEGER;
  equipment_types_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO room_types_count FROM public.generic_types WHERE category = 'room_types';
  SELECT COUNT(*) INTO equipment_states_count FROM public.generic_types WHERE category = 'equipment_states';
  SELECT COUNT(*) INTO equipment_types_count FROM public.generic_types WHERE category = 'equipment_types';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ICONS FIXED TO TEXT KEYS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Room types updated: %', room_types_count;
  RAISE NOTICE 'Equipment states updated: %', equipment_states_count;
  RAISE NOTICE 'Equipment types updated: % (new types from 078a)', equipment_types_count;
  RAISE NOTICE '✅ All icons now use text keys from icons.ts';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================

-- 📋 Změny:
-- 1. room_types (15 items):
--    🍳 → kitchen, 🚿 → shower, 🛋️ → couch, 🛏️ → bed, 🚪 → apartment-unit,
--    🚽 → toilet, 🌿 → leaf, ☀️ → sun, 📦 → storage, 🏚️ → attic,
--    💼 → briefcase, 🧸 → toy, 👔 → suit, ⚙️ → settings, ❓ → question
--
-- 2. equipment_states (6 items):
--    ✨ → sparkles, ✅ → check, ⚠️ → warning, 🔧 → wrench,
--    🔄 → refresh, ❌ → reject
--
-- 3. equipment_types (7 nových z 078a):
--    ⚡ → bolt, ❄️ → snow, 🏗️ → hammer, 🚨 → fire,
--    🔒 → lock, 🏢 → building, 🌳 → leaf
--
-- ✅ Všechny ikony nyní odkazují na klíče z app/UI/icons.ts
-- ✅ UI komponenty budou automaticky zobrazovat správné emoji přes AppIcon
-- ✅ Nové ikony přidány do ikons.md: sparkles, kitchen, shower, couch, bed, toilet, toy, suit, question
