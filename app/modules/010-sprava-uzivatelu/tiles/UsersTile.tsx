'use client'

// FILE: app/modules/010-sprava-uzivatelu/tiles/UsersTile.tsx
// PURPOSE: List + detail uživatelů (010) + pozvánky + přílohy.
// URL state:
// - t=users-list (list)
// - t=invite-user (invite screen)
// - t=attachments-manager (attachments manager screen)
// - id + vm (detail: read/edit/create)
//
// FIX:
// - useSearchParams() -> searchKey = searchParams.toString() (stabilní) = žádné blikání
// - anti-storm guards pro load()

// =====================
// 1) IMPORTS
// =====================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import ListView, { type ListViewColumn, type ListViewRow } from '@/app/UI/ListView'
import type { CommonActionId, ViewMode } from '@/app/UI/CommonActions'
import UserDetailFrame from '@/app/modules/010-sprava-uzivatelu/forms/UserDetailFrame'
import InviteUserFrame from '../forms/InviteUserFrame'
import AttachmentsManagerFrame from '@/app/UI/attachments/AttachmentsManagerFrame'
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

// [PART 3 HELPERS START]

const COLUMNS: ListViewColumn[] = [
  { key: 'roleLabel', label: 'Role', width: '18%' },
  { key: 'displayName', label: 'Jméno' },
  { key: 'email', label: 'E-mail' },
  { key: 'isArchived', label: 'Archivován', width: '10%', align: 'center' },
]

/**
 * Fallback mapování (ponecháno schválně).
 * Primárně se role mají brát z 900/role_types.
 *
 * ✅ Placeholder "—" rušíme:
 * - když role není, vracíme prázdný string
 */
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

// [PART 3 HELPERS END]

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

  // ✅ stabilní klíč pro URL (string), ne objekt searchParams
  const searchKey = searchParams?.toString() ?? ''

  const [users, setUsers] = useState<UiUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [filterText, setFilterText] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [viewMode, setViewMode] = useState<LocalViewMode>('list')
  const [detailUser, setDetailUser] = useState<UiUser | null>(null)

  // ✅ rozlišujeme:
  // - detailInitialSectionId = jen "počáteční" / vyžádaná sekce
  // - detailActiveSectionId  = aktuálně aktivní sekce (pro CommonActions logiku)
  const [detailInitialSectionId, setDetailInitialSectionId] = useState<any>('detail')
  const [detailActiveSectionId, setDetailActiveSectionId] = useState<any>('detail')

  const [isDirty, setIsDirty] = useState(false)

  // Role types (900) -> map role_code -> name (použije se pro list i detail)
  const [roleTypes, setRoleTypes] = useState<RoleTypeRow[]>([])
  const roleTypeMap = useMemo(() => buildRoleTypeMap(roleTypes), [roleTypes])
  const roleTypeMapRef = useRef<Record<string, string>>({})

  // UserDetail submit
  const submitRef = useRef<null | (() => Promise<UiUser | null>)>(null)

  // Invite submit
  const inviteSubmitRef = useRef<null | (() => Promise<boolean>)>(null)

  // Invite preset
  const [invitePresetSubjectId, setInvitePresetSubjectId] = useState<string | null>(null)

  // Attachments manager target (subject id)
  const [attachmentsManagerSubjectId, setAttachmentsManagerSubjectId] = useState<string | null>(null)
  // -------------------------
  // URL helpers (t, id, vm)
  // -------------------------
  const setUrl = useCallback(
    (
      next: { t?: string | null; id?: string | null; vm?: string | null },
      mode: 'replace' | 'push' = 'replace'
    ) => {
      // ✅ pracuj se stabilním searchKey, ne searchParams objektem
      const sp = new URLSearchParams(searchKey)

      const setOrDelete = (key: string, val?: string | null) => {
        if (val && String(val).trim()) sp.set(key, String(val).trim())
        else sp.delete(key)
      }

      setOrDelete('t', next.t ?? (sp.get('t') ?? null))
      setOrDelete('id', next.id ?? null)
      setOrDelete('vm', next.vm ?? null)

      const qs = sp.toString()
      const nextUrl = qs ? `${pathname}?${qs}` : pathname

      const currentUrl = searchKey ? `${pathname}?${searchKey}` : pathname
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

  // -------------------------
  // Load
  // -------------------------
  const load = useCallback(async () => {
    const key = `${(filterText ?? '').trim().toLowerCase()}|${showArchived ? '1' : '0'}`

    // Pokud už běží load se stejnými parametry, nevytvářej další requesty.
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
      // uvolni in-flight jen pokud je to stále ten samý promise
      if (loadInFlightRef.current === p) loadInFlightRef.current = null
    }
  }, [filterText, showArchived])
  // -------------------------
  // Load role types (900) - jednou, bez zásahu do modulu Nastavení
  // -------------------------
  const roleTypesInFlightRef = useRef<Promise<void> | null>(null)

  const loadRoleTypes = useCallback(async () => {
    if (roleTypesInFlightRef.current) return roleTypesInFlightRef.current
    const p = (async () => {
      try {
        const rows = await fetchRoleTypes()
        setRoleTypes(rows)
      } catch (e) {
        console.warn('[UsersTile.fetchRoleTypes] WARN', e)
        // fallback: roleCodeToLabel()
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
    void loadRoleTypes()
  }, [loadRoleTypes])

  useEffect(() => {
    void load()
  }, [load])

  // drž aktuální mapu i v ref (aby load() nemusel být závislý na roleTypeMap)
  useEffect(() => {
    roleTypeMapRef.current = roleTypeMap
    // přepočítej labely bez reloadu uživatelů
    setUsers((prev) =>
      prev.map((u) => ({
        ...u,
        roleLabel: resolveRoleLabel(u.roleCode, roleTypeMap),
      }))
    )
  }, [roleTypeMap])

  const rows = useMemo(() => users.map(toRow), [users])

  // -------------------------
  // Open/Close
  // -------------------------
  const openDetail = useCallback(
    (user: UiUser, mode: ViewMode, initialSection: any = 'detail') => {
      setDetailUser(user)
      setDetailInitialSectionId(initialSection)
      setDetailActiveSectionId(initialSection)
      setAttachmentsManagerSubjectId(null)
      setViewMode(mode)
      setIsDirty(false)
      submitRef.current = null
      inviteSubmitRef.current = null
      setInvitePresetSubjectId(null)

      setUrl({ t: 'users-list', id: user.id, vm: mode }, 'push')
    },
    [setUrl]
  )
  const openInvite = useCallback(
    (subjectId: string | null) => {
      setInvitePresetSubjectId(subjectId)
      setAttachmentsManagerSubjectId(null)
      setViewMode('invite')
      setIsDirty(false)
      submitRef.current = null
      inviteSubmitRef.current = null

      // samostatný screen
      setUrl({ t: 'invite-user', id: null, vm: null }, 'push')
    },
    [setUrl]
  )

  const closeToList = useCallback(() => {
    setViewMode('list')
    setDetailUser(null)
    setDetailInitialSectionId('detail')
    setDetailActiveSectionId('detail')
    setInvitePresetSubjectId(null)
    setAttachmentsManagerSubjectId(null)
    submitRef.current = null
    inviteSubmitRef.current = null
    setIsDirty(false)

    setUrl({ t: 'users-list', id: null, vm: null }, 'replace')
  }, [setUrl])

  const closeListToModule = useCallback(() => {
    // zavře tile – zůstane modul bez t
    setViewMode('list')
    setDetailUser(null)
    setDetailInitialSectionId('detail')
    setDetailActiveSectionId('detail')
    setInvitePresetSubjectId(null)
    setAttachmentsManagerSubjectId(null)
    submitRef.current = null
    inviteSubmitRef.current = null
    setIsDirty(false)

    setUrl({ t: null, id: null, vm: null }, 'replace')
  }, [setUrl])
  
  // [PART URL->STATE START]
  // -------------------------
  // URL -> state
  // -------------------------
  useEffect(() => {
    // ✅ parse z searchKey (stabilní)
    const sp = new URLSearchParams(searchKey)
  
    const t = sp.get('t')?.trim() ?? null
    const id = sp.get('id')?.trim() ?? null
    const vm = (sp.get('vm')?.trim() as ViewMode | null) ?? null
  
    // tile state
    if (!t) {
      // modul root (tile zavřený) -> nevnucujeme nic, necháme list režim
      if (viewMode !== 'list') {
        setViewMode('list')
        setDetailUser(null)
        setInvitePresetSubjectId(null)
        setAttachmentsManagerSubjectId(null)
        submitRef.current = null
        inviteSubmitRef.current = null
        setIsDirty(false)
      }
      return
    }
  
    if (t === 'invite-user') {
      if (viewMode !== 'invite') {
        setViewMode('invite')
        setDetailUser(null)
        setAttachmentsManagerSubjectId(null)
        submitRef.current = null
        inviteSubmitRef.current = null
        setIsDirty(false)
      }
      return
    }
  
    if (t === 'attachments-manager') {
      if (!id) return
      if (attachmentsManagerSubjectId !== id) setAttachmentsManagerSubjectId(id)
      if (viewMode !== 'attachments-manager') {
        setViewMode('attachments-manager')
        setIsDirty(false)
      }
      if (selectedId !== id) setSelectedId(id)
      return
    }
  
    // list + detail
    if (t === 'users-list') {
      const safeVm: ViewMode = vm === 'edit' || vm === 'create' || vm === 'read' ? vm : 'read'
  
      // ✅ CREATE route: id=new (nebo id prázdné) -> otevři create detail i bez záznamu v users[]
      if (safeVm === 'create' && (id === 'new' || !id)) {
        if (viewMode !== 'create') setViewMode('create')
  
        if (!detailUser || detailUser.id !== 'new') {
          const blank: UiUser = {
            id: 'new',
            displayName: '',
            email: '',
            roleLabel: '',
            createdAt: new Date().toISOString(),
          }
          setDetailUser(blank)
        }
  
        setDetailInitialSectionId('detail')
        setDetailActiveSectionId('detail')
        setInvitePresetSubjectId(null)
        setAttachmentsManagerSubjectId(null)
        submitRef.current = null
        inviteSubmitRef.current = null
        setIsDirty(false)
        return
      }
  
      // LIST
      if (!id) {
        if (viewMode !== 'list') {
          setViewMode('list')
          setDetailUser(null)
          submitRef.current = null
          inviteSubmitRef.current = null
          setInvitePresetSubjectId(null)
          setAttachmentsManagerSubjectId(null)
          setIsDirty(false)
        }
        return
      }
  
      // DETAIL
      const found = users.find((u) => u.id === id)
      if (!found) return
  
      if (selectedId !== id) setSelectedId(id)
  
      if (viewMode !== safeVm || detailUser?.id !== found.id) {
        setDetailUser(found)
        setAttachmentsManagerSubjectId(null)
  
        if (!detailActiveSectionId) {
          setDetailInitialSectionId('detail')
          setDetailActiveSectionId('detail')
        }
  
        setViewMode(safeVm)
        setIsDirty(false)
        submitRef.current = null
        inviteSubmitRef.current = null
        setInvitePresetSubjectId(null)
      }
      return
    }
  }, [searchKey, users, viewMode, detailUser?.id, selectedId, attachmentsManagerSubjectId, detailActiveSectionId])
  // [PART URL->STATE END]
  

  // -------------------------
  // Invite availability for detail
  // -------------------------
  const canInviteDetail = useMemo(() => {
    if (!detailUser?.id) return false
    if (!detailUser.id.trim()) return false
    if (detailUser.firstLoginAt) return false
    return true
  }, [detailUser?.firstLoginAt, detailUser?.id])

  // -------------------------
  // CommonActions list
  // -------------------------
  const commonActions: CommonActionId[] = useMemo(() => {
    const LIST: CommonActionId[] = ['add', 'view', 'edit', 'invite', 'columnSettings', 'close']
    const INVITE: CommonActionId[] = ['sendInvite', 'close']

    const READ_DEFAULT: CommonActionId[] = ['edit', 'close']
    const EDIT_DEFAULT_WITH_INVITE: CommonActionId[] = ['save', 'invite', 'close']
    const EDIT_DEFAULT: CommonActionId[] = ['save', 'close']
    const CREATE_DEFAULT: CommonActionId[] = ['save', 'close']

    const withAttachments = (base: CommonActionId[]): CommonActionId[] => {
      if (detailActiveSectionId === 'invite') return base
      return base.includes('attachments') ? base : [...base, 'attachments']
    }

    if (viewMode === 'list') return LIST
    if (viewMode === 'invite') return INVITE
    if (viewMode === 'attachments-manager') return ['close']
    if (viewMode === 'read') {
      if (detailActiveSectionId === 'invite') return canInviteDetail ? INVITE : (['close'] as CommonActionId[])
      return withAttachments(READ_DEFAULT)
    }

    if (viewMode === 'edit') {
      return withAttachments(canInviteDetail ? EDIT_DEFAULT_WITH_INVITE : EDIT_DEFAULT)
    }

    // create
    return withAttachments(CREATE_DEFAULT)
  }, [viewMode, detailActiveSectionId, canInviteDetail])

  useEffect(() => {
    onRegisterCommonActions?.(commonActions)
  }, [onRegisterCommonActions, commonActions])

  useEffect(() => {
    onRegisterCommonActionsState?.({
      viewMode: (viewMode as any) as ViewMode,
      hasSelection: !!selectedId,
      isDirty,
    })
  }, [onRegisterCommonActionsState, viewMode, selectedId, isDirty])

  // -------------------------
  // CommonActions handler
  // -------------------------
  useEffect(() => {
    if (!onRegisterCommonActionHandler) return

    const handler = async (id: CommonActionId) => {
      // ✅ jednotný CLOSE (žádné router.back)
      if (id === 'close') {
        if (isDirty) {
          const ok = confirm('Máš neuložené změny. Opravdu chceš zavřít?')
          if (!ok) return
        }

        // attachments manager -> back to user detail (attachments tab)
        if (viewMode === 'attachments-manager') {
          const backId = attachmentsManagerSubjectId ?? detailUser?.id ?? null
          if (backId) {
            setDetailInitialSectionId('attachments')
            setDetailActiveSectionId('attachments')
            setUrl({ t: 'users-list', id: backId, vm: 'read' }, 'replace')
          } else {
            closeToList()
          }
          return
        }

        // detail/invite -> list
        if (viewMode === 'invite') {
          closeToList()
          return
        }
        if (viewMode === 'read' || viewMode === 'edit' || viewMode === 'create') {
          closeToList()
          return
        }

        // list -> modul root (zavřít tile)
        closeListToModule()
        return
      }

      // DETAIL: Správa příloh (Manager screen)
      if (id === 'attachments') {
        if (detailActiveSectionId === 'invite') return

        if (isDirty) {
          alert('Máš neuložené změny. Nejdřív ulož nebo zavři změny a pak otevři správu příloh.')
          return
        }

        if (!detailUser?.id || !detailUser.id.trim()) {
          alert('Nejdřív ulož záznam, aby šly spravovat přílohy.')
          return
        }

        // ✅ otevře samostatný manager screen (ne modal)
        setAttachmentsManagerSubjectId(detailUser.id)
        setViewMode('attachments-manager')
        setIsDirty(false)
        setUrl({ t: 'attachments-manager', id: detailUser.id, vm: null }, 'push')
        return
      }

      // LIST
      if (viewMode === 'list') {
        if (id === 'add') {
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

          setUrl({ t: 'users-list', id: 'new', vm: 'create' }, 'push')
          return
        }
        if (id === 'view' || id === 'edit') {
          if (!selectedId) return
          const user = users.find((u) => u.id === selectedId)
          if (!user) return
          openDetail(user, id === 'edit' ? 'edit' : 'read', 'detail')
          return
        }

        if (id === 'invite') {
          // bez výběru -> nový
          if (!selectedId) {
            openInvite(null)
            return
          }

          // s výběrem -> detail na Pozvánce (pokud se ještě nepřihlásil)
          const user = users.find((u) => u.id === selectedId)
          if (!user) {
            openInvite(null)
            return
          }
          if (user.firstLoginAt) {
            alert('Uživatel se již přihlásil – pozvánku nelze poslat znovu.')
            return
          }
          openDetail(user, 'read', 'invite')
          return
        }

        return
      }

      // INVITE screen
      if (viewMode === 'invite') {
        if (id === 'sendInvite') {
          if (!inviteSubmitRef.current) return
          const ok = await inviteSubmitRef.current()
          if (!ok) return
          setIsDirty(false)
          await load()
          return
        }
        return
      }

      // READ
      if (viewMode === 'read') {
        if (detailActiveSectionId === 'invite') {
          if (id === 'sendInvite') {
            if (!inviteSubmitRef.current) return
            const ok = await inviteSubmitRef.current()
            if (!ok) return
            setIsDirty(false)
            await load()
          }
          return
        }

        if (id === 'edit') setViewMode('edit')
        return
      }

      // EDIT / CREATE
      if (viewMode === 'edit' || viewMode === 'create') {
        if (id === 'invite') {
          if (isDirty) {
            alert('Máš neuložené změny. Nejdřív ulož změny a pak pošli pozvánku.')
            return
          }
          if (!detailUser?.id?.trim()) return
          if ((detailUser as any)?.firstLoginAt) {
            alert('Uživatel se již přihlásil – pozvánku nelze poslat znovu.')
            return
          }
          openInvite(detailUser.id)
          return
        }

        if (id === 'save') {
          if (!submitRef.current) return
          const saved = await submitRef.current()
          if (!saved) return

          const wasCreate = viewMode === 'create' || detailUser?.id === 'new'
          
          setDetailUser(saved)
          setIsDirty(false)
          await load()
          if (wasCreate) {
            setDetailInitialSectionId('invite')
            setDetailActiveSectionId('invite')
          }
         setViewMode('read')
         setUrl({ t: 'users-list', id: saved.id, vm: 'read' }, 'replace')
         return
      }
        
          setViewMode('read')
            setUrl({ t: 'users-list', id: saved.id, vm: 'read' }, 'replace')
            return
      }
    }

    onRegisterCommonActionHandler(handler)
  }, [
    onRegisterCommonActionHandler,
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
  ])

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
    return <AttachmentsManagerFrame entityType="subjects" entityId={managerId} entityLabel={managerUser?.displayName ?? null} />
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
