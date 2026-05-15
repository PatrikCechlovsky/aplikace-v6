#!/bin/bash
# FILE: scripts/check-evidence-sheets-migration.sh
# PURPOSE: Kontrola, že Evidence Sheets migrace byla správně aplikována
# USAGE: bash scripts/check-evidence-sheets-migration.sh

echo "🔍 Kontrola Evidence Sheets tabulek v databázi..."
echo ""

# Kontrolovat, zda existují tabulky
TABLES=("contract_evidence_sheets" "contract_evidence_sheet_users" "contract_evidence_sheet_services")

for TABLE in "${TABLES[@]}"; do
  if psql "$DATABASE_URL" -tc "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='$TABLE'" | grep -q 1; then
    echo "✅ Tabulka $TABLE existuje"
  else
    echo "❌ Tabulka $TABLE CHYBÍ"
  fi
done

echo ""
echo "📋 Počet sloupců v každé tabulce:"

for TABLE in "${TABLES[@]}"; do
  COUNT=$(psql "$DATABASE_URL" -tc "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='$TABLE'")
  echo "  • $TABLE: $COUNT sloupců"
done

echo ""
echo "🔒 RLS politiky:"
psql "$DATABASE_URL" -tc "SELECT tablename, COUNT(*) FROM pg_policies WHERE schemaname='public' AND tablename IN ('contract_evidence_sheets', 'contract_evidence_sheet_users', 'contract_evidence_sheet_services') GROUP BY tablename"

echo ""
echo "✨ Done!"
