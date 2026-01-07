DROP POLICY IF EXISTS "bank_accounts_insert" ON public.bank_accounts;

CREATE POLICY "bank_accounts_insert" ON public.bank_accounts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.subjects s
      WHERE s.id = bank_accounts.subject_id
      AND s.auth_user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.subjects s
      WHERE s.id = bank_accounts.subject_id
      AND (s.auth_user_id IS NULL OR s.auth_user_id != auth.uid())
      AND s.email IS NOT NULL
      AND s.email = COALESCE((auth.jwt() ->> 'email'), '')
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
