'use client'

/**
 * FILE: app/UI/CommonActions.tsx
 *
 * PURPOSE:
 * Centrální komponenta pro kontextové akce aplikace (CommonActions).
 *
 * - Definuje VŠECHNY podporované akce (tlačítka)
 * - Obsahuje VÝCHOZÍ FUNKCE (handlery) ke každé akci
 * - Řeší jednotné UI + disabled logiku (selection, dirty, readonly)
 *
 * Pravidla:
 * 1) Akce se NIKDY nedefinují ve formu ani v tile
 * 2) Tile / modul pouze VYBÍRÁ akce (např. ['add','edit'])
 * 3) Přidání nové akce MUSÍ mít:
 *    - definici
 *    - handler (jinak TypeScript failne build)
 */

import { getIcon } from './icons'

/* ============================================================================
 * 1) ID všech podporovaných akcí
 * ========================================================================== */

export type CommonActionId =
  | 'add'
  | 'edit'
  | 'view'
  | 'duplicate'
  | 'attach'
  | 'archive'
  | 'delete'
  | 'save'
  | 'saveAndClose'
  | 'cancel'
  | 'invite'
  | 'columnSettings'
  | 'import'
  | 'export'
  | 'reject'

/* ============================================================================
 * 2) Definice jedné akce (UI + podmínky)
 * ========================================================================== */

type CommonActionDefinition = {
  id: CommonActionId
  label: string
  icon: string
  requiresSelection?: boolean
  requiresDirty?: boolean
}

/* ============================================================================
 * 3) Centrální slovník definic akcí
 *    (UI vlastnosti + podmínky dostupnosti)
 * ========================================================================== */

const COMMON_ACTION_DEFS: Record<CommonActionId, CommonActionDefinition> =
  {
    add: {
      id: 'add',
      label: 'Přidat',
      icon: 'add',
    },
    edit: {
      id: 'edit',
      label: 'Upravit',
      icon: 'edit',
      requiresSelection: true,
    },
    view: {
      id: 'view',
      label: 'Zobrazit',
      icon: 'view',
      requiresSelection: true,
    },
    duplicate: {
      id: 'duplicate',
      label: 'Duplikovat',
      icon: 'duplicate',
      requiresSelection: true,
    },
    attach: {
      id: 'attach',
      label: 'Připojit',
      icon: 'attach',
      requiresSelection: true,
    },
    archive: {
      id: 'archive',
      label: 'Archivovat',
      icon: 'archive',
      requiresSelection: true,
    },
    delete: {
      id: 'delete',
      label: 'Smazat',
      icon: 'delete',
      requiresSelection: true,
    },
    save: {
      id: 'save',
      label: 'Uložit',
      icon: 'save',
      requiresDirty: true,
    },
    saveAndClose: {
      id: 'saveAndClose',
      label: 'Uložit a zavřít',
      icon: 'save',
      requiresDirty: true,
    },
    cancel: {
      id: 'cancel',
      label: 'Zrušit',
      icon: 'cancel',
    },
    invite: {
      id: 'invite',
      label: 'Pozvat',
      icon: 'invite',
    },
    columnSettings: {
      id: 'columnSettings',
      label: 'Sloupce',
      icon: 'settings',
    },
    import: {
      id: 'import',
      label: 'Import',
      icon: 'import',
    },
    export: {
      id: 'export',
      label: 'Export',
      icon: 'export',
    },
    reject: {
      id: 'reject',
      label: 'Zamítnout',
      icon: 'cancel',
      requiresSelection: true,
    },
  }

/* ============================================================================
 * 4) Kontext, který dostávají handlery
 * ========================================================================== */

export type CommonActionContext = {
  setMode: (mode: 'list' | 'read' | 'edit' | 'create') => void
  setActiveId: (id: string | null) => void
  activeId?: string | null
}

/* ============================================================================
 * 5) Centrální HANDLERY pro všechny akce
 *    ⚠️ PŘIDÁNÍ NOVÉ AKCE BEZ HANDLERU = TS ERROR
 * ========================================================================== */

const COMMON_ACTION_HANDLERS: Record<
  CommonActionId,
  (ctx: CommonActionContext) => void
> = {
  add: ({ setMode, setActiveId }) => {
    setActiveId(null)
    setMode('create')
  },

  view: ({ setMode }) => {
    setMode('read')
  },

  edit: ({ setMode }) => {
    setMode('edit')
  },

  cancel: ({ setMode, activeId }) => {
    setMode(activeId ? 'read' : 'list')
  },

  save: () => {
    // skutečné uložení řeší EntityDetailFrame / form manager
  },

  saveAndClose: () => {
    // uložit + návrat do listu / detailu
  },

  delete: () => {},
  duplicate: () => {},
  attach: () => {},
  archive: () => {},
  invite: () => {},
  columnSettings: () => {},
  import: () => {},
  export: () => {},
  reject: () => {},
}

/* ============================================================================
 * 6) Props komponenty
 * ========================================================================== */

type Props = {
  actions?: CommonActionId[]
  disabled?: boolean
  hasSelection?: boolean
  isDirty?: boolean
  ctx?: CommonActionContext
}

/* ============================================================================
 * 7) Hlavní komponenta CommonActions (UI only)
 * ========================================================================== */

export default function CommonActions({
  actions,
  disabled = false,
  hasSelection = false,
  isDirty = false,
  ctx,
}: Props) {
  if (!actions || actions.length === 0) return null

  return (
    <div className="common-actions" aria-label="Společné akce">
      {actions.map((id) => {
        const def = COMMON_ACTION_DEFS[id]

        const isDisabled =
          disabled ||
          (def.requiresSelection && !hasSelection) ||
          (def.requiresDirty && !isDirty)

        return (
          <button
            key={id}
            type="button"
            className="common-actions__btn"
            disabled={isDisabled}
            title={def.label}
            onClick={() => {
              if (isDisabled) return
              COMMON_ACTION_HANDLERS[id](ctx as CommonActionContext)
            }}
          >
            <span className="common-actions__icon" aria-hidden="true">
              {getIcon(def.icon as any)}
            </span>
            <span className="common-actions__label">{def.label}</span>
          </button>
        )
      })}
    </div>
  )
}
