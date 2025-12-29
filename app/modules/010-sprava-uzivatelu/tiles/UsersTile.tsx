'use client'

// FILE: app/modules/010-sprava-uzivatelu/tiles/UsersTile.tsx
// PURPOSE: List + detail uživatelů (010) + pozvánky + přílohy.
// URL state:
// - t=users-list (list + detail)
// - t=invite-user (invite screen)
// - t=attachments-manager (attachments manager screen)
// - id + vm (detail: read/edit/create)
//
// DEBUG:
// - zapni/vypni přes DEBUG konstantu níže
// - logujeme: clicky, close větve, setUrl compare, URL->state sync

// =====================
// 1) IMPORTS
// =====================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import ListView, { type ListViewColumn, type ListViewRow } from '@/app/UI/ListView'
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

// ✅ lokální režimy
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
  { key: 'roleLabel', label: 'Role', width: '18%' },
  { key: 'displayName', label: 'Jméno' },
  { key: 'email', label: 'E-mail' },
  { key: 'isArchived', label: 'Archivován', width: '10%', align: 'center' },
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

  // ✅ Attachments manager bridge (API + UI state)
  const attachmentsManagerApiRef = useRef<AttachmentsManagerApi | null>(null)
  const [attachmentsManagerUi, setAttachmentsManagerUi] = useState<AttachmentsManagerUiState>({
    hasSelection: false,
    isDirty: false,
  })

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

      // ✅ DŮLEŽITÉ: rozliš "klíč není v next" vs "klíč je v next a je null"
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

  const rows: ListViewRow<UiUser>[] = useMemo(() => users.map(toRow), [users])

  // -------------------------
  // Navigation helpers
  // -------------------------
  const closeListToModule = useCallback(() => {
    // zavřít modul 010 = jít na /dashboard
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

  // -------------------------
  // CommonActions list
  // -------------------------

  const commonActions = useMemo<CommonActionId[]>(() => {
    const LIST: CommonActionId[] = ['add', 'view', 'edit', 'invite', 'close']
    const INVITE: CommonActionId[] = ['sendInvite', 'close']
    const READ_DEFAULT: CommonActionId[] = ['edit', 'invite', 'close']
    const EDIT_DEFAULT: CommonActionId[] = ['save', 'invite', 'close']
    const CREATE_DEFAULT: CommonActionId[] = ['save', 'close']

    const withAttachmentsBeforeClose = (base: CommonActionId[]): CommonActionId[] => {
      // v invite sekci nechceme attachments tlačítko
      if (detailActiveSectionId === 'invite') return base

      const out: CommonActionId[] = base.includes('attachments') ? [...base] : [...base, 'attachments']

      // ✅ vynutit pořadí: attachments před close, close poslední
      const hasClose = out.includes('close')
      const filtered: CommonActionId[] = out.filter((x) => x !== 'attachments' && x !== 'close') as CommonActionId[]

      return hasClose ? ([...filtered, 'attachments', 'close'] as CommonActionId[]) : ([...filtered, 'attachments'] as CommonActionId[])
    }

    // LIST / INVITE
    if (viewMode === 'list') return withAttachmentsBeforeClose(LIST)
    if (viewMode === 'invite') return INVITE

    // ✅ ATTACHMENTS MANAGER (jen CommonActions, žádné lokální toolbary)
    if (viewMode === 'attachments-manager') {
      return ['attachmentsAdd', 'attachmentsEdit', 'attachmentsSave', 'attachmentsNewVersion', 'attachmentsHistory', 'close']
    }

    // READ
    if (viewMode === 'read') {
      if (detailActiveSectionId === 'invite') return INVITE
      return withAttachmentsBeforeClose(READ_DEFAULT)
    }

    // EDIT
    if (viewMode === 'edit') {
      return withAttachmentsBeforeClose(EDIT_DEFAULT)
    }

    // CREATE
    return withAttachmentsBeforeClose(CREATE_DEFAULT)
  }, [viewMode, detailActiveSectionId])

  // -------------------------
  // CommonActions handler
  // -------------------------
  useEffect(() => {
    if (!onRegisterCommonActionHandler) return

    dbg('register common action handler')

    const handler = async (actionId: CommonActionId) => {
      dbg('action click', actionId, { viewMode, isDirty, selectedId, detailUserId: detailUser?.id ?? null, searchKey })

      // =====================
      // ATTACHMENTS MANAGER ACTIONS (forward do API)
      // =====================
      if (viewMode === 'attachments-manager') {
        const api = attachmentsManagerApiRef.current

        if (actionId === 'attachmentsAdd') {
          api?.add()
          return
        }
        if (actionId === 'attachmentsEdit') {
          api?.editMeta()
          return
        }
        if (actionId === 'attachmentsSave') {
          await api?.save()
          return
        }
        if (actionId === 'attachmentsNewVersion') {
          api?.newVersion()
          return
        }
        if (actionId === 'attachmentsHistory') {
          api?.history()
          return
        }
        // close je níže, společné chování
      }

      // =====================
      // CLOSE
      // =====================
      if (actionId === 'close') {
        const dirtyNow = viewMode === 'attachments-manager' ? !!attachmentsManagerUi.isDirty : isDirty
        if (dirtyNow) {
          const ok = confirm('Máš neuložené změny. Opravdu chceš zavřít?')
          if (!ok) return
        }

        const sp = new URLSearchParams(searchKey)
        const t = sp.get('t')?.trim() ?? null

        dbg('close branch start', { t, viewMode })

        // 1) Attachments manager: zavřít správu příloh = zpět do detailu (attachments tab) nebo list
        if (viewMode === 'attachments-manager') {
          dbg('close -> attachments-manager back')
          const backId = attachmentsManagerSubjectId ?? detailUser?.id ?? null
          if (backId) {
            setDetailInitialSectionId('attachments')
            setDetailActiveSectionId('attachments')
            setUrl({ t: 'users-list', id: backId, vm: 'read', am: null }, 'replace')
            setViewMode('read')
          } else {
            closeToList()
          }
          return
        }

        // 2) Samostatný tile "Pozvat uživatele" (t=invite-user): CLOSE = zavřít modul 010
        if (t === 'invite-user') {
          dbg('close -> closeListToModule (t=invite-user)')
          closeListToModule()
          return
        }

        // 3) Detail: CLOSE = zavřít detail (zpět na seznam)
        if (viewMode === 'read' || viewMode === 'edit' || viewMode === 'create') {
          dbg('close -> closeToList (detail)')
          closeToList()
          return
        }

        // 4) List: CLOSE = zavřít modul 010
        dbg('close -> closeListToModule (list)')
        closeListToModule()
        return
      }

      // =====================
      // ATTACHMENTS (open manager screen)
      // =====================
      if (actionId === 'attachments') {
        if (viewMode === 'list') {
          dbg('attachments -> list', { selectedId })
          if (!selectedId) {
            alert('Nejdřív vyber uživatele v seznamu.')
            return
          }

          setAttachmentsManagerSubjectId(selectedId)
          setViewMode('attachments-manager')
          setIsDirty(false)
          setUrl({ t: 'users-list', id: selectedId, vm: null, am: '1' }, 'push')
          return
        }

        if (detailActiveSectionId === 'invite') return

        if (isDirty) {
          alert('Máš neuložené změny. Nejdřív ulož nebo zavři změny a pak otevři správu příloh.')
          return
        }

        if (!detailUser?.id || !detailUser.id.trim() || detailUser.id === 'new') {
          alert('Nejdřív ulož záznam, aby šly spravovat přílohy.')
          return
        }

        setAttachmentsManagerSubjectId(detailUser.id)
        setViewMode('attachments-manager')
        setIsDirty(false)
        setUrl({ t: 'users-list', id: detailUser.id, vm: null, am: '1' }, 'push')
        return
      }

      // =====================
      // LIST
      // =====================
      if (viewMode === 'list') {
        if (actionId === 'add') {
          setViewMode('create')

          const blank: UiUser = {
            id: 'new',
            displayName: '',
            email: '',
            roleLabel: '',
            createdAt: new Date().toISOString(),
          }

          setDetailUser(blank)
          setDetailInitialSectionId('detail')
          setDetailActiveSectionId('detail')
          setInvitePresetSubjectId(null)
          setAttachmentsManagerSubjectId(null)
          setIsDirty(false)
          submitRef.current = null
          inviteSubmitRef.current = null

          setUrl({ t: 'users-list', id: 'new', vm: 'create', am: null }, 'push')
          return
        }

        if (actionId === 'view' || actionId === 'edit') {
          if (!selectedId) return
          const u = users.find((x) => x.id === selectedId)
          if (!u) return
          openDetail(u, actionId === 'edit' ? 'edit' : 'read', 'detail')
          return
        }

        if (actionId === 'invite') {
          if (!selectedId) {
            openInvite(null)
            return
          }

          const u = users.find((x) => x.id === selectedId)
          if (!u) {
            openInvite(null)
            return
          }

          if (u.firstLoginAt) {
            alert('Uživatel se již přihlásil – pozvánku nelze poslat znovu.')
            return
          }

          openDetail(u, 'read', 'invite')
          return
        }

        return
      }

      // =====================
      // INVITE SCREEN
      // =====================
      if (viewMode === 'invite') {
        if (actionId === 'sendInvite') {
          if (!inviteSubmitRef.current) return
          const ok = await inviteSubmitRef.current()
          if (!ok) return
          setIsDirty(false)
          await load()
          return
        }
        return
      }

      // =====================
      // READ
      // =====================
      if (viewMode === 'read') {
        if (detailActiveSectionId === 'invite' && actionId === 'sendInvite') {
          if (!inviteSubmitRef.current) return
          const ok = await inviteSubmitRef.current()
          if (!ok) return
          setIsDirty(false)
          await load()
          return
        }

        if (actionId === 'edit') {
          setViewMode('edit')
          setUrl({ t: 'users-list', id: detailUser?.id ?? selectedId ?? null, vm: 'edit', am: null }, 'replace')
        }
        return
      }

      // =====================
      // EDIT / CREATE
      // =====================
      if (viewMode === 'edit' || viewMode === 'create') {
        if (actionId === 'invite') {
          if (isDirty) {
            alert('Máš neuložené změny. Nejdřív ulož změny a pak pošli pozvánku.')
            return
          }

          if (!detailUser?.id?.trim() || detailUser.id === 'new') {
            alert('Nejdřív ulož záznam, aby šla poslat pozvánka.')
            return
          }

          if ((detailUser as any)?.firstLoginAt) {
            alert('Uživatel se již přihlásil – pozvánku nelze poslat znovu.')
            return
          }

          openInvite(detailUser.id)
          return
        }

        if (actionId === 'save') {
          if (!submitRef.current) {
            alert('Chybí submit handler (submitRef).')
            return
          }

          const savedUser = await submitRef.current()
          if (!savedUser) return

          const wasCreate = viewMode === 'create' || detailUser?.id === 'new'

          setDetailUser(savedUser)
          setIsDirty(false)
          await load()

          setViewMode('read')
          setUrl({ t: 'users-list', id: savedUser.id, vm: 'read', am: null }, 'replace')

          if (wasCreate) {
            const ask = confirm('Uživatel uložen. Chceš teď odeslat pozvánku?')
            if (ask) {
              setDetailInitialSectionId('invite')
              setDetailActiveSectionId('invite')
              setPendingSendInviteAfterCreate(true)
            }
          }

          return
        }

        return
      }
    }

    onRegisterCommonActionHandler(handler)
  }, [
    onRegisterCommonActionHandler,
    searchKey,
    viewMode,
    selectedId,
    users,
    openDetail,
    openInvite,
    load,
    isDirty,
    closeToList,
    closeListToModule,
    detailActiveSectionId,
    detailUser,
    setUrl,
    attachmentsManagerSubjectId,
    attachmentsManagerUi,
  ])

  // ✅ Po uložení nového usera: počkáme, až bude připraven inviteSubmitRef, a pak pošleme pozvánku.
  useEffect(() => {
    if (!pendingSendInviteAfterCreate) return
    if (viewMode !== 'read') return
    if (detailActiveSectionId !== 'invite') return
    if (!inviteSubmitRef.current) return

    const run = async () => {
      const ok = await inviteSubmitRef.current?.()
      setPendingSendInviteAfterCreate(false)

      if (ok) {
        setIsDirty(false)
        await load()
        alert('Pozvánka odeslána ✅')
      }
    }

    void run()
  }, [pendingSendInviteAfterCreate, viewMode, detailActiveSectionId, load])
  // -------------------------
  // Render
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
