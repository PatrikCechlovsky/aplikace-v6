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
import Modal from '@/app/UI/Modal'
import DetailAttachmentsSection from '@/app/UI/detail-sections/DetailAttachmentsSection'
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

  // Attachments modal
  const [attachmentsOpen, setAttachmentsOpen] = useState(false)

  // UserDetail submit
  const submitRef = useRef<null | (() => Promise<UiUser | null>)>(null)

  // Invite submit
  const inviteSubmitRef = useRef<null | (() => Promise<boolean>)>(null)

  // Invite preset
  const [invitePresetSubjectId, setInvitePresetSubjectId] = useState<string | null>(null)

  // -------------------------
  // URL helpers (t, id, vm)
  // -------------------------
  function getParam(name: string) {
    return searchParams.get(name)
  }
  const t = getParam('t') ?? 'users-list'
  const id = getParam('id') ?? ''
  const vm = (getParam('vm') ?? '') as ViewMode

  const setUrl = useCallback(
    (next: { t: string; id?: string; vm?: string }, mode: 'push' | 'replace') => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('t', next.t)
      if (typeof next.id !== 'undefined') params.set('id', next.id)
      if (typeof next.vm !== 'undefined') params.set('vm', next.vm)
      const url = `${pathname}?${params.toString()}`
      if (mode === 'push') router.push(url)
      else router.replace(url)
    },
    [router, pathname, searchParams]
  )

  const closeListToModule = useCallback(() => {
    router.push(pathname)
  }, [router, pathname])

  const closeToList = useCallback(() => {
    setViewMode('list')
    setDetailUser(null)
    setSelectedId(null)
    submitRef.current = null
    inviteSubmitRef.current = null
    setInvitePresetSubjectId(null)
    setIsDirty(false)
    setAttachmentsOpen(false)
    setUrl({ t: 'users-list', id: '', vm: '' }, 'replace')
  }, [setUrl])

  const confirmIfDirty = useCallback(() => {
    if (!isDirty) return true
    return confirm('Máš neuložené změny. Opravdu chceš pokračovat?')
  }, [isDirty])

  const openDetail = useCallback(
    (user: UiUser, mode: ViewMode, sectionId: any) => {
      setViewMode(mode)
      setDetailUser(user)
      setSelectedId(user.id)
      setDetailInitialSectionId(sectionId)
      setDetailActiveSectionId(sectionId)
      setIsDirty(false)
      setAttachmentsOpen(false)
      submitRef.current = null
      inviteSubmitRef.current = null
      setInvitePresetSubjectId(null)
      setUrl({ t: 'users-list', id: user.id, vm: mode }, 'push')
    },
    [setUrl]
  )

  const openInvite = useCallback(
    (presetSubjectId: string | null) => {
      setViewMode('invite')
      setDetailUser(null)
      setSelectedId(null)
      submitRef.current = null
      inviteSubmitRef.current = null
      setInvitePresetSubjectId(presetSubjectId)
      setIsDirty(false)
      setAttachmentsOpen(false)
      setUrl({ t: 'invite-user', id: '', vm: '' }, 'push')
    },
    [setUrl]
  )

  // -------------------------
  // Load
  // -------------------------
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await listUsers({
        searchText: filterText,
        includeArchived: showArchived,
      } as any)
      setUsers((rows ?? []).map(mapRowToUi))
    } catch (e: any) {
      setError(e?.message ?? 'Chyba načítání uživatelů.')
    } finally {
      setLoading(false)
    }
  }, [filterText, showArchived])

  useEffect(() => {
    void load()
  }, [load])

  // -------------------------
  // URL -> state (React to browser back/forward)
  // -------------------------
  useEffect(() => {
    // list / invite / detail
    if (t === 'invite-user') {
      if (viewMode !== 'invite') {
        setViewMode('invite')
        setDetailUser(null)
        setSelectedId(null)
        submitRef.current = null
        inviteSubmitRef.current = null
        setInvitePresetSubjectId(null)
        setIsDirty(false)
        setAttachmentsOpen(false)
      }
      return
    }

    if (t === 'users-list') {
      if (!id) {
        if (viewMode !== 'list') {
          setViewMode('list')
          setDetailUser(null)
          submitRef.current = null
          inviteSubmitRef.current = null
          setInvitePresetSubjectId(null)
          setIsDirty(false)
          setAttachmentsOpen(false)
        }
        if (selectedId !== null) setSelectedId(null)
        return
      }

      const found = users.find((u) => u.id === id)
      if (!found) return
      if (selectedId !== id) setSelectedId(id)

      const nextMode: LocalViewMode = (vm || 'read') as any
      if (viewMode !== nextMode) setViewMode(nextMode)
      if (!detailUser || detailUser.id !== id) setDetailUser(found)
      return
    }
  }, [t, id, vm, users, viewMode, detailUser, selectedId])

  // -------------------------
  // Rows
  // -------------------------
  const rows = useMemo(() => users.map(toRow), [users])

  // -------------------------
  // Register CommonActions list
  // -------------------------
  useEffect(() => {
    if (!onRegisterCommonActions) return

    const base: CommonActionId[] = ['close']

    if (viewMode === 'list') {
      base.push('add', 'view', 'edit', 'invite')
      // list: attachments nedává smysl (bez detailu)
      onRegisterCommonActions(base)
      return
    }

    if (viewMode === 'invite') {
      base.push('sendInvite')
      onRegisterCommonActions(base)
      return
    }

    // detail
    if (viewMode === 'read') {
      base.push('edit')
      if (detailActiveSectionId === 'invite') base.push('sendInvite')
      // ✅ attachments jen v detailu a ne na invite tab
      if (detailActiveSectionId !== 'invite') base.push('attachments')
      onRegisterCommonActions(base)
      return
    }

    if (viewMode === 'edit' || viewMode === 'create') {
      base.push('save', 'invite')
      // attachments jen pokud máme uložený záznam (id)
      if (detailUser?.id?.trim()) base.push('attachments')
      onRegisterCommonActions(base)
      return
    }

    onRegisterCommonActions(base)
  }, [onRegisterCommonActions, viewMode, detailActiveSectionId, detailUser])

  // -------------------------
  // Register CommonActions state
  // -------------------------
  useEffect(() => {
    if (!onRegisterCommonActionsState) return
    const hasSelection = viewMode === 'list' ? !!selectedId : !!detailUser?.id
    const vmState: ViewMode = viewMode === 'list' || viewMode === 'invite' ? 'read' : (viewMode as ViewMode)
    onRegisterCommonActionsState({ viewMode: vmState, hasSelection, isDirty })
  }, [onRegisterCommonActionsState, viewMode, selectedId, detailUser, isDirty])

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

      // DETAIL: Správa příloh (modal)
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

        setAttachmentsOpen(true)
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
          setAttachmentsOpen(false)
          submitRef.current = null
          inviteSubmitRef.current = null
          setInvitePresetSubjectId(null)

          setUrl({ t: 'users-list', id: '', vm: 'create' }, 'push')
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
          setDetailUser(saved)
          setIsDirty(false)
          await load()
          setViewMode('read')

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
  ])

  // -------------------------
  // Render helpers (bez anonymních fn v JSX)
  // -------------------------
  const handleRowClick = useCallback(
    (row: ListViewRow<UiUser>) => {
      setSelectedId(String(row.id))
    },
    [setSelectedId]
  )

  const handleRowDoubleClick = useCallback(
    (row: ListViewRow<UiUser>) => {
      const user = row.raw
      if (!user) return
      openDetail(user, 'read', 'detail')
    },
    [openDetail]
  )

  const handleInviteRegisterSubmit = useCallback((fn: () => Promise<boolean>) => {
    inviteSubmitRef.current = fn
  }, [])

  const handleDetailRegisterInviteSubmit = useCallback((fn: () => Promise<boolean>) => {
    inviteSubmitRef.current = fn
  }, [])

  const handleDetailRegisterSubmit = useCallback((fn: () => Promise<UiUser | null>) => {
    submitRef.current = fn
  }, [])

  const handleDetailActiveSectionChange = useCallback((id: any) => {
    setDetailActiveSectionId(id as any)
  }, [])

  const handleAttachmentsClose = useCallback(() => {
    setAttachmentsOpen(false)
  }, [])

  const attachmentsTitle = useMemo(() => {
    if (!detailUser) return 'Přílohy'
    return `Přílohy – ${detailUser.displayName || detailUser.id}`
  }, [detailUser])

  // -------------------------
  // Render
  // -------------------------
  if (viewMode === 'list') {
    return (
      <div>
        {error && (
          <div className="detail-view__placeholder">
            Chyba: <strong>{error}</strong>
          </div>
        )}
        {loading && <div className="detail-view__placeholder">Načítám…</div>}

        <ListView<UiUser>
          columns={COLUMNS}
          rows={rows}
          filterValue={filterText}
          onFilterChange={setFilterText}
          showArchived={showArchived}
          onShowArchivedChange={setShowArchived}
          selectedId={selectedId ?? null}
          onRowClick={handleRowClick}
          onRowDoubleClick={handleRowDoubleClick}
        />
      </div>
    )
  }

  if (viewMode === 'invite') {
    return (
      <InviteUserFrame presetSubjectId={invitePresetSubjectId} onDirtyChange={setIsDirty} onRegisterSubmit={handleInviteRegisterSubmit} />
    )
  }

  if ((viewMode === 'read' || viewMode === 'edit' || viewMode === 'create') && detailUser) {
    return (
      <>
        <UserDetailFrame
          user={detailUser}
          viewMode={viewMode as ViewMode}
          initialSectionId={detailInitialSectionId}
          onActiveSectionChange={handleDetailActiveSectionChange}
          onRegisterInviteSubmit={handleDetailRegisterInviteSubmit}
          onDirtyChange={setIsDirty}
          onRegisterSubmit={handleDetailRegisterSubmit}
        />

        <Modal open={attachmentsOpen} onClose={handleAttachmentsClose} title={attachmentsTitle}>
          <DetailAttachmentsSection
            entityType="subjects"
            entityId={detailUser.id}
            entityLabel={detailUser.displayName}
            mode="view"
          />
        </Modal>
      </>
    )
  }

  return null
}
