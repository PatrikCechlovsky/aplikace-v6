-- Migration: Add floors_above_ground, floors_below_ground, units_count to properties
-- Date: 2026-01-25
-- Purpose: Rozšíření informací o nemovitosti - nadzemní/podzemní podlaží a počet jednotek

-- Add floors_above_ground column
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS floors_above_ground INTEGER;

-- Add floors_below_ground column
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS floors_below_ground INTEGER;

-- Add units_count column (manual field, not computed)
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS units_count INTEGER;

-- Add comments
COMMENT ON COLUMN public.properties.floors_above_ground IS 'Počet nadzemních podlaží';
COMMENT ON COLUMN public.properties.floors_below_ground IS 'Počet podzemních podlaží';
COMMENT ON COLUMN public.properties.units_count IS 'Počet jednotek (manuální pole)';

-- Add constraints
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'properties_floors_above_positive'
  ) THEN
    ALTER TABLE public.properties 
    ADD CONSTRAINT properties_floors_above_positive CHECK (floors_above_ground IS NULL OR floors_above_ground >= 0);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'properties_floors_below_positive'
  ) THEN
    ALTER TABLE public.properties 
    ADD CONSTRAINT properties_floors_below_positive CHECK (floors_below_ground IS NULL OR floors_below_ground >= 0);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'properties_units_count_positive'
  ) THEN
    ALTER TABLE public.properties 
    ADD CONSTRAINT properties_units_count_positive CHECK (units_count IS NULL OR units_count >= 0);
  END IF;
END $$;

-- Update existing properties: copy number_of_floors to floors_above_ground
UPDATE public.properties
SET floors_above_ground = number_of_floors
WHERE number_of_floors IS NOT NULL 
  AND floors_above_ground IS NULL;
