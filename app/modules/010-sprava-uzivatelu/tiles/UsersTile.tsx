'use client'

// FILE: app/modules/010-sprava-uzivatelu/tiles/UsersTile.tsx
// PURPOSE: List + detail uživatelů (010) napojený na Supabase přes service vrstvu.
// UPDATED: Invite flow (viewMode = 'invite') + napojení CommonAction 'invite'.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import ListView, { type ListViewColumn, type ListViewRow } from '@/app/UI/ListView'
import type { CommonActionId, ViewMode } from '@/app/UI/CommonActions'
import UserDetailFrame from '../forms/UserDetailFrame'
import InviteUserFrame from '../forms/InviteUserFrame'
import { listUsers, type UsersListRow } from '@/app/lib/services/users'

type UiUser = {
  id: string
  displayName: string
  email: string
  phone?: string
  roleLabel: string
  twoFactorMethod?: string | null
  createdAt: string
  isArchived?: boolean

  // ✅ pro Invite lock
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
    displayName: row.display_name ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    roleLabel: roleCodeToLabel(row.role_code),
    twoFactorMethod: null, // zatím nenapojujeme (sloupec v DB nemáš)
    createdAt: row.created_at ?? '',
    isArchived: !!row.is_archived,

    // ✅ pokud view vrací first_login_at, použijeme ho
    firstLoginAt: (row as any).first_login_at ?? null,
  }
}

function toRow(user: UiUser): ListViewRow<UiUser> {
  return {
    id: user.id,
    raw: user,
    data: {
      roleLabel: user.roleLabel,
      displayName: user.displayName,
      email: user.email,
      isArchived: user.isArchived ? '✓' : '',
    },
  }
}

type UsersTileProps = {
  onRegisterCommonActions?: (actions: CommonActionId[]) => void
  onRegisterCommonActionsState?: (state: {
    viewMode: ViewMode
    hasSelection: boolean
    isDirty: boolean
  }) => void
  onRegisterCommonActionHandler?: (fn: (id: CommonActionId) => void) => void
}

// ✅ rozšíříme ViewMode lokálně o 'invite'
type LocalViewMode = ViewMode | 'invite'

export default function UsersTile({
  onRegisterCommonActions,
  onRegisterCommonActionsState,
  onRegisterCommonActionHandler,
}: UsersTileProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [selectedId, setSelectedId] = useState<string | number | null>(null)
  const [filterText, setFilterText] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<UiUser[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)

  const [viewMode, setViewMode] = useState<LocalViewMode>('list')
  const [detailUser, setDetailUser] = useState<UiUser | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  // UserDetail submit
  const submitRef = useRef<null | (() => Promise<UiUser | null>)>(null)

  // Invite submit (vrací boolean)
  const inviteSubmitRef = useRef<null | (() => Promise<boolean>)>(null)

  // pro Invite – předvyplnění existing/new
  const [invitePresetSubjectId, setInvitePresetSubjectId] = useState<string | null>(null)

  // URL <-> state (detail id + mode)
  const setUrl = useCallback(
    (next: { id?: string | null; vm?: string | null }, mode: 'replace' | 'push' = 'replace') => {
      const sp = new URLSearchParams(searchParams?.toString() ?? '')
      const setOrDelete = (key: string, val?: string | null) => {
        if (val && String(val).trim()) sp.set(key, String(val).trim())
        else sp.delete(key)
      }
      setOrDelete('id', next.id ?? null)
      setOrDelete('vm', next.vm ?? null)
      const qs = sp.toString()
      const nextUrl = qs ? `${pathname}?${qs}` : pathname

      const currentQs = searchParams.toString()
      const currentUrl = currentQs ? `${pathname}?${currentQs}` : pathname

      // ✅ guard proti nekonečné smyčce
      if (nextUrl === currentUrl) return

      if (mode === 'push') router.push(nextUrl)
      else router.replace(nextUrl)
    },
    [pathname, router, searchParams.toString()]
  )

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const rows = await listUsers({
        searchText: filterText,
        includeArchived: showArchived,
      } as any)
      setUsers(rows.map(mapRowToUi))
    } catch (e: any) {
      setLoadError(e?.message ?? 'Chyba při načítání uživatelů.')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [filterText, showArchived])

  useEffect(() => {
    void load()
  }, [load])

  const rows = useMemo(() => users.map(toRow), [users])

  const openDetail = useCallback((user: UiUser | null, mode: ViewMode) => {
    if (!user) return
    setDetailUser(user)
    setViewMode(mode)
    setIsDirty(false)
    submitRef.current = null
    inviteSubmitRef.current = null
    setInvitePresetSubjectId(null)
  }, [])

  const openInvite = useCallback(
    (subjectId: string | null) => {
      setInvitePresetSubjectId(subjectId)
      setViewMode('invite')
      setIsDirty(false)
      submitRef.current = null
      inviteSubmitRef.current = null
    },
    []
  )

  const closeDetail = useCallback(() => {
    setViewMode('list')
    setDetailUser(null)
    setIsDirty(false)
    submitRef.current = null
    inviteSubmitRef.current = null
    setInvitePresetSubjectId(null)
  }, [])

  // URL -> state (after data load) — pouze pro DETAIL (invite do URL zatím nedáváme)
  useEffect(() => {
    const id = searchParams?.get('id')?.trim() ?? ''
    const vm = (searchParams?.get('vm')?.trim() as ViewMode | null) ?? null
    if (!id) return
    const found = users.find((u) => u.id === id)
    if (!found) return
    setSelectedId(id)
    openDetail(found, vm === 'edit' || vm === 'create' ? vm : 'read')
  }, [searchParams, users, openDetail])

  // state -> URL (jen detail režimy)
  useEffect(() => {
    if (viewMode === 'list') {
      if (searchParams?.get('id') || searchParams?.get('vm')) setUrl({ id: null, vm: null })
      return
    }
    if (viewMode === 'invite') {
      // invite do URL netlačíme (zatím)
      if (searchParams?.get('vm') === 'invite') setUrl({ vm: null })
      return
    }
    if (!detailUser?.id) return
    setUrl({ id: detailUser.id, vm: viewMode })
  }, [detailUser?.id, searchParams, setUrl, viewMode])

  /** 🔘 COMMON ACTIONS – BEZ saveAndClose */
  const commonActions = useMemo<CommonActionId[]>(() => {
    // 📄 SEZNAM
    if (viewMode === 'list') {
      return ['add', 'view', 'edit', 'invite', 'columnSettings', 'close']
    }

    // 📩 INVITE
    if (viewMode === 'invite') {
      // save = odeslat pozvánku, close = zpět do seznamu
      return ['save', 'close']
    }

    // 👁️ DETAIL – READ
    if (viewMode === 'read') {
      return ['edit', 'close']
    }

    // ✏️ EDIT / CREATE
    return ['save', 'close']
  }, [viewMode])

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

  useEffect(() => {
    if (!onRegisterCommonActionHandler) return

    const handler = async (id: CommonActionId) => {
      // =====================
      // LIST
      // =====================
      if (viewMode === 'list') {
        if (id === 'add') {
          const empty: UiUser = {
            id: 'new',
            displayName: '',
            email: '',
            phone: '',
            roleLabel: 'Uživatel',
            twoFactorMethod: null,
            createdAt: new Date().toISOString().slice(0, 10),
            isArchived: false,
            firstLoginAt: null,
          }
          setSelectedId(empty.id)
          openDetail(empty, 'create')
          return
        }

        if (id === 'view' || id === 'detail' || id === 'edit') {
          if (!selectedId) return
          const user = users.find((u) => u.id === selectedId)
          if (!user) return
          openDetail(user, id === 'edit' ? 'edit' : 'read')
          return
        }

        // ✅ INVITE – klíčová logika:
        // bez výběru → new
        // s výběrem → existing (subjectId)
        if (id === 'invite') {
          if (!selectedId) {
            openInvite(null)
            return
          }
          const user = users.find((u) => u.id === selectedId)
          if (!user) {
            openInvite(null)
            return
          }
          if (user.firstLoginAt) {
            alert('Uživatel se již přihlásil – pozvánku nelze poslat znovu.')
            return
          }
          openInvite(user.id)
          return
        }

        if (id === 'close') {
          router.back()
          return
        }

        return
      }

      // =====================
      // INVITE
      // =====================
      if (viewMode === 'invite') {
        if (id === 'close') {
          // ⚠️ dirty warning řeší AppShell (confirmIfDirty)
          closeDetail()
          return
        }

        if (id === 'save') {
          if (!inviteSubmitRef.current) return
          const ok = await inviteSubmitRef.current()
          if (!ok) return
          setIsDirty(false)
          await load()
          // po odeslání pozvánky zůstáváme na invite (odemkne se tab Systém)
          // chceš-li návrat do listu, změň na: closeDetail()
          return
        }

        return
      }

      // =====================
      // READ
      // =====================
      if (viewMode === 'read') {
        if (id === 'edit') setViewMode('edit')
        if (id === 'close') closeDetail()
        return
      }

      // =====================
      // EDIT / CREATE
      // =====================
      if (viewMode === 'edit' || viewMode === 'create') {
        if (id === 'close') {
          viewMode === 'create' ? closeDetail() : setViewMode('read')
          setIsDirty(false)
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
        }
      }
    }

    onRegisterCommonActionHandler(handler)
  }, [onRegisterCommonActionHandler, viewMode, selectedId, users, openDetail, closeDetail, load, openInvite, router])

  // =====================
  // RENDER
  // =====================
  if (viewMode === 'list') {
    return (
      <ListView<UiUser>
        columns={COLUMNS}
        rows={rows}
        filterPlaceholder="Hledat podle jména, e-mailu nebo telefonu…"
        filterValue={filterText}
        onFilterChange={setFilterText}
        showArchived={showArchived}
        onShowArchivedChange={setShowArchived}
        showArchivedLabel="Zobrazit archivované"
        emptyText={loading ? 'Načítám…' : loadError ?? 'Zatím žádní uživatelé.'}
        selectedId={selectedId}
        onRowClick={(row) => setSelectedId(row.id)}
        onRowDoubleClick={(row) => {
          setSelectedId(row.id)
          openDetail(row.raw ?? null, 'read')
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

  if (detailUser) {
    return (
      <UserDetailFrame
        user={detailUser}
        viewMode={viewMode as ViewMode}
        onDirtyChange={setIsDirty}
        onRegisterSubmit={(fn) => {
          submitRef.current = fn
        }}
      />
    )
  }

  return null
}
