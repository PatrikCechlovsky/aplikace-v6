'use client'

// FILE: app/modules/030-pronajimatel/forms/LandlordDetailForm.tsx
// PURPOSE: Formulář pronajimatele podle typu subjektu (030)
// Struktura stejná jako "Můj účet", ale bez přihlašovacích údajů
// Sekce: Osobní údaje -> Adresa -> Základní údaje (email, telefon)

import React, { useCallback, useEffect, useMemo, useState } from 'react'
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
// 3) COMPONENT
// =====================

export default function LandlordDetailForm({
  subjectType,
  landlord,
  readOnly,
  onDirtyChange,
  onValueChange,
}: LandlordDetailFormProps) {
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

      // Poznámka
      note: safe(landlord.note),
      isArchived: !!landlord.isArchived,
    }),
    [landlord]
  )

  const [val, setVal] = useState<LandlordFormValue>(initial)
  const [dirty, setDirty] = useState(false)
  const [loadingAres, setLoadingAres] = useState(false)
  const toast = useToast()

  // Když se změní landlord, přepiš form
  useEffect(() => {
    // Vytvořit nový objekt, ne jen referenci
    const newVal = { ...initial }
    setVal(newVal)
    setDirty(false)
    onDirtyChange?.(false)
    // Nevolat onValueChange zde - to způsobuje problémy s synchronizací
    // onValueChange se volá jen když uživatel skutečně změní hodnotu přes update()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial])

  const update = (patch: Partial<LandlordFormValue>) => {
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

      if (!response.ok) {
        throw new Error(data.error || 'Nepodařilo se načíst data z ARES')
      }

      // Předvyplnit formulář daty z ARES (použít aktuální hodnoty jako fallback)
      setVal((prev) => {
        const updates: Partial<LandlordFormValue> = {
          companyName: data.companyName || prev.companyName,
          ic: data.ic || prev.ic,
          dic: data.dic || prev.dic,
          icValid: data.icValid ?? prev.icValid,
          dicValid: data.dicValid ?? prev.dicValid,
          street: data.street || prev.street,
          houseNumber: data.houseNumber || prev.houseNumber,
          city: data.city || prev.city,
          zip: data.zip || prev.zip,
          country: data.country || prev.country,
        }
        const next = { ...prev, ...updates }
        
        // Označit jako dirty a notifikovat
        if (!dirty) {
          setDirty(true)
          onDirtyChange?.(true)
        }
        onValueChange?.(next)
        
        return next
      })
      
      toast.showSuccess('Data z ARES byla úspěšně načtena')
    } catch (error: any) {
      console.error('ARES load failed:', error)
      toast.showError(error.message || 'Nepodařilo se načíst data z ARES')
    } finally {
      setLoadingAres(false)
    }
  }, [val.ic, toast, dirty, onDirtyChange, onValueChange])


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
              <label className="detail-form__label">Datum narození</label>
              <input
                className="detail-form__input"
                type="date"
                value={val.birthDate || ''}
                readOnly={readOnly}
                onChange={(e) => update({ birthDate: e.target.value })}
              />
            </div>

            <div className="detail-form__field">
              <label className="detail-form__label">Rodné číslo</label>
              <input
                className="detail-form__input"
                type="text"
                maxLength={11}
                value={val.personalIdNumber}
                readOnly={readOnly}
                onChange={(e) => update({ personalIdNumber: e.target.value })}
                placeholder="YYMMDD/XXXX nebo YYMMDDXXXX"
              />
            </div>
          </div>

          {/* Řádek 3: Druh dokladu + Číslo dokladu */}
          <div className="detail-form__grid detail-form__grid--narrow">
            <div className="detail-form__field">
              <label className="detail-form__label">Druh dokladu</label>
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
              <label className="detail-form__label">Číslo dokladu</label>
              <input
                className="detail-form__input"
                type="text"
                maxLength={50}
                value={val.idDocNumber}
                readOnly={readOnly}
                onChange={(e) => update({ idDocNumber: e.target.value })}
                placeholder="Číslo dokladu"
              />
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
        <div className="detail-form__section-title">Adresa (autocomplete)</div>

        {/* Adresa autocomplete (pro CZ) */}
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
                disabled={readOnly}
              />
            ) : (
              <div className="detail-form__hint">Autocomplete je dostupný pouze pro Českou republiku</div>
            )}
          </div>
        </div>

        {/* Ulice + Číslo popisné */}
        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">Ulice</label>
            <input
              className="detail-form__input"
              type="text"
              maxLength={100}
              value={val.street}
              readOnly={readOnly}
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
              readOnly={readOnly}
              onChange={(e) => update({ houseNumber: e.target.value })}
              placeholder="123"
            />
          </div>
        </div>

        {/* Město + PSČ + Stát */}
        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">Město</label>
            <input
              className="detail-form__input"
              type="text"
              maxLength={100}
              value={val.city}
              readOnly={readOnly}
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
              readOnly={readOnly}
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
            />
          </div>
        </div>

        {/* Telefon */}
        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">Telefon</label>
            <InputWithHistory
              historyId="landlord.phone"
              className="detail-form__input"
              type="tel"
              maxLength={20}
              value={val.phone}
              readOnly={readOnly}
              onChange={(e) => update({ phone: e.target.value })}
              placeholder="+420 999 874 564"
            />
          </div>
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
}
