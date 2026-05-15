-- FILE: supabase/migrations/098_add_contract_relations.sql
-- PURPOSE: Rozšíření smluv o účty, zástupce a vazbu uživatelů smlouvy
-- DATE: 2026-02-10

-- ==========================================================================
-- 1) CONTRACTS: nové vazby
-- ==========================================================================

ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS tenant_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS landlord_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tenant_delegate_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS landlord_delegate_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.contracts.tenant_account_id IS 'FK → bank_accounts (vybraný účet nájemníka)';
COMMENT ON COLUMN public.contracts.landlord_account_id IS 'FK → bank_accounts (vybraný účet pronajímatele)';
COMMENT ON COLUMN public.contracts.tenant_delegate_id IS 'FK → subjects (zástupce nájemníka)';
COMMENT ON COLUMN public.contracts.landlord_delegate_id IS 'FK → subjects (zástupce pronajímatele)';

-- ==========================================================================
-- 2) CONTRACT_USERS: vybraní uživatelé smlouvy
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.contract_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  tenant_user_id UUID NOT NULL REFERENCES public.tenant_users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT FALSE,
  UNIQUE (contract_id, tenant_user_id)
);

COMMENT ON TABLE public.contract_users IS 'Vybraní uživatelé pro konkrétní smlouvu';
COMMENT ON COLUMN public.contract_users.contract_id IS 'FK → contracts';
COMMENT ON COLUMN public.contract_users.tenant_user_id IS 'FK → tenant_users';

CREATE INDEX IF NOT EXISTS idx_contract_users_contract ON public.contract_users(contract_id) WHERE is_archived = FALSE;
CREATE INDEX IF NOT EXISTS idx_contract_users_tenant_user ON public.contract_users(tenant_user_id) WHERE is_archived = FALSE;

-- ==========================================================================
-- 3) RLS
-- ==========================================================================

ALTER TABLE public.contract_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contract_users_admin_all"
  ON public.contract_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.app_admins
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "contract_users_landlord_select"
  ON public.contract_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.contracts c
      JOIN public.subjects s ON s.id = c.landlord_id
      WHERE c.id = contract_users.contract_id
      AND s.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "contract_users_landlord_insert"
  ON public.contract_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.contracts c
      JOIN public.subjects s ON s.id = c.landlord_id
      WHERE c.id = contract_users.contract_id
      AND s.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "contract_users_landlord_update"
  ON public.contract_users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.contracts c
      JOIN public.subjects s ON s.id = c.landlord_id
      WHERE c.id = contract_users.contract_id
      AND s.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "contract_users_landlord_delete"
  ON public.contract_users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.contracts c
      JOIN public.subjects s ON s.id = c.landlord_id
      WHERE c.id = contract_users.contract_id
      AND s.auth_user_id = auth.uid()
    )
  );

-- ==========================================================================
-- 4) UPDATED_AT trigger
-- ==========================================================================

CREATE OR REPLACE FUNCTION update_contract_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS contract_users_updated_at ON public.contract_users;
CREATE TRIGGER contract_users_updated_at
  BEFORE UPDATE ON public.contract_users
  FOR EACH ROW
  EXECUTE FUNCTION update_contract_users_updated_at();

-- ==========================================================================
-- COMPLETION MESSAGE
-- ==========================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 098 complete: contracts extended + contract_users.';
END $$;
