'use client'

// FILE: app/modules/010-sprava-uzivatelu/tiles/UsersTile.tsx
// PURPOSE: List + detail uživatelů (010) + pozvánky.
// URL state:
// - t=users-list (list)
// - t=invite-user (invite screen)
// - id + vm (detail: read/edit/create)

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import ListView, { type ListViewColumn, type ListViewRow } from '@/app/UI/ListView'
import type { CommonActionId, ViewMode } from '@/app/UI/CommonActions'
import UserDetailFrame from '@/app/modules/010-sprava-uzivatelu/forms/UserDetailFrame'
import InviteUserFrame from '../forms/InviteUserFrame'
import { listUsers, type UsersListRow } from '@/app/lib/services/users'

const __typecheck_commonaction: CommonActionId = 'attachments'

type UiUser = {
  id: string
  displayName: string
  email: string
  phone?: string
  roleLabel: string
  twoFactorMethod?: string | null
  createdAt: string
  isArchived?: boolean
  firstLoginAt?: string | null
}

const COLUMNS: ListViewColumn[] = [
  { key: 'roleLabel', label: 'Role', width: '18%' },
  { key: 'displayName', label: 'Jméno' },
  { key: 'email', label: 'E-mail' },
  { key: 'isArchived', label: 'Archivován', width: '10%', align: 'center' },
]

function roleCodeToLabel(code: string | null | undefined): string {
  const c = (code ?? '').trim().toLowerCase()
  if (!c) return '—'
  if (c === 'admin') return 'Admin'
  if (c === 'user') return 'Uživatel'
  return c
}

function mapRowToUi(row: UsersListRow): UiUser {
  return {
    id: row.id,
    displayName: (row as any).display_name ?? '',
    email: (row as any).email ?? '',
    phone: (row as any).phone ?? undefined,
    roleLabel: roleCodeToLabel((row as any).role_code),
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

type UsersTileProps = {
  onRegisterCommonActions?: (actions: CommonActionId[]) => void
  onRegisterCommonActionsState?: (state: { viewMode: ViewMode; hasSelection: boolean; isDirty: boolean }) => void
  onRegisterCommonActionHandler?: (fn: (id: CommonActionId) => void) => void
}

// ✅ lokální režimy
type LocalViewMode = ViewMode | 'list' | 'invite'

export default function UsersTile({
  onRegisterCommonActions,
  onRegisterCommonActionsState,
  onRegisterCommonActionHandler,
}: UsersTileProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

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

  // ✅ poznáme návrat z detailu na list (zmizí id v URL)
  const prevUrlIdRef = useRef<string | null>(null)

  // ✅ FIX pro "musím kliknout 2×" – handler vždy čte aktuální selection/users
  const selectedIdRef = useRef<string | null>(null)
  const usersRef = useRef<UiUser[]>([])

  useEffect(() => {
    selectedIdRef.current = selectedId
  }, [selectedId])

  useEffect(() => {
    usersRef.current = users
  }, [users])

  // UserDetail submit
  const submitRef = useRef<null | (() => Promise<UiUser | null>)>(null)

  // Invite submit
  const inviteSubmitRef = useRef<null | (() => Promise<boolean>)>(null)

  // Invite preset
  const [invitePresetSubjectId, setInvitePresetSubjectId] = useState<string | null>(null)

  // -------------------------
  // URL helpers (t, id, vm)
  // -------------------------
  const setUrl = useCallback(
    (
      next: { t?: string | null; id?: string | null; vm?: string | null },
      mode: 'replace' | 'push' = 'replace'
    ) => {
      const sp = new URLSearchParams(searchParams?.toString() ?? '')

      const setOrDelete = (key: string, val?: string | null) => {
        if (val && String(val).trim()) sp.set(key, String(val).trim())
        else sp.delete(key)
      }

      setOrDelete('t', next.t ?? (sp.get('t') ?? null))
      setOrDelete('id', next.id ?? null)
      setOrDelete('vm', next.vm ?? null)

      const qs = sp.toString()
      const nextUrl = qs ? `${pathname}?${qs}` : pathname

      const currentQs = searchParams?.toString() ?? ''
      const currentUrl = currentQs ? `${pathname}?${currentQs}` : pathname

      if (nextUrl === currentUrl) return

      if (mode === 'push') router.push(nextUrl)
      else router.replace(nextUrl)
    },
    [pathname, router, searchParams]
  )

  // -------------------------
  // Load
  // -------------------------
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await listUsers({ searchText: filterText, includeArchived: showArchived })
      setUsers(rows.map(mapRowToUi))
    } catch (e: any) {
      console.error('[UsersTile.listUsers] ERROR', e)
      setError(e?.message ?? 'Chyba načtení uživatelů')
    } finally {
      setLoading(false)
    }
  }, [filterText, showArchived])

  useEffect(() => {
    void load()
  }, [load])

  const rows = useMemo(() => users.map(toRow), [users])

  // -------------------------
  // Open/Close
  // -------------------------
  const openDetail = useCallback(
    (user: UiUser, mode: ViewMode, initialSection: any = 'detail') => {
      setDetailUser(user)
      setDetailInitialSectionId(initialSection)
      setDetailActiveSectionId(initialSection)
      setViewMode(mode)
      setIsDirty(false)
      submitRef.current = null
      inviteSubmitRef.current = null
      setInvitePresetSubjectId(null)

      // detail implies selection
      if (user?.id) {
        selectedIdRef.current = user.id
        setSelectedId(user.id)
      }

      setUrl({ t: 'users-list', id: user.id, vm: mode }, 'push')
    },
    [setUrl]
  )

  const openInvite = useCallback(
    (subjectId: string | null) => {
      setInvitePresetSubjectId(subjectId)
      setViewMode('invite')
      setIsDirty(false)
      submitRef.current = null
      inviteSubmitRef.current = null

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
    submitRef.current = null
    inviteSubmitRef.current = null
    setIsDirty(false)

    selectedIdRef.current = null
    setSelectedId(null)
    prevUrlIdRef.current = null

    setUrl({ t: 'users-list', id: null, vm: null }, 'replace')
  }, [setUrl])

  const closeListToModule = useCallback(() => {
    setViewMode('list')
    setDetailUser(null)
    setDetailInitialSectionId('detail')
    setDetailActiveSectionId('detail')
    setInvitePresetSubjectId(null)
    submitRef.current = null
    inviteSubmitRef.current = null
    setIsDirty(false)

    selectedIdRef.current = null
    setSelectedId(null)
    prevUrlIdRef.current = null

    setUrl({ t: null, id: null, vm: null }, 'replace')
  }, [setUrl])

  // -------------------------
  // URL -> state
  // -------------------------
  useEffect(() => {
    const t = searchParams?.get('t')?.trim() ?? null
    const id = searchParams?.get('id')?.trim() ?? null
    const vm = (searchParams?.get('vm')?.trim() as ViewMode | null) ?? null

    if (!t) {
      if (viewMode !== 'list') {
        setViewMode('list')
        setDetailUser(null)
        setInvitePresetSubjectId(null)
        submitRef.current = null
        inviteSubmitRef.current = null
        setIsDirty(false)
      }
      if (selectedId !== null) {
        selectedIdRef.current = null
        setSelectedId(null)
      }
      prevUrlIdRef.current = null
      return
    }

    if (t === 'invite-user') {
      if (viewMode !== 'invite') {
        setViewMode('invite')
        setDetailUser(null)
        submitRef.current = null
        inviteSubmitRef.current = null
        setIsDirty(false)
      }
      return
    }

    if (t === 'users-list') {
      if (!id) {
        // LIST
        if (viewMode !== 'list') {
          setViewMode('list')
          setDetailUser(null)
          submitRef.current = null
          inviteSubmitRef.current = null
          setInvitePresetSubjectId(null)
          setIsDirty(false)
        }

        // selection nemažeme při klikání v listu; jen když se vracíme z detailu (id zmizelo)
        const prevUrlId = prevUrlIdRef.current
        if (prevUrlId) {
          if (selectedId !== null) {
            selectedIdRef.current = null
            setSelectedId(null)
          }
        }

        prevUrlIdRef.current = null
        return
      }

      // DETAIL
      prevUrlIdRef.current = id

      const found = users.find((u) => u.id === id)
      if (!found) return

      if (selectedId !== id) {
        selectedIdRef.current = id
        setSelectedId(id)
      }

      const safeVm: ViewMode = vm === 'edit' || vm === 'create' || vm === 'read' ? vm : 'read'
      if (viewMode !== safeVm || detailUser?.id !== found.id) {
        setDetailUser(found)
        setDetailInitialSectionId('detail')
        setDetailActiveSectionId('detail')
        setViewMode(safeVm)
        setIsDirty(false)
        submitRef.current = null
        inviteSubmitRef.current = null
        setInvitePresetSubjectId(null)
      }
      return
    }
  }, [searchParams, users, viewMode, detailUser?.id, selectedId])

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

    if (viewMode === 'read') {
      if (detailActiveSectionId === 'invite') return canInviteDetail ? INVITE : (['close'] as CommonActionId[])
      return withAttachments(READ_DEFAULT)
    }

    if (viewMode === 'edit') {
      return withAttachments(canInviteDetail ? EDIT_DEFAULT_WITH_INVITE : EDIT_DEFAULT)
    }

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
      if (id === 'close') {
        if (isDirty) {
          const ok = confirm('Máš neuložené změny. Opravdu chceš zavřít?')
          if (!ok) return
        }
        if (viewMode === 'invite') {
          closeToList()
          return
        }
        if (viewMode === 'read' || viewMode === 'edit' || viewMode === 'create') {
          closeToList()
          return
        }
        closeListToModule()
        return
      }

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
        alert(`TODO: Správa příloh pro user ${detailUser.id}`)
        return
      }

      // LIST
      if (viewMode === 'list') {
        if (id === 'add') {
          setViewMode('create')
          const blank: UiUser = {
            id: '',
            displayName: '',
            email: '',
            roleLabel: '—',
            createdAt: new Date().toISOString(),
          }
          setDetailUser(blank)
          setDetailInitialSectionId('detail')
          setDetailActiveSectionId('detail')
          setIsDirty(false)
          submitRef.current = null
          inviteSubmitRef.current = null
          setInvitePresetSubjectId(null)

          selectedIdRef.current = null
          setSelectedId(null)
          prevUrlIdRef.current = ''

          setUrl({ t: 'users-list', id: '', vm: 'create' }, 'push')
          return
        }

        if (id === 'view' || id === 'edit') {
          const sid = selectedIdRef.current
          if (!sid) return
          const user = usersRef.current.find((u) => u.id === sid)
          if (!user) return
          openDetail(user, id === 'edit' ? 'edit' : 'read', 'detail')
          return
        }

        if (id === 'invite') {
          const sid = selectedIdRef.current
          if (!sid) {
            openInvite(null)
            return
          }

          const user = usersRef.current.find((u) => u.id === sid)
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
          setDetailUser(saved)
          setIsDirty(false)
          await load()
          setViewMode('read')

          if (saved?.id) {
            selectedIdRef.current = saved.id
            setSelectedId(saved.id)
          }

          setUrl({ t: 'users-list', id: saved.id, vm: 'read' }, 'replace')
          return
        }
        return
      }
    }

    onRegisterCommonActionHandler(handler)
  }, [
    onRegisterCommonActionHandler,
    viewMode,
    openDetail,
    openInvite,
    load,
    isDirty,
    closeToList,
    closeListToModule,
    detailActiveSectionId,
    detailUser,
    setUrl,
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
          onRowClick={(row) => {
            const id = String(row.id)
            selectedIdRef.current = id
            setSelectedId(id)
          }}
          onRowDoubleClick={(row) => {
            const user = row.raw
            if (!user) return
            openDetail(user, 'read', 'detail')
          }}
        />
      </div>
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
