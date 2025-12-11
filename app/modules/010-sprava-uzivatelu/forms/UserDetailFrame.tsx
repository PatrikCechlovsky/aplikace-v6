/*
 * FILE: app/modules/010-sprava-uzivatelu/forms/UserDetailFrame.tsx
 * PURPOSE: Rámec detailu uživatele – používá EntityDetailFrame + DetailView + UserDetailForm
 */

'use client'

import React, { useState } from 'react'
import EntityDetailFrame from '@/app/UI/EntityDetailFrame'
import DetailView, { DetailViewMode } from '@/app/UI/DetailView'
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

export default function UserDetailFrame({ user }: UserDetailFrameProps) {
  const [mode, setMode] = useState<DetailViewMode>('view')
  const [isDirty, setIsDirty] = useState(false)

  // TODO: tady později doplníme reálnou logiku
  const handleAttach = () => {
    console.log('[UserDetailFrame] Paperclip → otevřít sekci Přílohy')
  }

  const handleUndo = () => {
    console.log('[UserDetailFrame] Undo → vrátit změny formuláře')
    // tady bys resetnul stav formuláře (např. přes key nebo předání funkce do UserDetailForm)
  }

  const handleReject = () => {
    console.log('[UserDetailFrame] Reject → zamítnout / archivovat uživatele')
  }

  const handleSave = () => {
    console.log('[UserDetailFrame] Save → uložit změny')
  }

  const handleCancel = () => {
    console.log('[UserDetailFrame] Cancel → zavřít detail uživatele')
  }

  return (
    <EntityDetailFrame
      title={user.displayName}
      subtitle={user.email}
      // attachmentsSlot / systemInfoSlot necháme zatím default
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
