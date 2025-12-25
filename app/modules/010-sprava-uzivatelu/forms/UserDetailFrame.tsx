'use client'

// FILE: app/modules/010-sprava-uzivatelu/forms/UserDetailFrame.tsx
// PURPOSE: Detail uživatele (Subject/User) v modulu 010.
// - Pozvánka (jen když dává smysl)
// - Dirty management
// FIX: Save je napojené na Supabase přes app/lib/services/users.saveUser()

import React, { useEffect, useMemo, useRef, useState } from 'react'
import DetailView from '@/app/UI/DetailView'
import type { DetailSectionId } from '@/app/UI/DetailView'
import type { ViewMode } from '@/app/UI/CommonActions'

import UserDetailForm, { type UserFormValue } from './UserDetailForm'
import { getLatestInviteForSubject, sendInvite } from '@/app/lib/services/invites'
import type { InviteFormValue } from './InviteUserForm'
import { saveUser } from '@/app/lib/services/users'

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

  // volitelně (pokud někdy doplníš z DB)
  titleBefore?: string | null
  firstName?: string | null
  lastName?: string | null
  login?: string | null
}

type Props = {
  user: UiUser
  viewMode: ViewMode
  initialSectionId?: DetailSectionId

  onActiveSectionChange?: (id: DetailSectionId) => void

  onRegisterSubmit?: (fn: () => Promise<UiUser | null>) => void
  onRegisterInviteSubmit?: (fn: () => Promise<boolean>) => void

  onDirtyChange?: (dirty: boolean) => void
}

function buildInitialFormValue(u: UiUser): UserFormValue {
  return {
    displayName: (u.displayName ?? '').toString(),
    email: (u.email ?? '').toString(),
    phone: (u.phone ?? '').toString(),

    titleBefore: ((u as any).titleBefore ?? '').toString(),
    firstName: ((u as any).firstName ?? '').toString(),
    lastName: ((u as any).lastName ?? '').toString(),
    login: ((u as any).login ?? '').toString(),

    isArchived: !!u.isArchived,
  }
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

  // ✅ držíme aktuální hodnoty formuláře pro SAVE
  const [formValue, setFormValue] = useState<UserFormValue>(() => buildInitialFormValue(user))

  useEffect(() => {
    // reset snapshot při změně user nebo viewMode
    const init = buildInitialFormValue(user)
    setFormValue(init)

    initialSnapshotRef.current = JSON.stringify(init)
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
  // RolesData mock (zatím ponecháno – napojíme na 900 v dalším kroku)
  // -----------------------------
  const rolesData = useMemo(() => {
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

        const roleCode = (rolesData as any)?.role?.code ?? null
        if (!roleCode?.trim()) {
          alert('Chybí role (role_code) – nelze vytvořit pozvánku.')
          return false
        }

        const payload: InviteFormValue = {
          mode: 'existing',
          subjectId: user.id,
          email: user.email,
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
  }, [onRegisterInviteSubmit, user?.id, user?.email, user?.displayName, canShowInviteTab, rolesData])

  // -----------------------------
  // ✅ SUBMIT detail – napojené na Supabase (saveUser)
  // -----------------------------
  useEffect(() => {
    if (!onRegisterSubmit) return

    onRegisterSubmit(async () => {
      try {
        const v = formValue ?? buildInitialFormValue(user)

        // minimální validace pro NOT NULL display_name
        if (!v.displayName?.trim()) {
          alert('Zobrazované jméno je povinné.')
          return null
        }

        const idForSave = user?.id?.trim() ? user.id : 'new'

        const savedRow = await saveUser({
          id: idForSave,
          subjectType: 'osoba',

          displayName: v.displayName,
          email: v.email,
          phone: v.phone,
          isArchived: v.isArchived,

          titleBefore: v.titleBefore,
          firstName: v.firstName,
          lastName: v.lastName,
          login: v.login,

          // role/permissions zatím necháme beze změny (další krok)
          // roleCode: ...
          // permissionCodes: ...
        })

        const saved: UiUser = {
          ...user,
          id: (savedRow as any).id ?? user.id,
          displayName: (savedRow as any).display_name ?? v.displayName,
          email: (savedRow as any).email ?? v.email,
          phone: (savedRow as any).phone ?? v.phone,
          isArchived: !!(savedRow as any).is_archived,
          createdAt: (savedRow as any).created_at ?? user.createdAt,

          firstLoginAt: (savedRow as any).first_login_at ?? user.firstLoginAt ?? null,

          titleBefore: (savedRow as any).title_before ?? (user as any).titleBefore ?? null,
          firstName: (savedRow as any).first_name ?? (user as any).firstName ?? null,
          lastName: (savedRow as any).last_name ?? (user as any).lastName ?? null,
          login: (savedRow as any).login ?? (user as any).login ?? null,
        }

        // reset dirty snapshot po uložení
        const nextForm = buildInitialFormValue(saved)
        setFormValue(nextForm)
        initialSnapshotRef.current = JSON.stringify(nextForm)
        firstRenderRef.current = true

        setIsDirty(false)
        onDirtyChange?.(false)

        return saved
      } catch (e: any) {
        console.error('[UserDetailFrame.save] ERROR', e)
        alert(e?.message ?? 'Chyba uložení uživatele')
        return null
      }
    })
  }, [onRegisterSubmit, formValue, user, onDirtyChange])

  // -----------------------------
  // Invite tab content
  // -----------------------------
  const inviteContent = useMemo(() => {
    if (!canShowInviteTab) return null

    if (inviteLoading) {
      return <div style={{ padding: 12 }}>Načítám pozvánku…</div>
    }
    if (inviteError) {
      return <div style={{ padding: 12, color: 'crimson' }}>{inviteError}</div>
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
  // System blocks (zachováno – typově OK pro DetailView)
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
            <input
              className="detail-form__input detail-form__input--readonly"
              value={user.isArchived ? 'Ano' : 'Ne'}
              readOnly
            />
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
    if (canShowInviteTab) base.splice(2, 0, 'invite')
    return base
  }, [canShowInviteTab])

  // Map ViewMode -> DetailViewMode (DetailView nezná "list")
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
            onDirtyChange={(dirty) => {
              if (!dirty) {
                setIsDirty(false)
                onDirtyChange?.(false)
              }
            }}
            onValueChange={(val: any) => {
              setFormValue(val as UserFormValue)
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
