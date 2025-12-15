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

/* ============================================================================
 * 1) ID všech podporovaných akcí
 * ========================================================================== */

export type CommonActionId =
  | 'add'
  | 'detail' // preferované (dříve se používalo "view")
  | 'view' // kompatibilita (alias pro detail)
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

/* ============================================================================
 * 2) UI režimy (AppShell/tile posílá do CommonActions)
 * ========================================================================== */

export type ViewMode = 'list' | 'read' | 'edit' | 'create'
export type Locale = 'cs' | 'en'

export type CommonActionsUiState = {
  viewMode: ViewMode
  hasSelection?: boolean
  isDirty?: boolean
}

/* ============================================================================
 * 3) Práva (volitelné – když zatím nemáš, neposílej)
 * ========================================================================== */

export type CommonActionsAuth = {
  roles?: string[] // např. ['admin','manager']
  permissions?: string[] // např. ['users.edit','users.delete']
}

/* ============================================================================
 * 4) Definice jedné akce (registry)
 * ========================================================================== */

type CommonActionDefinition = {
  id: CommonActionId

  icon: string

  label: {
    cs: string
    en: string
  }

  description?: {
    cs?: string
    en?: string
  }

  /**
   * Stavové podmínky
   */
  requiresSelection?: boolean
  requiresDirty?: boolean

  /**
   * Oprávnění (volitelné)
   */
  requiresAnyRole?: string[]
  requiresAllPermissions?: string[]

  /**
   * Režimové pravidlo: skrýt v určitých režimech
   * (disabled řešíme zvlášť – hide je “úplně pryč”)
   */
  hideWhen?: ViewMode[]
}

/* ============================================================================
 * 5) Centrální registry definic (JEDINÝ zdroj pravdy)
 * ========================================================================== */

const COMMON_ACTION_DEFS: Record<CommonActionId, CommonActionDefinition> = {
  add: {
    id: 'add',
    icon: 'add',
    label: { cs: 'Přidat', en: 'Add' },
    description: { cs: 'Vytvořit nový záznam.', en: 'Create a new record.' },
    hideWhen: ['read'], // v editaci typicky nepřidáváš nový záznam
  },

  detail: {
    id: 'detail',
    icon: 'view',
    label: { cs: 'Detail', en: 'Detail' },
    description: { cs: 'Zobrazit detail záznamu.', en: 'Open record detail.' },
    requiresSelection: true,
    // v režimu read už jsi “v detailu”, tlačítko nemá smysl
    hideWhen: ['read'],
  },

  // kompatibilita (alias) – chová se stejně jako detail
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
    // v editaci už jsi, v create taky nemá smysl, v listu dává smysl
    hideWhen: ['edit', 'create'],
  },

  save: {
    id: 'save',
    icon: 'save',
    label: { cs: 'Uložit', en: 'Save' },
    description: { cs: 'Uložit změny.', en: 'Save changes.' },
    requiresDirty: true,
    // save je relevantní jen při edit/create
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
    description: {
      cs: 'Zrušit editaci / vytvoření.',
      en: 'Cancel edit / create.',
    },
    // cancel je relevantní hlavně v edit/create; v list/read je obvykle zbytečný
    hideWhen: ['list', 'read'],
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
    description: {
      cs: 'Vytvořit kopii vybraného záznamu.',
      en: 'Create a copy of the selected record.',
    },
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
    description: {
      cs: 'Nastavení zobrazených sloupců.',
      en: 'Configure visible columns.',
    },
    hideWhen: ['edit', 'create'], // typicky upravuješ sloupce v listu
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

/* ============================================================================
 * 6) Props komponenty (UI only)
 * ========================================================================== */

type Props = {
  /**
   * Pole klíčů akcí – pořadí je finální a závazné
   */
  actions?: CommonActionId[]

  /**
   * UI stav pro vyhodnocení pravidel
   */
  ui: CommonActionsUiState

  /**
   * Globální disable (např. když app běží v režimu readonly)
   */
  disabled?: boolean

  /**
   * Locale pro labely (default cs)
   */
  locale?: Locale

  /**
   * Auth kontext (role/permission) – volitelné
   */
  auth?: CommonActionsAuth

  /**
   * Delegace kliku do aktivního tile/modulu (AppShell)
   */
  onActionClick: (id: CommonActionId) => void
}

/* ============================================================================
 * 7) Pomocné evaluátory
 * ========================================================================== */

function hasAnyRole(auth: CommonActionsAuth | undefined, roles: string[] | undefined) {
  if (!roles || roles.length === 0) return true
  const userRoles = new Set((auth?.roles ?? []).map((r) => r.toLowerCase()))
  return roles.some((r) => userRoles.has(r.toLowerCase()))
}

function hasAllPermissions(
  auth: CommonActionsAuth | undefined,
  perms: string[] | undefined,
) {
  if (!perms || perms.length === 0) return true
  const userPerms = new Set((auth?.permissions ?? []).map((p) => p.toLowerCase()))
  return perms.every((p) => userPerms.has(p.toLowerCase()))
}

function isHiddenByMode(def: CommonActionDefinition, viewMode: ViewMode) {
  return !!def.hideWhen?.includes(viewMode)
}

/* ============================================================================
 * 8) Hlavní komponenta CommonActions
 * ========================================================================== */

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

        // 1) Režimové skrývání (read/edit pravidla atd.)
        if (isHiddenByMode(def, viewMode)) return null

        // 2) Práva – pokud neprojde, schovat (ne disabled)
        const roleOk = hasAnyRole(auth, def.requiresAnyRole)
        const permsOk = hasAllPermissions(auth, def.requiresAllPermissions)
        if (!roleOk || !permsOk) return null

        // 3) Stavové disabled
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
