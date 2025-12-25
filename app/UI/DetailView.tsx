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

  // ponecháno jako list (UI si vezme jen první)
  permissions?: { code: string; name: string; description?: string | null }[]

  availableRoles?: { code: string; name: string; description?: string | null }[]
  availablePermissions?: { code: string; name: string; description?: string | null }[]
}

export type RolesUi = {
  canEdit?: boolean
  mode?: DetailViewMode

  roleCode?: string | null
  onChangeRoleCode?: (roleCode: string) => void

  // ✅ single permission
  permissionCode?: string | null
  onChangePermissionCode?: (permissionCode: string) => void

  // ✅ fallback starý multi
  permissionCodes?: string[]
  onTogglePermission?: (permissionCode: string, enabled: boolean) => void
}

export type DetailViewCtx = {
  entityType?: string
  entityId?: string
  entityLabel?: string | null
  mode?: DetailViewMode

  detailContent?: React.ReactNode

  // ✅ může být ReactNode NEBO funkce(ctx) => ReactNode
  inviteContent?: React.ReactNode | ((ctx: DetailViewCtx) => React.ReactNode)

  rolesData?: RolesData
  rolesUi?: RolesUi

  systemBlocks?: { title: string; content: React.ReactNode; visible?: boolean }[]
  systemContent?: React.ReactNode
}

const LABEL_W = 140
const FIELD_MAX_W = 420

function FieldRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `${LABEL_W}px minmax(0, 1fr)`,
        gap: 12,
        alignItems: 'center',
        maxWidth: LABEL_W + 12 + FIELD_MAX_W,
      }}
    >
      <div className="detail-form__label" style={{ margin: 0 }}>
        {label}
      </div>
      <div style={{ maxWidth: FIELD_MAX_W }}>{children}</div>
    </div>
  )
}

function renderRoleAndPermissionControls(
  data: RolesData | undefined,
  ui: RolesUi | undefined,
) {
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

  const selectedPermFromData = (permissions[0]?.code ?? '') as string
  const selectedPermCode = (ui?.permissionCode ?? selectedPermFromData ?? '') as string

  const selectedPermCodesFallback = ui?.permissionCodes ?? permissions.map((p) => p.code)

  // Role control
  const roleControl =
    (mode === 'edit' || mode === 'create') && canEdit ? (
      <select
        className="detail-form__input"
        style={{ maxWidth: FIELD_MAX_W }}
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
      <input
        className="detail-form__input detail-form__input--readonly"
        style={{ maxWidth: FIELD_MAX_W }}
        value={role?.name ?? role?.code ?? '—'}
        readOnly
      />
    )

  // Permission control (single preferred)
  let permControl: React.ReactNode = null

  if ((mode === 'edit' || mode === 'create') && canEdit && typeof ui?.onChangePermissionCode === 'function') {
    permControl = permOptions.length ? (
      <select
        className="detail-form__input"
        style={{ maxWidth: FIELD_MAX_W }}
        value={(selectedPermCode ?? '') as string}
        onChange={(e) => ui?.onChangePermissionCode?.(e.target.value)}
      >
        <option value="" disabled>
          — vyber oprávnění —
        </option>
        {permOptions.map((p) => (
          <option key={p.code} value={p.code}>
            {p.name ?? p.code}
          </option>
        ))}
      </select>
    ) : (
      <span className="detail-form__hint">Žádné typy oprávnění nejsou dostupné.</span>
    )
  } else if ((mode === 'edit' || mode === 'create') && canEdit && typeof ui?.onTogglePermission === 'function') {
    // fallback old multi
    permControl = permOptions.length ? (
      <div style={{ display: 'grid', gap: 8 }}>
        {permOptions.map((p) => {
          const checked = selectedPermCodesFallback.includes(p.code)
          return (
            <label key={p.code} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <input type="checkbox" checked={checked} onChange={(e) => ui?.onTogglePermission?.(p.code, e.target.checked)} />
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
      <span className="detail-form__hint">Žádné typy oprávnění nejsou dostupné.</span>
    )
  } else {
    // view
    const name = permOptions.find((p) => p.code === selectedPermCode)?.name
    permControl = (
      <input
        className="detail-form__input detail-form__input--readonly"
        style={{ maxWidth: FIELD_MAX_W }}
        value={selectedPermCode ? name ?? selectedPermCode : '—'}
        readOnly
      />
    )
  }

  return { roleControl, permControl }
}

const DETAIL_SECTIONS: Record<DetailSectionId, DetailViewSection<any>> = {
  detail: { id: 'detail', label: 'Detail', order: 10, always: true, render: (ctx) => ctx?.detailContent ?? null },

  invite: {
    id: 'invite',
    label: 'Pozvánka',
    order: 15,
    visibleWhen: (ctx) => !!(ctx as any)?.inviteContent,
    render: (ctx: any) => {
      const c = (ctx as any)?.inviteContent
      if (typeof c === 'function') return c(ctx)
      return c ?? null
    },
  },

  roles: {
    id: 'roles',
    label: 'Role a oprávnění',
    order: 20,
    visibleWhen: (ctx) => !!(ctx as any)?.rolesData,
    render: (ctx: any) => {
      const data = ctx?.rolesData as RolesData | undefined
      const ui = ctx?.rolesUi as RolesUi | undefined

      const { roleControl, permControl } = renderRoleAndPermissionControls(data, ui)

      return (
        <div className="detail-form">
          <section className="detail-form__section">
            <h3 className="detail-form__section-title">Role a oprávnění</h3>

            <div style={{ display: 'grid', gap: 14 }}>
              <FieldRow label="Role">{roleControl}</FieldRow>
              <FieldRow label="Oprávnění">{permControl}</FieldRow>
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

  // placeholders pro jiné entity
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
    return sectionIds.map((id) => DETAIL_SECTIONS[id]).filter(Boolean).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }, [sectionIds])

  const tabs: DetailTabItem[] = useMemo(() => {
    return sections
      .filter((s) => (s.always ? true : s.visibleWhen ? s.visibleWhen(ctx) : true))
      .map((s) => ({ id: s.id, label: s.label }))
  }, [sections, ctx])

  const firstTabId = (tabs[0]?.id as DetailSectionId | undefined) ?? 'detail'
  const [activeId, setActiveId] = useState<DetailSectionId>(initialActiveId ?? firstTabId)

  const lastInitialRef = useRef<string>('')

  useEffect(() => {
    const key = `${ctx?.entityType ?? ''}:${ctx?.entityId ?? ''}:${initialActiveId ?? ''}`
    if (key === lastInitialRef.current) return
    lastInitialRef.current = key

    const next = initialActiveId ?? ((tabs[0]?.id as DetailSectionId | undefined) ?? 'detail')
    setActiveId(next)
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
