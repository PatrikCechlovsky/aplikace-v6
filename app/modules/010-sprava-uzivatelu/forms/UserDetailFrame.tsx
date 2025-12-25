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
  // -----------------------------
  // Dirty management (fix: nezašpiní hned po otevření)
  // -----------------------------
  const [isDirty, setIsDirty] = useState(false)
  const initialSnapshotRef = useRef<string>('')
  const firstRenderRef = useRef(true)

  useEffect(() => {
    initialSnapshotRef.current = JSON.stringify(user ?? {})
    firstRenderRef.current = true
    setIsDirty(false)
    onDirtyChange?.(false)
  }, [user?.id, viewMode]) // eslint-disable-line react-hooks/exhaustive-deps

  const markDirtyIfChanged = (nextVal: any) => {
    const snap = JSON.stringify(nextVal ?? {})
    if (firstRenderRef.current) {
      firstRenderRef.current = false
      initialSnapshotRef.current = snap
      setIsDirty(false)
      onDirtyChange?.(false)
      return
    }
    const dirty = snap !== initialSnapshotRef.current
    setIsDirty(dirty)
    onDirtyChange?.(dirty)
  }

  // -----------------------------
  // Invite state (latest invite)
  // -----------------------------
  const [latestInvite, setLatestInvite] = useState<any>(null)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)

  const canShowInviteTab = useMemo(() => {
    if (!user?.id?.trim()) return false
    if (user.firstLoginAt) return false
    if (!user.email?.trim()) return false
    return true
  }, [user?.id, user?.firstLoginAt, user?.email])

  useEffect(() => {
    let mounted = true
    async function loadInvite() {
      if (!user?.id?.trim()) return
      if (!canShowInviteTab) {
        setLatestInvite(null)
        setInviteError(null)
        setInviteLoading(false)
        return
      }
      try {
        setInviteLoading(true)
        setInviteError(null)
        const res = await getLatestInviteForSubject(user.id)
        if (!mounted) return
        setLatestInvite(res)
      } catch (e: any) {
        if (!mounted) return
        setLatestInvite(null)
        setInviteError(e?.message ?? 'Chyba načtení pozvánky')
      } finally {
        if (!mounted) return
        setInviteLoading(false)
      }
    }
    void loadInvite()
    return () => {
      mounted = false
    }
  }, [user?.id, canShowInviteTab])

  // -----------------------------
  // Roles data placeholder (ponecháno, jak to máš)
  // -----------------------------
  const rolesData = useMemo(() => {
    return {
      role: { code: (user as any).roleCode ?? null, name: user.roleLabel ?? null },
      permissions: [],
      availableRoles: (user as any).availableRoles ?? [],
    }
  }, [user])

  // -----------------------------
  // Invite submit for CommonActions
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

        const roleCode = (rolesData as any)?.role?.code ?? null
        if (!roleCode?.trim()) {
          alert('Chybí role (role_code) – nelze vytvořit pozvánku.')
          return false
        }

        const payload: InviteFormValue = {
          mode: 'existing',
          subjectId: user.id,
          email: user.email ?? '',
          displayName: user.displayName ?? '',
          roleCode,
          note: 'Nová pozvánka vytvořena z detailu uživatele (předchozí pending expirovány).',
        }

        await sendInvite(payload)

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
  }, [onRegisterInviteSubmit, canShowInviteTab, rolesData, user.id, user.email, user.displayName])

  // -----------------------------
  // Submit detail placeholder (ponecháno)
  // -----------------------------
  useEffect(() => {
    if (!onRegisterSubmit) return
    onRegisterSubmit(async () => {
      setIsDirty(false)
      onDirtyChange?.(false)
      initialSnapshotRef.current = JSON.stringify(user ?? {})
      return user
    })
  }, [onRegisterSubmit, user, onDirtyChange])

  // -----------------------------
  // Invite tab content (do DetailView ctx)
  // -----------------------------
  const inviteContent = useMemo(() => {
    if (!canShowInviteTab) return null

    if (inviteLoading) {
      return <div className="detail-view__placeholder">Načítám pozvánku…</div>
    }

    if (inviteError) {
      return (
        <div className="detail-view__placeholder">
          Chyba: <strong>{inviteError}</strong>
        </div>
      )
    }

    const status = latestInvite?.status ?? '—'
    const createdAt = latestInvite?.createdAt ?? latestInvite?.created_at ?? '—'
    const expiresAt = latestInvite?.expiresAt ?? latestInvite?.expires_at ?? '—'
    const sentAt = latestInvite?.sentAt ?? latestInvite?.sent_at ?? '—'

    return (
      <div className="detail-form">
        <section className="detail-form__section">
          <h3 className="detail-form__section-title">Pozvánka</h3>

          <div className="detail-form__grid detail-form__grid--narrow">
            <div className="detail-form__field detail-form__field--span-4">
              <label className="detail-form__label">Email</label>
              <input className="detail-form__input detail-form__input--readonly" value={user.email ?? ''} readOnly />
            </div>

            <div className="detail-form__field detail-form__field--span-4">
              <label className="detail-form__label">Stav</label>
              <input className="detail-form__input detail-form__input--readonly" value={status} readOnly />
            </div>

            <div className="detail-form__field detail-form__field--span-4">
              <label className="detail-form__label">Vytvořeno</label>
              <input className="detail-form__input detail-form__input--readonly" value={createdAt} readOnly />
            </div>

            <div className="detail-form__field detail-form__field--span-4">
              <label className="detail-form__label">Odesláno</label>
              <input className="detail-form__input detail-form__input--readonly" value={sentAt} readOnly />
            </div>

            <div className="detail-form__field detail-form__field--span-4">
              <label className="detail-form__label">Platnost do</label>
              <input className="detail-form__input detail-form__input--readonly" value={expiresAt} readOnly />
            </div>

            <div className="detail-form__field detail-form__field--span-4">
              <label className="detail-form__label">&nbsp;</label>
              <div className="detail-form__hint">
                Novou pozvánku odešleš přes CommonActions (akce „Pozvat / Odeslat pozvánku“).
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }, [canShowInviteTab, inviteLoading, inviteError, latestInvite, user.email])

  // -----------------------------
  // System blocks (audit)
  // -----------------------------
  const systemBlocks = useMemo(() => {
    const userBlock = {
      title: 'Uživatel',
      content: (
        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field detail-form__field--span-4">
            <label className="detail-form__label">Vytvořeno</label>
            <input className="detail-form__input detail-form__input--readonly" value={user.createdAt ?? '—'} readOnly />
          </div>
          <div className="detail-form__field detail-form__field--span-4">
            <label className="detail-form__label">První přihlášení</label>
            <input
              className="detail-form__input detail-form__input--readonly"
              value={user.firstLoginAt ?? '—'}
              readOnly
            />
          </div>
          <div className="detail-form__field detail-form__field--span-4">
            <label className="detail-form__label">Archivováno</label>
            <input
              className="detail-form__input detail-form__input--readonly"
              value={user.isArchived ? 'Ano' : 'Ne'}
              readOnly
            />
          </div>
        </div>
      ),
    }

    if (!latestInvite) return [userBlock]

    const inviteBlock = {
      title: 'Pozvánka',
      content: (
        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field detail-form__field--span-4">
            <label className="detail-form__label">Stav</label>
            <input
              className="detail-form__input detail-form__input--readonly"
              value={latestInvite.status ?? '—'}
              readOnly
            />
          </div>
          <div className="detail-form__field detail-form__field--span-4">
            <label className="detail-form__label">Vytvořeno</label>
            <input
              className="detail-form__input detail-form__input--readonly"
              value={latestInvite.createdAt ?? latestInvite.created_at ?? '—'}
              readOnly
            />
          </div>
          <div className="detail-form__field detail-form__field--span-4">
            <label className="detail-form__label">Platnost do</label>
            <input
              className="detail-form__input detail-form__input--readonly"
              value={latestInvite.expiresAt ?? latestInvite.expires_at ?? '—'}
              readOnly
            />
          </div>
        </div>
      ),
    }

    return [userBlock, inviteBlock]
  }, [user.createdAt, user.firstLoginAt, user.isArchived, latestInvite])

  // -----------------------------
  // Sections order
  // -----------------------------
  const sectionIds = useMemo<DetailSectionId[]>(() => {
    const base: DetailSectionId[] = ['detail', 'roles', 'attachments', 'system']
    if (canShowInviteTab) base.splice(2, 0, 'invite')
    return base
  }, [canShowInviteTab])

  // Map ViewMode -> DetailViewMode
  const detailMode: 'create' | 'edit' | 'view' =
    viewMode === 'read' ? 'view' : viewMode === 'edit' ? 'edit' : viewMode === 'create' ? 'create' : 'view'

  return (
    <DetailView
      mode={detailMode}
      sectionIds={sectionIds}
      initialActiveId={initialSectionId ?? 'detail'}
      onActiveSectionChange={(id) => onActiveSectionChange?.(id)}
      ctx={{
        entityType: 'subjects',
        entityId: user.id || undefined,
        entityLabel: user.displayName ?? null,
        mode: detailMode,

        detailContent: (
          <UserDetailForm
            user={user}
            readOnly={viewMode === 'read'}
            onDirtyChange={(dirty: boolean) => {
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

        rolesData,
        inviteContent,
        systemBlocks,
      }}
    />
  )
}
