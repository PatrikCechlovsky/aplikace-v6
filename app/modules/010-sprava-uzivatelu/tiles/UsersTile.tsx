/*
 * FILE: app/modules/010-sprava-uzivatelu/tiles/UsersTile.tsx
 * PURPOSE: Modul 010 – přehled uživatelů (list + detail) + CommonActions v6.
 */

'use client'

import React, { useEffect, useMemo, useState } from 'react'
import ListView, { type ListViewColumn, type ListViewRow } from '@/app/UI/ListView'
import type { CommonActionId, ViewMode } from '@/app/UI/CommonActions'
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

type UsersTileProps = {
  onRegisterCommonActions?: (actions: CommonActionId[]) => void
  onRegisterCommonActionsState?: (state: any) => void // kompatibilita (AppShell normalizuje)
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

  // režim pro CommonActions v6: list/read/edit/create
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  // detail data
  const [detailUser, setDetailUser] = useState<MockUser | null>(null)

  // dirty stav detailu (hlásí UserDetailForm přes UserDetailFrame)
  const [isDirty, setIsDirty] = useState(false)

  // key pro re-mount formu (např. cancel → reset)
  const [formKey, setFormKey] = useState(1)

  const hasSelection = !!selectedId

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

  function openDetail(user: MockUser, mode: ViewMode = 'read') {
    setDetailUser(user)
    setViewMode(mode)
    setIsDirty(false)
    setFormKey((k) => k + 1)
  }

  function closeDetailToList() {
    setDetailUser(null)
    setViewMode('list')
    setIsDirty(false)
    setFormKey((k) => k + 1)
  }

  // ✅ Akce = jen klíče v pořadí
  const commonActions = useMemo<CommonActionId[]>(() => {
    if (viewMode === 'list') {
      return ['add', 'detail', 'edit', 'invite', 'columnSettings', 'import', 'export', 'delete']
    }

    if (viewMode === 'read') {
      // cancel = zavřít detail → list
      return ['cancel', 'edit', 'delete', 'archive']
    }

    if (viewMode === 'edit' || viewMode === 'create') {
      // v edit/create: zpět do čtení + save/cancel
      return ['detail', 'save', 'saveAndClose', 'cancel']
    }

    return []
  }, [viewMode])

  useEffect(() => {
    onRegisterCommonActions?.(commonActions)
  }, [onRegisterCommonActions, commonActions])

  useEffect(() => {
    onRegisterCommonActionsState?.({
      viewMode,
      hasSelection,
      isDirty,
    })
  }, [onRegisterCommonActionsState, viewMode, hasSelection, isDirty])

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

        if (id === 'detail' || id === 'edit') {
          if (!selectedId) return
          const user = MOCK_USERS.find((u) => u.id === selectedId) ?? null
          if (!user) return
          openDetail(user, id === 'edit' ? 'edit' : 'read')
          return
        }

        console.log('[UsersTile] action:', id)
        return
      }

      // READ
      if (viewMode === 'read') {
        if (id === 'cancel') {
          closeDetailToList()
          return
        }
        if (id === 'edit') {
          setViewMode('edit')
          return
        }

        console.log('[UsersTile] action:', id)
        return
      }

      // EDIT / CREATE
      if (viewMode === 'edit' || viewMode === 'create') {
        if (id === 'detail') {
          // zpět do čtení
          setViewMode('read')
          setIsDirty(false)
          setFormKey((k) => k + 1)
          return
        }

        if (id === 'cancel') {
          // create → list, edit → read
          if (viewMode === 'create') {
            closeDetailToList()
          } else {
            setViewMode('read')
            setIsDirty(false)
            setFormKey((k) => k + 1)
          }
          return
        }

        if (id === 'save' || id === 'saveAndClose') {
          setIsDirty(false)

          if (id === 'saveAndClose') {
            closeDetailToList()
          } else {
            setViewMode('read')
          }
          return
        }

        console.log('[UsersTile] action:', id)
        return
      }

      console.log('[UsersTile] action:', id)
    }

    onRegisterCommonActionHandler(handler)
  }, [onRegisterCommonActionHandler, viewMode, selectedId])

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
            if (row.raw) openDetail(row.raw, 'read')
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
    return (
      <UserDetailFrame
        key={formKey}
        user={detailUser}
        viewMode={viewMode}
        onDirtyChange={setIsDirty}
      />
    )
  }

  return null
}
