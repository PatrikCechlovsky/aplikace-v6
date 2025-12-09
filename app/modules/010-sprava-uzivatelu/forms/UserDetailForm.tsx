/*
 * FILE: app/modules/010-sprava-uzivatelu/forms/UserDetailForm.tsx
 * PURPOSE: Základní detail uživatele pro modul 010 (admin pohled)
 */

'use client'

import React from 'react'

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
}

export default function UserDetailForm({ user }: UserDetailFormProps) {
  // Zatím jen controlled „fake“ formulář – hodnoty jsou read-only / mock.
  // Později napojíme na form state (React Hook Form, vlastní hook, atd.).
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
              defaultValue={user.displayName.split(' ').slice(0, -1).join(' ')}
              placeholder="Jméno"
            />
          </div>

          <div className="user-detail__field">
            <label className="user-detail__label">Příjmení</label>
            <input
              className="user-detail__input"
              defaultValue={user.displayName.split(' ').slice(-1).join(' ')}
              placeholder="Příjmení"
            />
          </div>

          <div className="user-detail__field">
            <label className="user-detail__label">Telefon</label>
            <input
              className="user-detail__input"
              defaultValue={user.phone ?? ''}
              placeholder="+420 777 000 000"
            />
          </div>

          <div className="user-detail__field">
            <label className="user-detail__label">E-mail</label>
            <input
              className="user-detail__input"
              defaultValue={user.email}
              placeholder="uživatel@example.com"
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
              defaultValue={user.roleLabel}
              readOnly
            />
          </div>

          <div className="user-detail__field">
            <label className="user-detail__label">2FA</label>
            <input
              className="user-detail__input user-detail__input--readonly"
              defaultValue={
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
              defaultValue={user.isArchived ? 'Archivovaný' : 'Aktivní'}
              readOnly
            />
          </div>
        </div>
      </section>

      {/* Můžeš sem později přidat záložku Role & Oprávnění jako samostatný komponent */}

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
