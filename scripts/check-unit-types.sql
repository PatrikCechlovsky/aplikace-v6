-- Quick fix script to update unit_type_id in units table
-- Run this directly in Supabase SQL editor

-- Show current unit_types in generic_types
SELECT 
  code, 
  name, 
  icon, 
  color,
  order_index
FROM public.generic_types 
WHERE category = 'unit_types' 
ORDER BY order_index;

-- Show units without type
SELECT 
  id,
  display_name,
  unit_type_id
FROM public.units
WHERE unit_type_id IS NULL
ORDER BY display_name;
