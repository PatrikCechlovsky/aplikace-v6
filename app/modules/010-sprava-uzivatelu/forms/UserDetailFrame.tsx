// FILE: app/modules/010-sprava-uzivatelu/forms/UserDetailFrame.tsx
// PURPOSE: Detail uživatele (010) – modul vybírá sekce a dodá ctx.

'use client'

import React, { useEffect, useMemo, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import EntityDetailFrame from '@/app/UI/EntityDetailFrame'
import DetailView, { type DetailSectionId } from '@/app/UI/DetailView'
import type { ViewMode } from '@/app/UI/CommonActions'
import UserDetailForm from './UserDetailForm'

export type UserFormValue = {
  displayName: string
  email: string
  phone?: string
}

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

// 🔧 Uprav podle reality v Supabase (zatím MVP)
const TABLE_USERS = 'subjects'

// ✅ client-side Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function saveUserToSupabase(input: { id: string; displayName: string; email: string; phone?: string }) {
  // mapování na DB sloupce (uprav podle svých názvů)
  const payload: any = {
    display_name: input.displayName,
    email: input.email,
    phone: input.phone ?? null,
  }

  const isCreate = input.id === 'new'
  const id = isCreate ? crypto.randomUUID() : input.id

  const { data, error } = await supabase
    .from(TABLE_USERS)
    .upsert({ id, ...payload }, { onConflict: 'id' })
    .select('*')
    .single()

  if (error) throw error

  return { id, row: data }
}

export default function UserDetailFrame({
  user,
  viewMode,
  onDirtyChange,
  onRegisterSubmit,
}: UserDetailFrameProps) {
  const sectionIds: DetailSectionId[] = ['roles']

  // DetailView má svoje typy 'view|edit|create', my mapujeme z CommonActions viewMode
  const detailMode = useMemo(() => {
    if (viewMode === 'edit') return 'edit'
    if (viewMode === 'create') return 'create'
    return 'view'
  }, [viewMode])

  const readOnly = detailMode === 'view'

  // aktuální hodnoty formuláře – držíme v ref, aby šly uložit přes CommonActions save
  const currentRef = useRef<UserFormValue>({
    displayName: user.displayName,
    email: user.email,
    phone: user.phone ?? '',
  })

  // při změně uživatele (jiný záznam) reset ref
  useEffect(() => {
    currentRef.current = {
      displayName: user.displayName,
      email: user.email,
      phone: user.phone ?? '',
    }
  }, [user.id, user.displayName, user.email, user.phone])

  // registrace submit funkce pro UsersTile (save/saveAndClose)
  useEffect(() => {
    if (!onRegisterSubmit) return

    const submit = async () => {
      const v = currentRef.current

      const saved = await saveUserToSupabase({
        id: user.id,
        displayName: v.displayName,
        email: v.email,
        phone: v.phone,
      })

      // vracíme objekt pro UsersTile (aby uměl refresh detailUser)
      return {
        ...user,
        id: saved.id,
        displayName: v.displayName,
        email: v.email,
        phone: v.phone,
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
          detailContent: (
            <UserDetailForm
              user={user}
              readOnly={readOnly}
              onDirtyChange={onDirtyChange}
              onValueChange={(val) => {
                currentRef.current = val
              }}
            />
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
