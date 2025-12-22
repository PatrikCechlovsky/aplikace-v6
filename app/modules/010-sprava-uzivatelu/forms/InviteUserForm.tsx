// FILE: app/modules/010-sprava-uzivatelu/forms/InviteUserForm.tsx

'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { listUsers, type UsersListRow } from '@/app/lib/services/users'
import { fetchRoleTypes } from '@/app/modules/900-nastaveni/services/roleTypes'

export type InviteMode = 'existing' | 'new'

export type InviteFormValue = {
  mode: InviteMode
  subjectId: string | null
  email: string
  displayName: string
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

  return (
    <div className="detail-form">
      <section className="detail-form__section">
        <h3 className="detail-form__section-title">Pozvat ke spolupráci</h3>

        <div className="detail-form__hint" style={{ marginBottom: 10 }}>
          Pozvánka slouží k přizvání uživatele do aplikace, aby mohl spolupracovat na tvých nemovitostech.
          Později stejný mechanismus použijeme i pro pozvání nového pronajímatele (hlavní – platící entity).
        </div>

        {inviteBlockedReason && (
          <div className="detail-form__hint" style={{ marginBottom: 10 }}>
            {inviteBlockedReason}
            {inviteState?.validUntil ? ` (platí do: ${inviteState.validUntil})` : ''}
          </div>
        )}

        {variant === 'standalone' && (
          <div className="detail-form__grid detail-form__grid--narrow" style={{ marginBottom: 8 }}>
            <div className="detail-form__field detail-form__field--span-4">
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
                      setV((p) => ({ ...p, mode: 'new', subjectId: null, email: '', displayName: '' }))
                      markDirty()
                    }}
                  />
                  Pozvat nového
                </label>
              </div>
            </div>
          </div>
        )}

        <div className="detail-form__grid detail-form__grid--narrow">
          {mode === 'existing' && variant === 'standalone' && (
            <div className="detail-form__field detail-form__field--span-6">
              <label className="detail-form__label">Uživatel</label>
              <select
                className="detail-form__input"
                value={v.subjectId ?? ''}
                disabled={loadingUsers}
                onChange={(e) => {
                  const nextId = e.target.value || null
                  const picked = users.find((u: any) => u.id === nextId) as any
                  setV((p) => ({
                    ...p,
                    subjectId: nextId,
                    email: picked?.email ?? p.email,
                    displayName: picked?.display_name ?? picked?.displayName ?? p.displayName,
                  }))
                  markDirty()
                }}
              >
                <option value="">{loadingUsers ? 'Načítám…' : '— vyber uživatele —'}</option>
                {users.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {(u.display_name ?? u.displayName ?? 'Uživatel') + (u.email ? ` (${u.email})` : '')}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Email – užší */}
          <div className="detail-form__field detail-form__field--span-3">
            <label className="detail-form__label">Email</label>
            <input
              className={'detail-form__input' + (mode === 'existing' && variant === 'existingOnly' ? ' detail-form__input--readonly' : '')}
              value={v.email}
              readOnly={variant === 'existingOnly'} // v detailu existujícího read-only
              onChange={(e) => {
                setV((p) => ({ ...p, email: e.target.value }))
                markDirty()
              }}
              placeholder="např. uzivatel@email.cz"
            />
          </div>

          {/* Zobrazované jméno */}
          <div className="detail-form__field detail-form__field--span-3">
            <label className="detail-form__label">Zobrazované jméno</label>
            <input
              className={'detail-form__input' + (variant === 'existingOnly' ? ' detail-form__input--readonly' : '')}
              value={v.displayName}
              readOnly={variant === 'existingOnly'}
              onChange={(e) => {
                setV((p) => ({ ...p, displayName: e.target.value }))
                markDirty()
              }}
              placeholder="volitelné (fallback z emailu)"
            />
          </div>

          {/* Role – užší */}
          <div className="detail-form__field detail-form__field--span-3">
            <label className="detail-form__label">Role</label>
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

          <div className="detail-form__field detail-form__field--span-6">
            <label className="detail-form__label">Poznámka</label>
            <textarea
              className="detail-form__input"
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
