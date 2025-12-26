'use client'

// FILE: app/modules/010-sprava-uzivatelu/tiles/InviteUserTile.tsx
// PURPOSE: Samostatný tile pro pozvání uživatele (010) – napojený na CommonActions (sendInvite/close).

// =========================
// 1) IMPORTS
// =========================
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { CommonActionId, ViewMode } from '@/app/UI/CommonActions'
import InviteUserFrame from '../forms/InviteUserFrame'

// =========================
// 2) TYPES
// =========================
type InviteUserTileProps = {
  onRegisterCommonActions?: (actions: CommonActionId[]) => void
  onRegisterCommonActionsState?: (state: {
    viewMode: ViewMode
    hasSelection: boolean
    isDirty: boolean
  }) => void
  onRegisterCommonActionHandler?: (fn: (id: CommonActionId) => void) => void

  // ✅ zavře celý modul 010 (dashboard / mimo tile)
  onCloseModule?: () => void
}

// =========================
// 3) HELPERS
// =========================
const confirmCloseIfDirty = (isDirty: boolean): boolean => {
  if (!isDirty) return true
  return confirm('Máš neuložené změny. Opravdu chceš zavřít?')
}

// =========================
// 4) DATA LOAD
// =========================
// (none)

// =========================
// 5) ACTION HANDLERS
// =========================
export default function InviteUserTile({
  onRegisterCommonActions,
  onRegisterCommonActionsState,
  onRegisterCommonActionHandler,
  onCloseModule,
}: InviteUserTileProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [isDirty, setIsDirty] = useState(false)

  // Invite frame registruje submit jako Promise<boolean>
  const submitRef = useRef<null | (() => Promise<boolean>)>(null)

  // Volitelný preset (pro pozvání existujícího uživatele z výběru v seznamu)
  // URL očekává: ?subjectId=<uuid>
  const presetSubjectId = useMemo(() => {
    const id = searchParams?.get('subjectId')?.trim()
    return id ? id : null
  }, [searchParams])

  // -------------------------
  // CommonActions list
  // -------------------------
  const commonActions = useMemo<CommonActionId[]>(() => {
    return ['sendInvite', 'close']
  }, [])

  useEffect(() => {
    onRegisterCommonActions?.(commonActions)
  }, [onRegisterCommonActions, commonActions])

  useEffect(() => {
    // Invite je procesní obrazovka → chová se jako "create"
    onRegisterCommonActionsState?.({
      viewMode: 'create',
      hasSelection: false,
      isDirty,
    })
  }, [onRegisterCommonActionsState, isDirty])

  // -------------------------
  // CommonActions handler
  // -------------------------
  useEffect(() => {
    if (!onRegisterCommonActionHandler) return

    const handler = async (id: CommonActionId) => {
      // =====================
      // CLOSE
      // =====================
      if (id === 'close') {
        const ok = confirmCloseIfDirty(isDirty)
        if (!ok) return

        // ✅ jednotně: zavřít modul 010 (ne router.back)
        if (onCloseModule) {
          onCloseModule()
          return
        }

        // fallback – kdyby nebyl callback zapojený
        router.back()
        return
      }

      // =====================
      // SEND INVITE
      // =====================
      if (id === 'sendInvite') {
        if (!submitRef.current) return
        const ok = await submitRef.current()
        if (!ok) return
        setIsDirty(false)
        // po odeslání zůstáváme (InviteUserFrame může přepnout na 'Systém')
        return
      }
    }

    onRegisterCommonActionHandler(handler)
  }, [onRegisterCommonActionHandler, router, onCloseModule, isDirty])

  // =========================
  // 6) RENDER
  // =========================
  return (
    <InviteUserFrame
      presetSubjectId={presetSubjectId}
      onDirtyChange={setIsDirty}
      onRegisterSubmit={(fn) => {
        submitRef.current = fn
      }}
    />
  )
}
