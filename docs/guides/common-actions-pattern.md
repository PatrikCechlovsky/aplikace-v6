# CommonActions Pattern - Jednotné chování napříč aplikací

## Přehled

Tento dokument definuje **standardní pattern** pro zobrazování akcí v CommonActions toolbar pro všechny moduly v aplikaci. Cílem je zajistit konzistentní UX napříč celou aplikací.

---

## 📋 Pattern pro List Mode (Seznam)

### Základní struktura

Když je viewMode === 'list', CommonActions toolbar zobrazuje akce v tomto pořadí:

```typescript
if (viewMode === 'list') {
  actions.push('add')  // 1. Přidat - vždy viditelný
  if (selectedId) {
    actions.push('view', 'edit', 'attachments')  // 2. Akce pro vybraný řádek
  }
  actions.push('columnSettings', 'close')  // 3. Globální akce - vždy viditelné
}
```

### Vysvětlení akcí

1. **'add'** - Přidat nový záznam
   - Vždy viditelný
   - Naviguje na create tile nebo otevře create form

2. **'view', 'edit', 'attachments'** - Akce pro vybraný řádek
   - Zobrazí se **pouze když je vybrán řádek** v seznamu (`selectedId !== null`)
   - 'view' (📖) - Otevře detail v read mode
   - 'edit' (✏️) - Otevře detail v edit mode
   - 'attachments' (📎) - Otevře attachments manager pro danou entitu

3. **'columnSettings'** - Nastavení sloupců
   - Vždy viditelný
   - Otevře drawer pro úpravu viditelnosti, pořadí a šířky sloupců

4. **'close'** - Zavřít (❌)
   - Vždy viditelný
   - Naviguje zpět na homepage

### Vizuální reprezentace

**Bez vybraného řádku:**
```
[+ Přidat] [⚙️ Sloupce] [❌ Zavřít]
```

**S vybraným řádkem:**
```
[+ Přidat] [📖 Číst] [✏️ Upravit] [📎 Přílohy] [⚙️ Sloupce] [❌ Zavřít]
```

---

## 📖 Pattern pro Read Mode (Detail - čtení)

```typescript
if (viewMode === 'read') {
  actions.push('edit', 'attachments', 'close')
}
```

- **'edit'** - Přepne do edit mode
- **'attachments'** - Otevře attachments manager
- **'close'** - Zavře detail, vrátí se do seznamu

---

## ✏️ Pattern pro Edit Mode (Detail - úprava)

```typescript
if (viewMode === 'edit') {
  actions.push('save', 'attachments', 'close')
}
```

- **'save'** - Uloží změny
- **'attachments'** - Otevře attachments manager (pokud entita již existuje)
- **'close'** - Zavře detail (s potvrzením pokud jsou neuložené změny)

---

## ➕ Pattern pro Create Mode (Nový záznam)

```typescript
if (viewMode === 'create') {
  actions.push('save', 'close')
}
```

- **'save'** - Uloží nový záznam
- **'close'** - Zavře formulář (s potvrzením pokud jsou neuložená data)
- **Bez 'attachments'** - Nový záznam nemá přílohy dokud není uložen

---

## 📎 Pattern pro Attachments Manager Mode

```typescript
if (viewMode === 'attachments-manager') {
  const mode = attachmentsManagerUi.mode ?? 'list'
  
  if (mode === 'list') {
    actions.push('add', 'view', 'edit', 'attachmentsNewVersion', 'columnSettings', 'close')
  } else if (mode === 'new') {
    actions.push('save', 'close')
  } else if (mode === 'read') {
    actions.push('edit', 'attachmentsNewVersion', 'close')
  } else if (mode === 'edit') {
    actions.push('save', 'close')
  }
}
```

### Attachments Manager akce

- **'add'** - Přidat novou přílohu
- **'view'** - Zobrazit detail vybrané přílohy
- **'edit'** - Upravit metadata vybrané přílohy
- **'attachmentsNewVersion'** - Nahrát novou verzi vybraného dokumentu
- **'save'** - Uložit změny (v edit/new mode)
- **'columnSettings'** - Nastavení sloupců seznamu příloh
- **'close'** - Zavřít (v list mode → vrátí se do entity detail, v read/edit mode → vrátí se do list mode)

---

## 🎯 Implementované moduly

Tento pattern je implementován v následujících modulech:

| Modul | Tile | Entity Type | Status |
|-------|------|-------------|--------|
| 010 | UsersTile | subjects (users) | ✅ |
| 030 | LandlordsTile | landlords (subjects) | ✅ |
| 040 | PropertiesTile | properties | ✅ |
| 040 | UnitsTile | units | ✅ |
| 050 | TenantsTile | tenants (subjects) | ✅ |

---

## 💡 Klíčové principy

### 1. Konzistence
Stejné akce musí mít **stejné chování** ve všech modulech.

### 2. Předvídatelnost
Uživatel by měl vědět, které akce se zobrazí na základě kontextu (vybraný řádek, mód zobrazení).

### 3. Progresivní zjevení (Progressive Disclosure)
Akce specifické pro konkrétní záznam se zobrazí až po jeho výběru.

### 4. Pořadí akcí
Akce jsou vždy seřazeny v logickém pořadí:
- Vytvoření (`add`)
- Čtení (`view`)
- Úprava (`edit`, `save`)
- Správa příloh (`attachments`)
- Nastavení (`columnSettings`)
- Zavření (`close`)

---

## 🔧 Implementace v novém modulu

### Krok 1: Definice LocalViewMode
```typescript
type LocalViewMode = ViewMode | 'list' | 'attachments-manager'
```

### Krok 2: State pro attachments manager
```typescript
const [attachmentsManagerEntityId, setAttachmentsManagerEntityId] = useState<string | null>(null)
const attachmentsManagerApiRef = useRef<AttachmentsManagerApi | null>(null)
const [attachmentsManagerUi, setAttachmentsManagerUi] = useState<AttachmentsManagerUiState>({
  hasSelection: false,
  isDirty: false,
  mode: 'list',
})
```

### Krok 3: CommonActions useEffect
```typescript
useEffect(() => {
  const actions: CommonActionId[] = []
  if (viewMode === 'list') {
    actions.push('add')
    if (selectedId) {
      actions.push('view', 'edit', 'attachments')
    }
    actions.push('columnSettings', 'close')
  } else if (viewMode === 'edit' || viewMode === 'create') {
    if (viewMode === 'edit') {
      actions.push('save', 'attachments', 'close')
    } else {
      actions.push('save', 'close')
    }
  } else if (viewMode === 'read') {
    actions.push('edit', 'attachments', 'close')
  } else if (viewMode === 'attachments-manager') {
    // ... (viz Attachments Manager Pattern výše)
  }

  onRegisterCommonActions?.(actions)
  onRegisterCommonActionsState?.({
    viewMode: viewMode === 'attachments-manager' ? 'read' : viewMode,
    hasSelection: viewMode === 'attachments-manager' ? attachmentsManagerUi.hasSelection : !!selectedId,
    isDirty: viewMode === 'attachments-manager' ? attachmentsManagerUi.isDirty : isDirty,
  })
}, [viewMode, selectedId, isDirty, attachmentsManagerUi, onRegisterCommonActions, onRegisterCommonActionsState])
```

### Krok 4: Handler pro attachments
```typescript
// ATTACHMENTS open manager
if (id === 'attachments') {
  if (viewMode === 'list') {
    if (!selectedId) {
      toast.showWarning('Nejdřív vyber záznam v seznamu.')
      return
    }
    setAttachmentsManagerEntityId(selectedId)
    setViewMode('attachments-manager')
    setIsDirty(false)
    setUrl({ t: 'your-list', id: selectedId, vm: null }, 'push')
    return
  }

  // READ / EDIT mode
  if (viewMode === 'read' || viewMode === 'edit') {
    if (isDirty) {
      toast.showWarning('Máš neuložené změny. Nejdřív ulož nebo zavři změny a pak otevři správu příloh.')
      return
    }
    if (!detailEntity?.id || !detailEntity.id.trim() || detailEntity.id === 'new') {
      toast.showWarning('Nejdřív ulož záznam, aby šly spravovat přílohy.')
      return
    }

    setAttachmentsManagerEntityId(detailEntity.id)
    setViewMode('attachments-manager')
    setIsDirty(false)
    setUrl({ t: 'your-list', id: detailEntity.id, vm: null }, 'push')
    return
  }
  return
}
```

### Krok 5: Render AttachmentsManagerFrame
```typescript
// ATTACHMENTS MANAGER MODE
if (viewMode === 'attachments-manager') {
  const entityId = attachmentsManagerEntityId
  if (!entityId) {
    return <div>Chyba: Není vybrána entita.</div>
  }

  const entity = entities.find((e) => e.id === entityId) ?? detailEntity
  const entityLabel = entity?.displayName || 'entity'

  return (
    <AttachmentsManagerFrame
      entityType="your_entity_type"
      entityId={entityId}
      entityLabel={entityLabel}
      onRegisterManagerApi={(api) => {
        attachmentsManagerApiRef.current = api
      }}
      onManagerStateChange={(state) => {
        setAttachmentsManagerUi(state)
      }}
    />
  )
}
```

---

## 📚 Související dokumentace

- [docs/03-ui-system.md](../03-ui-system.md) - UI komponenty a layout
- [docs/04-modules.md](../04-modules.md) - Struktura modulů
- [app/UI/CommonActions.tsx](../../app/UI/CommonActions.tsx) - CommonActions komponenta
- [app/UI/attachments/AttachmentsManagerFrame.tsx](../../app/UI/attachments/AttachmentsManagerFrame.tsx) - Attachments manager

---

## ✅ Checklist pro review

Při kontrole implementace v novém modulu ověř:

- [ ] List mode: 'add' vždy viditelný
- [ ] List mode: 'view', 'edit', 'attachments' pouze když je selectedId
- [ ] List mode: 'columnSettings', 'close' vždy viditelné
- [ ] Edit mode: obsahuje 'attachments' (ne v create mode)
- [ ] Read mode: obsahuje 'attachments'
- [ ] Handler pro attachments správně kontroluje isDirty
- [ ] Handler pro attachments správně kontroluje 'new' id
- [ ] AttachmentsManagerFrame má správný entityType
- [ ] Close v attachments manager se vrací do detail na attachments tab
- [ ] Všechny ViewModes mají správné actions

---

Verze: 1.0  
Datum: 21. ledna 2026  
Autor: AI + Patrik Čechlovský
