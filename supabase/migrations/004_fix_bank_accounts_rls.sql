-- Migration: Fix bank_accounts RLS policy for INSERT
-- Purpose: Oprava RLS policy pro vytváření bankovních účtů - kontrola emailu nebo auth_user_id
-- Created: 2026-01-06

-- Odstranit starou policy
DROP POLICY IF EXISTS "bank_accounts_insert" ON public.bank_accounts;

-- Vytvořit novou policy s opravenou logikou
CREATE POLICY "bank_accounts_insert" ON public.bank_accounts
  FOR INSERT
  WITH CHECK (
    -- Vlastní účet (subject patří aktuálnímu uživateli podle auth_user_id)
    EXISTS (
      SELECT 1 FROM public.subjects s
      WHERE s.id = bank_accounts.subject_id
      AND s.auth_user_id = auth.uid()
    )
    OR
    -- Vlastní účet (subject má stejný email jako přihlášený uživatel z JWT)
    -- Pouze pokud auth_user_id není nastaveno
    EXISTS (
      SELECT 1 FROM public.subjects s
      WHERE s.id = bank_accounts.subject_id
      AND (s.auth_user_id IS NULL OR s.auth_user_id != auth.uid())
      AND s.email IS NOT NULL
      AND s.email = COALESCE((auth.jwt() ->> 'email'), '')
    )
    OR
    -- Účet subjektu, ke kterému má uživatel oprávnění
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

