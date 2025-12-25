'use client'

// FILE: app/modules/010-sprava-uzivatelu/forms/UserDetailFrame.tsx

import React, { useEffect, useMemo, useRef, useState } from 'react'
import DetailView, { type DetailSectionId, type DetailViewMode, type RolesData, type RolesUi } from '@/app/UI/DetailView'
import type { ViewMode } from '@/app/UI/CommonActions'

import UserDetailForm from './UserDetailForm'
import { getLatestInviteForSubject } from '@/app/lib/services/invites'

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
  // Dirty management (ponecháno)
  // -----------------------------
  const [isDirty, setIsDirty] = useState(false)
  const initialSnapshotRef = useRef<string>('')
  const firstRenderRef = useRef(true)

  useEffect(() => {
    initialSnapshotRef.current = JSON.stringify(user ?? {})
    firstRenderRef.current = true
    setIsDirty(false)
    onDirtyChange?.(false)
  }, [user?.id, onDirtyChange])

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
  // Roles data placeholder (ponecháno)
  // -----------------------------
  const rolesData = useMemo<RolesData>(() => {
    return {
      role: { code: (user as any).roleCode ?? null, name: user.roleLabel ?? null },
      permissions: [],
      availableRoles: (user as any).availableRoles ?? [],
    }
  }, [user])

  // Roles UI placeholder (ponecháno – edit role zatím nepřipojeno)
  const rolesUi = useMemo<RolesUi>(() => {
    return {
      canEdit: false,
      mode: (viewMode === 'read' ? 'view' : viewMode === 'edit' ? 'edit' : 'create') as DetailViewMode,
      roleCode: (rolesData as any)?.role?.code ?? null,
      onChangeRoleCode: () => {},
    }
  }, [rolesData, viewMode])

  // -----------------------------
  // Submit detail placeholder (ponecháno) – tady teď jen přepne dirty a vrátí user
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
  // Invite tab content (do DetailView ctx) – ponecháno (tohle je OK)
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

    const li = latestInvite

    return (
      <div className="detail-form">
        <section className="detail-form__section">
          <h3 className="detail-form__section-title">Pozvánka</h3>

          <div className="detail-form__grid detail-form__grid--narrow">
            <div className="detail-form__field detail-form__field--span-4">
              <label className="detail-form__label">E-mail</label>
              <input className="detail-form__input detail-form__input--readonly" value={user.email ?? '—'} readOnly />
            </div>

            <div className="detail-form__field detail-form__field--span-4">
              <label className="detail-form__label">Role</label>
              <input
                className="detail-form__input detail-form__input--readonly"
                value={(rolesData as any)?.role?.name ?? '—'}
                readOnly
              />
            </div>
          </div>

          {!!li && (
            <div className="detail-form__grid detail-form__grid--narrow" style={{ marginTop: 12 }}>
              <div className="detail-form__field">
                <label className="detail-form__label">Status</label>
                <input className="detail-form__input detail-form__input--readonly" value={li.status ?? '—'} readOnly />
              </div>
              <div className="detail-form__field">
                <label className="detail-form__label">Vytvořeno</label>
                <input className="detail-form__input detail-form__input--readonly" value={li.createdAt ?? '—'} readOnly />
              </div>
              <div className="detail-form__field">
                <label className="detail-form__label">Role code</label>
                <input className="detail-form__input detail-form__input--readonly" value={li.roleCode ?? '—'} readOnly />
              </div>
            </div>
          )}
        </section>
      </div>
    )
  }, [canShowInviteTab, inviteLoading, inviteError, latestInvite, user.email, rolesData])

  // -----------------------------
  // ✅ System blocks – OPRAVA TYPE: přidáváme title/content, ale necháváme i id/label/value
  // -----------------------------
  const systemBlocks = useMemo(() => {
    const blocks = [
      {
        id: 'created_at',
        label: 'Vytvořeno',
        value: user.createdAt ?? '—',

        // pro DetailView (správný formát)
        title: 'Vytvořeno',
        content: (
          <div className="detail-form__grid detail-form__grid--narrow">
            <div className="detail-form__field detail-form__field--span-4">
              <label className="detail-form__label">Vytvořeno</label>
              <input className="detail-form__input detail-form__input--readonly" value={user.createdAt ?? '—'} readOnly />
            </div>
          </div>
        ),
      },
      {
        id: 'first_login_at',
        label: 'První přihlášení',
        value: user.firstLoginAt ?? '—',

        title: 'První přihlášení',
        content: (
          <div className="detail-form__grid detail-form__grid--narrow">
            <div className="detail-form__field detail-form__field--span-4">
              <label className="detail-form__label">První přihlášení</label>
              <input
                className="detail-form__input detail-form__input--readonly"
                value={user.firstLoginAt ?? '—'}
                readOnly
              />
            </div>
          </div>
        ),
      },
      {
        id: 'archived',
        label: 'Archivován',
        value: user.isArchived ? 'Ano' : 'Ne',

        title: 'Archivace',
        content: (
          <div className="detail-form__grid detail-form__grid--narrow">
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
      },
    ]

    return blocks
  }, [user.createdAt, user.firstLoginAt, user.isArchived])

  // -----------------------------
  // Sections
  // -----------------------------
  const sectionIds = useMemo<DetailSectionId[]>(() => {
    const base: DetailSectionId[] = ['detail', 'roles', 'attachments', 'system']
    if (canShowInviteTab) base.splice(2, 0, 'invite')
    return base
  }, [canShowInviteTab])

  // Map ViewMode -> DetailViewMode (DetailView nezná "list")
  const detailMode: DetailViewMode =
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
        rolesUi,

        inviteContent,
        systemBlocks,
      }}
    />
  )
}
