// FILE: app/modules/010-sprava-uzivatelu/forms/InviteUserFrame.tsx
// NEW

'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import EntityDetailFrame from '@/app/UI/EntityDetailFrame'
import DetailTabs from '@/app/UI/DetailTabs'
import InviteUserForm, { type InviteFormValue } from './InviteUserForm'
import { sendInvite, type InviteResult } from '@/app/lib/services/invites'

type Props = {
  presetSubjectId?: string | null
  onDirtyChange?: (dirty: boolean) => void
  onRegisterSubmit?: (fn: () => Promise<boolean>) => void
}

export default function InviteUserFrame({ presetSubjectId, onDirtyChange, onRegisterSubmit }: Props) {
  const [activeTab, setActiveTab] = useState<'invite' | 'system'>('invite')
  const [inviteResult, setInviteResult] = useState<InviteResult | null>(null)

  const currentRef = useRef<InviteFormValue>({
    mode: presetSubjectId ? 'existing' : 'new',
    subjectId: presetSubjectId ?? null,
    email: '',
    displayName: '',
    roleCode: 'user',
    note: '',
  })

  useEffect(() => {
    // preset změna → reset
    currentRef.current = {
      mode: presetSubjectId ? 'existing' : 'new',
      subjectId: presetSubjectId ?? null,
      email: '',
      displayName: '',
      roleCode: 'user',
      note: '',
    }
    setInviteResult(null)
    setActiveTab('invite')
    onDirtyChange?.(false)
  }, [presetSubjectId])

  useEffect(() => {
    if (!onRegisterSubmit) return

    const submit = async () => {
      try {
        const v = currentRef.current

        // minimální validace (UI má i inline)
        if (v.mode === 'existing' && !v.subjectId) {
          alert('Vyber uživatele.')
          return false
        }
        if (!v.roleCode?.trim()) {
          alert('Role je povinná.')
          return false
        }
        if (v.mode === 'new' && !v.email?.trim()) {
          alert('Email je povinný.')
          return false
        }

        const res = await sendInvite(v)
        setInviteResult(res)
        setActiveTab('system')
        onDirtyChange?.(false)
        return true
      } catch (e: any) {
        console.error('[InviteUserFrame.sendInvite] ERROR', e)
        alert(e?.message ?? 'Chyba při odeslání pozvánky – viz konzole.')
        return false
      }
    }

    onRegisterSubmit(submit)
  }, [onRegisterSubmit, onDirtyChange])

  const tabs = useMemo(() => {
    const base = [{ id: 'invite', label: 'Pozvánka' }]
    if (inviteResult) base.push({ id: 'system', label: 'Systém' })
    return base
  }, [inviteResult])

  return (
    <EntityDetailFrame title="Pozvat uživatele">
      <DetailTabs
        tabs={tabs as any}
        activeId={activeTab}
        onSelect={(id: any) => setActiveTab(id)}
      />

      {activeTab === 'invite' && (
        <InviteUserForm
          initialValue={currentRef.current}
          onDirtyChange={onDirtyChange}
          onValueChange={(v) => {
            currentRef.current = v
          }}
        />
      )}

      {activeTab === 'system' && inviteResult && (
        <div className="detail-form">
          <div className="detail-form__grid" style={{ gridTemplateColumns: '220px 1fr' }}>
            <div className="detail-form__label">ID pozvánky</div>
            <div className="detail-form__value">{inviteResult.inviteId}</div>

            <div className="detail-form__label">Stav</div>
            <div className="detail-form__value">{inviteResult.status}</div>

            <div className="detail-form__label">Vytvořeno</div>
            <div className="detail-form__value">{inviteResult.createdAt ?? '—'}</div>

            <div className="detail-form__label">Odesláno</div>
            <div className="detail-form__value">{inviteResult.sentAt ?? '—'}</div>
          </div>
        </div>
      )}
    </EntityDetailFrame>
  )
}
