'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import DetailTabs, { type DetailTabItem } from './DetailTabs'
import DetailAttachmentsSection from '@/app/UI/detail-sections/DetailAttachmentsSection'

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

  // ✅ nové (pro checkboxy)
  availablePermissions?: { code: string; name: string; description?: string | null }[]
}

export type RolesUi = {
  canEdit?: boolean
  mode?: DetailViewMode

  roleCode?: string | null
  onChangeRoleCode?: (roleCode: string) => void

  // ✅ nové (pro checkboxy)
  permissionCodes?: string[]
  onTogglePermission?: (permissionCode: string, enabled: boolean) => void
}

export type DetailViewCtx = {
  entityType?: string
  entityId?: string
  entityLabel?: string | null
  mode?: DetailViewMode

  detailContent?: React.ReactNode
  inviteContent?: React.ReactNode
  rolesData?: RolesData
  rolesUi?: RolesUi

  systemBlocks?: { title: string; content: React.ReactNode; visible?: boolean }[]
  systemContent?: React.ReactNode
}

const DETAIL_SECTIONS: Record<DetailSectionId, DetailViewSection<any>> = {
  detail: { id: 'detail', label: 'Detail', order: 10, always: true, render: (ctx) => ctx?.detailContent ?? null },

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
      const roleOptions = data?.availableRoles ?? []
      const permOptions = data?.availablePermissions ?? []

      const ensuredRoleOptions =
        role?.code && !roleOptions.some((r) => r.code === role.code)
          ? [{ code: role.code, name: role.name ?? role.code, description: role.description }, ...roleOptions]
          : roleOptions

      const selectedRoleCode = (ui?.roleCode ?? role?.code ?? '') as string
      const selectedPermCodes = ui?.permissionCodes ?? permissions.map((p) => p.code)

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
                    value={selectedRoleCode}
                    onChange={(e) => ui?.onChangeRoleCode?.(e.target.value)}
                  >
                    <option value="" disabled>
                      — vyber roli —
                    </option>
                    {ensuredRoleOptions.map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.name ?? r.code}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input className="detail-form__input detail-form__input--readonly" value={role?.name ?? role?.code ?? '—'} readOnly />
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

                {(mode === 'edit' || mode === 'create') && canEdit ? (
                  <div className="detail-form__value">
                    {permOptions.length ? (
                      <div style={{ display: 'grid', gap: 8 }}>
                        {permOptions.map((p) => {
                          const checked = selectedPermCodes.includes(p.code)
                          return (
                            <label key={p.code} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => ui?.onTogglePermission?.(p.code, e.target.checked)}
                              />
                              <span>
                                <strong>{p.code}</strong>
                                {p.name ? ` – ${p.name}` : ''}
                                {p.description ? <div className="detail-form__hint">{p.description}</div> : null}
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    ) : (
                      <span className="detail-form__hint">Žádné typy oprávnění (permission_types) nejsou dostupné.</span>
                    )}

                    <div className="detail-form__hint" style={{ marginTop: 8 }}>
                      Oprávnění se ukládají do subject_permissions (subject_id + permission_code).
                    </div>
                  </div>
                ) : (
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
                )}
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
      <DetailAttachmentsSection entityType={ctx.entityType} entityId={ctx.entityId} entityLabel={ctx.entityLabel ?? null} mode={ctx.mode ?? 'view'} />
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

export default function DetailView({
  mode,
  sectionIds,
  initialActiveId,
  onActiveSectionChange,
  ctx,
}: {
  mode: DetailViewMode
  sectionIds: DetailSectionId[]
  initialActiveId?: DetailSectionId
  onActiveSectionChange?: (id: DetailSectionId) => void
  ctx: DetailViewCtx
}) {
  const sections = useMemo(() => {
    const list = sectionIds
      .map((id) => DETAIL_SECTIONS[id])
      .filter(Boolean)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    return list
  }, [sectionIds])

  const tabs: DetailTabItem[] = useMemo(() => {
    return sections
      .filter((s) => (s.always ? true : s.visibleWhen ? s.visibleWhen(ctx) : true))
      .map((s) => ({ id: s.id, label: s.label }))
  }, [sections, ctx])

  const [activeId, setActiveId] = useState<DetailSectionId>(initialActiveId ?? tabs[0]?.id ?? 'detail')
  const lastInitialRef = useRef<string>('')

  useEffect(() => {
    const key = `${ctx?.entityType ?? ''}:${ctx?.entityId ?? ''}:${initialActiveId ?? ''}`
    if (key === lastInitialRef.current) return
    lastInitialRef.current = key
    setActiveId(initialActiveId ?? tabs[0]?.id ?? 'detail')
  }, [ctx?.entityType, ctx?.entityId, initialActiveId, tabs])

  useEffect(() => {
    onActiveSectionChange?.(activeId)
  }, [activeId, onActiveSectionChange])

  const activeSection = sections.find((s) => s.id === activeId) ?? sections[0]

  return (
    <div className="detail-view">
      <DetailTabs items={tabs} activeId={activeId} onChange={(id) => setActiveId(id as DetailSectionId)} />
      <div className="detail-view__content">{activeSection?.render({ ...ctx, mode })}</div>
    </div>
  )
}
