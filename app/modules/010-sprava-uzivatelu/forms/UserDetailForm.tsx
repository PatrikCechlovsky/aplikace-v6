'use client'

// FILE: app/modules/010-sprava-uzivatelu/forms/UserDetailForm.tsx
// PURPOSE: Formulář uživatele pro subjects (010). Umí read/edit/create a posílá ven hodnoty pro DB.

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
  roleLabel: string
  twoFactorMethod?: string | null
  createdAt: string
  isArchived?: boolean

  // Volitelně – pokud to UserDetailFrame začne doplňovat z DB:
  titleBefore?: string | null
  firstName?: string | null
  lastName?: string | null
  login?: string | null
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
  isArchived: boolean
}

export type UserDetailFormProps = {
  user: UiUser
  readOnly: boolean
  onDirtyChange?: (dirty: boolean) => void
  onValueChange?: (val: UserFormValue) => void
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

export default function UserDetailForm({ user, readOnly, onDirtyChange, onValueChange }: UserDetailFormProps) {
  const initial = useMemo<UserFormValue>(
    () => ({
      displayName: safe(user.displayName),
      email: safe(user.email),
      phone: safe(user.phone),

      titleBefore: safe((user as any).titleBefore),
      firstName: safe((user as any).firstName),
      lastName: safe((user as any).lastName),
      login: safe((user as any).login),

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
      {/* ZÁKLAD */}
      <div className="detail-form__section">
        <div className="detail-form__section-title">Základ</div>

        <div className="detail-form__grid">
          <div className="detail-form__field">
            <label className="detail-form__label">
              Zobrazované jméno / přezdívka <span className="detail-form__required">*</span>
            </label>
            <input
              className="detail-form__input"
              value={val.displayName}
              readOnly={readOnly}
              onChange={(e) => update({ displayName: e.target.value })}
              placeholder="např. Páťo Admin"
            />
          </div>

          <div className="detail-form__field">
            <label className="detail-form__label">
              E-mail <span className="detail-form__required">*</span>
            </label>
            <input
              className="detail-form__input"
              value={val.email}
              readOnly={readOnly}
              onChange={(e) => update({ email: e.target.value })}
              placeholder="např. admin@local.test"
            />
          </div>

          <div className="detail-form__field">
            <label className="detail-form__label">Telefon</label>
            <input
              className="detail-form__input"
              value={val.phone}
              readOnly={readOnly}
              onChange={(e) => update({ phone: e.target.value })}
              placeholder="+420..."
            />
          </div>

          <div className="detail-form__field">
            <label className="detail-form__label">Přihlašovací jméno</label>
            <input
              className="detail-form__input"
              value={val.login}
              readOnly={readOnly}
              onChange={(e) => update({ login: e.target.value })}
              placeholder="např. pato.admin"
            />
          </div>
        </div>
      </div>
      {/* OSOBA */}
      <div className="detail-form__section">
        <div className="detail-form__section-title">Osoba</div>

        <div className="detail-form__grid">
          <div className="detail-form__field">
            <label className="detail-form__label">Titul před</label>
            <input
              className="detail-form__input"
              value={val.titleBefore}
              readOnly={readOnly}
              onChange={(e) => update({ titleBefore: e.target.value })}
              placeholder="Ing., Bc., ..."
            />
          </div>

          <div className="detail-form__field">
            <label className="detail-form__label">Jméno</label>
            <input
              className="detail-form__input"
              value={val.firstName}
              readOnly={readOnly}
              onChange={(e) => update({ firstName: e.target.value })}
              placeholder="Páťo"
            />
          </div>

          <div className="detail-form__field">
            <label className="detail-form__label">Příjmení</label>
            <input
              className="detail-form__input"
              value={val.lastName}
              readOnly={readOnly}
              onChange={(e) => update({ lastName: e.target.value })}
              placeholder="Admin"
            />
          </div>

          <div className="detail-form__field">
            <label className="detail-form__label">Archivováno</label>
            <input
              type="checkbox"
              checked={val.isArchived}
              disabled={readOnly}
              onChange={(e) => update({ isArchived: e.target.checked })}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
