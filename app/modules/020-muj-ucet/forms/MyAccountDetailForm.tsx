// FILE: app/modules/020-muj-ucet/forms/MyAccountDetailForm.tsx
// PURPOSE: Formulář pro Můj účet

'use client'

// =====================
// 1) IMPORTS
// =====================

import React, { useEffect, useMemo, useState } from 'react'
import InputWithHistory from '../../../UI/InputWithHistory'
import AddressAutocomplete from '../../../UI/AddressAutocomplete'

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

  // Adresa
  street?: string | null
  city?: string | null
  zip?: string | null
  houseNumber?: string | null
  country?: string | null
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

  // Adresa
  street: string
  city: string
  zip: string
  houseNumber: string
  country: string
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

      // Adresa
      street: safe((user as any).street),
      city: safe((user as any).city),
      zip: safe((user as any).zip),
      houseNumber: safe((user as any).house_number),
      country: safe((user as any).country) || 'CZ',
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

        {/* Řádek 1: Titul + Jméno (první sloupec, stejná šířka jako email) + Příjmení (druhý sloupec, stejná šířka jako telefon) */}
        <div className="detail-form__grid detail-form__grid--narrow">
          {/* První sloupec: Titul + Jméno vedle sebe */}
          <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: '12px' }}>
            <div className="detail-form__field">
              <label className="detail-form__label">Titul</label>
              <InputWithHistory
                historyId="myAccount.titleBefore"
                className="detail-form__input"
                type="text"
                maxLength={20}
                value={val.titleBefore}
                onChange={(e) => update({ titleBefore: e.target.value })}
              />
            </div>

            <div className="detail-form__field">
              <label className="detail-form__label">
                Jméno <span className="detail-form__required">*</span>
              </label>
              <InputWithHistory
                historyId="myAccount.firstName"
                className="detail-form__input"
                type="text"
                maxLength={50}
                value={val.firstName}
                onChange={(e) => update({ firstName: e.target.value })}
              />
            </div>
          </div>

          {/* Druhý sloupec: Příjmení */}
          <div className="detail-form__field">
            <label className="detail-form__label">
              Příjmení <span className="detail-form__required">*</span>
            </label>
            <InputWithHistory
              historyId="myAccount.lastName"
              className="detail-form__input"
              type="text"
              maxLength={50}
              value={val.lastName}
              onChange={(e) => update({ lastName: e.target.value })}
            />
          </div>
        </div>

        {/* Adresa */}
        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field detail-form__field--span-2">
            <label className="detail-form__label">Adresa (autocomplete)</label>
            {val.country === 'CZ' ? (
              <AddressAutocomplete
                street={val.street}
                city={val.city}
                zip={val.zip}
                houseNumber={val.houseNumber}
                country={val.country}
                onAddressChange={(address) => {
                  update({
                    street: address.street,
                    city: address.city,
                    zip: address.zip,
                    houseNumber: address.houseNumber,
                    country: address.country,
                  })
                }}
                placeholder="Začněte psát adresu (např. 'Praha, Václavské náměstí')"
                className="detail-form__input"
              />
            ) : (
              <div className="detail-form__hint">Autocomplete je dostupný pouze pro Českou republiku</div>
            )}
          </div>
        </div>

        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">Ulice</label>
            <input
              className="detail-form__input"
              type="text"
              maxLength={100}
              value={val.street}
              onChange={(e) => update({ street: e.target.value })}
              placeholder="Název ulice"
            />
          </div>

          <div className="detail-form__field">
            <label className="detail-form__label">Číslo popisné</label>
            <input
              className="detail-form__input"
              type="text"
              maxLength={20}
              value={val.houseNumber}
              onChange={(e) => update({ houseNumber: e.target.value })}
              placeholder="123"
            />
          </div>
        </div>

        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">Město</label>
            <input
              className="detail-form__input"
              type="text"
              maxLength={100}
              value={val.city}
              onChange={(e) => update({ city: e.target.value })}
              placeholder="Název města"
            />
          </div>

          <div className="detail-form__field">
            <label className="detail-form__label">PSČ</label>
            <input
              className="detail-form__input"
              type="text"
              maxLength={10}
              value={val.zip}
              onChange={(e) => update({ zip: e.target.value })}
              placeholder="12345"
            />
          </div>
        </div>

        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">Stát</label>
            <select
              className="detail-form__input"
              value={val.country}
              onChange={(e) => update({ country: e.target.value })}
            >
              <option value="CZ">Česká republika</option>
              <option value="SK">Slovensko</option>
              <option value="PL">Polsko</option>
              <option value="DE">Německo</option>
              <option value="AT">Rakousko</option>
            </select>
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
            <InputWithHistory
              historyId="myAccount.displayName"
              className="detail-form__input"
              type="text"
              maxLength={80}
              value={val.displayName}
              onChange={(e) => update({ displayName: e.target.value })}
              placeholder="volitelné"
            />
          </div>

          <div className="detail-form__field">
            <label className="detail-form__label">Přihlašovací jméno</label>
            <input
              className="detail-form__input"
              type="text"
              maxLength={80}
              value={val.login}
              onChange={(e) => update({ login: e.target.value })}
              placeholder="volitelné (používá se email, pokud není vyplněno)"
            />
          </div>
        </div>

        {/* Řádek 2: Email + Telefon */}
        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">
              E-mail <span className="detail-form__required">*</span>
            </label>
            <InputWithHistory
              historyId="myAccount.email"
              className="detail-form__input"
              type="email"
              maxLength={80}
              value={val.email}
              onChange={(e) => update({ email: e.target.value })}
            />
          </div>

          <div className="detail-form__field">
            <label className="detail-form__label">
              Telefon {val.twoFactorMethod === 'phone' && <span className="detail-form__required">*</span>}
            </label>
            <InputWithHistory
              historyId="myAccount.phone"
              className="detail-form__input"
              type="tel"
              maxLength={20}
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
              <option value="phone">SMS</option>
              <option value="totp">Aplikace (potvrzení na mobilu)</option>
            </select>
            {val.twoFactorMethod === 'phone' && (
              <div className="detail-form__hint">Telefon je povinný, pokud je vybráno ověření SMS</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

