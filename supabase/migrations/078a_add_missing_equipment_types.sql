-- Migration: Add missing equipment_types for comprehensive equipment catalog
-- Date: 2026-02-01
-- Purpose: Doplnit chybějící typy vybavení pro 078_seed_equipment_catalog
-- NOTES: Přidává typy které nejsou pokryty existujícími 9 typy

-- ============================================================================
-- Přidat chybějící equipment_types
-- ============================================================================

INSERT INTO public.generic_types (id, category, code, name, description, color, icon, order_index, active) VALUES
-- Energie a měření (elektroměry, plynoměry, vodoměry, měřiče tepla)
(gen_random_uuid(), 'equipment_types', 'energie_mereni', 'Energie a měření', 'Elektroměry, plynoměry, vodoměry, měřiče tepla', '#F1C40F', 'bolt', 15, true),

-- Chlazení a vzduchotechnika (klimatizace, rekuperace, digestoře)
(gen_random_uuid(), 'equipment_types', 'chlazeni_vzduchotechnika', 'Chlazení a vzduchotechnika', 'Klimatizace, rekuperace, digestoře, ventilátory', '#16A085', 'snow', 55, true),

-- Stavební prvky (okna, dveře, podlahy, rolety)
(gen_random_uuid(), 'equipment_types', 'stavebni_prvky', 'Stavební prvky', 'Okna, dveře, podlahy, rolety, žaluzie', '#7F8C8D', 'hammer', 75, true),

-- Bezpečnost a požár (hlásiče, hasicí přístroje, EPS)
(gen_random_uuid(), 'equipment_types', 'bezpecnost_pozar', 'Bezpečnost a požár', 'Hlásiče kouře/CO/plynu, hasicí přístroje, nouzové osvětlení', '#E74C3C', 'fire', 85, true),

-- Přístupy a zabezpečení (zámky, kamery, EZS, videotelefo ny)
(gen_random_uuid(), 'equipment_types', 'pristupy_zabezpeceni', 'Přístupy a zabezpečení', 'Zámky, kamery, EZS, čipy, videotelefo ny', '#8E44AD', 'lock', 95, true),

-- Společné prostory (výtah, garážová vrata, nabíječky)
(gen_random_uuid(), 'equipment_types', 'spolecne_prostory', 'Společné prostory', 'Výtah, garážová vrata, nabíječky EV, kolárny', '#34495E', 'building', 105, true),

-- Exteriér (plot, brána, bazén, zavlažování)
(gen_random_uuid(), 'equipment_types', 'exterier', 'Exteriér', 'Plot, brána, bazén, zavlažování, pergola', '#27AE60', 'leaf', 115, true)

ON CONFLICT (category, code) DO NOTHING;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  equipment_types_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO equipment_types_count 
  FROM public.generic_types 
  WHERE category = 'equipment_types';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'EQUIPMENT TYPES UPDATED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total equipment_types: % (expected: 16)', equipment_types_count;
  RAISE NOTICE '✅ Missing equipment types added';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================

-- 📋 Přidáno 7 nových equipment_types:
-- 1. energie_mereni - Elektroměry, plynoměry, vodoměry, měřiče (24 items v katalogu)
-- 2. chlazeni_vzduchotechnika - Klimatizace, rekuperace (11 items)
-- 3. stavebni_prvky - Okna, dveře, podlahy (14 items)
-- 4. bezpecnost_pozar - Hlásiče, hasicí přístroje (9 items)
-- 5. pristupy_zabezpeceni - Zámky, kamery, EZS (10 items)
-- 6. spolecne_prostory - Výtah, vrata, nabíječky (11 items)
-- 7. exterier - Plot, bazén, zavlažování (11 items)
--
-- 🎯 Původní 9 typů (z aktuální databáze):
-- - spotrebice (10) - Elektronika a domácí spotřebiče
-- - nabytek (20) - Stoly, židle, skříně, postele
-- - koupelna (30) - Sanitární technika (vany, umyvadla, WC)
-- - kuchyne (40) - Kuchyňské spotřebiče (sporáky, lednice)
-- - vytapeni (50) - Kotle, radiátory, klimatizace
-- - technika (60) - IT, zabezpečení, videotelefon
-- - osvetleni (70) - Světla, lustry, lampy
-- - zahrada (80) - Zahradní vybavení
-- - jine (90) - Ostatní
--
-- ✅ Celkem po migraci: 16 equipment_types
-- ✅ Pokrývá všech 11 kategorií z migrace 078_seed_equipment_catalog
