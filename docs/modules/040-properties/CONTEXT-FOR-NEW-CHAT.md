# 🚀 Kontext pro nový chat – Modul Nemovitosti

**Datum:** 19. ledna 2026  
**Projekt:** Aplikace Pronajímatel v6  
**Modul:** 040-nemovitost (Properties & Units)

---

## 📌 Co jsme udělali

Pracovali jsme na **modulu nemovitostí (040-nemovitost)**, který zahrnuje:
- **Nemovitosti (Properties)** - budovy, pozemky
- **Jednotky (Units)** - byty, pokoje, garáže v rámci nemovitostí

### ✅ Dokončené funkce

#### 1. **Barevné označení typů**
- Každý typ nemovitosti/jednotky má svou barvu a ikonu z `generic_types` tabulky
- V seznamech se zobrazují barevné badges s automatickým kontrastem textu
- Implementováno: `colorUtils.ts` s funkcí `getContrastTextColor()`

#### 2. **Type Select na Systém tabu**
- V detailu jednotky (UnitDetailFrame) je na záložce "Systém" select pro změnu typu
- Načítá se z `generic_types` tabulky (active typy, seřazené)
- Zobrazuje ikony emoji + názvy typů

#### 3. **Type Selector Tiles (Výběr typu při vytváření)**
- Při kliknutí na "Přidat jednotku" se zobrazí dlaždice s typy (Byt, Garáž, atd.)
- Po výběru typu se otevře formulář s předvyplněným `unitTypeId`
- Stejný pattern jako u Pronajímatelů

#### 4. **CommonActions Workflow**
- **V seznamu:**
  - Žádný výběr: tlačítka "Přidat", "Sloupce", "Zavřít"
  - Vybraný řádek: tlačítka "Přidat", "Číst", "Editovat", "Sloupce", "Zavřít"
- **V detailu (čtení):** tlačítka "Editovat", "Zavřít"
- **V editaci/vytváření:** tlačítka "Uložit", "Přílohy", "Zavřít"
- **Dvojklik na řádek** → otevře detail v read módu

#### 5. **Migrace dat**
- Opravili jsme seed data - jednotky neměly vyplněný `unit_type_id`
- Migrace 066 doplnila typy podle názvů jednotek

---

## 🚧 Co zbývá dodělat

### 1. **PropertyDetailFrame** (priorita)
- Nemovitosti mají připravený state management v PropertiesTile
- Chybí komponenta `PropertyDetailFrame.tsx` (analog UnitDetailFrame)
- Po vytvoření propojit s PropertiesTile (view/edit/create mode)
- Přidat type selector tiles pro vytváření nemovitosti

### 2. **Tab Přílohy** (důležité)
- V detailu je potřeba záložka "Přílohy" (read-only zobrazení)
- V CommonActions je tlačítko "Přílohy" (📎) pro management
- Funkce: upload, verzování, editace (jako má subjekt)
- Týká se: UnitDetailFrame, PropertyDetailFrame

### 3. **EquipmentTile** (další modul)
- Vybavení jednotek (chladnička, sporák, nábytek...)
- Podobná struktura jako UnitsTile

---

## 🗂️ Struktura souborů

```
app/modules/040-nemovitost/
├── module.config.js          # Konfigurace modulu
├── tiles/
│   ├── PropertiesTile.tsx    # ✅ Seznam nemovitostí (state ready)
│   ├── PropertyTypeTile.tsx  # ✅ Wrapper pro filtr podle typu
│   ├── UnitsTile.tsx         # ✅ Seznam jednotek (full)
│   ├── UnitTypeTile.tsx      # ✅ Wrapper pro filtr podle typu
│   └── EquipmentTile.tsx     # ⏳ Vybavení (TODO)
├── components/
│   ├── UnitDetailFrame.tsx   # ✅ Detail jednotky (full)
│   └── PropertyDetailFrame.tsx # ❌ Neexistuje (TODO)
├── forms/
│   ├── PropertyDetailForm.ts # ✅ Form def (static config)
│   └── UnitDetailForm.tsx    # ✅ Form component (React)
└── services/
    ├── properties.ts         # ✅ CRUD properties
    └── units.ts              # ✅ CRUD units

app/lib/
├── colorUtils.ts             # ✅ getContrastTextColor, hexToRgba
└── services/
    ├── properties.ts         # ✅ listProperties, getDetail, save
    └── units.ts              # ✅ listUnits, getDetail, save

supabase/migrations/
└── 066_fix_units_type_ids.sql # ✅ Oprava unit_type_id v jednotkách
```

---

## 📊 Datový model

### generic_types (Centrální tabulka typů)
```sql
- category: 'property_types' | 'unit_types' | 'subject_types' | ...
- code: rodinny_dum, byt, garaz...
- name: Rodinný dům, Byt, Garáž...
- icon: 🏠, 🏢, 🚗 (emoji)
- color: #3498DB, #A564AD, #95AA56 (hex)
- order_index: integer (user-customizable)
- active: boolean
```

### properties (Nemovitosti)
```sql
- id: UUID
- landlord_id: → subjects(id)
- property_type_id: → generic_types(id)
- display_name, internal_code
- address fields (street, city, zip...)
- plochy (land_area, built_up_area, building_area)
- floors, build_year, reconstruction_year
- cadastral info (area, parcel, lv)
```

### units (Jednotky)
```sql
- id: UUID
- property_id: → properties(id)
- unit_type_id: → generic_types(id)
- display_name, internal_code
- address fields (může být jiná než property)
- floor, door_number
- area, rooms
- status (available/occupied/reserved/renovation)
```

---

## 🎨 UI Patterns

### Type Selector (Create Mode)
```tsx
// Když není vybraný typ, zobraz tiles
if (viewMode === 'create' && !selectedTypeForCreate) {
  return <TypeSelectorGrid types={types} onSelect={handleTypeSelect} />
}

// Po výběru typu otevři detail s předvyplněným typeId
handleTypeSelect(typeId) {
  setDetailUnit({ ...new, unitTypeId: typeId })
  setSelectedTypeForCreate(typeId)
}
```

### CommonActions Registration
```tsx
useEffect(() => {
  const actions: CommonActionId[] = []
  if (viewMode === 'list') {
    actions.push('add')
    if (selectedId) actions.push('view', 'edit')
    actions.push('columnSettings', 'close')
  } else if (viewMode === 'edit' || viewMode === 'create') {
    actions.push('save', 'attachments', 'close')
  } else if (viewMode === 'read') {
    actions.push('edit', 'close')
  }
  onRegisterCommonActions?.(actions)
}, [viewMode, selectedId])
```

### Barevný Badge
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

---

## 🔍 Kde hledat informace

### Dokumentace
- **Tento soubor:** Rychlý přehled pro nový chat
- **[IMPLEMENTATION-LOG.md](IMPLEMENTATION-LOG.md):** Detailní log implementace
- **[MODULE-PLAN.md](MODULE-PLAN.md):** Původní plán modulu
- **[docs/04-modules.md](../../04-modules.md):** Obecný systém modulů
- **[docs/03-ui-system.md](../../03-ui-system.md):** UI komponenty a 6-section layout

### Kód (referenční implementace)
- **UnitDetailFrame** - kompletní DetailFrame s type select
- **UnitsTile** - plně funkční tile s type selector a CommonActions
- **LandlordsTile** - referenční implementace CommonActions workflow
- **LandlordsDetailFrame** - referenční DetailFrame s type select

### Git
- **Poslední commit:** bff46fb (CommonActions state v PropertiesTile)
- **Branch:** feature/ai-spoluprace
- **Migrace:** 066_fix_units_type_ids.sql

---

## 💡 Tipy pro pokračování

### PropertyDetailFrame - jak vytvořit
1. **Zkopíruj** UnitDetailFrame.tsx → PropertyDetailFrame.tsx
2. **Přejmenuj** všechny reference (unit → property)
3. **Uprav typy:** UiUnit → UiProperty, UnitFormValue → PropertyFormValue
4. **Změň service:** getUnitDetail → getPropertyDetail, saveUnit → saveProperty
5. **Změň category:** 'unit_types' → 'property_types'
6. **Uprav systemBlocks:** property_type_id select místo unit_type_id
7. **Import** PropertyDetailForm (forms/PropertyDetailForm.ts už existuje)

### PropertiesTile - jak napojit DetailFrame
1. **Import** PropertyDetailFrame
2. **Přidej state:** `detailProperty` (similar to UnitsTile `detailUnit`)
3. **V handlers** (view/edit/save) pracuj s `detailProperty`
4. **V return** přidej podmínku pro viewMode !== 'list'
5. **Zkopíruj pattern** z UnitsTile (řádky 570-640)

### Tab Přílohy - jak přidat
1. **DetailView** podporuje `attachmentsContent` v ctx
2. **Studuj** jak to má subjekt (LandlordsDetailFrame)
3. **Přidej sekci** 'attachments' do sectionIds
4. **Vytvoř** AttachmentsTab komponentu (read-only list)
5. **Tlačítko 📎** otevře management modal (upload/edit)

---

## 🎯 Prioritizace

1. **PropertyDetailFrame** (vysoká) - PropertiesTile je neúplný bez něj
2. **Tab Přílohy** (vysoká) - potřebné u všech entit
3. **Type selector v PropertiesTile** (střední) - vylepšení UX
4. **EquipmentTile** (nízká) - nový submodul

---

## 📞 Jak komunikovat

**Správný způsob zadání:**
- ✅ "Vytvoř PropertyDetailFrame podle UnitDetailFrame"
- ✅ "Přidej tab Přílohy do UnitDetailFrame"
- ✅ "Implementuj type selector tiles v PropertiesTile"

**Špatný způsob:**
- ❌ "Dokonči modul nemovitostí" (příliš obecné)
- ❌ "Oprav detail" (není jasné co a kde)

---

## 🏁 Status Summary

| Komponenta | Status | Poznámka |
|------------|--------|----------|
| UnitsTile | ✅ Hotovo | Full, včetně type selector a CommonActions |
| UnitDetailFrame | ✅ Hotovo | Type select na Systém tabu, dirty tracking |
| PropertiesTile | 🟡 Částečné | State ready, chybí DetailFrame |
| PropertyDetailFrame | ❌ Neexistuje | Potřeba vytvořit |
| Tab Přílohy | ❌ Chybí | Tlačítko je placeholder |
| Type selector (Properties) | ❌ Chybí | Čeká na PropertyDetailFrame |
| EquipmentTile | ❌ TODO | Další fáze |

**Celkový progress modulu:** ~65% hotovo
