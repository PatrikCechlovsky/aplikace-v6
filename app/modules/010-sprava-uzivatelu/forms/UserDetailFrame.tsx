// FILE: app/modules/010-sprava-uzivatelu/forms/UserDetailFrame.tsx
// PURPOSE: Detail uživatele (010) – modul jen vybírá sekce a dodá ctx, UI Tabs řeší DetailView.

'use client'

import React, { useState } from 'react'
import EntityDetailFrame from '@/app/UI/EntityDetailFrame'
import DetailView, { type DetailViewMode, type DetailSectionId } from '@/app/UI/DetailView'
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
  const [mode] = useState<DetailViewMode>('view')
  const [isDirty, setIsDirty] = useState(false)

  const sectionIds: DetailSectionId[] = ['roles']

  return (
    <EntityDetailFrame title="Uživatel">
      <DetailView
        mode={mode}
        isDirty={isDirty}
        sectionIds={sectionIds}
        ctx={{
          detailContent: <UserDetailForm user={user} onDirtyChange={setIsDirty} />,

          // aby to bylo hned vidět (zatím bez Supabase dotazů)
          rolesData: {
            role: {
              code: (user.roleLabel || 'role').toLowerCase(),
              name: user.roleLabel || '—',
              description: 'Popis role doplníme po napojení na Supabase (role_types).',
            },
            permissions: [],
          },
        }}
      />
    </EntityDetailFrame>
  )
}
