'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import DetailView, { type DetailSectionId, type DetailViewMode, type RolesData, type RolesUi } from '@/app/UI/DetailView'
import type { ViewMode } from '@/app/UI/CommonActions'

import UserDetailForm, { type UserFormValue } from './UserDetailForm'
import { getLatestInviteForSubject, sendInvite } from '@/app/lib/services/invites'
import type { InviteFormValue } from './InviteUserForm'
import { saveUser } from '@/app/lib/services/users'
import { fetchRoleTypes, type RoleTypeRow } from '@/app/modules/900-nastaveni/services/roleTypes'

import {
  listPermissionTypes,
  listSubjectPermissionCodes,
  type PermissionTypeRow,
} from '@/app/lib/services/permissions'

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

export default function UserDetailFrame({
  user,
  viewMode,
  initialSectionId,
  onActiveSectionChange,
  onRegisterSubmit,
  onRegisterInviteSubmit,
  onDirtyChange,
}: Props) {
  // -----------------------------
  // Dirty
  // -----------------------------
  const [isDirty, setIsDirty] = useState(false)
  const initialSnapshotRef = useRef<string>('')
  const firstRenderRef = useRef(true)

  const [formValue, setFormValue] = useState<UserFormValue>(() => buildInitialFormValue(user))

  // Role
  const [roleCode, setRoleCode] = useState<string>(() => ((user as any)?.roleCode ?? '').toString())
  const roleCodeInitialRef = useRef<string>('')

  // ✅ Permission (SINGLE)
  const [permissionTypes, setPermissionTypes] = useState<PermissionTypeRow[]>([])
  const [permissionCode, setPermissionCode] = useState<string>('') // '' = žádné
  const permissionCodeInitialRef = useRef<string>('')

  const permTypesInFlightRef = useRef<Promise<void> | null>(null)

  useEffect(() => {
    const init = buildInitialFormValue(user)
    setFormValue(init)

    const rc = ((user as any)?.roleCode ?? '').toString()
    setRoleCode(rc)
    roleCodeInitialRef.current = rc

    initialSnapshotRef.current = JSON.stringify(init)
    firstRenderRef.current = true

    setIsDirty(false)
    onDirtyChange?.(false)
  }, [user?.id, viewMode]) // eslint-disable-line react-hooks/exhaustive-deps

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
  // Role types (900)
  // -----------------------------
  const [roleTypes, setRoleTypes] = useState<RoleTypeRow[]>([])
  const roleTypesInFlightRef = useRef<Promise<void> | null>(null)

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

  const roleNameByCode = useMemo(() => {
    const map = new Map<string, string>()
    for (const r of roleTypes ?? []) {
      const c = String((r as any)?.code ?? '').trim()
      const n = String((r as any)?.name ?? '').trim()
      if (c) map.set(c, n || c)
    }
    return map
  }, [roleTypes])

  // -----------------------------
  // Permission types (900) – load once
  // -----------------------------
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

  // -----------------------------
  // Subject permissions (010) – reload on user change
  // -----------------------------
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        if (!user?.id?.trim()) {
          setPermissionCode('')
          permissionCodeInitialRef.current = ''
          return
        }
        const codes = await listSubjectPermissionCodes(user.id)
        if (!mounted) return

        const first = String((codes?.[0] ?? '')).trim()
        setPermissionCode(first)
        permissionCodeInitialRef.current = first

        computeDirty(undefined, undefined, first)
      } catch (e) {
        console.warn('[UserDetailFrame.listSubjectPermissionCodes] WARN', e)
        if (!mounted) return
        setPermissionCode('')
        permissionCodeInitialRef.current = ''
        computeDirty(undefined, undefined, '')
      }
    })()
    return () => {
      mounted = false
    }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // -----------------------------
  // Invite state (latest invite)
  // -----------------------------
  const [latestInvite, setLatestInvite] = useState<any>(null)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)

  const canShowInviteTab = useMemo(() => {
    if (!user?.id?.trim()) return false
    if (user.firstLoginAt) return false
    if (!user.email?.trim()) return false
    return true
  }, [user?.id, user?.firstLoginAt, user?.email])

  useEffect(() => {
    let mounted = true
    async function loadInvite() {
      if (!user?.id?.trim()) return
      if (!canShowInviteTab) {
        setLatestInvite(null)
        setInviteError(null)
        setInviteLoading(false)
        return
      }
      try {
        setInviteLoading(true)
        setInviteError(null)
        const res = await getLatestInviteForSubject(user.id)
        if (!mounted) return
        setLatestInvite(res)
      } catch (e: any) {
        if (!mounted) return
        setInviteError(e?.message ?? 'Chyba načtení pozvánky')
      } finally {
        if (!mounted) return
        setInviteLoading(false)
      }
    }
    void loadInvite()
    return () => {
      mounted = false
    }
  }, [user?.id, canShowInviteTab])

  // -----------------------------
  // Roles data (single permission)
  // -----------------------------
  const rolesData = useMemo<RolesData>(() => {
    const currentCode = (roleCode ?? '').trim()
    const currentName =
      (currentCode && roleNameByCode.get(currentCode)) || (user as any)?.roleLabel || (currentCode ? currentCode : '—')

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
  }, [roleCode, roleNameByCode, roleTypes, user, permissionCode, permissionTypes, permNameByCode])

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

      // ✅ SINGLE permission
      permissionCode: (permissionCode ?? '').trim() || null,
      onChangePermissionCode: (next) => {
        const nextCode = String(next ?? '').trim()
        setPermissionCode(nextCode)
        computeDirty(undefined, undefined, nextCode)
      },
    }
  }, [detailMode, roleCode, permissionCode]) // eslint-disable-line react-hooks/exhaustive-deps

  // -----------------------------
  // Invite submit (CommonActions)
  // -----------------------------
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

        const payload: InviteFormValue = {
          mode: 'existing',
          subjectId: user.id,
          email: user.email,
          displayName: user.displayName ?? '',
          roleCode: rc,
          note: 'Nová pozvánka vytvořena z detailu uživatele (předchozí pending expirovány).',
        }

        await sendInvite(payload)

        const refreshed = await getLatestInviteForSubject(user.id)
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
  }, [onRegisterInviteSubmit, user?.id, user?.email, user?.displayName, canShowInviteTab, roleCode])

  // -----------------------------
  // ✅ SUBMIT – ukládá subjects + subject_roles + subject_permissions (single)
  // -----------------------------
  useEffect(() => {
    if (!onRegisterSubmit) return

    onRegisterSubmit(async () => {
      try {
        const v = formValue ?? buildInitialFormValue(user)

        if (!v.displayName?.trim()) {
          alert('Zobrazované jméno je povinné.')
          return null
        }

        const pc = (permissionCode ?? '').trim()

        const savedRow = await saveUser({
          id: user?.id?.trim() ? user.id : 'new',
          subjectType: 'osoba',

          displayName: v.displayName,
          email: v.email,
          phone: v.phone,
          isArchived: v.isArchived,

          titleBefore: v.titleBefore,
          firstName: v.firstName,
          lastName: v.lastName,
          login: v.login,

          roleCode: (roleCode ?? '').trim() || null,

          // ✅ single => [] nebo [code]
          permissionCodes: pc ? [pc] : [],
        })

        const saved: UiUser = {
          ...user,
          id: (savedRow as any).id ?? user.id,
          displayName: (savedRow as any).display_name ?? v.displayName,
          email: (savedRow as any).email ?? v.email,
          phone: (savedRow as any).phone ?? v.phone,
          isArchived: !!(savedRow as any).is_archived,
          createdAt: (savedRow as any).created_at ?? user.createdAt,
          firstLoginAt: (savedRow as any).first_login_at ?? user.firstLoginAt ?? null,

          titleBefore: (savedRow as any).title_before ?? (user as any).titleBefore ?? null,
          firstName: (savedRow as any).first_name ?? (user as any).firstName ?? null,
          lastName: (savedRow as any).last_name ?? (user as any).lastName ?? null,
          login: (savedRow as any).login ?? (user as any).login ?? null,

          roleCode: (roleCode ?? '').trim() || null,
        }

        // reset dirty snapshot
        const nextForm = buildInitialFormValue(saved)
        setFormValue(nextForm)
        initialSnapshotRef.current = JSON.stringify(nextForm)
        firstRenderRef.current = true

        roleCodeInitialRef.current = (roleCode ?? '').trim()
        permissionCodeInitialRef.current = (permissionCode ?? '').trim()

        setIsDirty(false)
        onDirtyChange?.(false)

        return saved
      } catch (e: any) {
        console.error('[UserDetailFrame.save] ERROR', e)
        alert(e?.message ?? 'Chyba uložení uživatele')
        return null
      }
    })
  }, [onRegisterSubmit, formValue, user, roleCode, permissionCode, onDirtyChange])

  // -----------------------------
  // Invite tab content (OK)
  // -----------------------------
  const inviteContent = useMemo(() => {
    if (!canShowInviteTab) return null
  
    if (inviteLoading) return <div className="detail-view__placeholder">Načítám pozvánku…</div>
    if (inviteError)
      return (
        <div className="detail-view__placeholder">
          Chyba: <strong>{inviteError}</strong>
        </div>
      )
  
    // stejné zarovnání labelů jako u "Role a oprávnění"
    const LABEL_W = 140
    const FIELD_MAX_W = 420
  
    const FieldRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
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
  
    // data pro role/oprávnění
    const data: any = rolesData
    const ui: any = rolesUi
  
    const role = data?.role
    const permissions = data?.permissions ?? []
    const roleOptions = data?.availableRoles ?? []
    const permOptions = data?.availablePermissions ?? []
  
    const ensuredRoleOptions =
      role?.code && !roleOptions.some((r: any) => r.code === role.code)
        ? [{ code: role.code, name: role.name ?? role.code, description: role.description }, ...roleOptions]
        : roleOptions
  
    const selectedRoleCode = (ui?.roleCode ?? role?.code ?? '') as string
  
    // SINGLE permission (1 hodnota)
    const selectedPermFromData = (permissions[0]?.code ?? '') as string
    const selectedPermCode = (ui?.permissionCode ?? selectedPermFromData ?? '') as string
  
    const canEdit = !!ui?.canEdit
    const mode = ui?.mode ?? 'view'
  
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
          {ensuredRoleOptions.map((r: any) => (
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
  
    const permControl =
      (mode === 'edit' || mode === 'create') && canEdit && typeof ui?.onChangePermissionCode === 'function' ? (
        <select
          className="detail-form__input"
          style={{ maxWidth: FIELD_MAX_W }}
          value={(selectedPermCode ?? '') as string}
          onChange={(e) => ui?.onChangePermissionCode?.(e.target.value)}
        >
          <option value="" disabled>
            — vyber oprávnění —
          </option>
          {permOptions.map((p: any) => (
            <option key={p.code} value={p.code}>
              {p.name ?? p.code}
            </option>
          ))}
        </select>
      ) : (
        <input
          className="detail-form__input detail-form__input--readonly"
          style={{ maxWidth: FIELD_MAX_W }}
          value={selectedPermCode ? permOptions.find((p: any) => p.code === selectedPermCode)?.name ?? selectedPermCode : '—'}
          readOnly
        />
      )
  
    return (
      <div className="detail-form">
        <section className="detail-form__section">
          <h3 className="detail-form__section-title">Pozvánka</h3>
  
          <div style={{ display: 'grid', gap: 14 }}>
            <FieldRow label="E-mail">
              <input className="detail-form__input detail-form__input--readonly" style={{ maxWidth: FIELD_MAX_W }} value={user.email ?? '—'} readOnly />
            </FieldRow>
  
            <FieldRow label="Role">{roleControl}</FieldRow>
            <FieldRow label="Oprávnění">{permControl}</FieldRow>
          </div>
        </section>
      </div>
    )
  }, [canShowInviteTab, inviteLoading, inviteError, user.email, rolesData, rolesUi])

  
  // -----------------------------
  // System blocks (ponecháno)
  // -----------------------------
  const systemBlocks = useMemo(() => {
    return [
      {
        title: 'Systém uživatele',
        content: (
          <div className="detail-form__grid detail-form__grid--narrow">
            <div className="detail-form__field detail-form__field--span-4">
              <label className="detail-form__label">Vytvořeno</label>
              <input className="detail-form__input detail-form__input--readonly" value={user.createdAt ?? '—'} readOnly />
            </div>
            <div className="detail-form__field detail-form__field--span-4">
              <label className="detail-form__label">První přihlášení</label>
              <input className="detail-form__input detail-form__input--readonly" value={user.firstLoginAt ?? '—'} readOnly />
            </div>
            <div className="detail-form__field detail-form__field--span-4">
              <label className="detail-form__label">Archivován</label>
              <input className="detail-form__input detail-form__input--readonly" value={user.isArchived ? 'Ano' : 'Ne'} readOnly />
            </div>
          </div>
        ),
      },
    ]
  }, [user.createdAt, user.firstLoginAt, user.isArchived])

  // Sections
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
        entityId: user.id || undefined,
        entityLabel: user.displayName ?? null,
        mode: detailMode,

        detailContent: (
          <UserDetailForm
            user={user}
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
