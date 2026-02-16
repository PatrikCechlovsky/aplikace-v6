-- FILE: supabase/migrations/108_update_equipment_views.sql
-- PURPOSE: Znovu vytvořit view vybavení bez filtru is_archived
-- DATE: 2026-02-16
-- NOTES: includeArchived v aplikaci potřebuje kompletní view

-- ============================================================================
-- 1) VIEW: v_unit_equipment_list
-- ============================================================================

DROP VIEW IF EXISTS public.v_unit_equipment_list CASCADE;

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
LEFT JOIN public.generic_types rt ON ue.room_type_id = rt.id;

COMMENT ON VIEW public.v_unit_equipment_list IS 'Seznam vybavení jednotek s detaily z katalogu a přiřazených typů';

-- ============================================================================
-- 2) VIEW: v_property_equipment_list
-- ============================================================================

DROP VIEW IF EXISTS public.v_property_equipment_list CASCADE;

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
LEFT JOIN public.generic_types rt ON pe.room_type_id = rt.id;

COMMENT ON VIEW public.v_property_equipment_list IS 'Seznam vybavení nemovitostí s detaily z katalogu a přiřazených typů';
