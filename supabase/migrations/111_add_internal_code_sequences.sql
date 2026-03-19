-- Migration: Auto-number internal_code for properties and units
-- Date: 2026-03-19
-- Purpose: Nemovitosti 001.. a jednotky 001.. v rámci nemovitosti

-- ============================================================
-- PROPERTIES: GLOBAL SEQUENCE
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS public.properties_internal_code_seq START 1;

-- Backfill properties without internal_code
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY created_at NULLS LAST, id) AS rn
  FROM public.properties
  WHERE internal_code IS NULL OR internal_code = ''
)
UPDATE public.properties p
SET internal_code = LPAD(r.rn::text, 3, '0')
FROM ranked r
WHERE p.id = r.id;

SELECT setval(
  'public.properties_internal_code_seq',
  COALESCE(
    (
      SELECT MAX(
        CASE
          WHEN internal_code ~ '^[0-9]+$' THEN internal_code::int
          ELSE NULL
        END
      )
      FROM public.properties
      WHERE internal_code IS NOT NULL
    ),
    0
  )
);

CREATE OR REPLACE FUNCTION public.assign_property_internal_code()
RETURNS trigger AS $$
BEGIN
  IF NEW.internal_code IS NULL OR NEW.internal_code = '' THEN
    NEW.internal_code := LPAD(nextval('public.properties_internal_code_seq')::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS properties_assign_internal_code ON public.properties;
CREATE TRIGGER properties_assign_internal_code
BEFORE INSERT ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.assign_property_internal_code();

CREATE UNIQUE INDEX IF NOT EXISTS properties_internal_code_unique
ON public.properties (internal_code)
WHERE internal_code IS NOT NULL;

-- ============================================================
-- UNITS: SEQUENCE PER PROPERTY
-- ============================================================

CREATE TABLE IF NOT EXISTS public.property_unit_counters (
  property_id UUID PRIMARY KEY REFERENCES public.properties(id) ON DELETE CASCADE,
  last_number INTEGER NOT NULL DEFAULT 0
);

-- Backfill units without internal_code (per property)
WITH ranked AS (
  SELECT
    id,
    property_id,
    ROW_NUMBER() OVER (PARTITION BY property_id ORDER BY created_at NULLS LAST, id) AS rn
  FROM public.units
  WHERE internal_code IS NULL OR internal_code = ''
)
UPDATE public.units u
SET internal_code = LPAD(r.rn::text, 3, '0')
FROM ranked r
WHERE u.id = r.id;

-- Sync counters from existing units
INSERT INTO public.property_unit_counters (property_id, last_number)
SELECT
  property_id,
  COALESCE(
    MAX(
      CASE
        WHEN internal_code ~ '^[0-9]+$' THEN internal_code::int
        ELSE NULL
      END
    ),
    0
  ) AS last_number
FROM public.units
GROUP BY property_id
ON CONFLICT (property_id) DO UPDATE
SET last_number = EXCLUDED.last_number;

CREATE OR REPLACE FUNCTION public.assign_unit_internal_code()
RETURNS trigger AS $$
DECLARE
  v_last INTEGER;
BEGIN
  IF NEW.internal_code IS NULL OR NEW.internal_code = '' THEN
    INSERT INTO public.property_unit_counters (property_id, last_number)
    VALUES (NEW.property_id, 1)
    ON CONFLICT (property_id)
    DO UPDATE SET last_number = public.property_unit_counters.last_number + 1
    RETURNING last_number INTO v_last;

    NEW.internal_code := LPAD(v_last::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS units_assign_internal_code ON public.units;
CREATE TRIGGER units_assign_internal_code
BEFORE INSERT ON public.units
FOR EACH ROW
EXECUTE FUNCTION public.assign_unit_internal_code();

CREATE UNIQUE INDEX IF NOT EXISTS units_internal_code_unique_per_property
ON public.units (property_id, internal_code)
WHERE internal_code IS NOT NULL;
