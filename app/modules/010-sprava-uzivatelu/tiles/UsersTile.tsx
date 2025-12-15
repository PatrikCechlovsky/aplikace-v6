/*
 * FILE: app/modules/010-sprava-uzivatelu/tiles/UsersTile.tsx
 * PURPOSE: Modul 010 – přehled uživatelů.
 *          ✅ Vždy buď jen SEZNAM, nebo jen DETAIL přes celý content.
 */

'use client'

import React, { useEffect, useMemo, useState } from 'react'
import ListView, { type ListViewColumn, type ListViewRow } from '@/app/UI/ListView'
import type { CommonActionId } from '@/app/UI/CommonActions'
import UserDetailFrame from '../forms/UserDetailFrame'

// ⚙️ Dočasná mock data – později napojíme na Supabase / subject tabulku
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

// 💡 Dočasná mapa barev podle role – později se vezme z modulu 900 (typy rolí)
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

// Sloupce pro ListView
const COLUMNS: ListViewColumn[] = [
  { key: 'roleLabel', label: 'Role', width: '18%' },
  { key: 'displayName', label: 'Jméno' },
  { key: 'email', label: 'E-mail' },
  { key: 'isArchived', label: 'Archivován', width: '10%', align: 'center' },
]

// Mapování mock dat na ListViewRow
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

type CommonActionsState = {
  hasSelection: boolean
  isDirty: boolean
}

type UsersTileProps = {
  onRegisterCommonActions?: (actions: CommonActionId[]) => void
  onRegisterCommonActionsState?: (state: CommonActionsState) => void
  onRegisterCommonActionHandler?: (fn: (id: CommonActionId) => void) => void
}

// 🔁 Jednoduché režimy pro napojení na UserDetailFrame i CommonActions koncept
type UsersViewMode = 'list' | 'read'

export default function UsersTile({
  onRegisterCommonActions,
  onRegisterCommonActionsState,
  onRegisterCommonActionHandler,
}: UsersTileProps) {
  // Debug: jestli se soubor fakt načítá
  useEffect(() => {
    console.log('CA: UsersTile mounted', { hasRegisterHandlerProp: !!onRegisterCommonActionHandler })
  }, [onRegisterCommonActionHandler])

  const [selectedId, setSelectedId] = useState<string | number | null>(null)
  const [filterText, setFilterText] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  const [viewMode, setViewMode] = useState<UsersViewMode>('list')
  const [detailUser, setDetailUser] = useState<MockUser | null>(null)

  // MVP – zatím nic needitujeme => dirty false
  const [isDirty] = useState(false)

  const rows: ListViewRow<MockUser>[] = useMemo(() => {
    const normalizedFilter = filterText.trim().toLowerCase()

    return MOCK_USERS.filter((u) => {
      if (!showArchived && u.isArchived) return false
      if (!normalizedFilter) return true

      const haystack = [u.displayName, u.email, u.phone ?? '', u.roleLabel]
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalizedFilter)
    }).map(toRow)
  }, [filterText, showArchived])

  const openDetail = (user: MockUser | null) => {
    if (!user) return
    setDetailUser(user)
    setViewMode('read')
  }

  const closeDetail = () => {
    setViewMode('list')
    setDetailUser(null)
  }

  // ✅ Akce – jen IDčka (pořadí zachováno)
  const commonActions = useMemo<CommonActionId[]>(() => {
    if (viewMode === 'list') {
      return ['add', 'view', 'edit', 'invite', 'columnSettings', 'import', 'export', 'reject']
    }
    // v detailu potřebuju hlavně "zpět"
    return ['cancel', 'edit', 'reject']
  }, [viewMode])

  // Registrace actions
  useEffect(() => {
    onRegisterCommonActions?.(commonActions)
  }, [onRegisterCommonActions, commonActions])

  // Registrace state (selection/dirty) pro disabled logiku
  useEffect(() => {
    onRegisterCommonActionsState?.({
      hasSelection: !!selectedId,
      isDirty: !!isDirty,
    })
  }, [onRegisterCommonActionsState, selectedId, isDirty])

  // ✅ Registrace handleru – to je to, co dělá akce "živé"
  useEffect(() => {
    console.log('CA: UsersTile register handler effect', {
      hasProp: !!onRegisterCommonActionHandler,
      viewMode,
      selectedId,
    })

    if (!onRegisterCommonActionHandler) return

    const handler = (id: CommonActionId) => {
      console.log('CA: UsersTile handler called', id, { viewMode, selectedId })

      // DETAIL / READ
      if (viewMode === 'read') {
        if (id === 'cancel') {
          closeDetail()
          return
        }

        if (id === 'edit') {
          console.log('[UsersTile] edit (MVP)')
          return
        }

        return
      }

      // LIST
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
        openDetail(empty)
        return
      }

      if (id === 'view' || id === 'edit') {
        if (!selectedId) return
        const user = MOCK_USERS.find((u) => u.id === selectedId) ?? null
        if (!user) return
        openDetail(user)
        return
      }
    }

    onRegisterCommonActionHandler(handler)
  }, [onRegisterCommonActionHandler, selectedId, viewMode])

  // ===========================
  //  RENDER: 1) SEZNAM UŽIVATELŮ
  // ===========================
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
            openDetail(row.raw ?? null)
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

  // ===========================
  //  RENDER: 2) DETAIL UŽIVATELE
  // ===========================
  if (detailUser) {
    return <UserDetailFrame user={detailUser} viewMode={viewMode} />
  }

  return null
}
