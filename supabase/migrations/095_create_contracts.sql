-- Migration: Create contracts table
-- Date: 2026-02-09
-- Purpose: Tabulka pro smlouvy (nájemní/podnájemní) v modulu 060

-- ==========================================================================
-- CONTRACTS TABLE
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  cislo_smlouvy TEXT NOT NULL,
  stav TEXT NOT NULL,

  landlord_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
  tenant_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE RESTRICT,

  pocet_uzivatelu INTEGER,
  pomer_plochy_k_nemovitosti TEXT,

  datum_podpisu DATE,
  datum_zacatek DATE NOT NULL,
  datum_konec DATE,
  doba_neurcita BOOLEAN DEFAULT FALSE,

  najem_vyse NUMERIC(12,2),
  periodicita_najmu TEXT NOT NULL,
  den_platby TEXT NOT NULL,

  kauce_potreba BOOLEAN DEFAULT FALSE,
  kauce_castka NUMERIC(12,2),
  pozadovany_datum_kauce DATE,

  stav_kauce TEXT,
  stav_najmu TEXT,
  stav_plateb_smlouvy TEXT,

  poznamky TEXT,

  is_archived BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID
);

-- ==========================================================================
-- INDEXES
-- ==========================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_contracts_cislo_unique ON public.contracts(cislo_smlouvy);
CREATE INDEX IF NOT EXISTS idx_contracts_landlord ON public.contracts(landlord_id) WHERE is_archived = FALSE;
CREATE INDEX IF NOT EXISTS idx_contracts_tenant ON public.contracts(tenant_id) WHERE is_archived = FALSE;
CREATE INDEX IF NOT EXISTS idx_contracts_property ON public.contracts(property_id) WHERE is_archived = FALSE;
CREATE INDEX IF NOT EXISTS idx_contracts_unit ON public.contracts(unit_id) WHERE is_archived = FALSE;
CREATE INDEX IF NOT EXISTS idx_contracts_start_date ON public.contracts(datum_zacatek DESC);

-- ==========================================================================
-- COMMENTS
-- ==========================================================================

COMMENT ON TABLE public.contracts IS 'Smlouvy (nájemní/podnájemní)';
COMMENT ON COLUMN public.contracts.cislo_smlouvy IS 'Lidské číslo smlouvy (např. 2025-001)';
COMMENT ON COLUMN public.contracts.stav IS 'Stav smlouvy (koncept, aktivní, ukončená, archivovaná)';
COMMENT ON COLUMN public.contracts.landlord_id IS 'FK → subjects (pronajímatel)';
COMMENT ON COLUMN public.contracts.tenant_id IS 'FK → subjects (nájemník)';
COMMENT ON COLUMN public.contracts.property_id IS 'FK → properties (nemovitost)';
COMMENT ON COLUMN public.contracts.unit_id IS 'FK → units (jednotka)';
COMMENT ON COLUMN public.contracts.pocet_uzivatelu IS 'Počet uživatelů pro účely služeb a plateb';
COMMENT ON COLUMN public.contracts.pomer_plochy_k_nemovitosti IS 'Poměr plochy k nemovitosti (např. 449/58)';
COMMENT ON COLUMN public.contracts.datum_podpisu IS 'Datum podpisu smlouvy';
COMMENT ON COLUMN public.contracts.datum_zacatek IS 'Datum začátku nájmu';
COMMENT ON COLUMN public.contracts.datum_konec IS 'Datum konce nájmu (pokud není doba neurčitá)';
COMMENT ON COLUMN public.contracts.doba_neurcita IS 'Na dobu neurčitou';
COMMENT ON COLUMN public.contracts.najem_vyse IS 'Výše nájmu (Kč)';
COMMENT ON COLUMN public.contracts.periodicita_najmu IS 'Periodicita nájmu (kód z generic_types)';
COMMENT ON COLUMN public.contracts.den_platby IS 'Den platby (kód z generic_types)';
COMMENT ON COLUMN public.contracts.kauce_potreba IS 'Je požadována kauce';
COMMENT ON COLUMN public.contracts.kauce_castka IS 'Výše kauce (Kč)';
COMMENT ON COLUMN public.contracts.pozadovany_datum_kauce IS 'Termín pro zaplacení kauce';
COMMENT ON COLUMN public.contracts.stav_kauce IS 'Stav kauce (kód z generic_types)';
COMMENT ON COLUMN public.contracts.stav_najmu IS 'Stav nájmu (kód z generic_types)';
COMMENT ON COLUMN public.contracts.stav_plateb_smlouvy IS 'Stav plateb smlouvy (kód z generic_types)';
COMMENT ON COLUMN public.contracts.poznamky IS 'Poznámky ke smlouvě';

-- ==========================================================================
-- RLS POLICIES
-- ==========================================================================

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contracts_admin_all"
  ON public.contracts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.app_admins
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "contracts_landlord_select"
  ON public.contracts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.subjects s
      WHERE s.id = contracts.landlord_id
      AND s.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "contracts_landlord_insert"
  ON public.contracts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.subjects s
      WHERE s.id = landlord_id
      AND s.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "contracts_landlord_update"
  ON public.contracts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.subjects s
      WHERE s.id = contracts.landlord_id
      AND s.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "contracts_landlord_delete"
  ON public.contracts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.subjects s
      WHERE s.id = contracts.landlord_id
      AND s.auth_user_id = auth.uid()
    )
  );

-- ==========================================================================
-- UPDATED_AT TRIGGER
-- ==========================================================================

CREATE OR REPLACE FUNCTION update_contracts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_contracts_updated_at();
