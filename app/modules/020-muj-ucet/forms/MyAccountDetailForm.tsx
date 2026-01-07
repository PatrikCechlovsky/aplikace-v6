// FILE: app/modules/020-muj-ucet/forms/MyAccountDetailForm.tsx
// PURPOSE: Formulář pro Můj účet

'use client'

// =====================
// 1) IMPORTS
// =====================

import React, { useEffect, useMemo, useState } from 'react'

// =====================
// 2) TYPES
// =====================

type UiUser = {
  id: string
  displayName: string
  email: string
  phone?: string
  twoFactorMethod?: string | null

  titleBefore?: string | null
  firstName?: string | null
  lastName?: string | null
  login?: string | null
}

export type MyAccountFormValue = {
  displayName: string
  email: string
  phone: string

  titleBefore: string
  firstName: string
  lastName: string
  login: string

  twoFactorMethod: string
}

export type MyAccountDetailFormProps = {
  user: UiUser
  onDirtyChange?: (dirty: boolean) => void
  onValueChange?: (val: MyAccountFormValue) => void
}

// =====================
// 3) HELPERS
// =====================

function safe(v: any) {
  return (v ?? '').toString()
}

// =====================
// 4) COMPONENT
// =====================

export default function MyAccountDetailForm({ user, onDirtyChange, onValueChange }: MyAccountDetailFormProps) {
  const initial = useMemo<MyAccountFormValue>(
    () => ({
      displayName: safe(user.displayName),
      email: safe(user.email),
      phone: safe(user.phone),

      titleBefore: safe((user as any).titleBefore),
      firstName: safe((user as any).firstName),
      lastName: safe((user as any).lastName),
      login: safe((user as any).login),

      twoFactorMethod: safe(user.twoFactorMethod),
    }),
    [user]
  )

  const [val, setVal] = useState<MyAccountFormValue>(initial)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    setVal(initial)
    setDirty(false)
    onDirtyChange?.(false)
    onValueChange?.(initial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial])

  // =====================
  // 5) ACTION HANDLERS
  // =====================

  const update = (patch: Partial<MyAccountFormValue>) => {
    setVal((prev) => {
      const next = { ...prev, ...patch }

      if (!dirty) {
        setDirty(true)
        onDirtyChange?.(true)
      }

      onValueChange?.(next)
      return next
    })
  }

  // =====================
  // 6) RENDER
  // =====================

  return (
    <div className="detail-form">
      {/* OSOBNÍ ÚDAJE */}
      <div className="detail-form__section">
        <div className="detail-form__section-title">Osobní údaje</div>

        {/* Řádek 1: Titul + Jméno + Příjmení (3 sloupce) */}
        <div className="detail-form__grid" style={{ gridTemplateColumns: '120px 280px 280px' }}>
          <div className="detail-form__field">
            <label className="detail-form__label">Titul před</label>
            <input
              className="detail-form__input"
              type="text"
              maxLength={20}
              size={15}
              value={val.titleBefore}
              onChange={(e) => update({ titleBefore: e.target.value })}
            />
          </div>

          <div className="detail-form__field">
            <label className="detail-form__label">Jméno</label>
            <input
              className="detail-form__input"
              type="text"
              maxLength={50}
              size={30}
              value={val.firstName}
              onChange={(e) => update({ firstName: e.target.value })}
            />
          </div>

          <div className="detail-form__field">
            <label className="detail-form__label">Příjmení</label>
            <input
              className="detail-form__input"
              type="text"
              maxLength={50}
              size={30}
              value={val.lastName}
              onChange={(e) => update({ lastName: e.target.value })}
            />
          </div>
        </div>

        {/* TODO: Adresa s autocomplete - bude implementováno později */}
        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field detail-form__field--span-2">
            <label className="detail-form__label">Adresa</label>
            <input
              className="detail-form__input"
              type="text"
              placeholder="Adresa bude implementována s autocomplete"
              disabled
            />
            <div className="detail-form__hint">Autocomplete pro adresu bude implementován později</div>
          </div>
        </div>
      </div>

      {/* PŘIHLAŠOVACÍ ÚDAJE */}
      <div className="detail-form__section">
        <div className="detail-form__section-title">Přihlašovací údaje</div>

        {/* Řádek 1: Zobrazované jméno + Přihlašovací jméno */}
        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">Zobrazované jméno / přezdívka</label>
            <input
              className="detail-form__input"
              type="text"
              maxLength={80}
              size={50}
              style={{ width: '50ch', maxWidth: '80ch' }}
              value={val.displayName}
              onChange={(e) => update({ displayName: e.target.value })}
              placeholder="volitelné"
            />
          </div>

          {val.login && (
            <div className="detail-form__field">
              <label className="detail-form__label">Přihlašovací jméno</label>
              <input
                className="detail-form__input"
                type="text"
                maxLength={80}
                size={50}
                style={{ width: '50ch', maxWidth: '80ch' }}
                value={val.login}
                onChange={(e) => update({ login: e.target.value })}
                placeholder="volitelné"
              />
            </div>
          )}
        </div>

        {/* Řádek 2: Email + Telefon */}
        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">
              E-mail <span className="detail-form__required">*</span>
            </label>
            <input
              className="detail-form__input"
              type="email"
              maxLength={80}
              size={50}
              style={{ width: '50ch', maxWidth: '80ch' }}
              value={val.email}
              onChange={(e) => update({ email: e.target.value })}
            />
          </div>

          <div className="detail-form__field">
            <label className="detail-form__label">
              Telefon {val.twoFactorMethod === 'phone' && <span className="detail-form__required">*</span>}
            </label>
            <input
              className="detail-form__input"
              type="tel"
              maxLength={20}
              size={50}
              style={{ width: '50ch', maxWidth: '80ch' }}
              value={val.phone}
              onChange={(e) => update({ phone: e.target.value })}
              placeholder="+420 999 874 564"
            />
          </div>
        </div>

        {/* Řádek 3: Ověření (2FA) */}
        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">Ověření</label>
            <select
              className="detail-form__input"
              value={val.twoFactorMethod}
              onChange={(e) => update({ twoFactorMethod: e.target.value })}
            >
              <option value="">Žádné</option>
              <option value="email">E-mail</option>
              <option value="phone">Telefon</option>
              <option value="totp">Aplikace (TOTP)</option>
            </select>
            {val.twoFactorMethod === 'phone' && (
              <div className="detail-form__hint">Telefon je povinný, pokud je vybráno ověření telefonem</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

