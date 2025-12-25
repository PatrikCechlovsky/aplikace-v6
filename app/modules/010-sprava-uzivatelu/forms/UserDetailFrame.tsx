'use client'

// FILE: app/modules/010-sprava-uzivatelu/forms/UserDetailFrame.tsx
// PURPOSE: Detail uživatele (Subject/User) v modulu 010.
// CHANGE (2025-12-22):
// - Přidána záložka Pozvánka (jen když dává smysl).
// - CommonActions "sendInvite" vytvoří VŽDY NOVOU pozvánku a staré pending expirováno v invites service.
// - Oprava dirty: form nenastaví dirty při prvním renderu, jen při reálné změně.

import React, { useEffect, useMemo, useRef, useState } from 'react'
import DetailView from '@/app/UI/DetailView'
import type { DetailSectionId } from '@/app/UI/DetailView'
import type { ViewMode } from '@/app/UI/CommonActions'

import UserDetailForm from './UserDetailForm'
import { getLatestInviteForSubject, sendInvite } from '@/app/lib/services/invites'
import type { InviteFormValue } from './InviteUserForm'

export type UiUser = {
  id: string
  displayName: string
  email: string
  phone?: string
  roleLabel: string
  twoFactorMethod?: string | null
  createdAt: string
  isArchived?: boolean
  firstLoginAt?: string | null
}

type Props = {
  user: UiUser
  viewMode: ViewMode
  initialSectionId?: DetailSectionId

  onActiveSectionChange?: (id: DetailSectionId) => void

  // submit detail (save)
  onRegisterSubmit?: (fn: () => Promise<UiUser | null>) => void

  // submit invite (sendInvite z detailu)
  onRegisterInviteSubmit?: (fn: () => Promise<boolean>) => void

  // dirty signal do tile
  onDirtyChange?: (dirty: boolean) => void
}

export default function UserDetailFrame({
  user,
  viewMode,
  initialSectionId,
  onActiveSectionChange,
  onRegisterSubmit,
  onRegisterInviteSubmit,
  onDirtyChange,
}: Props) {
  // Pozn.: Aktivní záložku řídí DetailView interně.
  // Parent (UsersTile) může přepnout záložku změnou `initialSectionId`.

  // -----------------------------
  // Dirty management (fix: nezašpiní hned po otevření)
  // -----------------------------
  const [isDirty, setIsDirty] = useState(false)
  const initialSnapshotRef = useRef<string>('')
  const firstRenderRef = useRef(true)

  useEffect(() => {
    // reset snapshot při změně user nebo viewMode
    initialSnapshotRef.current = JSON.stringify(user ?? {})
    firstRenderRef.current = true
    setIsDirty(false)
    onDirtyChange?.(false)
  }, [user?.id, viewMode]) // eslint-disable-line react-hooks/exhaustive-deps

  const markDirtyIfChanged = (nextVal: any) => {
    const snap = JSON.stringify(nextVal ?? {})
    if (firstRenderRef.current) {
      // první render nepočítáme jako změnu
      firstRenderRef.current = false
      initialSnapshotRef.current = snap
      return
    }
    const dirty = snap !== initialSnapshotRef.current
    setIsDirty(dirty)
    onDirtyChange?.(dirty)
  }

  // -----------------------------
  // Invite tab conditions
  // -----------------------------
  const [latestInvite, setLatestInvite] = useState<any | null>(null)

  const canShowInviteTab = useMemo(() => {
    // pozvánka dává smysl jen pokud:
    // - user má email
    // - a zatím nemá first_login_at (nebo jiná logika "už je aktivní")
    const hasEmail = !!user?.email?.trim()
    const isActive = !!user?.firstLoginAt // pokud existuje, uživatel už se přihlásil
    return hasEmail && !isActive
  }, [user?.email, user?.firstLoginAt])

  useEffect(() => {
    let mounted = true
    async function loadInvite() {
      if (!canShowInviteTab) return
      try {
        const inv = await getLatestInviteForSubject(user.id)
        if (!mounted) return
        setLatestInvite(inv)
      } catch (e) {
        // nechceme shodit detail; jen ignor
        if (!mounted) return
        setLatestInvite(null)
      }
    }
    void loadInvite()
    return () => {
      mounted = false
    }
  }, [user?.id, canShowInviteTab])

  // -----------------------------
  // RolesData mock (pokud ji už máš z backendu, napoj sem)
  // -----------------------------
  // Tady jen počítám, že role už je v user.roleLabel (label) a v reálu máš v ctx.rolesData i code.
  // Pokud už `UserDetailFrame` dnes roleData načítá jinak, nech to svoje a jen z něj vezmi role.code.
  const rolesData = useMemo(() => {
    // placeholder — v tvém projektu to může být už napojené
    return {
      role: { code: (user as any).roleCode ?? null, name: user.roleLabel ?? null },
      permissions: [],
      availableRoles: (user as any).availableRoles ?? [],
    }
  }, [user])

  // -----------------------------
  // Invite submit for CommonActions: vždy nová pozvánka
  // -----------------------------
  const inviteSubmitRef = useRef<null | (() => Promise<boolean>)>(null)

  useEffect(() => {
    if (!onRegisterInviteSubmit) return

    inviteSubmitRef.current = async () => {
      try {
        if (!canShowInviteTab) {
          alert('Pozvánka nedává smysl: uživatel je aktivní nebo nemá email.')
          return false
        }

        // roleCode: vezmeme z rolesData.role.code, fallback: nic -> blok
        const roleCode = (rolesData as any)?.role?.code ?? null
        if (!roleCode?.trim()) {
          alert('Chybí role (role_code) – nelze vytvořit pozvánku.')
          return false
        }

        // ✅ FIX: sendInvite vyžaduje celý InviteFormValue (ne jen {subjectId})
        const payload: InviteFormValue = {
          mode: 'existing',
          subjectId: user.id,
          email: user.email, // není nutné pro existing, ale nevadí
          displayName: user.displayName ?? '',
          roleCode,
          note: 'Nová pozvánka vytvořena z detailu uživatele (předchozí pending expirovány).',
        }

        await sendInvite(payload)

        // refresh latest invite
        const refreshed = await getLatestInviteForSubject(user.id)
        setLatestInvite(refreshed)

        alert('Vytvořena nová pozvánka ✅')
        return true
      } catch (e: any) {
        console.error('[UserDetailFrame.sendInvite] ERROR', e)
        alert(e?.message ?? 'Chyba při vytváření pozvánky')
        return false
      }
    }

    onRegisterInviteSubmit(inviteSubmitRef.current)
  }, [onRegisterInviteSubmit, user?.id, user?.email, user?.displayName, canShowInviteTab, rolesData])

  // -----------------------------
  // Detail submit placeholder (pokud už máš ve svém projektu, nech svoje)
  // -----------------------------
  useEffect(() => {
    if (!onRegisterSubmit) return
    onRegisterSubmit(async () => {
      // TODO: napojení na save user (už máš ve svém projektu)
      // Zde vracíme původního uživatele jako "saved".
      setIsDirty(false)
      onDirtyChange?.(false)
      initialSnapshotRef.current = JSON.stringify(user ?? {})
      return user
    })
  }, [onRegisterSubmit, user, onDirtyChange])

  // -----------------------------
  // Invite tab content
  // -----------------------------
  const inviteContent = useMemo(() => {
    if (!canShowInviteTab) return null

    return (
      <div className="detail-form">
        <section className="detail-form__section">
          <h3 className="detail-form__section-title">Pozvánka</h3>

          <div className="detail-form__grid detail-form__grid--narrow">
            <div className="detail-form__field detail-form__field--span-4">
              <label className="detail-form__label">Email</label>
              <input className="detail-form__input" value={user.email ?? ''} readOnly />
            </div>

            <div className="detail-form__field detail-form__field--span-4">
              <label className="detail-form__label">Role</label>
              <input className="detail-form__input" value={user.roleLabel ?? ''} readOnly />
              <div className="detail-form__hint">
                Pro změnu role použij „edit“ role v detailu / nebo napoj dropdown z dostupných rolí.
              </div>
            </div>

            <div className="detail-form__field detail-form__field--span-4">
              <label className="detail-form__label">Poslední pozvánka</label>
              <div className="detail-form__readonly">
                {latestInvite ? (
                  <>
                    <div>stav: {latestInvite.status ?? '—'}</div>
                    <div>odesláno: {latestInvite.sent_at ?? '—'}</div>
                    <div>expiruje: {latestInvite.expires_at ?? '—'}</div>
                  </>
                ) : (
                  '—'
                )}
              </div>
              <div className="detail-form__hint">
                Odeslání nové pozvánky uděláš přes CommonActions (akce „Pozvat / Odeslat pozvánku“).
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }, [canShowInviteTab, user.email, user.roleLabel, latestInvite])

  // -----------------------------
  // DetailView sections
  // -----------------------------
  const sections = useMemo(() => {
    const base: { id: DetailSectionId; title: string; content: React.ReactNode }[] = [
      {
        id: 'detail' as DetailSectionId,
        title: 'Detail',
        content: (
          <UserDetailForm
            user={user}
            readOnly={viewMode === 'read'}
            onValueChange={(next) => {
              markDirtyIfChanged(next)
            }}
          />
        ),
      },
    ]

    if (canShowInviteTab) {
      base.push({
        id: 'invite' as DetailSectionId,
        title: 'Pozvánka',
        content: inviteContent,
      })
    }

    return base
  }, [user, viewMode, canShowInviteTab, inviteContent])

  return (
    <DetailView
      title={user?.displayName ?? 'Uživatel'}
      mode={viewMode === 'read' ? 'view' : viewMode === 'edit' ? 'edit' : viewMode === 'create' ? 'create' : 'view'}
      sectionIds={sections.map((s) => s.id)}
      initialActiveId={initialSectionId}
      onActiveSectionChange={(id) => onActiveSectionChange?.(id)}
      ctx={{
        isDirty,
      }}
    >
      {sections.map((s) => (
        <div key={s.id} data-section-id={s.id}>
          {s.content}
        </div>
      ))}
    </DetailView>
  )
}
