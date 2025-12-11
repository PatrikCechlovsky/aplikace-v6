/*
 * FILE: app/modules/010-sprava-uzivatelu/forms/UserDetailFrame.tsx
 * PURPOSE: Rámec detailu uživatele – používá EntityDetailFrame + DetailView + UserDetailForm
 *
 * DŮLEŽITÉ:
 *  - ŽÁDNÁ akční tlačítka nejsou ve formuláři, ale v CommonActions (horní lišta).
 *  - Tohle je jen "stránka s detailem" pro modul 010.
 */

'use client'

import React, { useState } from 'react'
import EntityDetailFrame from '@/app/UI/EntityDetailFrame'
import DetailView, { type DetailViewMode } from '@/app/UI/DetailView'
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
  onClose?: () => void
}

export default function UserDetailFrame({ user, onClose }: UserDetailFrameProps) {
  // Režim formuláře – zatím vždy "view".
  // Později ho budeme přepínat přes CommonActions (edit/view/create).
  const [mode] = useState<DetailViewMode>('view')

  // Dirty flag – dostává info z UserDetailForm přes onDirtyChange
  const [isDirty, setIsDirty] = useState(false)

  const handleSave = () => {
    console.log('[UserDetailFrame] Save → uložit změny (zatím mock)')
    // TODO: volání API + setIsDirty(false)
    setIsDirty(false)
  }

  const handleCancel = () => {
    console.log('[UserDetailFrame] Cancel → zavřít detail uživatele')
    onClose?.()
  }

  return (
    <EntityDetailFrame
      title={user.displayName}
      subtitle={user.email}
      systemInfoSlot={
        <dl className="entity-detail__meta">
          <div className="entity-detail__meta-row">
            <dt>ID</dt>
            <dd>{user.id}</dd>
          </div>
          <div className="entity-detail__meta-row">
            <dt>Vytvořen</dt>
            <dd>{new Date(user.createdAt).toLocaleString('cs-CZ')}</dd>
          </div>
          <div className="entity-detail__meta-row">
            <dt>Stav účtu</dt>
            <dd>{user.isArchived ? 'Archivovaný' : 'Aktivní'}</dd>
          </div>
          <div className="entity-detail__meta-row">
            <dt>Role</dt>
            <dd>{user.roleLabel}</dd>
          </div>
        </dl>
      }
    >
      <DetailView
        mode={mode}
        isDirty={isDirty}
        isSaving={false}
        onSave={handleSave}
        onCancel={handleCancel}
      >
        <UserDetailForm
          user={user}
          onDirtyChange={setIsDirty}
          readOnly={mode === 'view'}
        />
      </DetailView>
    </EntityDetailFrame>
  )
}
