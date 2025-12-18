// FILE: app/modules/010-sprava-uzivatelu/forms/InviteUserForm.tsx
// (obsah dle tvého uploadu)
// CHANGE: přidán prop variant ('standalone' | 'existingOnly') pro použití v detailu uživatele

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
  note?: string
}

type Props = {
  initialValue: InviteFormValue
  onValueChange: (v: InviteFormValue) => void
  onDirtyChange?: (dirty: boolean) => void
  /** 'standalone' = nový/existující, 'existingOnly' = pouze pro existujícího uživatele (v detailu) */
  variant?: 'standalone' | 'existingOnly'
}

function emailLooksValid(email: string): boolean {
  const e = (email ?? '').trim()
  if (!e) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
}

export default function InviteUserForm({ initialValue, onValueChange, onDirtyChange, variant = 'standalone' }: Props) {
  const [v, setV] = useState<InviteFormValue>(initialValue)

  // V detailu uživatele (existingOnly) držíme režim vždy 'existing'
  useEffect(() => {
    if (variant !== 'existingOnly') return
    setV((p) => ({ ...p, mode: 'existing', subjectId: initialValue.subjectId ?? p.subjectId }))
  }, [variant, initialValue.subjectId])

  const [users, setUsers] = useState<UsersListRow[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  const [roles, setRoles] = useState<{ code: string; name: string }[]>([])
  const [loadingRoles, setLoadingRoles] = useState(false)

  const setDirty = () => {
    onDirtyChange?.(true)
  }

  useEffect(() => {
    onValueChange(v)
  }, [v, onValueChange])

  // load users (jen pro standalone)
  useEffect(() => {
    if (variant !== 'standalone') return

    let cancelled = false
    const run = async () => {
      setLoadingUsers(true)
      try {
        const rows = await listUsers({ searchText: '', includeArchived: false })
        if (cancelled) return
        setUsers(rows)
      } catch (e) {
        console.error('[InviteUserForm.listUsers] ERROR', e)
      } finally {
        if (!cancelled) setLoadingUsers(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [variant])

  // load roles
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoadingRoles(true)
      try {
        const rows = await fetchRoleTypes()
        if (cancelled) return
        setRoles((rows ?? []).map((r) => ({ code: r.code, name: r.name ?? r.code })))
      } catch (e) {
        console.error('[InviteUserForm.fetchRoleTypes] ERROR', e)
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
    return users.map((u) => ({
      id: u.id,
      email: u.email ?? '',
      displayName: u.display_name ?? '',
      roleCode: (u.role_code ?? '').toString(),
    }))
  }, [users])

  const roleOptions = useMemo(() => roles, [roles])

  return (
    <div className="detail-form">
      <section className="detail-form__section">
        <h3 className="detail-form__section-title">Pozvánka</h3>

        <div className="detail-form__grid detail-form__grid--narrow">
          {variant === 'existingOnly' && (
            <div className="detail-form__field detail-form__field--span-4">
              <div className="detail-form__hint">Pozvánka pro existujícího uživatele – ostatní údaje jsou jen pro informaci.</div>
            </div>
          )}

          {variant === 'standalone' && (
            <>
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
                        <option value="" disabled>
                          {loadingUsers ? 'Načítám…' : '— vyber uživatele —'}
                        </option>
                        {existingOptions.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.displayName || o.email || o.id}
                          </option>
                        ))}
                      </select>
                      <div className="detail-form__hint">Vybranému uživateli se předvyplní email a jméno.</div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          <div className="detail-form__field detail-form__field--span-2">
            <label className="detail-form__label">Email {v.mode === 'new' ? '*' : ''}</label>
            <input
              className={`detail-form__input ${
                v.email && v.mode === 'new' && !emailLooksValid(v.email) ? 'detail-form__input--invalid' : ''
              }`}
              value={v.email ?? ''}
              onChange={(e) => {
                setDirty()
                setV((p) => ({ ...p, email: e.target.value }))
              }}
              placeholder="např. uzivatel@firma.cz"
              readOnly={v.mode === 'existing' || variant === 'existingOnly'}
            />
            {v.mode === 'existing' && <div className="detail-form__hint">Email je převzat z vybraného uživatele.</div>}
          </div>

          <div className="detail-form__field detail-form__field--span-2">
            <label className="detail-form__label">Jméno (volitelné)</label>
            <input
              className="detail-form__input"
              value={v.displayName ?? ''}
              onChange={(e) => {
                setDirty()
                setV((p) => ({ ...p, displayName: e.target.value }))
              }}
              placeholder="např. Jan Novák"
              readOnly={v.mode === 'existing' || variant === 'existingOnly'}
            />
          </div>

          <div className="detail-form__field detail-form__field--span-2">
            <label className="detail-form__label">Role *</label>
            <select
              className="detail-form__input"
              value={v.roleCode ?? ''}
              onChange={(e) => {
                setDirty()
                setV((p) => ({ ...p, roleCode: e.target.value }))
              }}
            >
              <option value="" disabled>
                {loadingRoles ? 'Načítám…' : '— vyber roli —'}
              </option>
              {roleOptions.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="detail-form__field detail-form__field--span-2">
            <label className="detail-form__label">Poznámka (volitelné)</label>
            <input
              className="detail-form__input"
              value={v.note ?? ''}
              onChange={(e) => {
                setDirty()
                setV((p) => ({ ...p, note: e.target.value }))
              }}
              placeholder="např. přístup do modulu XY…"
            />
          </div>
        </div>
      </section>
    </div>
  )
}
