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
- `contract_number`
- `contract_type` (nájem, podnájem, krátkodobý pronájem…)
- `valid_from`
- `valid_to`
- `rent_amount`
- `rent_currency`
- `deposit_amount`
- `deposit_currency`
- `payment_day` (den v měsíci)
- `state` (aktivní, ukončená, připravovaná, v prodlení…)
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
