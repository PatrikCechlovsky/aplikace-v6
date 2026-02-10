-- FILE: supabase/migrations/099_fix_bank_accounts_rls_delegates.sql
-- PURPOSE: Allow bank_accounts access for delegated users (subject_delegates)
-- DATE: 2026-02-10

-- Drop existing policies to ensure consistent logic
DROP POLICY IF EXISTS "bank_accounts_select" ON public.bank_accounts;
DROP POLICY IF EXISTS "bank_accounts_insert" ON public.bank_accounts;
DROP POLICY IF EXISTS "bank_accounts_update" ON public.bank_accounts;
DROP POLICY IF EXISTS "bank_accounts_delete" ON public.bank_accounts;

-- Helper: Delegated access via subject_delegates
-- Delegate = subject linked to current auth user (auth_user_id or JWT email)

CREATE POLICY "bank_accounts_select" ON public.bank_accounts
  FOR SELECT
  USING (
    -- Vlastní účet (subject patří aktuálnímu uživateli)
    subject_id IN (
      SELECT id FROM public.subjects
      WHERE auth_user_id = auth.uid()
    )
    OR
    -- Účet subjektu, ke kterému má uživatel oprávnění
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
    OR
    -- Účet subjektu, kde je uživatel zástupce
    EXISTS (
      SELECT 1
      FROM public.subject_delegates sd
      JOIN public.subjects u ON u.id = sd.delegate_subject_id
      WHERE sd.subject_id = bank_accounts.subject_id
      AND (
        (u.auth_user_id IS NOT NULL AND u.auth_user_id = auth.uid())
        OR (
          u.email IS NOT NULL
          AND u.email = COALESCE((auth.jwt() ->> 'email'), '')
          AND COALESCE((auth.jwt() ->> 'email'), '') != ''
        )
      )
    )
  );

CREATE POLICY "bank_accounts_insert" ON public.bank_accounts
  FOR INSERT
  WITH CHECK (
    -- 1. Kontrola auth_user_id (priorita 1)
    EXISTS (
      SELECT 1 FROM public.subjects s
      WHERE s.id = bank_accounts.subject_id
      AND s.auth_user_id IS NOT NULL
      AND s.auth_user_id = auth.uid()
    )
    OR
    -- 2. Kontrola emailu z JWT (priorita 2 - pro "Můj účet" když auth_user_id ještě není nastavený)
    EXISTS (
      SELECT 1 FROM public.subjects s
      WHERE s.id = bank_accounts.subject_id
      AND s.email IS NOT NULL
      AND s.email = COALESCE((auth.jwt() ->> 'email'), '')
      AND COALESCE((auth.jwt() ->> 'email'), '') != ''
    )
    OR
    -- 3. Kontrola oprávnění (priorita 3 - pro adminy)
    EXISTS (
      SELECT 1 FROM public.subjects s
      WHERE s.id = bank_accounts.subject_id
      AND EXISTS (
        SELECT 1 FROM public.subject_permissions sp
        WHERE sp.subject_id = s.id
        AND sp.permission_code IN ('admin_full', 'manage_full')
      )
    )
    OR
    -- 4. Zástupce pronajímatele/nájemníka (delegate)
    EXISTS (
      SELECT 1
      FROM public.subject_delegates sd
      JOIN public.subjects u ON u.id = sd.delegate_subject_id
      WHERE sd.subject_id = bank_accounts.subject_id
      AND (
        (u.auth_user_id IS NOT NULL AND u.auth_user_id = auth.uid())
        OR (
          u.email IS NOT NULL
          AND u.email = COALESCE((auth.jwt() ->> 'email'), '')
          AND COALESCE((auth.jwt() ->> 'email'), '') != ''
        )
      )
    )
  );

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
    OR
    EXISTS (
      SELECT 1
      FROM public.subject_delegates sd
      JOIN public.subjects u ON u.id = sd.delegate_subject_id
      WHERE sd.subject_id = bank_accounts.subject_id
      AND (
        (u.auth_user_id IS NOT NULL AND u.auth_user_id = auth.uid())
        OR (
          u.email IS NOT NULL
          AND u.email = COALESCE((auth.jwt() ->> 'email'), '')
          AND COALESCE((auth.jwt() ->> 'email'), '') != ''
        )
      )
    )
  );

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
    OR
    EXISTS (
      SELECT 1
      FROM public.subject_delegates sd
      JOIN public.subjects u ON u.id = sd.delegate_subject_id
      WHERE sd.subject_id = bank_accounts.subject_id
      AND (
        (u.auth_user_id IS NOT NULL AND u.auth_user_id = auth.uid())
        OR (
          u.email IS NOT NULL
          AND u.email = COALESCE((auth.jwt() ->> 'email'), '')
          AND COALESCE((auth.jwt() ->> 'email'), '') != ''
        )
      )
    )
  );

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 099 complete: bank_accounts RLS updated for delegates.';
END $$;
