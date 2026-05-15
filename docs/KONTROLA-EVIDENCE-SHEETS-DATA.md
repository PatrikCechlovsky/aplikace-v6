# 📋 Kontrola dat pro Evidence Sheets

**Datum:** 12. února 2026  
**Status:** ✅ PŘIPRAVENO K NASAZENÍ

## 🔍 Zjištění

### Aktuální stav DB (z CSV snapshotu)
- **Existující tabulky v `public` schématu:** 41 tabulek
- **Evidence Sheets tabulky:** ❌ Nejsou v DB (migrace 099 ještě neběžela)

### Tabulky, které budou vytvořeny migrací 099:

1. **`contract_evidence_sheets`** (hlavní tabulka)
   - Sloupce: 15
   - PK: `id` (UUID)
   - FK: `contract_id` → contracts(id)
   - Indexes: 2
   - RLS: 4 politiky (admin + landlord select/insert/update/delete)

2. **`contract_evidence_sheet_users`** (spolubydlící)
   - Sloupce: 8
   - PK: `id` (UUID)
   - FK: `sheet_id` → contract_evidence_sheets(id)
   - FK: `tenant_user_id` → tenant_users(id) [nullable]
   - Indexes: 1
   - RLS: 2 politiky (admin + landlord all)

3. **`contract_evidence_sheet_services`** (položky/služby)
   - Sloupce: 9
   - PK: `id` (UUID)
   - FK: `sheet_id` → contract_evidence_sheets(id)
   - Indexes: 1
   - RLS: 2 politiky (admin + landlord all)

## ✅ Kontrolní seznam před nasazením

### Databázové tabulky
- [x] Schéma konzistentní s ostatními tabulkami (created_at, updated_at, is_archived)
- [x] Foreign keys definovány správně
- [x] CASCADE DELETE na sheet_id (rozpracované záznamy)
- [x] Unique constraint na (contract_id, sheet_number)
- [x] Indexy na FK a query fields
- [x] Triggers pro updated_at

### RLS politiky
- [x] Admin má full access (všechny 3 tabulky)
- [x] Landlord: SELECT → jen vlastní kontrakty (JOIN přes contracts)
- [x] Landlord: INSERT → jen k vlastním kontraktům
- [x] Landlord: UPDATE → jen vlastní záznamy
- [x] Landlord: DELETE → jen vlastní záznamy
- [x] Tenant nemá explicitní access (může se přidat později)

### Bez chyb
- [x] ❌ Odkaz na neexistující tabulku `attachments` **ODSTRANĚN** (commit 74622f2)
- [x] Všechny FK odkazují na existující tabulky
- [x] Datové typy konzistentní s ostatními migracemi

## 📊 Datový model

### contract_evidence_sheets
| Sloupec | Typ | Povinný | Výchozí | Poznámka |
|---------|-----|---------|---------|----------|
| id | UUID | ✓ | gen_random_uuid() | PK |
| contract_id | UUID | ✓ | - | FK → contracts |
| sheet_number | INTEGER | ✓ | - | Pořadí ve smlouvě (UNIQUE s contract_id) |
| valid_from | DATE | ✓ | - | Počátek platnosti |
| valid_to | DATE | ✗ | - | Konec platnosti (null = na dobu neurčitou) |
| replaces_sheet_id | UUID | ✗ | - | Odkaz na nahrazený list |
| rent_amount | NUMERIC | ✗ | - | Výše nájmu |
| total_persons | INTEGER | ✗ | 1 | Nájemník + spolubydlící |
| services_total | NUMERIC | ✗ | 0 | Suma služeb |
| total_amount | NUMERIC | ✗ | 0 | Celková výše (nájom + služby) |
| description | TEXT | ✗ | - | Popis |
| notes | TEXT | ✗ | - | Poznámky |
| is_archived | BOOLEAN | ✗ | FALSE | Logické smazání |
| created_at | TIMESTAMP+TZ | ✗ | NOW() | |
| updated_at | TIMESTAMP+TZ | ✗ | NOW() | Trigger updated_at |

### contract_evidence_sheet_users
| Sloupec | Typ | Povinný | Výchozí | Poznámka |
|---------|-----|---------|---------|----------|
| id | UUID | ✓ | gen_random_uuid() | PK |
| sheet_id | UUID | ✓ | - | FK → contract_evidence_sheets |
| tenant_user_id | UUID | ✗ | - | FK → tenant_users (zdroj) |
| first_name | TEXT | ✗ | - | Snapshot |
| last_name | TEXT | ✗ | - | Snapshot |
| birth_date | DATE | ✗ | - | Snapshot |
| note | TEXT | ✗ | - | |
| is_archived | BOOLEAN | ✗ | FALSE | |
| created_at | TIMESTAMP+TZ | ✗ | NOW() | |
| updated_at | TIMESTAMP+TZ | ✗ | NOW() | Trigger updated_at |

### contract_evidence_sheet_services
| Sloupec | Typ | Povinný | Výchozí | Poznámka |
|---------|-----|---------|---------|----------|
| id | UUID | ✓ | gen_random_uuid() | PK |
| sheet_id | UUID | ✓ | - | FK → contract_evidence_sheets |
| service_name | TEXT | ✓ | - | Název (např. "Vytápění") |
| unit_type | TEXT | ✓ | 'flat' | 'flat' \| 'person' (byt/osoba) |
| unit_price | NUMERIC | ✓ | 0 | Cena za jednotku |
| quantity | INTEGER | ✓ | 1 | Počet jednotek (bytů/osob) |
| total_amount | NUMERIC | ✓ | 0 | unit_price × quantity |
| order_index | INTEGER | ✗ | 0 | Pořadí řádku |
| is_archived | BOOLEAN | ✗ | FALSE | |
| created_at | TIMESTAMP+TZ | ✗ | NOW() | |
| updated_at | TIMESTAMP+TZ | ✗ | NOW() | Trigger updated_at |

## 🚀 Nasazení

### Postup:
1. Push do `feature/ai-spoluprace` (✅ hotovo)
2. Spustit `npm run build` pro TypeScript kontrolu
3. Merge do `main` (Vercel deploy)
4. Supabase migrace se spustí automaticky
5. Zkontrolovat v DB aplikaci (Supabase admin)

### Po nasazení:
- Nové tabulky budou viditelné v `public` schématu
- RLS bude aktivní - testovat s testovacím uživatelem
- Evidence Sheets tab se objeví v ContractDetailFrame

## 📝 Poznámky pro nahrávání dat

**Pokud nasazujeme test data:**
- Vytvářet Evidence Sheets v pořadí (sheet_number 1, 2, 3...)
- Naplnit `valid_from` a `valid_to` korektně
- `services_total` a `total_amount` se počítají automaticky (nebo je naplnit ručně)
- Nepovinné políčka: `valid_to`, `rent_amount`, `replaces_sheet_id`, `notes`, `description`

**Validace:**
- Každá Evidence Sheet musí patřit existujícímu kontraktu
- `valid_from` < `valid_to` (pokud je vyplněn `valid_to`)
- Service `quantity` > 0
- Service `unit_price` >= 0

## ✨ Status

**Připraveno:** Ano ✅
**Chyby:** Žádné ✅
**Ready for deploy:** Ano ✅
