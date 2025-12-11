/*
 * FILE: app/modules/010-sprava-uzivatelu/forms/UserDetailFrame.tsx
 * PURPOSE: Rám detailu uživatele pro modul 010.
 *          Používá EntityDetailFrame + DetailView + UserDetailForm.
 *          Zatím režim jen „view“ (čtení), bez vlastního headeru.
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
}

export default function UserDetailFrame({ user }: UserDetailFrameProps) {
  // Režim – zatím fixně „view“, později napojíme na CommonActions (view/edit toggle)
  const [mode] = useState<DetailViewMode>('view')

  // Dirty flag z vnitřního formuláře – připravené pro napojení na CommonActions
  const [isDirty, setIsDirty] = useState(false)

  return (
    // title / subtitle NEPOSÍLÁME → žádný header jako „Páťa / e-mail“
    <EntityDetailFrame>
      <DetailView mode={mode} isDirty={isDirty}>
        <UserDetailForm user={user} onDirtyChange={setIsDirty} />
      </DetailView>
    </EntityDetailFrame>
  )
}
