'use client'

// FILE: app/UI/DetailView.tsx
// FIX: Tabs se resetovaly na initialActiveId, protože effect běžel při každé změně `sections`.
//      To se děje často, protože `ctx` bývá nový objekt -> `sections` se mění -> reset active tab.
//      Nově initialActiveId aplikujeme jen když se skutečně změnilo (přechod na jiný záznam / deep-link).

import React, { useEffect, useMemo, useRef, useState } from 'react'
import DetailTabs, { type DetailTabItem } from './DetailTabs'
import AttachmentOverview from '@/app/UI/detail-sections/AttachmentOverview'

export type DetailViewMode = 'create' | 'edit' | 'view'

export type DetailSectionId =
  | 'detail'
  | 'roles'
  | 'invite'
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
  roleCode?: string | null
  onChangeRoleCode?: (roleCode: string) => void
}

export type DetailViewCtx = {
  entityType?: string
  entityId?: string
  mode?: DetailViewMode

  detailContent?: React.ReactNode
  inviteContent?: React.ReactNode
  rolesData?: RolesData
  rolesUi?: RolesUi

  systemBlocks?: { title: string; content: React.ReactNode; visible?: boolean }[]
  systemContent?: React.ReactNode
}

const DETAIL_SECTIONS: Record<DetailSectionId, DetailViewSection<any>> = {
  detail: {
    id: 'detail',
    label: 'Detail',
    order: 10,
    always: true,
    render: (ctx) => ctx?.detailContent ?? null,
  },

  invite: {
    id: 'invite',
    label: 'Pozvánka',
    order: 15,
    visibleWhen: (ctx) => !!(ctx as any)?.inviteContent,
    render: (ctx) => (ctx as any)?.inviteContent ?? null,
  },

  roles: {
    id: 'roles',
    label: 'Role a oprávnění',
    order: 20,
    visibleWhen: (ctx) => !!(ctx as any)?.rolesData,
    render: (ctx: any) => {
      const data = ctx?.rolesData as RolesData | undefined
      const ui = ctx?.rolesUi as RolesUi | undefined
      const canEdit = !!ui?.canEdit
      const mode = ui?.mode ?? 'view'

      const role = data?.role
      const permissions = data?.permissions ?? []
      const options = data?.availableRoles ?? []

      const ensuredOptions =
        role?.code && !options.some((r) => r.code === role.code)
          ? [{ code: role.code, name: role.name ?? role.code, description: role.description }, ...options]
          : options

      const selectedCode = (ui?.roleCode ?? role?.code ?? '') as string

      return (
        <div className="detail-form">
          <section className="detail-form__section">
            <h3 className="detail-form__section-title">Role</h3>

            <div className="detail-form__grid detail-form__grid--narrow">
              <div className="detail-form__field detail-form__field--span-4">
                <label className="detail-form__label">Role</label>

                {(mode === 'edit' || mode === 'create') && canEdit ? (
                  <select
                    className="detail-form__input"
                    value={selectedCode}
                    onChange={(e) => ui?.onChangeRoleCode?.(e.target.value)}
                  >
                    <option value="" disabled>
                      — vyber roli —
                    </option>
                    {ensuredOptions.map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.name ?? r.code}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="detail-form__input detail-form__input--readonly"
                    value={role?.name ?? role?.code ?? '—'}
                    readOnly
                  />
                )}

                {mode !== 'view' && (
                  <div className="detail-form__hint">Role je uložena v subject_roles (subject_id + role_code).</div>
                )}
              </div>
            </div>
          </section>

          <section className="detail-form__section">
            <h3 className="detail-form__section-title">Oprávnění</h3>

            <div className="detail-form__grid detail-form__grid--narrow">
              <div className="detail-form__field detail-form__field--span-4">
                <label className="detail-form__label">Oprávnění</label>
                <div className="detail-form__value">
                  {permissions.length ? (
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {permissions.map((p) => (
                        <li key={p.code}>
                          <strong>{p.code}</strong> {p.name ? `– ${p.name}` : ''}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="detail-form__hint">Žádná oprávnění</span>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      )
    },
  },

  attachments: {
    id: 'attachments',
    label: 'Přílohy',
    order: 90,
    visibleWhen: (ctx) => !!(ctx as any)?.entityType && !!(ctx as any)?.entityId,
    render: (ctx: any) => (
      <AttachmentOverview entityType={ctx.entityType} entityId={ctx.entityId} mode={ctx.mode ?? 'view'} />
    ),
  },

  system: {
    id: 'system',
    label: 'Systém',
    order: 100,
    visibleWhen: (ctx) => !!(ctx as any)?.entityType && !!(ctx as any)?.entityId,
    render: (ctx: any) => {
      const blocks = (ctx?.systemBlocks ?? []) as { title: string; content: React.ReactNode; visible?: boolean }[]
      const visibleBlocks = blocks.filter((b) => b && b.visible !== false)

      return (
        <div className="detail-form">
          <section className="detail-form__section">
            <h3 className="detail-form__section-title">Systém</h3>
            <div className="detail-form__grid detail-form__grid--narrow">
              <div className="detail-form__field detail-form__field--span-4">
                <label className="detail-form__label">Entity</label>
                <input className="detail-form__input detail-form__input--readonly" value={ctx.entityType ?? '—'} readOnly />
              </div>
              <div className="detail-form__field detail-form__field--span-4">
                <label className="detail-form__label">ID</label>
                <input className="detail-form__input detail-form__input--readonly" value={ctx.entityId ?? '—'} readOnly />
              </div>
            </div>
          </section>

          {ctx?.systemContent ?? null}

          {visibleBlocks.map((b, idx) => (
            <section key={idx} className="detail-form__section">
              <h3 className="detail-form__section-title">{b.title}</h3>
              {b.content}
            </section>
          ))}
        </div>
      )
    },
  },

  users: { id: 'users', label: 'Uživatelé', order: 30, render: () => null },
  equipment: { id: 'equipment', label: 'Vybavení', order: 40, render: () => null },
  accounts: { id: 'accounts', label: 'Účty', order: 50, render: () => null },
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
  initialActiveId?: DetailSectionId
  onActiveSectionChange?: (id: DetailSectionId) => void
  ctx?: Ctx & DetailViewCtx
  children?: React.ReactNode
}

export default function DetailView<Ctx = unknown>({
  children,
  sectionIds,
  initialActiveId,
  onActiveSectionChange,
  ctx,
}: DetailViewProps<Ctx>) {
  if (!sectionIds && !ctx) return <div className="detail-view">{children}</div>

  const safeCtx = (ctx ?? ({} as Ctx)) as Ctx & DetailViewCtx
  const sections = useMemo(() => resolveSections(sectionIds, safeCtx), [sectionIds, safeCtx])

  const defaultActive =
    (initialActiveId && sections.some((s) => s.id === initialActiveId) ? initialActiveId : sections[0]?.id) ?? 'detail'

  const [activeId, setActiveId] = useState<DetailSectionId>(defaultActive)

  // ✅ Initial tab apply: jen když se initialActiveId skutečně změnilo (ne při každém přerenderu)
  const lastInitialAppliedRef = useRef<DetailSectionId | null>(null)

  useEffect(() => {
    if (!initialActiveId) return
    if (!sections.some((s) => s.id === initialActiveId)) return

    if (lastInitialAppliedRef.current !== initialActiveId) {
      lastInitialAppliedRef.current = initialActiveId
      setActiveId(initialActiveId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialActiveId]) // ⚠️ záměrně NEzávisíme na `sections`, aby to neresetovalo aktivní tab

  // ✅ Když aktivní záložka přestane existovat (např. zmizí Pozvánka), přepni na první dostupnou
  useEffect(() => {
    if (!sections.some((s) => s.id === activeId)) {
      setActiveId(sections[0]?.id ?? 'detail')
    }
  }, [sections, activeId])

  useEffect(() => {
    onActiveSectionChange?.(activeId)
  }, [activeId, onActiveSectionChange])

  const activeSection = sections.find((s) => s.id === activeId) ?? sections[0]
  const tabs: DetailTabItem[] = sections.map((s) => ({ id: s.id, label: s.label }))

  return (
    <div className="detail-view">
      {tabs.length > 1 && (
        <DetailTabs
          items={tabs}
          activeId={activeSection?.id ?? defaultActive}
          onChange={(id) => setActiveId(id as any)}
        />
      )}

      {activeSection && <section id={`detail-section-${activeSection.id}`}>{activeSection.render(safeCtx)}</section>}
      {(!activeSection && children) || null}
    </div>
  )
}
