-- Migration: Fix bank_accounts RLS policy for INSERT
-- Purpose: Oprava RLS policy pro vytváření bankovních účtů - kontrola auth_user_id musí být správná
-- Created: 2026-01-06

-- Odstranit starou policy
DROP POLICY IF EXISTS "bank_accounts_insert" ON public.bank_accounts;

-- Vytvořit novou policy s opravenou logikou
CREATE POLICY "bank_accounts_insert" ON public.bank_accounts
  FOR INSERT
  WITH CHECK (
    -- Vlastní účet (subject patří aktuálnímu uživateli)
    EXISTS (
      SELECT 1 FROM public.subjects s
      WHERE s.id = bank_accounts.subject_id
      AND s.auth_user_id = auth.uid()
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

