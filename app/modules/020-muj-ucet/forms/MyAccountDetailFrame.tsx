// FILE: app/modules/020-muj-ucet/forms/MyAccountDetailFrame.tsx
// PURPOSE: Detail frame pro Můj účet

'use client'

// =====================
// 1) IMPORTS
// =====================

import React, { useEffect, useMemo, useRef, useState } from 'react'
import DetailView, { type DetailSectionId, type DetailViewMode } from '@/app/UI/DetailView'
import MyAccountDetailForm, { type MyAccountFormValue } from './MyAccountDetailForm'
import { getUserDetail, saveUser } from '@/app/lib/services/users'
import { formatDateTime } from '@/app/lib/formatters/formatDateTime'
import createLogger from '@/app/lib/logger'
import { useToast } from '@/app/UI/Toast'
import '@/app/styles/components/TileLayout.css'
const logger = createLogger('MyAccountDetailFrame')

// =====================
// 2) TYPES
// =====================

export type UiUser = {
  id: string
  displayName: string
  email: string
  phone?: string
  twoFactorMethod?: string | null
  createdAt: string
  firstLoginAt?: string | null

  titleBefore?: string | null
  firstName?: string | null
  lastName?: string | null
  login?: string | null
}

type Props = {
  user: UiUser
  initialSectionId?: DetailSectionId
  onActiveSectionChange?: (id: DetailSectionId) => void
  onRegisterSubmit?: (fn: () => Promise<UiUser | null>) => void
  onDirtyChange?: (dirty: boolean) => void
}

// =====================
// 3) HELPERS
// =====================

function buildInitialFormValue(u: UiUser): MyAccountFormValue {
  return {
    displayName: (u.displayName ?? '').toString(),
    email: (u.email ?? '').toString(),
    phone: (u.phone ?? '').toString(),

    titleBefore: ((u as any).titleBefore ?? '').toString(),
    firstName: ((u as any).firstName ?? '').toString(),
    lastName: ((u as any).lastName ?? '').toString(),
    login: ((u as any).login ?? '').toString(),

    twoFactorMethod: (u.twoFactorMethod ?? '').toString(),
  }
}

// =====================
// 4) COMPONENT
// =====================

export default function MyAccountDetailFrame({
  user,
  initialSectionId,
  onActiveSectionChange,
  onRegisterSubmit,
  onDirtyChange,
}: Props) {
  const [resolvedUser, setResolvedUser] = useState<UiUser>(user)
  const resolveSeqRef = useRef(0)

  const [_isDirty, setIsDirty] = useState(false)
  const toast = useToast()
  const initialSnapshotRef = useRef<string>('')
  const firstRenderRef = useRef(true)

  const [formValue, setFormValue] = useState<MyAccountFormValue>(() => buildInitialFormValue(user))

  // Resolve DB truth on open / user change
  useEffect(() => {
    setResolvedUser(user)

    const init = buildInitialFormValue(user)
    setFormValue(init)

    initialSnapshotRef.current = JSON.stringify(init)
    firstRenderRef.current = true

    setIsDirty(false)
    onDirtyChange?.(false)
  }, [user?.id, onDirtyChange])

  // =====================
  // 5) ACTION HANDLERS
  // =====================

  const computeDirty = (nextFormSnap?: string) => {
    const formSnap = typeof nextFormSnap === 'string' ? nextFormSnap : JSON.stringify(formValue ?? {})

    const dirty = formSnap !== initialSnapshotRef.current

    setIsDirty(dirty)
    onDirtyChange?.(dirty)
  }

  const markDirtyIfChanged = (nextVal: any) => {
    const snap = JSON.stringify(nextVal ?? {})
    if (firstRenderRef.current) {
      firstRenderRef.current = false
      initialSnapshotRef.current = snap
      setIsDirty(false)
      onDirtyChange?.(false)
      return
    }
    computeDirty(snap)
  }

  // Register save submit
  useEffect(() => {
    if (!onRegisterSubmit) return

    onRegisterSubmit(async () => {
      try {
        const v = formValue ?? buildInitialFormValue(resolvedUser)

        if (!v.displayName?.trim()) {
          toast.showWarning('Zobrazované jméno je povinné.')
          return null
        }

        if (!v.email?.trim()) {
          toast.showWarning('Email je povinný.')
          return null
        }

        const savedRow = await saveUser({
          id: resolvedUser?.id?.trim() ? resolvedUser.id : 'new',
          subjectType: 'osoba',

          displayName: v.displayName,
          email: v.email,
          phone: v.phone,
          isArchived: false,

          titleBefore: v.titleBefore || null,
          firstName: v.firstName || null,
          lastName: v.lastName || null,
          login: v.login || null,
        })

        const detail = await getUserDetail(savedRow.id)
        const s: any = (detail as any)?.subject ?? {}

        const nextUser: UiUser = {
          ...resolvedUser,
          id: String(s.id ?? savedRow.id),
          displayName: String(s.display_name ?? v.displayName),
          email: String(s.email ?? v.email),
          phone: (s.phone ?? v.phone ?? undefined) as any,
          titleBefore: (s.title_before ?? v.titleBefore ?? null) as any,
          firstName: (s.first_name ?? v.firstName ?? null) as any,
          lastName: (s.last_name ?? v.lastName ?? null) as any,
          login: (s.login ?? v.login ?? null) as any,
        }

        setResolvedUser(nextUser)
        const newInit = buildInitialFormValue(nextUser)
        setFormValue(newInit)
        initialSnapshotRef.current = JSON.stringify(newInit)
        firstRenderRef.current = true

        setIsDirty(false)
        onDirtyChange?.(false)

        return nextUser
      } catch (e: any) {
        logger.error('saveUser failed', e)
        toast.showError(e?.message ?? 'Chyba při ukládání')
        return null
      }
    })
  }, [onRegisterSubmit, formValue, resolvedUser, toast, onDirtyChange])

  const detailMode: DetailViewMode = 'edit'

  const sectionIds = useMemo<DetailSectionId[]>(() => {
    return ['detail', 'accounts', 'attachments', 'system']
  }, [])

  const userName = resolvedUser.displayName || 'Uživatel'
  const title = `Můj účet: ${userName}`

  return (
    <div className="tile-layout">
      <div className="tile-layout__header">
        <h1 className="tile-layout__title">{title}</h1>
      </div>
      <div className="tile-layout__content">
        <DetailView
          mode={detailMode}
          sectionIds={sectionIds}
          initialActiveId={initialSectionId ?? 'detail'}
          onActiveSectionChange={(id) => onActiveSectionChange?.(id)}
          ctx={{
            entityType: 'subjects',
            entityId: resolvedUser.id || undefined,
            entityLabel: resolvedUser.displayName ?? null,
            showSystemEntityHeader: false,
            mode: detailMode,

            detailContent: (
              <MyAccountDetailForm
                user={resolvedUser}
                onDirtyChange={(dirty) => {
                  if (!dirty) computeDirty()
                }}
                onValueChange={(val: any) => {
                  setFormValue(val as MyAccountFormValue)
                  markDirtyIfChanged(val)
                }}
              />
            ),

            // TODO: accountsContent, systemBlocks
            systemBlocks: [
              {
                title: 'Systém',
                content: (
                  <div className="detail-form">
                    <section className="detail-form__section">
                      <h3 className="detail-form__section-title">Systém</h3>
                      <div className="detail-form__grid detail-form__grid--narrow">
                        <div className="detail-form__field">
                          <label className="detail-form__label">Entity</label>
                          <input className="detail-form__input detail-form__input--readonly" value="subjects" readOnly />
                        </div>
                        <div className="detail-form__field">
                          <label className="detail-form__label">ID</label>
                          <input className="detail-form__input detail-form__input--readonly" value={resolvedUser.id ?? '—'} readOnly />
                        </div>
                        <div className="detail-form__field">
                          <label className="detail-form__label">Vytvořeno</label>
                          <input className="detail-form__input detail-form__input--readonly" value={formatDateTime(resolvedUser.createdAt)} readOnly />
                        </div>
                        <div className="detail-form__field">
                          <label className="detail-form__label">První přihlášení</label>
                          <input className="detail-form__input detail-form__input--readonly" value={formatDateTime(resolvedUser.firstLoginAt)} readOnly />
                        </div>
                      </div>
                    </section>
                  </div>
                ),
              },
            ],
          }}
        />
      </div>
    </div>
  )
}

