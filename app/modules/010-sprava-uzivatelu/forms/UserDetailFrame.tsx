// FILE: app/modules/010-sprava-uzivatelu/forms/UserDetailFrame.tsx
// PURPOSE: Detail uživatele (010) – UI skládá sekce, data ukládá přes service vrstvu.

'use client'

import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import EntityDetailFrame from '@/app/UI/EntityDetailFrame'
import DetailView, { type DetailSectionId } from '@/app/UI/DetailView'
import type { ViewMode } from '@/app/UI/CommonActions'
import UserDetailForm, { type UserFormValue } from './UserDetailForm'
import { saveUser } from '@/app/lib/services/users'

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

export default function UserDetailFrame({ user, viewMode, onDirtyChange, onRegisterSubmit }: UserDetailFrameProps) {
  const sectionIds: DetailSectionId[] = ['roles']

  const detailMode = useMemo(() => {
    if (viewMode === 'edit') return 'edit'
    if (viewMode === 'create') return 'create'
    return 'view'
  }, [viewMode])

  const readOnly = detailMode === 'view'

  const currentRef = useRef<UserFormValue>({
    displayName: user.displayName,
    email: user.email,
    phone: user.phone ?? '',
  })

  useEffect(() => {
    currentRef.current = {
      displayName: user.displayName,
      email: user.email,
      phone: user.phone ?? '',
    }
  }, [user.id, user.displayName, user.email, user.phone])

  const handleValueChange = useCallback((val: UserFormValue) => {
    currentRef.current = val
  }, [])

  useEffect(() => {
    if (!onRegisterSubmit) return

    const submit = async () => {
      try {
        const v = currentRef.current

        const saved = await saveUser({
          id: user.id,
          displayName: v.displayName,
          email: v.email,
          phone: v.phone,
        })

        return {
          ...user,
          id: saved.id,
          displayName: saved.display_name ?? v.displayName,
          email: saved.email ?? v.email,
          phone: saved.phone ?? v.phone,
          isArchived: !!saved.is_archived,
          createdAt: saved.created_at ?? user.createdAt,
        }
      } catch (err) {
        console.error('[UserDetailFrame.save] ERROR', err)
        alert('Chyba při ukládání – viz konzole')
        return null
      }
    }

    onRegisterSubmit(submit)
  }, [onRegisterSubmit, user])

  return (
    <EntityDetailFrame title="Uživatel">
      <DetailView
        mode={detailMode}
        sectionIds={sectionIds}
        ctx={{
          entityType: 'user',
          entityId: user.id,
          mode: detailMode,

          detailContent: (
            <UserDetailForm
              user={user}
              readOnly={readOnly}
              onDirtyChange={onDirtyChange}
              onValueChange={handleValueChange}
            />
          ),

          rolesData: {
            role: {
              code: (user.roleLabel || 'role').toLowerCase(),
              name: user.roleLabel || '—',
              description: 'Role napojíme přes subject_roles (modul 900).',
            },
            permissions: [],
            availableRoles: [],
          },

          rolesUi: {
            canEdit: !readOnly,
            mode: detailMode,
            onChangeRoleCode: () => {
              // TODO: napojíme později
            },
          },
        }}
      />
    </EntityDetailFrame>
  )
}
