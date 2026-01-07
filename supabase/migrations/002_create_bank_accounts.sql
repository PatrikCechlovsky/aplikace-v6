-- Migration: Create bank_accounts table
-- Purpose: Bankovní účty přiřazené k subjektům (subjects)
-- Created: 2026-01-06

-- Tabulka pro bankovní účty
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  label TEXT, -- Název účtu (např. "Hlavní účet", "Spořicí účet")
  bank_id UUID REFERENCES public.bank_list(id) ON DELETE SET NULL,
  account_number TEXT, -- Číslo účtu (např. "1234567890/0100")
  iban TEXT, -- IBAN (např. "CZ6508000000192000145399")
  swift TEXT, -- SWIFT kód účtu (pokud se liší od banky)
  note TEXT, -- Poznámka k účtu
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexy
CREATE INDEX IF NOT EXISTS idx_bank_accounts_subject_id ON public.bank_accounts(subject_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_bank_id ON public.bank_accounts(bank_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_is_archived ON public.bank_accounts(is_archived);

-- Komentáře
COMMENT ON TABLE public.bank_accounts IS 'Bankovní účty přiřazené k subjektům';
COMMENT ON COLUMN public.bank_accounts.subject_id IS 'ID subjektu (vlastníka účtu)';
COMMENT ON COLUMN public.bank_accounts.label IS 'Název účtu (např. "Hlavní účet")';
COMMENT ON COLUMN public.bank_accounts.bank_id IS 'ID banky z bank_list';
COMMENT ON COLUMN public.bank_accounts.account_number IS 'Číslo účtu';
COMMENT ON COLUMN public.bank_accounts.iban IS 'IBAN kód účtu';
COMMENT ON COLUMN public.bank_accounts.swift IS 'SWIFT kód účtu';
COMMENT ON COLUMN public.bank_accounts.note IS 'Poznámka k účtu';
COMMENT ON COLUMN public.bank_accounts.is_archived IS 'Zda je účet archivován';

-- RLS (Row Level Security)
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

-- Policy: Uživatelé mohou číst pouze své vlastní účty nebo účty subjektů, ke kterým mají přístup
CREATE POLICY "bank_accounts_select" ON public.bank_accounts
  FOR SELECT
  USING (
    -- Vlastní účet (subject_id odpovídá aktuálnímu uživateli)
    subject_id IN (
      SELECT id FROM public.subjects
      WHERE auth_user_id = auth.uid()
    )
    OR
    -- Účet subjektu, ke kterému má uživatel přístup (podle oprávnění)
    EXISTS (
      SELECT 1 FROM public.subjects s
      WHERE s.id = bank_accounts.subject_id
      AND (
        s.auth_user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.subject_permissions sp
          WHERE sp.subject_id = s.id
          AND sp.permission_code IN ('admin_full', 'manage_full', 'read_full', 'read_limited')
        )
      )
    )
  );

-- Policy: Uživatelé mohou vytvářet účty pouze pro sebe nebo subjekty, ke kterým mají oprávnění
CREATE POLICY "bank_accounts_insert" ON public.bank_accounts
  FOR INSERT
  WITH CHECK (
    subject_id IN (
      SELECT id FROM public.subjects
      WHERE auth_user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.subjects s
      WHERE s.id = bank_accounts.subject_id
      AND EXISTS (
        SELECT 1 FROM public.subject_permissions sp
        WHERE sp.subject_id = s.id
        AND sp.permission_code IN ('admin_full', 'manage_full')
      )
    )
  );

-- Policy: Uživatelé mohou upravovat účty pouze pro sebe nebo subjekty, ke kterým mají oprávnění
CREATE POLICY "bank_accounts_update" ON public.bank_accounts
  FOR UPDATE
  USING (
    subject_id IN (
      SELECT id FROM public.subjects
      WHERE auth_user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.subjects s
      WHERE s.id = bank_accounts.subject_id
      AND EXISTS (
        SELECT 1 FROM public.subject_permissions sp
        WHERE sp.subject_id = s.id
        AND sp.permission_code IN ('admin_full', 'manage_full')
      )
    )
  );

-- Policy: Uživatelé mohou mazat účty pouze pro sebe nebo subjekty, ke kterým mají oprávnění
CREATE POLICY "bank_accounts_delete" ON public.bank_accounts
  FOR DELETE
  USING (
    subject_id IN (
      SELECT id FROM public.subjects
      WHERE auth_user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.subjects s
      WHERE s.id = bank_accounts.subject_id
      AND EXISTS (
        SELECT 1 FROM public.subject_permissions sp
        WHERE sp.subject_id = s.id
        AND sp.permission_code IN ('admin_full', 'manage_full')
      )
    )
  );

