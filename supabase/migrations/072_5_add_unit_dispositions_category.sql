-- Migration: Add unit_dispositions category to generic_types constraint
-- Date: 2026-01-25
-- Purpose: Rozšíření povoleých kategorií o unit_dispositions (dispozice jednotek)

-- Drop existing constraint
ALTER TABLE public.generic_types 
DROP CONSTRAINT IF EXISTS generic_types_category_check;

-- Add updated constraint with unit_dispositions
ALTER TABLE public.generic_types 
ADD CONSTRAINT generic_types_category_check CHECK (category IN (
  'subject_types',
  'property_types',
  'unit_types',
  'equipment_types',
  'unit_dispositions'
));

COMMENT ON CONSTRAINT generic_types_category_check ON public.generic_types IS 'Povolené kategorie: subject_types, property_types, unit_types, equipment_types, unit_dispositions';
