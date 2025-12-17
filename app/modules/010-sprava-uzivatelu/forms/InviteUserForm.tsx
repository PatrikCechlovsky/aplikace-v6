// FILE: app/modules/010-sprava-uzivatelu/forms/InviteUserForm.tsx
// NEW

'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { listUsers, type UsersListRow } from '@/app/lib/services/users'

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
}

function emailLooksValid(email: string): boolean {
  const e = (email ?? '').trim()
  if (!e) return false
  // jednoduchý, ale ok pro UI
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
}

export default function InviteUserForm({ initialValue, onValueChange, onDirtyChange }: Props) {
  const [v, setV] = useState<InviteFormValue>(initialValue)

  const [users, setUsers] = useState<UsersListRow[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  useEffect(() => {
    setV(initialValue)
  }, [initialValue])

  useEffect(() => {
    onValueChange(v)
  }, [v, onValueChange])

  useEffect(() => {
    // pro variantu A načteme list
    let cancelled = false
    const run = async () => {
      setLoadingUsers(true)
      try {
        const rows = await listUsers({ includeArchived: false, limit: 500 })
        if (!cancelled) setUsers(rows)
      } catch (e) {
        if (!cancelled) setUsers([])
      } finally {
        if (!cancelled) setLoadingUsers(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [])

  const existingOptions = useMemo(() => {
    return users
      .filter((u) => !!u.email)
      .map((u) => ({
        id: u.id,
        label: `${u.display_name}${u.email ? ` — ${u.email}` : ''}`,
        email: u.email ?? '',
        displayName: u.display_name ?? '',
        roleCode: (u as any).role_code ?? null,
      }))
  }, [users])

  const errors = useMemo(() => {
    const e: string[] = []
    if (v.mode === 'existing') {
      if (!v.subjectId) e.push('Vyber existujícího uživatele.')
      if (!v.roleCode?.trim()) e.push('Role je povinná.')
    } else {
      if (!v.email?.trim()) e.push('Email je povinný.')
      else if (!emailLooksValid(v.email)) e.push('Email nemá platný formát.')
      if (!v.roleCode?.trim()) e.push('Role je povinná.')
    }
    return e
  }, [v])

  const setDirty = () => onDirtyChange?.(true)

  return (
    <div className="detail-form">
      <div className="detail-form__hint">
        Pozvánka je samostatný proces – neřeší heslo ani profil. Uživatel si heslo nastaví až po přijetí pozvánky.
      </div>

      {/* MODE */}
      <div className="detail-form__grid" style={{ gridTemplateColumns: '220px 1fr' }}>
        <div className="detail-form__label">Režim</div>
        <div className="detail-form__value" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="radio"
              checked={v.mode === 'existing'}
              onChange={() => {
                setDirty()
                setV((p) => ({ ...p, mode: 'existing' }))
              }}
            />
            Pozvat existujícího
          </label>

          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="radio"
              checked={v.mode === 'new'}
              onChange={() => {
                setDirty()
                setV((p) => ({ ...p, mode: 'new', subjectId: null }))
              }}
            />
            Pozvat nového
          </label>
        </div>

        {/* EXISTING */}
        {v.mode === 'existing' && (
          <>
            <div className="detail-form__label">Vybrat uživatele</div>
            <div className="detail-form__value">
              <select
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
              <div className="detail-form__hint">Email je v invite flow brán jako identita – pro existujícího je read-only.</div>
            </div>

            <div className="detail-form__label">Email</div>
            <div className="detail-form__value">
              <input value={v.email} readOnly />
            </div>

            <div className="detail-form__label">Zobrazované jméno</div>
            <div className="detail-form__value">
              <input
                value={v.displayName}
                onChange={(e) => {
                  setDirty()
                  setV((p) => ({ ...p, displayName: e.target.value }))
                }}
              />
            </div>
          </>
        )}

        {/* NEW */}
        {v.mode === 'new' && (
          <>
            <div className="detail-form__label">Email *</div>
            <div className="detail-form__value">
              <input
                value={v.email}
                onChange={(e) => {
                  setDirty()
                  const email = e.target.value
                  setV((p) => ({
                    ...p,
                    email,
                    displayName: p.displayName || email.split('@')[0] || '',
                  }))
                }}
                placeholder="např. uzivatel@email.cz"
              />
            </div>

            <div className="detail-form__label">Zobrazované jméno</div>
            <div className="detail-form__value">
              <input
                value={v.displayName}
                onChange={(e) => {
                  setDirty()
                  setV((p) => ({ ...p, displayName: e.target.value }))
                }}
                placeholder="volitelné (fallback z emailu)"
              />
            </div>
          </>
        )}

        {/* COMMON */}
        <div className="detail-form__label">Role *</div>
        <div className="detail-form__value">
          <select
            value={v.roleCode}
            onChange={(e) => {
              setDirty()
              setV((p) => ({ ...p, roleCode: e.target.value }))
            }}
          >
            <option value="user">Uživatel</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="detail-form__label">Poznámka</div>
        <div className="detail-form__value">
          <textarea
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

      {/* ERRORS */}
      {errors.length > 0 && (
        <div className="detail-form__hint" style={{ color: 'var(--color-danger, #b00020)' }}>
          {errors.map((x) => (
            <div key={x}>• {x}</div>
          ))}
        </div>
      )}

      <div className="detail-form__hint">
        Akce: v CommonActions klikni na <b>Odeslat pozvánku</b>. (Zrušit vrátí zpět do seznamu.)
      </div>
    </div>
  )
}
