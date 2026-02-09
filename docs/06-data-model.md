# /docs/06-data-model.md
## Popis: Tento dokument popisuje datový model aplikace Pronajímatel v6, strukturu tabulek, vazby mezi entitami a plánované rozšíření.
---

# 06 – Datový model

## 1. Úvod

Datový model aplikace Pronajímatel v6 je navržen tak, aby:
- podporoval více pronajímatelů (multi-tenant architektura),
- řešil kompletní životní cyklus nájemního vztahu,
- byl bezpečný díky RLS (Row Level Security),
- byl rozšiřitelný o nové moduly (např. služby, měřidla, dokumenty, komunikace).

Klíčové entity systému:
- **Subjekty (fyzické/právnické osoby)**
- **Role subjektů (pronajímatel, nájemník, dodavatel, uživatel systému)**
- **Nemovitosti a jednotky**
- **Smlouvy**
- **Platby a předpisy**
- **Služby**
- **Měřidla a odečty**
- **Dokumenty a komunikace (budoucnost)**

---

## 2. Subjekty a role

### 2.1 Tabulka `subjects`

Základní entita pro všechny osoby a firmy.

**Příklady:**
- pronajímatel (majitel nemovitosti),
- nájemník,
- dodavatel (služby, energie),
- interní uživatel (správce).

**Základní pole (příklad):**
- `id` (uuid, PK)
- `subject_type` (enum / text – fyzická/právnická osoba)
- `first_name`
- `last_name`
- `company_name`
- `ic`, `dic`
- `email`, `phone`
- `address_id` (FK na tabulku adres, pokud bude oddělená)
- `is_landlord`, `is_tenant`, `is_user`
- `is_landlord_delegate`, `is_tenant_delegate`, `is_maintenance`, `is_maintenance_delegate`
- `created_at`, `created_by`
- `updated_at`, `updated_by`
- `is_active`

### 2.2 Tabulka `subject_roles`

Vazební tabulka mezi `subjects` a rolemi v systému.

**Příklady rolí:**
- **pronajímatel**
- **nájemník**
- **dodavatel**
- **uživatel systému**

Schéma (orientačně):
- `id` (uuid, PK)
- `subject_id` (FK → subjects.id)
- `role_type` (FK → `role_types.code` nebo enum)
- `valid_from`
- `valid_to`
- `is_active`

Umožňuje:
- jednomu subjektu přiřadit více rolí,
- sledovat historické změny.

### 2.3 Tabulka `role_types`

Číselník typů rolí.

Příklady:
- `landlord` – pronajímatel,
- `tenant` – nájemník,
- `supplier` – dodavatel,
- `system_user` – uživatel systému.

Pole:
- `code`
- `name`
- `description`
- `order`
- `is_active`

### 2.4 Tabulka `subject_permissions` (budoucnost)

Vazba na detailnější oprávnění pro konkrétního uživatele/subjekt.

---

## 3. Nemovitosti a jednotky

### 3.1 Tabulka `properties` (nemovitosti)

Reprezentuje budovy, domy, objekty.

**Pole – příklad:**
- `id`
- `owner_id` (FK → subjects.id)
- `name`
- `code`
- `address_id` / `street`, `city`, `zip`
- `property_type` (dům, bytový dům, areál…)
- `note`
- `created_at`, `created_by`
- `updated_at`, `updated_by`
- `is_active`

### 3.2 Tabulka `units` (jednotky)

Reprezentuje bytové a nebytové jednotky v rámci nemovitosti.

**Pole – příklad:**
- `id`
- `property_id` (FK → properties.id)
- `unit_number` / `unit_code`
- `floor`
- `area` (m²)
- `unit_type` (byt, nebyt, kancelář, garáž…)
- `note`
- `is_active`
- `created_at`, `created_by`

### 3.3 Vazby

- 1 `property` : N `units`
- `units` → může mít více smluv (v čase)

---

## 4. Smlouvy

### 4.1 Tabulka `contracts`

Reprezentuje nájemní/podnájemní smlouvy.

**Pole – příklad:**
- `id`
- `property_id` (FK)
- `unit_id` (FK)
- `landlord_id` (FK → subjects.id – pronajímatel)
- `tenant_id` (FK → subjects.id – nájemník)
- `cislo_smlouvy`
- `stav` (koncept, aktivní, ukončená…)
- `valid_from`
- `valid_to`
- `doba_neurcita`
- `periodicita_najmu`
- `den_platby` (den v měsíci)
- `kauce_potreba`, `kauce_castka`, `pozadovany_datum_kauce`
- `stav_kauce`, `stav_najmu`, `stav_plateb_smlouvy`
- `note`
- `created_at`, `created_by`
- `updated_at`, `updated_by`

### 4.2 Vazby smluv

- Smlouva se váže na:
  - konkrétní **nemovitost**,
  - konkrétní **jednotku**,
  - konkrétního **pronajímatele** (subjekt),
  - konkrétního **nájemníka** (subjekt).

---

## 5. Platby, předpisy a vyúčtování

### 5.1 Tabulka `payment_schedules` (předpisy plateb)

Definuje, **co má nájemník platit** a v jakém intervalu.

**Pole – příklad:**
- `id`
- `contract_id` (FK)
- `type` (nájem, služba, jiné)
- `amount`
- `currency`
- `periodicity` (měsíčně, čtvrtletně…)
- `due_day`
- `valid_from`, `valid_to`
- `is_active`

---

## 4.3 Předávací protokoly

Tabulka `handover_protocols` navazuje na smlouvy a uchovává předání/převzetí.

**Pole – příklad:**
- `id`
- `contract_id` (FK → contracts)
- `typ_protokolu` (předání, převzetí, ukončení)
- `stav_protokolu` (koncept, podepsaný, archivovaný)
- `datum_predani`, `cas_predani`, `misto_predani`
- `meraky_stav`, `poznamky`
- `predavajici_id`, `prebirajici_id` (FK → subjects)
- `photo_attachments_id`, `podpis_predavajiciho_id`, `podpis_prebirajiciho_id`
- `created_at`, `created_by`, `updated_at`, `updated_by`

### 5.2 Tabulka `payments` (skutečné platby)

Reprezentuje **reálně přijaté platby**.

Pole:
- `id`
- `contract_id` (FK)
- `payment_schedule_id` (FK, volitelně)
- `paid_amount`
- `paid_currency`
- `paid_date`
- `variable_symbol`
- `specific_symbol`
- `constant_symbol`
- `bank_account_id`
- `note`
- `import_source` (ručně, bankovní výpis, QR platba…)

### 5.3 Tabulka `payment_adjustments` / `payment_corrections` (budoucnost)

Pro řešení:
- oprav chybných plateb,
- přesunů,
- částečných úhrad.

---

## 6. Služby

### 6.1 Tabulka `services` (číselník služeb)

Definuje typy služeb:

- voda,
- teplo,
- plyn,
- elektřina,
- odpad,
- společné prostory,
- internet…

Příklad pole:
- `id`
- `code`
- `name`
- `description`
- `unit` (m3, kWh, paušál…)
- `is_meter_based` (ano/ne)
- `is_active`
- `order`

### 6.2 Tabulka `contract_services` (služby přiřazené ke smlouvě)

Vazba, jaké služby jsou účtovány v rámci konkrétní smlouvy.

Pole:
- `id`
- `contract_id` (FK)
- `service_id` (FK → services.id)
- `billing_type` (záloha / skutečnost / paušál)
- `allocation_key` (m², osoby, jednotka, měřidlo…)
- `note`

---

## 7. Měřidla a odečty

### 7.1 Tabulka `meters`

Reprezentuje měřidla:

- vodoměr,
- elektroměr,
- plynoměr,
- teploměr,
- podružné měřidlo apod.

Pole – příklad:
- `id`
- `property_id` (FK)
- `unit_id` (FK, pokud je měřidlo na jednotku)
- `service_id` (FK → services.id)
- `meter_code`
- `location` (popis místa)
- `installation_date`
- `last_check_date`
- `is_active`

### 7.2 Tabulka `meter_readings`

Odečty měřidel.

Pole:
- `id`
- `meter_id` (FK)
- `reading_date`
- `reading_value`
- `estimated` (true/false)
- `note`

---

## 8. Dokumenty a komunikace (návrh)

### 8.1 Tabulka `documents`

Reprezentuje:

- nájemní smlouvy (PDF),
- dodatky,
- předávací protokoly,
- faktury,
- vyúčtování.

Pole – příklad:
- `id`
- `subject_id` (FK) – primárně vůči komu se dokument váže
- `contract_id` (FK, volitelně)
- `property_id` / `unit_id` (volitelně)
- `document_type` (smlouva, vyúčtování…)
- `file_path` / storage klíč
- `created_at`, `created_by`

### 8.2 Tabulka `communications` (budoucnost)

Zaznamená:

- e-mailové komunikace,
- SMS,
- interní poznámky,
- generované dokumenty.

---

## 9. Multi-tenant architektura

Aplikace má podporu pro více pronajímatelů.

Možné přístupy:

1. **Tenant podle owner_id**  
   - Každý záznam (property, unit, contract…) má `owner_id`, který je FK na `subjects.id` pronajímatele.
   - RLS filtruje záznamy podle `owner_id`.

2. **Tenant v samostatné tabulce (např. `tenants` / `landlords`)**  
   - Tabulka, která váže pronajímatele a uživatele systému.
   - Vhodné pro složitější scénáře (správce více portfolií).

3. **Tenant na úrovni schématu**  
   - Do budoucna je možné mít oddělené schéma pro různé pronajímatele (není aktuálně v plánu).

Aktuální plán:
- používat model 1 (owner_id + RLS).

---

## 10. RLS a datový model

Každá tabulka, kde je potřeba oddělit data jednotlivých pronajímatelů, musí obsahovat:

- `owner_id` (FK na pronajímatele / tenant subjekt),
- `created_by` (FK na uživatele, který záznam vytvořil).

### Příklad RLS:

```sql
USING (owner_id = auth.uid())
```

nebo:

```sql
USING (owner_id IN (
  SELECT landlord_id
  FROM user_landlords
  WHERE user_id = auth.uid()
))
```

Tím je zajištěno, že:

- uživatel vidí pouze data “svého” pronajímatele,
- správce může vidět více pronajímatelů, pokud je to povolené.

---

## 11. Poznámky a nezatříděné informace (zachováno)

- možné více typů nájemních vztahů (podnájem, pronájem části jednotky),
- budoucí definice ceníků služeb,
- koncept agregovaných čerpání služeb podle období,
- přidání podpory více pronajímatelů na jednu nemovitost.

---

## 12. Závěr

Tento dokument poskytuje sjednocený a rozšiřitelný datový model pro aplikaci Pronajímatel v6.  
Všechny budoucí moduly a funkce budou na tento model navazovat.

---

## Základní principy datového modelu

- Datový model je navržen s důrazem na auditovatelnost a historii.
- Data se nikdy nepřepisují tak, aby se ztratila informace o minulém stavu.
- Historická data jsou považována za neměnná.

---

## Neměnnost historických záznamů (Immutable data)

- Jakmile je záznam vytvořen, jeho historická podoba se nemění.
- Změny se vždy řeší vytvořením nové verze nebo nového záznamu.
- Přepis historických dat je zakázán.

- Tento princip platí zejména pro:
  - verze dokumentů a příloh,
  - auditní záznamy,
  - bezpečnostní události.

---

## Verzování dat

- Verzování se používá tam, kde je potřeba sledovat vývoj v čase.
- Každá verze představuje samostatný historický stav.

- Verze obsahuje:
  - vlastní metadata,
  - informaci o autorovi,
  - datum vytvoření.

- Metadata verze se po vytvoření nemění.

---

## Archivace vs mazání

- Archivace je preferovaný způsob „odebrání“ dat z aktivního používání.
- Archivovaný záznam:
  - zůstává uložen,
  - je dohledatelný,
  - není implicitně zobrazován.

- Mazání dat je výjimečné a musí být odůvodněné.
- Mazáním nesmí dojít ke ztrátě auditní stopy.

---

## Vztah datového modelu a UI

- UI respektuje stav dat v databázi.
- UI nikdy nesimuluje stav, který neodpovídá datům.
- Viditelnost a dostupnost dat se řídí jejich stavem a kontextem.

---

## Závaznost

- Tyto principy platí pro celý datový model aplikace.
- Jsou závazné pro nové i upravované tabulky.
- Porušení těchto pravidel je považováno za chybu návrhu dat.

---
# 📜 Historické části dokumentu – DATOVÝ MODEL  
*(zachováno, ale označeno jako zastaralé — NESMÍ SE MAZAT)*

Níže jsou původní texty, myšlenky a koncepty, které byly během vývoje datového modelu vytvořeny, ale nepatří do finální verze dokumentace.  
Jsou ponechány kvůli historii projektu.

---

## ~~Původní úvahy o struktuře subjektů~~

~~Subjekt měl původně obsahovat jen: jméno, e-mail, telefon a typ.~~

~~Později bylo doplněno: IČ, DIČ, adresa, více typů, role, metadata a auditní pole.~~

---

## ~~Staré návrhy tabulek pro nemovitosti~~

~~Nemovitosti měly být původně bez vazby na vlastníka (owner_id).~~

~~Po rozhodnutí o multi-tenant architektuře byl owner_id doplněn do všech klíčových tabulek.~~

---

## ~~Neuskutečněný plán na jednotnou tabulku "assets"~~

~~Původní nápad: Nemovitosti i jednotky budou v jedné tabulce “assets”.~~

~~Tento koncept byl odmítnut — struktura by byla nepřehledná a komplikovala by RLS.~~

---

## ~~Pokus o jinou strukturu smluv~~

~~Smlouvy měly mít samostatnou tabulku účtování služeb a plateb přímo v sobě.~~

~~To bylo později odděleno do payment_schedules, services, meters a dalších entit.~~

---

## ~~Staré návrhy na uchovávání adres~~

~~Adresy mohly být ve vlastní tabulce s FK na subjekty a nemovitosti.~~

~~Momentálně používáme adresu přímo v tabulkách; oddělení do samostatné tabulky je plán do budoucna.~~

---

## ~~Nerealizovaná varianta datového modelu pro platby~~

~~Původní návrh: payments budou obsahovat i předpisy.~~

~~Aktuálně je systém rozdělen na payment_schedules (předpisy) a payments (skutečné platby).~~

---

## ~~Historické fragmenty z plánování RLS~~

~~“RLS budeme řešit později, nejdřív uděláme UI.”~~

~~Nakonec jsme zjistili, že databázová bezpečnost musí být navržena hned.~~

---

# 📌 Konec historických částí 06B

---
## DOPLNĚNÍ (2026-02-08) – Modul Služby: katalog, vazby a generické typy

### Cíl
Zavést jednotný katalog služeb a dvě vazební vrstvy nákladů (na jednotku a na nemovitost),
plus smluvní služby. Tím vznikají 4 datové vrstvy:

1) **Katalog služeb** (definice)
2) **Smluvní služby** (platí nájemník)
3) **Owner cost – rozúčtovatelný**
4) **Owner cost – nerozúčtovatelný**

Rozdíl mezi (3) a (4) je vyjádřen příznakem `is_rebillable`.

---
### Navrhované tabulky

#### 1) `service_catalog`
Katalog služeb (výběr do smluv i nákladů pronajímatele).

Pole – návrh:
- `id` (uuid, PK)
- `code` (text, unique)
- `name` (text)
- `category_id` (FK → generic_types, category = `service_types`)
- `billing_type_id` (FK → generic_types, category = `service_billing_types`)
- `unit_label` (text) *(nebo `unit_id` přes generic_types `service_units`)*
- `base_price` (numeric)
- `vat_rate_id` (FK → generic_types, category = `vat_rates`)
- `description` (text)
- `active` (bool)
- `is_archived` (bool)
- `note` (text)
- `owner_id` (FK → subjects.id)
- `created_at`, `created_by`, `updated_at`, `updated_by`

---
#### 2) `unit_services`
Pravidelné služby vázané na jednotku (katalogové i vlastní).

Pole – návrh:
- `id` (uuid, PK)
- `unit_id` (FK → units.id)
- `service_id` (FK → service_catalog.id, NULL = vlastní služba)
- `name` (text, vlastní název služby)
- `category_id` (FK → generic_types, category = `service_types`)
- `billing_type_id` (FK → generic_types, category = `service_billing_types`)
- `service_unit_id` (FK → generic_types, category = `service_units`)
- `vat_rate_id` (FK → generic_types, category = `vat_rates`)
- `amount` (numeric)
- `periodicity_id` (FK → generic_types, category = `service_periodicities`)
- `billing_periodicity_id` (FK → generic_types, category = `service_periodicities`)
- `payer_side` (enum: `tenant` | `landlord`) *(default: tenant)*
- `is_rebillable` (bool)
- `split_to_units` (bool)
- `split_basis` (text, např. m² | osoby | jednotky)
- `note` (text)
- `created_at`, `updated_at`
- `is_archived` (bool)

Přílohy:
- `entity_type = unit_service_binding`
- `entity_id = unit_services.id`

---
#### 3) `property_services`
Pravidelné služby vázané na nemovitost (náklady pronajímatele).

Pole – návrh:
- `id` (uuid, PK)
- `property_id` (FK → properties.id)
- `service_id` (FK → service_catalog.id, NULL = vlastní služba)
- `name` (text, vlastní název služby)
- `category_id` (FK → generic_types, category = `service_types`)
- `billing_type_id` (FK → generic_types, category = `service_billing_types`)
- `unit_id` (FK → generic_types, category = `service_units`)
- `vat_rate_id` (FK → generic_types, category = `vat_rates`)
- `amount` (numeric)
- `periodicity_id` (FK → generic_types, category = `service_periodicities`)
- `billing_periodicity_id` (FK → generic_types, category = `service_periodicities`)
- `payer_side` (enum: `tenant` | `landlord`) *(default: tenant)*
- `is_rebillable` (bool)
- `split_to_units` (bool)
- `split_basis` (text, např. m² | osoby | jednotky)
- `note` (text)
- `created_at`, `updated_at`
- `is_archived` (bool)

Přílohy:
- `entity_type = property_service_binding`
- `entity_id = property_services.id`

---
#### 4) `contract_services`
Služby účtované nájemníkovi v rámci smlouvy.

Pole – návrh:
- `id` (uuid, PK)
- `contract_id` (FK → contracts.id)
- `service_id` (FK → service_catalog.id)
- `billing_type_id` (FK → generic_types, category = `service_billing_types`)
- `allocation_rule` (enum: m² | osoba | měřidlo | pevná | % nájmu | poměr plochy)
- `periodicity` (enum: měsíčně | ročně | čtvrtletně…)
- `billing_periodicity` (enum: měsíčně | ročně | čtvrtletně…)
- `amount` (numeric)
- `currency` (text)
- `meter_id` (FK → meters.id, volitelně)
- `note` (text)
- `owner_id` (FK → subjects.id)
- `created_at`, `created_by`, `updated_at`, `updated_by`
- `is_archived` (bool)

---
### Generic types (konfigurovatelné selecty)
Použít generic_types s kategoriemi:

- `settings.service_types` – kategorie služeb
- `settings.service_billing_types` – typ účtování
- `settings.vat_rates` – DPH sazby
- `settings.service_units` – jednotky (volitelné)
- `settings.service_units` – jednotky (volitelné)
- `settings.service_periodicities` – periodicita (měsíčně, čtvrtletně, půlročně, ročně, 2–5 let)

Startovní seed:
- **service_types**: energie, voda, správní_poplatky, doplnkove_sluzby, najemne, jine_sluzby
- **service_billing_types**: pevna_sazba, merena_spotreba, na_pocet_osob, na_m2, procento_z_najmu, pomer_plochy
- **vat_rates**: 0.00, 0.10, 0.12, 0.15, 0.21
- **service_units**: Kč, Kč/měsíc, Kč/čtvrtrok, Kč/půlrok, Kč/rok, Kč/m³, Kč/kWh, Kč/m², Kč/osoba, Kč/ks
- **service_periodicities**: měsíčně, čtvrtletně, půlročně, ročně, dvouleté, tříleté, čtyřleté, pětileté

