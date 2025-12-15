/*
 * FILE: app/modules/010-sprava-uzivatelu/tiles/UsersTile.tsx
 * PURPOSE: Modul 010 – přehled uživatelů.
 */

'use client'

import React, { useEffect, useMemo, useState } from 'react'
import ListView, { type ListViewColumn, type ListViewRow } from '@/app/UI/ListView'
import type { CommonActionId, ViewMode } from '@/app/UI/CommonActions'
import UserDetailFrame from '../forms/UserDetailFrame'

type MockUser = {
  id: string
  displayName: string
  email: string
  phone?: string
  roleLabel: string
  twoFactorMethod?: string | null
  createdAt: string
  isArchived?: boolean
}

const ROLE_COLORS: Record<string, string> = {
  Administrátor: '#f4d35e',
  Manager: '#e05570',
  Nájemník: '#1e6fff',
  Pronajímatel: '#1fb086',
  Údržbář: '#d63ea5',
  Uživatel: '#6b7280',
}

const MOCK_USERS: MockUser[] = [
  {
    id: 'u-001',
    displayName: 'Páťa',
    email: 'patrik.cechlovsky@centrum.cz',
    phone: '+420 777 111 222',
    roleLabel: 'Administrátor',
    twoFactorMethod: 'app',
    createdAt: '2024-01-15',
    isArchived: false,
  },
  {
    id: 'u-002',
    displayName: 'patizonan',
    email: 'patizonan@gmail.com',
    phone: '+420 602 333 444',
    roleLabel: 'Uživatel',
    twoFactorMethod: null,
    createdAt: '2024-02-03',
    isArchived: false,
  },
]

const COLUMNS: ListViewColumn[] = [
  { key: 'roleLabel', label: 'Role', width: '18%' },
  { key: 'displayName', label: 'Jméno' },
  { key: 'email', label: 'E-mail' },
  { key: 'isArchived', label: 'Archivován', width: '10%', align: 'center' },
]

function toRow(user: MockUser): ListViewRow<MockUser> {
  const color = ROLE_COLORS[user.roleLabel] ?? '#6b7280'

  return {
    id: user.id,
    raw: user,
    data: {
      roleLabel: (
        <span className="generic-type__name-badge" style={{ backgroundColor: color }}>
          {user.roleLabel}
        </span>
      ),
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

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [detailUser, setDetailUser] = useState<MockUser | null>(null)

  const [isDirty, setIsDirty] = useState(false)

  const rows: ListViewRow<MockUser>[] = useMemo(() => {
    const normalizedFilter = filterText.trim().toLowerCase()

    return MOCK_USERS.filter((u) => {
      if (!showArchived && u.isArchived) return false
      if (!normalizedFilter) return true

      const haystack = [u.displayName, u.email, u.phone ?? '', u.roleLabel].join(' ').toLowerCase()
      return haystack.includes(normalizedFilter)
    }).map(toRow)
  }, [filterText, showArchived])

  const openDetail = (user: MockUser | null, mode: ViewMode = 'read') => {
    if (!user) return
    setDetailUser(user)
    setViewMode(mode)
    setIsDirty(mode === 'edit' || mode === 'create') // MVP: ať jde testovat save
  }

  const closeDetail = () => {
    setViewMode('list')
    setDetailUser(null)
    setIsDirty(false)
  }

  const commonActions = useMemo<CommonActionId[]>(() => {
    if (viewMode === 'list') {
      return ['add', 'view', 'edit', 'invite', 'columnSettings', 'import', 'export', 'reject']
    }
    if (viewMode === 'read') {
      return ['cancel', 'edit', 'reject']
    }
    // edit / create
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

    const handler = (id: CommonActionId) => {
      // LIST
      if (viewMode === 'list') {
        if (id === 'add') {
          const empty: MockUser = {
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

        if (id === 'view' || id === 'edit') {
          if (!selectedId) return
          const user = MOCK_USERS.find((u) => u.id === selectedId) ?? null
          if (!user) return
          openDetail(user, id === 'edit' ? 'edit' : 'read')
          return
        }

        return
      }

      // READ
      if (viewMode === 'read') {
        if (id === 'cancel') {
          // v read používáme cancel jako "zavřít detail"
          closeDetail()
          return
        }
        if (id === 'edit') {
          setViewMode('edit')
          setIsDirty(true) // MVP
          return
        }
        return
      }

      // EDIT / CREATE
      if (viewMode === 'edit' || viewMode === 'create') {
        if (id === 'cancel') {
          // zrušit edit/create -> zpět do read (nebo list u create)
          if (viewMode === 'create') {
            closeDetail()
          } else {
            setViewMode('read')
            setIsDirty(false)
          }
          return
        }

        if (id === 'save' || id === 'saveAndClose') {
          // MVP: tady později napojíme skutečné uložení z UserDetailForm
          setIsDirty(false)
          if (id === 'saveAndClose') {
            setViewMode('read')
          }
          return
        }
      }
    }

    onRegisterCommonActionHandler(handler)
  }, [onRegisterCommonActionHandler, viewMode, selectedId])

  if (viewMode === 'list') {
    return (
      <div className="users-list">
        <ListView<MockUser>
          columns={COLUMNS}
          rows={rows}
          filterPlaceholder="Hledat podle názvu, kódu nebo popisu..."
          filterValue={filterText}
          onFilterChange={setFilterText}
          showArchived={showArchived}
          onShowArchivedChange={setShowArchived}
          showArchivedLabel="Zobrazit archivované"
          emptyText="Zatím žádní uživatelé."
          selectedId={selectedId}
          onRowClick={(row) => setSelectedId(row.id)}
          onRowDoubleClick={(row) => {
            setSelectedId(row.id)
            openDetail(row.raw ?? null, 'read')
          }}
        />

        <style jsx>{`
          .users-list {
            background: transparent;
            border: 0;
            border-radius: 0;
            padding: 0;
            box-shadow: none;
          }
          @media (max-width: 900px) {
            .users-list {
              padding: 8px 8px 12px;
            }
          }
        `}</style>
      </div>
    )
  }

  if (detailUser) {
    return <UserDetailFrame user={detailUser} viewMode={viewMode} />
  }

  return null
}
