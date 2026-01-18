# aplikace-v6/docs/modules/040-properties/MODULE-PLAN.md
# Modul 040 – Nemovitosti a jednotky
## Implementační plán podle POSTUP.md

---

# 1. PŘÍPRAVA MODULU (analýza)

## 1.1 Definice účelu modulu

**Modul 040 – Nemovitosti** slouží k evidenci a správě nemovitostí (budov, domů, objektů) a jejich jednotek (bytů, nebytových prostor).

### K čemu modul slouží:
- Evidence nemovitostí (budovy, domy, pozemky, objekty)
- Evidence jednotek v rámci nemovitostí (byty, kanceláře, garáže, sklady)
- Propojení nemovitostí s pronajímateli (vlastníci)
- Základ pro vazby na smlouvy a platby

### Jakou entitu / entity spravuje:
- **properties** (nemovitosti) – hlavní entita
- **units** (jednotky) – vnořená entita (1:N vztah k nemovitosti)

### Kdo modul používá:
- **Admin** – plný přístup (CRUD všech nemovitostí)
- **Manager** – správa nemovitostí přiřazeného portfolia
- **Landlord** – pouze svoje nemovitosti (read-only nebo limitovaná editace)

### Typ modulu:
- **Provozní modul** – základ pro celý systém správy pronájmů

---

## 1.2 Datový model modulu

### Hlavní tabulky:

#### 1) `properties` (nemovitosti)
- Reprezentuje budovy, domy, objekty
- **Vazby:**
  - `owner_id` → `subjects.id` (pronajímatel - vlastník)
  - 1:N → `units` (jednotky v nemovitosti)
  - 1:N → `contracts` (smlouvy - budoucí)
  - 1:N → `documents` (přílohy)

#### 2) `units` (jednotky)
- Reprezentuje bytové a nebytové jednotky v rámci nemovitosti
- **Vazby:**
  - `property_id` → `properties.id` (FK)
  - 1:N → `contracts` (smlouvy na jednotku)
  - 1:N → `documents` (přílohy)

### Typ vztahu:
- 1 property : N units (1:N)
- property → owner (N:1 vazba na subjects)

### Audit a systémová pole:
- `created_at`, `created_by`
- `updated_at`, `updated_by`
- `is_active` / `is_archived` (soft delete)

### Archivace:
- Archivovaná nemovitost → všechny její jednotky jsou read-only
- Archivovaná jednotka → nelze vytvořit novou smlouvu

---

# 2. SPECIFIKACE POLÍ

## 2.1 Tabulka PROPERTIES (nemovitosti)

| Název pole | Kód pole | Typ | Select zdroj | Viditelnost | Editace | Validace | Poznámka |
|------------|----------|-----|--------------|-------------|---------|----------|----------|
| **ID** | `id` | uuid | - | Všichni | Nikdo (auto) | UUID | PK, auto-generated |
| **Vlastník** | `owner_id` | uuid | lookup: subjects (landlords) | Všichni | Admin, Manager | Povinné | FK → subjects |
| **Název nemovitosti** | `name` | text | - | Všichni | Admin, Manager, Landlord | Max 200 znaků, povinné | Např. "Bytový dům Na Kopci" |
| **Kód nemovitosti** | `code` | text | - | Všichni | Admin, Manager | Max 50 znaků, unique | Např. "BD-001" |
| **Typ nemovitosti** | `property_type` | text | generic_type: property_types | Všichni | Admin, Manager | Povinné | Rodinný dům, bytový dům, pozemek... |
| **Ulice** | `street` | text | - | Všichni | Admin, Manager, Landlord | Max 80 | - |
| **Číslo popisné** | `house_number` | text | - | Všichni | Admin, Manager, Landlord | Max 10, regex: `^[0-9A-Za-z/\-]{1,10}$` | - |
| **Číslo orientační** | `orientation_number` | text | - | Všichni | Admin, Manager, Landlord | Max 10, regex: `^[0-9A-Za-z/\-]{0,10}$` | Volitelné |
| **Město** | `city` | text | - | Všichni | Admin, Manager, Landlord | Max 80, povinné | - |
| **PSČ** | `zip` | text | - | Všichni | Admin, Manager, Landlord | Max 5, regex: `^\d{5}$` | - |
| **Kraj** | `region` | text | generic_type: regions | Všichni | Admin, Manager | - | Volitelné |
| **Země** | `country` | text | generic_type: countries | Všichni | Admin, Manager | Default: CZ | ISO kód (CZ, SK, AT...) |
| **Počet podlaží** | `floors_above` | integer | - | Všichni | Admin, Manager | >= 0 | Nadzemní podlaží |
| **Počet podzemních podlaží** | `floors_below` | integer | - | Všichni | Admin, Manager | >= 0 | Suterén, sklepy |
| **Rok výstavby** | `year_built` | integer | - | Všichni | Admin, Manager | 1800-2100 | - |
| **Rok rekonstrukce** | `year_renovated` | integer | - | Všichni | Admin, Manager | 1800-2100 | Volitelné |
| **Celková plocha (m²)** | `total_area` | numeric | - | Všichni | Admin, Manager | > 0, 2 des. místa | Plocha celé nemovitosti |
| **Správce** | `manager_name` | text | - | Všichni | Admin, Manager | Max 100 | Jméno správce (volitelné) |
| **Poznámka** | `note` | text | - | Všichni | Admin, Manager, Landlord | Max 1000 | - |
| **Aktivní** | `is_active` | boolean | - | Admin | Admin | - | Default: true |
| **Archivováno** | `is_archived` | boolean | - | Admin | Admin | - | Default: false |
| **Vytvořeno** | `created_at` | timestamptz | - | Všichni | Nikdo (auto) | - | Automaticky |
| **Vytvořil** | `created_by` | uuid | lookup: users | Admin | Nikdo (auto) | - | FK → auth.users |
| **Upraveno** | `updated_at` | timestamptz | - | Všichni | Nikdo (auto) | - | Automaticky |
| **Upravil** | `updated_by` | uuid | lookup: users | Admin | Nikdo (auto) | - | FK → auth.users |

## 2.2 Tabulka UNITS (jednotky)

| Název pole | Kód pole | Typ | Select zdroj | Viditelnost | Editace | Validace | Poznámka |
|------------|----------|-----|--------------|-------------|---------|----------|----------|
| **ID** | `id` | uuid | - | Všichni | Nikdo (auto) | UUID | PK, auto-generated |
| **Nemovitost** | `property_id` | uuid | lookup: properties | Všichni | Admin, Manager | Povinné | FK → properties |
| **Číslo jednotky** | `unit_number` | text | - | Všichni | Admin, Manager | Max 50, povinné | Např. "101", "2A" |
| **Název jednotky** | `unit_name` | text | - | Všichni | Admin, Manager | Max 100 | Např. "Byt 2+kk v 1. patře" |
| **Typ jednotky** | `unit_type` | text | generic_type: unit_types | Všichni | Admin, Manager | Povinné | Byt, kancelář, garáž, sklad... |
| **Dispozice** | `disposition` | text | - | Všichni | Admin, Manager | Max 20 | 1+kk, 2+1, 3+kk, atipický... |
| **Podlaží** | `floor` | integer | - | Všichni | Admin, Manager | -5 až 99 | Např. -1 = suterén, 0 = přízemí |
| **Plocha (m²)** | `area` | numeric | - | Všichni | Admin, Manager | > 0, max 2 des. místa | Např. 45.50 |
| **Poměr plochy** | `area_ratio` | text | - | Všichni (read-only) | Nikdo (auto) | Např. "449/58" | Auto-výpočet: plocha_nemovitosti / plocha_jednotky |
| **Stav jednotky** | `status` | text | generic_type: unit_statuses | Všichni | Admin, Manager | Povinné | 🔴 Obsazená, 🟢 Volná, Rezervovaná, V rekonstrukci |
| **Číslo orientační** | `orientation_number` | text | - | Všichni | Admin, Manager | Max 10 | Volitelné (pokud jiné než u nemovitosti) |
| **Rok rekonstrukce** | `year_renovated` | integer | - | Všichni | Admin, Manager | 1800-2100 | Může být jiný než u nemovitosti |
| **Správce** | `manager_name` | text | - | Všichni | Admin, Manager | Max 100 | Může být jiný než u nemovitosti |
| **Nájemník** | `tenant_id` | uuid | lookup: subjects (tenants) | Všichni | Admin, Manager | - | FK → subjects, vazba na nájemníka |
| **Počet uživatelů** | `user_count` | integer | - | Všichni (read-only) | Nikdo (auto) | >= 0 | Auto-výpočet: nájemník + další uživatelé |
| **Poznámka** | `note` | text | - | Všichni | Admin, Manager | Max 1000 | - |
| **Aktivní** | `is_active` | boolean | - | Admin | Admin | - | Default: true |
| **Archivováno** | `is_archived` | boolean | - | Admin | Admin | - | Default: false |
| **Vytvořeno** | `created_at` | timestamptz | - | Všichni | Nikdo (auto) | - | Automaticky |
| **Vytvořil** | `created_by` | uuid | lookup: users | Admin | Nikdo (auto) | - | FK → auth.users |
| **Upraveno** | `updated_at` | timestamptz | - | Všichni | Nikdo (auto) | - | Automaticky |
| **Upravil** | `updated_by` | uuid | lookup: users | Admin | Nikdo (auto) | - | FK → auth.users |

## 2.3 Tabulka EQUIPMENT_CATALOG (katalog vybavení)

**Účel:** Číselník typů vybavení (sporák, vana, televize, podlaha...) s výchozími parametry

| Název pole | Kód pole | Typ | Select zdroj | Viditelnost | Editace | Validace | Poznámka |
|------------|----------|-----|--------------|-------------|---------|----------|----------|
| **ID** | `id` | uuid | - | Všichni | Nikdo (auto) | UUID | PK, auto-generated |
| **Název vybavení** | `name` | text | - | Všichni | Admin | Max 50, povinné | Např. "Sporák", "Vana", "Televize" |
| **Typ místnosti** | `room_type` | text | generic_type: room_types | Všichni | Admin | - | Kuchyně, koupelna, obývací pokoj... |
| **Kategorie vybavení** | `equipment_type` | text | generic_type: equipment_types | Všichni | Admin | - | Kuchyně, koupelna, elektro, nábytek... |
| **Výchozí životnost (měsíce)** | `default_lifespan_months` | integer | - | Všichni | Admin | >= 0 | Doporučená životnost |
| **Výchozí interval revize (měsíce)** | `default_revision_interval` | integer | - | Všichni | Admin | >= 0 | Např. 12 měsíců pro elektro |
| **Výchozí stav** | `default_state` | text | generic_type: equipment_states | Všichni | Admin | - | Nové, běžné, poškozené, k výměně |
| **Výchozí popis** | `default_description` | text | - | Všichni | Admin | Max 200 | Obecný popis typu |
| **Aktivní** | `is_active` | boolean | - | Admin | Admin | - | Default: true |
| **Vytvořeno** | `created_at` | timestamptz | - | Všichni | Nikdo (auto) | - | Automaticky |
| **Upraveno** | `updated_at` | timestamptz | - | Všichni | Nikdo (auto) | - | Automaticky |

## 2.4 Tabulka UNIT_EQUIPMENT (vybavení jednotky)

**Účel:** Konkrétní kusy vybavení v jednotkách (lednice v bytě 101, sporák v bytě 205...)

| Název pole | Kód pole | Typ | Select zdroj | Viditelnost | Editace | Validace | Poznámka |
|------------|----------|-----|--------------|-------------|---------|----------|----------|
| **ID** | `id` | uuid | - | Všichni | Nikdo (auto) | UUID | PK, auto-generated |
| **Jednotka** | `unit_id` | uuid | lookup: units | Všichni | Admin, Manager | Povinné | FK → units |
| **Typ vybavení (katalog)** | `equipment_catalog_id` | uuid | lookup: equipment_catalog | Všichni | Admin, Manager | Povinné | FK → equipment_catalog |
| **Název vybavení** | `name` | text | - | Všichni | Admin, Manager | Max 100, povinné | Název konkrétního kusu |
| **Typ vybavení** | `equipment_type` | text | generic_type: equipment_types | Všichni | Admin, Manager | - | Z katalogu nebo vlastní |
| **Popis** | `description` | text | - | Všichni | Admin, Manager | Max 1000 | Volitelný popis |
| **Počet kusů** | `quantity` | integer | - | Všichni | Admin, Manager | >= 1, povinné | Kolik kusů stejného typu |
| **Jednotková cena** | `purchase_price` | numeric | - | Všichni | Admin, Manager | >= 0, 2 des. místa | Cena za jeden kus |
| **Cena celkem** | `total_price` | numeric | - | Všichni (read-only) | Nikdo (auto) | - | = quantity × purchase_price |
| **Datum instalace** | `installed_at` | date | - | Všichni | Admin, Manager | - | Datum instalace/výměny |
| **Datum poslední revize** | `last_revision` | date | - | Všichni | Admin, Manager | - | Pro elektro, kotle, měřiče... |
| **Životnost (měsíce)** | `lifespan_months` | integer | - | Všichni | Admin, Manager | >= 0 | Konkrétní životnost |
| **Stav vybavení** | `state` | text | generic_type: equipment_states | Všichni | Admin, Manager | Povinné | Nové, běžné, poškozené, k výměně |
| **Fotka vybavení** | `photo_attachment_id` | uuid | lookup: documents | Všichni | Admin, Manager | - | FK → documents (příloha) |
| **Vytvořeno** | `created_at` | timestamptz | - | Všichni | Nikdo (auto) | - | Automaticky |
| **Upraveno** | `updated_at` | timestamptz | - | Všichni | Nikdo (auto) | - | Automaticky |

## 2.5 Tabulka PROPERTY_EQUIPMENT (vybavení nemovitosti)

**Účel:** Společné vybavení nemovitosti (gril, sekačka, nářadí ve společných prostorách...)

| Název pole | Kód pole | Typ | Select zdroj | Viditelnost | Editace | Validace | Poznámka |
|------------|----------|-----|--------------|-------------|---------|----------|----------|
| **ID** | `id` | uuid | - | Všichni | Nikdo (auto) | UUID | PK, auto-generated |
| **Nemovitost** | `property_id` | uuid | lookup: properties | Všichni | Admin, Manager | Povinné | FK → properties |
| **Typ vybavení (katalog)** | `equipment_catalog_id` | uuid | lookup: equipment_catalog | Všichni | Admin, Manager | Povinné | FK → equipment_catalog |
| **Název vybavení** | `name` | text | - | Všichni | Admin, Manager | Max 100, povinné | Název konkrétního kusu |
| **Typ vybavení** | `equipment_type` | text | generic_type: equipment_types | Všichni | Admin, Manager | - | Z katalogu nebo vlastní |
| **Popis** | `description` | text | - | Všichni | Admin, Manager | Max 1000 | Volitelný popis |
| **Počet kusů** | `quantity` | integer | - | Všichni | Admin, Manager | >= 1, povinné | Kolik kusů stejného typu |
| **Jednotková cena** | `purchase_price` | numeric | - | Všichni | Admin, Manager | >= 0, 2 des. místa | Cena za jeden kus |
| **Cena celkem** | `total_price` | numeric | - | Všichni (read-only) | Nikdo (auto) | - | = quantity × purchase_price |
| **Datum instalace** | `installed_at` | date | - | Všichni | Admin, Manager | - | Datum instalace/výměny |
| **Datum poslední revize** | `last_revision` | date | - | Všichni | Admin, Manager | - | Pro elektro, kotle, měřiče... |
| **Životnost (měsíce)** | `lifespan_months` | integer | - | Všichni | Admin, Manager | >= 0 | Konkrétní životnost |
| **Stav vybavení** | `state` | text | generic_type: equipment_states | Všichni | Admin, Manager | Povinné | Nové, běžné, poškozené, k výměně |
| **Fotka vybavení** | `photo_attachment_id` | uuid | lookup: documents | Všichni | Admin, Manager | - | FK → documents (příloha) |
| **Vytvořeno** | `created_at` | timestamptz | - | Všichni | Nikdo (auto) | - | Automaticky |
| **Upraveno** | `updated_at` | timestamptz | - | Všichni | Nikdo (auto) | - | Automaticky |

---

# 3. SELECTY A ČÍSELNÍKY

## 3.1 Seznam selectů v modulu

| Select | Typ | Zdroj | Poznámka |
|--------|-----|-------|----------|
| **Typ nemovitosti** | generic_type | `property_types` | Již existuje v modulu 900 |
| **Typ jednotky** | generic_type | `unit_types` | Již existuje v modulu 900 |
| **Stav jednotky** | generic_type | `unit_statuses` | Nový v modulu 900 (Obsazená, Volná, Rezervovaná...) |
| **Kraj** | generic_type | `regions` | Nový v modulu 900 (české kraje) |
| **Země** | generic_type | `countries` | Nový v modulu 900 (CZ, SK, AT, DE...) |
| **Typ místnosti** | generic_type | `room_types` | Nový v modulu 900 (Kuchyně, Koupelna, Obývací pokoj...) |
| **Kategorie vybavení** | generic_type | `equipment_types` | Nový v modulu 900 (Kuchyně, Koupelna, Elektro, Nábytek...) |
| **Stav vybavení** | generic_type | `equipment_states` | Nový v modulu 900 (Nové, Běžné, Poškozené, K výměně) |
| **Vlastník (pronajímatel)** | lookup | `subjects` WHERE has_role('landlord') | Dynamický lookup |
| **Nájemník** | lookup | `subjects` WHERE has_role('tenant') | Dynamický lookup |
| **Typ vybavení (katalog)** | lookup | `equipment_catalog` | Dynamický lookup |

## 3.2 Generic types – existující v modulu 900

✅ **PropertyTypesTile** – `app/modules/900-nastaveni/tiles/PropertyTypesTile.tsx`
- Tabulka: `property_types`
- Příklady: Rodinný dům, Bytový dům, Pozemek, Průmyslový objekt

✅ **UnitTypesTile** – `app/modules/900-nastaveni/tiles/UnitTypesTile.tsx`
- Tabulka: `unit_types`
- Příklady: Byt, Kancelář, Garáž, Sklad, Zahrada

## 3.3 Generic types – NOVÉ (je potřeba vytvořit v modulu 900)

⏳ **UnitStatusesTile** (Stav jednotky)
- Tabulka: `unit_statuses`
- Příklady: 🔴 Obsazená, 🟢 Volná, Rezervovaná, V rekonstrukci

⏳ **RegionsTile** (Kraje)
- Tabulka: `regions`
- Příklady: Praha, Středočeský, Jihomoravský...

⏳ **CountriesTile** (Země)
- Tabulka: `countries`
- Příklady: CZ (Česko), SK (Slovensko), AT (Rakousko)...

⏳ **RoomTypesTile** (Typ místnosti)
- Tabulka: `room_types`
- Příklady: Kuchyně, Koupelna, Obývací pokoj, Chodba...

⏳ **EquipmentTypesTile** (Kategorie vybavení)
- Tabulka: `equipment_types`
- Příklady: Kuchyně, Koupelna, Elektro, Nábytek, Podlaha...

⏳ **EquipmentStatesTile** (Stav vybavení)
- Tabulka: `equipment_states`
- Příklady: Nové, Běžné, Poškozené, K výměně

---

# 4. ROLE A OPRÁVNĚNÍ

## 4.1 Matice přístupu k modulu

| Role | ListView | DetailView (read) | Create | Edit | Delete | Archive |
|------|----------|------------------|--------|------|--------|---------|
| **Admin** | ✅ Všechny | ✅ Všechny | ✅ | ✅ | ✅ | ✅ |
| **Manager** | ✅ Portfolio | ✅ Portfolio | ✅ | ✅ | ❌ | ✅ |
| **Landlord** | ✅ Vlastní | ✅ Vlastní | ❌ | ⚠️ Omezené | ❌ | ❌ |
| **Tenant** | ❌ | ⚠️ Jen přiřazené | ❌ | ❌ | ❌ | ❌ |

### Poznámky k oprávněním:
- **Manager** – spravuje definované portfolio (group_id nebo owner_id filtr)
- **Landlord** – vidí jen své nemovitosti (owner_id = landlord_subject_id)
- **Landlord editace** – může upravit jen kontaktní údaje a poznámku, NE typ ani vlastníka
- **Tenant** – vidí detail jen jednotek, kde má aktivní smlouvu (read-only)

## 4.2 Viditelnost sekcí v detailu

| Sekce | Admin | Manager | Landlord | Tenant |
|-------|-------|---------|----------|--------|
| **Základní údaje** | ✅ Edit | ✅ Edit | ⚠️ Částečně | ❌ |
| **Adresa** | ✅ Edit | ✅ Edit | ✅ Edit | ❌ |
| **Jednotky** (RelationList) | ✅ Edit | ✅ Edit | ✅ Read | ❌ |
| **Přílohy** | ✅ | ✅ | ✅ Read | ❌ |
| **Historie** | ✅ | ✅ | ❌ | ❌ |
| **Systém** | ✅ | ❌ | ❌ | ❌ |

---

# 5. UI STRUKTURA MODULU

## 5.0 Dynamické tiles podle typů

### Princip (podobně jako u modulů 030 a 050):

Modul 040 bude mít **dynamické tiles** pro každý typ nemovitosti a jednotky.

**Tiles se vytvoří automaticky podle:**
- `property_types` tabulky (typy nemovitostí)
- `unit_types` tabulky (typy jednotek)

**Zobrazení v Sidebaru:**
```
📦 Nemovitosti (040)
  ├── Přehled (všechny nemovitosti)
  ├── Rodinný dům (15)        ← dynamický tile
  ├── Bytový dům (8)          ← dynamický tile
  ├── Pozemek (3)             ← dynamický tile
  ├── ...
  ├── Přehled jednotek (všechny)
  ├── Byt (45)                ← dynamický tile
  ├── Garáž (12)              ← dynamický tile
  ├── Kancelář (8)            ← dynamický tile
  └── ...
```

**Implementace:**
- `PropertiesTile` - s přednastaveným filtrem `property_type`
- `UnitsTile` - s přednastaveným filtrem `unit_type`
- Počty v závorkách se načtou při startu aplikace (AppShell)

### Příklad:

**Tile "Rodinný dům":**
- ID: `properties-type-rodinny_dum`
- Komponenta: `PropertyTypeTile` (wrapper nad `PropertiesTile`)
- Filtr: `property_type = 'rodinny_dum'`
- Label: "Rodinný dům (15)" - počet se načte dynamicky

---

## 5.1 ListView (hlavní seznam nemovitostí)

### Komponenta: `PropertiesTile.tsx`

### Sloupce (povinné):
- Název
- Typ nemovitosti
- Adresa (city, street)
- Vlastník (display_name z subjects)
- Počet jednotek (agregace)

### Sloupce (volitelné – ColumnPicker):
- Kód nemovitosti
- PSČ
- Vytvořeno
- Upraveno
- Stav (Aktivní/Archivováno)

### Filtry:
- **Text** (fulltext): název, kód, adresa
- **Typ nemovitosti** (select): property_types
- **Vlastník** (lookup autocomplete): subjects (landlords)
- **Aktivní/Archivované** (checkbox): is_archived

### Výchozí řazení:
- `name ASC`

### Výchozí filtr:
- `is_archived = false`

### CommonActions:
- **Nový** – vytvoří novou nemovitost
- **Upravit** – otevře detail v edit mode
- **Archivovat** – soft delete (is_archived = true)
- **Zobrazit** – otevře detail v read-only
- **Filtr** – rozbalí filtry
- **Sloupce** – otevře ColumnPicker
- **Export** (později)

---

## 5.2 DetailView (detail nemovitosti)

### Komponenta: `PropertyDetailFrame.tsx`

### Záložky (tabs):

#### 1️⃣ **Základní údaje** (BasicInfoSection)
**Pole:**
- ID (read-only)
- Název nemovitosti *
- Kód nemovitosti
- Typ nemovitosti * (select)
- Vlastník * (lookup autocomplete → subjects/landlords)
- Poznámka

**Editovatelné:**
- Admin: Všechna pole
- Manager: Všechna pole
- Landlord: Název, Poznámka (NE typ, NE vlastník)

#### 2️⃣ **Adresa** (AddressSection)
**Pole:**
- Ulice
- Číslo popisné
- Číslo orientační
- Město *
- PSČ
- Kraj
- Země * (select)
- Počet podlaží (nadzemních)
- Počet podzemních podlaží
- Rok výstavby
- Rok rekonstrukce
- Celková plocha (m²)
- Počet jednotek (plánovaný)
- Počet přiřazených jednotek (read-only, auto-výpočet)
- Správce

**Editovatelné:**
- Admin: Všechna pole
- Manager: Všechna pole
- Landlord: Všechna pole kromě Vlastníka

#### 3️⃣ **Jednotky** (UnitsSection – RelationListWithDetail)
**Horní seznam (EntityList):**
- Sloupce: Číslo jednotky, Název, Typ, Dispozice, Podlaží, Plocha, Stav
- Akce: Nová jednotka, Upravit jednotku, Archivovat

**Dolní detail (UnitDetailFrame):**
- Formulář jednotky (viz níže)

**Editovatelné:**
- Admin: Full CRUD
- Manager: Full CRUD
- Landlord: Read-only

#### 4️⃣ **Vybavení nemovitosti** (PropertyEquipmentSection – RelationListWithDetail)
**Horní seznam (EntityList):**
- Sloupce: Název, Typ, Počet kusů, Stav, Cena celkem
- Akce: Nové vybavení, Upravit, Archivovat

**Dolní detail (PropertyEquipmentDetailFrame):**
- Formulář vybavení nemovitosti

**Editovatelné:**
- Admin: Full CRUD
- Manager: Full CRUD
- Landlord: Read-only

#### 5️⃣ **Přílohy** (AttachmentsSection)
- Read-only tab
- Zobrazení příloh entity `property`
- Tlačítko 📎 v CommonActions otevře AttachmentsManagerFrame

#### 6️⃣ **Historie** (HistorySection)
- Changelog (audit_log)
- Zobrazí změny na nemovitosti

#### 7️⃣ **Systém** (SystemSection)
- Vytvořeno (datum + uživatel)
- Upraveno (datum + uživatel)
- is_active
- is_archived

---

## 5.3 DetailView (detail jednotky)

### Komponenta: `UnitDetailFrame.tsx`

### Záložky (tabs):

#### 1️⃣ **Základní údaje**
**Pole:**
- ID (read-only)
- Nemovitost * (lookup nebo read-only)
- Typ nemovitosti (read-only, z nemovitosti)
- Číslo jednotky *
- Název jednotky
- Typ jednotky * (select)
- Dispozice (1+kk, 2+1, 3+kk, atipický...)
- Podlaží
- Plocha (m²)
- Poměr plochy k nemovitosti (read-only, auto-výpočet)
- Stav * (🔴 Obsazená, 🟢 Volná, Rezervovaná, V rekonstrukci)
- Poznámka

**Adresa (read-only z nemovitosti):**
- Ulice
- Číslo popisné
- Číslo orientační (editovatelné, pokud jiné než u nemovitosti)
- Město
- PSČ
- Kraj
- Země
- Rok výstavby (z nemovitosti)
- Rok rekonstrukce (editovatelné, pokud jiný než u nemovitosti)

**Správa:**
- Správce (může být jiný než u nemovitosti)
- Pronajímatel * (lookup, může být jiný než u nemovitosti - upozornit hláškou)
- Nájemník (lookup → subjects/tenants)
- Počet uživatelů (read-only, auto-výpočet: nájemník + další uživatelé)

#### 2️⃣ **Vybavení jednotky** (UnitEquipmentSection – RelationListWithDetail)
**Horní seznam (EntityList):**
- Sloupce: Název, Typ, Počet kusů, Stav, Cena celkem, Datum instalace
- Akce: Nové vybavení, Upravit, Archivovat

**Dolní detail (UnitEquipmentDetailFrame):**
- Formulář vybavení jednotky

**Editovatelné:**
- Admin: Full CRUD
- Manager: Full CRUD
- Landlord: Read-only

#### 3️⃣ **Smlouvy** (ContractsSection – budoucí)
- RelationListWithDetail → contracts na této jednotce

#### 4️⃣ **Přílohy** (AttachmentsSection)
- Read-only tab
- Zobrazení příloh entity `unit`

#### 5️⃣ **Historie** (HistorySection)
- Changelog jednotky

#### 6️⃣ **Systém** (SystemSection)
- Systémová pole

---

## 5.4 RelationListWithDetail – Jednotky v nemovitosti

### Použití:
V detailu nemovitosti (záložka "Jednotky")

### Horní seznam (UnitsEntityList):
**Sloupce:**
- Číslo jednotky
- Název
- Typ jednotky
- Podlaží
- Plocha (m²)
- Stav (Aktivní/Archivováno)

**Filtry:**
- Text (číslo, název)
- Typ jednotky
- Aktivní/Archivované

**Výchozí filtr:**
- `property_id = {current_property_id}`
- `is_archived = false`

### Dolní detail (UnitDetailFrame):
- Zobrazí detail vybrané jednotky
- Mode: read nebo edit podle oprávnění

### Oprávnění:
- Admin, Manager: Edit mode (CRUD)
- Landlord: Read-only
- Tenant: Skryté

---

# 6. COLUMN PICKER

## 6.1 PropertiesTile (seznam nemovitostí)

**Identifikátor:**
- `moduleId: '040-nemovitost'`
- `tileId: 'properties-list'`

**Povinné sloupce:**
- `name` (Název)
- `property_type` (Typ)
- `city` (Město)

**Volitelné sloupce:**
- `code` (Kód)
- `street` (Ulice)
- `zip` (PSČ)
- `owner_name` (Vlastník)
- `units_count` (Počet jednotek)
- `created_at` (Vytvořeno)
- `updated_at` (Upraveno)
- `is_archived` (Archivováno)

## 6.2 UnitsSection (seznam jednotek v nemovitosti)

**Identifikátor:**
- `moduleId: '040-nemovitost'`
- `tileId: 'units-list'`

**Povinné sloupce:**
- `unit_number` (Číslo)
- `unit_type` (Typ)

**Volitelné sloupce:**
- `unit_name` (Název)
- `floor` (Podlaží)
- `area` (Plocha)
- `is_archived` (Archivováno)

---

# 7. IMPLEMENTACE – POŘADÍ KROKŮ

## Fáze 1: Databáze
1. ✅ Definice polí (hotovo výše)
2. ⏳ Migrace 060: Vytvoření tabulky `properties`
3. ⏳ Migrace 061: Vytvoření tabulky `units`
4. ⏳ Migrace 062: Vytvoření tabulky `equipment_catalog`
5. ⏳ Migrace 063: Vytvoření tabulky `unit_equipment`
6. ⏳ Migrace 064: Vytvoření tabulky `property_equipment`
7. ⏳ Migrace 065: RLS policies pro všechny tabulky
8. ⏳ Migrace 066: Indexy a triggery
9. ⏳ Migrace 067: Nové generic types (unit_statuses, regions, countries, room_types, equipment_types, equipment_states)

## Fáze 2: Services
1. ⏳ `app/lib/services/properties.ts`
   - `listProperties(params)`
   - `getPropertyDetail(id)`
   - `saveProperty(input)`
   - `archiveProperty(id)`
2. ⏳ `app/lib/services/units.ts`
   - `listUnits(params)`
   - `getUnitDetail(id)`
   - `saveUnit(input)`
   - `archiveUnit(id)`
3. ⏳ `app/lib/services/equipment.ts`
   - `listEquipmentCatalog()`
   - `listUnitEquipment(unitId)`
   - `listPropertyEquipment(propertyId)`
   - `saveEquipmentCatalog(input)`
   - `saveUnitEquipment(input)`
   - `savePropertyEquipment(input)`

## Fáze 3: UI – PropertiesTile (seznam)
1. ⏳ `app/modules/040-nemovitost/tiles/PropertiesTile.tsx`
   - ListView nemovitostí
   - Filtry
   - CommonActions
2. ⏳ `app/modules/040-nemovitost/tiles/PropertyTypeTile.tsx`
   - Wrapper pro dynamické tiles podle typu
3. ⏳ Aktualizace `module.config.js` (přidat tiles)

## Fáze 4: UI – PropertyDetailFrame (detail nemovitosti)
1. ⏳ `app/modules/040-nemovitost/forms/PropertyDetailFrame.tsx`
   - Záložky: Základní, Adresa, Jednotky, Vybavení, Přílohy, Historie, Systém
   - Formuláře pro edit mode
   - Validace

## Fáze 5: UI – UnitsSection (jednotky v nemovitosti)
1. ⏳ `app/modules/040-nemovitost/components/UnitsSection.tsx`
   - RelationListWithDetail
   - Horní seznam jednotek
   - Dolní detail (UnitDetailFrame)

## Fáze 6: UI – UnitDetailFrame (detail jednotky)
1. ⏳ `app/modules/040-nemovitost/forms/UnitDetailFrame.tsx`
   - Záložky: Základní, Vybavení, Smlouvy (later), Přílohy, Historie, Systém
   - Formulář pro edit mode

## Fáze 7: UI – Equipment (vybavení)
1. ⏳ `app/modules/040-nemovitost/components/PropertyEquipmentSection.tsx`
   - RelationListWithDetail pro vybavení nemovitosti
2. ⏳ `app/modules/040-nemovitost/components/UnitEquipmentSection.tsx`
   - RelationListWithDetail pro vybavení jednotky
3. ⏳ `app/modules/040-nemovitost/forms/EquipmentCatalogFrame.tsx`
   - Správa katalogu vybavení (číselník)
4. ⏳ `app/modules/900-nastaveni/tiles/EquipmentCatalogTile.tsx`
   - Tile pro správu katalogu v modulu 900

## Fáze 8: Generic Types v modulu 900
1. ⏳ Vytvoření nových GenericTypeTile:
   - `UnitStatusesTile.tsx`
   - `RegionsTile.tsx`
   - `CountriesTile.tsx`
   - `RoomTypesTile.tsx`
   - `EquipmentTypesTile.tsx`
   - `EquipmentStatesTile.tsx`

## Fáze 9: Testování
1. ⏳ Vytvoření testovacích dat (seed migrace)
2. ⏳ Manuální testování CRUD operací
3. ⏳ Testování RLS policies
4. ⏳ Testování auto-výpočtů (poměr plochy, počet uživatelů, cena celkem)

---

# 8. CHECKLIST PRO MODUL 040

- [x] Definován účel modulu
- [x] Vytvořena tabulka všech polí (properties + units)
- [x] Určeny selecty (property_types, unit_types – už existují)
- [x] Určeny role a oprávnění
- [x] Navržena UI struktura (ListView + DetailView)
- [x] Popsány vazby (RelationListWithDetail pro units)
- [x] Definován ColumnPicker
- [x] Doplněny systémové sekce (Přílohy, Historie, Systém)
- [x] Hotový MODULE-PLAN.md
- [ ] **Může začít implementace** ← JSME TADY

---

# 9. POZNÁMKY A ROZŠÍŘENÍ

## Co je NOVÉ oproti původnímu plánu (z CSV):

✅ **Properties - rozšířená pole:**
- Číslo orientační
- Kraj
- Počet podlaží (nadzemních + podzemních)
- Rok výstavby a rekonstrukce
- Celková plocha
- Správce

✅ **Units - rozšířená pole:**
- Dispozice (1+kk, 2+1, 3+kk...)
- Stav (🔴 Obsazená, 🟢 Volná, Rezervovaná, V rekonstrukci)
- Nájemník (vazba na subjects/tenants)
- Počet uživatelů (auto-výpočet)
- Poměr plochy k nemovitosti (auto-výpočet pro výpočet služeb)
- Rok rekonstrukce (individuální pro jednotku)
- Číslo orientační (individuální, pokud jiné než u nemovitosti)

✅ **Equipment - kompletní systém vybavení:**
- **Equipment Catalog** – číselník typů vybavení (sporák, vana, televize...)
- **Unit Equipment** – konkrétní vybavení jednotek
- **Property Equipment** – společné vybavení nemovitosti (gril, sekačka...)
- Pole: název, typ, počet kusů, cena, datum instalace, revize, životnost, stav, fotka

✅ **Nové Generic Types (v modulu 900):**
- `unit_statuses` – Stav jednotky
- `regions` – České kraje
- `countries` – Země (CZ, SK, AT...)
- `room_types` – Typ místnosti (kuchyně, koupelna...)
- `equipment_types` – Kategorie vybavení
- `equipment_states` – Stav vybavení (nové, běžné, poškozené...)

✅ **Dynamické tiles podle typů:**
- Každý typ nemovitosti má vlastní tile (Rodinný dům, Bytový dům...)
- Každý typ jednotky má vlastní tile (Byt, Garáž, Kancelář...)
- Počty v závorkách se načítají dynamicky

✅ **Auto-výpočty:**
- Poměr plochy jednotky k nemovitosti (pro výpočet služeb)
- Počet uživatelů v jednotce (nájemník + další)
- Cena celkem u vybavení (počet kusů × jednotková cena)
- Počet přiřazených jednotek u nemovitosti

## Co zatím NENÍ v plánu (přijde později):
- **Smlouvy na jednotku** – modul 060
- **Měřidla na jednotku** – modul 100
- **Fotogalerie nemovitosti** – rozšíření attachments
- **Upozornění na revize** – notifikace při blížícím se datu revize vybavení
- **Kalkulačka nákladů** – automatický výpočet nákladů na provoz podle m² nebo počtu osob

## Pravidla z CSV, která musí být implementována:

⚠️ **Validace:**
- Každá nemovitost musí mít minimálně jednu jednotku (nebo upozornit)
- Pokud je u jednotky jiný pronajímatel než u nemovitosti → zobrazit hlášku
- Pokud chybí celková plocha nemovitosti → upozornit (potřebné pro výpočet poměrů)
- PSČ regex: `^\d{5}$`
- Číslo popisné regex: `^[0-9A-Za-z/\-]{1,10}$`
- Rok: 1800-2100

⚠️ **Adresa - automatické doplnění:**
- Jednotka dědí adresu z nemovitosti (ulice, město, PSČ, kraj, země, rok výstavby)
- Lze přepsat číslo orientační a rok rekonstrukce individuálně pro jednotku
- Při změně adresy nemovitosti → upozornit, že se změní i u jednotek

⚠️ **Auto-výpočty (musí být real-time):**
- Poměr plochy: `plocha_nemovitosti / plocha_jednotky` (např. "449/58")
- Počet uživatelů: `count(tenant_users) + 1 (nájemník)` pokud existuje
- Cena celkem: `quantity × purchase_price`
- Počet přiřazených jednotek: `count(units WHERE property_id = X)`

⚠️ **Dynamické tiles:**
- Při přidání nového typu nemovitosti v modulu 900 → automaticky vytvořit tile
- Při přidání nového typu jednotky v modulu 900 → automaticky vytvořit tile
- Počty v závorkách aktualizovat při změnách

---

# 10. ZÁVĚR

Modul 040 je **připraven k implementaci**.

✅ Specifikace podle POSTUP.md je kompletní  
✅ Datový model je jasný  
✅ UI struktura je navržena  
✅ Oprávnění jsou definována  

**Další krok:** Vytvoření databázových migrací (Fáze 1).
