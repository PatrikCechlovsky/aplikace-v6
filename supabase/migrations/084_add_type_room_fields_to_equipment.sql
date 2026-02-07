-- FILE: supabase/migrations/084_add_type_room_fields_to_equipment.sql
-- PURPOSE: Přidání polí equipment_type_id a room_type_id do tabulek unit_equipment a property_equipment
-- DATE: 2026-02-04
-- NOTES: Umožňuje změnu typu a místnosti každého konkrétního vybavení, navíc k typu v katalogu

-- ============================================================================
-- ALTER UNIT_EQUIPMENT TABLE
-- ============================================================================

ALTER TABLE public.unit_equipment
ADD COLUMN IF NOT EXISTS equipment_type_id UUID REFERENCES public.generic_types(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS room_type_id UUID REFERENCES public.generic_types(id) ON DELETE SET NULL;

-- COMMENT ON COLUMN
COMMENT ON COLUMN public.unit_equipment.equipment_type_id IS 'Typ vybavení pro tuto konkrétní jednotku (může se lišit od katalogu)';
COMMENT ON COLUMN public.unit_equipment.room_type_id IS 'Místnost, kde je vybavení umístěno';

-- INDEX
CREATE INDEX IF NOT EXISTS idx_unit_equipment_type ON public.unit_equipment(equipment_type_id) WHERE is_archived = FALSE;
CREATE INDEX IF NOT EXISTS idx_unit_equipment_room ON public.unit_equipment(room_type_id) WHERE is_archived = FALSE;

-- ============================================================================
-- ALTER PROPERTY_EQUIPMENT TABLE
-- ============================================================================

ALTER TABLE public.property_equipment
ADD COLUMN IF NOT EXISTS equipment_type_id UUID REFERENCES public.generic_types(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS room_type_id UUID REFERENCES public.generic_types(id) ON DELETE SET NULL;

-- COMMENT ON COLUMN
COMMENT ON COLUMN public.property_equipment.equipment_type_id IS 'Typ vybavení pro tuto konkrétní nemovitost (může se lišit od katalogu)';
COMMENT ON COLUMN public.property_equipment.room_type_id IS 'Místnost, kde je vybavení umístěno';

-- INDEX
CREATE INDEX IF NOT EXISTS idx_property_equipment_type ON public.property_equipment(equipment_type_id) WHERE is_archived = FALSE;
CREATE INDEX IF NOT EXISTS idx_property_equipment_room ON public.property_equipment(room_type_id) WHERE is_archived = FALSE;

-- ============================================================================
-- RECREATE VIEWS WITH NEW COLUMNS
-- ============================================================================

DROP VIEW IF EXISTS public.v_unit_equipment_list;
DROP VIEW IF EXISTS public.v_property_equipment_list;

CREATE VIEW public.v_unit_equipment_list AS
SELECT 
  ue.*,
  ec.equipment_name AS catalog_equipment_name,
  ec.equipment_type_id AS catalog_equipment_type_id,
  ec.purchase_price AS catalog_purchase_price,
  ec.purchase_date AS catalog_purchase_date,
  COALESCE(et.name, et_cat.name) AS equipment_type_name,
  COALESCE(et.icon, et_cat.icon) AS equipment_type_icon,
  rt.name AS room_type_name,
  rt.icon AS room_type_icon,
  (ec.purchase_price * ue.quantity) AS total_price
FROM public.unit_equipment ue
LEFT JOIN public.equipment_catalog ec ON ue.equipment_id = ec.id
LEFT JOIN public.generic_types et ON ue.equipment_type_id = et.id
LEFT JOIN public.generic_types et_cat ON ec.equipment_type_id = et_cat.id
LEFT JOIN public.generic_types rt ON ue.room_type_id = rt.id
WHERE ue.is_archived = FALSE;

COMMENT ON VIEW public.v_unit_equipment_list IS 'Seznam vybavení jednotek s detaily z katalogu a přiřazených typů';

CREATE VIEW public.v_property_equipment_list AS
SELECT 
  pe.*,
  ec.equipment_name AS catalog_equipment_name,
  ec.equipment_type_id AS catalog_equipment_type_id,
  ec.purchase_price AS catalog_purchase_price,
  ec.purchase_date AS catalog_purchase_date,
  COALESCE(et.name, et_cat.name) AS equipment_type_name,
  COALESCE(et.icon, et_cat.icon) AS equipment_type_icon,
  rt.name AS room_type_name,
  rt.icon AS room_type_icon,
  (ec.purchase_price * pe.quantity) AS total_price
FROM public.property_equipment pe
LEFT JOIN public.equipment_catalog ec ON pe.equipment_id = ec.id
LEFT JOIN public.generic_types et ON pe.equipment_type_id = et.id
LEFT JOIN public.generic_types et_cat ON ec.equipment_type_id = et_cat.id
LEFT JOIN public.generic_types rt ON pe.room_type_id = rt.id
WHERE pe.is_archived = FALSE;

COMMENT ON VIEW public.v_property_equipment_list IS 'Seznam vybavení nemovitostí s detaily z katalogu a přiřazených typů';

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 084 complete: Added equipment_type_id and room_type_id to unit/property equipment';
  RAISE NOTICE '📍 Views recreated: v_unit_equipment_list, v_property_equipment_list';
  RAISE NOTICE '🔧 Users can now change equipment type and room for each binding';
END $$;
