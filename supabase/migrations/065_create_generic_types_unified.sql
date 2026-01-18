-- FILE: supabase/migrations/065_create_generic_types_unified.sql
-- PURPOSE: Sjednocení všech *_types tabulek do jedné generic_types s category
-- DATE: 2026-01-18
-- NOTES: Migrace subject_types, property_types, unit_types, equipment_types → generic_types

-- ============================================================================
-- GENERIC_TYPES TABLE - Unified type management
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.generic_types (
  -- Composite primary key (category + code)
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
  
  -- Composite PK
  PRIMARY KEY (category, code),
  
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
INSERT INTO public.generic_types (category, code, name, description, color, icon, order_index, active)
SELECT 
  'subject_types' AS category,
  code,
  name,
  description,
  color,
  icon,
  sort_order AS order_index,
  active
FROM public.subject_types
ON CONFLICT (category, code) DO NOTHING;

-- Migrate property_types
INSERT INTO public.generic_types (category, code, name, description, color, icon, order_index, active)
SELECT 
  'property_types' AS category,
  code,
  name,
  description,
  color,
  icon,
  order_index,
  TRUE AS active
FROM public.property_types
ON CONFLICT (category, code) DO NOTHING;

-- Migrate unit_types
INSERT INTO public.generic_types (category, code, name, description, color, icon, order_index, active)
SELECT 
  'unit_types' AS category,
  code,
  name,
  description,
  color,
  icon,
  order_index,
  TRUE AS active
FROM public.unit_types
ON CONFLICT (category, code) DO NOTHING;

-- Migrate equipment_types
INSERT INTO public.generic_types (category, code, name, description, color, icon, order_index, active)
SELECT 
  'equipment_types' AS category,
  code,
  name,
  description,
  color,
  icon,
  order_index,
  active
FROM public.equipment_types
ON CONFLICT (category, code) DO NOTHING;

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_generic_types_category ON public.generic_types(category);
CREATE INDEX idx_generic_types_active ON public.generic_types(active);
CREATE INDEX idx_generic_types_order ON public.generic_types(category, order_index);
CREATE INDEX idx_generic_types_code ON public.generic_types(code);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.generic_types IS 'Univerzální číselník pro všechny typy (subjekty, nemovitosti, jednotky, vybavení)';
COMMENT ON COLUMN public.generic_types.category IS 'Kategorie typu (subject_types, property_types, unit_types, equipment_types)';
COMMENT ON COLUMN public.generic_types.code IS 'Unikátní kód typu v rámci kategorie';
COMMENT ON COLUMN public.generic_types.name IS 'Zobrazovaný název';
COMMENT ON COLUMN public.generic_types.description IS 'Popis typu';
COMMENT ON COLUMN public.generic_types.color IS 'Barva pro UI (hex #RRGGBB)';
COMMENT ON COLUMN public.generic_types.icon IS 'Ikona (emoji nebo kód)';
COMMENT ON COLUMN public.generic_types.order_index IS 'Pořadí pro řazení';
COMMENT ON COLUMN public.generic_types.active IS 'Je typ aktivní?';

-- ============================================================================
-- UPDATE FOREIGN KEYS IN MAIN TABLES
-- ============================================================================

-- Add subject_type_code column to subjects (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subjects' 
    AND column_name = 'subject_type_code'
  ) THEN
    ALTER TABLE public.subjects ADD COLUMN subject_type_code TEXT;
  END IF;
END $$;

-- Migrate subject_type values
UPDATE public.subjects 
SET subject_type_code = subject_type
WHERE subject_type_code IS NULL;

-- Add FK constraint
ALTER TABLE public.subjects
  ADD CONSTRAINT fk_subjects_type_code
  FOREIGN KEY (subject_type_code)
  REFERENCES public.generic_types(code)
  ON DELETE RESTRICT;

-- Create index
CREATE INDEX idx_subjects_type_code ON public.subjects(subject_type_code);

-- Add property_type_code column to properties (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'properties' 
    AND column_name = 'property_type_code'
  ) THEN
    ALTER TABLE public.properties ADD COLUMN property_type_code TEXT;
  END IF;
END $$;

-- Migrate property_type values from property_types table
UPDATE public.properties p
SET property_type_code = pt.code
FROM public.property_types pt
WHERE p.property_type_id = pt.id
AND p.property_type_code IS NULL;

-- Make property_type_code NOT NULL
ALTER TABLE public.properties
  ALTER COLUMN property_type_code SET NOT NULL;

-- Add FK constraint
ALTER TABLE public.properties
  ADD CONSTRAINT fk_properties_type_code
  FOREIGN KEY (property_type_code)
  REFERENCES public.generic_types(code)
  ON DELETE RESTRICT;

-- Create index
CREATE INDEX idx_properties_type_code ON public.properties(property_type_code);

-- Add unit_type_code column to units (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'units'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'units' 
      AND column_name = 'unit_type_code'
    ) THEN
      ALTER TABLE public.units ADD COLUMN unit_type_code TEXT;
    END IF;
    
    -- Migrate unit_type values
    UPDATE public.units u
    SET unit_type_code = ut.code
    FROM public.unit_types ut
    WHERE u.unit_type_id = ut.id
    AND u.unit_type_code IS NULL;
    
    -- Make unit_type_code NOT NULL
    ALTER TABLE public.units
      ALTER COLUMN unit_type_code SET NOT NULL;
    
    -- Add FK constraint
    ALTER TABLE public.units
      ADD CONSTRAINT fk_units_type_code
      FOREIGN KEY (unit_type_code)
      REFERENCES public.generic_types(code)
      ON DELETE RESTRICT;
    
    -- Create index
    CREATE INDEX idx_units_type_code ON public.units(unit_type_code);
  END IF;
END $$;

-- Add equipment_type_code column to equipment (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'equipment'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'equipment' 
      AND column_name = 'equipment_type_code'
    ) THEN
      ALTER TABLE public.equipment ADD COLUMN equipment_type_code TEXT;
    END IF;
    
    -- Migrate equipment_type values
    UPDATE public.equipment e
    SET equipment_type_code = et.code
    FROM public.equipment_types et
    WHERE e.equipment_type_id = et.id
    AND e.equipment_type_code IS NULL;
    
    -- Make equipment_type_code NOT NULL
    ALTER TABLE public.equipment
      ALTER COLUMN equipment_type_code SET NOT NULL;
    
    -- Add FK constraint
    ALTER TABLE public.equipment
      ADD CONSTRAINT fk_equipment_type_code
      FOREIGN KEY (equipment_type_code)
      REFERENCES public.generic_types(code)
      ON DELETE RESTRICT;
    
    -- Create index
    CREATE INDEX idx_equipment_type_code ON public.equipment(equipment_type_code);
  END IF;
END $$;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.generic_types ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read
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
-- ALTER TABLE public.properties DROP COLUMN IF EXISTS property_type_id CASCADE;
-- ALTER TABLE public.units DROP COLUMN IF EXISTS unit_type_id CASCADE;
-- ALTER TABLE public.equipment DROP COLUMN IF EXISTS equipment_type_id CASCADE;

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
-- SELECT subject_type, subject_type_code, COUNT(*) FROM public.subjects GROUP BY subject_type, subject_type_code;

-- Check properties migration
-- SELECT property_type_code, COUNT(*) FROM public.properties GROUP BY property_type_code;
