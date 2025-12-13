// FILE: app/modules/010-sprava-uzivatelu/forms/UserDetailFrame.tsx
// PURPOSE:
// - Detail uživatele (modul 010)
// - NEŘEŠÍ Tabs ani sekce
// - Jen definuje, které sekce chce a dodá obsah "Detail"

'use client'

import React, { useState } from 'react'
import EntityDetailFrame from '@/app/UI/EntityDetailFrame'
import DetailView, {
  type DetailViewMode,
  type DetailSectionId,
} from '@/app/UI/DetailView'
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
  // režim detailu (zatím fixně view)
  const [mode] = useState<DetailViewMode>('view')

  // dirty stav formuláře
  const [isDirty, setIsDirty] = useState(false)

  /**
   * Sekce pro DETAIL UŽIVATELE
   * - detail + attachments + system se přidají automaticky (always)
   * - tady říkáme jen "navíc"
   */
  const sectionIds: DetailSectionId[] = [
    'roles', // Role a oprávnění – jen uživatel
  ]

  return (
    <EntityDetailFrame
      title="Uživatel"
      subtitle={`${user.displayName} • ${user.email}`}
    >
      <DetailView
        mode={mode}
        isDirty={isDirty}
        sectionIds={sectionIds}
        ctx={{
          // obsah sekce "Detail"
          detailContent: (
            <UserDetailForm user={user} onDirtyChange={setIsDirty} />
          ),
        }}
      />
    </EntityDetailFrame>
  )
}
