-- Migration: Create equipment tables
-- Date: 2026-01-18
-- Purpose: Tabulky pro správu vybavení nemovitostí a jednotek (katalog + vazby)

-- ============================================================================
-- EQUIPMENT CATALOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.equipment_catalog (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic info
  equipment_name TEXT NOT NULL,
  equipment_type_id TEXT NOT NULL REFERENCES public.equipment_types(code) ON DELETE RESTRICT,
  
  -- Pricing
  purchase_price NUMERIC(12,2),
  purchase_date DATE,
  
  -- System fields
  origin_module TEXT DEFAULT '040-nemovitost',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT FALSE,
  
  -- Constraints
  CONSTRAINT equipment_catalog_price_positive CHECK (purchase_price IS NULL OR purchase_price >= 0)
);

-- ============================================================================
-- UNIT EQUIPMENT TABLE (vazba equipment -> unit)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.unit_equipment (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES public.equipment_catalog(id) ON DELETE CASCADE,
  
  -- Equipment details
  quantity INTEGER DEFAULT 1,
  state TEXT DEFAULT 'good',
  installation_date DATE,
  
  -- Additional info
  note TEXT,
  
  -- System fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT FALSE,
  
  -- Constraints
  CONSTRAINT unit_equipment_quantity_positive CHECK (quantity > 0),
  CONSTRAINT unit_equipment_state_valid CHECK (state IN ('new', 'good', 'damaged', 'to_replace')),
  CONSTRAINT unit_equipment_unique UNIQUE (unit_id, equipment_id, is_archived)
);

-- ============================================================================
-- PROPERTY EQUIPMENT TABLE (vazba equipment -> property)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.property_equipment (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES public.equipment_catalog(id) ON DELETE CASCADE,
  
  -- Equipment details
  quantity INTEGER DEFAULT 1,
  state TEXT DEFAULT 'good',
  installation_date DATE,
  
  -- Additional info
  note TEXT,
  
  -- System fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT FALSE,
  
  -- Constraints
  CONSTRAINT property_equipment_quantity_positive CHECK (quantity > 0),
  CONSTRAINT property_equipment_state_valid CHECK (state IN ('new', 'good', 'damaged', 'to_replace')),
  CONSTRAINT property_equipment_unique UNIQUE (property_id, equipment_id, is_archived)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Equipment catalog
CREATE INDEX idx_equipment_catalog_type ON public.equipment_catalog(equipment_type_id) WHERE is_archived = FALSE;
CREATE INDEX idx_equipment_catalog_created ON public.equipment_catalog(created_at DESC);

-- Unit equipment
CREATE INDEX idx_unit_equipment_unit ON public.unit_equipment(unit_id) WHERE is_archived = FALSE;
CREATE INDEX idx_unit_equipment_equipment ON public.unit_equipment(equipment_id) WHERE is_archived = FALSE;
CREATE INDEX idx_unit_equipment_state ON public.unit_equipment(state) WHERE is_archived = FALSE;

-- Property equipment
CREATE INDEX idx_property_equipment_property ON public.property_equipment(property_id) WHERE is_archived = FALSE;
CREATE INDEX idx_property_equipment_equipment ON public.property_equipment(equipment_id) WHERE is_archived = FALSE;
CREATE INDEX idx_property_equipment_state ON public.property_equipment(state) WHERE is_archived = FALSE;

-- ============================================================================
-- COMMENTS
-- ============================================================================

-- Equipment catalog
COMMENT ON TABLE public.equipment_catalog IS 'Katalog vybavení - centrální seznam všech položek';
COMMENT ON COLUMN public.equipment_catalog.equipment_name IS 'Název vybavení';
COMMENT ON COLUMN public.equipment_catalog.equipment_type_id IS 'Kategorie vybavení (generic type)';
COMMENT ON COLUMN public.equipment_catalog.purchase_price IS 'Pořizovací cena';
COMMENT ON COLUMN public.equipment_catalog.purchase_date IS 'Datum pořízení';

-- Unit equipment
COMMENT ON TABLE public.unit_equipment IS 'Vazba vybavení k jednotkám';
COMMENT ON COLUMN public.unit_equipment.unit_id IS 'Jednotka, ke které vybavení patří';
COMMENT ON COLUMN public.unit_equipment.equipment_id IS 'Vybavení z katalogu';
COMMENT ON COLUMN public.unit_equipment.quantity IS 'Počet kusů';
COMMENT ON COLUMN public.unit_equipment.state IS 'Stav vybavení (new, good, damaged, to_replace)';
COMMENT ON COLUMN public.unit_equipment.installation_date IS 'Datum instalace';

-- Property equipment
COMMENT ON TABLE public.property_equipment IS 'Vazba vybavení k nemovitostem (společné prostory)';
COMMENT ON COLUMN public.property_equipment.property_id IS 'Nemovitost, ke které vybavení patří';
COMMENT ON COLUMN public.property_equipment.equipment_id IS 'Vybavení z katalogu';
COMMENT ON COLUMN public.property_equipment.quantity IS 'Počet kusů';
COMMENT ON COLUMN public.property_equipment.state IS 'Stav vybavení (new, good, damaged, to_replace)';
COMMENT ON COLUMN public.property_equipment.installation_date IS 'Datum instalace';

-- ============================================================================
-- VIEW: Unit equipment with calculated total price
-- ============================================================================

CREATE OR REPLACE VIEW public.v_unit_equipment_list AS
SELECT 
  ue.*,
  ec.equipment_name,
  ec.equipment_type_id,
  ec.purchase_price,
  ec.purchase_date,
  et.name AS equipment_type_name,
  et.icon AS equipment_type_icon,
  -- Calculated total price
  ROUND(ec.purchase_price * ue.quantity, 2) AS total_price
FROM public.unit_equipment ue
JOIN public.equipment_catalog ec ON ue.equipment_id = ec.id
JOIN public.equipment_types et ON ec.equipment_type_id = et.code
WHERE ue.is_archived = FALSE;

COMMENT ON VIEW public.v_unit_equipment_list IS 'Seznam vybavení jednotek s vypočítanou celkovou cenou';

-- ============================================================================
-- VIEW: Property equipment with calculated total price
-- ============================================================================

CREATE OR REPLACE VIEW public.v_property_equipment_list AS
SELECT 
  pe.*,
  ec.equipment_name,
  ec.equipment_type_id,
  ec.purchase_price,
  ec.purchase_date,
  et.name AS equipment_type_name,
  et.icon AS equipment_type_icon,
  -- Calculated total price
  ROUND(ec.purchase_price * pe.quantity, 2) AS total_price
FROM public.property_equipment pe
JOIN public.equipment_catalog ec ON pe.equipment_id = ec.id
JOIN public.equipment_types et ON ec.equipment_type_id = et.code
WHERE pe.is_archived = FALSE;

COMMENT ON VIEW public.v_property_equipment_list IS 'Seznam vybavení nemovitostí s vypočítanou celkovou cenou';

-- ============================================================================
-- RLS POLICIES - Equipment Catalog
-- ============================================================================

ALTER TABLE public.equipment_catalog ENABLE ROW LEVEL SECURITY;

-- Policy: Admins see all
CREATE POLICY "equipment_catalog_admin_all"
  ON public.equipment_catalog
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.user_id = auth.uid()
      AND users.is_admin = TRUE
    )
  );

-- Policy: All authenticated users can read equipment catalog
CREATE POLICY "equipment_catalog_select"
  ON public.equipment_catalog
  FOR SELECT
  TO authenticated
  USING (TRUE);

-- Policy: Only admins and landlords can manage catalog
CREATE POLICY "equipment_catalog_manage"
  ON public.equipment_catalog
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.user_id = auth.uid()
      AND (users.is_admin = TRUE OR users.is_landlord = TRUE)
    )
  );

-- ============================================================================
-- RLS POLICIES - Unit Equipment
-- ============================================================================

ALTER TABLE public.unit_equipment ENABLE ROW LEVEL SECURITY;

-- Policy: Admins see all
CREATE POLICY "unit_equipment_admin_all"
  ON public.unit_equipment
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.user_id = auth.uid()
      AND users.is_admin = TRUE
    )
  );

-- Policy: Landlords see equipment of their units
CREATE POLICY "unit_equipment_landlord_select"
  ON public.unit_equipment
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.units un ON un.id = unit_equipment.unit_id
      JOIN public.properties p ON p.id = un.property_id
      WHERE u.user_id = auth.uid()
      AND p.landlord_id = u.subject_id
    )
  );

-- Policy: Landlords can manage equipment of their units
CREATE POLICY "unit_equipment_landlord_manage"
  ON public.unit_equipment
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.units un ON un.id = unit_equipment.unit_id
      JOIN public.properties p ON p.id = un.property_id
      WHERE u.user_id = auth.uid()
      AND p.landlord_id = u.subject_id
    )
  );

-- Policy: Tenants can see equipment in their unit
CREATE POLICY "unit_equipment_tenant_select"
  ON public.unit_equipment
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.user_id = auth.uid()
      AND users.unit_id = unit_equipment.unit_id
    )
  );

-- ============================================================================
-- RLS POLICIES - Property Equipment
-- ============================================================================

ALTER TABLE public.property_equipment ENABLE ROW LEVEL SECURITY;

-- Policy: Admins see all
CREATE POLICY "property_equipment_admin_all"
  ON public.property_equipment
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.user_id = auth.uid()
      AND users.is_admin = TRUE
    )
  );

-- Policy: Landlords see equipment of their properties
CREATE POLICY "property_equipment_landlord_select"
  ON public.property_equipment
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.properties p ON p.id = property_equipment.property_id
      WHERE u.user_id = auth.uid()
      AND p.landlord_id = u.subject_id
    )
  );

-- Policy: Landlords can manage equipment of their properties
CREATE POLICY "property_equipment_landlord_manage"
  ON public.property_equipment
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.properties p ON p.id = property_equipment.property_id
      WHERE u.user_id = auth.uid()
      AND p.landlord_id = u.subject_id
    )
  );

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_equipment_catalog_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER equipment_catalog_updated_at
  BEFORE UPDATE ON public.equipment_catalog
  FOR EACH ROW
  EXECUTE FUNCTION update_equipment_catalog_updated_at();

CREATE OR REPLACE FUNCTION update_unit_equipment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER unit_equipment_updated_at
  BEFORE UPDATE ON public.unit_equipment
  FOR EACH ROW
  EXECUTE FUNCTION update_unit_equipment_updated_at();

CREATE OR REPLACE FUNCTION update_property_equipment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER property_equipment_updated_at
  BEFORE UPDATE ON public.property_equipment
  FOR EACH ROW
  EXECUTE FUNCTION update_property_equipment_updated_at();
