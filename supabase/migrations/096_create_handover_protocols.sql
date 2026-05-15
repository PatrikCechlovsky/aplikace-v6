-- Migration: Create handover protocols table
-- Date: 2026-02-09
-- Purpose: Tabulka pro předávací protokoly napojené na smlouvy

-- ==========================================================================
-- HANDOVER PROTOCOLS TABLE
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.handover_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,

  typ_protokolu TEXT NOT NULL,
  stav_protokolu TEXT NOT NULL,

  datum_predani DATE NOT NULL,
  cas_predani TEXT,
  misto_predani TEXT,

  landlord_display TEXT,
  property_display TEXT,
  unit_display TEXT,
  tenant_display TEXT,

  predavajici_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  prebirajici_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,

  meraky_stav TEXT,
  photo_attachments_id UUID,
  poznamky TEXT,

  podpis_predavajiciho_id UUID,
  podpis_prebirajiciho_id UUID,

  is_archived BOOLEAN DEFAULT FALSE,
  archive_reason TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID
);

-- ==========================================================================
-- INDEXES
-- ==========================================================================

CREATE INDEX IF NOT EXISTS idx_handover_protocols_contract ON public.handover_protocols(contract_id) WHERE is_archived = FALSE;
CREATE INDEX IF NOT EXISTS idx_handover_protocols_date ON public.handover_protocols(datum_predani DESC);

-- ==========================================================================
-- COMMENTS
-- ==========================================================================

COMMENT ON TABLE public.handover_protocols IS 'Předávací protokoly ke smlouvám';
COMMENT ON COLUMN public.handover_protocols.contract_id IS 'FK → contracts';
COMMENT ON COLUMN public.handover_protocols.typ_protokolu IS 'Typ protokolu (předání, převzetí, ukončení)';
COMMENT ON COLUMN public.handover_protocols.stav_protokolu IS 'Stav protokolu (koncept, podepsaný, archivovaný)';
COMMENT ON COLUMN public.handover_protocols.datum_predani IS 'Datum fyzického předání/převzetí';
COMMENT ON COLUMN public.handover_protocols.cas_predani IS 'Čas předání (HH:MM)';
COMMENT ON COLUMN public.handover_protocols.misto_predani IS 'Místo předání';
COMMENT ON COLUMN public.handover_protocols.meraky_stav IS 'Snapshot stavů měřidel při předání';
COMMENT ON COLUMN public.handover_protocols.photo_attachments_id IS 'Vazba na přílohy (fotodokumentace)';
COMMENT ON COLUMN public.handover_protocols.podpis_predavajiciho_id IS 'Dokument podpisu předávajícího';
COMMENT ON COLUMN public.handover_protocols.podpis_prebirajiciho_id IS 'Dokument podpisu přebírajícího';
COMMENT ON COLUMN public.handover_protocols.archive_reason IS 'Důvod archivace';

-- ==========================================================================
-- RLS POLICIES
-- ==========================================================================

ALTER TABLE public.handover_protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "handover_protocols_admin_all"
  ON public.handover_protocols
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.app_admins
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "handover_protocols_landlord_select"
  ON public.handover_protocols
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.contracts c
      JOIN public.subjects s ON s.id = c.landlord_id
      WHERE c.id = handover_protocols.contract_id
      AND s.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "handover_protocols_landlord_insert"
  ON public.handover_protocols
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.contracts c
      JOIN public.subjects s ON s.id = c.landlord_id
      WHERE c.id = contract_id
      AND s.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "handover_protocols_landlord_update"
  ON public.handover_protocols
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.contracts c
      JOIN public.subjects s ON s.id = c.landlord_id
      WHERE c.id = handover_protocols.contract_id
      AND s.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "handover_protocols_landlord_delete"
  ON public.handover_protocols
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.contracts c
      JOIN public.subjects s ON s.id = c.landlord_id
      WHERE c.id = handover_protocols.contract_id
      AND s.auth_user_id = auth.uid()
    )
  );

-- ==========================================================================
-- UPDATED_AT TRIGGER
-- ==========================================================================

CREATE OR REPLACE FUNCTION update_handover_protocols_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handover_protocols_updated_at
  BEFORE UPDATE ON public.handover_protocols
  FOR EACH ROW
  EXECUTE FUNCTION update_handover_protocols_updated_at();
