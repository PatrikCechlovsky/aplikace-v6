-- FILE: supabase/migrations/093_create_unit_services.sql
-- PURPOSE: Vazba služeb na jednotku (unit_services) + view pro seznam a entity_type pro přílohy
-- DATE: 2026-02-08
-- NOTES: Služby lze navázat na katalog nebo zadat jako vlastní položku

-- ==========================================================================
-- TABLE: unit_services
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.unit_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.service_catalog(id) ON DELETE SET NULL,

  name TEXT,

  category_id UUID REFERENCES public.generic_types(id) ON DELETE SET NULL,
  billing_type_id UUID REFERENCES public.generic_types(id) ON DELETE SET NULL,
  service_unit_id UUID REFERENCES public.generic_types(id) ON DELETE SET NULL,
  vat_rate_id UUID REFERENCES public.generic_types(id) ON DELETE SET NULL,

  amount NUMERIC(12,2),
  periodicity_id UUID REFERENCES public.generic_types(id) ON DELETE SET NULL,
  billing_periodicity_id UUID REFERENCES public.generic_types(id) ON DELETE SET NULL,

  payer_side TEXT DEFAULT 'tenant',
  is_rebillable BOOLEAN DEFAULT TRUE,
  split_to_units BOOLEAN DEFAULT FALSE,
  split_basis TEXT,

  note TEXT,
  is_archived BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unit_services_amount_positive CHECK (amount IS NULL OR amount >= 0),
  CONSTRAINT unit_services_payer_side_valid CHECK (payer_side IN ('tenant', 'landlord')),
  CONSTRAINT unit_services_has_reference_or_name CHECK (
    service_id IS NOT NULL OR (name IS NOT NULL AND length(trim(name)) > 0)
  )
);

-- ==========================================================================
-- INDEXES
-- ==========================================================================

CREATE INDEX IF NOT EXISTS idx_unit_services_unit ON public.unit_services(unit_id) WHERE is_archived = FALSE;
CREATE INDEX IF NOT EXISTS idx_unit_services_service ON public.unit_services(service_id) WHERE is_archived = FALSE;
CREATE INDEX IF NOT EXISTS idx_unit_services_category ON public.unit_services(category_id) WHERE is_archived = FALSE;
CREATE INDEX IF NOT EXISTS idx_unit_services_billing_type ON public.unit_services(billing_type_id) WHERE is_archived = FALSE;
CREATE INDEX IF NOT EXISTS idx_unit_services_created ON public.unit_services(created_at DESC);

-- ==========================================================================
-- COMMENTS
-- ==========================================================================

COMMENT ON TABLE public.unit_services IS 'Vazby služeb na jednotky (katalogové i vlastní)';
COMMENT ON COLUMN public.unit_services.unit_id IS 'Jednotka, ke které je služba přiřazena';
COMMENT ON COLUMN public.unit_services.service_id IS 'Odkaz na katalog služeb (service_catalog)';
COMMENT ON COLUMN public.unit_services.name IS 'Vlastní název služby (pokud není z katalogu)';
COMMENT ON COLUMN public.unit_services.category_id IS 'Kategorie služby (generic_types: service_types)';
COMMENT ON COLUMN public.unit_services.billing_type_id IS 'Typ účtování (generic_types: service_billing_types)';
COMMENT ON COLUMN public.unit_services.service_unit_id IS 'Jednotka služby (generic_types: service_units)';
COMMENT ON COLUMN public.unit_services.vat_rate_id IS 'DPH sazba (generic_types: vat_rates)';
COMMENT ON COLUMN public.unit_services.amount IS 'Cena / částka služby';
COMMENT ON COLUMN public.unit_services.periodicity_id IS 'Periodicita služby (generic_types: service_periodicities)';
COMMENT ON COLUMN public.unit_services.billing_periodicity_id IS 'Periodicita vyúčtování (generic_types: service_periodicities)';
COMMENT ON COLUMN public.unit_services.payer_side IS 'Kdo hradí službu (tenant/landlord)';
COMMENT ON COLUMN public.unit_services.is_rebillable IS 'Lze přeúčtovat na nájemníka';
COMMENT ON COLUMN public.unit_services.split_to_units IS 'Rozpočítat na jednotky (pro kompatibilitu se službami nemovitosti)';
COMMENT ON COLUMN public.unit_services.split_basis IS 'Základ rozpočtu (např. m2, osoby, jednotky)';
COMMENT ON COLUMN public.unit_services.is_archived IS 'Archivace vazby služby';

-- ==========================================================================
-- VIEW: v_unit_services_list
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
LEFT JOIN public.generic_types gt_bill_period ON us.billing_periodicity_id = gt_bill_period.id
WHERE us.is_archived = FALSE;

COMMENT ON VIEW public.v_unit_services_list IS 'Přehled služeb jednotek s rozšířenými názvy a barvami z generic_types';

-- ==========================================================================
-- UPDATED_AT TRIGGER
-- ==========================================================================

CREATE OR REPLACE FUNCTION update_unit_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS unit_services_updated_at ON public.unit_services;
CREATE TRIGGER unit_services_updated_at
  BEFORE UPDATE ON public.unit_services
  FOR EACH ROW
  EXECUTE FUNCTION update_unit_services_updated_at();

-- ==========================================================================
-- RLS POLICIES
-- ==========================================================================

ALTER TABLE public.unit_services ENABLE ROW LEVEL SECURITY;

-- Admins see all
CREATE POLICY "unit_services_admin_all"
  ON public.unit_services
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.app_admins
      WHERE user_id = auth.uid()
    )
  );

-- Landlords see services of their units (via properties)
CREATE POLICY "unit_services_landlord_select"
  ON public.unit_services
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.subjects s
      JOIN public.properties p ON p.landlord_id = s.id
      JOIN public.units u ON u.property_id = p.id
      WHERE s.auth_user_id = auth.uid()
      AND u.id = unit_services.unit_id
    )
  );

-- Landlords can insert services to their units
CREATE POLICY "unit_services_landlord_insert"
  ON public.unit_services
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.subjects s
      JOIN public.properties p ON p.landlord_id = s.id
      JOIN public.units u ON u.property_id = p.id
      WHERE s.auth_user_id = auth.uid()
      AND u.id = unit_services.unit_id
    )
  );

-- Landlords can update services of their units
CREATE POLICY "unit_services_landlord_update"
  ON public.unit_services
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.subjects s
      JOIN public.properties p ON p.landlord_id = s.id
      JOIN public.units u ON u.property_id = p.id
      WHERE s.auth_user_id = auth.uid()
      AND u.id = unit_services.unit_id
    )
  );

-- Landlords can delete services from their units
CREATE POLICY "unit_services_landlord_delete"
  ON public.unit_services
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.subjects s
      JOIN public.properties p ON p.landlord_id = s.id
      JOIN public.units u ON u.property_id = p.id
      WHERE s.auth_user_id = auth.uid()
      AND u.id = unit_services.unit_id
    )
  );

-- ==========================================================================
-- ATTACHMENTS ENTITY TYPE (DOCUMENTATION)
-- ==========================================================================

COMMENT ON TABLE public.documents IS
'Polymorfní tabulka příloh - podporuje libovolný entity_type.
Validní hodnoty:
- subjects, properties, units, contracts, payments, documents, tenants
- equipment_binding (unit_equipment)
- property_equipment_binding (property_equipment)
- property_service_binding (property_services)
- unit_service_binding (unit_services)';

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 093 complete: unit_services + v_unit_services_list';
  RAISE NOTICE '📍 Use entity_type=unit_service_binding for unit_services attachments';
END $$;
