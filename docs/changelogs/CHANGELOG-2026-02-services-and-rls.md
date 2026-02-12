# 📝 CHANGELOG – Únor 2026: Služby + RLS + kvalita dat

**Datum:** 11. 2. 2026  
**Oblast:** Modul 070 Služby, RLS, číselníky, validace

---

## 1️⃣ Přehled změn

### Služby (katalog + přiřazení)
- Přidán rychlý vstup „Nová služba“ v sidebaru modulu 070.
- Opraveno zobrazení formuláře v režimu create (Nová služba).
- Přidány filtry katalogu služeb při přidávání (fulltext + kategorie).
- Odstraněn filtr kategorie v seznamu služeb (list) – zůstal pouze fulltext.
- Výchozí hodnoty periodicity: měsíčně (periodicita) + ročně (vyúčtování) + pronajímatel (plátce).
- Neaktivní položky generic_types se v selectech služeb nezobrazují.

### Kvalita dat a číselníky
- Bank list synchronizován podle ČNB.
- Nové položky v číselnících (generic types) se vždy ukládají jako aktivní.
- PSČ ukládáno bez mezer, v UI se zobrazuje s mezerou.

### RLS / opravy ukládání
- Rozšířené RLS pro delegáty u bankovních účtů.
- Rozšířené RLS pro delegáty u nemovitostí a jednotek.

### Role zástupců
- Příznaky role (např. zástupce pronajímatele) se ukládají jen pro osoby/OSVČ/zástupce.
- Zástupci jsou viditelní v seznamu delegátů.

---

## 2️⃣ Databázové změny

### Migrace
- **098_update_bank_list_cnb_2026.sql** – sync bank_list dle ČNB (insert/update/delete).
- **099_fix_bank_accounts_rls_delegates.sql** – RLS pro delegáty u bankovních účtů.
- **100_fix_properties_units_rls_delegates.sql** – RLS pro delegáty u nemovitostí a jednotek.
- **101_seed_units_ubytovani_hnevice.sql** – seed 8 jednotek pro konkrétní nemovitost.
- **104_add_evidence_sheet_service_catalog.sql** – vazba služeb evidenčního listu na katalog.

---

## 3️⃣ Service layer

- `app/lib/services/landlords.ts` – role flags v detailu a dostupných delegátech.
- `app/lib/services/properties.ts` – normalizace PSČ před uložením.
- `app/lib/services/serviceCatalog.ts` – využito pro filtraci katalogu (search/category).

---

## 4️⃣ UI komponenty

### Modul 070 – Služby
- `app/modules/070-sluzby/tiles/ServiceCatalogTile.tsx`
  - create režim a dirty tracking, správné renderování formuláře.
- `app/modules/070-sluzby/tiles/ServiceCatalogCreateTile.tsx`
  - nový tile pro rychlé vytvoření služby.
- `app/modules/070-sluzby/module.config.js`
  - položka „Nová služba“ v sidebaru.

### Nemovitost / Jednotka
- `app/modules/040-nemovitost/components/PropertyServicesTab.tsx`
  - fulltext + kategorie filtr katalogu při přidávání.
  - odstranění filtru kategorie v listu.
  - filtrace pouze aktivních generic_types v selectech.
- `app/modules/040-nemovitost/components/UnitServicesTab.tsx`
  - totéž jako u nemovitosti.

### Smlouva – Evidenční list
- `app/modules/060-smlouva/components/EvidenceSheetServicesTab.tsx`
  - seznam služeb sjednocen s katalogovým nastavením sloupců (stejné jako nemovitost/jednotka).
  - výběr služby z katalogu při zakládání položky evidenčního listu.
- `app/modules/040-nemovitost/forms/PropertyDetailFormComponent.tsx`
  - zobrazení PSČ s mezerou.

### Pronajímatel
- `app/modules/030-pronajimatel/forms/LandlordDetailForm.tsx`
- `app/modules/030-pronajimatel/forms/LandlordDetailFrame.tsx`
  - role zástupců pouze pro osoby/OSVČ/zástupce.

### Generic Types
- `app/UI/GenericTypeTile.tsx`
  - nové záznamy se ukládají jako aktivní.

---

## 5️⃣ Bug Fixes
- Fix TS typu `LandlordDetailRow` pro role flags.
- Oprava seed SQL (CROSS JOIN + NOT EXISTS).

---

## 6️⃣ Deployment checklist
- Spustit migrace 098–101 na produkci.
- Ověřit, že nové RLS umožní ukládání účtů/nemovitostí přes delegáty.
- Ověřit „Nová služba“ v sidebaru a create formulář.

---

## 7️⃣ Testing
- ✅ Katalog služeb: list, create, edit.
- ✅ Přidání služby na nemovitost/jednotku (katalog + vlastní).
- ✅ Filtr katalogu (fulltext + kategorie).
- ✅ PSČ: ukládání bez mezer, zobrazení s mezerou.
- ✅ Delegát: vytvoření a uložení rolí u osobních typů.
- ✅ RLS: vytvoření bankovního účtu a uložení nemovitosti přes delegáta.
