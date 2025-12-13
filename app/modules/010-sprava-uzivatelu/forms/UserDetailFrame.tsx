// FILE: app/modules/010-sprava-uzivatelu/forms/UserDetailFrame.tsx
// PURPOSE: Rám detailu uživatele pro modul 010.
//          Přidá "ouška" (Tabs) pod header a ukáže 3 sekce (zatím 1 reálná).

'use client'

import React, { useMemo, useState } from 'react'
import EntityDetailFrame from '@/app/UI/EntityDetailFrame'
import DetailView, { type DetailViewMode } from '@/app/UI/DetailView'
import DetailTabs from '@/app/UI/DetailTabs'
import UserDetailForm from './UserDetailForm'

type UserDetailFrameProps = {
  user: {
    id: string
    displayName: string
    email: string
    phone?: string
    roleLabel: string
    twoFactorMethod?: string | null
    createdAt: string
    isArchived?: boolean
  }
}

type TabId = 'basics' | 'security' | 'audit'

export default function UserDetailFrame({ user }: UserDetailFrameProps) {
  // Režim – zatím fixně „view“, později napojíme na CommonActions (view/edit toggle)
  const [mode] = useState<DetailViewMode>('view')

  // Dirty flag z vnitřního formuláře – připravené pro napojení na CommonActions
  const [isDirty, setIsDirty] = useState(false)

  // Aktivní sekce (ouško)
  const [activeTab, setActiveTab] = useState<TabId>('basics')

  const tabs = useMemo(
    () => [
      { id: 'basics', label: 'Základ' },
      { id: 'security', label: 'Bezpečnost' },
      { id: 'audit', label: 'Audit' },
    ],
    []
  )

  return (
    <EntityDetailFrame title="Uživatel">
      <DetailView mode={mode} isDirty={isDirty}>
        <DetailTabs
          items={tabs as any}
          activeId={activeTab}
          onChange={(id) => setActiveTab(id as TabId)}
        />

        {/* Sekce – pro FÁZI 1 stačí 1 reálná + 2 placeholdery */}
        {activeTab === 'basics' && (
          <section id="detail-section-basics">
            <UserDetailForm user={user} onDirtyChange={setIsDirty} />
          </section>
        )}

        {activeTab === 'security' && (
          <section id="detail-section-security" style={{ padding: '10px 2px' }}>
            <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
              Bezpečnostní sekce bude doplněna (2FA, metody přihlášení, reset…).
            </div>
          </section>
        )}

        {activeTab === 'audit' && (
          <section id="detail-section-audit" style={{ padding: '10px 2px' }}>
            <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
              Audit sekce bude doplněna (createdAt, změny, archivace…).
            </div>
          </section>
        )}
      </DetailView>
    </EntityDetailFrame>
  )
}
