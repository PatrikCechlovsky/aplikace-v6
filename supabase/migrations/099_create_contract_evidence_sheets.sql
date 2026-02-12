-- FILE: supabase/migrations/099_create_contract_evidence_sheets.sql
-- PURPOSE: Evidenční listy ke smlouvám (verzované přílohy služeb + osoby)
-- DATE: 2026-02-11

-- ==========================================================================
-- 1) CONTRACT_EVIDENCE_SHEETS
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.contract_evidence_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  sheet_number INTEGER NOT NULL,
  valid_from DATE NOT NULL,
  valid_to DATE,
  replaces_sheet_id UUID REFERENCES public.contract_evidence_sheets(id) ON DELETE SET NULL,
  rent_amount NUMERIC,
  total_persons INTEGER DEFAULT 1,
  services_total NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  description TEXT,
  notes TEXT,
  pdf_document_id UUID REFERENCES public.attachments(id) ON DELETE SET NULL,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (contract_id, sheet_number)
);

COMMENT ON TABLE public.contract_evidence_sheets IS 'Evidenční listy ke smlouvám (verzované přílohy služeb)';
COMMENT ON COLUMN public.contract_evidence_sheets.contract_id IS 'FK → contracts';
COMMENT ON COLUMN public.contract_evidence_sheets.sheet_number IS 'Pořadí evidenčního listu ke smlouvě';
COMMENT ON COLUMN public.contract_evidence_sheets.replaces_sheet_id IS 'Evidenční list, který je nahrazen';
COMMENT ON COLUMN public.contract_evidence_sheets.total_persons IS 'Celkový počet osob (nájemník + spolubydlící)';

CREATE INDEX IF NOT EXISTS idx_contract_evidence_sheets_contract ON public.contract_evidence_sheets(contract_id) WHERE is_archived = FALSE;
CREATE INDEX IF NOT EXISTS idx_contract_evidence_sheets_valid ON public.contract_evidence_sheets(valid_from, valid_to) WHERE is_archived = FALSE;

-- ==========================================================================
-- 2) CONTRACT_EVIDENCE_SHEET_USERS (spolubydlící)
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.contract_evidence_sheet_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id UUID NOT NULL REFERENCES public.contract_evidence_sheets(id) ON DELETE CASCADE,
  tenant_user_id UUID REFERENCES public.tenant_users(id) ON DELETE SET NULL,
  first_name TEXT,
  last_name TEXT,
  birth_date DATE,
  note TEXT,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.contract_evidence_sheet_users IS 'Spolubydlící evidenčního listu (snapshot)';
COMMENT ON COLUMN public.contract_evidence_sheet_users.sheet_id IS 'FK → contract_evidence_sheets';
COMMENT ON COLUMN public.contract_evidence_sheet_users.tenant_user_id IS 'FK → tenant_users (zdroj)';

CREATE INDEX IF NOT EXISTS idx_contract_evidence_sheet_users_sheet ON public.contract_evidence_sheet_users(sheet_id) WHERE is_archived = FALSE;

-- ==========================================================================
-- 3) CONTRACT_EVIDENCE_SHEET_SERVICES
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.contract_evidence_sheet_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id UUID NOT NULL REFERENCES public.contract_evidence_sheets(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  unit_type TEXT NOT NULL DEFAULT 'flat', -- flat | person
  unit_price NUMERIC NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.contract_evidence_sheet_services IS 'Služby evidenčního listu (položky)';
COMMENT ON COLUMN public.contract_evidence_sheet_services.sheet_id IS 'FK → contract_evidence_sheets';
COMMENT ON COLUMN public.contract_evidence_sheet_services.unit_type IS 'flat|person (byt/osoba)';

CREATE INDEX IF NOT EXISTS idx_contract_evidence_sheet_services_sheet ON public.contract_evidence_sheet_services(sheet_id) WHERE is_archived = FALSE;

-- ==========================================================================
-- 4) RLS
-- ==========================================================================

ALTER TABLE public.contract_evidence_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_evidence_sheet_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_evidence_sheet_services ENABLE ROW LEVEL SECURITY;

-- Admin
CREATE POLICY "contract_evidence_admin_all"
  ON public.contract_evidence_sheets
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.app_admins WHERE user_id = auth.uid())
  );

CREATE POLICY "contract_evidence_users_admin_all"
  ON public.contract_evidence_sheet_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.app_admins WHERE user_id = auth.uid())
  );

CREATE POLICY "contract_evidence_services_admin_all"
  ON public.contract_evidence_sheet_services
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.app_admins WHERE user_id = auth.uid())
  );

-- Landlord access
CREATE POLICY "contract_evidence_landlord_select"
  ON public.contract_evidence_sheets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.contracts c
      JOIN public.subjects s ON s.id = c.landlord_id
      WHERE c.id = contract_evidence_sheets.contract_id
      AND s.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "contract_evidence_landlord_insert"
  ON public.contract_evidence_sheets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.contracts c
      JOIN public.subjects s ON s.id = c.landlord_id
      WHERE c.id = contract_evidence_sheets.contract_id
      AND s.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "contract_evidence_landlord_update"
  ON public.contract_evidence_sheets
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.contracts c
      JOIN public.subjects s ON s.id = c.landlord_id
      WHERE c.id = contract_evidence_sheets.contract_id
      AND s.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "contract_evidence_landlord_delete"
  ON public.contract_evidence_sheets
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.contracts c
      JOIN public.subjects s ON s.id = c.landlord_id
      WHERE c.id = contract_evidence_sheets.contract_id
      AND s.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "contract_evidence_users_landlord_all"
  ON public.contract_evidence_sheet_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.contract_evidence_sheets es
      JOIN public.contracts c ON c.id = es.contract_id
      JOIN public.subjects s ON s.id = c.landlord_id
      WHERE es.id = contract_evidence_sheet_users.sheet_id
      AND s.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "contract_evidence_services_landlord_all"
  ON public.contract_evidence_sheet_services
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.contract_evidence_sheets es
      JOIN public.contracts c ON c.id = es.contract_id
      JOIN public.subjects s ON s.id = c.landlord_id
      WHERE es.id = contract_evidence_sheet_services.sheet_id
      AND s.auth_user_id = auth.uid()
    )
  );

-- ==========================================================================
-- 5) UPDATED_AT triggers
-- ==========================================================================

CREATE OR REPLACE FUNCTION update_contract_evidence_sheets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS contract_evidence_sheets_updated_at ON public.contract_evidence_sheets;
CREATE TRIGGER contract_evidence_sheets_updated_at
  BEFORE UPDATE ON public.contract_evidence_sheets
  FOR EACH ROW
  EXECUTE FUNCTION update_contract_evidence_sheets_updated_at();

CREATE OR REPLACE FUNCTION update_contract_evidence_sheet_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS contract_evidence_sheet_users_updated_at ON public.contract_evidence_sheet_users;
CREATE TRIGGER contract_evidence_sheet_users_updated_at
  BEFORE UPDATE ON public.contract_evidence_sheet_users
  FOR EACH ROW
  EXECUTE FUNCTION update_contract_evidence_sheet_users_updated_at();

CREATE OR REPLACE FUNCTION update_contract_evidence_sheet_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS contract_evidence_sheet_services_updated_at ON public.contract_evidence_sheet_services;
CREATE TRIGGER contract_evidence_sheet_services_updated_at
  BEFORE UPDATE ON public.contract_evidence_sheet_services
  FOR EACH ROW
  EXECUTE FUNCTION update_contract_evidence_sheet_services_updated_at();

-- ==========================================================================
-- COMPLETION MESSAGE
-- ==========================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 099 complete: contract evidence sheets.';
END $$;
