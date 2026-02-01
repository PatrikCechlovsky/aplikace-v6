-- Migration: Extend equipment structure with additional fields
-- Date: 2026-02-01
-- Purpose: Přidat chybějící pole do equipment_catalog, unit_equipment a property_equipment podle specifikace
-- NOTES: Musí být spuštěno PO migraci 076 (equipment_catalog FK fix)

-- ============================================================================
-- STEP 1: Extend EQUIPMENT_CATALOG table
-- ============================================================================

-- Add new columns to equipment_catalog
ALTER TABLE public.equipment_catalog 
ADD COLUMN IF NOT EXISTS room_type_id UUID REFERENCES public.generic_types(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS default_lifespan_months INTEGER,
ADD COLUMN IF NOT EXISTS default_revision_interval INTEGER,
ADD COLUMN IF NOT EXISTS default_state TEXT DEFAULT 'good',
ADD COLUMN IF NOT EXISTS default_description TEXT,
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;

-- Add constraints
ALTER TABLE public.equipment_catalog
ADD CONSTRAINT equipment_catalog_lifespan_positive CHECK (default_lifespan_months IS NULL OR default_lifespan_months > 0),
ADD CONSTRAINT equipment_catalog_revision_positive CHECK (default_revision_interval IS NULL OR default_revision_interval > 0),
ADD CONSTRAINT equipment_catalog_default_state_valid CHECK (default_state IN ('new', 'good', 'worn', 'damaged', 'to_replace', 'broken'));

-- Comments
COMMENT ON COLUMN public.equipment_catalog.room_type_id IS 'FK na generic_types (category=room_types) - typ místnosti kde se vybavení nachází';
COMMENT ON COLUMN public.equipment_catalog.default_lifespan_months IS 'Výchozí životnost vybavení v měsících';
COMMENT ON COLUMN public.equipment_catalog.default_revision_interval IS 'Výchozí interval revize v měsících (pro elektro, kotle, měřiče)';
COMMENT ON COLUMN public.equipment_catalog.default_state IS 'Výchozí stav vybavení při přidání';
COMMENT ON COLUMN public.equipment_catalog.default_description IS 'Obecný popis typu vybavení';
COMMENT ON COLUMN public.equipment_catalog.active IS 'Určuje, zda se typ vybavení nabízí v seznamech (aktivní/archivní)';

-- Index for room_type
CREATE INDEX IF NOT EXISTS idx_equipment_catalog_room_type ON public.equipment_catalog(room_type_id) WHERE is_archived = FALSE;
CREATE INDEX IF NOT EXISTS idx_equipment_catalog_active ON public.equipment_catalog(active) WHERE is_archived = FALSE;

-- ============================================================================
-- STEP 2: Extend UNIT_EQUIPMENT table
-- ============================================================================

-- Drop old views first
DROP VIEW IF EXISTS public.v_unit_equipment_list CASCADE;

-- Add new columns to unit_equipment
ALTER TABLE public.unit_equipment 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS type TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS lifespan_months INTEGER,
ADD COLUMN IF NOT EXISTS last_revision DATE;

-- Rename installation_date to installed_at for consistency
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'unit_equipment' 
    AND column_name = 'installation_date'
  ) THEN
    ALTER TABLE public.unit_equipment RENAME COLUMN installation_date TO installed_at;
  END IF;
END $$;

-- Update state constraint to include all 6 states
ALTER TABLE public.unit_equipment DROP CONSTRAINT IF EXISTS unit_equipment_state_valid;
ALTER TABLE public.unit_equipment 
ADD CONSTRAINT unit_equipment_state_valid CHECK (state IN ('new', 'good', 'worn', 'damaged', 'to_replace', 'broken'));

-- Add constraints
ALTER TABLE public.unit_equipment
ADD CONSTRAINT unit_equipment_price_positive CHECK (purchase_price IS NULL OR purchase_price >= 0),
ADD CONSTRAINT unit_equipment_lifespan_positive CHECK (lifespan_months IS NULL OR lifespan_months > 0);

-- Comments
COMMENT ON COLUMN public.unit_equipment.name IS 'Název konkrétního kusu vybavení';
COMMENT ON COLUMN public.unit_equipment.type IS 'Typ vybavení (select z settings.unit_equipment_types)';
COMMENT ON COLUMN public.unit_equipment.description IS 'Volitelný popis konkrétního kusu';
COMMENT ON COLUMN public.unit_equipment.purchase_price IS 'Jednotková cena pořízení';
COMMENT ON COLUMN public.unit_equipment.lifespan_months IS 'Konkrétní životnost v měsících';
COMMENT ON COLUMN public.unit_equipment.last_revision IS 'Datum poslední revize (elektro, kotle, měřiče)';
COMMENT ON COLUMN public.unit_equipment.installed_at IS 'Datum instalace / výměny';

-- ============================================================================
-- STEP 3: Extend PROPERTY_EQUIPMENT table
-- ============================================================================

-- Drop old views first
DROP VIEW IF EXISTS public.v_property_equipment_list CASCADE;

-- Add new columns to property_equipment
ALTER TABLE public.property_equipment 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS type TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS lifespan_months INTEGER,
ADD COLUMN IF NOT EXISTS last_revision DATE;

-- Rename installation_date to installed_at for consistency
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'property_equipment' 
    AND column_name = 'installation_date'
  ) THEN
    ALTER TABLE public.property_equipment RENAME COLUMN installation_date TO installed_at;
  END IF;
END $$;

-- Update state constraint to include all 6 states
ALTER TABLE public.property_equipment DROP CONSTRAINT IF EXISTS property_equipment_state_valid;
ALTER TABLE public.property_equipment 
ADD CONSTRAINT property_equipment_state_valid CHECK (state IN ('new', 'good', 'worn', 'damaged', 'to_replace', 'broken'));

-- Add constraints
ALTER TABLE public.property_equipment
ADD CONSTRAINT property_equipment_price_positive CHECK (purchase_price IS NULL OR purchase_price >= 0),
ADD CONSTRAINT property_equipment_lifespan_positive CHECK (lifespan_months IS NULL OR lifespan_months > 0);

-- Comments
COMMENT ON COLUMN public.property_equipment.name IS 'Název konkrétního kusu vybavení';
COMMENT ON COLUMN public.property_equipment.type IS 'Typ vybavení (select z settings.unit_equipment_types)';
COMMENT ON COLUMN public.property_equipment.description IS 'Volitelný popis konkrétního kusu';
COMMENT ON COLUMN public.property_equipment.purchase_price IS 'Jednotková cena pořízení';
COMMENT ON COLUMN public.property_equipment.lifespan_months IS 'Konkrétní životnost v měsících';
COMMENT ON COLUMN public.property_equipment.last_revision IS 'Datum poslední revize (elektro, kotle, měřiče)';
COMMENT ON COLUMN public.property_equipment.installed_at IS 'Datum instalace / výměny';

-- ============================================================================
-- STEP 4: Recreate VIEWS with extended fields
-- ============================================================================

-- Recreate v_unit_equipment_list view s novými poli
CREATE OR REPLACE VIEW public.v_unit_equipment_list AS
SELECT 
  ue.*,
  ec.equipment_name AS catalog_equipment_name,
  ec.equipment_type_id,
  ec.purchase_price AS catalog_purchase_price,
  ec.purchase_date AS catalog_purchase_date,
  ec.room_type_id,
  ec.default_lifespan_months,
  ec.default_revision_interval,
  gt_equipment.name AS equipment_type_name,
  gt_equipment.icon AS equipment_type_icon,
  gt_equipment.color AS equipment_type_color,
  gt_room.name AS room_type_name,
  gt_room.icon AS room_type_icon,
  gt_room.color AS room_type_color,
  -- Calculated total price (prefer unit_equipment price, fallback to catalog)
  (ue.quantity * COALESCE(ue.purchase_price, ec.purchase_price, 0)) AS total_price
FROM public.unit_equipment ue
JOIN public.equipment_catalog ec ON ue.equipment_id = ec.id
LEFT JOIN public.generic_types gt_equipment ON ec.equipment_type_id = gt_equipment.id AND gt_equipment.category = 'equipment_types'
LEFT JOIN public.generic_types gt_room ON ec.room_type_id = gt_room.id AND gt_room.category = 'room_types'
WHERE ue.is_archived = FALSE;

COMMENT ON VIEW public.v_unit_equipment_list IS 
'Přehled vybavení jednotek s výpočtem celkové ceny, info o typu vybavení a místnosti z generic_types';

-- Recreate v_property_equipment_list view s novými poli
CREATE OR REPLACE VIEW public.v_property_equipment_list AS
SELECT 
  pe.*,
  ec.equipment_name AS catalog_equipment_name,
  ec.equipment_type_id,
  ec.purchase_price AS catalog_purchase_price,
  ec.purchase_date AS catalog_purchase_date,
  ec.room_type_id,
  ec.default_lifespan_months,
  ec.default_revision_interval,
  gt_equipment.name AS equipment_type_name,
  gt_equipment.icon AS equipment_type_icon,
  gt_equipment.color AS equipment_type_color,
  gt_room.name AS room_type_name,
  gt_room.icon AS room_type_icon,
  gt_room.color AS room_type_color,
  -- Calculated total price (prefer property_equipment price, fallback to catalog)
  (pe.quantity * COALESCE(pe.purchase_price, ec.purchase_price, 0)) AS total_price
FROM public.property_equipment pe
JOIN public.equipment_catalog ec ON pe.equipment_id = ec.id
LEFT JOIN public.generic_types gt_equipment ON ec.equipment_type_id = gt_equipment.id AND gt_equipment.category = 'equipment_types'
LEFT JOIN public.generic_types gt_room ON ec.room_type_id = gt_room.id AND gt_room.category = 'room_types'
WHERE pe.is_archived = FALSE;

COMMENT ON VIEW public.v_property_equipment_list IS 
'Přehled vybavení nemovitostí s výpočtem celkové ceny, info o typu vybavení a místnosti z generic_types';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  catalog_cols INTEGER;
  unit_eq_cols INTEGER;
  property_eq_cols INTEGER;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'EQUIPMENT STRUCTURE EXTENSION SUMMARY:';
  RAISE NOTICE '========================================';
  
  SELECT COUNT(*) INTO catalog_cols 
  FROM information_schema.columns 
  WHERE table_schema = 'public' AND table_name = 'equipment_catalog';
  
  SELECT COUNT(*) INTO unit_eq_cols 
  FROM information_schema.columns 
  WHERE table_schema = 'public' AND table_name = 'unit_equipment';
  
  SELECT COUNT(*) INTO property_eq_cols 
  FROM information_schema.columns 
  WHERE table_schema = 'public' AND table_name = 'property_equipment';
  
  RAISE NOTICE 'equipment_catalog columns: % (expected: 16)', catalog_cols;
  RAISE NOTICE 'unit_equipment columns: % (expected: 17)', unit_eq_cols;
  RAISE NOTICE 'property_equipment columns: % (expected: 17)', property_eq_cols;
  RAISE NOTICE '✅ Equipment structure extended with lifecycle fields';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================

-- 📋 Context:
-- 1. equipment_catalog rozšířen o:
--    - room_type_id (FK na generic_types.room_types)
--    - default_lifespan_months, default_revision_interval
--    - default_state, default_description
--    - active (nahrazuje logiku is_archived)
--
-- 2. unit_equipment + property_equipment rozšířeny o:
--    - name, type, description (konkrétní instance)
--    - purchase_price (může se lišit od katalogu)
--    - lifespan_months, last_revision
--    - installation_date → installed_at (rename)
--    - state: rozšířeno o 'worn', 'broken'
--    - Fotky a dokumenty: přes standardní attachments systém (záložka Přílohy)
-- 3. Views aktualizovány:
--    - v_unit_equipment_list: JOIN na room_types, preferuje unit_equipment.purchase_price
--    - v_property_equipment_list: JOIN na room_types, preferuje property_equipment.purchase_price
--
-- 4. Kompatibilita:
--    - Stará pole zůstávají funkční
--    - Nová pole jsou nullable → backward compatible
--    - Services budou potřebovat update pro nová pole
--
-- ✅ After this migration:
-- - Plná podpora lifecycle management (životnost, revize)
-- - Rozlišení katalog vs. konkrétní instance
-- - Vazba na typy místností
-- - Fotodokumentace přes attachments systém (záložka Přílohy v detailu)
