'use client'

// FILE: app/modules/010-sprava-uzivatelu/tiles/UsersTile.tsx
// PURPOSE: List + detail uživatelů (010) napojený na Supabase přes service vrstvu.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ListView, { type ListViewColumn, type ListViewRow } from '@/app/UI/ListView'
import type { CommonActionId, ViewMode } from '@/app/UI/CommonActions'
import UserDetailFrame from '../forms/UserDetailFrame'
import { listUsers, type SubjectRow } from '@/app/lib/services/users'

type UiUser = {
  id: string
  displayName: string
  email: string
  phone?: string
  roleLabel: string
  twoFactorMethod?: string | null
  createdAt: string
  isArchived?: boolean
}

const COLUMNS: ListViewColumn[] = [
  { key: 'roleLabel', label: 'Role', width: '18%' },
  { key: 'displayName', label: 'Jméno' },
  { key: 'email', label: 'E-mail' },
  { key: 'isArchived', label: 'Archivován', width: '10%', align: 'center' },
]

function mapRowToUi(row: SubjectRow): UiUser {
  return {
    id: row.id,
    displayName: row.display_name ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    roleLabel: 'Uživatel', // TODO: napojíme později přes subject_roles
    twoFactorMethod: null, // TODO: napojíme později (auth metadata / view)
    createdAt: row.created_at ?? '',
    isArchived: !!row.is_archived,
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
  onRegisterCommonActionsState?: (state: { viewMode: ViewMode; hasSelection: boolean; isDirty: boolean }) => void
  onRegisterCommonActionHandler?: (fn: (id: CommonActionId) => void) => void
}

export default function UsersTile({
  onRegisterCommonActions,
  onRegisterCommonActionsState,
  onRegisterCommonActionHandler,
}: UsersTileProps) {
  const [selectedId, setSelectedId] = useState<string | number | null>(null)
  const [filterText, setFilterText] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<UiUser[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [detailUser, setDetailUser] = useState<UiUser | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  // submit funkce z Detailu (zaregistruje ji UserDetailFrame)
  const submitRef = useRef<null | (() => Promise<UiUser | null>)>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const rows = await listUsers({
        searchText: filterText,
        includeArchived: showArchived,
      })
      setUsers(rows.map(mapRowToUi))
    } catch (e: any) {
      setLoadError(e?.message ?? 'Chyba při načítání uživatelů.')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [filterText, showArchived])

  useEffect(() => {
    // jednoduché “live” načítání; později můžeme debounce
    void load()
  }, [load])

  const rows: ListViewRow<UiUser>[] = useMemo(() => users.map(toRow), [users])

  const openDetail = useCallback((user: UiUser | null, mode: ViewMode) => {
    if (!user) return
    setDetailUser(user)
    setViewMode(mode)
    setIsDirty(false)
  }, [])

  const closeDetail = useCallback(() => {
    setViewMode('list')
    setDetailUser(null)
    setIsDirty(false)
    submitRef.current = null
  }, [])

  const commonActions = useMemo<CommonActionId[]>(() => {
    if (viewMode === 'list') return ['add', 'view', 'edit', 'invite', 'columnSettings', 'import', 'export', 'reject']
    if (viewMode === 'read') return ['cancel', 'edit', 'reject']
    return ['save', 'saveAndClose', 'cancel']
  }, [viewMode])

  useEffect(() => {
    onRegisterCommonActions?.(commonActions)
  }, [onRegisterCommonActions, commonActions])

  useEffect(() => {
    onRegisterCommonActionsState?.({
      viewMode,
      hasSelection: !!selectedId,
      isDirty: !!isDirty,
    })
  }, [onRegisterCommonActionsState, viewMode, selectedId, isDirty])

  useEffect(() => {
    if (!onRegisterCommonActionHandler) return

    const handler = async (id: CommonActionId) => {
      // LIST
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
          }
          setSelectedId(empty.id)
          openDetail(empty, 'create')
          return
        }

        if (id === 'view' || id === 'detail' || id === 'edit') {
          if (!selectedId) return
          const user = users.find((u) => u.id === selectedId) ?? null
          if (!user) return
          openDetail(user, id === 'edit' ? 'edit' : 'read')
          return
        }

        return
      }

      // READ
      if (viewMode === 'read') {
        if (id === 'cancel') {
          closeDetail()
          return
        }
        if (id === 'edit') {
          setViewMode('edit')
          return
        }
        return
      }

      // EDIT / CREATE
      if (viewMode === 'edit' || viewMode === 'create') {
        if (id === 'cancel') {
          if (viewMode === 'create') closeDetail()
          else {
            setViewMode('read')
            setIsDirty(false)
          }
          return
        }

        if (id === 'save' || id === 'saveAndClose') {
          if (!submitRef.current) return
          const saved = await submitRef.current()
          if (!saved) return

          setDetailUser(saved)
          setIsDirty(false)

          // refresh list po uložení
          await load()

          if (id === 'saveAndClose') setViewMode('read')
          return
        }
      }
    }

    onRegisterCommonActionHandler(handler)
  }, [onRegisterCommonActionHandler, viewMode, selectedId, users, openDetail, closeDetail, load])

  if (viewMode === 'list') {
    return (
      <div className="users-list">
        <ListView<UiUser>
          columns={COLUMNS}
          rows={rows}
          filterPlaceholder="Hledat podle jména, e-mailu nebo telefonu…"
          filterValue={filterText}
          onFilterChange={setFilterText}
          showArchived={showArchived}
          onShowArchivedChange={setShowArchived}
          showArchivedLabel="Zobrazit archivované"
          emptyText={loading ? 'Načítám…' : loadError ? loadError : 'Zatím žádní uživatelé.'}
          selectedId={selectedId}
          onRowClick={(row) => setSelectedId(row.id)}
          onRowDoubleClick={(row) => {
            setSelectedId(row.id)
            openDetail(row.raw ?? null, 'read')
          }}
        />
      </div>
    )
  }

  if (detailUser) {
    return (
      <UserDetailFrame
        user={detailUser}
        viewMode={viewMode}
        onDirtyChange={setIsDirty}
        onRegisterSubmit={(fn) => {
          submitRef.current = fn
        }}
      />
    )
  }

  return null
}
