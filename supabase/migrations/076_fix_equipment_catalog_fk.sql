-- Migration: Fix equipment_catalog FK to use generic_types
-- Date: 2026-02-01
-- Purpose: Změnit equipment_catalog.equipment_type_id z TEXT FK → UUID FK na generic_types(id)
-- NOTES: Musí být spuštěno PO migraci 075 (room_types and equipment_states)

-- ============================================================================
-- STEP 1: Add new UUID column
-- ============================================================================

-- Přidat dočasný sloupec pro UUID
ALTER TABLE public.equipment_catalog 
ADD COLUMN IF NOT EXISTS equipment_type_id_new UUID;

-- ============================================================================
-- STEP 2: Migrate existing data
-- ============================================================================

-- Mapovat TEXT kódy na UUID z generic_types
UPDATE public.equipment_catalog ec
SET equipment_type_id_new = gt.id
FROM public.generic_types gt
WHERE gt.category = 'equipment_types'
  AND gt.code = ec.equipment_type_id;

-- ============================================================================
-- STEP 3: Verify migration
-- ============================================================================

-- Kontrola: všechny záznamy mají nový UUID?
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM public.equipment_catalog
  WHERE equipment_type_id_new IS NULL
    AND is_archived = FALSE;
  
  IF missing_count > 0 THEN
    RAISE WARNING 'POZOR: % záznamů v equipment_catalog nemá namapovaný equipment_type_id_new!', missing_count;
    RAISE WARNING 'Zkontrolujte záznamy s neexistujícími equipment_types kódy.';
  ELSE
    RAISE NOTICE '✅ Všechny aktivní záznamy v equipment_catalog mají namapovaný equipment_type_id_new';
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Drop views that depend on equipment_type_id column
-- ============================================================================

-- Musíme dropnout views PŘED dropnutím sloupce, jinak dostaneme error
DROP VIEW IF EXISTS public.v_unit_equipment_list CASCADE;
DROP VIEW IF EXISTS public.v_property_equipment_list CASCADE;

-- ============================================================================
-- STEP 5: Drop old column and rename new one
-- ============================================================================

-- Drop old FK constraint
ALTER TABLE public.equipment_catalog 
DROP CONSTRAINT IF EXISTS equipment_catalog_equipment_type_id_fkey;

-- Drop old column (teď už můžeme, views jsou pryč)
ALTER TABLE public.equipment_catalog 
DROP COLUMN IF EXISTS equipment_type_id;

-- Rename new column
ALTER TABLE public.equipment_catalog 
RENAME COLUMN equipment_type_id_new TO equipment_type_id;

-- Make NOT NULL
ALTER TABLE public.equipment_catalog 
ALTER COLUMN equipment_type_id SET NOT NULL;

-- ============================================================================
-- STEP 6: Add new FK constraint
-- ============================================================================

-- Add FK to generic_types
ALTER TABLE public.equipment_catalog 
ADD CONSTRAINT fk_equipment_catalog_type_generic
FOREIGN KEY (equipment_type_id) 
REFERENCES public.generic_types(id) 
ON DELETE RESTRICT;

-- ============================================================================
-- STEP 7: Recreate indexes
-- ============================================================================

-- Drop old index if exists
DROP INDEX IF EXISTS idx_equipment_catalog_type;

-- Create new index
CREATE INDEX idx_equipment_catalog_type 
ON public.equipment_catalog(equipment_type_id) 
WHERE is_archived = FALSE;

-- ============================================================================
-- STEP 8: Update comments
-- ============================================================================

COMMENT ON COLUMN public.equipment_catalog.equipment_type_id IS 
'FK na generic_types (category=equipment_types) - kategorie vybavení (Spotřebiče, Nábytek, Sanitární technika...)';

-- ============================================================================
-- STEP 9: Recreate views with new UUID FK
-- ============================================================================

-- Recreate v_unit_equipment_list view s novým equipment_type_id (UUID)
CREATE OR REPLACE VIEW public.v_unit_equipment_list AS
SELECT 
  ue.*,
  ec.equipment_name,
  ec.equipment_type_id,
  ec.purchase_price,
  ec.purchase_date,
  gt.name AS equipment_type_name,
  gt.icon AS equipment_type_icon,
  gt.color AS equipment_type_color,
  -- Calculated total price
  (ue.quantity * COALESCE(ec.purchase_price, 0)) AS total_price
FROM public.unit_equipment ue
JOIN public.equipment_catalog ec ON ue.equipment_id = ec.id
LEFT JOIN public.generic_types gt ON ec.equipment_type_id = gt.id AND gt.category = 'equipment_types'
WHERE ue.is_archived = FALSE;

COMMENT ON VIEW public.v_unit_equipment_list IS 
'Přehled vybavení jednotek s výpočtem celkové ceny a informacemi o typu z generic_types';

-- Drop and recreate v_property_equipment_list view
DROP VIEW IF EXISTS public.v_property_equipment_list CASCADE;
Recreate v_property_equipment_list view s novým equipment_type_id (UUID)SELECT 
  pe.*,
  ec.equipment_name,
  ec.equipment_type_id,
  ec.purchase_price,
  ec.purchase_date,
  gt.name AS equipment_type_name,
  gt.icon AS equipment_type_icon,
  gt.color AS equipment_type_color,
  -- Calculated total price
  (pe.quantity * COALESCE(ec.purchase_price, 0)) AS total_price
FROM public.property_equipment pe
JOIN public.equipment_catalog ec ON pe.equipment_id = ec.id
LEFT JOIN public.generic_types gt ON ec.equipment_type_id = gt.id AND gt.category = 'equipment_types'
WHERE pe.is_archived = FALSE;

COMMENT ON VIEW public.v_property_equipment_list IS 
'Přehled vybavení nemovitostí s výpočtem celkové ceny a informacemi o typu z generic_types';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  catalog_count INTEGER;
  type_count INTEGER;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'EQUIPMENT_CATALOG FK MIGRATION SUMMARY:';
  RAISE NOTICE '========================================';
  
  SELECT COUNT(*) INTO catalog_count FROM public.equipment_catalog;
  SELECT COUNT(*) INTO type_count FROM public.generic_types WHERE category = 'equipment_types';
  
  RAISE NOTICE 'Equipment catalog items: %', catalog_count;
  RAISE NOTICE 'Equipment types available: %', type_count;
  RAISE NOTICE '✅ equipment_type_id is now UUID FK to generic_types(id)';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================

-- 📋 Context:
-- 1. equipment_catalog.equipment_type_id změněno:
--    - PŘED: TEXT FK na equipment_types(code)
--    - PO: UUID FK na generic_types(id) WHERE category='equipment_types'
--
-- 2. Views aktualizovány:
--    - v_unit_equipment_list: JOIN na generic_types
--    - v_property_equipment_list: JOIN na generic_types
--
-- 3. Index překreován pro UUID sloupec
--
-- 4. Kompatibilita:
--    - Kód v app/lib/services/equipment.ts bude potřebovat update
--    - UI komponenty načítají přes services, takže automaticky OK
--
-- 5. Možnost drop equipment_types tabulky:
--    - PO této migraci už není equipment_types table potřeba
--    - Vše je v generic_types s category='equipment_types'
--    - Zatím ponecháme pro jistotu (komentovaný DROP na konci)

-- ✅ After this migration:
-- - equipment_catalog plně integrován s generic_types
-- - Konzistentní s ostatními *_types kategoriemi
-- - Připraveno pro UI správu v modulu 900

-- OPTIONAL: Drop old equipment_types table (pokud už není potřeba)
-- DROP TABLE IF EXISTS public.equipment_types CASCADE;
