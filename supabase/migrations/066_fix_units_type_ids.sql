-- Migration: Fix unit_type_id in units table
-- Date: 2026-01-19
-- Purpose: Doplnění unit_type_id pro existující jednotky podle jejich názvu a účelu
-- NOTES: Po migraci 065 (generic_types) je unit_type_id UUID, ale seed data 063 ho nenaplnila

-- ============================================================================
-- UPDATE UNIT_TYPE_ID PODLE NÁZVU JEDNOTKY
-- ============================================================================

-- Byty (obsahují "Byt" v názvu)
UPDATE public.units
SET unit_type_id = (
  SELECT id FROM public.generic_types 
  WHERE category = 'unit_types' AND code = 'byt' 
  LIMIT 1
)
WHERE unit_type_id IS NULL
  AND display_name ILIKE '%byt%';

-- Pokoje (obsahují "Pokoj" v názvu)
-- Note: Může být 'pokoj' nebo 'jina_jednotka' - zkusíme obojí
UPDATE public.units
SET unit_type_id = (
  SELECT id FROM public.generic_types 
  WHERE category = 'unit_types' 
    AND (code = 'pokoj' OR code = 'jina_jednotka')
  ORDER BY CASE WHEN code = 'pokoj' THEN 1 ELSE 2 END
  LIMIT 1
)
WHERE unit_type_id IS NULL
  AND display_name ILIKE '%pokoj%';

-- Garáže (obsahují "Garáž" v názvu)
UPDATE public.units
SET unit_type_id = (
  SELECT id FROM public.generic_types 
  WHERE category = 'unit_types' AND code = 'garaz' 
  LIMIT 1
)
WHERE unit_type_id IS NULL
  AND display_name ILIKE '%garáž%';

-- Dílny (obsahují "Dílna" v názvu)
UPDATE public.units
SET unit_type_id = (
  SELECT id FROM public.generic_types 
  WHERE category = 'unit_types' AND code = 'dilna' 
  LIMIT 1
)
WHERE unit_type_id IS NULL
  AND display_name ILIKE '%dílna%';

-- Kanceláře (obsahují "Kancelář" v názvu)
UPDATE public.units
SET unit_type_id = (
  SELECT id FROM public.generic_types 
  WHERE category = 'unit_types' AND code = 'kancelar' 
  LIMIT 1
)
WHERE unit_type_id IS NULL
  AND display_name ILIKE '%kancelář%';

-- Sklady (obsahují "Sklad" v názvu)
UPDATE public.units
SET unit_type_id = (
  SELECT id FROM public.generic_types 
  WHERE category = 'unit_types' AND code = 'sklad' 
  LIMIT 1
)
WHERE unit_type_id IS NULL
  AND display_name ILIKE '%sklad%';

-- Sklepy (obsahují "Sklep" v názvu)
UPDATE public.units
SET unit_type_id = (
  SELECT id FROM public.generic_types 
  WHERE category = 'unit_types' AND code = 'sklep' 
  LIMIT 1
)
WHERE unit_type_id IS NULL
  AND display_name ILIKE '%sklep%';

-- Komory (obsahují "Komora" v názvu)
UPDATE public.units
SET unit_type_id = (
  SELECT id FROM public.generic_types 
  WHERE category = 'unit_types' AND code = 'komora' 
  LIMIT 1
)
WHERE unit_type_id IS NULL
  AND display_name ILIKE '%komora%';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Výpis jednotek, které stále nemají přiřazený typ
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count 
  FROM public.units 
  WHERE unit_type_id IS NULL;
  
  IF missing_count > 0 THEN
    RAISE NOTICE '⚠️  % jednotek stále nemá přiřazený unit_type_id', missing_count;
  ELSE
    RAISE NOTICE '✅ Všechny jednotky mají přiřazený unit_type_id';
  END IF;
END $$;
