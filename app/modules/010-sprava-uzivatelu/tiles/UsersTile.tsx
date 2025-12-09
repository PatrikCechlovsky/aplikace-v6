/*
 * FILE: app/modules/010-sprava-uzivatelu/tiles/UsersTile.tsx
 * PURPOSE: Tile modulu 010 – čistý ListView se seznamem uživatelů.
 *          Žádný detail vpravo, jen přehled + akce v CommonActions.
 */

'use client'

import React, { useMemo, useState, useCallback } from 'react'
import EntityList, {
  type EntityListColumn,
  type EntityListRow,
} from '@/app/UI/EntityList'
import CommonActions, {
  type CommonActionId,
} from '@/app/UI/CommonActions'

// Dočasná mock data – později napojíme na tabulku subject
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

// Sloupce pro EntityList – vzor: Role | Jméno | E-mail | Archivován
const COLUMNS: EntityListColumn[] = [
  { key: 'roleLabel', label: 'Role', width: '18%' },
  { key: 'displayName', label: 'Jméno', width: '32%' },
  { key: 'email', label: 'E-mail', width: '40%' },
  { key: 'isArchived', label: 'Archivován', width: '10%' },
]

// Mapování mock dat na EntityListRow
function toRow(user: MockUser): EntityListRow {
  // Barvy role – jen pro UI, později může jít z číselníku
  const isAdmin = user.roleLabel.toLowerCase().includes('admin')
  const typeColor = isAdmin ? '#facc15' : '#6b7280' // žlutá vs šedá

  return {
    id: user.id,
    typeColor,
    typeLabel: user.roleLabel,
    data: {
      roleLabel: user.roleLabel,
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

  const hasSelection = !!selectedId

  const handleListActionClick = useCallback((id: CommonActionId) => {
    // TODO: tady později skutečná logika (nový uživatel, otevřít detail, archivovat…)
    console.log('ListView akce:', id, 'vybraný ID:', selectedId)
  }, [selectedId])

  return (
    <div className="users-list">
      <div className="users-list__header">
        <div className="users-list__filters">
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

        <CommonActions
          align="right"
          actions={['add', 'view', 'edit', 'archive', 'delete']}
          hasSelection={hasSelection}
          onActionClick={handleListActionClick}
        />
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
          justify-content: space-between;
          gap: 12px;
        }

        .users-list__filters {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .users-list__filter-input {
          flex: 1;
          max-width: 260px;
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

          .users-list__filters {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}
