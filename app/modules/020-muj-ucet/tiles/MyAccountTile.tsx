// FILE: app/modules/020-muj-ucet/tiles/MyAccountTile.tsx
// PURPOSE: Můj účet - detail přihlášeného uživatele

'use client'

// =====================
// 1) IMPORTS
// =====================

import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { CommonActionId, ViewMode } from '@/app/UI/CommonActions'
import MyAccountDetailFrame from '../forms/MyAccountDetailFrame'
import AttachmentsManagerFrame, { type AttachmentsManagerApi, type AttachmentsManagerUiState } from '@/app/UI/attachments/AttachmentsManagerFrame'
import { getCurrentSession } from '@/app/lib/services/auth'
import { getUserDetail } from '@/app/lib/services/users'
import { useToast } from '@/app/UI/Toast'
import { 
  getAttachmentsManagerActions, 
  mapAttachmentsViewMode, 
  getHasSelection, 
  getIsDirty,
  shouldCloseAttachmentsPanel 
} from '@/app/lib/attachments/attachmentsManagerUtils'
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
  
  // Personal identification
  birthDate?: string | null
  personalIdNumber?: string | null
  idDocType?: string | null
  idDocNumber?: string | null
  
  twoFactorMethod?: string | null
  createdAt: string
  firstLoginAt?: string | null
  street?: string | null
  city?: string | null
  zip?: string | null
  houseNumber?: string | null
  country?: string | null
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
  const [viewMode, setViewMode] = useState<'edit' | 'attachments-manager'>('edit')
  const [activeSectionId, setActiveSectionId] = useState<string>('detail')
  const submitRef = useRef<null | (() => Promise<UiUser | null>)>(null)

  // Attachments manager state
  const attachmentsManagerApiRef = useRef<AttachmentsManagerApi | null>(null)
  const [attachmentsManagerUi, setAttachmentsManagerUi] = useState<AttachmentsManagerUiState>({
    hasSelection: false,
    isDirty: false,
    mode: 'list',
  })

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
          birthDate: (s.birth_date ?? null) as any,
          personalIdNumber: (s.personal_id_number ?? null) as any,
          idDocType: (s.id_doc_type ?? null) as any,
          idDocNumber: (s.id_doc_number ?? null) as any,
          twoFactorMethod: (s.two_factor_method ?? null) as any,
          createdAt: String(s.created_at ?? ''),
          firstLoginAt: (s.first_login_at ?? null) as any,
          street: (s.street ?? null) as any,
          city: (s.city ?? null) as any,
          zip: (s.zip ?? null) as any,
          houseNumber: (s.house_number ?? null) as any,
          country: (s.country ?? null) as any,
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
    if (viewMode === 'attachments-manager') {
      const mode = attachmentsManagerUi.mode ?? 'list'
      return getAttachmentsManagerActions(mode, !!attachmentsManagerUi.hasSelection)
    }
    return ['save', 'attachments', 'close']
  }, [viewMode, attachmentsManagerUi.mode, attachmentsManagerUi.hasSelection])

  useEffect(() => {
    onRegisterCommonActions?.(commonActions)
  }, [onRegisterCommonActions, commonActions])

  useEffect(() => {
    const mappedViewMode = viewMode === 'attachments-manager'
      ? mapAttachmentsViewMode(viewMode, attachmentsManagerUi.mode ?? 'list')
      : 'edit' // Můj účet je vždy edit

    const mappedHasSelection = getHasSelection(viewMode as any, null, attachmentsManagerUi)
    const mappedIsDirty = getIsDirty(viewMode as any, isDirty, attachmentsManagerUi)

    onRegisterCommonActionsState?.({
      viewMode: mappedViewMode,
      hasSelection: mappedHasSelection,
      isDirty: mappedIsDirty,
    })
  }, [onRegisterCommonActionsState, viewMode, isDirty, attachmentsManagerUi.mode, attachmentsManagerUi.hasSelection, attachmentsManagerUi.isDirty])

  // CommonActions handler
  useEffect(() => {
    if (!onRegisterCommonActionHandler) return

    const handler = async (actionId: CommonActionId) => {
      // Attachments manager actions
      if (viewMode === 'attachments-manager') {
        // Close necháme propadnout níž do společného CLOSE bloku
        if (actionId === 'close') {
          // žádný return - propadne do společného CLOSE bloku
        } else {
          const api = attachmentsManagerApiRef.current
          if (!api) return

          if (actionId === 'add') {
            api.add()
            return
          }

          if (actionId === 'view') {
            api.view()
            return
          }

          if (actionId === 'edit') {
            api.edit()
            return
          }

          if (actionId === 'save') {
            await api.save()
            return
          }

          if (actionId === 'attachmentsNewVersion') {
            api.newVersion()
            return
          }

          if (actionId === 'columnSettings') {
            api.columnSettings()
            return
          }

          return
        }
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
        if (isDirty) {
          toast.showWarning('Máš neuložené změny. Nejdřív ulož nebo zavři změny a pak otevři správu příloh.')
          return
        }
        if (!user?.id || !user.id.trim() || user.id === 'new') {
          toast.showWarning('Nejdřív ulož záznam, aby šly spravovat přílohy.')
          return
        }
        setViewMode('attachments-manager')
        setIsDirty(false)
        return
      }

      // CLOSE
      if (actionId === 'close') {
        const dirtyNow = viewMode === 'attachments-manager' ? !!attachmentsManagerUi.isDirty : isDirty
        if (dirtyNow) {
          const ok = confirm('Máš neuložené změny. Opravdu chceš zavřít?')
          if (!ok) return
        }

        if (viewMode === 'attachments-manager') {
          const mode = attachmentsManagerUi.mode ?? 'list'
          
          // Použij utility funkci pro zjištění, jestli zavřít jen panel nebo celý manager
          if (shouldCloseAttachmentsPanel(mode)) {
            const api = attachmentsManagerApiRef.current
            if (api?.close) {
              api.close()
            }
            return
          }
          
          // Pokud jsme v list mode, zavřít attachments manager a vrátit se do edit mode "Můj účet"
          setViewMode('edit')
          setActiveSectionId('detail')
          setIsDirty(false)
          return
        }

        // Zavřít modul - vrátit se na home
        window.location.href = '/'
        return
      }
    }

    onRegisterCommonActionHandler(handler)
  }, [onRegisterCommonActionHandler, toast, viewMode, isDirty, user, attachmentsManagerUi])

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

  // Zobrazit attachments manager pokud je aktivní
  if (viewMode === 'attachments-manager') {
    return (
      <AttachmentsManagerFrame
        entityType="subjects"
        entityId={user.id}
        entityLabel={user.displayName ?? null}
        canManage={true}
        readOnlyReason={null}
        onRegisterManagerApi={(api) => {
          attachmentsManagerApiRef.current = api
        }}
        onManagerStateChange={(s) => {
          setAttachmentsManagerUi(s)
        }}
      />
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

