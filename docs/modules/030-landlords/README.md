# 🏢 Modul 030 – Pronajímatelé

Dokumentace modulu pro správu pronajímatelů (landlords).

---

## 📋 Obsah modulu

| Soubor | Popis |
|--------|-------|
| [010-020-combined-logic.md](010-020-combined-logic.md) | 🔄 **Kombinovaná logika modulů 010 a 020**<br/>Jak spolu interagují správa uživatelů a pronajímatelé |

---

## 🎯 Účel modulu

Modul **030-pronajimatel** slouží pro:

1. **🏢 Správu pronajímatelů**
   - Seznam všech pronajímatelů (ListView)
   - Detail pronajímatele (DetailView s tabuky)
   - CRUD operace

2. **👤 Typy pronajímatelů (polymorfní subjekty)**
   - `osoba` – fyzická osoba pronajímatel
   - `osvc` – OSVČ pronajímatel
   - `firma` – právnická osoba
   - `spolek`, `statni`, `zastupce`

3. **📎 Integrace s dalšími moduly**
   - Propojení s nemovitostmi (landlord → properties)
   - Propojení se smlouvami (landlord → contracts)
   - Vazba na uživatelské účty (`is_landlord_user` flag)

4. **🔗 Přehled vazeb (read-only)**
   - Záložka **Vazby** zobrazuje seznamy: nemovitosti, jednotky, nájemníci, smlouvy
   - Detail vybrané entity se zobrazuje v plném detailu (včetně záložek)

---

## 🗄️ Databázové entity

### Tabulka: `subjects` (polymorfní)
Pronajímatelé jsou subjekty s `is_landlord = true`.

**Klíčová pole:**
- `subject_type`: osoba, osvc, firma, spolek, statni, zastupce
- `is_landlord`: true
- `is_landlord_user`: true (pokud má uživatelský účet)
- Adresní pole: address, city, zip, ...
- Kontaktní pole: phone, email, ...
- IČO, DIČ (pro firmy)

---

## 🔗 Související dokumentace

- [Hlavní README modulů](../README.md)
- [core/subject-model.md](../../core/subject-model.md) – Model subjektů
- [core/subject-fields.md.](../../core/subject-fields.md.) – Všechna pole v subjects
- [030-landlords-alt/](../030-landlords-alt/) – Alternativní dokumentace (kontext, validace)

---

## 🎨 UI Flow

```
Sidebar → Pronajímatelé
  ├── TenantsTile (ListView)
  │     ├── Filtry: jméno, typ, IČO
  │     └── Sloupce: jméno, typ, telefon, email, počet nemovitostí
  │
  └── Detail pronajímatele (TenantDetailFrame)
        ├── Tab: Základní údaje (TenantDetailForm)
     ├── Tab: Vazby (RelationListWithDetail, read-only)
        ├── Tab: Nemovitosti (PropertiesSection)
        ├── Tab: Smlouvy (ContractsSection)
        ├── Tab: Účty (AccountsSection) – bankovní účty
        ├── Tab: Dokumenty (AttachmentsSection)
        └── Tab: Historie (AuditLogSection)

Poznámka:
- Záložky se seznamy (Účty, Zástupci, Přílohy) zobrazují počty položek v názvu.
```

---

## ✅ Checkboxy pro role

V detailu pronajímatele (LandlordDetailForm):

**Řádek 1: Základní typ**
- ☑️ Pronajímatel (`is_landlord`)

**Řádek 2: Delegáti (pouze osoba/OSVČ/zástupce)**
- ☑️ Zástupce pronajimatele (`is_landlord_delegate`)

**Řádek 3: Další role**
- ☑️ Nájemník (`is_tenant`)
- ☑️ Zástupce nájemníka (`is_tenant_delegate`) *(jen osoba/OSVČ/zástupce)*

**Řádek 4: Údržba**
- ☑️ Údržbář (`is_maintenance`)
- ☑️ Zástupce údržby (`is_maintenance_delegate`) *(jen osoba/OSVČ/zástupce)*

Poznámka:
- Zaškrtnutí `is_landlord_delegate` zpřístupní subjekt v záložce **Zástupci** jako dostupného zástupce.

---

## 🚀 Budoucí rozšíření

- [ ] Automatické propojení s ARES (doplnění IČO → načtení firmy)
- [ ] Hromadné akce (export, email všem)
- [ ] Dashboard pronajímatele (přehled nemovitostí, příjmů)
