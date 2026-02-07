-- Migration: Add landlord_id to units table
-- Date: 2026-01-25
-- Purpose: Jednotka může mít jiného pronajímatele než nemovitost (defaultně z property)

-- Add landlord_id column to units
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS landlord_id UUID REFERENCES public.subjects(id) ON DELETE RESTRICT;

-- Create index for landlord lookups
CREATE INDEX IF NOT EXISTS idx_units_landlord ON public.units(landlord_id) WHERE is_archived = FALSE;

-- Add comment
COMMENT ON COLUMN public.units.landlord_id IS 'Pronajímatel jednotky - může být jiný než u nemovitosti';

-- Update existing units to inherit landlord from property
UPDATE public.units u
SET landlord_id = p.landlord_id
FROM public.properties p
WHERE u.property_id = p.id
  AND u.landlord_id IS NULL;

-- Make landlord_id required (after populating existing records)
ALTER TABLE public.units 
ALTER COLUMN landlord_id SET NOT NULL;
