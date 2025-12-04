// app/UI/commonActions.config.ts
export type CommonActionId =
  | 'add'
  | 'edit'
  | 'view'
  | 'duplicate'
  | 'archive'
  | 'delete'
  | 'attach'
  | 'save'
  | 'saveAndClose'
  | 'cancel'

export type CommonActionDefinition = {
  id: CommonActionId
  icon: string
  label: string
  requiresSelection?: boolean   // potřebuje vybraný záznam (edit, delete…)
  requiresDirty?: boolean       // má smysl jen když je form špinavý (save)
}

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
    // … atd
  }
