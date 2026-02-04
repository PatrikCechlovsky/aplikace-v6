-- FILE: supabase/migrations/082_fix_equipment_views_installed_at.sql
-- PURPOSE: Oprava views - používají installed_at místo installation_date
-- DATE: 2025-02-04
-- AUTHOR: AI Coding Agent
-- NOTES: Migrace 077 přejmenovala installation_date → installed_at, ale views nebyly aktualizovány

-- Drop a recreate v_unit_equipment_list s installed_at
DROP VIEW IF EXISTS public.v_unit_equipment_list;

CREATE VIEW public.v_unit_equipment_list AS
SELECT 
  ue.id,
  ue.unit_id,
  ue.equipment_id,
  ue.name,
  ue.description,
  ue.quantity,
  ue.purchase_price,
  ue.state,
  ue.installed_at,
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

-- Drop a recreate v_property_equipment_list s installed_at
DROP VIEW IF EXISTS public.v_property_equipment_list;

CREATE VIEW public.v_property_equipment_list AS
SELECT 
  pe.id,
  pe.property_id,
  pe.equipment_id,
  pe.name,
  pe.description,
  pe.quantity,
  pe.purchase_price,
  pe.state,
  pe.installed_at,
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
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 082 complete: Views updated to use installed_at column';
  RAISE NOTICE '✅ v_unit_equipment_list recreated with installed_at';
  RAISE NOTICE '✅ v_property_equipment_list recreated with installed_at';
END $$;
