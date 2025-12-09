/*
 * FILE: app/modules/010-sprava-uzivatelu/tiles/UsersTile.tsx
 * PURPOSE: Tile modulu 010 – ListView se seznamem uživatelů.
 *          Žádný detail vpravo, žádný vlastní CommonActions,
 *          jen přehled + filtr a „Zobrazit archivované“.
 */

'use client'

import React, { useMemo, useState } from 'react'
import EntityList, {
  type EntityListColumn,
  type EntityListRow,
} from '@/app/UI/EntityList'

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

// 💡 Dočasná mapovací tabulka barev rolí.
// Později nahradíme reálnými barvami z modulu 900 (typy rolí).
const ROLE_COLORS: Record<string, string> = {
  Administrátor: '#f4d35e',
  Manager: '#e05570',
  Nájemník: '#1e6fff',
  Pronajímatel: '#1fb086',
  Údržbář: '#d63ea5',
  Uživatel: '#6b7280',
}

// Sloupce pro EntityList – Role | Jméno | E-mail | Archivován
const COLUMNS: EntityListColumn[] = [
  { key: 'roleLabel', label: 'Role', width: '16%' },
  { key: 'displayName', label: 'Jméno' }, // necháme automatickou šířku
  { key: 'email', label: 'E-mail' },
  { key: 'isArchived', label: 'Archivován', width: '10%', align: 'center' },
]

// Mapování mock dat na EntityListRow
function toRow(user: MockUser): EntityListRow {
  const color =
    ROLE_COLORS[user.roleLabel] ??
    '#6b7280' // fallback – šedá, když roli neznáme

  return {
    id: user.id,
    // levý proužek – stejně jako u subjektů / typů
    typeColor: color,
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

export default function UsersTile() {
  const [selectedId, setSelectedId] = useState<string | number | null>(null)
  const [filterText, setFilterText] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  const rows: EntityListRow[] = useMemo(() => {
    const normalizedFilter = filterText.trim().toLowerCase()

    return MOCK_USERS
      .filter((u) => {
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
      })
      .map(toRow)
  }, [filterText, showArchived])

  return (
    <div className="users-list">
      {/* Filtr + zobrazit archivované – přes celý horní řádek,
          žádný CommonActions uvnitř tohoto tile */}
      <div className="users-list__header">
        <input
          className="users-list__filter-input"
          placeholder="Filtrovat…"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />

        <label className="users-list__checkbox">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          <span>Zobrazit archivované</span>
        </label>
      </div>

      <div className="users-list__table-wrapper">
        <EntityList
          columns={COLUMNS}
          rows={rows}
          loading={false}
          onRowClick={(row) => setSelectedId(row.id)}
          emptyText="Zatím žádní uživatelé."
        />
      </div>

      <style jsx>{`
        .users-list {
          background: white;
          border-radius: 0.75rem;
          padding: 12px 16px 16px;
          box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .users-list__header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .users-list__filter-input {
          flex: 1;
          min-width: 180px;
          font-size: 0.85rem;
          padding: 6px 8px;
          border-radius: 999px;
          border: 1px solid #d1d5db;
          background: #f9fafb;
        }

        .users-list__filter-input:focus {
          outline: none;
          border-color: #22c55e;
          box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.25);
          background: #ffffff;
        }

        .users-list__checkbox {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          color: #4b5563;
          user-select: none;
          white-space: nowrap;
        }

        .users-list__checkbox input {
          margin: 0;
        }

        .users-list__table-wrapper {
          flex: 1;
          min-height: 160px;
        }

        @media (max-width: 900px) {
          .users-list {
            padding: 8px 8px 12px;
          }

          .users-list__header {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  )
}
