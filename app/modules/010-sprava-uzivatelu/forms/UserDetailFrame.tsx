// FILE: app/modules/010-sprava-uzivatelu/forms/UserDetailFrame.tsx
// PURPOSE: Detail uživatele (010) – načítá detail z DB + ukládá přes service vrstvu (subjects + role + permissions).

'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import EntityDetailFrame from '@/app/UI/EntityDetailFrame'
import DetailView, { type DetailSectionId } from '@/app/UI/DetailView'
import type { ViewMode } from '@/app/UI/CommonActions'
import UserDetailForm, { type UserFormValue } from './UserDetailForm'
import { getUserDetail, saveUser } from '@/app/lib/services/users'

type UiUser = {
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
  user: UiUser
  viewMode: ViewMode // read/edit/create
  onDirtyChange?: (dirty: boolean) => void
  onRegisterSubmit?: (fn: () => Promise<UiUser | null>) => void
}

function roleCodeToLabel(code: string | null | undefined): string {
  const c = (code ?? '').trim().toLowerCase()
  if (!c) return '—'
  if (c === 'admin') return 'Admin'
  if (c === 'user') return 'Uživatel'
  return c
}

export default function UserDetailFrame({ user, viewMode, onDirtyChange, onRegisterSubmit }: UserDetailFrameProps) {
  const sectionIds: DetailSectionId[] = ['roles']

  const detailMode = useMemo(() => {
    if (viewMode === 'edit') return 'edit'
    if (viewMode === 'create') return 'create'
    return 'view'
  }, [viewMode])

  const readOnly = detailMode === 'view'
  const isCreate = user.id === 'new'

  const [loadingDetail, setLoadingDetail] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  // DB “pravda” pro role + permissions
  const [roleCode, setRoleCode] = useState<string | null>(null)
  const [permissionCodes, setPermissionCodes] = useState<string[]>([])

  // DB “pravda” pro subjects (pro případ, že list měl zastaralé hodnoty)
  const [resolvedUser, setResolvedUser] = useState<UiUser>(user)

  // hodnoty z formuláře (posíláme do saveUser)
  const currentRef = useRef<UserFormValue>({
    displayName: user.displayName,
    email: user.email,
    phone: user.phone ?? '',
  })

  useEffect(() => {
    // při přepnutí záznamu reset lokální stav
    setResolvedUser(user)
    currentRef.current = {
      displayName: user.displayName,
      email: user.email,
      phone: user.phone ?? '',
    }
    setRoleCode(null)
    setPermissionCodes([])
    setDetailError(null)
  }, [user.id, user.displayName, user.email, user.phone])

  // Načti detail z DB (jen pokud existuje id)
  useEffect(() => {
    if (isCreate) return

    let cancelled = false
    const run = async () => {
      setLoadingDetail(true)
      setDetailError(null)
      try {
        const d = await getUserDetail(user.id)

        if (cancelled) return

        // subjects → UI
        const s = d.subject
        const merged: UiUser = {
          ...user,
          id: s.id,
          displayName: s.display_name ?? user.displayName,
          email: s.email ?? user.email,
          phone: s.phone ?? user.phone,
          isArchived: !!s.is_archived,
          createdAt: s.created_at ?? user.createdAt,
          roleLabel: roleCodeToLabel(d.role_code ?? null),
          twoFactorMethod: null, // sloupec v DB nemáš
        }

        setResolvedUser(merged)

        // role + permissions
        setRoleCode(d.role_code ?? null)
        setPermissionCodes(d.permissions ?? [])

        // srovnej i currentRef, ať save bere DB hodnoty
        currentRef.current = {
          displayName: merged.displayName,
          email: merged.email,
          phone: merged.phone ?? '',
        }
      } catch (e: any) {
        if (cancelled) return
        setDetailError(e?.message ?? 'Chyba při načítání detailu.')
      } finally {
        if (!cancelled) setLoadingDetail(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [isCreate, user.id])

  const handleValueChange = useCallback((val: UserFormValue) => {
    currentRef.current = val
  }, [])

  // Submit registrace pro CommonActions
  useEffect(() => {
    if (!onRegisterSubmit) return

    const submit = async () => {
      try {
        const v = currentRef.current
               
        // 🔑 display_name pravidla:
        // 1) použij ručně vyplněné
        // 2) fallback na email
        const displayName =
          v.displayName?.trim() ||
          v.email?.trim() ||
          'uživatel'
        
        const saved = await saveUser({
          id: user.id,
        
          // SUBJECT
          subjectType: 'osoba',
        
          displayName,
          email: v.email || null,
          phone: v.phone || null,
        
          titleBefore: v.titleBefore || null,
          firstName: v.firstName || null,
          lastName: v.lastName || null,
          login: v.login || displayName,
        
          isArchived: v.isArchived,
        
          // ROLE + PERMISSIONS
          roleCode: roleCode ?? (isCreate ? 'user' : null),
          permissionCodes: permissionCodes ?? (isCreate ? [] : null),
        })


        const next: UiUser = {
          ...resolvedUser,
          id: saved.id,
          displayName: saved.display_name ?? v.displayName,
          email: saved.email ?? v.email,
          phone: saved.phone ?? v.phone,
          isArchived: !!saved.is_archived,
          createdAt: saved.created_at ?? resolvedUser.createdAt,
          roleLabel: roleCodeToLabel(roleCode ?? (isCreate ? 'user' : null)),
        }

        setResolvedUser(next)
        return next
      } catch (err) {
        console.error('[UserDetailFrame.save] ERROR', err)
        alert('Chyba při ukládání – viz konzole')
        return null
      }
    }

    onRegisterSubmit(submit)
  }, [onRegisterSubmit, user.id, isCreate, resolvedUser, roleCode, permissionCodes])

  const title = useMemo(() => {
    if (detailMode === 'create') return 'Nový uživatel'
    return 'Uživatel'
  }, [detailMode])

  return (
    <EntityDetailFrame title={title}>
      <DetailView
        mode={detailMode}
        sectionIds={sectionIds}
        ctx={{
          entityType: 'user',
          entityId: resolvedUser.id,
          mode: detailMode,

          detailContent: (
            <div>
              {loadingDetail && !isCreate && (
                <div className="detail-form__hint">Načítám detail…</div>
              )}
              {detailError && !isCreate && (
                <div className="detail-form__hint" style={{ color: 'var(--color-danger, #b00020)' }}>
                  {detailError}
                </div>
              )}

              <UserDetailForm
                user={resolvedUser}
                readOnly={readOnly}
                onDirtyChange={onDirtyChange}
                onValueChange={handleValueChange}
              />
            </div>
          ),

          // ✅ Role & permissions data do sekce "roles" v DetailView
          rolesData: {
            role: {
              code: roleCode ?? '',
              name: roleCodeToLabel(roleCode),
              description: 'Role je uložena v subject_roles (subject_id + role_code).',
            },
            permissions: (permissionCodes ?? []).map((code) => ({
              code,
              name: code,
              description: '',
            })),
            availableRoles: [],
          },

          rolesUi: {
            canEdit: !readOnly,
            mode: detailMode,
            onChangeRoleCode: (nextCode: string) => {
              // UI pro výběr role doplníme později; zatím umožníme změnu, pokud někdo zavolá handler.
              setRoleCode(nextCode)
            },
          },
        }}
      />
    </EntityDetailFrame>
  )
}
