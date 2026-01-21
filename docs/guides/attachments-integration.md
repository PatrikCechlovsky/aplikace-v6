# Integrace systému příloh do modulu

Tento dokument popisuje jak přidat správu příloh do libovolného modulu.

## Přehled

**Univerzální komponenty** (4 soubory, ~1385 řádků) - již hotové:
- `app/UI/detail-sections/DetailAttachmentsSection.tsx` - hlavní komponenta
- `app/UI/attachments/AttachmentsManagerFrame.tsx` - wrapper
- `app/UI/attachments/AttachmentsManagerTile.tsx` - tile varianta
- `app/lib/attachments.ts` - služby pro práci se soubory

**Kód v modulu**: ~160 řádků v hlavním Tile souboru rozděleno do 9 bloků

## Implementace v modulu

### 1. State proměnné (3 položky)

```tsx
// ID entity pro attachments manager
const [attachmentsManager{Entity}Id, setAttachmentsManager{Entity}Id] = useState<string | null>(null)

// API reference pro volání metod
const attachmentsManagerApiRef = useRef<AttachmentsManagerApi | null>(null)

// UI state (mode, hasSelection, isDirty)
const [attachmentsManagerUi, setAttachmentsManagerUi] = useState<AttachmentsManagerUiState>({
  mode: 'list',
  hasSelection: false,
  isDirty: false,
})
```

**Příklady:**
- `UsersTile`: `attachmentsManagerSubjectId`
- `LandlordsTile`: `attachmentsManagerSubjectId`
- `PropertiesTile`: `attachmentsManagerPropertyId`
- `TenantsTile`: `attachmentsManagerTenantId`

### 2. ViewMode rozšíření

```tsx
type LocalViewMode = ViewMode | 'list' | 'attachments-manager'
```

### 3. Import typů

```tsx
import AttachmentsManagerTile from '@/app/UI/attachments/AttachmentsManagerTile'
import type { AttachmentsManagerApi, AttachmentsManagerUiState } from '@/app/UI/detail-sections/DetailAttachmentsSection'
```

### 4. Registrace CommonActions (useMemo)

```tsx
const commonActions = useMemo(() => {
  // ... existující logika pro list/read/edit/create

  if (viewMode === 'attachments-manager') {
    const mode = attachmentsManagerUi.mode ?? 'list'
    const hasSelection = !!attachmentsManagerUi.hasSelection
    
    if (mode === 'new') {
      return ['save', 'close']
    }
    if (mode === 'edit') {
      return ['save', 'attachmentsNewVersion', 'close']
    }
    if (mode === 'read') {
      return ['edit', 'attachmentsNewVersion', 'close']
    }
    // mode === 'list'
    const listActions: CommonActionId[] = ['add']
    if (hasSelection) {
      listActions.push('view', 'edit')
    }
    listActions.push('columnSettings', 'close')
    return listActions
  }

  // ... zbytek logiky
}, [viewMode, selectedId, detailActiveSectionId, attachmentsManagerUi.mode, attachmentsManagerUi.hasSelection])
```

### 5. Registrace state (useEffect)

```tsx
useEffect(() => {
  let mappedViewMode: ViewMode
  
  if (viewMode === 'attachments-manager') {
    // V attachments-manager mapujeme podle mode attachmentů
    const mode = attachmentsManagerUi.mode ?? 'list'
    if (mode === 'new') mappedViewMode = 'create'
    else if (mode === 'edit') mappedViewMode = 'edit'
    else if (mode === 'read') mappedViewMode = 'read'
    else mappedViewMode = 'list'
  } else {
    // Normální mapping pro entity detail
    mappedViewMode = viewMode === 'list' ? 'list' : viewMode === 'edit' ? 'edit' : viewMode === 'create' ? 'create' : 'read'
  }

  const mappedHasSelection = viewMode === 'attachments-manager' ? !!attachmentsManagerUi.hasSelection : !!selectedId
  const mappedIsDirty = viewMode === 'attachments-manager' ? !!attachmentsManagerUi.isDirty : !!isDirty

  onRegisterCommonActionsState?.({ viewMode: mappedViewMode, hasSelection: mappedHasSelection, isDirty: mappedIsDirty })
}, [onRegisterCommonActionsState, viewMode, selectedId, isDirty, attachmentsManagerUi.mode, attachmentsManagerUi.hasSelection, attachmentsManagerUi.isDirty])
```

### 6. Handler pro CommonActions

```tsx
const handler = async (actionId: CommonActionId) => {
  // ATTACHMENTS MANAGER ACTIONS
  if (viewMode === 'attachments-manager') {
    // Close má speciální handling (viz níže)
    if (actionId === 'close') {
      // propadne do společného CLOSE bloku
    } else {
      const api = attachmentsManagerApiRef.current
      if (!api) return
      
      if (actionId === 'add') {
        api.add()
        return
      }
      
      if (actionId === 'view') {
        api.view()
        return
      }
      
      if (actionId === 'edit') {
        api.edit()
        return
      }
      
      if (actionId === 'save') {
        await api.save()
        return
      }
      
      if (actionId === 'attachmentsNewVersion') {
        api.newVersion()
        return
      }
      
      if (actionId === 'columnSettings') {
        api.columnSettings()
        return
      }
      
      return
    }
  }

  // ... zbytek handleru pro normální entity akce
}
```

### 7. Close handler logika

```tsx
if (actionId === 'close') {
  const dirtyNow = viewMode === 'attachments-manager' ? !!attachmentsManagerUi.isDirty : isDirty
  if (dirtyNow) {
    const ok = confirm('Máš neuložené změny. Opravdu chceš zavřít?')
    if (!ok) return
  }

  if (viewMode === 'attachments-manager') {
    const mode = attachmentsManagerUi.mode ?? 'list'
    
    // V read/edit/new mode: zavřít submód a vrátit do list
    if (mode === 'read' || mode === 'edit' || mode === 'new') {
      logger.debug('close -> attachments-manager submodes -> list mode')
      const api = attachmentsManagerApiRef.current
      if (api?.close) {
        api.close()
      }
      return
    }
    
    // V list mode: zavřít celý manager a vrátit do entity detail
    logger.debug('close -> attachments-manager back to detail')
    setViewMode('read')
    setAttachmentsManager{Entity}Id(null)  // ⚠️ MODUL-SPECIFICKÉ
    return
  }
  
  // ... normální close logika
}
```

### 8. Handler pro otevření attachments

V read/edit režimu entity:

```tsx
// attachments v read režimu
if (id === 'attachments') {
  if (isDirty) {
    toast.showWarning('Máš neuložené změny. Nejdřív ulož nebo zavři změny a pak otevři správu příloh.')
    return
  }
  if (!detail{Entity}?.id || !detail{Entity}.id.trim() || detail{Entity}.id === 'new') {
    toast.showWarning('Nejdřív ulož záznam, aby šly spravovat přílohy.')
    return
  }

  setAttachmentsManager{Entity}Id(detail{Entity}.id)  // ⚠️ MODUL-SPECIFICKÉ
  setViewMode('attachments-manager')
  setIsDirty(false)
  return
}
```

V create/edit režimu entity (volitelné, pokud chceme povolit attachments i před uložením):

```tsx
// attachments v create/edit režimu
if ((id as string) === 'attachments') {
  if (isDirty) {
    toast.showWarning('Máš neuložené změny. Nejdřív ulož nebo zavři změny a pak otevři správu příloh.')
    return
  }
  if (!detail{Entity}?.id || !detail{Entity}.id.trim() || detail{Entity}.id === 'new') {
    toast.showWarning('Nejdřív ulož záznam, aby šly spravovat přílohy.')
    return
  }

  setAttachmentsManager{Entity}Id(detail{Entity}.id)
  setViewMode('attachments-manager')
  setIsDirty(false)
  return
}
```

### 9. Rendering AttachmentsManagerTile

```tsx
{viewMode === 'attachments-manager' && attachmentsManager{Entity}Id && (
  <AttachmentsManagerTile
    entityType="{entity_type}"  // ⚠️ MODUL-SPECIFICKÉ: 'subject', 'property', 'unit', 'tenant'
    entityId={attachmentsManager{Entity}Id}
    entityLabel={detail{Entity}?.{label_field} || '(bez názvu)'}  // ⚠️ MODUL-SPECIFICKÉ
    canManage={true}
    onRegisterManagerApi={(api) => { attachmentsManagerApiRef.current = api }}
    onManagerStateChange={setAttachmentsManagerUi}
  />
)}
```

## Modul-specifické hodnoty

Pro každý modul musíte nastavit:

| Modul | State název | entityType | entityLabel | Entity object |
|-------|-------------|------------|-------------|---------------|
| 010 Users | `attachmentsManagerSubjectId` | `'subject'` | `detailUser?.displayName` | `detailUser` |
| 030 Landlords | `attachmentsManagerSubjectId` | `'subject'` | `detailLandlord?.displayName` | `detailLandlord` |
| 040 Properties | `attachmentsManagerPropertyId` | `'property'` | `detailProperty?.name` | `detailProperty` |
| 050 Tenants | `attachmentsManagerTenantId` | `'tenant'` | `detailTenant?.displayName` | `detailTenant` |

## Checklist implementace

- [ ] Přidány 3 state proměnné
- [ ] Rozšířen LocalViewMode typ
- [ ] Importovány typy AttachmentsManagerApi a AttachmentsManagerUiState
- [ ] Přidána registrace CommonActions pro attachments-manager
- [ ] Přidána registrace state s mapováním viewMode
- [ ] Přidán handler pro attachments manager akce
- [ ] Přidán close handler s logikou pro submodes
- [ ] Přidán handler pro otevření attachments
- [ ] Přidán rendering AttachmentsManagerTile
- [ ] Nahrazeny všechny modul-specifické hodnoty
- [ ] Otestovány všechny scénáře (list, add, view, edit, save, new version, close)

## Testovací scénáře

1. **Seznam příloh**: Otevřít detail entity → kliknout na 📎 Přílohy
2. **Výběr řádku**: Kliknout na řádek → zobrazí se tlačítka Číst/Upravit
3. **Čtení**: Dvojklik nebo tlačítko Číst → otevře read mode → Zavřít vrátí do seznamu
4. **Úprava**: Tlačítko Upravit → upravit název/popis → Uložit → Zavřít vrátí do seznamu
5. **Nová verze**: V read/edit módu tlačítko Nová verze → vybrat soubor → nahraje se
6. **Přidat přílohu**: Tlačítko + → vyplnit údaje a vybrat soubor → Uložit → zobrazí se v seznamu
7. **Zavřít panel**: V new módu kliknout Zavřít → zavře jen panel, ne celý seznam
8. **Zavřít seznam**: V list módu kliknout Zavřít → vrátí se do detailu entity
9. **Neuložené změny**: Upravit název → kliknout Zavřít → potvrzení ztráty změn

## Reference implementace

- **Kompletní příklad**: `app/modules/010-sprava-uzivatelu/tiles/UsersTile.tsx`
- **Jednodušší příklad**: `app/modules/030-pronajimatel/tiles/LandlordsTile.tsx`
- **S type assertion**: `app/modules/040-nemovitost/tiles/PropertiesTile.tsx` (pro Vercel cache workaround)
