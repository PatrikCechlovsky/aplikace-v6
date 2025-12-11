/*
 * FILE: app/modules/010-sprava-uzivatelu/forms/UserDetailForm.tsx
 * PURPOSE: Základní detail uživatele pro modul 010 (admin pohled).
 */

'use client'

import React, { useEffect, useState } from 'react'

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
  // callback zvenku (UsersTile / UserDetailFrame) – pro CommonActions (isDirty)
  onDirtyChange?: (dirty: boolean) => void

  // řízení režimu view/edit – pokud true, vstupy jsou disabled
  readOnly?: boolean
}

export default function UserDetailForm({
  user,
  onDirtyChange,
  readOnly = false,
}: UserDetailFormProps) {
  // jednoduchý lokální stav – zatím jen mock (později napojíme na reálná data)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState(user.phone ?? '')
  const [email, setEmail] = useState(user.email)

  // Načtení jména z displayName (jen pro demo, reálně půjde z polí subjectu)
  useEffect(() => {
    const parts = user.displayName.split(' ')
    if (parts.length === 1) {
      setFirstName(parts[0])
      setLastName('')
    } else {
      setFirstName(parts.slice(0, -1).join(' '))
      setLastName(parts.slice(-1).join(' '))
    }
  }, [user.displayName])

  // Dirty flag – kdykoli se změní některé pole
  useEffect(() => {
    const isDirty =
      firstName.trim() !== '' ||
      lastName.trim() !== '' ||
      phone !== (user.phone ?? '') ||
      email !== user.email

    onDirtyChange?.(isDirty)
  }, [firstName, lastName, phone, email, user.phone, user.email, onDirtyChange])

  return (
    <div className="user-detail">
      {/* Sekce PROFIL */}
      <section className="user-detail__section">
        <h3 className="user-detail__section-title">Profil</h3>

        <div className="user-detail__grid">
          <div className="user-detail__field">
            <label className="user-detail__label">Jméno</label>
            <input
              className="user-detail__input"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Jméno"
              disabled={readOnly}
            />
          </div>

          <div className="user-detail__field">
            <label className="user-detail__label">Příjmení</label>
            <input
              className="user-detail__input"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Příjmení"
              disabled={readOnly}
            />
          </div>

          <div className="user-detail__field">
            <label className="user-detail__label">Telefon</label>
            <input
              className="user-detail__input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+420 777 000 000"
              disabled={readOnly}
            />
          </div>

          <div className="user-detail__field">
            <label className="user-detail__label">E-mail</label>
            <input
              className="user-detail__input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="uživatel@example.com"
              disabled={readOnly}
            />
          </div>
        </div>
      </section>

      {/* Sekce ÚČET */}
      <section className="user-detail__section">
        <h3 className="user-detail__section-title">Účet</h3>

        <div className="user-detail__grid user-detail__grid--narrow">
          <div className="user-detail__field">
            <label className="user-detail__label">Role</label>
            <input
              className="user-detail__input user-detail__input--readonly"
              value={user.roleLabel}
              readOnly
            />
          </div>

          <div className="user-detail__field">
            <label className="user-detail__label">2FA</label>
            <input
              className="user-detail__input user-detail__input--readonly"
              value={
                user.twoFactorMethod
                  ? user.twoFactorMethod.toUpperCase()
                  : 'Nenastaveno'
              }
              readOnly
            />
          </div>

          <div className="user-detail__field">
            <label className="user-detail__label">Stav účtu</label>
            <input
              className="user-detail__input user-detail__input--readonly"
              value={user.isArchived ? 'Archivovaný' : 'Aktivní'}
              readOnly
            />
          </div>
        </div>
      </section>

      <style jsx>{`
        .user-detail {
          display: flex;
          flex-direction: column;
          gap: 24px;
          font-size: 0.9rem;
        }

        .user-detail__section {
          border-radius: 0.75rem;
          border: 1px solid #e5e7eb;
          padding: 16px;
          background: #f9fafb;
        }

        .user-detail__section-title {
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .user-detail__grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px 16px;
        }

        .user-detail__grid--narrow {
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        }

        .user-detail__field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .user-detail__label {
          font-size: 0.75rem;
          font-weight: 500;
          color: #6b7280;
        }

        .user-detail__input {
          font-size: 0.85rem;
          padding: 6px 8px;
          border-radius: 0.5rem;
          border: 1px solid #d1d5db;
          background: white;
        }

        .user-detail__input--readonly {
          background: #f3f4f6;
          color: #4b5563;
        }

        .user-detail__input:focus {
          outline: none;
          border-color: #22c55e;
          box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.4);
        }
      `}</style>
    </div>
  )
}
