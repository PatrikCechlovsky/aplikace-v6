// FILE: app/UI/detail-sections/TenantUsersSection.tsx
// PURPOSE: Sekce pro správu uživatelů nájemního vztahu (spolubydlící, spoluuživatelé)
// NOTES: Seznam + formulář pro přidání/editaci uživatelů nájemníka

'use client'

import React, { useCallback, useEffect, useState } from 'react'
import {
  listTenantUsers,
  createTenantUser,
  updateTenantUser,
  archiveTenantUser,
  type TenantUser,
  type TenantUserFormData,
} from '@/app/lib/services/tenantUsers'
import { useToast } from '@/app/UI/Toast'
import createLogger from '@/app/lib/logger'

const logger = createLogger('TenantUsersSection')

type TenantUsersSectionProps = {
  tenantId: string
  viewMode: 'read' | 'edit' | 'create'
}

export default function TenantUsersSection({ tenantId, viewMode }: TenantUsersSectionProps) {
  const toast = useToast()
  const [users, setUsers] = useState<TenantUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<TenantUser | null>(null)
  const [formData, setFormData] = useState<TenantUserFormData>({
    first_name: '',
    last_name: '',
    birth_date: '',
    note: '',
  })

  const loadUsers = useCallback(async () => {
    if (tenantId === 'new') {
      setUsers([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const data = await listTenantUsers(tenantId, false)
      setUsers(data)
    } catch (err: any) {
      logger.error('loadUsers failed', err)
      toast.showError(err.message || 'Nepodařilo se načíst uživatele')
    } finally {
      setLoading(false)
    }
  }, [tenantId, toast])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleAdd = () => {
    setEditingUser(null)
    setFormData({
      first_name: '',
      last_name: '',
      birth_date: '',
      note: '',
    })
    setShowForm(true)
  }

  const handleEdit = (user: TenantUser) => {
    setEditingUser(user)
    setFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      birth_date: user.birth_date,
      note: user.note || '',
    })
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingUser(null)
    setFormData({
      first_name: '',
      last_name: '',
      birth_date: '',
      note: '',
    })
  }

  const handleSave = async () => {
    if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.birth_date) {
      toast.showError('Jméno, příjmení a datum narození jsou povinné')
      return
    }

    try {
      if (editingUser) {
        await updateTenantUser(editingUser.id, formData)
        toast.showSuccess('Uživatel byl aktualizován')
      } else {
        await createTenantUser(tenantId, formData)
        toast.showSuccess('Uživatel byl přidán')
      }
      handleCancel()
      loadUsers()
    } catch (err: any) {
      logger.error('handleSave failed', err)
      toast.showError(err.message || 'Nepodařilo se uložit uživatele')
    }
  }

  const handleArchive = async (userId: string) => {
    if (!confirm('Opravdu chcete archivovat tohoto uživatele?')) return

    try {
      await archiveTenantUser(userId)
      toast.showSuccess('Uživatel byl archivován')
      loadUsers()
    } catch (err: any) {
      logger.error('handleArchive failed', err)
      toast.showError(err.message || 'Nepodařilo se archivovat uživatele')
    }
  }

  const totalCount = users.length + 1 // +1 za nájemníka

  if (tenantId === 'new') {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-subtle)' }}>
        Uživatelé lze přidat po vytvoření nájemníka.
      </div>
    )
  }

  if (loading) {
    return <div style={{ padding: '2rem' }}>Načítám uživatele...</div>
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      {/* Počet uživatelů */}
      <div
        style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          backgroundColor: 'var(--color-surface-subtle)',
          borderRadius: '8px',
          fontSize: '1rem',
        }}
      >
        <strong>Počet uživatelů celkem:</strong> {totalCount} (1 nájemník + {users.length} spolubydlících)
      </div>

      {/* Seznam uživatelů */}
      {!showForm && (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Seznam uživatelů</h3>
            {users.length === 0 && (
              <p style={{ color: 'var(--color-text-subtle)', marginTop: '0.5rem' }}>Zatím žádní uživatelé.</p>
            )}
          </div>

          {users.length > 0 && (
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginBottom: '1.5rem',
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: 'var(--color-surface-subtle)',
                    textAlign: 'left',
                  }}
                >
                  <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>Jméno</th>
                  <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>Příjmení</th>
                  <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>Datum narození</th>
                  <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>Poznámka</th>
                  <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)', width: '150px' }}>
                    Akce
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '0.75rem' }}>{user.first_name}</td>
                    <td style={{ padding: '0.75rem' }}>{user.last_name}</td>
                    <td style={{ padding: '0.75rem' }}>{new Date(user.birth_date).toLocaleDateString('cs-CZ')}</td>
                    <td style={{ padding: '0.75rem' }}>{user.note || '—'}</td>
                    <td style={{ padding: '0.75rem' }}>
                      {viewMode !== 'read' && (
                        <>
                          <button
                            onClick={() => handleEdit(user)}
                            style={{
                              marginRight: '0.5rem',
                              padding: '0.25rem 0.75rem',
                              fontSize: '0.875rem',
                            }}
                          >
                            Upravit
                          </button>
                          <button
                            onClick={() => handleArchive(user.id)}
                            style={{
                              padding: '0.25rem 0.75rem',
                              fontSize: '0.875rem',
                              backgroundColor: 'var(--color-danger)',
                              color: 'white',
                            }}
                          >
                            Archivovat
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {viewMode !== 'read' && (
            <button onClick={handleAdd} style={{ padding: '0.5rem 1.5rem' }}>
              ➕ Přidat uživatele
            </button>
          )}
        </>
      )}

      {/* Formulář */}
      {showForm && (
        <div
          style={{
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            padding: '1.5rem',
            backgroundColor: 'var(--color-surface)',
          }}
        >
          <h3 style={{ marginTop: 0 }}>{editingUser ? 'Upravit uživatele' : 'Přidat uživatele'}</h3>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
              Jméno <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
              Příjmení <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
              Datum narození <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              type="date"
              value={formData.birth_date}
              onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Poznámka</label>
            <textarea
              value={formData.note || ''}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              rows={3}
              style={{ width: '100%', padding: '0.5rem' }}
              placeholder="např. manželka, syn, spoluuživatel garáže..."
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={handleSave} style={{ padding: '0.5rem 1.5rem', backgroundColor: 'var(--color-primary)' }}>
              {editingUser ? 'Uložit' : 'Přidat'}
            </button>
            <button onClick={handleCancel} style={{ padding: '0.5rem 1.5rem' }}>
              Zrušit
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
