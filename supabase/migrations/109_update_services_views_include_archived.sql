-- FILE: supabase/migrations/109_update_services_views_include_archived.sql
-- PURPOSE: Znovu vytvořit view služeb bez filtru is_archived
-- DATE: 2026-02-16
-- NOTES: includeArchived v aplikaci potřebuje kompletní view

-- ==========================================================================
-- 1) VIEW: v_property_services_list
-- ==========================================================================

DROP VIEW IF EXISTS public.v_property_services_list CASCADE;

CREATE VIEW public.v_property_services_list AS
SELECT
  ps.*,
  COALESCE(ps.name, sc.name) AS service_name,
  sc.name AS catalog_service_name,
  sc.base_price AS catalog_base_price,
  COALESCE(ps.category_id, sc.category_id) AS resolved_category_id,
  COALESCE(ps.billing_type_id, sc.billing_type_id) AS resolved_billing_type_id,
  COALESCE(ps.unit_id, sc.unit_id) AS resolved_unit_id,
  COALESCE(ps.vat_rate_id, sc.vat_rate_id) AS resolved_vat_rate_id,
  gt_category.name AS category_name,
  gt_category.color AS category_color,
  gt_billing.name AS billing_type_name,
  gt_billing.color AS billing_type_color,
  gt_unit.name AS unit_name,
  gt_vat.name AS vat_rate_name,
  gt_period.name AS periodicity_name,
  gt_bill_period.name AS billing_periodicity_name
FROM public.property_services ps
LEFT JOIN public.service_catalog sc ON ps.service_id = sc.id
LEFT JOIN public.generic_types gt_category ON COALESCE(ps.category_id, sc.category_id) = gt_category.id
LEFT JOIN public.generic_types gt_billing ON COALESCE(ps.billing_type_id, sc.billing_type_id) = gt_billing.id
LEFT JOIN public.generic_types gt_unit ON COALESCE(ps.unit_id, sc.unit_id) = gt_unit.id
LEFT JOIN public.generic_types gt_vat ON COALESCE(ps.vat_rate_id, sc.vat_rate_id) = gt_vat.id
LEFT JOIN public.generic_types gt_period ON ps.periodicity_id = gt_period.id
LEFT JOIN public.generic_types gt_bill_period ON ps.billing_periodicity_id = gt_bill_period.id;

COMMENT ON VIEW public.v_property_services_list IS 'Přehled služeb nemovitostí s rozšířenými názvy a barvami z generic_types';

-- ==========================================================================
-- 2) VIEW: v_unit_services_list
-- ==========================================================================

DROP VIEW IF EXISTS public.v_unit_services_list CASCADE;

CREATE VIEW public.v_unit_services_list AS
SELECT
  us.*,
  COALESCE(us.name, sc.name) AS service_name,
  sc.name AS catalog_service_name,
  sc.base_price AS catalog_base_price,
  COALESCE(us.category_id, sc.category_id) AS resolved_category_id,
  COALESCE(us.billing_type_id, sc.billing_type_id) AS resolved_billing_type_id,
  COALESCE(us.service_unit_id, sc.unit_id) AS resolved_unit_id,
  COALESCE(us.vat_rate_id, sc.vat_rate_id) AS resolved_vat_rate_id,
  gt_category.name AS category_name,
  gt_category.color AS category_color,
  gt_billing.name AS billing_type_name,
  gt_billing.color AS billing_type_color,
  gt_unit.name AS unit_name,
  gt_vat.name AS vat_rate_name,
  gt_period.name AS periodicity_name,
  gt_bill_period.name AS billing_periodicity_name
FROM public.unit_services us
LEFT JOIN public.service_catalog sc ON us.service_id = sc.id
LEFT JOIN public.generic_types gt_category ON COALESCE(us.category_id, sc.category_id) = gt_category.id
LEFT JOIN public.generic_types gt_billing ON COALESCE(us.billing_type_id, sc.billing_type_id) = gt_billing.id
LEFT JOIN public.generic_types gt_unit ON COALESCE(us.service_unit_id, sc.unit_id) = gt_unit.id
LEFT JOIN public.generic_types gt_vat ON COALESCE(us.vat_rate_id, sc.vat_rate_id) = gt_vat.id
LEFT JOIN public.generic_types gt_period ON us.periodicity_id = gt_period.id
LEFT JOIN public.generic_types gt_bill_period ON us.billing_periodicity_id = gt_bill_period.id;

COMMENT ON VIEW public.v_unit_services_list IS 'Přehled služeb jednotek s rozšířenými názvy a barvami z generic_types';
