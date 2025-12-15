'use client'

import React, { useEffect, useState } from 'react'

export type UserFormValue = {
  displayName: string
  email: string
  phone?: string
}

type UserDetailFormProps = {
  user: {
    id: string
    displayName: string
    email: string
    phone?: string
    roleLabel: string
    twoFactorMethod?: string | null
    createdAt: string
    isArchived?: boolean
  }
  readOnly?: boolean
  onDirtyChange?: (dirty: boolean) => void
  onValueChange?: (value: UserFormValue) => void
}

export default function UserDetailForm({
  user,
  readOnly = false,
  onDirtyChange,
  onValueChange,
}: UserDetailFormProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState(user.phone ?? '')
  const [email, setEmail] = useState(user.email)

  // init z displayName
  useEffect(() => {
    const parts = user.displayName.split(' ').filter(Boolean)
    setFirstName(parts.slice(0, -1).join(' ') || parts[0] || '')
    setLastName(parts.length > 1 ? parts.slice(-1).join(' ') : '')
    setPhone(user.phone ?? '')
    setEmail(user.email)
  }, [user.id, user.displayName, user.phone, user.email])

  const displayName = `${firstName} ${lastName}`.trim()

  // ⬅️ POSÍLÁME AKTUÁLNÍ HODNOTY VEN (pro save)
  useEffect(() => {
    onValueChange?.({
      displayName,
      email,
      phone,
    })
  }, [displayName, email, phone, onValueChange])

  // ⬅️ DIRTY LOGIKA
  useEffect(() => {
    const dirty =
      displayName !== (user.displayName ?? '') ||
      phone !== (user.phone ?? '') ||
      email !== (user.email ?? '')

    onDirtyChange?.(dirty)
  }, [displayName, phone, email, user.displayName, user.phone, user.email, onDirtyChange])

  return (
    <div className="detail-form">
      <section className="detail-form__section">
        <h3 className="detail-form__section-title">Profil</h3>

        <div className="detail-form__grid">
          <div className="detail-form__field">
            <label className="detail-form__label">Jméno</label>
            <input
              className="detail-form__input"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={readOnly}
            />
          </div>

          <div className="detail-form__field">
            <label className="detail-form__label">Příjmení</label>
            <input
              className="detail-form__input"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={readOnly}
            />
          </div>

          <div className="detail-form__field">
            <label className="detail-form__label">Telefon</label>
            <input
              className="detail-form__input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={readOnly}
            />
          </div>

          <div className="detail-form__field detail-form__field--span-2">
            <label className="detail-form__label">E-mail</label>
            <input
              className="detail-form__input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={readOnly}
            />
          </div>
        </div>
      </section>

      <section className="detail-form__section">
        <h3 className="detail-form__section-title">Účet</h3>

        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">Role</label>
            <input
              className="detail-form__input detail-form__input--readonly"
              value={user.roleLabel}
              readOnly
            />
          </div>

          <div className="detail-form__field">
            <label className="detail-form__label">2FA</label>
            <input
              className="detail-form__input detail-form__input--readonly"
              value={user.twoFactorMethod ? user.twoFactorMethod.toUpperCase() : 'Nenastaveno'}
              readOnly
            />
          </div>

          <div className="detail-form__field">
            <label className="detail-form__label">Stav účtu</label>
            <input
              className="detail-form__input detail-form__input--readonly"
              value={user.isArchived ? 'Archivovaný' : 'Aktivní'}
              readOnly
            />
          </div>
        </div>
      </section>
    </div>
  )
}
