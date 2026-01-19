-- FILE: supabase/migrations/065_create_generic_types_unified_v2.sql
-- PURPOSE: Sjednocení všech *_types tabulek do jedné generic_types s category
-- DATE: 2026-01-18
-- NOTES: Migrace subject_types, property_types, unit_types, equipment_types → generic_types
-- VERSION: 2 - opravená verze s UUID PK

-- ============================================================================
-- DROP OLD TABLE IF EXISTS (for clean re-run)
-- ============================================================================
DROP TABLE IF EXISTS public.generic_types CASCADE;

-- ============================================================================
-- GENERIC_TYPES TABLE - Unified type management
-- ============================================================================

CREATE TABLE public.generic_types (
  -- Surrogate primary key (UUID for FK relationships)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Business key (composite unique)
  category TEXT NOT NULL,
  code TEXT NOT NULL,
  
  -- Common fields
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  icon TEXT,
  order_index INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  
  -- System fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Composite UNIQUE constraint (code is unique within category)
  CONSTRAINT generic_types_category_code_unique UNIQUE (category, code),
  
  -- Constraints
  CONSTRAINT generic_types_category_check CHECK (category IN (
    'subject_types',
    'property_types',
    'unit_types',
    'equipment_types'
  )),
  CONSTRAINT generic_types_code_not_empty CHECK (LENGTH(TRIM(code)) > 0),
  CONSTRAINT generic_types_name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);

-- ============================================================================
-- MIGRATE DATA FROM EXISTING TABLES
-- ============================================================================

-- Migrate subject_types
INSERT INTO public.generic_types (id, category, code, name, description, color, icon, order_index, active)
SELECT 
  gen_random_uuid(),
  'subject_types' AS category,
  code,
  name,
  description,
  color,
  icon,
  sort_order AS order_index,
  active
FROM public.subject_types;

-- Migrate property_types (HAS id column - preserve UUIDs!)
INSERT INTO public.generic_types (id, category, code, name, description, color, icon, order_index, active)
SELECT 
  id,  -- property_types HAS id UUID column - preserve it!
  'property_types' AS category,
  code,
  name,
  description,
  color,
  icon,
  order_index,
  COALESCE(active, TRUE) AS active
FROM public.property_types;

-- Migrate unit_types
INSERT INTO public.generic_types (id, category, code, name, description, color, icon, order_index, active)
SELECT 
  gen_random_uuid(),
  'unit_types' AS category,
  code,
  name,
  description,
  color,
  icon,
  order_index,
  TRUE AS active
FROM public.unit_types;

-- Migrate equipment_types
INSERT INTO public.generic_types (id, category, code, name, description, color, icon, order_index, active)
SELECT 
  gen_random_uuid(),
  'equipment_types' AS category,
  code,
  name,
  description,
  color,
  icon,
  order_index,
  active
FROM public.equipment_types;

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_generic_types_category ON public.generic_types(category);
CREATE INDEX idx_generic_types_active ON public.generic_types(active);
CREATE INDEX idx_generic_types_order ON public.generic_types(category, order_index);
CREATE INDEX idx_generic_types_code ON public.generic_types(code);
CREATE INDEX idx_generic_types_category_code ON public.generic_types(category, code);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.generic_types IS 'Univerzální číselník pro všechny typy (subjekty, nemovitosti, jednotky, vybavení)';
COMMENT ON COLUMN public.generic_types.id IS 'UUID surrogate primary key pro FK vztahy';
COMMENT ON COLUMN public.generic_types.category IS 'Kategorie typu (subject_types, property_types, unit_types, equipment_types)';
COMMENT ON COLUMN public.generic_types.code IS 'Business key - unikátní kód typu v rámci kategorie';
COMMENT ON COLUMN public.generic_types.name IS 'Zobrazovaný název';
COMMENT ON COLUMN public.generic_types.description IS 'Popis typu';
COMMENT ON COLUMN public.generic_types.color IS 'Barva pro UI (hex #RRGGBB)';
COMMENT ON COLUMN public.generic_types.icon IS 'Ikona (emoji nebo kód)';
COMMENT ON COLUMN public.generic_types.order_index IS 'Pořadí pro řazení';
COMMENT ON COLUMN public.generic_types.active IS 'Je typ aktivní?';

-- ============================================================================
-- UPDATE FOREIGN KEYS IN MAIN TABLES
-- ============================================================================

-- SUBJECTS: Add subject_type_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subjects' 
    AND column_name = 'subject_type_id'
  ) THEN
    ALTER TABLE public.subjects ADD COLUMN subject_type_id UUID;
  END IF;
END $$;

-- Migrate subject_type values (lookup generic_types.id by code)
-- Update ALL subjects, even if they already have subject_type_id
-- (old UUIDs don't match new generic_types UUIDs)
UPDATE public.subjects s
SET subject_type_id = gt.id
FROM public.generic_types gt
WHERE gt.category = 'subject_types'
AND gt.code = s.subject_type;

-- Add FK constraint for subjects
ALTER TABLE public.subjects
  ADD CONSTRAINT fk_subjects_type_id
  FOREIGN KEY (subject_type_id)
  REFERENCES public.generic_types(id)
  ON DELETE RESTRICT;

-- Create index for subjects
CREATE INDEX idx_subjects_type_id ON public.subjects(subject_type_id);

-- PROPERTIES: Update FK to point to generic_types
-- Drop old FK constraint if exists
ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_property_type_id_fkey;

-- property_types HAS id column, so property_type_id already points to correct UUID
-- Just add new FK constraint to generic_types (id values were preserved in INSERT)
ALTER TABLE public.properties
  ADD CONSTRAINT fk_properties_type_generic
  FOREIGN KEY (property_type_id)
  REFERENCES public.generic_types(id)
  ON DELETE RESTRICT;

-- UNITS: Update FK if table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'units'
  ) THEN
    -- Drop view that depends on unit_type_id column
    DROP VIEW IF EXISTS public.v_units_list CASCADE;
    
    -- Drop old FK if exists
    ALTER TABLE public.units DROP CONSTRAINT IF EXISTS units_unit_type_id_fkey;
    
    -- Create new UUID column
    ALTER TABLE public.units ADD COLUMN IF NOT EXISTS unit_type_id_new UUID;
    
    -- Populate new UUID column with lookup from generic_types
    UPDATE public.units u
    SET unit_type_id_new = gt.id
    FROM public.generic_types gt
    WHERE gt.category = 'unit_types' AND gt.code = u.unit_type_id;
    
    -- Drop old TEXT column
    ALTER TABLE public.units DROP COLUMN unit_type_id;
    
    -- Rename new column to original name
    ALTER TABLE public.units RENAME COLUMN unit_type_id_new TO unit_type_id;
    
    -- Add new FK constraint to generic_types
    ALTER TABLE public.units
      ADD CONSTRAINT fk_units_type_generic
      FOREIGN KEY (unit_type_id)
      REFERENCES public.generic_types(id)
      ON DELETE RESTRICT;
      
    -- Recreate view with updated JOIN (now using UUID)
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
      0 AS user_count,
      -- Unit type info from generic_types
      gt.name AS unit_type_name,
      gt.icon AS unit_type_icon
    FROM public.units u
    JOIN public.properties p ON u.property_id = p.id
    JOIN public.generic_types gt ON u.unit_type_id = gt.id AND gt.category = 'unit_types'
    WHERE u.is_archived = FALSE;
    
    COMMENT ON VIEW public.v_units_list IS 'Seznam jednotek s read-only poli z nemovitosti a vypočítanými hodnotami';
  END IF;
END $$;

-- EQUIPMENT: Update FK if table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'equipment'
  ) THEN
    -- Drop old FK if exists
    ALTER TABLE public.equipment DROP CONSTRAINT IF EXISTS equipment_equipment_type_id_fkey;
    
    -- Create new UUID column
    ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS equipment_type_id_new UUID;
    
    -- Populate new UUID column with lookup from generic_types
    UPDATE public.equipment e
    SET equipment_type_id_new = gt.id
    FROM public.generic_types gt
    WHERE gt.category = 'equipment_types' AND gt.code = e.equipment_type_id;
    
    -- Drop old TEXT column
    ALTER TABLE public.equipment DROP COLUMN equipment_type_id;
    
    -- Rename new column to original name
    ALTER TABLE public.equipment RENAME COLUMN equipment_type_id_new TO equipment_type_id;
    
    -- Add new FK constraint to generic_types
    ALTER TABLE public.equipment
      ADD CONSTRAINT fk_equipment_type_generic
      FOREIGN KEY (equipment_type_id)
      REFERENCES public.generic_types(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.generic_types ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read active types
CREATE POLICY "generic_types_select"
  ON public.generic_types
  FOR SELECT
  TO authenticated
  USING (active = TRUE);

-- Policy: Only admins can modify
CREATE POLICY "generic_types_admin_all"
  ON public.generic_types
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.app_admins
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- DROP OLD COLUMNS (after verification)
-- ============================================================================

-- Note: This is commented out for safety. Uncomment after verifying all works correctly.

-- ALTER TABLE public.subjects DROP COLUMN IF EXISTS subject_type CASCADE;

-- ============================================================================
-- DROP OLD TABLES (after verification)
-- ============================================================================

-- Note: This is commented out for safety. Uncomment after verifying all works correctly.

-- DROP TABLE IF EXISTS public.subject_types CASCADE;
-- DROP TABLE IF EXISTS public.property_types CASCADE;
-- DROP TABLE IF EXISTS public.unit_types CASCADE;
-- DROP TABLE IF EXISTS public.equipment_types CASCADE;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check data migration
-- SELECT category, COUNT(*) as count FROM public.generic_types GROUP BY category ORDER BY category;

-- Check subjects migration
-- SELECT subject_type, subject_type_id, COUNT(*) FROM public.subjects GROUP BY subject_type, subject_type_id;

-- Check properties migration (property_type_id should now point to generic_types)
-- SELECT p.property_type_id, gt.category, gt.code, gt.name, COUNT(*) 
-- FROM public.properties p
-- JOIN public.generic_types gt ON p.property_type_id = gt.id
-- GROUP BY p.property_type_id, gt.category, gt.code, gt.name;
