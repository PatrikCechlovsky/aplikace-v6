-- FILE: supabase/migrations/083_add_property_room_types.sql
-- PURPOSE: Přidání nových typů místností pro nemovitosti (zahrada, garáž, sklep, atd.)
-- DATE: 2025-02-04
-- AUTHOR: AI Coding Agent
-- NOTES: Rozšíření room_types o 8 nových typů pro domy, garáže a komerční prostory

-- ============================================================================
-- NOVÉ TYPY MÍSTNOSTÍ PRO NEMOVITOSTI
-- ============================================================================

-- Zahrada (sekačka, zahradní nábytek, gril)
INSERT INTO public.generic_types (category, code, name, icon, description, order_index)
VALUES ('room_types', 'zahrada', 'Zahrada', '🏡', 'Zahradní prostor, trávník', 160);

-- Garáž (parkování, nářadí, úložný prostor)
INSERT INTO public.generic_types (category, code, name, icon, description, order_index)
VALUES ('room_types', 'garaz', 'Garáž', '🚗', 'Parkování a úložný prostor', 170);

-- Sklep (dlouhodobé skladování)
INSERT INTO public.generic_types (category, code, name, icon, description, order_index)
VALUES ('room_types', 'sklep', 'Sklep', '🏚️', 'Sklepní prostor domu', 180);

-- Půda (podkrovní úložný prostor)
INSERT INTO public.generic_types (category, code, name, icon, description, order_index)
VALUES ('room_types', 'puda', 'Půda', '🏠', 'Podkrovní úložný prostor', 190);

-- Dvorek (malý venkovní prostor)
INSERT INTO public.generic_types (category, code, name, icon, description, order_index)
VALUES ('room_types', 'dvorek', 'Dvorek', '🪴', 'Malý venkovní prostor', 200);

-- Dílna (pracovní prostor s nářadím)
INSERT INTO public.generic_types (category, code, name, icon, description, order_index)
VALUES ('room_types', 'dilna', 'Dílna', '🔧', 'Pracovní prostor s nářadím', 210);

-- Vstupní hala (pro větší domy)
INSERT INTO public.generic_types (category, code, name, icon, description, order_index)
VALUES ('room_types', 'vstupni_hala', 'Vstupní hala', '🚪', 'Vstupní prostor domu', 220);

-- Kancelář (komerční prostory)
INSERT INTO public.generic_types (category, code, name, icon, description, order_index)
VALUES ('room_types', 'kancelar', 'Kancelář', '💼', 'Kancelářský prostor', 230);

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 083 complete: Added 8 new room types for properties';
  RAISE NOTICE '📍 New types: Zahrada, Garáž, Sklep, Půda, Dvorek, Dílna, Vstupní hala, Kancelář';
  RAISE NOTICE '🎯 Total room types: 23 (15 original + 8 new)';
END $$;
