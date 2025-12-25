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
import type { InviteFormValue } from './InviteUserForm'
import DetailAttachmentsListSection from '@/app/UI/detail-sections/DetailAttachmentsListSection'

console.log('UsersTile render')


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
    // ✅ vidět jen když to dává smysl:
    // - uživatel není aktivní (ještě se nepřihlásil)
    // - a máme email (aby šlo zvát)
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

    if (inviteLoading) {
      return <div style={{ padding: 12 }}>Načítám pozvánku…</div>
    }
    if (inviteError) {
      return (
        <div style={{ padding: 12, color: 'crimson' }}>
          {inviteError}
        </div>
      )
    }

    const li = latestInvite

    return (
      <div className="detail-form">
        <section className="detail-form__section">
          <h3 className="detail-form__section-title">Pozvánka</h3>

          <div className="detail-form__grid detail-form__grid--narrow">
            <div className="detail-form__field detail-form__field--span-4">
              <label className="detail-form__label">Email</label>
              <input className="detail-form__input detail-form__input--readonly" value={user.email ?? '—'} readOnly />
            </div>

            <div className="detail-form__field detail-form__field--span-4">
              <label className="detail-form__label">Aktuální role</label>
              <input
                className="detail-form__input detail-form__input--readonly"
                value={(rolesData as any)?.role?.name ?? user.roleLabel ?? '—'}
                readOnly
              />
              <div className="detail-form__hint">
                Akce „Odeslat pozvánku“ vytvoří vždy novou pozvánku a předchozí pending expirováno.
              </div>
            </div>
          </div>
        </section>

        <section className="detail-form__section">
          <h3 className="detail-form__section-title">Poslední pozvánka</h3>

          {!li ? (
            <div className="detail-form__hint" style={{ padding: 8 }}>
              Zatím nebyla vytvořena žádná pozvánka. Použij CommonAction „Odeslat pozvánku“.
            </div>
          ) : (
            <div className="detail-form__grid detail-form__grid--narrow">
              <div className="detail-form__field detail-form__field--span-4">
                <label className="detail-form__label">Status</label>
                <input className="detail-form__input detail-form__input--readonly" value={li.status ?? '—'} readOnly />
              </div>

              <div className="detail-form__field detail-form__field--span-4">
                <label className="detail-form__label">Invite ID</label>
                <input className="detail-form__input detail-form__input--readonly" value={li.inviteId ?? '—'} readOnly />
              </div>

              <div className="detail-form__field detail-form__field--span-4">
                <label className="detail-form__label">Vytvořeno</label>
                <input className="detail-form__input detail-form__input--readonly" value={li.createdAt ?? '—'} readOnly />
              </div>

              <div className="detail-form__field detail-form__field--span-4">
                <label className="detail-form__label">Platnost do</label>
                <input className="detail-form__input detail-form__input--readonly" value={li.expiresAt ?? '—'} readOnly />
              </div>

              <div className="detail-form__field detail-form__field--span-4">
                <label className="detail-form__label">Role</label>
                <input className="detail-form__input detail-form__input--readonly" value={li.roleCode ?? '—'} readOnly />
              </div>
            </div>
          )}
        </section>
      </div>
    )
  }, [canShowInviteTab, inviteLoading, inviteError, latestInvite, user.email, user.roleLabel, rolesData])

  // -----------------------------
  // System blocks
  // -----------------------------
  const systemBlocks = useMemo(() => {
    const userBlock = {
      title: 'Systém uživatele',
      content: (
        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field detail-form__field--span-4">
            <label className="detail-form__label">Vytvořeno</label>
            <input className="detail-form__input detail-form__input--readonly" value={user.createdAt ?? '—'} readOnly />
          </div>
          <div className="detail-form__field detail-form__field--span-4">
            <label className="detail-form__label">První přihlášení</label>
            <input className="detail-form__input detail-form__input--readonly" value={user.firstLoginAt ?? '—'} readOnly />
          </div>
          <div className="detail-form__field detail-form__field--span-4">
            <label className="detail-form__label">Archivován</label>
            <input className="detail-form__input detail-form__input--readonly" value={user.isArchived ? 'Ano' : 'Ne'} readOnly />
          </div>
        </div>
      ),
    }

    const inviteBlock = {
      title: 'Systém pozvánky',
      visible: !!latestInvite,
      content: !latestInvite ? (
        <div className="detail-form__hint" style={{ padding: 8 }}>
          Žádná pozvánka.
        </div>
      ) : (
        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field detail-form__field--span-4">
            <label className="detail-form__label">Status</label>
            <input className="detail-form__input detail-form__input--readonly" value={latestInvite.status ?? '—'} readOnly />
          </div>
          <div className="detail-form__field detail-form__field--span-4">
            <label className="detail-form__label">Invite ID</label>
            <input className="detail-form__input detail-form__input--readonly" value={latestInvite.inviteId ?? '—'} readOnly />
          </div>
          <div className="detail-form__field detail-form__field--span-4">
            <label className="detail-form__label">Vytvořeno</label>
            <input className="detail-form__input detail-form__input--readonly" value={latestInvite.createdAt ?? '—'} readOnly />
          </div>
          <div className="detail-form__field detail-form__field--span-4">
            <label className="detail-form__label">Platnost do</label>
            <input className="detail-form__input detail-form__input--readonly" value={latestInvite.expiresAt ?? '—'} readOnly />
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

    // Map ViewMode -> DetailViewMode (DetailView nezná "list")
  const detailMode: 'create' | 'edit' | 'view' =
    viewMode === 'read'
      ? 'view'
      : viewMode === 'edit'
        ? 'edit'
        : viewMode === 'create'
          ? 'create'
          : 'view' // fallback pro případ, že sem omylem přijde "list"

  return (
    <DetailView
      mode={detailMode}
      sectionIds={sectionIds}
      // ✅ umožní přepínat záložky i z parentu (CommonAction „attachments“)
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
              // z UserDetailForm může přijít dirty=true i při init – filtrujeme přes snapshot
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

        // ✅ sem se posílá content pro záložku Pozvánka
        inviteContent,

        // ✅ systémové bloky
        systemBlocks,
      }}
    />
  )
}
