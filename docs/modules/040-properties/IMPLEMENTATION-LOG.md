# 📝 Implementation Log – Modul Nemovitosti (040-nemovitost)

**Datum:** 19. ledna 2026  
**Status:** 🚧 V implementaci  
**Commity:** 066_fix_units_type_ids → bff46fb

---

## 📋 Přehled implementovaných funkcí

### ✅ Hotovo

#### 1. **Barevné označení typů (Type Color Badges)**
- **Commit:** d4ad4fb, abafe62
- **Soubory:** 
  - `app/lib/colorUtils.ts` (NEW)
  - `app/modules/040-nemovitost/tiles/UnitsTile.tsx`
  - `app/modules/040-nemovitost/tiles/PropertiesTile.tsx`
- **Funkce:**
  - Automatický kontrast textu podle jasu pozadí (W3C WCAG20)
  - Barevné badges pro typy v ListView první kolonce
  - `getContrastTextColor()` - vypočítá černou/bílou barvu textu
  - `hexToRgba()` - konverze hex → rgba s alpha
- **UX:** Text vždy čitelný na barevném pozadí

#### 2. **Migrace unit_type_id (Oprava seed dat)**
- **Commit:** e01a8d5
- **Soubor:** `supabase/migrations/066_fix_units_type_ids.sql`
- **Problém:** Po migraci 065 (generic_types UUID systém) jednotky neměly vyplněný `unit_type_id`
- **Řešení:** UPDATE podle názvů jednotek (Byt, Pokoj, Garáž, Dílna, Kancelář, Sklad, Sklep, Komora)
- **Důsledek:** Barvy typů se nyní zobrazují správně

#### 3. **Type Select na Systém Tab (UnitDetailFrame)**
- **Commit:** abafe62
- **Soubor:** `app/modules/040-nemovitost/components/UnitDetailFrame.tsx`
- **Funkce:**
  - Načítání unit types z `generic_types` (active, order_index)
  - Select dropdown pro změnu typu jednotky
  - Zobrazení ikony + názvu v selectu
  - Read-only zobrazení aktuálního typu ve view módu
  - Automatická aktualizace formValue při změně typu
  - Dirty tracking

#### 4. **Type Selector Tiles (Vytváření nové jednotky)**
- **Commit:** 77acc14
- **Soubor:** `app/modules/040-nemovitost/tiles/UnitsTile.tsx`
- **Funkce:**
  - Grid layout s kartami pro každý typ jednotky
  - Ikony emoji + názvy typů
  - Barevné bordery podle barvy typu
  - Po výběru typu → detail form s předvyplněným `unitTypeId`
- **Pattern:** `viewMode='create' + !selectedTypeForCreate` → zobrazí type selector

#### 5. **CommonActions Workflow (UnitsTile)**
- **Commit:** 027652f
- **Funkce:**
  - **List mode:** přidat/sloupce/zavřít
  - **List + vybraný řádek:** přidat/číst/editovat/sloupce/zavřít
  - **Read mode:** edit/zavřít
  - **Edit/Create mode:** uložit/přílohy/zavřít
  - **Dvojklik na řádek:** otevře detail v read módu
  - **Close s potvrzením** při neuložených změnách
  - **Save:** přepne na read mode + refresh listu

#### 6. **CommonActions State (PropertiesTile)**
- **Commit:** bff46fb
- **Soubor:** `app/modules/040-nemovitost/tiles/PropertiesTile.tsx`
- **Funkce:**
  - State pro viewMode (list/read/edit/create)
  - State pro isDirty a selectedTypeForCreate
  - CommonActions logika pro všechny módy
  - Připraveno pro PropertyDetailFrame
- **Status:** Handlery jsou placeholdery (chybí PropertyDetailFrame)

---

## 🚧 V implementaci

### ⏳ PropertyDetailFrame
- **Status:** Nepokračováno
- **Potřeba:** 
  - Vytvořit `PropertyDetailFrame.tsx` (analog UnitDetailFrame)
  - Type select na Systém tab
  - Napojení na PropertiesTile
  - Type selector tiles pro create mode

### ⏳ Tab Přílohy (Attachments)
- **Status:** Tlačítko připraveno (placeholder)
- **Potřeba:**
  - Přidat záložku "Přílohy" do DetailView
  - Read-only zobrazení v detailu
  - Tlačítko 📎 v CommonActions pro management
  - Funkce upload/version/edit (jako má subjekt)
- **Soubory:** UnitDetailFrame, PropertyDetailFrame (až bude)

---

## 📊 Datový Model

### Tabulka: `properties`
```sql
- id UUID (PK)
- landlord_id UUID → subjects(id)
- property_type_id UUID → generic_types(id)
- display_name TEXT NOT NULL
- internal_code TEXT
- street, house_number, city, zip, country, region TEXT
- land_area, built_up_area, building_area NUMERIC
- number_of_floors INTEGER
- build_year, reconstruction_year INTEGER
- cadastral_area, parcel_number, lv_number TEXT
- note TEXT
- origin_module TEXT DEFAULT '040-nemovitost'
- created_at, updated_at TIMESTAMP
- is_archived BOOLEAN
```

### Tabulka: `units`
```sql
- id UUID (PK)
- property_id UUID → properties(id)
- unit_type_id UUID → generic_types(id)
- display_name TEXT NOT NULL
- internal_code TEXT
- street, house_number, city, zip, country, region TEXT
- floor INTEGER
- door_number TEXT
- area, rooms NUMERIC
- status TEXT (available/occupied/reserved/renovation)
- note TEXT
- origin_module TEXT DEFAULT '040-nemovitost'
- created_at, updated_at TIMESTAMP
- is_archived BOOLEAN
```

### generic_types (Typy nemovitostí a jednotek)
```sql
- id UUID (PK)
- category TEXT ('property_types' | 'unit_types')
- code TEXT (rodinny_dum, byt, garaz...)
- name TEXT (Rodinný dům, Byt, Garáž...)
- icon TEXT (emoji: 🏠, 🏢, 🚗...)
- color TEXT (hex: #3498DB, #A564AD...)
- order_index INTEGER (user-customizable)
- active BOOLEAN
```

---

## 🔧 Service Layer

### `app/lib/services/properties.ts`
```typescript
listProperties(filters) → PropertiesListRow[]
  - SELECT s JOIN generic_types (typ, barva, ikona)
  - Filtry: searchText, propertyTypeId, includeArchived

getPropertyDetail(id) → PropertyDetail
saveProperty(input) → PropertyRow
deleteProperty(id)
```

### `app/lib/services/units.ts`
```typescript
listUnits(filters) → UnitsListRow[]
  - SELECT s JOIN generic_types (typ, barva, ikona)
  - Filtry: propertyId, unitTypeId, status

getUnitDetail(id) → UnitDetail
saveUnit(input) → UnitRow
deleteUnit(id)
```

---

## 🎨 UI Komponenty

### UnitDetailFrame
- **Cesta:** `app/modules/040-nemovitost/components/UnitDetailFrame.tsx`
- **Funkcionalita:**
  - DetailView s tabs: Detail, Systém
  - Type select na Systém tabu
  - Načítání unit types z generic_types
  - Dirty tracking
  - Submit handler pro save
- **Props:** `unit, viewMode, initialSectionId, callbacks`

### UnitsTile
- **Cesta:** `app/modules/040-nemovitost/tiles/UnitsTile.tsx`
- **Funkcionalita:**
  - ListView s barevnými type badges
  - Type selector pro create mode
  - CommonActions workflow
  - Dvojklik → read mode
  - Column settings (ListViewColumnsDrawer)
- **URL State:** `t=units-list, id, vm (read/edit/create)`

### PropertiesTile
- **Cesta:** `app/modules/040-nemovitost/tiles/PropertiesTile.tsx`
- **Funkcionalita:**
  - ListView s barevnými type badges
  - CommonActions state management
  - Column settings
- **Status:** Detail view v implementaci

---

## 🐛 Známé problémy

1. **PropertyDetailFrame neexistuje** → view/edit/create v PropertiesTile nefunguje
2. **Tab Přílohy chybí** → tlačítko je placeholder
3. **Dvojklik v PropertiesTile** → placeholder (čeká na PropertyDetailFrame)

---

## 📝 Pattern a Konvence

### Type Selection Workflow
```
1. Klik na "Přidat" → Type selector tiles
2. Výběr typu → DetailFrame s předvyplněným typeId
3. Formulář → možnost změnit typ na Systém tabu
4. Stejný pattern jako Pronajímatelé
```

### Barevné Badges
```tsx
<span 
  className="generic-type__name-badge" 
  style={{ 
    backgroundColor: typeColor, 
    color: getContrastTextColor(typeColor) 
  }}
>
  {typeName}
</span>
```

### CommonActions States
```typescript
list: ['add', 'columnSettings', 'close']
list + selection: ['add', 'view', 'edit', 'columnSettings', 'close']
read: ['edit', 'close']
edit/create: ['save', 'attachments', 'close']
```

---

## 🔗 Související dokumentace

- [MODULE-PLAN.md](MODULE-PLAN.md) - původní plán modulu
- [docs/04-modules.md](../../04-modules.md) - systém modulů
- [docs/03-ui-system.md](../../03-ui-system.md) - UI komponenty
- [app/modules/postup.md](../../../app/modules/postup.md) - postup vývoje modulů

---

## ✅ Next Steps

1. **PropertyDetailFrame** - vytvořit komponentu (analog UnitDetailFrame)
2. **Type selector tiles** v PropertiesTile pro create mode
3. **Tab Přílohy** - implementovat v obou DetailFramech
4. **Funkce editace příloh** - upload/version/management (jako subjekt)
5. **EquipmentTile** - vybavení jednotek
