-- Migration: Create units table
-- Date: 2026-01-18
-- Purpose: Tabulka pro správu jednotek (byty, pokoje, garáže) s vazbou na nemovitosti

-- ============================================================================
-- UNITS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.units (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  unit_type_id UUID NOT NULL REFERENCES public.generic_types(id) ON DELETE RESTRICT,
  
  -- Basic info
  display_name TEXT NOT NULL,
  internal_code TEXT,
  
  -- Address fields (inherited from property, can be overridden)
  street TEXT,
  house_number TEXT,
  city TEXT,
  zip TEXT,
  country TEXT DEFAULT 'CZ',
  region TEXT,
  
  -- Unit details
  floor INTEGER,
  door_number TEXT,
  area NUMERIC(10,2),
  rooms NUMERIC(3,1),
  status TEXT DEFAULT 'available',
  
  -- Additional info
  note TEXT,
  
  -- System fields
  origin_module TEXT DEFAULT '040-nemovitost',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT FALSE,
  
  -- Constraints
  CONSTRAINT units_zip_format CHECK (zip IS NULL OR zip ~ '^\d{5}$'),
  CONSTRAINT units_area_positive CHECK (area IS NULL OR area > 0),
  CONSTRAINT units_rooms_positive CHECK (rooms IS NULL OR rooms > 0),
  CONSTRAINT units_status_valid CHECK (status IN ('occupied', 'available', 'reserved', 'renovation'))
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_units_property ON public.units(property_id) WHERE is_archived = FALSE;
CREATE INDEX idx_units_type ON public.units(unit_type_id) WHERE is_archived = FALSE;
CREATE INDEX idx_units_status ON public.units(status) WHERE is_archived = FALSE;
CREATE INDEX idx_units_created ON public.units(created_at DESC);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.units IS 'Jednotky - byty, pokoje, garáže, kanceláře, sklady';
COMMENT ON COLUMN public.units.property_id IS 'Nemovitost, ke které jednotka patří';
COMMENT ON COLUMN public.units.unit_type_id IS 'Typ jednotky (Byt, Pokoj, Garáž, Dílna, Kancelář, Sklad)';
COMMENT ON COLUMN public.units.display_name IS 'Zobrazovaný název jednotky';
COMMENT ON COLUMN public.units.internal_code IS 'Interní kód pro identifikaci';
COMMENT ON COLUMN public.units.street IS 'Název ulice (zdědí z property nebo přepíše)';
COMMENT ON COLUMN public.units.house_number IS 'Číslo popisné/orientační';
COMMENT ON COLUMN public.units.city IS 'Název města/obce';
COMMENT ON COLUMN public.units.zip IS 'PSČ (5 číslic)';
COMMENT ON COLUMN public.units.country IS 'Kód státu (CZ, SK, AT, DE, PL)';
COMMENT ON COLUMN public.units.region IS 'Kraj (PHA, STC, JHC, ...)';
COMMENT ON COLUMN public.units.floor IS 'Patro';
COMMENT ON COLUMN public.units.door_number IS 'Číslo dveří/bytu';
COMMENT ON COLUMN public.units.area IS 'Užitná plocha (m²)';
COMMENT ON COLUMN public.units.rooms IS 'Počet pokojů (1, 1.5, 2, 2.5, ...)';
COMMENT ON COLUMN public.units.status IS 'Stav jednotky (occupied, available, reserved, renovation)';

-- ============================================================================
-- VIEW: Units with calculated fields
-- ============================================================================

CREATE OR REPLACE VIEW public.v_units_list AS
SELECT 
  u.*,
  -- Property info (read-only)
  p.display_name AS property_name,
  p.landlord_id,
  p.property_type_id,
  p.build_year AS property_build_year,
  p.reconstruction_year AS property_reconstruction_year,
  -- Calculated fields (read-only)
  ROUND((u.area / NULLIF(p.building_area, 0)) * 100, 2) AS area_ratio_percent,
  (
    SELECT COUNT(DISTINCT usr.user_id)
    FROM public.users usr
    WHERE usr.unit_id = u.id
    AND usr.is_archived = FALSE
  ) AS user_count,
  -- Unit type info
  gt.label AS unit_type_name,
  gt.icon AS unit_type_icon
FROM public.units u
JOIN public.properties p ON u.property_id = p.id
JOIN public.generic_types gt ON u.unit_type_id = gt.id
WHERE u.is_archived = FALSE;

COMMENT ON VIEW public.v_units_list IS 'Seznam jednotek s read-only poli z nemovitosti a vypočítanými hodnotami';

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

-- Policy: Admins see all
CREATE POLICY "units_admin_all"
  ON public.units
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.user_id = auth.uid()
      AND users.is_admin = TRUE
    )
  );

-- Policy: Landlords see units of their properties
CREATE POLICY "units_landlord_select"
  ON public.units
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.properties p ON p.landlord_id = u.subject_id
      WHERE u.user_id = auth.uid()
      AND p.id = units.property_id
    )
  );

-- Policy: Landlords can insert units for their properties
CREATE POLICY "units_landlord_insert"
  ON public.units
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.properties p ON p.landlord_id = u.subject_id
      WHERE u.user_id = auth.uid()
      AND p.id = property_id
    )
  );

-- Policy: Landlords can update units of their properties
CREATE POLICY "units_landlord_update"
  ON public.units
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.properties p ON p.landlord_id = u.subject_id
      WHERE u.user_id = auth.uid()
      AND p.id = units.property_id
    )
  );

-- Policy: Landlords can delete units of their properties
CREATE POLICY "units_landlord_delete"
  ON public.units
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.properties p ON p.landlord_id = u.subject_id
      WHERE u.user_id = auth.uid()
      AND p.id = units.property_id
    )
  );

-- Policy: Tenants see their own unit
CREATE POLICY "units_tenant_select"
  ON public.units
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.user_id = auth.uid()
      AND users.unit_id = units.id
    )
  );

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_units_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER units_updated_at
  BEFORE UPDATE ON public.units
  FOR EACH ROW
  EXECUTE FUNCTION update_units_updated_at();
