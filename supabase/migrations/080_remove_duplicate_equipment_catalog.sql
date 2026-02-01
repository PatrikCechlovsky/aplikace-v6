-- Migration: Remove duplicate equipment catalog entries
-- Date: 2026-02-01
-- Purpose: Smazat duplicitní záznamy z equipment_catalog (migrace 078 se spustila vícekrát)
-- NOTES: Ponechá jen první výskyt každého názvu vybavení

-- ============================================================================
-- STEP 1: Remove duplicates - keep only the oldest record for each name
-- ============================================================================

-- Použít DISTINCT ON protože MIN() nefunguje s UUID
DELETE FROM equipment_catalog
WHERE id NOT IN (
  SELECT DISTINCT ON (equipment_name) id
  FROM equipment_catalog
  ORDER BY equipment_name, created_at ASC
);

-- ============================================================================
-- STEP 2: Add unique constraint to prevent duplicates in future
-- ============================================================================

-- Nejprve zkontroluj, jestli constraint už neexistuje
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'equipment_catalog_equipment_name_unique'
  ) THEN
    ALTER TABLE equipment_catalog
    ADD CONSTRAINT equipment_catalog_equipment_name_unique UNIQUE (equipment_name);
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  total_count INTEGER;
  unique_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM equipment_catalog;
  SELECT COUNT(DISTINCT equipment_name) INTO unique_count FROM equipment_catalog;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'EQUIPMENT CATALOG DUPLICATES REMOVED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total equipment items: %', total_count;
  RAISE NOTICE 'Unique equipment names: %', unique_count;
  
  IF total_count = unique_count THEN
    RAISE NOTICE '✅ No duplicates found - all equipment names are unique';
  ELSE
    RAISE WARNING '⚠️ Still have duplicates: % total vs % unique', total_count, unique_count;
  END IF;
  
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================

-- 🐛 Problém:
-- - Migrace 078 se spustila vícekrát (nebo byla spuštěna ručně opakovaně)
-- - Každý equipment item byl přidán 2x (nebo víc)
-- - Bez unique constraint nebylo nic, co by duplicitám zabránilo
--
-- ✅ Řešení:
-- 1. Smaže všechny duplicitní záznamy kromě nejstaršího (DISTINCT ON s created_at)
-- 2. Přidá UNIQUE constraint na equipment_name
-- 3. Budoucí pokusy o vložení duplicity způsobí chybu
--
-- 📋 Expected result:
-- - ~170 unikátních položek v equipment_catalog
-- - Žádné duplicity
-- - UNIQUE constraint zabrání opakování problému
--
-- 🔧 Technical note:
-- - UUID nemá MIN() funkci, proto se používá DISTINCT ON s ORDER BY created_at
-- - Ponechává nejstarší záznam (created_at ASC)
