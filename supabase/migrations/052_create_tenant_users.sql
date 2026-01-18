-- FILE: supabase/migrations/052_create_tenant_users.sql
-- PURPOSE: Vytvoření tabulky pro uživatele nájemního vztahu (spolubydlící, spoluuživatelé)
-- DATE: 2026-01-16

-- Vytvoření trigger funkce pro updated_at (pokud ještě neexistuje)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Vytvoření tabulky tenant_users
CREATE TABLE IF NOT EXISTS public.tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  note TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexy pro rychlejší vyhledávání
CREATE INDEX idx_tenant_users_tenant_id ON public.tenant_users(tenant_id) WHERE NOT is_archived;
CREATE INDEX idx_tenant_users_created_at ON public.tenant_users(created_at);

-- Trigger pro automatickou aktualizaci updated_at
CREATE TRIGGER set_tenant_users_updated_at
  BEFORE UPDATE ON public.tenant_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS políčka
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;

-- Politika pro čtení: uživatel vidí uživatele nájemníků, ke kterým má přístup
CREATE POLICY tenant_users_select_policy ON public.tenant_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.subjects s
      WHERE s.id = tenant_users.tenant_id
      AND s.is_tenant = true
      AND NOT s.is_archived
    )
  );

-- Politika pro vkládání: přihlášený uživatel může přidat uživatele k nájemníkovi
CREATE POLICY tenant_users_insert_policy ON public.tenant_users
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.subjects s
      WHERE s.id = tenant_users.tenant_id
      AND s.is_tenant = true
      AND NOT s.is_archived
    )
  );

-- Politika pro aktualizaci: přihlášený uživatel může aktualizovat uživatele nájemníka
CREATE POLICY tenant_users_update_policy ON public.tenant_users
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.subjects s
      WHERE s.id = tenant_users.tenant_id
      AND s.is_tenant = true
    )
  );

-- Politika pro mazání: přihlášený uživatel může smazat (archivovat) uživatele nájemníka
CREATE POLICY tenant_users_delete_policy ON public.tenant_users
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.subjects s
      WHERE s.id = tenant_users.tenant_id
      AND s.is_tenant = true
    )
  );

-- Komentáře k tabulce a sloupcům
COMMENT ON TABLE public.tenant_users IS 'Uživatelé nájemního vztahu (spolubydlící, spoluuživatelé garáže, rodinní příslušníci)';
COMMENT ON COLUMN public.tenant_users.tenant_id IS 'ID nájemníka (subject s is_tenant=true)';
COMMENT ON COLUMN public.tenant_users.first_name IS 'Jméno uživatele';
COMMENT ON COLUMN public.tenant_users.last_name IS 'Příjmení uživatele';
COMMENT ON COLUMN public.tenant_users.birth_date IS 'Datum narození uživatele';
COMMENT ON COLUMN public.tenant_users.note IS 'Poznámka (např. vztah: manželka, syn, spoluuživatel garáže)';
COMMENT ON COLUMN public.tenant_users.is_archived IS 'Příznak archivace (nemazat fyzicky)';
