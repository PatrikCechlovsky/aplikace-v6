// FILE: app/modules/010-sprava-uzivatelu/forms/UserDetailFrame.tsx
// PURPOSE: Detail uživatele (010) – modul vybírá sekce a dodá ctx.

'use client'

import React, { useMemo } from 'react'
import EntityDetailFrame from '@/app/UI/EntityDetailFrame'
import DetailView, { type DetailSectionId } from '@/app/UI/DetailView'
import type { ViewMode } from '@/app/UI/CommonActions'
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
  viewMode: ViewMode // read/edit/create
  onDirtyChange?: (dirty: boolean) => void
  onRegisterSubmit?: (fn: () => Promise<any>) => void
}

export default function UserDetailFrame({ user, viewMode, onDirtyChange }: UserDetailFrameProps) {
  const sectionIds: DetailSectionId[] = ['roles']

  // DetailView má svoje typy 'view|edit|create', my mapujeme z CommonActions viewMode
  const detailMode = useMemo(() => {
    if (viewMode === 'edit') return 'edit'
    if (viewMode === 'create') return 'create'
    return 'view'
  }, [viewMode])

  const readOnly = detailMode === 'view'

  return (
    <EntityDetailFrame title="Uživatel">
      <DetailView
        mode={detailMode}
        sectionIds={sectionIds}
        ctx={{
          detailContent: (
            <UserDetailForm user={user} onDirtyChange={onDirtyChange} readOnly={readOnly} />
          ),

          rolesData: {
            role: {
              code: (user.roleLabel || 'role').toLowerCase(),
              name: user.roleLabel || '—',
              description: 'Popis role doplníme po napojení na Supabase (role_types).',
            },
            permissions: [],
            availableRoles: [],
          },

          rolesUi: {
            canEdit: !readOnly,
            mode: detailMode,
            onChangeRoleCode: () => {
              // MVP: zatím bez napojení
            },
          },
        }}
      />
    </EntityDetailFrame>
  )
}
