// app/UI/CommonActions.tsx
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
  requiresDirty?: boolean     // má smysl jen když je form špinavý (save)
}

export const COMMON_ACTION_DEFS: Record<
  CommonActionId,
  CommonActionDefinition
> = {
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

type Props = {
  disabled?: boolean
  // zatím jen jednoduchá verze – později doplníme moduleId, viewScope, role atd.
}

function getDefaultActions(): CommonActionDefinition[] {
  // dočasně: zobrazíme jen pár základních tlačítek
  return [
    COMMON_ACTION_DEFS.view,
    COMMON_ACTION_DEFS.add,
    COMMON_ACTION_DEFS.edit,
    COMMON_ACTION_DEFS.archive,
    COMMON_ACTION_DEFS.delete,
  ]
}

export default function CommonActions({ disabled = false }: Props) {
  const actions = getDefaultActions()

  return (
    <div className="common-actions">
      {actions.map((a) => (
