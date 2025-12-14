/*
 * FILE: app/modules/010-sprava-uzivatelu/tiles/UsersTile.tsx
 * PURPOSE: Modul 010 – přehled uživatelů.
 *          ✅ Vždy buď jen SEZNAM, nebo jen DETAIL přes celý content.
 */

'use client'

import React, { useEffect, useMemo, useState } from 'react'
import ListView, {
  type ListViewColumn,
  type ListViewRow,
} from '@/app/UI/ListView'
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

// Mapování mock dat na ListViewRow – stejný pattern použijeme i v dalších modulech
function toRow(user: MockUser): ListViewRow<MockUser> {
  const color = ROLE_COLORS[user.roleLabel] ?? '#6b7280'

  return {
    id: user.id,
    raw: user,
    data: {
      roleLabel: (
        <span
          className="generic-type__name-badge"
          style={{ backgroundColor: color }}
        >
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
  onRegisterCommonActions?: (
    actions: CommonActionId[],
  ) => void
}

// 🔁 Jednoduchý viewMode: list ↔ detail
type UsersViewMode = 'list' | 'detail'

export default function UsersTile({ onRegisterCommonActions }: UsersTileProps) {
  const [selectedId, setSelectedId] = useState<string | number | null>(null)
  const [filterText, setFilterText] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  const [viewMode, setViewMode] = useState<UsersViewMode>('list')
  const [detailUser, setDetailUser] = useState<MockUser | null>(null)
  
  const commonActions: CommonActionId[] =
  viewMode === 'list'
    ? [
        'add',
        'view',
        'edit',
        'invite',
        'columnSettings',
        'import',
        'export',
        'reject',
      ]
    : [
        'view',
        'edit',
        'reject',
      ]
  <CommonActions
  actions={commonActions}
  hasSelection={!!activeId}
  isDirty={isDirty}
  ctx={{
    setMode,
    setActiveId,
    activeId,
  }}
/>

  // Filtrování mock dat podle textu + archivace
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
    setViewMode('detail')
  }

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
            // Dvojklik = otevřít detail pro ČTENÍ přes celý content
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
    // UserDetailFrame si uvnitř sám řeší obsah formuláře
    return <UserDetailFrame user={detailUser} />
  }

  // Fallback – kdyby něco nesedělo
  return null
}
