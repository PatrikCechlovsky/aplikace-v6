// FILE: app/modules/010-sprava-uzivatelu/forms/InviteUserFrame.tsx

'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import EntityDetailFrame from '@/app/UI/EntityDetailFrame'
import DetailTabs, { type DetailTabItem } from '@/app/UI/DetailTabs'
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
  const [isSending, setIsSending] = useState(false)

  const currentRef = useRef<InviteFormValue>({
    mode: presetSubjectId ? 'existing' : 'new',
    subjectId: presetSubjectId ?? null,
    email: '',
    displayName: '',
    roleCode: '',
    note: '',
  })

  useEffect(() => {
    currentRef.current = {
      mode: presetSubjectId ? 'existing' : 'new',
      subjectId: presetSubjectId ?? null,
      email: '',
      displayName: '',
      roleCode: '',
      note: '',
    }
    setInviteResult(null)
    setActiveTab('invite')
    onDirtyChange?.(false)
  }, [presetSubjectId, onDirtyChange])

  const doSend = async () => {
    try {
      const v = currentRef.current

      if (v.mode === 'existing' && !v.subjectId) {
        alert('Vyber existujícího uživatele.')
        return false
      }
      if (v.mode === 'new' && !v.email?.trim()) {
        alert('Email je povinný.')
        return false
      }
      if (!v.roleCode?.trim()) {
        alert('Role je povinná.')
        return false
      }

      setIsSending(true)
      const res = await sendInvite(v)
      setInviteResult(res)
      setActiveTab('system')
      onDirtyChange?.(false)
      return true
    } catch (e: any) {
      console.error('[InviteUserFrame.sendInvite] ERROR', e)
      alert(e?.message ?? 'Chyba při odeslání pozvánky')
      return false
    } finally {
      setIsSending(false)
    }
  }

  // pořád podporujeme CommonActions (když to používáš), ale už to není jediné místo
  useEffect(() => {
    if (!onRegisterSubmit) return
    onRegisterSubmit(doSend)
  }, [onRegisterSubmit])

  const tabItems: DetailTabItem[] = useMemo(() => {
    const items: DetailTabItem[] = [{ id: 'invite', label: 'Pozvánka' }]
    if (inviteResult) items.push({ id: 'system', label: 'Systém' })
    return items
  }, [inviteResult])

  return (
    <EntityDetailFrame title="Pozvat uživatele">
      <DetailTabs items={tabItems} activeId={activeTab} onChange={(id) => setActiveTab(id as any)} />

      {activeTab === 'invite' && (
        <section id="detail-section-invite">
          <InviteUserForm
            initialValue={currentRef.current}
            onDirtyChange={onDirtyChange}
            onValueChange={(v) => {
              currentRef.current = v
            }}
          />

          {/* ✅ tlačítka přímo ve stránce (už nemusíš lovit CommonActions) */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', padding: '8px 0 2px 0' }}>
            <button
              type="button"
              className="common-actions__btn"
              onClick={() => {
                // jen „soft“ – když to chceš, můžeš sem dát callback na zavření frame
                history.back()
              }}
              disabled={isSending}
            >
              Zrušit
            </button>

            <button
              type="button"
              className="common-actions__btn common-actions__btn--primary"
              onClick={() => void doSend()}
              disabled={isSending}
            >
              {isSending ? 'Odesílám…' : 'Odeslat pozvánku'}
            </button>
          </div>
        </section>
      )}

      {activeTab === 'system' && inviteResult && (
        <section id="detail-section-system">
          <div className="detail-form">
            <section className="detail-form__section">
              <h3 className="detail-form__section-title">Systém</h3>

              <div className="detail-form__grid detail-form__grid--narrow">
                <div className="detail-form__field detail-form__field--span-2">
                  <label className="detail-form__label">ID pozvánky</label>
                  <input className="detail-form__input detail-form__input--readonly" value={inviteResult.inviteId} readOnly />
                </div>

                <div className="detail-form__field detail-form__field--span-2">
                  <label className="detail-form__label">Stav</label>
                  <input className="detail-form__input detail-form__input--readonly" value={inviteResult.status ?? 'pending'} readOnly />
                </div>

                <div className="detail-form__field detail-form__field--span-2">
                  <label className="detail-form__label">Kdy odesláno</label>
                  <input className="detail-form__input detail-form__input--readonly" value={(inviteResult as any).sentAt ?? '—'} readOnly />
                </div>

                <div className="detail-form__field detail-form__field--span-2">
                  <label className="detail-form__label">Platí do</label>
                  <input className="detail-form__input detail-form__input--readonly" value={(inviteResult as any).validUntil ?? '—'} readOnly />
                </div>

                <div className="detail-form__field detail-form__field--span-2">
                  <label className="detail-form__label">Kdo odeslal</label>
                  <input className="detail-form__input detail-form__input--readonly" value={(inviteResult as any).sentBy ?? '—'} readOnly />
                </div>

                <div className="detail-form__field detail-form__field--span-2">
                  <label className="detail-form__label">První přihlášení</label>
                  <input className="detail-form__input detail-form__input--readonly" value={(inviteResult as any).firstLoginAt ?? '—'} readOnly />
                </div>
              </div>
            </section>
          </div>
        </section>
      )}
    </EntityDetailFrame>
  )
}
 
