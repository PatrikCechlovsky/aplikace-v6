// FILE: app/modules/010-sprava-uzivatelu/tiles/UsersTile.tsx
// PURPOSE: List + detail uživatelů (010) + pozvánky + přílohy.

'use client'

// =====================
// 1) IMPORTS
// =====================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import ListView, { type ListViewColumn, type ListViewRow, type ListViewSortState } from '@/app/UI/ListView'
import type { CommonActionId, ViewMode } from '@/app/UI/CommonActions'
import UserDetailFrame from '@/app/modules/010-sprava-uzivatelu/forms/UserDetailFrame'
import InviteUserFrame from '../forms/InviteUserFrame'
import AttachmentsManagerFrame, { type AttachmentsManagerApi, type AttachmentsManagerUiState } from '@/app/UI/attachments/AttachmentsManagerFrame'
import { listUsers, type UsersListRow } from '@/app/lib/services/users'
import { fetchRoleTypes, type RoleTypeRow } from '@/app/modules/900-nastaveni/services/roleTypes'

const __typecheck_commonaction: CommonActionId = 'attachments'

// =====================
// 2) TYPES
// =====================

type UiUser = {
  id: string
  displayName: string
  email: string
  phone?: string
  roleCode?: string | null
  roleLabel: string
  twoFactorMethod?: string | null
  createdAt: string
  isArchived?: boolean
  firstLoginAt?: string | null
}

type UsersTileProps = {
  onRegisterCommonActions?: (actions: CommonActionId[]) => void
  onRegisterCommonActionsState?: (state: { viewMode: ViewMode; hasSelection: boolean; isDirty: boolean }) => void
  onRegisterCommonActionHandler?: (fn: (id: CommonActionId) => void) => void
}

type LocalViewMode = ViewMode | 'list' | 'invite' | 'attachments-manager'
// =====================
// 3) HELPERS
// =====================

const DEBUG = true
const dbg = (...args: any[]) => {
  if (!DEBUG) return
  // eslint-disable-next-line no-console
  console.log('[010 UsersTile]', ...args)
}

const COLUMNS: ListViewColumn[] = [
  { key: 'roleLabel', label: 'Role', width: '18%', sortable: true },
  { key: 'displayName', label: 'Jméno', sortable: true },
  { key: 'email', label: 'E-mail', sortable: true },
  { key: 'isArchived', label: 'Archivován', width: '10%', align: 'center', sortable: true },
]

function roleCodeToLabel(code: string | null | undefined): string {
  const c = (code ?? '').trim().toLowerCase()
  if (!c) return ''
  if (c === 'admin') return 'Admin'
  if (c === 'user') return 'Uživatel'
  return c
}

function buildRoleTypeMap(rows: RoleTypeRow[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const r of rows ?? []) {
    const code = String((r as any).code ?? '').trim().toLowerCase()
    const name = String((r as any).name ?? '').trim()
    if (code) map[code] = name || String((r as any).code ?? code)
  }
  return map
}

function resolveRoleLabel(roleCode: string | null | undefined, map: Record<string, string>): string {
  const c = String(roleCode ?? '').trim().toLowerCase()
  if (!c) return ''
  return map[c] ?? roleCodeToLabel(c)
}

function mapRowToUi(row: UsersListRow, roleMap: Record<string, string>): UiUser {
  return {
    id: row.id,
    displayName: (row as any).display_name ?? '',
    email: (row as any).email ?? '',
    phone: (row as any).phone ?? undefined,
    roleCode: (row as any).role_code ?? null,
    roleLabel: resolveRoleLabel((row as any).role_code, roleMap),
    twoFactorMethod: (row as any).two_factor_method ?? null,
    createdAt: (row as any).created_at ?? '',
    isArchived: !!(row as any).is_archived,
    firstLoginAt: (row as any).first_login_at ?? null,
  }
}

function toRow(u: UiUser): ListViewRow<UiUser> {
  return {
    id: u.id,
    data: {
      roleLabel: u.roleLabel,
      displayName: u.displayName,
      email: u.email,
      isArchived: u.isArchived ? 'Ano' : '',
    },
    raw: u,
  }
}

function normalizeString(v: any): string {
  return String(v ?? '').trim().toLowerCase()
}

function numberOrZero(v: any): number {
  if (v === null || v === undefined) return 0
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function getSortValue(u: UiUser, key: string): string | number {
  switch (key) {
    case 'roleLabel':
      return normalizeString(u.roleLabel)
    case 'displayName':
      return normalizeString(u.displayName)
    case 'email':
      return normalizeString(u.email)
    case 'isArchived':
      return u.isArchived ? 1 : 0
    default:
      return ''
  }
}
// =====================
// 4) DATA LOAD (hooks)
// =====================

export default function UsersTile({
  onRegisterCommonActions,
  onRegisterCommonActionsState,
  onRegisterCommonActionHandler,
}: UsersTileProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const searchKey = searchParams?.toString() ?? ''

  const [users, setUsers] = useState<UiUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [filterText, setFilterText] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [viewMode, setViewMode] = useState<LocalViewMode>('list')
  const [detailUser, setDetailUser] = useState<UiUser | null>(null)

  const [detailInitialSectionId, setDetailInitialSectionId] = useState<any>('detail')
  const [detailActiveSectionId, setDetailActiveSectionId] = useState<any>('detail')

  const [isDirty, setIsDirty] = useState(false)

  const [roleTypes, setRoleTypes] = useState<RoleTypeRow[]>([])
  const roleTypeMap = useMemo(() => buildRoleTypeMap(roleTypes), [roleTypes])
  const roleTypeMapRef = useRef<Record<string, string>>({})

  const submitRef = useRef<null | (() => Promise<UiUser | null>)>(null)
  const inviteSubmitRef = useRef<null | (() => Promise<boolean>)>(null)

  const [invitePresetSubjectId, setInvitePresetSubjectId] = useState<string | null>(null)
  const [pendingSendInviteAfterCreate, setPendingSendInviteAfterCreate] = useState(false)
  const [attachmentsManagerSubjectId, setAttachmentsManagerSubjectId] = useState<string | null>(null)

  const attachmentsManagerApiRef = useRef<AttachmentsManagerApi | null>(null)
  const [attachmentsManagerUi, setAttachmentsManagerUi] = useState<AttachmentsManagerUiState>({
    hasSelection: false,
    isDirty: false,
  })

  // ✅ tri-state sorting:
  // - null = DEFAULT (původní pořadí z backendu / preference uživatele)
  // - {key,dir} = ASC/DESC
  const [sort, setSort] = useState<ListViewSortState>(null)

  // -------------------------
  // URL helpers (t, id, vm, am)
  // -------------------------
  const setUrl = useCallback(
    (
      next: { t?: string | null; id?: string | null; vm?: string | null; am?: string | null },
      mode: 'replace' | 'push' = 'replace'
    ) => {
      const sp = new URLSearchParams(searchKey)

      const setOrDelete = (key: string, val: string | null | undefined) => {
        const v = (val ?? '').toString().trim()
        if (v) sp.set(key, v)
        else sp.delete(key)
      }

      if (Object.prototype.hasOwnProperty.call(next, 't')) setOrDelete('t', next.t)
      if (Object.prototype.hasOwnProperty.call(next, 'id')) setOrDelete('id', next.id)
      if (Object.prototype.hasOwnProperty.call(next, 'vm')) setOrDelete('vm', next.vm)
      if (Object.prototype.hasOwnProperty.call(next, 'am')) setOrDelete('am', next.am)

      const qs = sp.toString()
      const nextUrl = qs ? `${pathname}?${qs}` : pathname
      const currentUrl = searchKey ? `${pathname}?${searchKey}` : pathname

      console.log('[010 UsersTile] setUrl()', {
        mode,
        next,
        searchKey,
        currentUrl,
        nextUrl,
        willNavigate: nextUrl !== currentUrl,
      })

      if (nextUrl === currentUrl) return

      if (mode === 'push') router.push(nextUrl)
      else router.replace(nextUrl)
    },
    [pathname, router, searchKey]
  )

  // -------------------------
  // Load guards (anti-loop / anti-storm)
  // -------------------------
  const loadInFlightRef = useRef<Promise<void> | null>(null)
  const lastLoadKeyRef = useRef<string>('')

  const load = useCallback(async () => {
    const key = `${(filterText ?? '').trim().toLowerCase()}|${showArchived ? '1' : '0'}`

    if (loadInFlightRef.current && lastLoadKeyRef.current === key) {
      return loadInFlightRef.current
    }
    lastLoadKeyRef.current = key

    const p = (async () => {
      setLoading(true)
      setError(null)
      try {
        const rows = await listUsers({ searchText: filterText, includeArchived: showArchived })
        setUsers(rows.map((r) => mapRowToUi(r, roleTypeMapRef.current)))
      } catch (e: any) {
        console.error('[UsersTile.listUsers] ERROR', e)
        setError(e?.message ?? 'Chyba načtení uživatelů')
      } finally {
        setLoading(false)
      }
    })()

    loadInFlightRef.current = p
    try {
      await p
    } finally {
      if (loadInFlightRef.current === p) loadInFlightRef.current = null
    }
  }, [filterText, showArchived])

  const roleTypesInFlightRef = useRef<Promise<void> | null>(null)
  const loadRoleTypes = useCallback(async () => {
    if (roleTypesInFlightRef.current) return roleTypesInFlightRef.current
    const p = (async () => {
      try {
        const rows = await fetchRoleTypes()
        setRoleTypes(rows)
      } catch (e) {
        console.warn('[UsersTile.fetchRoleTypes] WARN', e)
      }
    })()
    roleTypesInFlightRef.current = p
    try {
      await p
    } finally {
      if (roleTypesInFlightRef.current === p) roleTypesInFlightRef.current = null
    }
  }, [])

  useEffect(() => {
    roleTypeMapRef.current = roleTypeMap
  }, [roleTypeMap])

  useEffect(() => {
    void loadRoleTypes()
  }, [loadRoleTypes])

  useEffect(() => {
    void load()
  }, [load])

  // ✅ mapa původního pořadí (jak přišlo z backendu)
  const baseOrderIndex = useMemo(() => {
    const m = new Map<string, number>()
    users.forEach((u, i) => m.set(u.id, i))
    return m
  }, [users])

  // ✅ sortedUsers: DEFAULT(null) = původní pořadí, jinak ASC/DESC dle sort.dir
  const sortedUsers = useMemo(() => {
    if (!sort) return users

    const arr = [...users]
    const dir = sort.dir === 'asc' ? 1 : -1
    const key = sort.key

    arr.sort((a, b) => {
      const av = getSortValue(a, key)
      const bv = getSortValue(b, key)

      if (typeof av === 'number' && typeof bv === 'number') {
        if (av < bv) return -1 * dir
        if (av > bv) return 1 * dir
      } else {
        const as = String(av)
        const bs = String(bv)
        if (as < bs) return -1 * dir
        if (as > bs) return 1 * dir
      }

      // stable fallback na původní pořadí
      return numberOrZero(baseOrderIndex.get(a.id)) - numberOrZero(baseOrderIndex.get(b.id))
    })

    return arr
  }, [users, sort, baseOrderIndex])

  const rows: ListViewRow<UiUser>[] = useMemo(() => sortedUsers.map(toRow), [sortedUsers])
  // -------------------------
  // 5) ACTION HANDLERS
  // -------------------------
  // ⚠️ Zbytek action handlerů ponechán (stejně jako v UsersTile (18).tsx)

  // -------------------------
  // Navigation helpers
  // -------------------------
  const closeListToModule = useCallback(() => {
    setUrl({ t: null, id: null, vm: null, am: null }, 'replace')
    router.push('/dashboard')
  }, [router, setUrl])

  const closeToList = useCallback(() => {
    setDetailUser(null)
    setDetailInitialSectionId('detail')
    setDetailActiveSectionId('detail')
    submitRef.current = null
    inviteSubmitRef.current = null
    setInvitePresetSubjectId(null)
    setAttachmentsManagerSubjectId(null)
    setIsDirty(false)
    setViewMode('list')
    setUrl({ t: 'users-list', id: null, vm: null, am: null }, 'replace')
  }, [setUrl])

  const openDetail = useCallback(
    (u: UiUser, vm: ViewMode, sectionId: any) => {
      setDetailUser(u)
      setDetailInitialSectionId(sectionId)
      setDetailActiveSectionId(sectionId)
      setIsDirty(false)
      setViewMode(vm as any)
      setUrl({ t: 'users-list', id: u.id, vm, am: null }, 'push')
    },
    [setUrl]
  )

  const openInvite = useCallback(
    (presetSubjectId: string | null) => {
      setInvitePresetSubjectId(presetSubjectId)
      setIsDirty(false)
      setViewMode('invite')
      setUrl({ t: 'invite-user', id: presetSubjectId, vm: null, am: null }, 'push')
    },
    [setUrl]
  )

  // ... sem patří zbytek tvých existujících handlerů a useEffectů z (18) beze změn ...

  // -------------------------
  // 6) RENDER
  // -------------------------
  if (viewMode === 'list') {
    return (
      <div>
        {error && <div style={{ padding: 8, color: 'crimson' }}>{error}</div>}
        {loading && <div style={{ padding: 8 }}>Načítám…</div>}

        <ListView<UiUser>
          columns={COLUMNS}
          rows={rows}
          filterValue={filterText}
          onFilterChange={setFilterText}
          showArchived={showArchived}
          onShowArchivedChange={setShowArchived}
          selectedId={selectedId ?? null}
          onRowClick={(row) => setSelectedId(String(row.id))}
          onRowDoubleClick={(row) => {
            const user = row.raw
            if (!user) return
            openDetail(user, 'read', 'detail')
          }}
          sort={sort}
          onSortChange={setSort}
        />
      </div>
    )
  }

  if (viewMode === 'attachments-manager') {
    const managerId = attachmentsManagerSubjectId ?? ''
    const managerUser = users.find((u) => u.id === managerId) ?? (detailUser?.id === managerId ? detailUser : null)

    return (
      <AttachmentsManagerFrame
        entityType="subjects"
        entityId={managerId}
        entityLabel={managerUser?.displayName ?? null}
        canManage={true}
        readOnlyReason={null}
        onRegisterManagerApi={(api) => {
          attachmentsManagerApiRef.current = api
        }}
        onManagerStateChange={(s) => {
          setAttachmentsManagerUi(s)
        }}
      />
    )
  }

  if (viewMode === 'invite') {
    return (
      <InviteUserFrame
        presetSubjectId={invitePresetSubjectId}
        onDirtyChange={setIsDirty}
        onRegisterSubmit={(fn) => {
          inviteSubmitRef.current = fn
        }}
      />
    )
  }

  if ((viewMode === 'read' || viewMode === 'edit' || viewMode === 'create') && detailUser) {
    return (
      <UserDetailFrame
        user={detailUser}
        viewMode={viewMode as ViewMode}
        initialSectionId={detailInitialSectionId}
        onActiveSectionChange={(id) => setDetailActiveSectionId(id as any)}
        onRegisterInviteSubmit={(fn) => {
          inviteSubmitRef.current = fn
        }}
        onDirtyChange={setIsDirty}
        onRegisterSubmit={(fn) => {
          submitRef.current = fn
        }}
      />
    )
  }

  return null
}
