'use client'

// FILE: app/modules/010-sprava-uzivatelu/tiles/UsersTile.tsx
// PURPOSE: List + detail uživatelů (010) napojený na Supabase přes service vrstvu.
// UPDATED: Invite flow sjednocený:
// - invite bez výběru -> InviteUserFrame (nový)
// - invite s výběrem  -> UserDetailFrame na záložce "Pozvánka" (jen send/close)

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
    phone: row.phone ?? undefined,
    roleLabel: roleCodeToLabel((row as any).role_code),
    twoFactorMethod: (row as any).two_factor_method ?? null,
    createdAt: (row as any).created_at ?? '',
    isArchived: !!(row as any).is_archived,
    firstLoginAt: (row as any).first_login_at ?? null,
  }
}

function toRow(u: UiUser): ListViewRow {
  return {
    id: u.id,
    roleLabel: u.roleLabel,
    displayName: u.displayName,
    email: u.email,
    isArchived: u.isArchived ? 'Ano' : '',
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

  // UserDetail submit
  const submitRef = useRef<null | (() => Promise<UiUser | null>)>(null)

  // Invite submit (vrací boolean) – používá se jak pro InviteUserFrame, tak pro Pozvánku tab v UserDetailFrame
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

  const openDetail = useCallback((user: UiUser | null, mode: ViewMode, initialSection: any = 'detail') => {
    if (!user) return
    setDetailUser(user)
    setDetailInitialSectionId(initialSection)
    setDetailActiveSectionId(initialSection)
    setViewMode(mode)
    setIsDirty(false)
    submitRef.current = null
    inviteSubmitRef.current = null
    setInvitePresetSubjectId(null)
  }, [])

  const openInvite = useCallback((subjectId: string | null) => {
    setInvitePresetSubjectId(subjectId)
    setViewMode('invite')
    setIsDirty(false)
    submitRef.current = null
    inviteSubmitRef.current = null
  }, [])

  const closeDetail = useCallback(() => {
    setViewMode('list')
    setDetailUser(null)
    setDetailInitialSectionId('detail')
    setDetailActiveSectionId('detail')
    setIsDirty(false)
    submitRef.current = null
    inviteSubmitRef.current = null
    setInvitePresetSubjectId(null)
    setUrl({ id: null, vm: null })
  }, [setUrl])

  // URL -> state (jen pro detail)
  useEffect(() => {
    const id = searchParams?.get('id')?.trim() ?? null
    const vm = (searchParams?.get('vm')?.trim() as ViewMode | null) ?? null
    if (!id) return
    const found = users.find((u) => u.id === id)
    if (!found) return
    setSelectedId(id)
    openDetail(found, vm === 'edit' || vm === 'create' ? vm : 'read', 'detail')
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

    // 📩 INVITE (samostatná obrazovka)
    if (viewMode === 'invite') {
      return ['save', 'close']
    }

    // 👁️ DETAIL – READ
    if (viewMode === 'read') {
      // pokud jsme na záložce Pozvánka, nechceme editovat uživatele – jen odeslat / zavřít
      if (detailActiveSectionId === 'invite') return ['save', 'close']
      return ['edit', 'close']
    }

    // ✏️ EDIT / CREATE
    return ['save', 'close']
  }, [viewMode, detailActiveSectionId])

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
          setViewMode('create')
          setDetailUser({
            id: '',
            displayName: '',
            email: '',
            roleLabel: '—',
            createdAt: new Date().toISOString(),
          })
          setDetailInitialSectionId('detail')
          setDetailActiveSectionId('detail')
          setIsDirty(false)
          submitRef.current = null
          inviteSubmitRef.current = null
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
          // bez výběru -> nový uživatel
          if (!selectedId) {
            openInvite(null)
            return
          }

          // s výběrem -> detail uživatele na Pozvánce
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

        if (id === 'close') {
          router.back()
          return
        }
      }

      // =====================
      // INVITE (samostatná obrazovka)
      // =====================
      if (viewMode === 'invite') {
        if (id === 'close') {
          setViewMode('list')
          setInvitePresetSubjectId(null)
          setIsDirty(false)
          inviteSubmitRef.current = null
          return
        }

        if (id === 'save') {
          if (!inviteSubmitRef.current) return
          const ok = await inviteSubmitRef.current()
          if (!ok) return
          setIsDirty(false)
          await load()
          return
        }
      }

      // =====================
      // READ
      // =====================
      if (viewMode === 'read') {
        // Pozvánka tab v detailu uživatele
        if (detailActiveSectionId === 'invite') {
          if (id === 'close') closeDetail()
          if (id === 'save') {
            if (!inviteSubmitRef.current) return
            const ok = await inviteSubmitRef.current()
            if (!ok) return
            setIsDirty(false)
            await load()
          }
          return
        }

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
  }, [onRegisterCommonActionHandler, viewMode, selectedId, users, openDetail, closeDetail, load, openInvite, router, detailActiveSectionId])

  // =====================
  // RENDER
  // =====================
  if (viewMode === 'list') {
    return (
      <ListView<UiUser>
        columns={COLUMNS}
        rows={rows}
        loading={loading}
        error={error ?? undefined}
        filterText={filterText}
        onFilterTextChange={setFilterText}
        showArchived={showArchived}
        onShowArchivedChange={setShowArchived}
        selectedId={selectedId ?? undefined}
        onSelect={(id) => setSelectedId(id ?? null)}
        onRowDoubleClick={(id) => {
          const found = users.find((u) => u.id === id)
          if (!found) return
          openDetail(found, 'read', 'detail')
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
