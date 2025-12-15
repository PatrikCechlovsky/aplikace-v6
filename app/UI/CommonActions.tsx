'use client'

/**
 * FILE: app/UI/CommonActions.tsx
 *
 * PURPOSE:
 * CommonActions = jednotný UI řádek akcí.
 *
 * KLÍČOVÁ PRAVIDLA (v6):
 * 1) Pořadí tlačítek určuje vždy modul/tile/form → CommonActions nic nepřerovnává.
 * 2) Existuje JEDEN centrální registr tlačítek (ikona, CZ/EN label, popis, pravidla).
 * 3) CommonActions při renderu vyhodnocuje viditelnost/disabled dle:
 *    - viewMode (list/read/edit/create)
 *    - selection/dirty
 *    - role/permission
 * 4) CommonActions neobsahuje business logiku (žádné interní handlery).
 *    Klik deleguje ven přes onActionClick.
 */

import { getIcon } from './icons'

export type CommonActionId =
  | 'add'
  | 'detail'
  | 'view'
  | 'edit'
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

export type ViewMode = 'list' | 'read' | 'edit' | 'create'
export type Locale = 'cs' | 'en'

export type CommonActionsUiState = {
  viewMode: ViewMode
  hasSelection?: boolean
  isDirty?: boolean
}

export type CommonActionsAuth = {
  roles?: string[]
  permissions?: string[]
}

type CommonActionDefinition = {
  id: CommonActionId
  icon: string
  label: { cs: string; en: string }
  description?: { cs?: string; en?: string }
  requiresSelection?: boolean
  requiresDirty?: boolean
  requiresAnyRole?: string[]
  requiresAllPermissions?: string[]
  hideWhen?: ViewMode[]
}

const COMMON_ACTION_DEFS: Record<CommonActionId, CommonActionDefinition> = {
  add: {
    id: 'add',
    icon: 'add',
    label: { cs: 'Přidat', en: 'Add' },
    description: { cs: 'Vytvořit nový záznam.', en: 'Create a new record.' },
    hideWhen: ['edit'],
  },

  detail: {
    id: 'detail',
    icon: 'view',
    label: { cs: 'Detail', en: 'Detail' },
    description: { cs: 'Zobrazit detail záznamu.', en: 'Open record detail.' },
    requiresSelection: true,
    hideWhen: ['read'],
  },

  view: {
    id: 'view',
    icon: 'view',
    label: { cs: 'Detail', en: 'Detail' },
    description: { cs: 'Zobrazit detail záznamu.', en: 'Open record detail.' },
    requiresSelection: true,
    hideWhen: ['read'],
  },

  edit: {
    id: 'edit',
    icon: 'edit',
    label: { cs: 'Upravit', en: 'Edit' },
    description: { cs: 'Přejít do editace.', en: 'Switch to edit mode.' },
    requiresSelection: true,
    hideWhen: ['edit', 'create'],
  },

  save: {
    id: 'save',
    icon: 'save',
    label: { cs: 'Uložit', en: 'Save' },
    description: { cs: 'Uložit změny.', en: 'Save changes.' },
    requiresDirty: true,
    hideWhen: ['list', 'read'],
  },

  saveAndClose: {
    id: 'saveAndClose',
    icon: 'save',
    label: { cs: 'Uložit a zavřít', en: 'Save & close' },
    description: {
      cs: 'Uložit změny a vrátit se zpět do čtení/listu.',
      en: 'Save changes and return to read/list.',
    },
    requiresDirty: true,
    hideWhen: ['list', 'read'],
  },

  cancel: {
    id: 'cancel',
    icon: 'cancel',
    label: { cs: 'Zrušit', en: 'Cancel' },
    description: { cs: 'Zrušit editaci / vytvoření.', en: 'Cancel edit / create.' },
    hideWhen: ['list'],
  },

  delete: {
    id: 'delete',
    icon: 'delete',
    label: { cs: 'Smazat', en: 'Delete' },
    description: { cs: 'Smazat vybraný záznam.', en: 'Delete selected record.' },
    requiresSelection: true,
  },

  duplicate: {
    id: 'duplicate',
    icon: 'duplicate',
    label: { cs: 'Duplikovat', en: 'Duplicate' },
    description: { cs: 'Vytvořit kopii vybraného záznamu.', en: 'Create a copy of the selected record.' },
    requiresSelection: true,
  },

  attach: {
    id: 'attach',
    icon: 'attach',
    label: { cs: 'Připojit', en: 'Attach' },
    description: { cs: 'Připojit soubor nebo dokument.', en: 'Attach a file or document.' },
    requiresSelection: true,
  },

  archive: {
    id: 'archive',
    icon: 'archive',
    label: { cs: 'Archivovat', en: 'Archive' },
    description: { cs: 'Archivovat vybraný záznam.', en: 'Archive selected record.' },
    requiresSelection: true,
  },

  invite: {
    id: 'invite',
    icon: 'invite',
    label: { cs: 'Pozvat', en: 'Invite' },
    description: { cs: 'Odeslat pozvánku.', en: 'Send an invitation.' },
  },

  columnSettings: {
    id: 'columnSettings',
    icon: 'settings',
    label: { cs: 'Sloupce', en: 'Columns' },
    description: { cs: 'Nastavení zobrazených sloupců.', en: 'Configure visible columns.' },
    hideWhen: ['edit', 'create'],
  },

  import: {
    id: 'import',
    icon: 'import',
    label: { cs: 'Import', en: 'Import' },
    description: { cs: 'Importovat data.', en: 'Import data.' },
    hideWhen: ['edit', 'create'],
  },

  export: {
    id: 'export',
    icon: 'export',
    label: { cs: 'Export', en: 'Export' },
    description: { cs: 'Exportovat data.', en: 'Export data.' },
    hideWhen: ['edit', 'create'],
  },

  reject: {
    id: 'reject',
    icon: 'cancel',
    label: { cs: 'Zamítnout', en: 'Reject' },
    description: { cs: 'Zamítnout vybraný záznam.', en: 'Reject selected record.' },
    requiresSelection: true,
  },
}

type Props = {
  actions?: CommonActionId[]
  ui: CommonActionsUiState
  disabled?: boolean
  locale?: Locale
  auth?: CommonActionsAuth
  onActionClick: (id: CommonActionId) => void
}

function hasAnyRole(auth: CommonActionsAuth | undefined, roles: string[] | undefined) {
  if (!roles || roles.length === 0) return true
  const userRoles = new Set((auth?.roles ?? []).map((r) => r.toLowerCase()))
  return roles.some((r) => userRoles.has(r.toLowerCase()))
}

function hasAllPermissions(auth: CommonActionsAuth | undefined, perms: string[] | undefined) {
  if (!perms || perms.length === 0) return true
  const userPerms = new Set((auth?.permissions ?? []).map((p) => p.toLowerCase()))
  return perms.every((p) => userPerms.has(p.toLowerCase()))
}

function isHiddenByMode(def: CommonActionDefinition, viewMode: ViewMode) {
  return !!def.hideWhen?.includes(viewMode)
}

export default function CommonActions({
  actions,
  ui,
  disabled = false,
  locale = 'cs',
  auth,
  onActionClick,
}: Props) {
  if (!actions || actions.length === 0) return null

  const viewMode = ui.viewMode
  const hasSelection = !!ui.hasSelection
  const isDirty = !!ui.isDirty

  return (
    <div className="common-actions" aria-label="Společné akce">
      {actions.map((id) => {
        const def = COMMON_ACTION_DEFS[id]
        if (!def) return null

        if (isHiddenByMode(def, viewMode)) return null

        const roleOk = hasAnyRole(auth, def.requiresAnyRole)
        const permsOk = hasAllPermissions(auth, def.requiresAllPermissions)
        if (!roleOk || !permsOk) return null

        const stateDisabled =
          (def.requiresSelection && !hasSelection) ||
          (def.requiresDirty && !isDirty)

        const isDisabled = disabled || stateDisabled

        const label = def.label[locale]
        const desc = def.description?.[locale] ?? def.description?.cs ?? label

        return (
          <button
            key={id}
            type="button"
            className="common-actions__btn"
            disabled={isDisabled}
            title={desc}
            onClick={() => {
              if (isDisabled) return
              onActionClick(id)
            }}
          >
            <span className="common-actions__icon" aria-hidden="true">
              {getIcon(def.icon as any)}
            </span>
            <span className="common-actions__label">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
