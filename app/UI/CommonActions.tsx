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

/* =========================================================
   TYPES - CommonActionId type definitions (v3 - cache fix)
   ========================================================= */

// Základní akce
export type CommonActionId =
  | 'add'          // Přidat nový záznam
  | 'save'         // Uložit změny
  | 'cancel'       // Zrušit změny
  | 'close'        // Zavřít
  | 'delete'       // Smazat
  | 'archive'      // Archivovat
  | 'view'         // Zobrazit detail
  | 'edit'         // Editovat
  | 'detail'       // Přejít na detail
  | 'duplicate'    // Duplikovat
  | 'attach'       // Připojit
  | 'attachments'  // Správa příloh (otevře AttachmentsManager)
  | 'columnSettings' // Nastavení sloupců ListView
  | 'invite'       // Pozvat
  | 'sendInvite'   // Odeslat pozvánku
  | 'import'       // Import
  | 'export'       // Export
  | 'reject'       // Odmítnout
  // Attachments Manager akce (ONLY)
  | 'attachmentsAdd'        // Přidat přílohu v manageru
  | 'attachmentsEdit'       // Editovat přílohu
  | 'attachmentsSave'       // Uložit přílohu
  | 'attachmentsNewVersion' // Nová verze přílohy
  | 'attachmentsHistory'    // Historie příloh

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

/* =========================================================
   DEFINICE TLAČÍTEK (CENTRÁLNÍ REGISTR)
   ========================================================= */

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

  cancel: {
    id: 'cancel',
    icon: 'cancel',
    label: { cs: 'Zrušit', en: 'Cancel' },
    description: { cs: 'Zrušit editaci / vytvoření.', en: 'Cancel edit / create.' },
    hideWhen: ['list'],
  },

  close: {
    id: 'close',
    icon: 'close',
    label: { cs: 'Zavřít', en: 'Close' },
    description: { cs: 'Zavřít a vrátit se zpět.', en: 'Close and go back.' },
    hideWhen: [],
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
    description: { cs: 'Vytvořit kopii vybraného záznamu.', en: 'Create a copy.' },
    requiresSelection: true,
  },

  attach: {
    id: 'attach',
    icon: 'attach',
    label: { cs: 'Připojit', en: 'Attach' },
    description: { cs: 'Připojit soubor nebo dokument.', en: 'Attach file.' },
    requiresSelection: true,
  },

  attachments: {
    id: 'attachments',
    icon: 'attach',
    label: { cs: 'Přílohy…', en: 'Attachments…' },
    description: { cs: 'Otevřít správu příloh.', en: 'Open attachments manager.' },
    hideWhen: ['list'],
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
    description: { cs: 'Otevřít pozvánku.', en: 'Open invitation.' },
  },

  sendInvite: {
    id: 'sendInvite',
    icon: 'invite',
    label: { cs: 'Odeslat pozvánku', en: 'Send invite' },
    description: { cs: 'Odešle pozvánku e-mailem.', en: 'Sends invitation email.' },
    hideWhen: ['list'],
  },

  columnSettings: {
    id: 'columnSettings',
    icon: 'settings',
    label: { cs: 'Sloupce', en: 'Columns' },
    description: { cs: 'Nastavení sloupců.', en: 'Configure columns.' },
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
    icon: 'reject',
    label: { cs: 'Zamítnout', en: 'Reject' },
    description: { cs: 'Zamítnout vybraný záznam.', en: 'Reject selected record.' },
    requiresSelection: true,
  },

  // =========================================================================
  // ✅ Attachments Manager actions (jen pro správu příloh, žádné jiné moduly)
  // =========================================================================

  attachmentsAdd: {
    id: 'attachmentsAdd',
    icon: 'add',
    label: { cs: 'Přidat', en: 'Add' },
    description: { cs: 'Přidat novou přílohu.', en: 'Add attachment.' },
  },

  attachmentsEdit: {
    id: 'attachmentsEdit',
    icon: 'edit',
    label: { cs: 'Upravit', en: 'Edit' },
    description: { cs: 'Upravit název / popis.', en: 'Edit title / description.' },
    requiresSelection: true,
  },

  attachmentsSave: {
    id: 'attachmentsSave',
    icon: 'save',
    label: { cs: 'Uložit', en: 'Save' },
    description: { cs: 'Uložit změny (metadata / nová příloha).', en: 'Save changes.' },
    requiresDirty: true,
  },

  attachmentsNewVersion: {
    id: 'attachmentsNewVersion',
    icon: 'upload',
    label: { cs: 'Nová verze', en: 'New version' },
    description: { cs: 'Nahrát novou verzi vybrané přílohy.', en: 'Upload new version.' },
    requiresSelection: true,
  },

  attachmentsHistory: {
    id: 'attachmentsHistory',
    icon: 'history',
    label: { cs: 'Historie', en: 'History' },
    description: { cs: 'Zobrazit historii verzí.', en: 'Show version history.' },
    requiresSelection: true,
  },
}

/* =========================================================
   HELPERS
   ========================================================= */

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

/* =========================================================
   COMPONENT
   ========================================================= */

export default function CommonActions({
  actions,
  ui,
  disabled = false,
  locale = 'cs',
  auth,
  onActionClick,
}: Props) {
  if (!actions || actions.length === 0) return null

  const { viewMode, hasSelection, isDirty } = ui

  return (
    <div className="common-actions" aria-label="Společné akce">
      {actions.map((id) => {
        const def = COMMON_ACTION_DEFS[id]
        if (!def) return null
        if (isHiddenByMode(def, viewMode)) return null
        if (!hasAnyRole(auth, def.requiresAnyRole)) return null
        if (!hasAllPermissions(auth, def.requiresAllPermissions)) return null

        const isDisabled =
          disabled ||
          (def.requiresSelection && !hasSelection) ||
          (def.requiresDirty && !isDirty && viewMode !== 'create') // V create mode není potřeba dirty flag

        const label = def.label[locale]
        const desc = def.description?.[locale] ?? label

        return (
          <button
            key={id}
            type="button"
            className="common-actions__btn"
            disabled={isDisabled}
            title={desc}
            onClick={() => !isDisabled && onActionClick(id)}
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
