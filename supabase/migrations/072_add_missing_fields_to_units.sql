-- Migration: Add missing fields to units table
-- Date: 2026-01-25
-- Purpose: Doplnění polí podle MODULE-PLAN.md - nájemník, dispozice, číslo orientační, správce, rok rekonstrukce

-- Add tenant_id column (FK to subjects)
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL;

-- Add disposition column (replaces rooms as select field)
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS disposition TEXT;

-- Add orientation_number column
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS orientation_number TEXT;

-- Add year_renovated column
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS year_renovated INTEGER;

-- Add manager_name column
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS manager_name TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_units_tenant ON public.units(tenant_id) WHERE is_archived = FALSE;
CREATE INDEX IF NOT EXISTS idx_units_disposition ON public.units(disposition) WHERE is_archived = FALSE;

-- Add comments
COMMENT ON COLUMN public.units.tenant_id IS 'Nájemník jednotky (FK → subjects kde is_tenant=true)';
COMMENT ON COLUMN public.units.disposition IS 'Dispozice jednotky (1+kk, 2+1, 3+kk, 4+1, atipický...)';
COMMENT ON COLUMN public.units.orientation_number IS 'Číslo orientační (může být jiné než u nemovitosti)';
COMMENT ON COLUMN public.units.year_renovated IS 'Rok rekonstrukce jednotky (může být jiný než u nemovitosti)';
COMMENT ON COLUMN public.units.manager_name IS 'Správce jednotky (může být jiný než u nemovitosti)';

-- Add constraints
ALTER TABLE public.units 
ADD CONSTRAINT units_orientation_number_length CHECK (orientation_number IS NULL OR length(orientation_number) <= 10);

ALTER TABLE public.units 
ADD CONSTRAINT units_year_renovated_range CHECK (year_renovated IS NULL OR (year_renovated >= 1800 AND year_renovated <= 2100));

ALTER TABLE public.units 
ADD CONSTRAINT units_manager_name_length CHECK (manager_name IS NULL OR length(manager_name) <= 100);

-- Migrate existing rooms data to disposition (approximate mapping)
UPDATE public.units
SET disposition = CASE 
    WHEN rooms = 1 THEN '1+kk'
    WHEN rooms = 2 THEN '2+kk'
    WHEN rooms = 3 THEN '3+kk'
    WHEN rooms = 4 THEN '4+kk'
    WHEN rooms = 5 THEN '5+kk'
    WHEN rooms >= 6 THEN '6+kk'
    ELSE NULL
END
WHERE rooms IS NOT NULL 
  AND disposition IS NULL;
