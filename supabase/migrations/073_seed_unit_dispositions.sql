-- Migration: Add disposition types to generic_types
-- Date: 2026-01-25
-- Purpose: Číselník dispozic pro jednotky (1+kk, 2+1, 3+kk...)

INSERT INTO public.generic_types (category, code, name, icon, color, order_index, active) VALUES
('unit_dispositions', '1+kk', '1+kk', '🏠', '#3b82f6', 10, true),
('unit_dispositions', '1+1', '1+1', '🏠', '#3b82f6', 20, true),
('unit_dispositions', '2+kk', '2+kk', '🏡', '#10b981', 30, true),
('unit_dispositions', '2+1', '2+1', '🏡', '#10b981', 40, true),
('unit_dispositions', '3+kk', '3+kk', '🏘️', '#f59e0b', 50, true),
('unit_dispositions', '3+1', '3+1', '🏘️', '#f59e0b', 60, true),
('unit_dispositions', '4+kk', '4+kk', '🏢', '#ef4444', 70, true),
('unit_dispositions', '4+1', '4+1', '🏢', '#ef4444', 80, true),
('unit_dispositions', '5+kk', '5+kk', '🏰', '#8b5cf6', 90, true),
('unit_dispositions', '5+1', '5+1', '🏰', '#8b5cf6', 100, true),
('unit_dispositions', '6+kk', '6+ pokojů', '🏯', '#ec4899', 110, true),
('unit_dispositions', 'atypical', 'Atipický', '🔷', '#6366f1', 120, true),
('unit_dispositions', 'commercial', 'Nebytový prostor', '🏪', '#64748b', 130, true)
ON CONFLICT (category, code) DO NOTHING;

COMMENT ON COLUMN public.generic_types.category IS 'Kategorie typu (unit_dispositions = dispozice jednotek)';
