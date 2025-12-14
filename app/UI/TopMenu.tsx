// FILE: app/UI/DetailView.tsx
// SOURCE: tvoje aktuální verze :contentReference[oaicite:1]{index=1}
// CHANGE: jen lehké zpřesnění ctx typu pro rolesData/rolesUi (UI beze změny)

'use client'

import React, { useMemo, useState } from 'react'
import DetailTabs, { type DetailTabItem } from './DetailTabs'

export type DetailViewMode = 'create' | 'edit' | 'view'

export type DetailSectionId =
  | 'detail'
  | 'roles'
  | 'users'
  | 'equipment'
  | 'accounts'
  | 'attachments'
  | 'system'

export type DetailViewSection<Ctx = unknown> = {
  id: DetailSectionId
  label: string
  order: number
  always?: boolean
  render: (ctx: Ctx) => React.ReactNode
  visibleWhen?: (ctx: Ctx) => boolean
}

export type RolesData = {
  role?: { code: string; name: string; description?: string | null }
  permissions?: { code: string; name: string; description?: string | null }[]
  availableRoles?: { code: string; name: string; description?: string | null }[]
}

export type RolesUi = {
  canEdit?: boolean
  mode?: DetailViewMode
  onChangeRoleCode?: (roleCode: string) => void
}

export type DetailViewCtx = {
  detailContent?: React.ReactNode
  rolesData?: RolesData
  rolesUi?: RolesUi
}

const DETAIL_SECTIONS: Record<DetailSectionId, DetailViewSection<any>> = {
  detail: {
    id: 'detail',
    label: 'Detail',
    order: 10,
    always: true,
    render: (ctx) => ctx?.detailContent ?? null,
  },

  roles: {
    id: 'roles',
    label: 'Role a oprávnění',
    order: 20,
    render: (ctx) => {
      const data = (ctx as DetailViewCtx)?.rolesData
      const ui = (ctx as DetailViewCtx)?.rolesUi

      const role = data?.role
      const permissions = data?.permissions ?? []
      const canEdit = !!ui?.canEdit && (ui?.mode === 'edit' || ui?.mode === 'create')

      return (
        <div className="detail-form">
          {/* ROLE */}
          <section className="detail-form__section">
            <h3 className="detail-form__section-title">Role</h3>

            <div className="detail-form__grid detail-form__grid--narrow">
              <div className="detail-form__field detail-form__field--span-2">
                <label className="detail-form__label">Aktuální role</label>

                {canEdit ? (
                  <select
                    className="detail-form__input"
                    value={role?.code ?? ''}
                    onChange={(e) => ui?.onChangeRoleCode?.(e.target.value)}
                  >
                    {(data?.availableRoles ?? []).map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="detail-form__input detail-form__input--readonly"
                    value={role?.name ?? '—'}
                    readOnly
                  />
                )}
              </div>

              <div className="detail-form__field detail-form__field--span-4">
                <label className="detail-form__label">Popis role</label>
                <input
                  className="detail-form__input detail-form__input--readonly"
                  value={role?.description ?? '—'}
                  readOnly
                />
              </div>
            </div>
          </section>

          {/* OPRÁVNĚNÍ (A: odvozené z role) */}
          <section className="detail-form__section">
            <h3 className="detail-form__section-title">Oprávnění (odvozené z role)</h3>

            {permissions.length === 0 ? (
              <div className="detail-view__placeholder">
                Žádná oprávnění (zatím). Napojíme na Supabase z role.
              </div>
            ) : (
              <div className="detail-form__grid">
                {permissions.map((p) => (
                  <div key={p.code} className="detail-form__field">
                    <label className="detail-form__label">{p.name}</label>
                    <input
                      className="detail-form__input detail-form__input--readonly"
                      value={p.description ?? ''}
                      readOnly
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )
    },
  },

  users: {
    id: 'users',
    label: 'Seznam uživatelů',
    order: 30,
    render: () => (
      <div className="detail-view__placeholder">
        Seznam uživatelů – doplníme (např. uživatelé jednotky / nájemníci).
      </div>
    ),
  },

  equipment: {
    id: 'equipment',
    label: 'Vybavení jednotky',
    order: 40,
    render: () => (
      <div className="detail-view__placeholder">
        Vybavení jednotky – doplníme (jednotka).
      </div>
    ),
  },

  accounts: {
    id: 'accounts',
    label: 'Účty',
    order: 50,
    render: () => <div className="detail-view__placeholder">Účty – doplníme.</div>,
  },

  attachments: {
    id: 'attachments',
    label: 'Přílohy',
    order: 60,
    always: true,
    render: () => <div className="detail-view__placeholder">Přílohy – doplníme.</div>,
  },

  system: {
    id: 'system',
    label: 'Systém',
    order: 70,
    always: true,
    render: () => <div className="detail-view__placeholder">Systém – doplníme.</div>,
  },
}

function resolveSections<Ctx>(sectionIds: DetailSectionId[] | undefined, ctx: Ctx) {
  const picked = new Set<DetailSectionId>(sectionIds ?? [])
  ;(Object.values(DETAIL_SECTIONS) as DetailViewSection<Ctx>[]).forEach((s) => {
    if (s.always) picked.add(s.id)
  })

  return Array.from(picked)
    .map((id) => DETAIL_SECTIONS[id] as DetailViewSection<Ctx>)
    .filter(Boolean)
    .filter((s) => (s.visibleWhen ? s.visibleWhen(ctx) : true))
    .sort((a, b) => a.order - b.order)
}

export type DetailViewProps<Ctx = unknown> = {
  mode: DetailViewMode
  isDirty?: boolean
  isSaving?: boolean
  onSave?: () => void
  onCancel?: () => void
  sectionIds?: DetailSectionId[]
  ctx?: Ctx & DetailViewCtx
  children?: React.ReactNode
}

export default function DetailView<Ctx = unknown>({ children, sectionIds, ctx }: DetailViewProps<Ctx>) {
  if (!sectionIds && !ctx) return <div className="detail-view">{children}</div>

  const safeCtx = (ctx ?? ({} as Ctx)) as Ctx & DetailViewCtx
  const sections = useMemo(() => resolveSections(sectionIds, safeCtx), [sectionIds, safeCtx])

  const defaultActive = sections[0]?.id ?? 'detail'
  const [activeId, setActiveId] = useState<DetailSectionId>(defaultActive)

  const activeSection = sections.find((s) => s.id === activeId) ?? sections[0]
  const tabs: DetailTabItem[] = sections.map((s) => ({ id: s.id, label: s.label }))

  return (
    <div className="detail-view">
      {tabs.length > 1 && (
        <DetailTabs
          items={tabs}
          activeId={activeSection?.id ?? defaultActive}
          onChange={(id) => setActiveId(id as DetailSectionId)}
        />
      )}

      {activeSection && (
        <section id={`detail-section-${activeSection.id}`}>
          {activeSection.render(safeCtx)}
        </section>
      )}
    </div>
  )
}
export default TopMenu
