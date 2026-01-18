'use client'

// FILE: app/modules/010-sprava-uzivatelu/forms/UserDetailForm.tsx
// PURPOSE: Formulář uživatele pro subjects (010). Umí read/edit/create a posílá ven hodnoty pro DB.

// =====================
// 1) IMPORTS
// =====================

import React, { useEffect, useMemo, useState } from 'react'
import InputWithHistory from '../../../UI/InputWithHistory'

// =====================
// 2) TYPES
// =====================

type UiUser = {
  id: string
  displayName: string
  email: string
  phone?: string
  roleLabel: string
  twoFactorMethod?: string | null
  createdAt: string
  isArchived?: boolean

  // Volitelně – pokud to UserDetailFrame začne doplňovat z DB:
  titleBefore?: string | null
  firstName?: string | null
  lastName?: string | null
  login?: string | null
  
  // Personal identification
  birthDate?: string | null
  personalIdNumber?: string | null
  idDocType?: string | null
  idDocNumber?: string | null
}

export type UserFormValue = {
  displayName: string
  email: string
  phone: string

  // DB fields (subjects)
  titleBefore: string
  firstName: string
  lastName: string
  login: string
  note: string // Poznámka k uživateli
  isArchived: boolean
  
  // Personal identification
  birthDate: string
  personalIdNumber: string
  idDocType: string
  idDocNumber: string
}

export type UserDetailFormProps = {
  user: UiUser
  readOnly: boolean
  roleCode?: string | null
  permissionCode?: string | null
  roleLabel?: string
  permissionLabel?: string
  availableRoles?: Array<{ code: string; name: string }>
  availablePermissions?: Array<{ code: string; name: string }>
  onDirtyChange?: (dirty: boolean) => void
  onValueChange?: (val: UserFormValue) => void
  onRoleChange?: (roleCode: string) => void
  onPermissionChange?: (permissionCode: string) => void
}

// =====================
// 3) HELPERS
// =====================

function safe(v: any) {
  return (v ?? '').toString()
}

// =====================
// 4) DATA LOAD (hooks)
// =====================

export default function UserDetailForm({ 
  user, 
  readOnly, 
  roleCode,
  permissionCode,
  roleLabel,
  permissionLabel,
  availableRoles = [],
  availablePermissions = [],
  onDirtyChange, 
  onValueChange,
  onRoleChange,
  onPermissionChange,
}: UserDetailFormProps) {
  const initial = useMemo<UserFormValue>(
    () => ({
      displayName: safe(user.displayName),
      email: safe(user.email),
      phone: safe(user.phone),

      titleBefore: safe((user as any).titleBefore),
      firstName: safe((user as any).firstName),
      lastName: safe((user as any).lastName),
      login: safe((user as any).login),
      note: safe((user as any).note),

      // Personal identification
      birthDate: safe((user as any).birthDate),
      personalIdNumber: safe((user as any).personalIdNumber),
      idDocType: safe((user as any).idDocType),
      idDocNumber: safe((user as any).idDocNumber),

      isArchived: !!user.isArchived,
    }),
    [user]
  )

  const [val, setVal] = useState<UserFormValue>(initial)
  const [dirty, setDirty] = useState(false)

  // Když se změní user (např. načetl se z DB), přepiš form
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

  const update = (patch: Partial<UserFormValue>) => {
    setVal((prev) => {
      const next = { ...prev, ...patch }

      // ✅ displayName = přezdívka (ručně), NESKLÁDAT z first/last/title
      // (záměrně zde není žádné recompute)

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
      {/* PŘIHLAŠOVACÍ ÚDAJE */}
      <div className="detail-form__section">
        <div className="detail-form__section-title">Přihlašovací údaje</div>
  
        {/* Řádek 1: Zobrazované jméno + Přihlašovací jméno (zobrazí se pokud nastaveno) */}
        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">Zobrazované jméno / přezdívka</label>
            <InputWithHistory
              historyId="user.displayName"
              className="detail-form__input"
              type="text"
              maxLength={80}
              value={val.displayName}
              readOnly={readOnly}
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
                value={val.login}
                readOnly={readOnly}
                onChange={(e) => update({ login: e.target.value })}
                placeholder="volitelné"
              />
            </div>
          )}
        </div>
  
        {/* Řádek 2: Email + Telefon (musí se vejít +420 999 874 564) */}
        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">
              E-mail <span className="detail-form__required">*</span>
            </label>
            <InputWithHistory
              historyId="user.email"
              className="detail-form__input"
              type="email"
              maxLength={80}
              value={val.email}
              readOnly={readOnly}
              onChange={(e) => update({ email: e.target.value })}
            />
          </div>
  
          <div className="detail-form__field">
            <label className="detail-form__label">Telefon</label>
            <InputWithHistory
              historyId="user.phone"
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
  
        {/* Řádek 3: Role + Oprávnění */}
        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">Role</label>
            {readOnly ? (
              <input
                className="detail-form__input detail-form__input--readonly"
                type="text"
                value={roleLabel || '—'}
                readOnly
              />
            ) : (
              <select
                className="detail-form__input"
                value={roleCode || ''}
                onChange={(e) => onRoleChange?.(e.target.value)}
              >
                <option value="">— vyber roli —</option>
                {availableRoles.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.name}
                  </option>
                ))}
              </select>
            )}
          </div>
  
          <div className="detail-form__field">
            <label className="detail-form__label">Oprávnění</label>
            {readOnly ? (
              <input
                className="detail-form__input detail-form__input--readonly"
                type="text"
                value={permissionLabel || '—'}
                readOnly
              />
            ) : (
              <select
                className="detail-form__input"
                value={permissionCode || ''}
                onChange={(e) => onPermissionChange?.(e.target.value)}
              >
                <option value="">— vyber oprávnění —</option>
                {availablePermissions.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>
  
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
                historyId="user.titleBefore"
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
                historyId="user.firstName"
                className="detail-form__input"
                type="text"
                maxLength={50}
                value={val.firstName}
                readOnly={readOnly}
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
              historyId="user.lastName"
              className="detail-form__input"
              type="text"
              maxLength={50}
              value={val.lastName}
              readOnly={readOnly}
              onChange={(e) => update({ lastName: e.target.value })}
            />
          </div>
        </div>
  
        {/* Řádek za osobní údaje: Datum narození + Rodné číslo */}
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

        {/* Další řádek: Druh dokladu + Číslo dokladu */}
        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">Druh dokladu</label>
            {readOnly ? (
              <input
                className="detail-form__input detail-form__input--readonly"
                type="text"
                value={val.idDocType === 'OP' ? 'Občanský průkaz' : val.idDocType === 'PAS' ? 'Pas' : val.idDocType === 'RP' ? 'Řidičský průkaz' : val.idDocType === 'OTHER' ? 'Jiný' : val.idDocType || '—'}
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

        {/* Řádek 3: Poznámka k uživateli */}
        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field detail-form__field--span-2">
            <label className="detail-form__label">Poznámka k uživateli</label>
            <textarea
              className="detail-form__input"
              maxLength={255}
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
