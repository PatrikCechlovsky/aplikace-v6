DROP POLICY IF EXISTS "bank_accounts_insert" ON public.bank_accounts;

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
      AND (
        -- Zkusit získat email z JWT
        s.email = COALESCE((auth.jwt() ->> 'email'), '')
        OR
        -- Nebo zkusit získat email z auth.users (pokud máme přístup)
        s.email = (
          SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1
        )
      )
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
  );
