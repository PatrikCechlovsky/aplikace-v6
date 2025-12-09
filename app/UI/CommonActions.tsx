// FILE: app/UI/CommonActions.tsx
// PURPOSE: Společná sada akcí (tlačítek) pro seznamy a formuláře.
// - Každý tile / form si může nadefinovat, jaké akce chce zobrazit.
// - CommonActions umí vyhodnotit requiresSelection / requiresDirty.
// - Pokud není předáno "actions", použije se původní pevná sada (view/add/edit/archive/delete).

'use client'

import { getIcon } from './icons'

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

export type CommonActionDefinition = {
  id: CommonActionId
  icon: string
  label: string
  requiresSelection?: boolean // potřebuje vybraný záznam (edit, delete…)
  requiresDirty?: boolean // má smysl jen když je form „špinavý“ (save)
}

// Centrální definice všech typů akcí – slovník
export const COMMON_ACTION_DEFS: Record<CommonActionId, CommonActionDefinition> =
  {
    add: {
      id: 'add',
      icon: 'add',
      label: 'Přidat',
    },
    edit: {
      id: 'edit',
      icon: 'edit',
      label: 'Upravit',
      requiresSelection: true,
    },
    view: {
      id: 'view',
      icon: 'view',
      label: 'Zobrazit',
      requiresSelection: true,
    },
    duplicate: {
      id: 'duplicate',
      icon: 'duplicate',
      label: 'Duplikovat',
      requiresSelection: true,
    },
    attach: {
      id: 'attach',
      icon: 'attach',
      label: 'Připojit',
      requiresSelection: true,
    },
    archive: {
      id: 'archive',
      icon: 'archive',
      label: 'Archivovat',
      requiresSelection: true,
    },
    delete: {
      id: 'delete',
      icon: 'delete',
      label: 'Smazat',
      requiresSelection: true,
    },
    save: {
      id: 'save',
      icon: 'save',
      label: 'Uložit',
      requiresDirty: true,
    },
    saveAndClose: {
      id: 'saveAndClose',
      icon: 'save',
      label: 'Uložit a zavřít',
      requiresDirty: true,
    },
    cancel: {
      id: 'cancel',
      icon: 'cancel',
      label: 'Zrušit',
    },
  }

// Konfigurace jedné akce z pohledu konkrétního modulu/tilu/formu
export type CommonActionConfig = {
  id: CommonActionId
  label?: string // možnost přepsat label
  icon?: string // možnost přepsat ikonu
  visible?: boolean // možnost schovat akci (např. podle role)
  disabled?: boolean // navíc k logice requiresSelection / requiresDirty
}

// Prop pro komponentu CommonActions
type Props = {
  // Volitelné: pokud neuvedeš, použije se defaultní sada (view, add, edit, archive, delete)
  actions?: CommonActionId[] | CommonActionConfig[]

  // Globální disabled (např. formulář v read-only)
  disabled?: boolean

  // Máš v seznamu / detailu vybraný řádek?
  hasSelection?: boolean

  // Je formulář „dirty“ (jsou neuložené změny)?
  isDirty?: boolean

  // Zarovnání celé lišty (do budoucna)
  align?: 'left' | 'right'

  // Handler kliknutí na akci
  onActionClick?: (id: CommonActionId) => void
}

// Pomocná funkce – normalizace vstupu na plnohodnotnou definici akce
function resolveActions(
  actions: Props['actions'],
): CommonActionDefinition[] {
  // Pokud není nic předané, zachováme původní chování
  const base: CommonActionDefinition[] = [
    COMMON_ACTION_DEFS.view,
    COMMON_ACTION_DEFS.add,
    COMMON_ACTION_DEFS.edit,
    COMMON_ACTION_DEFS.archive,
    COMMON_ACTION_DEFS.delete,
  ]

  if (!actions || actions.length === 0) {
    return base
  }

  // Pokud je to prosté pole ID
  if (typeof actions[0] === 'string') {
    return (actions as CommonActionId[])
      .map((id) => COMMON_ACTION_DEFS[id])
      .filter(Boolean)
  }

  // Pokud je to pole konfigurací
  return (actions as CommonActionConfig[])
    .map((cfg) => {
      const baseDef = COMMON_ACTION_DEFS[cfg.id]
      if (!baseDef) return null

      return {
        ...baseDef,
        label: cfg.label ?? baseDef.label,
        icon: cfg.icon ?? baseDef.icon,
        // requiresSelection / requiresDirty zůstávají z base
      } as CommonActionDefinition
    })
    .filter((def): def is CommonActionDefinition => !!def)
}

// Hlavní komponenta
export default function CommonActions({
  actions,
  disabled = false,
  hasSelection = false,
  isDirty = false,
  align = 'left',
  onActionClick,
}: Props) {
  const resolved = resolveActions(actions)

  if (!resolved.length) return null

  return (
    <div
      className={`common-actions common-actions--align-${align}`}
      aria-label="Společné akce"
    >
      {resolved.map((a) => {
        // Logika disabled:
        // - globální disabled
        // - requiresSelection a není nic vybráno
        // - requiresDirty a formulář není dirty
        const isDisabled =
          disabled ||
          (a.requiresSelection && !hasSelection) ||
          (a.requiresDirty && !isDirty)

        return (
          <button
            key={a.id}
            type="button"
            className="common-actions__btn"
            disabled={isDisabled}
            title={a.label}
            onClick={() => {
              if (isDisabled) return
              onActionClick?.(a.id)
            }}
          >
            <span className="common-actions__icon" aria-hidden="true">
              {getIcon(a.icon as any)}
            </span>
            <span className="common-actions__label">{a.label}</span>
          </button>
        )
      })}

      <style jsx>{`
        .common-actions {
          display: inline-flex;
          gap: 8px;
        }

        .common-actions--align-right {
          justify-content: flex-end;
        }

        .common-actions__btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 999px;
          border: 1px solid #e5e7eb;
          background: white;
          font-size: 0.8rem;
          cursor: pointer;
        }

        .common-actions__btn:disabled {
          opacity: 0.5;
          cursor: default;
        }

        .common-actions__icon {
          display: inline-flex;
        }

        .common-actions__label {
          white-space: nowrap;
        }
      `}</style>
    </div>
  )
}
