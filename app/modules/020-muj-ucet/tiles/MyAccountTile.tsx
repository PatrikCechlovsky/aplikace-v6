// FILE: app/modules/020-muj-ucet/tiles/MyAccountTile.tsx
// PURPOSE: Můj účet - detail přihlášeného uživatele

'use client'

// =====================
// 1) IMPORTS
// =====================

import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { CommonActionId, ViewMode } from '@/app/UI/CommonActions'
import MyAccountDetailFrame from '../forms/MyAccountDetailFrame'
import { getCurrentSession } from '@/app/lib/services/auth'
import { getUserDetail } from '@/app/lib/services/users'
import { useToast } from '@/app/UI/Toast'
import '@/app/styles/components/TileLayout.css'

// =====================
// 2) TYPES
// =====================

type MyAccountTileProps = {
  onRegisterCommonActions?: (actions: CommonActionId[]) => void
  onRegisterCommonActionsState?: (state: { viewMode: ViewMode; hasSelection: boolean; isDirty: boolean }) => void
  onRegisterCommonActionHandler?: (fn: (id: CommonActionId) => void) => void
}

type UiUser = {
  id: string
  displayName: string
  email: string
  phone?: string
  titleBefore?: string | null
  firstName?: string | null
  lastName?: string | null
  login?: string | null
  twoFactorMethod?: string | null
  createdAt: string
  firstLoginAt?: string | null
}

// =====================
// 3) COMPONENT
// =====================

export default function MyAccountTile({
  onRegisterCommonActions,
  onRegisterCommonActionsState,
  onRegisterCommonActionHandler,
}: MyAccountTileProps) {
  const toast = useToast()
  const [user, setUser] = useState<UiUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDirty, setIsDirty] = useState(false)
  const [activeSectionId, setActiveSectionId] = useState<string>('detail')
  const submitRef = useRef<null | (() => Promise<UiUser | null>)>(null)

  // Načíst aktuálního uživatele
  useEffect(() => {
    let cancelled = false

    async function loadUser() {
      try {
        setLoading(true)
        const { data, error } = await getCurrentSession()
        if (cancelled) return

        if (error || !data?.session?.user?.id) {
          toast.showError('Nepodařilo se načíst informace o uživateli.')
          return
        }

        const session = data.session
        const userId = session.user.id

        const detail = await getUserDetail(userId)
        if (cancelled) return

        const s: any = (detail as any)?.subject ?? {}
        const nextUser: UiUser = {
          id: String(s.id ?? userId),
          displayName: String(s.display_name ?? session.user.user_metadata?.full_name ?? session.user.email ?? 'Uživatel'),
          email: String(s.email ?? session.user.email ?? ''),
          phone: (s.phone ?? undefined) as any,
          titleBefore: (s.title_before ?? null) as any,
          firstName: (s.first_name ?? null) as any,
          lastName: (s.last_name ?? null) as any,
          login: (s.login ?? null) as any,
          twoFactorMethod: (s.two_factor_method ?? null) as any,
          createdAt: String(s.created_at ?? ''),
          firstLoginAt: (s.first_login_at ?? null) as any,
        }

        setUser(nextUser)
      } catch (e: any) {
        if (cancelled) return
        toast.showError(e?.message ?? 'Chyba při načítání uživatele')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadUser()
    return () => {
      cancelled = true
    }
  }, [toast])

  // CommonActions
  const commonActions = useMemo<CommonActionId[]>(() => {
    return ['save', 'attachments', 'close']
  }, [])

  useEffect(() => {
    onRegisterCommonActions?.(commonActions)
  }, [onRegisterCommonActions, commonActions])

  useEffect(() => {
    onRegisterCommonActionsState?.({
      viewMode: 'edit',
      hasSelection: true,
      isDirty,
    })
  }, [onRegisterCommonActionsState, isDirty])

  // CommonActions handler
  useEffect(() => {
    if (!onRegisterCommonActionHandler) return

    const handler = async (actionId: CommonActionId) => {
      if (actionId === 'close') {
        // Zavřít modul - vrátit se na home
        window.location.href = '/'
        return
      }

      if (actionId === 'save') {
        if (!submitRef.current) {
          toast.showError('Chybí submit handler.')
          return
        }

        const savedUser = await submitRef.current()
        if (!savedUser) return

        setUser(savedUser)
        setIsDirty(false)
        toast.showSuccess('Změny uloženy')
        return
      }

      if (actionId === 'attachments') {
        setActiveSectionId('attachments')
        return
      }
    }

    onRegisterCommonActionHandler(handler)
  }, [onRegisterCommonActionHandler, toast])

  if (loading) {
    return (
      <div className="tile-layout">
        <div className="tile-layout__header">
          <h1 className="tile-layout__title">Můj účet</h1>
        </div>
        <div className="tile-layout__content">
          <div style={{ padding: '2rem', textAlign: 'center' }}>Načítám...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="tile-layout">
        <div className="tile-layout__header">
          <h1 className="tile-layout__title">Můj účet</h1>
        </div>
        <div className="tile-layout__content">
          <div style={{ padding: '2rem', textAlign: 'center' }}>Nepodařilo se načíst informace o uživateli.</div>
        </div>
      </div>
    )
  }

  return (
    <MyAccountDetailFrame
      user={user}
      initialSectionId={activeSectionId as any}
      onActiveSectionChange={(id) => setActiveSectionId(id)}
      onDirtyChange={setIsDirty}
      onRegisterSubmit={(fn) => {
        submitRef.current = fn
      }}
    />
  )
}

