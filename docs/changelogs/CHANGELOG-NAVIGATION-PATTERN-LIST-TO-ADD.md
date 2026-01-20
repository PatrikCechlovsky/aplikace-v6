# 📝 CHANGELOG: Navigation Pattern List→Add (onNavigate callback)

**Datum:** 20.1.2026  
**Commity:** 2b892f1, 275b4a9  
**Moduly:** 030 Pronajímatelé, 050 Nájemníci  

---

## 1️⃣ Přehled změn

### Problém
- Tlačítko **+ (Přidat)** v list view otevíralo lokální create mode (40+ řádků duplicitního kódu)
- Při přechodu na create tile zůstávaly otevřené filtry v Sidebaru (UI nepřehlednost)
- Těžká údržba – každý list tile měl vlastní create logiku
- Nekonzistentní chování napříč moduly

### Řešení
Implementace **callback pattern** pro navigaci mezi tiles:
1. **AppShell** předává všem tiles callback `onNavigate(tileId: string)`
2. List tile volá `onNavigate('create-xxx')` místo lokálního create mode
3. Při navigaci se automaticky zavírají Sidebar přehledy (clean UX)
4. Odstranění 40+ řádků duplicitního kódu z každého list tile

---

## 2️⃣ Implementované změny

### A) AppShell.tsx (řídící vrstva)

**Přidán onNavigate callback do TileComponent props:**

```tsx
<TileComponent
  key={`${selection.tileId}-${tileRenderKey}`}
  onRegisterCommonActions={registerCommonActions}
  onRegisterCommonActionsState={registerCommonActionsUi}
  onRegisterCommonActionHandler={registerCommonActionHandler}
  onNavigate={(tileId: string) => {
    // Naviguj na jiný tile v rámci stejného modulu
    handleModuleSelect({ moduleId: selection.moduleId, tileId })
    // ✅ Zavři Sidebar přehledy (sbalit modul) při navigaci
    // URL update už proběhl v handleModuleSelect, Sidebar se syncne
  }}
/>
```

**Chování:**
- Callback volá `handleModuleSelect` → standardní navigace
- Sidebar se automaticky synchronizuje s URL
- Force remount mechanismus funguje korektně

---

### B) LandlordsTile.tsx (modul 030)

**1. Přidán onNavigate do interface:**

```typescript
type LandlordsTileProps = {
  subjectTypeFilter?: string | null
  onRegisterCommonActions?: (actions: CommonActionId[]) => void
  onRegisterCommonActionsState?: (state: { viewMode: ViewMode; hasSelection: boolean; isDirty: boolean }) => void
  onRegisterCommonActionHandler?: (fn: (id: CommonActionId) => void) => void
  onNavigate?: (tileId: string) => void // ✅ NOVÉ
}
```

**2. Přidán do destructuringu:**

```typescript
export default function LandlordsTile({
  subjectTypeFilter: propSubjectTypeFilter,
  onRegisterCommonActions,
  onRegisterCommonActionsState,
  onRegisterCommonActionHandler,
  onNavigate, // ✅ NOVÉ
}: LandlordsTileProps) {
```

**3. Zjednodušen add handler:**

**PŘED (40+ řádků):**
```typescript
if (id === 'add') {
  if (viewMode === 'list') {
    setSelectedSubjectTypeForCreate(null)
    const newLandlord: DetailUiLandlord = {
      id: 'new',
      displayName: '',
      email: null,
      phone: null,
      subjectType: null,
      isArchived: false,
      // ... dalších 20+ vlastností
    }
    setDetailLandlord(newLandlord)
    setViewMode('create')
    setSelectedId('new')
    setIsDirty(false)
    setUrl({ t: 'landlords-list', id: 'new', vm: 'create' }, 'push')
    return
  }
}
```

**PO (3 řádky):**
```typescript
if (id === 'add') {
  onNavigate?.('create-landlord')
  return
}
```

---

### C) TenantsTile.tsx (modul 050)

Stejná změna jako u LandlordsTile:

**1. Interface:** + `onNavigate?: (tileId: string) => void`

**2. Destructuring:** + `onNavigate`

**3. Add handler:**
```typescript
if (id === 'add') {
  onNavigate?.('create-tenant')
  return
}
```

**Výsledek:**
- Odstraněno 40+ řádků duplicitního create kódu
- Navigace na `create-tenant` tile
- Čistá separace list/create concerns

---

## 3️⃣ UX Flow

### Před změnou:
1. Uživatel v seznamu pronajímatelů/nájemníků
2. Klik na **+ (Přidat)**
3. List view přepne do create mode (zmizí seznam, zobrazí formulář)
4. Sidebar zůstává otevřený s filtry (osoba, OSVČ, firma...)
5. UI zahlcené otevřenými sekcemi

### Po změně:
1. Uživatel v seznamu pronajímatelů/nájemníků
2. Klik na **+ (Přidat)**
3. ✅ Zavře se list tile (včetně Sidebar filtrů)
4. ✅ Otevře se create tile "Přidat pronajímatele/nájemníka"
5. ✅ Čistá obrazovka bez otevřených filtrů
6. ✅ Jasná separace: seznam × přidání

---

## 4️⃣ Technické detaily

### Callback flow:
```
TenantsTile (add button clicked)
  ↓
onNavigate?.('create-tenant')
  ↓
AppShell onNavigate callback
  ↓
handleModuleSelect({ moduleId: '050-najemnik', tileId: 'create-tenant' })
  ↓
URL update: /?m=050-najemnik&t=create-tenant
  ↓
Sidebar sync (zavření children)
  ↓
TileComponent remount s create-tenant tile
```

### Sidebar synchronizace:
- Sidebar se řídí podle URL parametrů `m`, `s`, `t`
- `handleModuleSelect` aktualizuje URL
- Sidebar v `useEffect` detekuje změnu → sbalí children
- Výsledek: čistá navigace bez otevřených filtrů

### Force remount:
- `tileRenderKey` counter zajišťuje remount při stejném tile
- CommonActions se znovu zaregistrují
- Žádné "zmizení" action buttonů

---

## 5️⃣ Výhody pattern

### ✅ Kód
- **-80+ řádků** duplicitního create kódu (2× 40 řádků)
- Jednodušší údržba
- Konzistentní napříč moduly
- TypeScript type safety

### ✅ UX
- Čistá navigace list → create
- Automatické zavření Sidebar filtrů
- Jasná separace UI stavů
- Předvídatelné chování

### ✅ Architektura
- Tiles mohou navigovat na jiné tiles
- Centrální navigační logika v AppShell
- Callback pattern → testovatelnost
- Připraveno pro budoucí použití (refresh, edit navigace...)

---

## 6️⃣ Aplikované moduly

| Modul | Tile | Create Tile | Status |
|-------|------|-------------|--------|
| 030 Pronajímatelé | `landlords-list` | `create-landlord` | ✅ Hotovo |
| 050 Nájemníci | `tenants-list` | `create-tenant` | ✅ Hotovo |
| 040 Nemovitosti | `properties-list` | `create-property` | ⏳ Připraveno |
| 060 Smlouvy | `contracts-list` | `create-contract` | ⏳ Připraveno |

---

## 7️⃣ Návod pro implementaci v dalších modulech

### Krok 1: Přidej onNavigate do interface
```typescript
type YourTileProps = {
  // ... existing props
  onNavigate?: (tileId: string) => void
}
```

### Krok 2: Přidej do destructuringu
```typescript
export default function YourTile({
  // ... existing params
  onNavigate,
}: YourTileProps) {
```

### Krok 3: Uprav add handler
```typescript
// STARÝ KÓD (smazat):
if (id === 'add') {
  const newEntity = { id: 'new', ... }
  setDetailEntity(newEntity)
  setViewMode('create')
  setUrl({ id: 'new', vm: 'create' }, 'push')
  return
}

// NOVÝ KÓD:
if (id === 'add') {
  onNavigate?.('create-entity-name')
  return
}
```

### Krok 4: Ověř module.config.js
Zkontroluj, že create tile existuje:
```javascript
tiles: [
  {
    id: 'entities-list',
    label: 'Přehled',
    component: EntitiesTile,
  },
  {
    id: 'create-entity', // ✅ Musí existovat
    label: 'Přidat',
    component: CreateEntityTile,
  },
]
```

---

## 8️⃣ Testing

### Test 1: Navigace list → create
1. Otevři modul (např. Pronajímatelé)
2. Klikni "Přehled pronajímatelů" → zobrazí seznam + filtry v Sidebaru
3. Klikni **+ (Přidat)**
4. ✅ Seznam se zavře
5. ✅ Sidebar filtry se zavřou
6. ✅ Otevře se "Přidat pronajímatele"
7. ✅ CommonActions zůstávají viditelné

### Test 2: URL state
1. Po navigaci zkontroluj URL: `/?m=030-pronajimatel&t=create-landlord`
2. Refresh stránky
3. ✅ Otevře se přímo create tile (bez otevřených filtrů)

### Test 3: CommonActions persistence
1. V seznamu klikni **+ (Přidat)**
2. ✅ CommonActions zůstávají viditelné během navigace
3. ✅ Žádné "blikání" nebo zmizení action buttonů

### Test 4: Zpět na seznam
1. Z create tile klikni zpět na "Přehled pronajímatelů"
2. ✅ Seznam se zobrazí
3. ✅ Filtry se znovu načtou (počty)

---

## 9️⃣ Edge Cases

### ⚠️ onNavigate není definováno
- Použití optional chaining: `onNavigate?.('tile-id')`
- Graceful fallback – nic se nestane (legacy kompatibilita)

### ⚠️ Neexistující target tile
- `handleModuleSelect` nenajde tile → zobrazí error (console.error)
- UI zůstane stabilní

### ⚠️ Dirty state při navigaci
- `handleModuleSelect` volá `confirmIfDirty()`
- Pokud jsou neuložené změny → dialog potvrzení
- Uživatel může zrušit navigaci

---

## 🔟 Další kroky

### PRIORITY 1: Aplikovat pattern na zbývající moduly
- [ ] **040 Nemovitosti** - PropertiesTile → create-property
- [ ] **060 Smlouvy** - ContractsTile → create-contract
- [ ] **070 Služby** - ServicesTile → create-service
- [ ] **080 Platby** - PaymentsTile → create-payment

### PRIORITY 2: Rozšíření pattern
- [ ] onNavigate pro **edit navigaci** (list → detail edit mode)
- [ ] onNavigate pro **related entities** (property → units)
- [ ] onNavigate s parametry: `onNavigate(tileId, params)`

### PRIORITY 3: Clean up
- [ ] Odstranit debug `console.log` z AppShell.tsx
- [ ] Review všech list tiles (jednotný pattern)
- [ ] Update TypeScript types (centrální interface)

---

## 📚 Odkazy

### Dokumentace
- [03-ui-system.md](../03-ui-system.md) - UI systém a komponenty
- [04-modules.md](../04-modules.md) - Modulový systém
- [AppShell.tsx](../../app/AppShell.tsx) - Implementace onNavigate

### Příklady
- [LandlordsTile.tsx](../../app/modules/030-pronajimatel/tiles/LandlordsTile.tsx)
- [TenantsTile.tsx](../../app/modules/050-najemnik/tiles/TenantsTile.tsx)

### Commity
- `2b892f1` - feat: tlačítko Přidat naviguje na create-landlord tile
- `275b4a9` - feat: tlačítko Přidat naviguje na create-tenant tile + zavírá Sidebar přehledy

---

**Status:** ✅ Implementováno a otestováno  
**Autor:** AI + Patrik Čechlovský  
**Review:** Nutné otestovat v produkci po merge do main
