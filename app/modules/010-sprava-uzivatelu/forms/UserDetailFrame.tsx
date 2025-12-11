/*
 * FILE: app/modules/010-sprava-uzivatelu/forms/UserDetailFrame.tsx
 * PURPOSE: Rámec detailu uživatele – používá EntityDetailFrame + DetailView + UserDetailForm
 */

'use client'

import React, { useState } from 'react'
import EntityDetailFrame from '@/app/UI/EntityDetailFrame'
import DetailView, { type DetailViewMode } from '@/app/UI/DetailView'
import UserDetailForm from './UserDetailForm'

export type UserDetailMode = DetailViewMode

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
  const [mode, setMode] = useState<DetailViewMode>('view')
  const [isDirty, setIsDirty] = useState(false)

  const handleAttach = () => {
    // 📎 přechod na sekci Přílohy – později napojíme na tab v EntityDetailFrame
    console.log('[UserDetailFrame] Paperclip → otevřít sekci Přílohy')
  }

  const handleUndo = () => {
    // ↺ vrácení změn – tady můžeš případně resetnout stav formuláře
    console.log('[UserDetailFrame] Undo → vrátit změny formuláře')
    setIsDirty(false)
  }

  const handleReject = () => {
    // ✕ zamítnout / odmítnout – modulová logika (např. zrušit pozvánku)
    console.log('[UserDetailFrame] Reject → zamítnout / archivovat uživatele')
  }

  const handleSave = () => {
    console.log('[UserDetailFrame] Save → uložit změny (zatím mock)')
    // tady později volání API + po úspěchu setIsDirty(false)
    setIsDirty(false)
    if (mode === 'create') {
      setMode('view')
    }
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
        onModeChange={setMode}
        onAttach={handleAttach}
        onUndo={handleUndo}
        onReject={handleReject}
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
