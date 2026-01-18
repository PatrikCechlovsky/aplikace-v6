-- FILE: supabase/migrations/065_create_generic_types_unified.sql
-- PURPOSE: Sjednocení všech *_types tabulek do jedné generic_types s category
-- DATE: 2026-01-18
-- NOTES: Migrace subject_types, property_types, unit_types, equipment_types → generic_types

-- ============================================================================
-- GENERIC_TYPES TABLE - Unified type management
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.generic_types (
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
FROM public.subject_types
ON CONFLICT (category, code) DO NOTHING;

-- Migrate property_types (preserve existing UUIDs if they have id column)
INSERT INTO public.generic_types (id, category, code, name, description, color, icon, order_index, active)
SELECT 
  COALESCE(id, gen_random_uuid()),
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
INSERT INTO public.generic_types (id, category, code, name, description, color, icon, order_index, active)
SELECT 
  COALESCE(id, gen_random_uuid()),
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
INSERT INTO public.generic_types (id, category, code, name, description, color, icon, order_index, active)
SELECT 
  COALESCE(id, gen_random_uuid()),
  'equipment_types' AS category,
  code,
  name,
  description,
  color,
  icon,
  order_index,
  active
FROM publi
-- ============================================================================

CREATE INDEX idx_generic_types_category ON public.generic_types(category);
CREATE INDEX idx_generic_types_active ON public.generic_types(active);
CREATE INDEX idx_generic_types_order ON public.generic_types(category, order_index);
CREATE INDEX idx_generic_types_code ON public.generic_types(code);
CREATE INDEX idx_generic_types_category_code ON public.generic_types(category, 
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
COMMENT ON COLUMN public.generic_types.id IS 'UUID surrogate primary key pro FK vztahy';
COMMENT ON COLUMN public.generic_types.category IS 'Kategorie typu (subject_types, property_types, unit_types, equipment_types)';
COMMENT ON COLUMN public.generic_types.code IS 'Business key - uBarva pro UI (hex #RRGGBB)';
COMMENT ON COLUMN public.generic_types.icon IS 'Ikona (emoji nebo kód)';
COMMENT ON COLUMN public.generic_types.order_index IS 'Pořadí pro řazení';
COMMENT ON COLUMN public.generic_types.active IS 'Je typ aktivní?';

-- ============================================================================
-- UPDATE FOREIGN KEYS IN MAIN TABLES
-- ============================================================================
id column to subjects (if not exists)
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
UPDATE public.subjects s
SET subject_type_id = gt.id
FROM public.generic_types gt
WHERE gt.category = 'subject_types'
AND gt.code = s.subject_type
AND s.subject_type_id IS NULL;

-- Add FK constraint
ALTER TABLE public.subjects
  ADD CONSTRAINT fk_subjects_type_id
  FOREIGN KEY (subject_type_id)
  REFERENCES public.generic_types(id)
  ON DELETE RESTRICT;

-- Properties already have property_type_id UUID column pointing to property_types
-- We need to update FK to point to generic_types instead

-- Drop old FK constraint if exists
ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_property_type_id_fkey;

-- Update property_type_id to point to generic_types.id (should already match if UUIDs were preserved)
-- This is a safety check - if property_types.id was migrated to generic_types.id with COALESCE
UPDATE public.properties p
SET property_type_id = gt.id
FROM public.property_types pt
JOIN public.generic_types gt ON gt.category = 'property_types' AND gt.code = pt.code
WHERE p.property_type_id = pt.id
AND p.property_type_id != gt.id;

-- Add new FK constraint to generic_types
ALTER TABLE public.properties
  ADD CONSTRAINT fk_properties_type_generic
  FOREIGN KEY (property_type_id)
  REFERENCES public.generic_types(id)
  ON DELETE RESTRICT
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
      SELECT 1 FRid column to units (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'units'
  ) THEN
    -- Drop old FK if exists
    ALTER TABLE public.units DROP CONSTRAINT IF EXISTS units_unit_type_id_fkey;
    
    -- Update unit_type_id to point to generic_types.id
    UPDATE public.units u
    SET unit_type_id = gt.id
    FROM public.unit_types ut
    JOIN public.generic_types gt ON gt.category = 'unit_types' AND gt.code = ut.code
    WHERE u.unit_type_id = ut.id
    AND u.unit_type_id != gt.id;
    
    -- Add new FK constraint to generic_types
    ALTER TABLE public.units
      ADD CONSTRAINT fk_units_type_generic
      FOREIGN KEY (unit_type_id)
      REFERENCES public.generic_types(id)
      ON DELETE RESTRICT
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
    WHERE e.equipment_id column to equipment (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'equipment'
  ) THEN
    -- Drop old FK if exists
    ALTER TABLE public.equipment DROP CONSTRAINT IF EXISTS equipment_equipment_type_id_fkey;
    
    -- Update equipment_type_id to point to generic_types.id
    UPDATE public.equipment e
    SET equipment_type_id = gt.id
    FROM public.equipment_types et
    JOIN public.generic_types gt ON gt.category = 'equipment_types' AND gt.code = et.code
    WHERE e.equipment_type_id = et.id
    AND e.equipment_type_id != gt.id;
    
    -- Add new FK constraint to generic_types
    ALTER TABLE public.equipment
      ADD CONSTRAINT fk_equipment_type_generic
      FOREIGN KEY (equipment_type_id)
      REFERENCES public.generic_types(id)
      ON DELETE RESTRICT
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
  
-- SELECT subject_type, subject_type_id, COUNT(*) FROM public.subjects GROUP BY subject_type, subject_type_id;

-- Check properties migration (property_type_id should now point to generic_types)
-- SELECT p.property_type_id, gt.category, gt.code, gt.name, COUNT(*) 
-- FROM public.properties p
-- JOIN public.generic_types gt ON p.property_type_id = gt.id
-- GROUP BY p.property_type_id, gt.category, gt.code, gt.nam