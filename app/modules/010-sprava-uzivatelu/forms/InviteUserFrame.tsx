// FILE: app/modules/010-sprava-uzivatelu/forms/InviteUserFrame.tsx

'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import EntityDetailFrame from '@/app/UI/EntityDetailFrame'
import DetailTabs, { type DetailTabItem } from '@/app/UI/DetailTabs'
import createLogger from '@/app/lib/logger'
const logger = createLogger('InviteUserFrame')
import InviteUserForm, { type InviteFormValue } from './InviteUserForm'
import { sendInvite, type InviteResult } from '@/app/lib/services/invites'
import { useToast } from '@/app/UI/Toast'

type Props = {
  presetSubjectId?: string | null
  onDirtyChange?: (dirty: boolean) => void
  onRegisterSubmit?: (fn: () => Promise<boolean>) => void
}

export default function InviteUserFrame({ presetSubjectId, onDirtyChange, onRegisterSubmit }: Props) {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<'invite' | 'system'>('invite')
  const [inviteResult, setInviteResult] = useState<InviteResult | null>(null)
  const [_isSending, setIsSending] = useState(false) // Used for future loading state

  const currentRef = useRef<InviteFormValue>({
    mode: presetSubjectId ? 'existing' : 'new',
    subjectId: presetSubjectId ?? null,
    email: '',
    displayName: '',
    roleCode: '',
    permissionCode: '',
    note: '',
  })

  useEffect(() => {
    currentRef.current = {
      mode: presetSubjectId ? 'existing' : 'new',
      subjectId: presetSubjectId ?? null,
      email: '',
      displayName: '',
      roleCode: '',
      permissionCode: '',
      note: '',
    }
    setInviteResult(null)
    setActiveTab('invite')
    onDirtyChange?.(false)
  }, [presetSubjectId, onDirtyChange])

  const doSend = async () => {
    try {
      // ✅ blokace opakovaného klikání/odeslání, když už máme výsledek
      if (inviteResult?.inviteId) {
        toast.showWarning('Pozvánka už byla založena. Pokud chceš poslat další, vrať se a založ novou pozvánku.')
        setActiveTab('system')
        return true
      }

      const v = currentRef.current

      if (v.mode === 'existing' && !v.subjectId) {
        toast.showWarning('Vyber existujícího uživatele.')
        return false
      }
      if (v.mode === 'new' && !v.email?.trim()) {
        toast.showWarning('Email je povinný.')
        return false
      }
      if (!v.roleCode?.trim()) {
        toast.showWarning('Role je povinná.')
        return false
      }
      if (!v.permissionCode?.trim()) {
        toast.showWarning('Oprávnění je povinné.')
        return false
      }

      setIsSending(true)
      const res = await sendInvite(v)

      setInviteResult(res)
      setActiveTab('system')
      onDirtyChange?.(false)

      toast.showSuccess('Pozvánka byla založena')
      return true
    } catch (e: any) {
      logger.error('sendInvite failed', e)
      toast.showError(e?.message ?? 'Chyba při odeslání pozvánky')
      return false
    } finally {
      setIsSending(false)
    }
  }

  // pořád podporujeme CommonActions
  useEffect(() => {
    if (!onRegisterSubmit) return
    onRegisterSubmit(doSend)
  }, [onRegisterSubmit]) // eslint-disable-line react-hooks/exhaustive-deps

  const tabItems: DetailTabItem[] = useMemo(() => {
    const items: DetailTabItem[] = [{ id: 'invite', label: 'Pozvánka' }]
    if (inviteResult) items.push({ id: 'system', label: 'Systém' })
    return items
  }, [inviteResult])

  return (
    <EntityDetailFrame title="Pozvat uživatele">
      <DetailTabs items={tabItems} activeId={activeTab} onChange={(id) => setActiveTab(id as any)} />

      {activeTab === 'invite' && (
        <InviteUserForm
          initialValue={currentRef.current}
          onValueChange={(v) => {
            currentRef.current = v
          }}
          onDirtyChange={onDirtyChange}
          variant="standalone"
        />
      )}

      {activeTab === 'system' && inviteResult && (
        <div style={{ padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Výsledek</h3>

          <div style={{ padding: 10, border: '1px solid #ddd', borderRadius: 8 }}>
            <div>
              <b>Status:</b> {inviteResult.status ?? '—'}
            </div>
            <div>
              <b>Invite ID:</b> {inviteResult.inviteId}
            </div>
            <div>
              <b>Mode:</b> {inviteResult.mode}
            </div>
            <div>
              <b>Email:</b> {inviteResult.email ?? '—'}
            </div>
            <div>
              <b>Role:</b> {inviteResult.roleCode ?? '—'}
            </div>
            <div>
              <b>Subject ID:</b> {inviteResult.subjectId ?? '—'}
            </div>
            <div>
              <b>Vytvořen nový subjekt:</b> {inviteResult.subjectCreated ? 'Ano' : 'Ne'}
            </div>
            {inviteResult.createdAt && (
              <div>
                <b>Vytvořeno:</b> {inviteResult.createdAt}
              </div>
            )}
            {inviteResult.expiresAt && (
              <div>
                <b>Platnost do:</b> {inviteResult.expiresAt}
              </div>
            )}
            {inviteResult.message && (
              <div style={{ marginTop: 8 }}>
                <b>Poznámka:</b> {inviteResult.message}
              </div>
            )}
          </div>

          <div style={{ marginTop: 12, opacity: 0.8 }}>
            Teď už nejde „nepoznat“, že pozvánka proběhla. Opakované klikání je zablokované.
          </div>
        </div>
      )}
    </EntityDetailFrame>
  )
}
