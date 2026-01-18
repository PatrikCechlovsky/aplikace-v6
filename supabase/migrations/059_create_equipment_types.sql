-- Migration: Create equipment_types table
-- Date: 2026-01-18
-- Purpose: Tabulka pro typy vybavení (stejná struktura jako unit_types)

-- ============================================================================
-- EQUIPMENT_TYPES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.equipment_types (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  icon TEXT,
  order_index INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SEED DATA - Equipment types
-- ============================================================================

INSERT INTO public.equipment_types (code, name, description, color, icon, order_index, active) VALUES
('spotrebice', 'Spotřebiče', 'Elektronika a domácí spotřebiče', '#E74C3C', '🔌', 10, true),
('nabytek', 'Nábytek', 'Stoly, židle, skříně, postele', '#8E44AD', '🛋️', 20, true),
('koupelna', 'Koupelna', 'Vybavení koupelny a WC', '#3498DB', '🚿', 30, true),
('kuchyne', 'Kuchyně', 'Kuchyňské vybavení a nádobí', '#E67E22', '🍳', 40, true),
('vytapeni', 'Vytápění', 'Kotle, radiátory, klimatizace', '#C0392B', '🔥', 50, true),
('technika', 'Technika', 'IT, zabezpečení, videotelefon', '#2C3E50', '📱', 60, true),
('osvetleni', 'Osvětlení', 'Světla, lustry, lampy', '#F39C12', '💡', 70, true),
('zahrada', 'Zahrada', 'Zahradní nábytek, nástroje', '#27AE60', '🌳', 80, true),
('jine', 'Jiné', 'Ostatní vybavení', '#95A5A6', '📦', 90, true);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_equipment_types_active ON public.equipment_types(active);
CREATE INDEX idx_equipment_types_order ON public.equipment_types(order_index);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.equipment_types IS 'Typy vybavení nemovitostí a jednotek';
COMMENT ON COLUMN public.equipment_types.code IS 'Unikátní kód typu (PK)';
COMMENT ON COLUMN public.equipment_types.name IS 'Název typu';
COMMENT ON COLUMN public.equipment_types.description IS 'Popis typu';
COMMENT ON COLUMN public.equipment_types.color IS 'Barva pro UI (hex)';
COMMENT ON COLUMN public.equipment_types.icon IS 'Ikona (emoji nebo názevtřídy)';
COMMENT ON COLUMN public.equipment_types.order_index IS 'Pořadí pro řazení';
COMMENT ON COLUMN public.equipment_types.active IS 'Je typ aktivní?';

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.equipment_types ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read
CREATE POLICY "equipment_types_select"
  ON public.equipment_types
  FOR SELECT
  TO authenticated
  USING (TRUE);

-- Policy: Only admins can modify
CREATE POLICY "equipment_types_admin_all"
  ON public.equipment_types
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.app_admins
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_equipment_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER equipment_types_updated_at
  BEFORE UPDATE ON public.equipment_types
  FOR EACH ROW
  EXECUTE FUNCTION update_equipment_types_updated_at();
