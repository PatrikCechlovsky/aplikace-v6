// FILE: app/UI/DetailView.tsx
// CHANGE:
// - Pozvánka + Systém jsou "viditelně" (nezmizí jen proto, že chybí ctx.inviteContent nebo entityId)
// - podporuje initialSectionId + onActiveSectionChange i přes ctx (kvůli UserDetailFrame)
// - systémový tab umí zobrazit invite info (sent_by, sent_at, valid_until, status, first_login_at, can_send_invite)

'use client'

import React, { useEffect, useMemo, useState } from 'react'
import DetailTabs from '@/app/UI/DetailTabs'
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
  /**
   * POZOR: už nepoužívej pro "invite" a "system" tak, aby tab mizel.
   * Lepší je nechat tab viditelný a uvnitř ukázat "není k dispozici".
   */
  visibleWhen?: (ctx: Ctx, picked?: Set<DetailSectionId>) => boolean
}

export type RolesData = {
  role?: { code: string; name: string; description?: string | null }
  permissions?: { code: string; name: string; description?: string | null }[]
  availableRoles?: { code: string; name: string; description?: string | null }[]
}

export type RolesUi = {
  canEdit?: boolean
  mode?: DetailViewMode
  /** Controlled hodnota pro select v edit/create (doporučeno: držet ve formuláři) */
  roleCode?: string | null
  onChangeRoleCode?: (roleCode: string) => void
}

export type InviteSystemInfo = {
  sentBy?: string | null
  sentAt?: string | null
  validUntil?: string | null
  status?: string | null
  firstLoginAt?: string | null
  canSendInvite?: boolean | null
}

export type DetailViewCtx = {
  /** Volitelné pro systémové sekce (Přílohy/Systém). Pokud nejsou, tab se stále ukáže, jen s hintem. */
  entityType?: string
  entityId?: string
  mode?: DetailViewMode

  /** Obsahy jednotlivých sekcí */
  detailContent?: React.ReactNode
  inviteContent?: React.ReactNode
  rolesData?: RolesData
  rolesUi?: RolesUi

  /** Invite "audit" data pro System tab */
  inviteSystem?: InviteSystemInfo

  /**
   * Napojení z parentů: UserDetailFrame to teď posílá přes ctx (ne přes props),
   * takže to tady umíme přečíst a použít.
   */
  initialSectionId?: DetailSectionId
  onActiveSectionChange?: (id: DetailSectionId) => void

  /** Volitelné – do budoucna: registrace "odeslat pozvánku" submitu */
  onRegisterInviteSubmit?: (fn: () => Promise<boolean>) => void
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
    // ✅ tab se má ukázat, když je vyžádaný v sectionIds — i kdyby zatím nebyl inviteContent
    visibleWhen: (_ctx, picked) => !!picked?.has('invite'),
    render: (ctx: any) => {
      if (ctx?.inviteContent) return ctx.inviteContent
      return (
        <div className="detail-form">
          <section className="detail-form__section">
            <h3 className="detail-form__section-title">Pozvánka</h3>
            <div className="detail-form__hint">
              Pozvánka není zatím napojená (chybí <code>inviteContent</code>). Přesto je záložka viditelná.
            </div>
          </section>
        </div>
      )
    },
  },

  roles: {
    id: 'roles',
    label: 'Role a oprávnění',
    order: 20,
    visibleWhen: (ctx, picked) => !!picked?.has('roles') && !!(ctx as any)?.rolesData,
    render: (ctx: any) => {
      const data = ctx?.rolesData as RolesData | undefined
      const ui = ctx?.rolesUi as RolesUi | undefined
      const canEdit = !!ui?.canEdit
      const mode = ui?.mode ?? 'view'

      const role = data?.role
      const permissions = data?.permissions ?? []
      const options = data?.availableRoles ?? []

      // Zajisti, že aktuální role je v options (když číselník ještě není načtený)
      const ensuredOptions =
        role?.code && !options.some((r) => r.code === role.code)
          ? [{ code: role.code, name: role.name ?? role.code, description: role.description }, ...options]
          : options

      // Controlled hodnota: preferuj UI stav, fallback na aktuální roli
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
    // ✅ tab ukážeme jen pokud je v sectionIds; uvnitř si poradíme i s chybějícím entityId
    visibleWhen: (_ctx, picked) => !!picked?.has('attachments'),
    render: (ctx: any) => {
      const entityType = ctx?.entityType
      const entityId = ctx?.entityId
      if (!entityType || !entityId) {
        return (
          <div className="detail-form">
            <section className="detail-form__section">
              <h3 className="detail-form__section-title">Přílohy</h3>
              <div className="detail-form__hint">Přílohy jsou dostupné až po uložení záznamu (chybí entityId).</div>
            </section>
          </div>
        )
      }
      return <DetailAttachmentsSection entityType={entityType} entityId={entityId} mode={ctx?.mode ?? 'view'} />
    },
  },

  system: {
    id: 'system',
    label: 'Systém',
    order: 100,
    // ✅ tab se má ukázat, když je vyžádaný v sectionIds — i kdyby zatím nebyl entityId
    visibleWhen: (_ctx, picked) => !!picked?.has('system'),
    render: (ctx: any) => {
      const sys: InviteSystemInfo | undefined = ctx?.inviteSystem

      const row = (label: string, value?: React.ReactNode) => (
        <div className="detail-form__field detail-form__field--span-4">
          <label className="detail-form__label">{label}</label>
          <div className="detail-form__value">
            {value ?? <span className="detail-form__hint">—</span>}
          </div>
        </div>
      )

      const boolText = (v: any) => {
        if (v === true) return 'Ano'
        if (v === false) return 'Ne'
        return '—'
      }

      return (
        <div className="detail-form">
          <section className="detail-form__section">
            <h3 className="detail-form__section-title">Systém</h3>

            <div className="detail-form__grid detail-form__grid--narrow">
              {row('Entity', <input className="detail-form__input detail-form__input--readonly" value={ctx?.entityType ?? '—'} readOnly />)}
              {row('ID', <input className="detail-form__input detail-form__input--readonly" value={ctx?.entityId ?? '—'} readOnly />)}
            </div>

            <div style={{ height: 12 }} />

            <h4 className="detail-form__section-title" style={{ fontSize: 14, opacity: 0.9 }}>
              Pozvánka – systémové informace
            </h4>

            <div className="detail-form__grid detail-form__grid--narrow">
              {row('Kdo odeslal', sys?.sentBy ?? '—')}
              {row('Kdy odesláno', sys?.sentAt ?? '—')}
              {row('Platí do', sys?.validUntil ?? '—')}
              {row('Status', sys?.status ?? '—')}
              {row('První přihlášení', sys?.firstLoginAt ?? '—')}
              {row('Lze odeslat (can_send_invite)', boolText(sys?.canSendInvite))}
            </div>

            {!sys && (
              <div className="detail-form__hint" style={{ marginTop: 8 }}>
                Pozvánka zatím nemá systémová data (chybí <code>ctx.inviteSystem</code>).
              </div>
            )}
          </section>
        </div>
      )
    },
  },

  // ostatní sekce – zatím placeholder
  users: { id: 'users', label: 'Uživatelé', order: 30, visibleWhen: (_c, p) => !!p?.has('users'), render: () => null },
  equipment: { id: 'equipment', label: 'Vybavení', order: 40, visibleWhen: (_c, p) => !!p?.has('equipment'), render: () => null },
  accounts: { id: 'accounts', label: 'Účty', order: 50, visibleWhen: (_c, p) => !!p?.has('accounts'), render: () => null },
}

function resolveSections<Ctx>(sectionIds: DetailSectionId[] | undefined, ctx: Ctx) {
  const picked = new Set<DetailSectionId>(sectionIds ?? [])
  ;(Object.values(DETAIL_SECTIONS) as DetailViewSection<Ctx>[]).forEach((s) => {
    if (s.always) picked.add(s.id)
  })

  return Array.from(picked)
    .map((id) => DETAIL_SECTIONS[id] as DetailViewSection<Ctx>)
    .filter(Boolean)
    .filter((s) => (s.visibleWhen ? s.visibleWhen(ctx, picked) : true))
    .sort((a, b) => a.order - b.order)
}

export type DetailViewProps<Ctx = unknown> = {
  mode: DetailViewMode
  isDirty?: boolean
  isSaving?: boolean
  onSave?: () => void
  onCancel?: () => void
  sectionIds?: DetailSectionId[]

  /**
   * Starý způsob (přímé props) – stále podporujeme.
   * Nový způsob: posílej initialSectionId přes ctx (viz UserDetailFrame).
   */
  initialActiveId?: DetailSectionId

  /**
   * Starý způsob (přímé props) – stále podporujeme.
   * Nový způsob: posílej onActiveSectionChange přes ctx (viz UserDetailFrame).
   */
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

  // ✅ kompatibilita: umíme číst initial i z ctx (UserDetailFrame to tak posílá)
  const initialFromCtx = safeCtx.initialSectionId
  const onActiveFromCtx = safeCtx.onActiveSectionChange

  const preferredInitial = initialActiveId ?? initialFromCtx

  const defaultActive =
    (preferredInitial && sections.some((s) => s.id === preferredInitial) ? preferredInitial : sections[0]?.id) ?? 'detail'

  const [activeId, setActiveId] = useState<DetailSectionId>(defaultActive)

  // Reaguj na změnu preferredInitial (např. otevření detailu rovnou na sekci Pozvánka)
  useEffect(() => {
    if (!preferredInitial) return
    if (!sections.some((s) => s.id === preferredInitial)) return
    setActiveId(preferredInitial)
  }, [preferredInitial, sections])

  // Report aktivní sekci parentovi (pro CommonActions režim)
  useEffect(() => {
    onActiveSectionChange?.(activeId)
    onActiveFromCtx?.(activeId)
  }, [activeId, onActiveSectionChange, onActiveFromCtx])

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
    </div>
  )
}
