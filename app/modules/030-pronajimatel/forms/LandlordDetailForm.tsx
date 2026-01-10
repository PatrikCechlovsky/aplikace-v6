'use client'

// FILE: app/modules/030-pronajimatel/forms/LandlordDetailForm.tsx
// PURPOSE: Formulář pronajimatele podle typu subjektu (030)
// Zobrazí příslušná pole podle subject_type (osoba, osvc, firma, spolek, statni, zastupce)

import React, { useEffect, useMemo, useState } from 'react'
import InputWithHistory from '@/app/UI/InputWithHistory'

// =====================
// 1) TYPES
// =====================

export type LandlordFormValue = {
  // Všechny typy
  displayName: string
  email: string
  phone: string
  note: string
  isArchived: boolean

  // Adresa (všechny typy)
  street: string
  city: string
  zip: string
  houseNumber: string
  country: string

  // Person fields (osoba, osvc, zastupce)
  titleBefore: string
  firstName: string
  lastName: string
  birthDate: string
  personalIdNumber: string
  idDocType: string
  idDocNumber: string

  // Company fields (firma, spolek, statni)
  companyName: string
  ic: string
  dic: string
  icValid: boolean
  dicValid: boolean
  delegateId: string // FK na subject (zástupce)
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
      displayName: safe(landlord.displayName),
      email: safe(landlord.email),
      phone: safe(landlord.phone),
      note: safe(landlord.note),
      isArchived: !!landlord.isArchived,

      street: safe(landlord.street),
      city: safe(landlord.city),
      zip: safe(landlord.zip),
      houseNumber: safe(landlord.houseNumber),
      country: safe(landlord.country || 'CZ'),

      titleBefore: safe(landlord.titleBefore),
      firstName: safe(landlord.firstName),
      lastName: safe(landlord.lastName),
      birthDate: safe(landlord.birthDate),
      personalIdNumber: safe(landlord.personalIdNumber),
      idDocType: safe(landlord.idDocType),
      idDocNumber: safe(landlord.idDocNumber),

      companyName: safe(landlord.companyName),
      ic: safe(landlord.ic),
      dic: safe(landlord.dic),
      icValid: !!landlord.icValid,
      dicValid: !!landlord.dicValid,
      delegateId: safe(landlord.delegateId),
    }),
    [landlord]
  )

  const [val, setVal] = useState<LandlordFormValue>(initial)
  const [dirty, setDirty] = useState(false)

  // Když se změní landlord, přepiš form
  useEffect(() => {
    setVal(initial)
    setDirty(false)
    onDirtyChange?.(false)
    onValueChange?.(initial)
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

  return (
    <div className="detail-form">
      {/* ZÁKLADNÍ ÚDAJE */}
      <div className="detail-form__section">
        <div className="detail-form__section-title">Základní údaje</div>

        {/* Zobrazované jméno + Email + Telefon */}
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

      {/* OSOBNÍ ÚDAJE (pro osoba, osvc, zastupce) */}
      {isPerson && (
        <div className="detail-form__section">
          <div className="detail-form__section-title">Osobní údaje</div>

          {/* Titul + Jméno + Příjmení */}
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

          {/* Datum narození + Rodné číslo */}
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

          {/* Druh dokladu + Číslo dokladu */}
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
                  <button type="button" className="detail-form__button" title="Načíst z ARES">
                    ARES
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

          {/* Zástupce (lookup na subject s typem zastupce) */}
          <div className="detail-form__grid detail-form__grid--narrow">
            <div className="detail-form__field detail-form__field--span-2">
              <label className="detail-form__label">Zástupce</label>
              <input
                className="detail-form__input"
                type="text"
                value={val.delegateId || ''}
                readOnly={readOnly}
                onChange={(e) => update({ delegateId: e.target.value })}
                placeholder="ID zástupce (lookup bude implementován později)"
              />
            </div>
          </div>
        </div>
      )}

      {/* ADRESA (všechny typy) */}
      <div className="detail-form__section">
        <div className="detail-form__section-title">Adresa</div>

        {/* Stát + PSČ + Město */}
        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">
              Stát <span className="detail-form__required">*</span>
            </label>
            <input
              className="detail-form__input"
              type="text"
              maxLength={3}
              value={val.country}
              readOnly={readOnly}
              onChange={(e) => update({ country: e.target.value.toUpperCase() })}
              placeholder="CZ"
            />
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
              placeholder="12345"
            />
          </div>

          <div className="detail-form__field">
            <label className="detail-form__label">
              Město <span className="detail-form__required">*</span>
            </label>
            <InputWithHistory
              historyId="landlord.city"
              className="detail-form__input"
              type="text"
              maxLength={100}
              value={val.city}
              readOnly={readOnly}
              onChange={(e) => update({ city: e.target.value })}
            />
          </div>
        </div>

        {/* Ulice + Číslo popisné */}
        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">Ulice</label>
            <InputWithHistory
              historyId="landlord.street"
              className="detail-form__input"
              type="text"
              maxLength={100}
              value={val.street}
              readOnly={readOnly}
              onChange={(e) => update({ street: e.target.value })}
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

