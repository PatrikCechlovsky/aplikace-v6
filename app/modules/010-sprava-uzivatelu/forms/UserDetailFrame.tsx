'use client'

// =====================
// 1) IMPORTS
// =====================

import React, { useEffect, useMemo, useRef, useState } from 'react'
import DetailView, { type DetailSectionId, type DetailViewMode, type RolesData, type RolesUi } from '@/app/UI/DetailView'
import type { ViewMode } from '@/app/UI/CommonActions'

import UserDetailForm, { type UserFormValue } from './UserDetailForm'
import { getLatestInviteForSubject, sendInvite } from '@/app/lib/services/invites'
import type { InviteFormValue } from './InviteUserForm'
import { getUserDetail, saveUser } from '@/app/lib/services/users'
import { fetchRoleTypes, type RoleTypeRow } from '@/app/modules/900-nastaveni/services/roleTypes'
import { listPermissionTypes, type PermissionTypeRow } from '@/app/lib/services/permissions'
import { formatDateTime } from '@/app/lib/formatters/formatDateTime'

// =====================
// 2) TYPES
// =====================

export type UiUser = {
  id: string
  displayName: string
  email: string
  phone?: string
  roleLabel: string
  twoFactorMethod?: string | null
  createdAt: string
  isArchived?: boolean
  firstLoginAt?: string | null

  roleCode?: string | null

  titleBefore?: string | null
  firstName?: string | null
  lastName?: string | null
  login?: string | null
}

type Props = {
  user: UiUser
  viewMode: ViewMode
  initialSectionId?: DetailSectionId
  onActiveSectionChange?: (id: DetailSectionId) => void
  onRegisterSubmit?: (fn: () => Promise<UiUser | null>) => void
  onRegisterInviteSubmit?: (fn: () => Promise<boolean>) => void
  onDirtyChange?: (dirty: boolean) => void
}

// =====================
// 3) HELPERS
// =====================

function buildInitialFormValue(u: UiUser): UserFormValue {
  return {
    displayName: (u.displayName ?? '').toString(),
    email: (u.email ?? '').toString(),
    phone: (u.phone ?? '').toString(),

    titleBefore: ((u as any).titleBefore ?? '').toString(),
    firstName: ((u as any).firstName ?? '').toString(),
    lastName: ((u as any).lastName ?? '').toString(),
    login: ((u as any).login ?? '').toString(),

    isArchived: !!u.isArchived,
  }
}

function isNewId(id: string | null | undefined) {
  const s = String(id ?? '').trim()
  return !s || s === 'new'
}

// =====================
// 4) DATA LOAD (hooks)
// =====================

export default function UserDetailFrame({
  user,
  viewMode,
  initialSectionId,
  onActiveSectionChange,
  onRegisterSubmit,
  onRegisterInviteSubmit,
  onDirtyChange,
}: Props) {
  // DB truth (subjects + role + permissions)
  const [resolvedUser, setResolvedUser] = useState<UiUser>(user)
  const resolveSeqRef = useRef(0)

  // Dirty
  const [isDirty, setIsDirty] = useState(false)
  const initialSnapshotRef = useRef<string>('')
  const firstRenderRef = useRef(true)

  const [formValue, setFormValue] = useState<UserFormValue>(() => buildInitialFormValue(user))

  // Role
  const [roleCode, setRoleCode] = useState<string>(() => ((user as any)?.roleCode ?? '').toString())
  const roleCodeInitialRef = useRef<string>('')

  // Permission (SINGLE)
  const [permissionTypes, setPermissionTypes] = useState<PermissionTypeRow[]>([])
  const [permissionCode, setPermissionCode] = useState<string>('')
  const permissionCodeInitialRef = useRef<string>('')
  const permTypesInFlightRef = useRef<Promise<void> | null>(null)
  // role types (900)
  const [roleTypes, setRoleTypes] = useState<RoleTypeRow[]>([])
  const roleTypesInFlightRef = useRef<Promise<void> | null>(null)

  // 4a) Resolve DB truth on open / user change
  useEffect(() => {
    // fast: show whatever we already have
    setResolvedUser(user)

    // create/new => no DB resolve
    if (viewMode === 'create' || isNewId(user?.id)) {
      const init = buildInitialFormValue(user)
      setFormValue(init)

      const rc = String((user as any)?.roleCode ?? '').trim()
      setRoleCode(rc)
      roleCodeInitialRef.current = rc

      setPermissionCode('')
      permissionCodeInitialRef.current = ''

      initialSnapshotRef.current = JSON.stringify(init)
      firstRenderRef.current = true

      setIsDirty(false)
      onDirtyChange?.(false)
      return
    }

    // read/edit => resolve from Supabase
    const subjectId = String(user?.id ?? '').trim()
    const mySeq = ++resolveSeqRef.current
    let mounted = true

    ;(async () => {
      try {
        const detail = await getUserDetail(subjectId)
        if (!mounted) return
        if (mySeq !== resolveSeqRef.current) return

        const s: any = (detail as any)?.subject ?? {}
        const nextRole = String((detail as any)?.role_code ?? '').trim()
        const nextPerm = String(((detail as any)?.permissions?.[0] ?? '')).trim()

        const nextUser: UiUser = {
          ...user,
          id: String(s.id ?? subjectId),
          displayName: String(s.display_name ?? user.displayName ?? ''),
          email: String(s.email ?? user.email ?? ''),
          phone: (s.phone ?? user.phone ?? undefined) as any,
          isArchived: !!(s.is_archived ?? user.isArchived),
          createdAt: String(s.created_at ?? user.createdAt ?? ''),
          firstLoginAt: (s.first_login_at ?? user.firstLoginAt ?? null) as any,

          titleBefore: (s.title_before ?? (user as any).titleBefore ?? null) as any,
          firstName: (s.first_name ?? (user as any).firstName ?? null) as any,
          lastName: (s.last_name ?? (user as any).lastName ?? null) as any,
          login: (s.login ?? (user as any).login ?? null) as any,

          roleCode: nextRole || null,
        }

        setResolvedUser(nextUser)

        const init = buildInitialFormValue(nextUser)
        setFormValue(init)

        setRoleCode(nextRole)
        roleCodeInitialRef.current = nextRole

        setPermissionCode(nextPerm)
        permissionCodeInitialRef.current = nextPerm

        initialSnapshotRef.current = JSON.stringify(init)
        firstRenderRef.current = true

        setIsDirty(false)
        onDirtyChange?.(false)
      } catch (e) {
        console.warn('[UserDetailFrame.getUserDetail] WARN', e)
      }
    })()

    return () => {
      mounted = false
    }
  }, [user?.id, viewMode]) // eslint-disable-line react-hooks/exhaustive-deps

  // 4b) role types (900)
  useEffect(() => {
    if (roleTypesInFlightRef.current) return
    const p = (async () => {
      try {
        const rows = await fetchRoleTypes()
        setRoleTypes(rows ?? [])
      } catch (e) {
        console.warn('[UserDetailFrame.fetchRoleTypes] WARN', e)
        setRoleTypes([])
      }
    })()
    roleTypesInFlightRef.current = p
  }, [])
  // 4c) permission types (900)
  useEffect(() => {
    if (permTypesInFlightRef.current) return
    const p = (async () => {
      try {
        const rows = await listPermissionTypes({ includeInactive: false })
        setPermissionTypes(rows ?? [])
      } catch (e) {
        console.warn('[UserDetailFrame.listPermissionTypes] WARN', e)
        setPermissionTypes([])
      }
    })()
    permTypesInFlightRef.current = p
  }, [])

  // =====================
  // 5) ACTION HANDLERS
  // =====================

  const computeDirty = (nextFormSnap?: string, nextRole?: string, nextPerm?: string) => {
    const formSnap = typeof nextFormSnap === 'string' ? nextFormSnap : JSON.stringify(formValue ?? {})
    const roleNow = typeof nextRole === 'string' ? nextRole : (roleCode ?? '')
    const permNow = typeof nextPerm === 'string' ? nextPerm : (permissionCode ?? '')

    const dirty =
      formSnap !== initialSnapshotRef.current ||
      roleNow !== roleCodeInitialRef.current ||
      permNow !== permissionCodeInitialRef.current

    setIsDirty(dirty)
    onDirtyChange?.(dirty)
  }

  const markDirtyIfChanged = (nextVal: any) => {
    const snap = JSON.stringify(nextVal ?? {})
    if (firstRenderRef.current) {
      firstRenderRef.current = false
      initialSnapshotRef.current = snap
      setIsDirty(false)
      onDirtyChange?.(false)
      return
    }
    computeDirty(snap)
  }
  // -----------------------------
  // SUBMIT (REGISTERED ONCE)
  // -----------------------------
  
  // Register save submit
  useEffect(() => {
    if (!onRegisterSubmit) return
  
    onRegisterSubmit(async () => {
      try {
        const v = formValue ?? buildInitialFormValue(resolvedUser)
  
        if (!v.displayName?.trim()) {
          alert('Zobrazované jméno je povinné.')
          return null
        }
  
        // ✅ nově: role + permission povinné pro SAVE
        const rc = (roleCode ?? '').trim()
        if (!rc) {
          alert('Chybí role – vyber roli a pak ulož.')
          return null
        }
  
        const pc = (permissionCode ?? '').trim()
        if (!pc) {
          alert('Chybí oprávnění – vyber oprávnění a pak ulož.')
          return null
        }
  
        const savedRow = await saveUser({
          id: resolvedUser?.id?.trim() ? resolvedUser.id : 'new',
          subjectType: 'osoba',
  
          displayName: v.displayName,
          email: v.email,
          phone: v.phone,
          isArchived: v.isArchived,
  
          titleBefore: v.titleBefore,
          firstName: v.firstName,
          lastName: v.lastName,
          login: v.login,
  
          roleCode: rc,
          // ✅ pošli jen když je vybrané (a tady je vždy)
          permissionCodes: [pc],
        })
  
        const saved: UiUser = {
          ...resolvedUser,
          id: (savedRow as any).id ?? resolvedUser.id,
          displayName: (savedRow as any).display_name ?? v.displayName,
          email: (savedRow as any).email ?? v.email,
          phone: (savedRow as any).phone ?? v.phone,
          isArchived: !!(savedRow as any).is_archived,
          createdAt: (savedRow as any).created_at ?? resolvedUser.createdAt,
          firstLoginAt: (savedRow as any).first_login_at ?? resolvedUser.firstLoginAt ?? null,
  
          titleBefore: (savedRow as any).title_before ?? (resolvedUser as any).titleBefore ?? null,
          firstName: (savedRow as any).first_name ?? (resolvedUser as any).firstName ?? null,
          lastName: (savedRow as any).last_name ?? (resolvedUser as any).lastName ?? null,
          login: (savedRow as any).login ?? (resolvedUser as any).login ?? null,
  
          roleCode: rc,
        }
  
        setResolvedUser(saved)
  
        const nextForm = buildInitialFormValue(saved)
        setFormValue(nextForm)
        initialSnapshotRef.current = JSON.stringify(nextForm)
        firstRenderRef.current = true
  
        roleCodeInitialRef.current = rc
        permissionCodeInitialRef.current = pc
  
        setIsDirty(false)
        onDirtyChange?.(false)
  
        alert('Uživatel uložen ✅')
        return saved
      } catch (e: any) {
        console.error('[UserDetailFrame.save] ERROR', e)
        alert(e?.message ?? 'Chyba uložení uživatele')
        return null
      }
    })
  }, [onRegisterSubmit, formValue, resolvedUser, roleCode, permissionCode, onDirtyChange])



  
  // [PART SUBMIT END]  // =====================
  // 6) RENDER
  // =====================

  const roleNameByCode = useMemo(() => {
    const map = new Map<string, string>()
    for (const r of roleTypes ?? []) {
      const c = String((r as any)?.code ?? '').trim()
      const n = String((r as any)?.name ?? '').trim()
      if (c) map.set(c, n || c)
    }
    return map
  }, [roleTypes])

  const permNameByCode = useMemo(() => {
    const map = new Map<string, { name: string; description?: string | null }>()
    for (const p of permissionTypes ?? []) {
      const c = String((p as any)?.code ?? '').trim()
      const n = String((p as any)?.name ?? '').trim()
      const d = (p as any)?.description ?? null
      if (c) map.set(c, { name: n || c, description: d })
    }
    return map
  }, [permissionTypes])

  const rolesData = useMemo<RolesData>(() => {
    const currentCode = (roleCode ?? '').trim()
    const currentName =
      (currentCode && roleNameByCode.get(currentCode)) ||
      (resolvedUser as any)?.roleLabel ||
      (currentCode ? currentCode : '—')
    const pc = (permissionCode ?? '').trim()
    const selectedPerms = pc
      ? [
          {
            code: pc,
            name: permNameByCode.get(pc)?.name ?? pc,
            description: permNameByCode.get(pc)?.description ?? null,
          },
        ]
      : []

    const availablePerms = (permissionTypes ?? []).map((p) => ({
      code: String((p as any)?.code ?? '').trim(),
      name: String((p as any)?.name ?? (p as any)?.code ?? '').trim(),
      description: ((p as any)?.description ?? null) as any,
    }))

    return {
      role: currentCode ? { code: currentCode, name: currentName } : undefined,
      permissions: selectedPerms,
      availableRoles: (roleTypes ?? []).map((r: any) => ({
        code: String(r.code ?? '').trim(),
        name: String(r.name ?? r.code ?? '').trim(),
        description: (r.description ?? null) as any,
      })),
      availablePermissions: availablePerms,
    }
  }, [permissionCode, permissionTypes, permNameByCode, resolvedUser, roleCode, roleNameByCode, roleTypes])

  const detailMode: DetailViewMode =
    viewMode === 'read' ? 'view' : viewMode === 'edit' ? 'edit' : viewMode === 'create' ? 'create' : 'view'

  const rolesUi = useMemo<RolesUi>(() => {
    return {
      canEdit: detailMode !== 'view',
      mode: detailMode,

      roleCode: (roleCode ?? '').trim() || null,
      onChangeRoleCode: (next) => {
        const nextCode = String(next ?? '').trim()
        setRoleCode(nextCode)
        computeDirty(undefined, nextCode)
      },

      permissionCode: (permissionCode ?? '').trim() || null,
      onChangePermissionCode: (next) => {
        const nextCode = String(next ?? '').trim()
        setPermissionCode(nextCode)
        computeDirty(undefined, undefined, nextCode)
      },
    }
  }, [detailMode, permissionCode, roleCode]) // eslint-disable-line react-hooks/exhaustive-deps

  const canShowInviteTab = useMemo(() => {
    if (!resolvedUser?.id?.trim()) return false
    if (resolvedUser.firstLoginAt) return false
    if (!resolvedUser.email?.trim()) return false
    return true
  }, [resolvedUser?.id, resolvedUser?.firstLoginAt, resolvedUser?.email])

  // invite state
  const [latestInvite, setLatestInvite] = useState<any>(null)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadInvite() {
      // only for persisted users
      if (!resolvedUser?.id?.trim()) return
      if (viewMode === 'create' || isNewId(resolvedUser?.id)) {
        setLatestInvite(null)
        setInviteError(null)
        setInviteLoading(false)
        return
      }

      try {
        setInviteLoading(true)
        setInviteError(null)

        // načteme poslední pozvánku vždy (kvůli System tab)
        const res = await getLatestInviteForSubject(resolvedUser.id)
        if (!mounted) return
        setLatestInvite(res)
      } catch (e: any) {
        if (!mounted) return
        setInviteError(e?.message ?? 'Chyba načtení pozvánky')
        setLatestInvite(null)
      } finally {
        if (!mounted) return
        setInviteLoading(false)
      }
    }

    void loadInvite()
    return () => {
      mounted = false
    }
  }, [resolvedUser?.id, viewMode])

  // Register invite submit
  const inviteSubmitRef = useRef<null | (() => Promise<boolean>)>(null)

  useEffect(() => {
    if (!onRegisterInviteSubmit) return

    inviteSubmitRef.current = async () => {
      try {
        if (!canShowInviteTab) {
          alert('Pozvánka nedává smysl: uživatel je aktivní nebo nemá email.')
          return false
        }

        const rc = (roleCode ?? '').trim()
        if (!rc) {
          alert('Chybí role – nejdřív vyber roli.')
          return false
        }

        const pc = (permissionCode ?? '').trim()
        if (!pc) {
          alert('Chybí oprávnění – nejdřív vyber oprávnění.')
          return false
        }

        const payload: InviteFormValue = {
          mode: 'existing',
          subjectId: resolvedUser.id,
          email: resolvedUser.email,
          displayName: resolvedUser.displayName ?? '',
          roleCode: rc,
          permissionCode: pc,
          note: 'Nová pozvánka vytvořena z detailu uživatele (předchozí pending expirovány).',
        }

        await sendInvite(payload)

        const refreshed = await getLatestInviteForSubject(resolvedUser.id)
        setLatestInvite(refreshed)

        alert('Vytvořena nová pozvánka ✅')
        return true
      } catch (e: any) {
        console.error('[UserDetailFrame.sendInvite] ERROR', e)
        alert(e?.message ?? 'Chyba při vytváření pozvánky')
        return false
      }
    }

    onRegisterInviteSubmit(inviteSubmitRef.current)
  }, [
    onRegisterInviteSubmit,
    canShowInviteTab,
    permissionCode,
    resolvedUser?.displayName,
    resolvedUser?.email,
    resolvedUser?.id,
    roleCode,
  ])
  
  const inviteContent = useMemo(() => {
    if (!canShowInviteTab) return null

    if (inviteLoading) return <div className="detail-view__placeholder">Načítám pozvánku…</div>
    if (inviteError)
      return (
        <div className="detail-view__placeholder">
          Chyba: <strong>{inviteError}</strong>
        </div>
      )

    void latestInvite // zatím jen držíme v paměti

    return (
      <div className="detail-form">
        <section className="detail-form__section">
          <h3 className="detail-form__section-title">Pozvánka</h3>

          <div className="detail-form__grid detail-form__grid--narrow">
            <div className="detail-form__field detail-form__field--span-4">
              <label className="detail-form__label">
                E-mail <span className="detail-form__required">*</span>
              </label>
              <input className="detail-form__input detail-form__input--readonly" value={resolvedUser.email ?? '—'} readOnly />
            </div>

            <div className="detail-form__field detail-form__field--span-4">
              <label className="detail-form__label">
                Role <span className="detail-form__required">*</span>
              </label>
              <input className="detail-form__input detail-form__input--readonly" value={(rolesData as any)?.role?.name ?? '—'} readOnly />
            </div>
            <div className="detail-form__field detail-form__field--span-4">
              <label className="detail-form__label">
                Oprávnění <span className="detail-form__required">*</span>
              </label>
              <input
                className="detail-form__input detail-form__input--readonly"
                value={(rolesData as any)?.permissions?.[0]?.name ?? '—'}
                readOnly
              />
            </div>
          </div>
        </section>
      </div>
    )
  }, [canShowInviteTab, inviteError, inviteLoading, latestInvite, resolvedUser.email, rolesData])

  const systemBlocks = useMemo(() => {
    const isActive = !!resolvedUser.firstLoginAt
    const hasEmail = !!resolvedUser.email?.trim()

    const canSendInvite = !isActive && hasEmail
    const inviteReason = isActive
      ? 'Uživatel je aktivní (už se přihlásil) – pozvánka se znovu neposílá.'
      : !hasEmail
        ? 'Chybí e-mail – pozvánku nelze odeslat.'
        : 'Uživatel ještě není aktivní – pozvánku lze odeslat / obnovit.'

    const inv: any = latestInvite ?? null
    const invStatus = inv?.status ?? '—'
    const invCreatedAt = inv?.created_at ?? '—'
    const invSentAt = inv?.sent_at ?? '—'
    const invExpiresAt = inv?.expires_at ?? inv?.valid_until ?? '—'

    return [
      {
        title: 'Systém uživatele',
        content: (
          <div className="detail-form__grid detail-form__grid--narrow">
            <div className="detail-form__field detail-form__field--span-4">
              <label className="detail-form__label">Vytvořeno</label>
              <input
                className="detail-form__input detail-form__input--readonly"
                value={formatDateTime(resolvedUser.createdAt)}
                readOnly
              />
            </div>
      
            <div className="detail-form__field detail-form__field--span-4">
              <label className="detail-form__label">První přihlášení</label>
              <input
                className="detail-form__input detail-form__input--readonly"
                value={formatDateTime(resolvedUser.firstLoginAt)}
                readOnly
              />
            </div>
          </div>
        ),
      },

      {
        title: 'Pozvánka',
        content: (
          <div className="detail-form__grid detail-form__grid--narrow">
            <div className="detail-form__field detail-form__field--span-4">
              <label className="detail-form__label">Stav uživatele</label>
              <input className="detail-form__input detail-form__input--readonly" value={isActive ? 'Aktivní' : 'Neaktivní'} readOnly />
            </div>

            <div className="detail-form__field detail-form__field--span-4">
              <label className="detail-form__label">Lze odeslat pozvánku</label>
              <input className="detail-form__input detail-form__input--readonly" value={canSendInvite ? 'Ano' : 'Ne'} readOnly />
            </div>

            <div className="detail-form__field detail-form__field--span-4">
              <label className="detail-form__label">Poznámka</label>
              <input className="detail-form__input detail-form__input--readonly" value={inviteReason} readOnly />
            </div>

            <div className="detail-form__field detail-form__field--span-4">
              <label className="detail-form__label">Poslední pozvánka – status</label>
              <input
                className="detail-form__input detail-form__input--readonly"
                value={inviteLoading ? 'Načítám…' : inviteError ? `Chyba: ${inviteError}` : String(invStatus)}
                readOnly
              />
            </div>

            <div className="detail-form__field detail-form__field--span-4">
              <label className="detail-form__label">Vytvořeno</label>
              <input className="detail-form__input detail-form__input--readonly" value={String(invCreatedAt)} readOnly />
            </div>

            <div className="detail-form__field detail-form__field--span-4">
              <label className="detail-form__label">Odesláno</label>
              <input className="detail-form__input detail-form__input--readonly" value={String(invSentAt)} readOnly />
            </div>

            <div className="detail-form__field detail-form__field--span-4">
              <label className="detail-form__label">Platí do</label>
              <input className="detail-form__input detail-form__input--readonly" value={String(invExpiresAt)} readOnly />
            </div>
          </div>
        ),
      },
    ]
  }, [
    inviteError,
    inviteLoading,
    latestInvite,
    resolvedUser.createdAt,
    resolvedUser.email,
    resolvedUser.firstLoginAt,
    resolvedUser.isArchived,
  ])

  const sectionIds = useMemo<DetailSectionId[]>(() => {
    const base: DetailSectionId[] = ['detail', 'roles', 'attachments', 'system']
    if (canShowInviteTab) base.splice(2, 0, 'invite')
    return base
  }, [canShowInviteTab])

  return (
    <DetailView
      mode={detailMode}
      sectionIds={sectionIds}
      initialActiveId={initialSectionId ?? 'detail'}
      onActiveSectionChange={(id) => onActiveSectionChange?.(id)}
      ctx={{
        entityType: 'subjects',
        entityId: resolvedUser.id || undefined,
        entityLabel: resolvedUser.displayName ?? null,
        mode: detailMode,

        detailContent: (
          <UserDetailForm
            user={resolvedUser}
            readOnly={viewMode === 'read'}
            onDirtyChange={(dirty) => {
              if (!dirty) computeDirty()
            }}
            onValueChange={(val: any) => {
              setFormValue(val as UserFormValue)
              markDirtyIfChanged(val)
            }}
          />
        ),

        rolesData,
        rolesUi,

        inviteContent,
        systemBlocks,
      }}
    />
  )
}
