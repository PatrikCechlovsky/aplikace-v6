-- ============================================================================
-- MIGRATION 081: Add missing fields to unit_equipment and property_equipment
-- ============================================================================
-- PURPOSE: Add name, description, purchase_price, last_revision, lifespan_months
-- DATE: 2026-02-02
-- AUTHOR: AI Assistant
-- NOTES: Implementing all fields from CSV specification

-- ============================================================================
-- ADD COLUMNS TO unit_equipment
-- ============================================================================

-- Add name column (název konkrétního kusu vybavení)
ALTER TABLE public.unit_equipment 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Add description column (volitelný popis)
ALTER TABLE public.unit_equipment 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add purchase_price column (jednotková cena pořízení)
ALTER TABLE public.unit_equipment 
ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(12,2);

-- Add last_revision column (datum poslední revize)
ALTER TABLE public.unit_equipment 
ADD COLUMN IF NOT EXISTS last_revision DATE;

-- Add lifespan_months column (životnost v měsících)
ALTER TABLE public.unit_equipment 
ADD COLUMN IF NOT EXISTS lifespan_months INTEGER;

-- Add photo_attachment_id column (vazba na přílohu)
ALTER TABLE public.unit_equipment 
ADD COLUMN IF NOT EXISTS photo_attachment_id UUID REFERENCES public.attachments(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.unit_equipment.name IS 'Název konkrétního kusu vybavení (může se lišit od katalogu)';
COMMENT ON COLUMN public.unit_equipment.description IS 'Volitelný popis konkrétního kusu';
COMMENT ON COLUMN public.unit_equipment.purchase_price IS 'Cena pořízení za jeden kus';
COMMENT ON COLUMN public.unit_equipment.last_revision IS 'Datum poslední revize (pro elektro, kotle, měřiče)';
COMMENT ON COLUMN public.unit_equipment.lifespan_months IS 'Životnost v měsících (pro upozornění)';
COMMENT ON COLUMN public.unit_equipment.photo_attachment_id IS 'Fotka vybavení (vazba na přílohy)';

-- ============================================================================
-- ADD COLUMNS TO property_equipment
-- ============================================================================

-- Add name column (název konkrétního kusu vybavení)
ALTER TABLE public.property_equipment 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Add description column (volitelný popis)
ALTER TABLE public.property_equipment 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add purchase_price column (jednotková cena pořízení)
ALTER TABLE public.property_equipment 
ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(12,2);

-- Add last_revision column (datum poslední revize)
ALTER TABLE public.property_equipment 
ADD COLUMN IF NOT EXISTS last_revision DATE;

-- Add lifespan_months column (životnost v měsících)
ALTER TABLE public.property_equipment 
ADD COLUMN IF NOT EXISTS lifespan_months INTEGER;

-- Add photo_attachment_id column (vazba na přílohu)
ALTER TABLE public.property_equipment 
ADD COLUMN IF NOT EXISTS photo_attachment_id UUID REFERENCES public.attachments(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.property_equipment.name IS 'Název konkrétního kusu vybavení (může se lišit od katalogu)';
COMMENT ON COLUMN public.property_equipment.description IS 'Volitelný popis konkrétního kusu';
COMMENT ON COLUMN public.property_equipment.purchase_price IS 'Cena pořízení za jeden kus';
COMMENT ON COLUMN public.property_equipment.last_revision IS 'Datum poslední revize (pro elektro, kotle, měřiče)';
COMMENT ON COLUMN public.property_equipment.lifespan_months IS 'Životnost v měsících (pro upozornění)';
COMMENT ON COLUMN public.property_equipment.photo_attachment_id IS 'Fotka vybavení (vazba na přílohy)';

-- ============================================================================
-- RECREATE VIEWS WITH NEW FIELDS
-- ============================================================================

-- Recreate v_unit_equipment_list view
DROP VIEW IF EXISTS public.v_unit_equipment_list CASCADE;

CREATE OR REPLACE VIEW public.v_unit_equipment_list AS
SELECT 
  ue.id,
  ue.unit_id,
  ue.equipment_id,
  ue.name,
  ue.description,
  ue.quantity,
  ue.purchase_price,
  ue.state,
  ue.installation_date,
  ue.last_revision,
  ue.lifespan_months,
  ue.note,
  ue.photo_attachment_id,
  ue.is_archived,
  ue.created_at,
  ec.equipment_name AS catalog_equipment_name,
  gt.name AS equipment_type_name,
  ec.purchase_price AS catalog_purchase_price,
  (ue.quantity * COALESCE(ue.purchase_price, ec.purchase_price, 0)) AS total_price
FROM public.unit_equipment ue
LEFT JOIN public.equipment_catalog ec ON ue.equipment_id = ec.id
LEFT JOIN public.generic_types gt ON ec.equipment_type_id = gt.id;

COMMENT ON VIEW public.v_unit_equipment_list IS 
  'View pro seznam vybavení jednotek s joiny na katalog a generic_types';

-- Recreate v_property_equipment_list view
DROP VIEW IF EXISTS public.v_property_equipment_list CASCADE;

CREATE OR REPLACE VIEW public.v_property_equipment_list AS
SELECT 
  pe.id,
  pe.property_id,
  pe.equipment_id,
  pe.name,
  pe.description,
  pe.quantity,
  pe.purchase_price,
  pe.state,
  pe.installation_date,
  pe.last_revision,
  pe.lifespan_months,
  pe.note,
  pe.photo_attachment_id,
  pe.is_archived,
  pe.created_at,
  ec.equipment_name AS catalog_equipment_name,
  gt.name AS equipment_type_name,
  ec.purchase_price AS catalog_purchase_price,
  (pe.quantity * COALESCE(pe.purchase_price, ec.purchase_price, 0)) AS total_price
FROM public.property_equipment pe
LEFT JOIN public.equipment_catalog ec ON pe.equipment_id = ec.id
LEFT JOIN public.generic_types gt ON ec.equipment_type_id = gt.id;

COMMENT ON VIEW public.v_property_equipment_list IS 
  'View pro seznam vybavení nemovitostí s joiny na katalog a generic_types';

-- ============================================================================
-- INDEXES FOR NEW FIELDS
-- ============================================================================

-- Indexes for name (frequent searches)
CREATE INDEX IF NOT EXISTS idx_unit_equipment_name ON public.unit_equipment(name) WHERE name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_property_equipment_name ON public.property_equipment(name) WHERE name IS NOT NULL;

-- Indexes for last_revision (for maintenance queries)
CREATE INDEX IF NOT EXISTS idx_unit_equipment_last_revision ON public.unit_equipment(last_revision) WHERE last_revision IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_property_equipment_last_revision ON public.property_equipment(last_revision) WHERE last_revision IS NOT NULL;

-- Indexes for photo_attachment_id
CREATE INDEX IF NOT EXISTS idx_unit_equipment_photo ON public.unit_equipment(photo_attachment_id) WHERE photo_attachment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_property_equipment_photo ON public.property_equipment(photo_attachment_id) WHERE photo_attachment_id IS NOT NULL;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 081 complete: Added equipment fields (name, description, purchase_price, last_revision, lifespan_months, photo_attachment_id)';
  RAISE NOTICE '✅ Views v_unit_equipment_list and v_property_equipment_list recreated with new fields';
  RAISE NOTICE '✅ Indexes created for name, last_revision, and photo_attachment_id';
END $$;
