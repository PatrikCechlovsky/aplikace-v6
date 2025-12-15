// FILE: app/lib/subject/subjectFormProfiles.ts
// PURPOSE: Profily polí pro Subject (010/020/110). Uživatel = Subject (podmnožina).

export type SubjectFormProfileId = 'userAdmin' | 'selfProfile' | 'subjectFull'

export type SubjectFieldId =
  | 'subject_type'
  | 'display_name'
  | 'email'
  | 'phone'
  | 'two_factor_method'
  | 'roles'
  | 'permissions'
  | 'is_archived'

export type SubjectFieldDef = {
  id: SubjectFieldId
  label: string
  kind: 'text' | 'email' | 'phone' | 'select' | 'multiselect' | 'toggle'
  // kde vzít hodnoty pro select:
  // - fixed: v aplikaci
  // - generic: z modulu 900 (generic_type)
  source?: { type: 'fixed' | 'generic'; code: string }
}

export type SubjectFormSectionDef = {
  id: string
  title: string
  fields: SubjectFieldId[]
}

export type SubjectFormProfile = {
  id: SubjectFormProfileId
  sections: SubjectFormSectionDef[]
}

export const SUBJECT_FIELD_DEFS: Record<SubjectFieldId, SubjectFieldDef> = {
  subject_type: {
    id: 'subject_type',
    label: 'Typ subjektu',
    kind: 'select',
    source: { type: 'generic', code: 'subject_type' }, // viz subject-selects :contentReference[oaicite:4]{index=4}
  },
  display_name: { id: 'display_name', label: 'Zobrazované jméno', kind: 'text' },
  email: { id: 'email', label: 'E-mail', kind: 'email' },
  phone: { id: 'phone', label: 'Telefon', kind: 'phone' },
  two_factor_method: {
    id: 'two_factor_method',
    label: '2FA',
    kind: 'select',
    source: { type: 'fixed', code: 'two_factor_method' }, // viz subject-selects :contentReference[oaicite:5]{index=5}
  },
  roles: {
    id: 'roles',
    label: 'Role',
    kind: 'multiselect',
    source: { type: 'generic', code: 'subject_role' }, // viz subject-selects :contentReference[oaicite:6]{index=6}
  },
  permissions: {
    id: 'permissions',
    label: 'Oprávnění',
    kind: 'multiselect',
    source: { type: 'generic', code: 'permission_type' }, // viz subject-selects :contentReference[oaicite:7]{index=7}
  },
  is_archived: { id: 'is_archived', label: 'Archivováno', kind: 'toggle' },
}

export const SUBJECT_FORM_PROFILES: Record<SubjectFormProfileId, SubjectFormProfile> = {
  // Modul 010 – admin správa uživatelů (subjekt s rolí user)
  userAdmin: {
    id: 'userAdmin',
    sections: [
      { id: 'basic', title: 'Základ', fields: ['display_name', 'email', 'phone'] },
      { id: 'security', title: 'Bezpečnost', fields: ['two_factor_method'] },
      { id: 'access', title: 'Role a oprávnění', fields: ['roles', 'permissions'] },
      { id: 'state', title: 'Stav', fields: ['is_archived'] },
    ],
  },

  // Modul 020 – můj účet (omezená pole; podle rules v subject-permissions) :contentReference[oaicite:8]{index=8}
  selfProfile: {
    id: 'selfProfile',
    sections: [
      { id: 'basic', title: 'Základ', fields: ['display_name', 'email', 'phone'] },
      { id: 'security', title: 'Bezpečnost', fields: ['two_factor_method'] },
      // bez roles/permissions, protože běžný user to nemá vidět/editovat :contentReference[oaicite:9]{index=9}
    ],
  },

  // Modul 110 – plný subjekt (budeme rozšiřovat postupně)
  subjectFull: {
    id: 'subjectFull',
    sections: [
      { id: 'basic', title: 'Základ', fields: ['subject_type', 'display_name', 'email', 'phone'] },
      { id: 'security', title: 'Bezpečnost', fields: ['two_factor_method'] },
      { id: 'access', title: 'Role a oprávnění', fields: ['roles', 'permissions'] },
      { id: 'state', title: 'Stav', fields: ['is_archived'] },
    ],
  },
}
