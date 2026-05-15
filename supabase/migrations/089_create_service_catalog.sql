-- FILE: supabase/migrations/089_create_service_catalog.sql
-- PURPOSE: Katalog služeb (service_catalog) pro výběr do smluv a nákladů pronajímatele
-- DATE: 2026-02-08
-- NOTES: Používá generic_types pro kategorie, typy účtování, DPH a jednotky

-- ============================================================================
-- SERVICE CATALOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.service_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  code TEXT NOT NULL,
  name TEXT NOT NULL,

  category_id UUID REFERENCES public.generic_types(id) ON DELETE SET NULL,
  billing_type_id UUID REFERENCES public.generic_types(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES public.generic_types(id) ON DELETE SET NULL,
  vat_rate_id UUID REFERENCES public.generic_types(id) ON DELETE SET NULL,

  base_price NUMERIC(12,2),
  description TEXT,
  note TEXT,

  active BOOLEAN DEFAULT TRUE,
  is_archived BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT service_catalog_code_unique UNIQUE (code),
  CONSTRAINT service_catalog_base_price_positive CHECK (base_price IS NULL OR base_price >= 0)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_service_catalog_category ON public.service_catalog(category_id) WHERE is_archived = FALSE;
CREATE INDEX IF NOT EXISTS idx_service_catalog_billing_type ON public.service_catalog(billing_type_id) WHERE is_archived = FALSE;
CREATE INDEX IF NOT EXISTS idx_service_catalog_active ON public.service_catalog(active) WHERE is_archived = FALSE;
CREATE INDEX IF NOT EXISTS idx_service_catalog_created ON public.service_catalog(created_at DESC);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.service_catalog IS 'Katalog služeb - centrální seznam služeb pro smlouvy a náklady';
COMMENT ON COLUMN public.service_catalog.code IS 'Unikátní kód služby (slug)';
COMMENT ON COLUMN public.service_catalog.name IS 'Název služby';
COMMENT ON COLUMN public.service_catalog.category_id IS 'Kategorie služby (generic_types: service_types)';
COMMENT ON COLUMN public.service_catalog.billing_type_id IS 'Typ účtování (generic_types: service_billing_types)';
COMMENT ON COLUMN public.service_catalog.unit_id IS 'Jednotka služby (generic_types: service_units)';
COMMENT ON COLUMN public.service_catalog.vat_rate_id IS 'DPH sazba (generic_types: vat_rates)';
COMMENT ON COLUMN public.service_catalog.base_price IS 'Základní cena služby';
COMMENT ON COLUMN public.service_catalog.active IS 'Je služba aktivní?';
COMMENT ON COLUMN public.service_catalog.is_archived IS 'Archivace služby';

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_service_catalog_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS service_catalog_updated_at ON public.service_catalog;
CREATE TRIGGER service_catalog_updated_at
  BEFORE UPDATE ON public.service_catalog
  FOR EACH ROW
  EXECUTE FUNCTION update_service_catalog_updated_at();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.service_catalog ENABLE ROW LEVEL SECURITY;

-- Admins see all
CREATE POLICY "service_catalog_admin_all"
  ON public.service_catalog
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.app_admins
      WHERE user_id = auth.uid()
    )
  );

-- All authenticated users can read
CREATE POLICY "service_catalog_select"
  ON public.service_catalog
  FOR SELECT
  TO authenticated
  USING (TRUE);

-- Landlords can insert
CREATE POLICY "service_catalog_landlord_insert"
  ON public.service_catalog
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.subjects
      WHERE auth_user_id = auth.uid()
      AND is_landlord = TRUE
    )
  );

-- Landlords can update
CREATE POLICY "service_catalog_landlord_update"
  ON public.service_catalog
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.subjects
      WHERE auth_user_id = auth.uid()
      AND is_landlord = TRUE
    )
  );

-- Landlords can delete
CREATE POLICY "service_catalog_landlord_delete"
  ON public.service_catalog
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.subjects
      WHERE auth_user_id = auth.uid()
      AND is_landlord = TRUE
    )
  );
