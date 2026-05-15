# 🏠 Modul 050 – Nájemníci (Tenants)

Dokumentace modulu pro správu nájemníků.

---

## 📋 Obsah modulu

| Soubor | Popis |
|--------|-------|
| [CONTEXT-FOR-MODULE-DUPLICATION.md](CONTEXT-FOR-MODULE-DUPLICATION.md) | 📝 **Kontext duplikace modulu**<br/>Proč a jak byl modul nájemníků duplikován z pronajímatelů |

---

## 🎯 Účel modulu

Modul **050-najemnik** slouží pro:

1. **🏠 Správu nájemníků**
   - Seznam všech nájemníků (ListView)
   - Detail nájemníka (DetailView s tabuky)
   - CRUD operace

2. **👥 Uživatelé nájemníka (spolubydlící)**
   - Tab "Uživatelé" v detailu nájemníka
   - Spolubydlící, rodinní příslušníci
   - Tabulka: `tenant_users` (migrace 052)

3. **👤 Typy nájemníků (polymorfní subjekty)**
   - `osoba` – fyzická osoba nájemník
   - `osvc` – OSVČ nájemník
   - `firma` – právnická osoba jako nájemník

4. **🔗 Přehled vazeb (read-only)**
   - Záložka **Vazby** zobrazuje seznamy: pronajímatelé, nemovitosti, jednotky, smlouvy
   - Detail vybrané entity se zobrazuje v plném detailu (včetně záložek)

---

## 🗄️ Databázové entity

### Tabulka: `subjects` (polymorfní)
Nájemníci jsou subjekty s `is_tenant = true`.

**Klíčová pole:**
- `subject_type`: osoba, osvc, firma
- `is_tenant`: true
- `is_tenant_user`: true (pokud má uživatelský účet)
- Adresní pole: address, city, zip, ...
- Kontaktní pole: phone, email, ...

### Tabulka: `tenant_users` (migrace 052)
Spolubydlící a další osoby spojené s nájemním vztahem.

**Pole:**
- `id` (UUID)
- `tenant_id` (FK → subjects)
- `first_name`, `last_name` (required)
- `birth_date` (DATE, required)
- `note` (TEXT) – např. "manželka", "syn", "spoluuživatel garáže"
- `is_archived` (BOOLEAN)
- `created_at`, `updated_at`, `created_by`

**Indexy:**
- `idx_tenant_users_tenant_id` (WHERE NOT is_archived)
- `idx_tenant_users_created_at`

**RLS Policies:**
- `tenant_users_select_policy` – vidí uživatele nájemníků, ke kterým má přístup
- `tenant_users_insert_policy` – může přidat uživatele k nájemníkovi
- `tenant_users_update_policy` – může aktualizovat
- `tenant_users_delete_policy` – může smazat (archivovat)

---

## 🔗 Související dokumentace

- [Hlavní README modulů](../README.md)
- [core/subject-model.md](../../core/subject-model.md) – Model subjektů
- [changelogs/CHANGELOG-TENANT-USERS-DEBOUNCE.md](../../changelogs/CHANGELOG-TENANT-USERS-DEBOUNCE.md) – Implementace tenant_users
- [supabase/migrations/052_create_tenant_users.sql](../../../supabase/migrations/052_create_tenant_users.sql) – SQL migrace

---

## 🎨 UI Flow

```
Sidebar → Nájemníci
  ├── TenantsTile (ListView)
  │     ├── Filtry: jméno, typ, IČO, email
  │     ├── Debounce: 500ms (ztracené znaky opraveno)
  │     └── Sloupce: jméno, typ, telefon, email, počet smluv
  │
  └── Detail nájemníka (TenantDetailFrame)
        ├── Tab: Základní údaje (TenantDetailForm)
        ├── Tab: Smlouvy (ContractsSection)
        ├── Tab: Uživatelé (TenantUsersSection) ← ✨ NOVÉ
        ├── Tab: Účty (AccountsSection)
        ├── Tab: Dokumenty (AttachmentsSection)
        └── Tab: Historie (AuditLogSection)

   Poznámka:
   - Záložky se seznamy (Uživatelé, Účty, Zástupci, Přílohy) zobrazují počty položek v názvu.
```

---

## 🆕 Tab "Uživatelé" (TenantUsersSection)

**Komponenta:** `app/UI/detail-sections/TenantUsersSection.tsx`

**Pattern:** RelationListWithDetail
- Seznam uživatelů vlevo (first_name, last_name, birth_date)
- Detail uživatele vpravo (formulář)
- 4 chevron buttons: add, edit, archive, restore

**Validace:**
- `first_name`: min 2 znaky, required
- `last_name`: min 2 znaky, required
- `birth_date`: YYYY-MM-DD formát, required
- `note`: optional

**Service layer:** `app/lib/services/tenantUsers.ts`
- `listTenantUsers(tenantId)`
- `createTenantUser(data)`
- `updateTenantUser(id, data)`
- `archiveTenantUser(id)`
- `restoreTenantUser(id)`

---

## ✅ Checkboxy pro role

V detailu nájemníka (TenantDetailForm):

**Řádek 1: Základní typ**
- ☑️ Nájemník (`is_tenant`)

**Řádek 2: Delegáti pronajímatele**
- ☑️ Pronajímatel (`is_landlord`)
- ☑️ Zástupce pronajimatele (`is_landlord_delegate`)

**Řádek 3: Delegáti nájemníka**
- ☑️ Zástupce nájemníka (`is_tenant_delegate`)
- ☑️ Má uživatelský účet (`is_tenant_user`)

**Řádek 4: Údržba**
- ☑️ Údržbář (`is_maintenance`)
- ☑️ Zástupce údržby (`is_maintenance_delegate`)

**Mobile spacing:** 6px gap within pairs, 12px spacers between groups

---

## ⚠️ Deployment Checklist

Před nasazením do produkce:

1. ✅ **Spusť migraci 052** v Supabase SQL Editor
2. ✅ **Zkontroluj RLS policies** – tenant_users viditelnost
3. ✅ **Testuj tab "Uživatelé"** – CRUD operace
4. ✅ **Testuj debounce** – žádné ztracené znaky při psaní
5. ✅ **Mobilní layout** – spacing checkboxů
6. ✅ **Read-only mode** – viewMode='view' skrývá formulář

---

## 🚀 Budoucí rozšíření

- [ ] Hromadný import uživatelů (CSV)
- [ ] Vazba na smlouvy (tenant_user má přístup ke konkrétním smlouvám)
- [ ] Notifikace pro uživatele (email/SMS)
- [ ] Fotografie uživatelů (avatar)
