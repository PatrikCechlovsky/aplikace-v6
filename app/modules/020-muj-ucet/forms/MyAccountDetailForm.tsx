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

  // Personal identification
  birthDate: string // DATE as ISO string (YYYY-MM-DD)
  personalIdNumber: string // Rodné číslo
  idDocType: string // Typ dokladu: 'OP', 'PAS', 'RP', 'OTHER'
  idDocNumber: string // Číslo dokladu

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

export type MyAccountDetailFormRef = {
  validateForm: () => boolean
}

// =====================
// 3) HELPERS
// =====================

function safe(v: any) {
  return (v ?? '').toString()
}

// Validační funkce
function validatePersonalIdNumber(value: string): string | null {
  if (!value) return null
  const cleaned = value.replace(/\s+/g, '').replace('/', '')
  if (!/^\d{9,10}$/.test(cleaned)) {
    return 'Rodné číslo musí mít formát YYMMDD/XXXX (9-10 číslic)'
  }
  if (cleaned.length === 10) {
    const num = parseInt(cleaned, 10)
    if (num % 11 !== 0) {
      return 'Neplatné rodné číslo (kontrolní součet)'
    }
  }
  return null
}

function validateZip(value: string): string | null {
  if (!value) return 'PSČ je povinné'
  const cleaned = value.replace(/\s+/g, '')
  if (!/^\d{5}$/.test(cleaned)) {
    return 'PSČ musí mít 5 číslic'
  }
  return null
}

function validatePhone(value: string): string | null {
  if (!value) return null
  const cleaned = value.replace(/\s+/g, '').replace(/[-()+]/g, '')
  if (!/^\d{9,15}$/.test(cleaned)) {
    return 'Telefon musí mít 9-15 číslic (mezinárodní formát)'
  }
  return null
}

function validateEmail(value: string): string | null {
  if (!value) return 'E-mail je povinný'
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(value)) {
    return 'Neplatný formát e-mailu'
  }
  return null
}

// =====================
// 4) COMPONENT
// =====================

const MyAccountDetailForm = React.forwardRef<MyAccountDetailFormRef, MyAccountDetailFormProps>(
  function MyAccountDetailForm({ user, onDirtyChange, onValueChange }, ref) {
  const initial = useMemo<MyAccountFormValue>(
    () => ({
      displayName: safe(user.displayName),
      email: safe(user.email),
      phone: safe(user.phone),

      titleBefore: safe((user as any).titleBefore),
      firstName: safe((user as any).firstName),
      lastName: safe((user as any).lastName),
      login: safe((user as any).login),

      // Personal identification
      birthDate: safe((user as any).birthDate),
      personalIdNumber: safe((user as any).personalIdNumber),
      idDocType: safe((user as any).idDocType),
      idDocNumber: safe((user as any).idDocNumber),

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
  const [errors, setErrors] = useState<Record<string, string>>({})

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

  // Validace celého formuláře před uložením
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Email - povinný
    const emailError = validateEmail(val.email)
    if (emailError) {
      newErrors.email = emailError
    }

    // Adresa - povinná pole
    if (!val.street?.trim()) {
      newErrors.street = 'Ulice je povinná'
    }
    if (!val.houseNumber?.trim()) {
      newErrors.houseNumber = 'Číslo popisné je povinné'
    }
    if (!val.city?.trim()) {
      newErrors.city = 'Město je povinné'
    }
    const zipError = validateZip(val.zip)
    if (zipError) {
      newErrors.zip = zipError
    }

    // Telefon - povinný pro uživatele
    if (!val.phone) {
      newErrors.phone = 'Telefon je povinný'
    } else {
      const phoneError = validatePhone(val.phone)
      if (phoneError) {
        newErrors.phone = phoneError
      }
    }

    // Rodné číslo - povinné pro uživatele
    if (!val.personalIdNumber) {
      newErrors.personalIdNumber = 'Rodné číslo je povinné'
    } else {
      const personalIdError = validatePersonalIdNumber(val.personalIdNumber)
      if (personalIdError) {
        newErrors.personalIdNumber = personalIdError
      }
    }

    // Datum narození - povinné pro uživatele
    if (!val.birthDate) {
      newErrors.birthDate = 'Datum narození je povinné'
    }

    // Typ dokladu a číslo dokladu - povinné pro uživatele
    if (!val.idDocType) {
      newErrors.idDocType = 'Typ dokladu je povinný'
    }
    if (!val.idDocNumber?.trim()) {
      newErrors.idDocNumber = 'Číslo dokladu je povinné'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Expose validateForm to parent via ref
  React.useImperativeHandle(ref, () => ({
    validateForm,
  }))

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
            <label className="detail-form__label">
              Ulice <span className="detail-form__required">*</span>
            </label>
            <input
              className="detail-form__input"
              type="text"
              maxLength={100}
              value={val.street}
              onChange={(e) => update({ street: e.target.value })}
              onBlur={(e) => {
                if (!e.target.value.trim()) {
                  setErrors((prev) => ({ ...prev, street: 'Ulice je povinná' }))
                } else {
                  setErrors((prev) => {
                    const next = { ...prev }
                    delete next.street
                    return next
                  })
                }
              }}
              placeholder="Název ulice"
            />
            {errors.street && (
              <div className="detail-form__error">{errors.street}</div>
            )}
          </div>

          <div className="detail-form__field">
            <label className="detail-form__label">
              Číslo popisné <span className="detail-form__required">*</span>
            </label>
            <input
              className="detail-form__input"
              type="text"
              maxLength={20}
              value={val.houseNumber}
              onChange={(e) => update({ houseNumber: e.target.value })}
              onBlur={(e) => {
                if (!e.target.value.trim()) {
                  setErrors((prev) => ({ ...prev, houseNumber: 'Číslo popisné je povinné' }))
                } else {
                  setErrors((prev) => {
                    const next = { ...prev }
                    delete next.houseNumber
                    return next
                  })
                }
              }}
              placeholder="123"
            />
            {errors.houseNumber && (
              <div className="detail-form__error">{errors.houseNumber}</div>
            )}
          </div>
        </div>

        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">
              Město <span className="detail-form__required">*</span>
            </label>
            <input
              className="detail-form__input"
              type="text"
              maxLength={100}
              value={val.city}
              onChange={(e) => update({ city: e.target.value })}
              onBlur={(e) => {
                if (!e.target.value.trim()) {
                  setErrors((prev) => ({ ...prev, city: 'Město je povinné' }))
                } else {
                  setErrors((prev) => {
                    const next = { ...prev }
                    delete next.city
                    return next
                  })
                }
              }}
              placeholder="Název města"
            />
            {errors.city && (
              <div className="detail-form__error">{errors.city}</div>
            )}
          </div>

          <div className="detail-form__field">
            <label className="detail-form__label">
              PSČ <span className="detail-form__required">*</span>
            </label>
            <input
              className="detail-form__input"
              type="text"
              maxLength={10}
              value={val.zip}
              onChange={(e) => update({ zip: e.target.value })}
              onBlur={(e) => {
                const error = validateZip(e.target.value)
                setErrors((prev) => {
                  const next = { ...prev }
                  if (error) {
                    next.zip = error
                  } else {
                    delete next.zip
                  }
                  return next
                })
              }}
              placeholder="12345"
            />
            {errors.zip && (
              <div className="detail-form__error">{errors.zip}</div>
            )}
          </div>
        </div>

        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">
              Stát <span className="detail-form__required">*</span>
            </label>
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

        {/* Řádek za Stát: Datum narození + Rodné číslo */}
        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">
              Datum narození <span className="detail-form__required">*</span>
            </label>
            <input
              className="detail-form__input"
              type="date"
              value={val.birthDate || ''}
              onChange={(e) => update({ birthDate: e.target.value })}
              onBlur={(e) => {
                if (!e.target.value) {
                  setErrors((prev) => ({ ...prev, birthDate: 'Datum narození je povinné' }))
                } else {
                  setErrors((prev) => {
                    const next = { ...prev }
                    delete next.birthDate
                    return next
                  })
                }
              }}
            />
            {errors.birthDate && (
              <div className="detail-form__error">{errors.birthDate}</div>
            )}
          </div>

          <div className="detail-form__field">
            <label className="detail-form__label">
              Rodné číslo <span className="detail-form__required">*</span>
            </label>
            <input
              className="detail-form__input"
              type="text"
              maxLength={11}
              value={val.personalIdNumber}
              onChange={(e) => update({ personalIdNumber: e.target.value })}
              onBlur={(e) => {
                if (!e.target.value) {
                  setErrors((prev) => ({ ...prev, personalIdNumber: 'Rodné číslo je povinné' }))
                } else {
                  const error = validatePersonalIdNumber(e.target.value)
                  setErrors((prev) => {
                    const next = { ...prev }
                    if (error) {
                      next.personalIdNumber = error
                    } else {
                      delete next.personalIdNumber
                    }
                    return next
                  })
                }
              }}
              placeholder="YYMMDD/XXXX nebo YYMMDDXXXX"
            />
            {errors.personalIdNumber && (
              <div className="detail-form__error">{errors.personalIdNumber}</div>
            )}
          </div>
        </div>

        {/* Další řádek: Druh dokladu + Číslo dokladu */}
        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">
              Druh dokladu <span className="detail-form__required">*</span>
            </label>
            <select
              className="detail-form__input"
              value={val.idDocType || ''}
              onChange={(e) => update({ idDocType: e.target.value })}
              onBlur={(e) => {
                if (!e.target.value) {
                  setErrors((prev) => ({ ...prev, idDocType: 'Typ dokladu je povinný' }))
                } else {
                  setErrors((prev) => {
                    const next = { ...prev }
                    delete next.idDocType
                    return next
                  })
                }
              }}
            >
              <option value="">— vyber doklad —</option>
              <option value="OP">Občanský průkaz</option>
              <option value="PAS">Pas</option>
              <option value="RP">Řidičský průkaz</option>
              <option value="OTHER">Jiný</option>
            </select>
            {errors.idDocType && (
              <div className="detail-form__error">{errors.idDocType}</div>
            )}
          </div>

          <div className="detail-form__field">
            <label className="detail-form__label">
              Číslo dokladu <span className="detail-form__required">*</span>
            </label>
            <input
              className="detail-form__input"
              type="text"
              maxLength={50}
              value={val.idDocNumber}
              onChange={(e) => update({ idDocNumber: e.target.value })}
              onBlur={(e) => {
                if (!e.target.value.trim()) {
                  setErrors((prev) => ({ ...prev, idDocNumber: 'Číslo dokladu je povinné' }))
                } else {
                  setErrors((prev) => {
                    const next = { ...prev }
                    delete next.idDocNumber
                    return next
                  })
                }
              }}
              placeholder="Číslo dokladu"
            />
            {errors.idDocNumber && (
              <div className="detail-form__error">{errors.idDocNumber}</div>
            )}
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
            <label className="detail-form__label">
              Přihlašovací jméno nebo email <span className="detail-form__required">*</span>
            </label>
            <input
              className="detail-form__input"
              type="text"
              maxLength={80}
              value={val.login}
              onChange={(e) => update({ login: e.target.value })}
              placeholder="povinné (jméno nebo email)"
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
              onBlur={(e) => {
                const error = validateEmail(e.target.value)
                setErrors((prev) => {
                  const next = { ...prev }
                  if (error) {
                    next.email = error
                  } else {
                    delete next.email
                  }
                  return next
                })
              }}
            />
            {errors.email && (
              <div className="detail-form__error">{errors.email}</div>
            )}
          </div>

          <div className="detail-form__field">
            <label className="detail-form__label">
              Telefon <span className="detail-form__required">*</span>
              {val.twoFactorMethod === 'phone' && <span style={{marginLeft: '4px'}}>(povinný pro SMS ověření)</span>}
            </label>
            <InputWithHistory
              historyId="myAccount.phone"
              className="detail-form__input"
              type="tel"
              maxLength={20}
              value={val.phone}
              onChange={(e) => update({ phone: e.target.value })}
              onBlur={(e) => {
                if (!e.target.value) {
                  setErrors((prev) => ({ ...prev, phone: 'Telefon je povinný' }))
                } else {
                  const error = validatePhone(e.target.value)
                  setErrors((prev) => {
                    const next = { ...prev }
                    if (error) {
                      next.phone = error
                    } else {
                      delete next.phone
                    }
                    return next
                  })
                }
              }}
              placeholder="+420 999 874 564"
            />
            {errors.phone && (
              <div className="detail-form__error">{errors.phone}</div>
            )}
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
})

export default MyAccountDetailForm

