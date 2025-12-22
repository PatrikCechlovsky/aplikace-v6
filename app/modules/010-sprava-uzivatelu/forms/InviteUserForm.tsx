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
  variant?: 'standalone' | 'existingOnly'
}

export default function InviteUserForm({
  initialValue,
  onValueChange,
  onDirtyChange,
  variant = 'standalone',
}: Props) {
  const [v, setV] = useState<InviteFormValue>(initialValue)

  useEffect(() => {
    setV(initialValue)
  }, [initialValue])

  useEffect(() => {
    onValueChange(v)
  }, [v, onValueChange])

  const setDirty = () => onDirtyChange?.(true)

  // Users list jen pro standalone/existing režim
  const [users, setUsers] = useState<UsersListRow[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

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

  // Role types
  const [roles, setRoles] = useState<{ code: string; name: string }[]>([])
  const [loadingRoles, setLoadingRoles] = useState(false)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoadingRoles(true)
      try {
        const rows = await fetchRoleTypes()
        if (cancelled) return
        setRoles(
          (rows ?? [])
            .map((r: any) => ({ code: r.code, name: r.name }))
            .filter((x: any) => !!x.code)
        )
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

  // existingOnly => vždy existing
  useEffect(() => {
    if (variant !== 'existingOnly') return
    setV((p) => ({
      ...p,
      mode: 'existing',
      subjectId: initialValue.subjectId ?? p.subjectId,
      email: initialValue.email ?? p.email,
      displayName: initialValue.displayName ?? p.displayName,
    }))
  }, [variant, initialValue.subjectId, initialValue.email, initialValue.displayName])

  const existingOptions = useMemo(() => {
    return users
      .filter((u) => !!u.email)
      .map((u) => ({
        id: u.id,
        label: `${u.display_name}${u.email ? ` — ${u.email}` : ''}`,
        email: u.email ?? '',
        displayName: u.display_name ?? '',
        roleCode: (u as any).role_code ?? '',
      }))
  }, [users])

  const roleSelectDisabled = loadingRoles || roles.length === 0

  return (
    <div className="detail-form">
      <div className="detail-form__hint">
        Pozvi kolegu ke spolupráci. Po přijetí pozvánky získá přístup podle zvolené role.
      </div>

      <section className="detail-form__section">
        <h3 className="detail-form__section-title">Pozvánka</h3>

        <div className="detail-form__grid detail-form__grid--narrow">
          {variant === 'standalone' && (
            <div className="detail-form__field detail-form__field--span-6">
              <label className="detail-form__label">Režim</label>
              <div className="detail-form__value">
                <label className="detail-form__hint">
                  <input
                    type="radio"
                    checked={v.mode === 'existing'}
                    onChange={() => {
                      setDirty()
                      setV((p) => ({ ...p, mode: 'existing' }))
                    }}
                  />{' '}
                  Pozvat existujícího
                </label>

                <label className="detail-form__hint" style={{ marginLeft: 16 }}>
                  <input
                    type="radio"
                    checked={v.mode === 'new'}
                    onChange={() => {
                      setDirty()
                      setV((p) => ({ ...p, mode: 'new', subjectId: null }))
                    }}
                  />{' '}
                  Pozvat nového
                </label>
              </div>
            </div>
          )}

          {v.mode === 'existing' && variant === 'standalone' && (
            <div className="detail-form__field detail-form__field--span-6">
              <label className="detail-form__label">Uživatel</label>
              <select
                className="detail-form__input"
                value={v.subjectId ?? ''}
                onChange={(e) => {
                  setDirty()
                  const id = e.target.value || null
                  const found = existingOptions.find((o) => o.id === id)
                  setV((p) => ({
                    ...p,
                    subjectId: id,
                    email: found?.email ?? p.email,
                    displayName: found?.displayName ?? p.displayName,
                    roleCode: found?.roleCode ?? p.roleCode,
                  }))
                }}
              >
                <option value="">{loadingUsers ? 'Načítám…' : '— vyber —'}</option>
                {existingOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* NEW: užší email + role */}
          {v.mode === 'new' && (
            <div className="detail-form__field detail-form__field--span-3">
              <label className="detail-form__label">Email</label>
              <input
                className="detail-form__input"
                value={v.email}
                onChange={(e) => {
                  setDirty()
                  const email = e.target.value
                  setV((p) => ({
                    ...p,
                    email,
                    displayName: p.displayName || (email.includes('@') ? email.split('@')[0] : p.displayName),
                  }))
                }}
                placeholder="např. uzivatel@email.cz"
              />
            </div>
          )}

          {v.mode === 'new' && (
            <div className="detail-form__field detail-form__field--span-3">
              <label className="detail-form__label">Zobrazované jméno</label>
              <input
                className="detail-form__input"
                value={v.displayName}
                onChange={(e) => {
                  setDirty()
                  setV((p) => ({ ...p, displayName: e.target.value }))
                }}
                placeholder="volitelné"
              />
            </div>
          )}

          {/* existingOnly / existing: email+name read-only (užší) */}
          {(variant === 'existingOnly' || (v.mode === 'existing' && variant !== 'standalone')) ? null : null}

          {variant === 'existingOnly' && (
            <>
              <div className="detail-form__field detail-form__field--span-3">
                <label className="detail-form__label">Email</label>
                <input className="detail-form__input detail-form__input--readonly" value={v.email} readOnly />
              </div>

              <div className="detail-form__field detail-form__field--span-3">
                <label className="detail-form__label">Zobrazované jméno</label>
                <input className="detail-form__input detail-form__input--readonly" value={v.displayName} readOnly />
              </div>
            </>
          )}

          {/* Role: užší */}
          <div className="detail-form__field detail-form__field--span-2">
            <label className="detail-form__label">Role</label>
            <select
              className="detail-form__input"
              value={v.roleCode}
              onChange={(e) => {
                setDirty()
                setV((p) => ({ ...p, roleCode: e.target.value }))
              }}
              disabled={roleSelectDisabled}
            >
              <option value="">{loadingRoles ? 'Načítám…' : '— vyber —'}</option>
              {roles.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="detail-form__field detail-form__field--span-4">
            <label className="detail-form__label">Poznámka</label>
            <textarea
              className="detail-form__input"
              value={v.note}
              onChange={(e) => {
                setDirty()
                setV((p) => ({ ...p, note: e.target.value }))
              }}
              rows={4}
              placeholder="volitelné"
            />
          </div>
        </div>
      </section>
    </div>
  )
}
