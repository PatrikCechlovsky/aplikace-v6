-- Migration: Add landlord_seq to subjects
-- Date: 2026-03-17
-- Purpose: Pořadové číslo pronajímatele (3 znaky, auto-increment)

-- ============================================================
-- COLUMN + SEQUENCE
-- ============================================================

ALTER TABLE public.subjects
  ADD COLUMN IF NOT EXISTS landlord_seq TEXT;

CREATE SEQUENCE IF NOT EXISTS public.landlord_seq_seq START 1;

-- ============================================================
-- BACKFILL PRO EXISTUJÍCÍ PRONAJÍMATELE
-- ============================================================

WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY created_at NULLS LAST, id) AS rn
  FROM public.subjects
  WHERE is_landlord IS TRUE
    AND landlord_seq IS NULL
)
UPDATE public.subjects s
SET landlord_seq = LPAD(r.rn::text, 3, '0')
FROM ranked r
WHERE s.id = r.id;

SELECT setval(
  'public.landlord_seq_seq',
  COALESCE(
    (
      SELECT MAX(
        CASE
          WHEN landlord_seq ~ '^[0-9]+$' THEN landlord_seq::int
          ELSE NULL
        END
      )
      FROM public.subjects
      WHERE landlord_seq IS NOT NULL
    ),
    0
  )
);

-- ============================================================
-- TRIGGER PRO AUTO GENEROVÁNÍ
-- ============================================================

CREATE OR REPLACE FUNCTION public.assign_landlord_seq()
RETURNS trigger AS $$
BEGIN
  IF NEW.is_landlord IS TRUE AND (NEW.landlord_seq IS NULL OR NEW.landlord_seq = '') THEN
    NEW.landlord_seq := LPAD(nextval('public.landlord_seq_seq')::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS subjects_assign_landlord_seq ON public.subjects;
CREATE TRIGGER subjects_assign_landlord_seq
BEFORE INSERT OR UPDATE ON public.subjects
FOR EACH ROW
EXECUTE FUNCTION public.assign_landlord_seq();

-- ============================================================
-- UNIQUE INDEX
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS subjects_landlord_seq_unique
ON public.subjects (landlord_seq)
WHERE landlord_seq IS NOT NULL;
