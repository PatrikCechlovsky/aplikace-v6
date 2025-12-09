/*
 * FILE: app/modules/010-sprava-uzivatelu/tiles/UsersTile.tsx
 * PURPOSE: Hlavní tile modulu 010 – seznam uživatelů + základní detail
 */

'use client'

import React, { useMemo, useState } from 'react'
import EntityList, {
  type EntityListColumn,
  type EntityListRow,
} from '@/app/UI/EntityList'
import EntityDetailFrame from '@/app/UI/EntityDetailFrame'
import CommonActions from '@/app/UI/CommonActions'
import type { CommonActionId } from '@/app/UI/CommonActions'
import UserDetailForm from '../forms/UserDetailForm'

// 🚧 Dočasná mock data – později napojíme na Supabase / subject tabulku
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
    displayName: 'Jan Novák',
    email: 'jan.novak@example.com',
    phone: '+420 777 111 222',
    roleLabel: 'Admin',
    twoFactorMethod: 'app',
    createdAt: '2024-01-15',
    isArchived: false,
  },
  {
    id: 'u-002',
    displayName: 'Pavla Svobodová',
    email: 'pavla.svobodova@example.com',
    phone: '+420 602 333 444',
    roleLabel: 'Uživatel',
    twoFactorMethod: 'sms',
    createdAt: '2024-02-03',
    isArchived: false,
  },
  {
    id: 'u-003',
    displayName: 'Test Archivovaný',
    email: 'archiv@example.com',
    phone: '',
    roleLabel: 'Uživatel',
    twoFactorMethod: null,
    createdAt: '2023-11-20',
    isArchived: true,
  },
]

// Sloupce pro EntityList – podle 010-users-spec.md
const COLUMNS: EntityListColumn[] = [
  { key: 'displayName', label: 'Uživatel', width: '30%' },
  { key: 'email', label: 'E-mail', width: '30%' },
  { key: 'phone', label: 'Telefon', width: '20%' },
  { key: 'roleLabel', label: 'Role', width: '10%' },
  { key: 'twoFactorMethod', label: '2FA', width: '10%' },
]

// Mapování mock dat na EntityListRow
function toRow(user: MockUser): EntityListRow {
  return {
    id: user.id,
    typeColor: user.isArchived ? '#9CA3AF' : '#22C55E', // šedá vs. zelená
    data: {
      displayName: user.displayName,
      email: user.email,
      phone: user.phone || '—',
      roleLabel: user.roleLabel,
      twoFactorMethod: user.twoFactorMethod
        ? user.twoFactorMethod.toUpperCase()
        : '—',
    },
  }
}

// Definice akcí v horní liště detailu
type UserCommonAction = {
  id: CommonActionId
  label: string
}

const DETAIL_ACTIONS: UserCommonAction[] = [
  { id: 'save', label: 'Uložit' },
  { id: 'saveAndClose', label: 'Uložit a zavřít' },
  { id: 'cancel', label: 'Zrušit' },
]

export default function UsersTile() {
  const [selectedId, setSelectedId] = useState<string | number | null>(null)

  const rows: EntityListRow[] = useMemo(
    () => MOCK_USERS.map(toRow),
    [],
  )

  const selectedUser: MockUser | null =
    (MOCK_USERS.find((u) => u.id === selectedId) as MockUser | undefined) ??
    null

  return (
    <div className="users-tile">
      <div className="users-tile__layout">
        {/* Levá část – seznam uživatelů */}
        <div className="users-tile__list-pane">
          <div className="users-tile__list-header">
            <h2 className="users-tile__title">Uživatelé</h2>
            <p className="users-tile__subtitle">
              Seznam všech uživatelů systému (mock data – později napojíme na
              Supabase).
            </p>
          </div>

          {/* TODO: filtry + fulltext (zatím jen seznam) */}

          <EntityList
            columns={COLUMNS}
            rows={rows}
            loading={false}
            onRowClick={(row) => setSelectedId(row.id)}
            emptyText="Zatím žádní uživatelé."
          />
        </div>

        {/* Pravá část – detail vybraného uživatele */}
        <div className="users-tile__detail-pane">
          {selectedUser ? (
            <EntityDetailFrame
              title={selectedUser.displayName}
              subtitle={selectedUser.email}
              attachmentsSlot={
                <div className="text-xs text-gray-500">
                  Přílohy uživatele budou doplněny později.
                </div>
              }
              systemInfoSlot={
                <div className="text-xs text-gray-500 space-y-1">
                  <div>ID: {selectedUser.id}</div>
                  <div>Vytvořeno: {selectedUser.createdAt}</div>
                  <div>
                    Stav:{' '}
                    {selectedUser.isArchived ? 'Archivovaný' : 'Aktivní'}
                  </div>
                </div>
              }
            >
              <div className="users-tile__detail-header">
                <CommonActions
                  items={DETAIL_ACTIONS.map((a) => ({
                    id: a.id,
                    label: a.label,
                    icon:
                      a.id === 'save' || a.id === 'saveAndClose'
                        ? 'save'
                        : 'cancel',
                  }))}
                  align="right"
                />
              </div>

              <UserDetailForm user={selectedUser} />
            </EntityDetailFrame>
          ) : (
            <div className="users-tile__detail-empty">
              Vyber uživatele ze seznamu vlevo.
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .users-tile__layout {
          display: grid;
          grid-template-columns: minmax(260px, 40%) minmax(0, 1fr);
          gap: 16px;
          height: 100%;
        }

        .users-tile__list-pane {
          background: white;
          border-radius: 0.75rem;
          padding: 16px;
          box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .users-tile__detail-pane {
          background: white;
          border-radius: 0.75rem;
          padding: 16px;
          box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));
          min-height: 320px;
        }

        .users-tile__title {
          font-size: 1rem;
          font-weight: 600;
        }

        .users-tile__subtitle {
          font-size: 0.8rem;
          color: #6b7280;
        }

        .users-tile__detail-header {
          margin-bottom: 16px;
          display: flex;
          justify-content: flex-end;
        }

        .users-tile__detail-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          font-size: 0.9rem;
          color: #6b7280;
        }

        @media (max-width: 900px) {
          .users-tile__layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
