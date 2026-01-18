-- Migration: Create bank_list table
-- Purpose: Číselník českých bank pro výběr v bankovních účtech
-- Created: 2026-01-06

-- Tabulka pro seznam bank
CREATE TABLE IF NOT EXISTS public.bank_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_code TEXT NOT NULL UNIQUE, -- např. "0100" pro Komerční banka
  bank_name TEXT NOT NULL, -- např. "Komerční banka, a.s."
  swift TEXT, -- např. "KOMBCZPPXXX"
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pro rychlé vyhledávání podle kódu banky
CREATE INDEX IF NOT EXISTS idx_bank_list_bank_code ON public.bank_list(bank_code);

-- Komentáře
COMMENT ON TABLE public.bank_list IS 'Číselník českých bank pro výběr v bankovních účtech';
COMMENT ON COLUMN public.bank_list.bank_code IS 'Číselný kód banky (např. 0100)';
COMMENT ON COLUMN public.bank_list.bank_name IS 'Název banky';
COMMENT ON COLUMN public.bank_list.swift IS 'SWIFT/BIC kód banky';

-- RLS (Row Level Security)
ALTER TABLE public.bank_list ENABLE ROW LEVEL SECURITY;

-- Policy: Všichni přihlášení uživatelé mohou číst banky
CREATE POLICY "bank_list_select" ON public.bank_list
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: Pouze administrátoři mohou upravovat banky
CREATE POLICY "bank_list_insert" ON public.bank_list
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.app_admins
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "bank_list_update" ON public.bank_list
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.app_admins
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "bank_list_delete" ON public.bank_list
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.app_admins
      WHERE user_id = auth.uid()
    )
  );

