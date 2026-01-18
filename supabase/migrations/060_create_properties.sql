-- Migration: Create properties table
-- Date: 2026-01-18
-- Purpose: Tabulka pro správu nemovitostí (budovy, pozemky) s adresou jako u subjektů

-- ============================================================================
-- PROPERTIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.properties (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  landlord_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
  property_type_id UUID NOT NULL REFERENCES public.property_types(id) ON DELETE RESTRICT,
  
  -- Basic info
  display_name TEXT NOT NULL,
  internal_code TEXT,
  
  -- Address fields (same as subjects)
  street TEXT,
  house_number TEXT,
  city TEXT,
  zip TEXT,
  country TEXT DEFAULT 'CZ',
  region TEXT,
  
  -- Property details
  land_area NUMERIC(10,2),
  built_up_area NUMERIC(10,2),
  building_area NUMERIC(10,2),
  number_of_floors INTEGER,
  build_year INTEGER,
  reconstruction_year INTEGER,
  
  -- Documentation
  cadastral_area TEXT,
  parcel_number TEXT,
  lv_number TEXT,
  
  -- Additional info
  note TEXT,
  
  -- System fields
  origin_module TEXT DEFAULT '040-nemovitost',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT FALSE,
  
  -- Constraints
  CONSTRAINT properties_zip_format CHECK (zip IS NULL OR zip ~ '^\d{5}$'),
  CONSTRAINT properties_build_year_range CHECK (build_year IS NULL OR (build_year >= 1800 AND build_year <= EXTRACT(YEAR FROM CURRENT_DATE))),
  CONSTRAINT properties_reconstruction_year_range CHECK (reconstruction_year IS NULL OR (reconstruction_year >= build_year AND reconstruction_year <= EXTRACT(YEAR FROM CURRENT_DATE))),
  CONSTRAINT properties_areas_positive CHECK (
    (land_area IS NULL OR land_area > 0) AND
    (built_up_area IS NULL OR built_up_area > 0) AND
    (building_area IS NULL OR building_area > 0)
  )
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_properties_landlord ON public.properties(landlord_id) WHERE is_archived = FALSE;
CREATE INDEX idx_properties_type ON public.properties(property_type_id) WHERE is_archived = FALSE;
CREATE INDEX idx_properties_city ON public.properties(city) WHERE is_archived = FALSE;
CREATE INDEX idx_properties_region ON public.properties(region) WHERE is_archived = FALSE;
CREATE INDEX idx_properties_created ON public.properties(created_at DESC);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.properties IS 'Nemovitosti - budovy a pozemky';
COMMENT ON COLUMN public.properties.landlord_id IS 'Vlastník nemovitosti (pronajímatel)';
COMMENT ON COLUMN public.properties.property_type_id IS 'Typ nemovitosti (Rodinný dům, Bytový dům, Byt, Garáž, Komerční prostor, Pozemek)';
COMMENT ON COLUMN public.properties.display_name IS 'Zobrazovaný název nemovitosti';
COMMENT ON COLUMN public.properties.internal_code IS 'Interní kód pro identifikaci';
COMMENT ON COLUMN public.properties.street IS 'Název ulice (z autocomplete)';
COMMENT ON COLUMN public.properties.house_number IS 'Číslo popisné/orientační';
COMMENT ON COLUMN public.properties.city IS 'Název města/obce';
COMMENT ON COLUMN public.properties.zip IS 'PSČ (5 číslic)';
COMMENT ON COLUMN public.properties.country IS 'Kód státu (CZ, SK, AT, DE, PL)';
COMMENT ON COLUMN public.properties.region IS 'Kraj (PHA, STC, JHC, ...)';
COMMENT ON COLUMN public.properties.land_area IS 'Výměra pozemku (m²)';
COMMENT ON COLUMN public.properties.built_up_area IS 'Zastavěná plocha (m²)';
COMMENT ON COLUMN public.properties.building_area IS 'Užitná plocha budovy (m²)';
COMMENT ON COLUMN public.properties.number_of_floors IS 'Počet podlaží';
COMMENT ON COLUMN public.properties.build_year IS 'Rok výstavby';
COMMENT ON COLUMN public.properties.reconstruction_year IS 'Rok poslední rekonstrukce';
COMMENT ON COLUMN public.properties.cadastral_area IS 'Katastrální území';
COMMENT ON COLUMN public.properties.parcel_number IS 'Číslo parcely';
COMMENT ON COLUMN public.properties.lv_number IS 'List vlastnictví';

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Policy: Admins see all
CREATE POLICY "properties_admin_all"
  ON public.properties
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.user_id = auth.uid()
      AND users.is_admin = TRUE
    )
  );

-- Policy: Landlords see their own properties
CREATE POLICY "properties_landlord_select"
  ON public.properties
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.user_id = auth.uid()
      AND users.subject_id = properties.landlord_id
    )
  );

-- Policy: Landlords can insert their own properties
CREATE POLICY "properties_landlord_insert"
  ON public.properties
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.user_id = auth.uid()
      AND users.subject_id = landlord_id
    )
  );

-- Policy: Landlords can update their own properties
CREATE POLICY "properties_landlord_update"
  ON public.properties
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.user_id = auth.uid()
      AND users.subject_id = properties.landlord_id
    )
  );

-- Policy: Landlords can delete their own properties (soft delete via is_archived)
CREATE POLICY "properties_landlord_delete"
  ON public.properties
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.user_id = auth.uid()
      AND users.subject_id = properties.landlord_id
    )
  );

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_properties_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION update_properties_updated_at();
