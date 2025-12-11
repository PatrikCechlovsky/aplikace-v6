/*
 * FILE: app/modules/010-sprava-uzivatelu/forms/UserDetailFrame.tsx
 * PURPOSE: Spojení EntityDetailFrame + UserDetailForm pro modul 010
 */

'use client'

import React from 'react'
import EntityDetailFrame from '@/app/UI/EntityDetailFrame'
import UserDetailForm from './UserDetailForm'

export type UserDetailMode = 'view' | 'edit' | 'create'

export type UserForDetail = {
  id: string
  displayName: string
  email: string
  phone?: string
  roleLabel: string
  twoFactorMethod?: string | null
  createdAt: string
  isArchived?: boolean
}

type UserDetailFrameProps = {
  user: UserForDetail
  mode?: UserDetailMode
  onDirtyChange?: (dirty: boolean) => void
}

const MODE_LABEL: Record<UserDetailMode, string> = {
  view: 'Detail uživatele',
  edit: 'Upravit uživatele',
  create: 'Nový uživatel',
}

export default function UserDetailFrame({
  user,
  mode = 'view',
  onDirtyChange,
}: UserDetailFrameProps) {
  return (
    <EntityDetailFrame
      title={user.displayName}
      subtitle={`${user.email} · ${MODE_LABEL[mode]}`}
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
      <UserDetailForm user={user} onDirtyChange={onDirtyChange} />
    </EntityDetailFrame>
  )
}
