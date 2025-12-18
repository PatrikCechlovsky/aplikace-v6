// FILE: app/modules/010-sprava-uzivatelu/forms/InviteUserForm.tsx
// PURPOSE: Minimalistický invite formulář (existující / nový). Validace primárně v service vrstvě.

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
}

function emailLooksValid(email: string): boolean {
  const e = (email ?? '').trim()
  if (!e) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
}

export default function InviteUserForm({ initialValue, onValueChange, onDirtyChange }: Props) {
  const [v, setV] = useState<InviteFormValue>(initialValue)

  const [users, setUsers] = useState<UsersListRow[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  const [roles, setRoles] = useState<{ code: string; name: string }[]>([])
  const [loadingRoles, setLoadingRoles] = useState(false)

  useEffect(() => {
    setV(initialValue)
  }, [initialValue])

  useEffect(() => {
    onValueChange(v)
  }, [v, onValueChange])

  // načti uživatele pro variantu A
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoadingUsers(true)
      try {
        // Pozor: pokud tvá listUsers neumí includeArchived/limit, uprav sem podle její signatury.
        const rows = await listUsers({ includeArchived: false, limit: 500 } as any)
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

  // načti role z role_types (stejné jako modul 900)
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
      } catch (e) {
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

  const roleSelectDisabled = loadingRoles || roles.length === 0

  return (
    <div className="detail-form">
      <div className="detail-form__hint">
        Pozvánka je samostatný proces – neřeší heslo ani profil. Uživatel si heslo nastaví až po přijetí pozvánky.
      </div>

      <section className="detail-form__section">
        <h3 className="detail-form__section-title">Pozvánka</h3>

        <div className="detail-form__grid detail-form__grid--narrow">
          {/* MODE */}
          <div className="detail-form__field detail-form__field--span-4">
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

          {/* EXISTING */}
          {v.mode === 'existing' && (
            <>
              <div className="detail-form__field detail-form__field--span-4">
                <label className="detail-form__label">Vybrat uživatele *</label>
                <div className="detail-form__value">
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
                  <div className="detail-form__hint">Email je identita – pro existujícího uživatele je read-only.</div>
                </div>
              </div>

              <div className="detail-form__field detail-form__field--span-2">
                <label className="detail-form__label">Email</label>
                <input className="detail-form__input detail-form__input--readonly" value={v.email} readOnly />
              </div>

              <div className="detail-form__field detail-form__field--span-2">
                <label className="detail-form__label">Zobrazované jméno</label>
                <input
                  className="detail-form__input"
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
              <div className="detail-form__field detail-form__field--span-2">
                <label className="detail-form__label">Email *</label>
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

              <div className="detail-form__field detail-form__field--span-2">
                <label className="detail-form__label">Zobrazované jméno</label>
                <input
                  className="detail-form__input"
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
          <div className="detail-form__field detail-form__field--span-2">
            <label className="detail-form__label">Role *</label>
            <select
              className="detail-form__input"
              value={v.roleCode}
              onChange={(e) => {
                setDirty()
                setV((p) => ({ ...p, roleCode: e.target.value }))
              }}
              disabled={roleSelectDisabled}
            >
              <option value="">{loadingRoles ? 'Načítám role…' : '— vyber roli —'}</option>
              {roles.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name}
                </option>
              ))}
            </select>
            {roleSelectDisabled && <div className="detail-form__hint">Role nejdou načíst (RLS nebo prázdná tabulka role_types).</div>}
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

      {/* ERRORS */}
      {errors.length > 0 && (
        <div className="detail-form__hint" style={{ color: 'var(--color-danger, #b00020)' }}>
          {errors.map((x) => (
            <div key={x}>• {x}</div>
          ))}
        </div>
      )}

      <div className="detail-form__hint">
        Akce: v CommonActions klikni na <b>Odeslat pozvánku</b>. (Zrušit vrátí zpět do seznamu uživatelů.)
      </div>
    </div>
  )
}
