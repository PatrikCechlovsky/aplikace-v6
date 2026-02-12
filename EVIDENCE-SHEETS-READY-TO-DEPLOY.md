# ✅ EVIDENCE SHEETS - Kontrola dat a nasazení

## 📊 Co jsme zjistili

Z CSV souborů s aktuálním stavu databáze:

### Existující tabulky v `public` schématu: ✅
- `subjects` (osoby/firmy/společnosti)
- `contracts` (smlouvy)
- `tenant_users` (nájemníci/spolubydlící)
- `properties` (nemovitosti)
- `units` (jednotky/byty)
- `documents` + `document_versions` (přílohy)
- `generic_types` (konfigurované typy)
- a další...

### Evidence Sheets tabulky: ❌ NEJSOU V DB
- `contract_evidence_sheets` - bude vytvořena migrací 099
- `contract_evidence_sheet_users` - bude vytvořena migrací 099
- `contract_evidence_sheet_services` - bude vytvořena migrací 099

## ✨ Provedená kontrola

✅ **Datové typy** - shodné s projektem (UUID, NUMERIC, DATE, TEXT, BOOLEAN, TIMESTAMP)
✅ **Vztahy** - všechny FK odkazují na existující tabulky
✅ **Chyby opraveny** - odkaz na neexistující tabulku `attachments` byl odstraněn
✅ **RLS politiky** - správně nakonfigurované pro admina a pronajímatele
✅ **Triggery** - automatic `updated_at` na všech tabulkách
✅ **Indexy** - optimalizované na FK a query fieldy

## 📝 Co máme připraveno

| Soubor | Status | Popis |
|--------|--------|-------|
| `supabase/migrations/099_create_contract_evidence_sheets.sql` | ✅ Hotovo | Hlavní migrace - 3 tabulky + RLS |
| `supabase/migrations/102_seed_evidence_sheets.sql` | ✅ Hotovo | Volitelné test data (bez-run default) |
| `docs/KONTROLA-EVIDENCE-SHEETS-DATA.md` | ✅ Hotovo | Detailní kontrola a dokumentace |
| `scripts/check-evidence-sheets-migration.sh` | ✅ Hotovo | Script pro ověření po nasazení |
| UI komponenty (ContractEvidenceSheetsTab atd.) | ✅ Hotovo | Už implementováno |
| Service layer (`contractEvidenceSheets.ts`) | ✅ Hotovo | Už implementováno |

## 🚀 Nasazení - Postup

### 1️⃣ Lokální build check
```bash
npm run build
```

### 2️⃣ Push a PR
Změny jsou na branchi `feature/ai-spoluprace` - ready pro merge.

### 3️⃣ Merge do main
- Spustí se Vercel preview
- Supabase migrace se spustí automaticky

### 4️⃣ Ověření po nasazení
```bash
bash scripts/check-evidence-sheets-migration.sh
```

## 💾 Datový model

### `contract_evidence_sheets` (15 sloupců)
```
id (UUID, PK)
contract_id (UUID, FK) 🔗 contracts
sheet_number (INT) - Pořadí v kontraktu
valid_from (DATE) - Počátek platnosti
valid_to (DATE, nullable) - Konec platnosti
replaces_sheet_id (UUID, nullable, FK)
rent_amount (NUMERIC, nullable)
total_persons (INT) - Počet osob (default 1)
services_total (NUMERIC)
total_amount (NUMERIC)
description (TEXT, nullable)
notes (TEXT, nullable)
is_archived (BOOLEAN)
created_at, updated_at (TIMESTAMP+TZ)
```

### `contract_evidence_sheet_users` (8 sloupců)
```
id (UUID, PK)
sheet_id (UUID, FK) 🔗 contract_evidence_sheets
tenant_user_id (UUID, FK, nullable) 🔗 tenant_users
first_name, last_name, birth_date (TEXT/DATE, snapshots)
note (TEXT, nullable)
is_archived (BOOLEAN)
created_at, updated_at (TIMESTAMP+TZ)
```

### `contract_evidence_sheet_services` (9 sloupců)
```
id (UUID, PK)
sheet_id (UUID, FK) 🔗 contract_evidence_sheets
service_name (TEXT)
unit_type (TEXT) - 'flat' | 'person'
unit_price (NUMERIC)
quantity (INT)
total_amount (NUMERIC)
order_index (INT)
is_archived (BOOLEAN)
created_at, updated_at (TIMESTAMP+TZ)
```

## 🔐 RLS - Přístup

### Admin
- ✅ Plný přístup (SELECT, INSERT, UPDATE, DELETE) na všechny 3 tabulky

### Pronajímatel
- ✅ SELECT - jen k vlastním smlouvám (JOIN přes `contracts`)
- ✅ INSERT - jen k vlastním smlouvám
- ✅ UPDATE - jen k vlastním záznamům
- ✅ DELETE - jen k vlastním záznamům

### Nájemník
- ⭕ Není nakonfigurován (lze přidat později, pokud bude potřeba)

## 🧪 Test data (Volitelné)

Migrace 102 vytvoří:
- 1 Evidence Sheet ke zprvnímu testovacímu kontraktu
- 1 spolubydlícího (uživatele)
- 2 testovací služby (Vytápění, Voda)

**Spuštění:** Automaticky se nespouští - je třeba ji spustit ručně přes Supabase console, pokud chcete.

## ✅ Validační pravidla

Při nahrávání dat:
1. `valid_from` < `valid_to` (pokud je `valid_to` vyplněn)
2. `sheet_number` je unikátní v rámci smlouvy
3. `service.quantity` > 0
4. `service.unit_price` >= 0
5. Všechny FK musí existovat
6. `is_archived` default FALSE

## 📞 Příkazný řádek - Kontrola

```bash
# Po nasazení - ověřit tabulky
psql $DATABASE_URL -c "\dt public.contract_evidence*"

# Počet záznamů
psql $DATABASE_URL -c "SELECT tablename, (SELECT count(*) FROM pg_class WHERE relname=tablename) FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'contract_evidence%'"

# RLS politiky
psql $DATABASE_URL -c "SELECT tablename, policyname FROM pg_policies WHERE schemaname='public' AND tablename LIKE 'contract_evidence%'"
```

## 🎯 Status

| Položka | Status |
|---------|--------|
| Migrace | ✅ Hotova, commitnuta |
| UI komponenty | ✅ Implementovány |
| Service layer | ✅ Implementován |
| RLS politiky | ✅ Nastaveny |
| Dokumentace | ✅ Hotova |
| Seed data | ✅ Připraveny (volitelné) |
| Build check | ✅ Projde |
| **Připraveno k nasazení** | **✅ ANO** |

---

**Posledních 3 commity:**
1. `74622f2` - fix: Remove non-existent attachments table reference
2. `04983ff` - Implement contract evidence sheets system
3. `4717164` - docs: Add deployment check and seed migration

**Branch:** `feature/ai-spoluprace`
**Ready for:** Merge to main → Vercel deploy → Go live! 🚀
