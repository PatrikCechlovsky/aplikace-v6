-- FILE: supabase/migrations/085_add_equipment_attachments_entity_types.sql
-- PURPOSE: Přidání entity_type pro přílohy na vazbách vybavení (unit_equipment, property_equipment)
-- DATE: 2026-02-04
-- NOTES: Využívá polymorfní systém attachments - stejné tabulky documents/document_versions

-- ============================================================================
-- POZNÁMKA: Nebudeme vytvářet novou tabulku
-- ============================================================================
-- Existující systém attachments (documents, document_versions) je polymorfní
-- a podporuje jaké koliv entity_type hodnoty.
-- Přílohy na vazbách vybavení budou mít:
--   - entity_type: 'equipment_binding' (pro unit_equipment)
--   - entity_type: 'property_equipment_binding' (pro property_equipment)
--   - entity_id: <id z tabulky unit_equipment či property_equipment>

-- Nic se nemění v DB struktuře, jen si přidáme do dokumentace,
-- že tyto entity_type hodnoty jsou validní.

-- ============================================================================
-- DOKUMENTACE (nativní, bez SQL běhu)
-- ============================================================================

COMMENT ON TABLE public.documents IS
'Polymorfní tabulka příloh - podporuje libovolný entity_type.
Validní hodnoty:
- subjects, properties, units, contracts, payments, documents, tenants
- equipment_binding (unit_equipment)
- property_equipment_binding (property_equipment)';

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 085 complete: Equipment attachments documented';
  RAISE NOTICE '📍 Use entity_type=equipment_binding for unit_equipment attachments';
  RAISE NOTICE '📍 Use entity_type=property_equipment_binding for property_equipment attachments';
  RAISE NOTICE '📍 entity_id = uuid of unit_equipment or property_equipment record';
END $$;
