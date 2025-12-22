'use client'

// FILE: app/modules/010-sprava-uzivatelu/tiles/InviteUserTile.tsx
// PURPOSE: Samostatný tile pro pozvání uživatele (010) – napojený na CommonActions (sendInvite/close).

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { CommonActionId, ViewMode } from '@/app/UI/CommonActions'
import InviteUserFrame from '../forms/InviteUserFrame'

type InviteUserTileProps = {
  onRegisterCommonActions?: (actions: CommonActionId[]) => void
  onRegisterCommonActionsState?: (state: {
    viewMode: ViewMode
    hasSelection: boolean
    isDirty: boolean
  }) => void
  onRegisterCommonActionHandler?: (fn: (id: CommonActionId) => void) => void
}

export default function InviteUserTile({
  onRegisterCommonActions,
  onRegisterCommonActionsState,
  onRegisterCommonActionHandler,
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

  // CommonActions pro invite obrazovku
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

  useEffect(() => {
    if (!onRegisterCommonActionHandler) return

    const handler = async (id: CommonActionId) => {
      if (id === 'close') {
        // dirty guard řeší AppShell (confirmIfDirty) – stejně jako jinde
        router.back()
        return
      }

      if (id === 'sendInvite') {
        if (!submitRef.current) return
        const ok = await submitRef.current()
        if (!ok) return
        setIsDirty(false)
        // po odeslání zůstáváme (InviteUserFrame přepne na 'Systém')
        return
      }
    }

    onRegisterCommonActionHandler(handler)
  }, [onRegisterCommonActionHandler, router])

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
