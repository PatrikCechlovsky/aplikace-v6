'use client'

// FILE: app/modules/030-pronajimatel/forms/LandlordDetailForm.tsx
// PURPOSE: Formulář pronajimatele podle typu subjektu (030)
// Struktura stejná jako "Můj účet", ale bez přihlašovacích údajů
// Sekce: Osobní údaje -> Adresa -> Základní údaje (email, telefon)

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import InputWithHistory from '@/app/UI/InputWithHistory'
import AddressAutocomplete from '@/app/UI/AddressAutocomplete'
import { useToast } from '@/app/UI/Toast'

// =====================
// 1) TYPES
// =====================

export type LandlordFormValue = {
  // Person fields (osoba, osvc, zastupce)
  titleBefore: string
  firstName: string
  lastName: string
  birthDate: string
  personalIdNumber: string
  idDocType: string
  idDocNumber: string

  // Adresa (všechny typy)
  street: string
  city: string
  zip: string
  houseNumber: string
  country: string

  // Základní údaje / Kontakty (všechny typy) - BEZ přihlašovacích údajů
  displayName: string
  email: string
  phone: string

  // Company fields (firma, spolek, statni)
  companyName: string
  ic: string
  dic: string
  icValid: boolean
  dicValid: boolean
  delegateIds: string[] // Pole ID zástupců (N:N vztah)

  // Role flags
  isUser: boolean
  isLandlord: boolean
  isLandlordDelegate: boolean
  isTenant: boolean
  isTenantDelegate: boolean
  isMaintenance: boolean
  isMaintenanceDelegate: boolean

  // Poznámka
  note: string
  isArchived: boolean
}

export type LandlordDetailFormProps = {
  subjectType: string // 'osoba' | 'osvc' | 'firma' | 'spolek' | 'statni' | 'zastupce'
  landlord: Partial<LandlordFormValue>
  readOnly: boolean
  onDirtyChange?: (dirty: boolean) => void
  onValueChange?: (val: LandlordFormValue) => void
}

export type LandlordDetailFormRef = {
  validateForm: () => boolean
}

// =====================
// 2) HELPERS
// =====================

function safe(v: any): string {
  return (v ?? '').toString()
}

function isPersonType(type: string): boolean {
  return type === 'osoba' || type === 'osvc' || type === 'zastupce'
}

function isCompanyType(type: string): boolean {
  return type === 'firma' || type === 'spolek' || type === 'statni'
}

// =====================
// 3) VALIDACE
// =====================

// Validace rodného čísla (formát: YYMMDD/XXXX nebo YYMMDDXXXX)
function validatePersonalIdNumber(value: string): string | null {
  if (!value) return null
  
  const cleaned = value.replace(/\s+/g, '').replace('/', '')
  
  // Musí být 9 nebo 10 číslic
  if (!/^\d{9,10}$/.test(cleaned)) {
    return 'Rodné číslo musí mít formát YYMMDD/XXXX (9-10 číslic)'
  }
  
  // Kontrola dělitelnosti 11 (platí pro RČ vydané po 1953)
  if (cleaned.length === 10) {
    const num = parseInt(cleaned, 10)
    if (num % 11 !== 0) {
      return 'Neplatné rodné číslo (kontrolní součet)'
    }
  }
  
  return null
}

// Validace PSČ (formát: XXXXX nebo XXX XX)
function validateZip(value: string): string | null {
  if (!value) return 'PSČ je povinné'
  
  const cleaned = value.replace(/\s+/g, '')
  
  if (!/^\d{5}$/.test(cleaned)) {
    return 'PSČ musí mít 5 číslic (např. 120 00 nebo 12000)'
  }
  
  return null
}

// Validace telefonu (mezinárodní formát)
function validatePhone(value: string): string | null {
  if (!value) return null
  
  const cleaned = value.replace(/[\s()-]/g, '')
  
  if (!/^\+?[0-9]{9,15}$/.test(cleaned)) {
    return 'Telefon musí mít 9-15 číslic (např. +420 123 456 789)'
  }
  
  return null
}

// Validace emailu
function validateEmail(value: string): string | null {
  if (!value) return 'Email je povinný'
  
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return 'Neplatný formát emailu'
  }
  
  return null
}

// =====================
// 3) COMPONENT
// =====================

const LandlordDetailForm = React.forwardRef<LandlordDetailFormRef, LandlordDetailFormProps>(
  function LandlordDetailForm(props, ref) {
  const { subjectType, landlord, readOnly = false, onDirtyChange, onValueChange } = props
  const isPerson = isPersonType(subjectType)
  const isCompany = isCompanyType(subjectType)

  const initial = useMemo<LandlordFormValue>(
    () => ({
      // Person fields
      titleBefore: safe(landlord.titleBefore),
      firstName: safe(landlord.firstName),
      lastName: safe(landlord.lastName),
      birthDate: safe(landlord.birthDate),
      personalIdNumber: safe(landlord.personalIdNumber),
      idDocType: safe(landlord.idDocType),
      idDocNumber: safe(landlord.idDocNumber),

      // Adresa
      street: safe(landlord.street),
      city: safe(landlord.city),
      zip: safe(landlord.zip),
      houseNumber: safe(landlord.houseNumber),
      country: safe(landlord.country || 'CZ'),

      // Základní údaje
      displayName: safe(landlord.displayName),
      email: safe(landlord.email),
      phone: safe(landlord.phone),

      // Company fields
      companyName: safe(landlord.companyName),
      ic: safe(landlord.ic),
      dic: safe(landlord.dic),
      icValid: !!landlord.icValid,
      dicValid: !!landlord.dicValid,
      delegateIds: Array.isArray(landlord.delegateIds) ? landlord.delegateIds : [],

      // Role flags
      isUser: !!landlord.isUser,
      isLandlord: landlord.isLandlord !== undefined ? !!landlord.isLandlord : true, // Default true protože editujeme pronajimatele
      isLandlordDelegate: !!landlord.isLandlordDelegate,
      isTenant: !!landlord.isTenant,
      isTenantDelegate: !!landlord.isTenantDelegate,
      isMaintenance: !!landlord.isMaintenance,
      isMaintenanceDelegate: !!landlord.isMaintenanceDelegate,

      // Poznámka
      note: safe(landlord.note),
      isArchived: !!landlord.isArchived,
    }),
    [landlord]
  )

  const [val, setVal] = useState<LandlordFormValue>(initial)
  const dirtyRef = useRef(false) // Ref pro okamžitou kontrolu
  const [loadingAres, setLoadingAres] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const toast = useToast()

  // Když se změní landlord, přepiš form
  useEffect(() => {
    console.log('[LandlordDetailForm] useEffect triggered, initial changed. dirty:', dirtyRef.current)
    // Pokud je formulář dirty, neresetuj ho - uživatel právě edituje
    if (dirtyRef.current) {
      console.log('[LandlordDetailForm] Skipping reset because form is dirty')
      return
    }
    // Vytvořit nový objekt, ne jen referenci
    console.log('[LandlordDetailForm] Resetting form to initial values:', initial)
    const newVal = { ...initial }
    setVal(newVal)
    dirtyRef.current = false
    onDirtyChange?.(false)
    // Nevolat onValueChange zde - to způsobuje problémy s synchronizací
    // onValueChange se volá jen když uživatel skutečně změní hodnotu přes update()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial])

  const update = (patch: Partial<LandlordFormValue>) => {
    console.log('[LandlordDetailForm] update() called with:', patch)
    setVal((prev) => {
      const next = { ...prev, ...patch }
      console.log('[LandlordDetailForm] New form value:', next)

      if (!dirtyRef.current) {
        console.log('[LandlordDetailForm] Setting dirty to true')
        dirtyRef.current = true
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

    // Pro osoby (osoba, osvc, zastupce) - povinná pole
    if (isPerson) {
      // Telefon - povinný pro osoby
      if (!val.phone) {
        newErrors.phone = 'Telefon je povinný'
      } else {
        const phoneError = validatePhone(val.phone)
        if (phoneError) {
          newErrors.phone = phoneError
        }
      }

      // Rodné číslo - povinné pro osoby
      if (!val.personalIdNumber) {
        newErrors.personalIdNumber = 'Rodné číslo je povinné'
      } else {
        const personalIdError = validatePersonalIdNumber(val.personalIdNumber)
        if (personalIdError) {
          newErrors.personalIdNumber = personalIdError
        }
      }

      // Datum narození - povinné pro osoby
      if (!val.birthDate) {
        newErrors.birthDate = 'Datum narození je povinné'
      }

      // Typ dokladu a číslo dokladu - povinné pro osoby
      if (!val.idDocType) {
        newErrors.idDocType = 'Typ dokladu je povinný'
      }
      if (!val.idDocNumber?.trim()) {
        newErrors.idDocNumber = 'Číslo dokladu je povinné'
      }
    } else {
      // Pro firmy - telefon volitelný, ale pokud je vyplněný, musí být validní
      if (val.phone) {
        const phoneError = validatePhone(val.phone)
        if (phoneError) {
          newErrors.phone = phoneError
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Expose validateForm to parent via ref
  React.useImperativeHandle(ref, () => ({
    validateForm,
  }))

  // Načíst data z ARES podle IČO
  const handleLoadFromAres = useCallback(async () => {
    const currentIc = val.ic.trim()
    if (!currentIc) {
      toast.showWarning('Nejdřív zadejte IČO')
      return
    }

    // Validace IČO (8 číslic)
    if (!/^\d{8}$/.test(currentIc.replace(/\s+/g, ''))) {
      toast.showWarning('IČO musí obsahovat 8 číslic')
      return
    }

    try {
      setLoadingAres(true)
      const response = await fetch(`/api/ares?ico=${encodeURIComponent(currentIc)}`)
      const data = await response.json()

      console.log('[Frontend] ARES API response:', data)
      console.log('[Frontend] Response OK:', response.ok)

      if (!response.ok) {
        throw new Error(data.error || 'Nepodařilo se načíst data z ARES')
      }

      // Předvyplnit formulář daty z ARES přímo
      console.log('[Frontend] Updating form with ARES data')
      
      // Použít funkční update aby se použil aktuální stav
      setVal((currentVal) => {
        console.log('[Frontend] Current val before update:', currentVal)
        
        const updatedVal = {
          ...currentVal,
          companyName: data.companyName || currentVal.companyName,
          ic: data.ic || currentVal.ic,
          dic: data.dic || currentVal.dic,
          icValid: data.icValid ?? currentVal.icValid,
          dicValid: data.dicValid ?? currentVal.dicValid,
          street: data.street || currentVal.street,
          houseNumber: data.houseNumber || currentVal.houseNumber,
          city: data.city || currentVal.city,
          zip: data.zip || currentVal.zip,
          country: data.country || currentVal.country,
        }
        
        console.log('[Frontend] Updated val - companyName:', updatedVal.companyName, 'ic:', updatedVal.ic, 'city:', updatedVal.city, 'email:', updatedVal.email)
        
        // Nastavit dirty a propagovat změnu
        if (!dirtyRef.current) {
          dirtyRef.current = true
          onDirtyChange?.(true)
        }
        onValueChange?.(updatedVal)
        
        return updatedVal
      })
      
      toast.showSuccess('Data z ARES byla úspěšně načtena')
    } catch (error: any) {
      console.error('ARES load failed:', error)
      toast.showError(error.message || 'Nepodařilo se načíst data z ARES')
    } finally {
      setLoadingAres(false)
    }
  }, [val.ic, toast, onDirtyChange, onValueChange])


  return (
    <div className="detail-form">
      {/* OSOBNÍ ÚDAJE (pro osoba, osvc, zastupce) */}
      {isPerson && (
        <div className="detail-form__section">
          <div className="detail-form__section-title">Osobní údaje</div>

          {/* Řádek 1: Titul + Jméno + Příjmení */}
          <div className="detail-form__grid detail-form__grid--narrow">
            <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: '12px' }}>
              <div className="detail-form__field">
                <label className="detail-form__label">Titul</label>
                <InputWithHistory
                  historyId="landlord.titleBefore"
                  className="detail-form__input"
                  type="text"
                  maxLength={20}
                  value={val.titleBefore}
                  readOnly={readOnly}
                  onChange={(e) => update({ titleBefore: e.target.value })}
                />
              </div>

              <div className="detail-form__field">
                <label className="detail-form__label">
                  Jméno <span className="detail-form__required">*</span>
                </label>
                <InputWithHistory
                  historyId="landlord.firstName"
                  className="detail-form__input"
                  type="text"
                  maxLength={50}
                  value={val.firstName}
                  readOnly={readOnly}
                  onChange={(e) => update({ firstName: e.target.value })}
                />
              </div>
            </div>

            <div className="detail-form__field">
              <label className="detail-form__label">
                Příjmení <span className="detail-form__required">*</span>
              </label>
              <InputWithHistory
                historyId="landlord.lastName"
                className="detail-form__input"
                type="text"
                maxLength={50}
                value={val.lastName}
                readOnly={readOnly}
                onChange={(e) => update({ lastName: e.target.value })}
              />
            </div>
          </div>

          {/* Řádek 2: Datum narození + Rodné číslo */}
          <div className="detail-form__grid detail-form__grid--narrow">
            <div className="detail-form__field">
              <label className="detail-form__label">
                Datum narození {isPerson && <span className="detail-form__required">*</span>}
              </label>
              <input
                className="detail-form__input"
                type="date"
                value={val.birthDate || ''}
                readOnly={readOnly}
                onChange={(e) => update({ birthDate: e.target.value })}
                onBlur={(e) => {
                  if (isPerson && !e.target.value) {
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
                Rodné číslo {isPerson && <span className="detail-form__required">*</span>}
              </label>
              <input
                className="detail-form__input"
                type="text"
                maxLength={11}
                value={val.personalIdNumber}
                readOnly={readOnly}
                onChange={(e) => update({ personalIdNumber: e.target.value })}
                onBlur={(e) => {
                  if (isPerson && !e.target.value) {
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

          {/* Řádek 3: Druh dokladu + Číslo dokladu */}
          <div className="detail-form__grid detail-form__grid--narrow">
            <div className="detail-form__field">
              <label className="detail-form__label">
                Druh dokladu {isPerson && <span className="detail-form__required">*</span>}
              </label>
              {readOnly ? (
                <input
                  className="detail-form__input detail-form__input--readonly"
                  type="text"
                  value={
                    val.idDocType === 'OP'
                      ? 'Občanský průkaz'
                      : val.idDocType === 'PAS'
                        ? 'Pas'
                        : val.idDocType === 'RP'
                          ? 'Řidičský průkaz'
                          : val.idDocType === 'OTHER'
                            ? 'Jiný'
                            : val.idDocType || '—'
                  }
                  readOnly
                />
              ) : (
                <select
                  className="detail-form__input"
                  value={val.idDocType || ''}
                  onChange={(e) => update({ idDocType: e.target.value })}
                >
                  <option value="">— vyber doklad —</option>
                  <option value="OP">Občanský průkaz</option>
                  <option value="PAS">Pas</option>
                  <option value="RP">Řidičský průkaz</option>
                  <option value="OTHER">Jiný</option>
                </select>
              )}
            </div>

            <div className="detail-form__field">
              <label className="detail-form__label">
                Číslo dokladu {isPerson && <span className="detail-form__required">*</span>}
              </label>
              <input
                className="detail-form__input"
                type="text"
                maxLength={50}
                value={val.idDocNumber}
                readOnly={readOnly}
                onChange={(e) => update({ idDocNumber: e.target.value })}
                onBlur={(e) => {
                  if (isPerson && !e.target.value.trim()) {
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
      )}

      {/* FIREMNÍ ÚDAJE (pro firma, spolek, statni) */}
      {isCompany && (
        <div className="detail-form__section">
          <div className="detail-form__section-title">Firemní údaje</div>

          {/* Název společnosti */}
          <div className="detail-form__grid detail-form__grid--narrow">
            <div className="detail-form__field detail-form__field--span-2">
              <label className="detail-form__label">
                Název společnosti <span className="detail-form__required">*</span>
              </label>
              <InputWithHistory
                historyId="landlord.companyName"
                className="detail-form__input"
                type="text"
                maxLength={200}
                value={val.companyName}
                readOnly={readOnly}
                onChange={(e) => update({ companyName: e.target.value })}
              />
            </div>
          </div>

          {/* IČ + DIČ */}
          <div className="detail-form__grid detail-form__grid--narrow">
            <div className="detail-form__field">
              <label className="detail-form__label">
                IČ <span className="detail-form__required">*</span>
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <InputWithHistory
                  historyId="landlord.ic"
                  className="detail-form__input"
                  type="text"
                  maxLength={20}
                  value={val.ic}
                  readOnly={readOnly}
                  onChange={(e) => update({ ic: e.target.value })}
                  placeholder="12345678"
                />
                {!readOnly && (
                  <button
                    type="button"
                    className="detail-form__button"
                    title="Načíst z ARES"
                    onClick={handleLoadFromAres}
                    disabled={loadingAres || !val.ic.trim()}
                  >
                    {loadingAres ? 'Načítám...' : 'ARES'}
                  </button>
                )}
              </div>
              {val.icValid && (
                <span style={{ fontSize: '0.875rem', color: 'var(--color-success)' }}>✓ IČ ověřeno</span>
              )}
            </div>

            <div className="detail-form__field">
              <label className="detail-form__label">DIČ</label>
              <InputWithHistory
                historyId="landlord.dic"
                className="detail-form__input"
                type="text"
                maxLength={20}
                value={val.dic}
                readOnly={readOnly}
                onChange={(e) => update({ dic: e.target.value })}
                placeholder="CZ12345678"
              />
              {val.dicValid && (
                <span style={{ fontSize: '0.875rem', color: 'var(--color-success)' }}>✓ DIČ ověřeno</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADRESA (samostatná sekce mezi osobními a základními údaji) */}
      <div className="detail-form__section">
        <div className="detail-form__section-title">Adresa</div>

        {/* Režim ČTENÍ: Jen kompletní adresa včetně státu */}
        {readOnly && (
          <div className="detail-form__grid detail-form__grid--narrow">
            <div className="detail-form__field detail-form__field--span-2">
              <div className="detail-form__value">
                {(() => {
                  // Formát: "Ulice ČísloPopisné, PSČ Město, Stát"
                  const streetPart = [val.street, val.houseNumber].filter(Boolean).join(' ')
                  const cityPart = [val.zip, val.city].filter(Boolean).join(' ')
                  const countryName = val.country === 'CZ' ? 'Česká republika' : 
                                     val.country === 'SK' ? 'Slovensko' :
                                     val.country === 'PL' ? 'Polsko' :
                                     val.country === 'DE' ? 'Německo' :
                                     val.country === 'AT' ? 'Rakousko' :
                                     val.country || ''
                  
                  return [streetPart, cityPart, countryName].filter(Boolean).join(', ') || '—'
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Režim EDITACE: Autocomplete + všechna pole */}
        {!readOnly && (
          <>
            {/* Adresa autocomplete (pro CZ) */}
            <div className="detail-form__grid detail-form__grid--narrow">
              <div className="detail-form__field detail-form__field--span-2">
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
                    disabled={false}
                  />
                ) : (
                  <div className="detail-form__hint">Autocomplete je dostupný pouze pro Českou republiku</div>
                )}
              </div>
            </div>

            {/* Ulice + Číslo popisné */}
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
              readOnly={readOnly}
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
              readOnly={readOnly}
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

        {/* Město + PSČ + Stát */}
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
              readOnly={readOnly}
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
              readOnly={readOnly}
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
              disabled={readOnly}
            >
              <option value="CZ">Česká republika</option>
              <option value="SK">Slovensko</option>
              <option value="PL">Polsko</option>
              <option value="DE">Německo</option>
              <option value="AT">Rakousko</option>
            </select>
          </div>
        </div>
          </>
        )}
      </div>

      {/* ZÁKLADNÍ ÚDAJE / KONTAKTY (BEZ přihlašovacích údajů) */}
      <div className="detail-form__section">
        <div className="detail-form__section-title">Kontaktní údaje</div>

        {/* Zobrazované jméno + Email */}
        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">Zobrazované jméno / přezdívka</label>
            <InputWithHistory
              historyId="landlord.displayName"
              className="detail-form__input"
              type="text"
              maxLength={80}
              value={val.displayName}
              readOnly={readOnly}
              onChange={(e) => update({ displayName: e.target.value })}
              placeholder="volitelné"
            />
          </div>

          <div className="detail-form__field">
            <label className="detail-form__label">
              E-mail <span className="detail-form__required">*</span>
            </label>
            <InputWithHistory
              historyId="landlord.email"
              className="detail-form__input"
              type="email"
              maxLength={80}
              value={val.email}
              readOnly={readOnly}
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
        </div>

        {/* Telefon */}
        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">
              Telefon {isPerson && <span className="detail-form__required">*</span>}
            </label>
            <InputWithHistory
              historyId="landlord.phone"
              className="detail-form__input"
              type="tel"
              maxLength={20}
              value={val.phone}
              readOnly={readOnly}
              onChange={(e) => update({ phone: e.target.value })}
              onBlur={(e) => {
                if (isPerson && !e.target.value) {
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
      </div>

      {/* PŘIŘAZENÍ SUBJEKTU */}
      <div className="detail-form__section">
        <div className="detail-form__section-title">Přiřazení subjektu jako:</div>
        
        {/* 1. řádek: Uživatel aplikace */}
        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__checkbox-label">
              <input
                type="checkbox"
                checked={val.isUser}
                disabled={readOnly}
                onChange={(e) => update({ isUser: e.target.checked })}
                style={{ marginRight: '0.5rem' }}
              />
              Uživatel aplikace
            </label>
          </div>
        </div>

        {/* Oddělovač pro mobil */}
        <div style={{ height: '12px' }} className="mobile-only-spacer"></div>

        {/* 2. řádek: Pronajímatel, Zástupce pronajimatele */}
        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__checkbox-label">
              <input
                type="checkbox"
                checked={val.isLandlord}
                disabled={readOnly}
                onChange={(e) => update({ isLandlord: e.target.checked })}
                style={{ marginRight: '0.5rem' }}
              />
              Pronajímatel
            </label>
          </div>
          {isPerson && (
            <div className="detail-form__field">
              <label className="detail-form__checkbox-label">
                <input
                  type="checkbox"
                  checked={val.isLandlordDelegate}
                  disabled={readOnly}
                  onChange={(e) => update({ isLandlordDelegate: e.target.checked })}
                  style={{ marginRight: '0.5rem' }}
                />
                Zástupce pronajimatele
              </label>
            </div>
          )}
        </div>

        {/* Oddělovač pro mobil */}
        <div style={{ height: '12px' }} className="mobile-only-spacer"></div>

        {/* 3. řádek: Nájemník, Zástupce nájemníka */}
        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__checkbox-label">
              <input
                type="checkbox"
                checked={val.isTenant}
                disabled={readOnly}
                onChange={(e) => update({ isTenant: e.target.checked })}
                style={{ marginRight: '0.5rem' }}
              />
              Nájemník
            </label>
          </div>
          {isPerson && (
            <div className="detail-form__field">
              <label className="detail-form__checkbox-label">
                <input
                  type="checkbox"
                  checked={val.isTenantDelegate}
                  disabled={readOnly}
                  onChange={(e) => update({ isTenantDelegate: e.target.checked })}
                  style={{ marginRight: '0.5rem' }}
                />
                Zástupce nájemníka
              </label>
            </div>
          )}
        </div>

        {/* Oddělovač pro mobil */}
        <div style={{ height: '12px' }} className="mobile-only-spacer"></div>

        {/* 4. řádek: Údržba, Zástupce údržby */}
        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__checkbox-label">
              <input
                type="checkbox"
                checked={val.isMaintenance}
                disabled={readOnly}
                onChange={(e) => update({ isMaintenance: e.target.checked })}
                style={{ marginRight: '0.5rem' }}
              />
              Údržba
            </label>
          </div>
          {isPerson && (
            <div className="detail-form__field">
              <label className="detail-form__checkbox-label">
                <input
                  type="checkbox"
                  checked={val.isMaintenanceDelegate}
                  disabled={readOnly}
                  onChange={(e) => update({ isMaintenanceDelegate: e.target.checked })}
                  style={{ marginRight: '0.5rem' }}
                />
                Zástupce údržby
              </label>
            </div>
          )}
        </div>
      </div>

      {/* POZNÁMKA */}
      <div className="detail-form__section">
        <div className="detail-form__section-title">Poznámka</div>

        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field detail-form__field--span-2">
            <label className="detail-form__label">Poznámka</label>
            <textarea
              className="detail-form__input"
              maxLength={1000}
              value={val.note}
              readOnly={readOnly}
              onChange={(e) => update({ note: e.target.value })}
              placeholder="volitelné"
              rows={4}
            />
          </div>
        </div>
      </div>
    </div>
  )
})

export default LandlordDetailForm
