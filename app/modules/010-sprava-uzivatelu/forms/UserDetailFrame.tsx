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
import type { ViewMode, CommonActionId } from '@/app/UI/CommonActions'

import UserDetailForm from './UserDetailForm'
import { getLatestInviteForSubject, sendInvite } from '@/app/lib/services/invites'

type UiUser = {
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

  // from UsersTile
  onRegisterSubmit?: (fn: () => Promise<UiUser | null>) => void
  onRegisterInviteSubmit?: (fn: () => Promise<boolean>) => void

  // dirty propagation up
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
  const [isDirty, setIsDirty] = useState(false)
  const snapshotRef = useRef<string>('')

  // -----------------------------
  // Invite state
  // -----------------------------
  const [latestInvite, setLatestInvite] = useState<any>(null)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)

  const canShowInviteTab = useMemo(() => {
    // Pozvánka má smysl jen:
    // - záznam existuje
    // - user se ještě nepřihlásil
    return !!user?.id && !user.firstLoginAt
  }, [user?.id, user.firstLoginAt])

  // Load latest invite (for tab + system blocks)
  useEffect(() => {
    let ignore = false

    async function run() {
      if (!canShowInviteTab || !user?.id) {
        setLatestInvite(null)
        return
      }
      setInviteLoading(true)
      setInviteError(null)
      try {
        const inv = await getLatestInviteForSubject(user.id)
        if (ignore) return
        setLatestInvite(inv)
      } catch (e: any) {
        if (ignore) return
        setInviteError(e?.message ?? 'Chyba načtení pozvánky.')
      } finally {
        if (!ignore) setInviteLoading(false)
      }
    }

    void run()
    return () => {
      ignore = true
    }
  }, [canShowInviteTab, user?.id])

  // -----------------------------
  // Dirty handling
  // -----------------------------
  useEffect(() => {
    snapshotRef.current = JSON.stringify(user ?? {})
    setIsDirty(false)
    onDirtyChange?.(false)
  }, [user, onDirtyChange])

  function markDirtyIfChanged(next: any) {
    const nextSnap = JSON.stringify(next ?? {})
    if (nextSnap !== snapshotRef.current) {
      if (!isDirty) {
        setIsDirty(true)
        onDirtyChange?.(true)
      }
    }
  }

  // -----------------------------
  // Invite content
  // -----------------------------
  const inviteContent = useMemo(() => {
    if (!canShowInviteTab) return null

    return (
      <div className="detail-form">
        <section className="detail-form__section">
          <h3 className="detail-form__section-title">Pozvánka</h3>

          {inviteLoading && <div className="detail-view__placeholder">Načítám pozvánku…</div>}
          {inviteError && (
            <div className="detail-view__placeholder">
              Chyba: <strong>{inviteError}</strong>
            </div>
          )}

          {!inviteLoading && !inviteError && (
            <div className="detail-form__grid detail-form__grid--narrow">
              <div className="detail-form__field detail-form__field--span-4">
                <label className="detail-form__label">Stav</label>
                <div className="detail-form__value">{latestInvite?.status ?? '—'}</div>
              </div>

              <div className="detail-form__field detail-form__field--span-4">
                <label className="detail-form__label">Odesláno</label>
                <div className="detail-form__value">{latestInvite?.sent_at ?? '—'}</div>
              </div>

              <div className="detail-form__field detail-form__field--span-4">
                <label className="detail-form__label">Vyprší</label>
                <div className="detail-form__value">{latestInvite?.expires_at ?? '—'}</div>
              </div>
            </div>
          )}
        </section>
      </div>
    )
  }, [canShowInviteTab, inviteLoading, inviteError, latestInvite])

  // Register Invite submit handler (CommonActions: sendInvite)
  useEffect(() => {
    if (!onRegisterInviteSubmit) return

    const submit = async () => {
      if (!user?.id) return false
      if (user.firstLoginAt) return false

      try {
        await sendInvite({
          subjectId: user.id,
        })

        // refresh latest invite
        const inv = await getLatestInviteForSubject(user.id)
        setLatestInvite(inv)
        return true
      } catch (e: any) {
        setInviteError(e?.message ?? 'Nepodařilo se odeslat pozvánku.')
        return false
      }
    }

    onRegisterInviteSubmit(submit)
  }, [onRegisterInviteSubmit, user?.id, user.firstLoginAt])

  // Register save handler (CommonActions: save)
  useEffect(() => {
    if (!onRegisterSubmit) return

    const submit = async () => {
      // Save logic is inside UserDetailForm (it likely calls supabase and returns saved row).
      // Here we just provide a hook point; actual fn is provided by the form via onRegisterSubmit.
      return user
    }

    onRegisterSubmit(submit)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRegisterSubmit])

  // -----------------------------
  // System blocks (read-only)
  // -----------------------------
  const systemBlocks = useMemo(() => {
    const userBlock = {
      id: 'user',
      title: 'Uživatel',
      content: (
        <div className="detail-system__grid">
          <div>
            <div className="detail-system__label">Vytvořeno</div>
            <div className="detail-system__value">{user.createdAt}</div>
          </div>

          <div>
            <div className="detail-system__label">Archiv</div>
            <div className="detail-system__value">{user.isArchived ? 'Ano' : 'Ne'}</div>
          </div>

          <div>
            <div className="detail-system__label">První přihlášení</div>
            <div className="detail-system__value">{user.firstLoginAt ?? '—'}</div>
          </div>
        </div>
      ),
    }

    const inviteBlock = {
      id: 'invite',
      title: 'Pozvánka',
      content: (
        <div className="detail-system__grid">
          <div>
            <div className="detail-system__label">Stav</div>
            <div className="detail-system__value">{latestInvite?.status ?? '—'}</div>
          </div>

          <div>
            <div className="detail-system__label">Odesláno</div>
            <div className="detail-system__value">{latestInvite?.sent_at ?? '—'}</div>
          </div>

          <div>
            <div className="detail-system__label">Vyprší</div>
            <div className="detail-system__value">{latestInvite?.expires_at ?? '—'}</div>
          </div>
        </div>
      ),
    }

    return [userBlock, inviteBlock]
  }, [user.createdAt, user.firstLoginAt, user.isArchived, latestInvite])

  // -----------------------------
  // Sections list
  // -----------------------------
  const sectionIds = useMemo<DetailSectionId[]>(() => {
    const base: DetailSectionId[] = ['detail', 'roles', 'attachments', 'system']
    if (canShowInviteTab) {
      // Pozvánka jen když dává smysl
      base.splice(2, 0, 'invite') // vlož po roles
    }
    return base
  }, [canShowInviteTab])

  const detailMode: 'create' | 'edit' | 'view' =
    viewMode === 'read' ? 'view' : viewMode === 'edit' ? 'edit' : viewMode === 'create' ? 'create' : 'view'

  return (
    <DetailView
      mode={detailMode}
      sectionIds={sectionIds}
      // ✅ umožní přepínat záložky i z parentu
      initialActiveId={initialSectionId ?? 'detail'}
      onActiveSectionChange={(id) => onActiveSectionChange?.(id)}
      ctx={{
        // ✅ entityType musí odpovídat DB (documents.entity_type)
        entityType: 'subjects',
        entityId: user.id || undefined,
        entityLabel: user.displayName ?? null,
        mode: detailMode,

        detailContent: (
          <UserDetailForm
            user={user}
            readOnly={viewMode === 'read'}
            onDirtyChange={(dirty) => {
              if (dirty) markDirtyIfChanged(user)
              else {
                setIsDirty(false)
                onDirtyChange?.(false)
              }
            }}
            onValueChange={(val: any) => {
              markDirtyIfChanged(val)
            }}
          />
        ),

        rolesData: null,

        // ✅ sem se posílá content pro záložku Pozvánka
        inviteContent,

        // ✅ systémové bloky
        systemBlocks,
      }}
    />
  )
}
