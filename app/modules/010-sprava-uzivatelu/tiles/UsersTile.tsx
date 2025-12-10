/*
 * FILE: app/modules/010-sprava-uzivatelu/tiles/UsersTile.tsx
 * PURPOSE: Tile modulu 010 – přehled uživatelů v jednotném ListView vzoru.
 *          Žádný detail vpravo, CommonActions nahoře: add, edit, invite,
 *          columnSettings, import, export, reject (zatím bez logiky).
 */

'use client'

import React, { useEffect, useMemo, useState } from 'react'
import ListView, {
  type ListViewColumn,
  type ListViewRow,
} from '@/app/UI/ListView'
import type { CommonActionConfig } from '@/app/UI/CommonActions'

// Dočasná mock data – později napojíme na tabulku subject + role z modulu 900
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

// 💡 Dočasná mapa barev podle role – později se vezme z modulu 900 (typy rolí)
const ROLE_COLORS: Record<string, string> = {
  Administrátor: '#f4d35e',
  Manager: '#e05570',
  Nájemník: '#1e6fff',
  Pronajímatel: '#1fb086',
  Údržbář: '#d63ea5',
  Uživatel: '#6b7280',
}

// Sloupce pro ListView – stejné názvy jako v ostatních seznamech
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

// Props – AppShell sem může poslat registrátor CommonActions
type UsersTileProps = {
  onRegisterCommonActions?: (actions: CommonActionConfig[]) => void
}

export default function UsersTile({ onRegisterCommonActions }: UsersTileProps) {
  const [selectedId, setSelectedId] = useState<string | number | null>(null)
  const [filterText, setFilterText] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  // 🔘 Při mountu zaregistrujeme default sadu tlačítek do CommonActions
  useEffect(() => {
    if (!onRegisterCommonActions) return

    const actions: CommonActionConfig[] = [
      { id: 'add' },                      // Přidat
      { id: 'edit' },                     // Upravit
      { id: 'invite' },                   // Pozvat
      {
        id: 'columnSettings',             // Nastavení sloupců (ColumnPicker)
        label: 'Nastavení sloupců',
      },
      { id: 'import' },                   // Import
      { id: 'export' },                   // Export
      { id: 'reject' },                   // Odmítnout
    ]

    onRegisterCommonActions(actions)

    // při unmountu CommonActions vyčistíme
    return () => {
      onRegisterCommonActions([])
    }
  }, [onRegisterCommonActions])

  const rows: ListViewRow<MockUser>[] = useMemo(() => {
    const normalizedFilter = filterText.trim().toLowerCase()

    return MOCK_USERS.filter((u) => {
      if (!showArchived && u.isArchived) return false
      if (!normalizedFilter) return true

      const haystack = [
        u.displayName,
        u.email,
        u.phone ?? '',
        u.roleLabel,
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalizedFilter)
    }).map(toRow)
  }, [filterText, showArchived])

  return (
    <div className="users-list">
      <ListView
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
      />

      <style jsx>{`
        .users-list {
          background: white;
          border-radius: 0.75rem;
          padding: 12px 16px 16px;
          box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));
          height: 100%;
          display: flex;
          flex-direction: column;
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
