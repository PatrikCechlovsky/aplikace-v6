// FILE: app/modules/010-sprava-uzivatelu/forms/InviteUserForm.tsx

'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { getUserDetail, listUsers, type UsersListRow } from '@/app/lib/services/users'
import { fetchRoleTypes } from '@/app/modules/900-nastaveni/services/roleTypes'
import createLogger from '@/app/lib/logger'
const logger = createLogger('InviteUserForm')
import { fetchPermissionTypes } from '@/app/modules/900-nastaveni/services/permissionTypes'

export type InviteMode = 'existing' | 'new'

export type InviteFormValue = {
  mode: InviteMode
  subjectId: string | null
  email: string
  displayName: string
  permissionCode: string
  roleCode: string
  note: string
}

type Props = {
  initialValue: InviteFormValue
  onValueChange: (v: InviteFormValue) => void
  onDirtyChange?: (dirty: boolean) => void
  /** 'standalone' = nový/existující, 'existingOnly' = pouze pro existujícího uživatele (v detailu) */
  variant?: 'standalone' | 'existingOnly'
  /** pokud posíláš status (např. z detailu), můžeme zobrazit jemný hint a blokovat resend */
  inviteState?: {
    canSendInvite?: boolean | null
    firstLoginAt?: string | null
    status?: string | null
    validUntil?: string | null
  }
}

export default function InviteUserForm({
  initialValue,
  onValueChange,
  onDirtyChange,
  variant = 'standalone',
  inviteState,
}: Props) {
  const [v, setV] = useState<InviteFormValue>(initialValue)

  // guard proti race condition při rychlém přepínání vybraného uživatele
  const pickSeqRef = useRef(0)

  // V detailu uživatele (existingOnly) držíme režim vždy 'existing' a subjectId z preset hodnoty
  useEffect(() => {
    if (variant !== 'existingOnly') return
    setV((p) => ({
      ...p,
      mode: 'existing',
      subjectId: initialValue.subjectId ?? p.subjectId,
      email: initialValue.email ?? p.email,
      displayName: initialValue.displayName ?? p.displayName,
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, initialValue.subjectId, initialValue.email, initialValue.displayName])

  useEffect(() => {
    setV(initialValue)
  }, [initialValue])

  useEffect(() => {
    onValueChange(v)
  }, [v, onValueChange])

  const [users, setUsers] = useState<UsersListRow[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  const [roles, setRoles] = useState<{ code: string; name: string }[]>([])
  const [loadingRoles, setLoadingRoles] = useState(false)

  const [permissions, setPermissions] = useState<{ code: string; name: string }[]>([])
  const [loadingPermissions, setLoadingPermissions] = useState(false)

  // load users only for standalone/existing
  useEffect(() => {
    if (variant !== 'standalone') return
    let cancelled = false
    const run = async () => {
      setLoadingUsers(true)
      try {
        const rows = await listUsers({ includeArchived: false, limit: 500 } as any)
        if (!cancelled) setUsers(rows)
      } catch {
        if (!cancelled) setUsers([])
      } finally {
        if (!cancelled) setLoadingUsers(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [variant])

  // load roles always
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoadingRoles(true)
      try {
        const rows = await fetchRoleTypes()
        if (cancelled) return
        setRoles((rows ?? []).map((r: any) => ({ code: r.code, name: r.name })))
      } catch {
        if (!cancelled) setRoles([])
      } finally {
        if (!cancelled) setLoadingRoles(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [])

  // load permissions always
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoadingPermissions(true)
      try {
        const rows = await fetchPermissionTypes()
        if (cancelled) return
        setPermissions((rows ?? []).map((p: any) => ({ code: p.code, name: p.name })))
      } catch {
        if (!cancelled) setPermissions([])
      } finally {
        if (!cancelled) setLoadingPermissions(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [])

  const mode = variant === 'existingOnly' ? 'existing' : v.mode

  const inviteBlockedReason = useMemo(() => {
    if (!inviteState) return null
    if (inviteState.firstLoginAt) return 'Uživatel už se přihlásil – pozvánka se znovu neposílá.'
    if (inviteState.canSendInvite === false) return 'Pozvánku teď nelze odeslat (už existuje aktivní nebo je blokovaná).'
    return null
  }, [inviteState])

  function markDirty() {
    onDirtyChange?.(true)
  }
  const selectableUsers = useMemo(() => {
    // Aktivní user = má first_login_at (nebo firstLoginAt). Ty nechceme nabízet k pozvánce.
    return (users ?? []).filter((u: any) => {
      const firstLogin = u?.first_login_at ?? u?.firstLoginAt ?? null
      if (firstLogin) return false
      // pozvánka bez emailu nedává smysl
      const email = String(u?.email ?? '').trim()
      if (!email) return false
      return true
    })
  }, [users])
  
  useEffect(() => {
    if (variant !== 'standalone') return
    if (mode !== 'existing') return
    if (!v.subjectId) return

    const ok = selectableUsers.some((u: any) => u.id === v.subjectId)
    if (!ok) {
      setV((p) => ({ ...p, subjectId: null }))
    }
  }, [mode, selectableUsers, v.subjectId, variant])
  
  return (
    <div className="detail-form">
      <section className="detail-form__section">
        {inviteBlockedReason && (
          <div className="detail-form__hint" style={{ marginBottom: 10 }}>
            {inviteBlockedReason}
            {inviteState?.validUntil ? ` (platí do: ${inviteState.validUntil})` : ''}
          </div>
        )}

        {/* Režim - plná šířka */}
        {variant === 'standalone' && (
          <div className="detail-form__grid detail-form__grid--narrow" style={{ marginBottom: 12 }}>
            <div className="detail-form__field detail-form__field--span-2">
              <label className="detail-form__label">Režim</label>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', paddingTop: 8 }}>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="radio"
                    checked={mode === 'existing'}
                    onChange={() => {
                      setV((p) => ({ ...p, mode: 'existing' }))
                      markDirty()
                    }}
                  />
                  Pozvat existujícího
                </label>

                <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="radio"
                    checked={mode === 'new'}
                    onChange={() => {
                      setV((p) => ({
                        ...p,
                        mode: 'new',
                        subjectId: null,
                        email: '',
                        displayName: '',
                        roleCode: '',
                        permissionCode: '',
                      }))
                      markDirty()
                    }}
                  />
                  Pozvat nového
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Hlavní formulář - optimalizované rozložení */}
        <div className="detail-form__grid detail-form__grid--narrow">
          {/* Uživatel - plná šířka (pouze pokud existující) */}
          {mode === 'existing' && variant === 'standalone' && (
            <div className="detail-form__field detail-form__field--span-2">
              <label className="detail-form__label">Uživatel</label>
              <select
                className="detail-form__input"
                value={v.subjectId ?? ''}
                disabled={loadingUsers}
                onChange={(e) => {
                  const nextId = e.target.value || null
                  const picked = selectableUsers.find((u: any) => u.id === nextId) as any

                  // 1) rychlá aktualizace základních polí (email/jméno)
                  setV((p) => ({
                    ...p,
                    subjectId: nextId,
                    email: picked?.email ?? p.email,
                    displayName: picked?.display_name ?? picked?.displayName ?? p.displayName,
                  }))
                  markDirty()

                  // 2) načíst role + permission ze Supabase (1+1) pro vybraného uživatele
                  const seq = ++pickSeqRef.current
                  if (!nextId) return
                  ;(async () => {
                    try {
                      const detail = await getUserDetail(nextId)
                      if (pickSeqRef.current !== seq) return

                      const rc = (detail?.role_code ?? '').trim()
                      const pc = String((detail?.permissions ?? [])[0] ?? '').trim()

                      setV((p) => ({
                        ...p,
                        roleCode: rc || p.roleCode,
                        permissionCode: pc || p.permissionCode,
                      }))
                    } catch (err) {
                      // necháme uživatele vybrat ručně
                      logger.warn('getUserDetail failed', err)
                    }
                  })()
                }}
              >
                <option value="">{loadingUsers ? 'Načítám…' : '— vyber uživatele —'}</option>
               
                {selectableUsers.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {(u.display_name ?? u.displayName ?? 'Uživatel') + (u.email ? ` (${u.email})` : '')}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Email - plná šířka */}
          <div className="detail-form__field detail-form__field--span-2">
            <label className="detail-form__label">
              E-mail <span className="detail-form__required">*</span>
            </label>
            <input
              className={'detail-form__input' + (mode === 'existing' && variant === 'existingOnly' ? ' detail-form__input--readonly' : '')}
              type="email"
              maxLength={255}
              size={40}
              value={v.email}
              readOnly={variant === 'existingOnly'}
              onChange={(e) => {
                setV((p) => ({ ...p, email: e.target.value }))
                markDirty()
              }}
              placeholder="např. uzivatel@email.cz"
            />
          </div>

          {/* Zobrazované jméno - plná šířka */}
          <div className="detail-form__field detail-form__field--span-2">
            <label className="detail-form__label">Zobrazované jméno</label>
            <input
              className={'detail-form__input' + (variant === 'existingOnly' ? ' detail-form__input--readonly' : '')}
              type="text"
              maxLength={50}
              size={30}
              value={v.displayName}
              readOnly={variant === 'existingOnly'}
              onChange={(e) => {
                setV((p) => ({ ...p, displayName: e.target.value }))
                markDirty()
              }}
              placeholder="volitelné (fallback z emailu)"
            />
          </div>

          {/* Role a Oprávnění - vedle sebe */}
          <div className="detail-form__field">
            <label className="detail-form__label">
              Role <span className="detail-form__required">*</span>
            </label>
            <select
              className="detail-form__input"
              value={v.roleCode}
              disabled={loadingRoles}
              onChange={(e) => {
                setV((p) => ({ ...p, roleCode: e.target.value }))
                markDirty()
              }}
            >
              <option value="">{loadingRoles ? 'Načítám…' : '— vyber roli —'}</option>
              {roles.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="detail-form__field">
            <label className="detail-form__label">
              Oprávnění <span className="detail-form__required">*</span>
            </label>
            <select
              className="detail-form__input"
              value={v.permissionCode}
              disabled={loadingPermissions}
              onChange={(e) => {
                setV((p) => ({ ...p, permissionCode: e.target.value }))
                markDirty()
              }}
            >
              <option value="">{loadingPermissions ? 'Načítám…' : '— vyber oprávnění —'}</option>
              {permissions.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Poznámka - plná šířka */}
          <div className="detail-form__field detail-form__field--span-2">
            <label className="detail-form__label">Poznámka</label>
            <textarea
              className="detail-form__input"
              maxLength={500}
              value={v.note}
              onChange={(e) => {
                setV((p) => ({ ...p, note: e.target.value }))
                markDirty()
              }}
              placeholder="volitelné"
              rows={4}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
