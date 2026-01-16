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
  const [saving, setSaving] = useState(false)
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
  }

  const handleEdit = (user: TenantUser) => {
    setEditingUser(user)
    setFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      birth_date: user.birth_date,
      note: user.note || '',
    })
  }

  const handleCancel = () => {
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
      setSaving(true)
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
    } finally {
      setSaving(false)
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

  return (
    <div className="detail-form">
      {/* Seznam uživatelů */}
      <section className="detail-form__section">
        <h3 className="detail-form__section-title">
          Seznam uživatelů
          <span style={{ marginLeft: '12px', fontWeight: 400, fontSize: '14px', color: 'var(--color-text-subtle)' }}>
            Počet celkem: {totalCount} (1 nájemník + {users.length} spolubydlících)
          </span>
        </h3>

        {loading && <div className="detail-form__hint">Načítám uživatele…</div>}

        {!loading && users.length === 0 && <div className="detail-form__hint">Zatím žádní uživatelé.</div>}

        {!loading && users.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Jméno</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Příjmení</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Datum narození</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Poznámka</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => handleEdit(user)}
                    style={{
                      cursor: viewMode !== 'read' ? 'pointer' : 'default',
                      borderBottom: '1px solid var(--color-border-soft)',
                      backgroundColor: editingUser?.id === user.id ? 'var(--color-primary-soft)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '8px' }}>{user.first_name}</td>
                    <td style={{ padding: '8px' }}>{user.last_name}</td>
                    <td style={{ padding: '8px' }}>{new Date(user.birth_date).toLocaleDateString('cs-CZ')}</td>
                    <td style={{ padding: '8px' }}>{user.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Formulář */}
      <section className="detail-form__section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 className="detail-form__section-title">Formulář</h3>
          {viewMode !== 'read' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={handleAdd}
                style={{
                  padding: '6px 12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  background: 'var(--color-surface)',
                  cursor: 'pointer',
                }}
              >
                ➕ Nový
              </button>
              {editingUser && (
                <button
                  type="button"
                  onClick={() => handleArchive(editingUser.id)}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid var(--color-danger)',
                    borderRadius: '8px',
                    background: 'var(--color-danger)',
                    color: 'white',
                    cursor: 'pointer',
                  }}
                >
                  🗑️ Archivovat
                </button>
              )}
            </div>
          )}
        </div>

        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field detail-form__field--span-4">
            <label className="detail-form__label">
              Jméno <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              className="detail-form__input"
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              readOnly={viewMode === 'read'}
            />
          </div>

          <div className="detail-form__field detail-form__field--span-4">
            <label className="detail-form__label">
              Příjmení <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              className="detail-form__input"
              type="text"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              readOnly={viewMode === 'read'}
            />
          </div>

          <div className="detail-form__field detail-form__field--span-4">
            <label className="detail-form__label">
              Datum narození <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              className="detail-form__input"
              type="date"
              value={formData.birth_date}
              onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              readOnly={viewMode === 'read'}
            />
          </div>

          <div className="detail-form__field detail-form__field--span-8">
            <label className="detail-form__label">Poznámka</label>
            <textarea
              className="detail-form__input"
              value={formData.note || ''}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              rows={3}
              placeholder="např. manželka, syn, spoluuživatel garáže..."
              readOnly={viewMode === 'read'}
            />
          </div>
        </div>

        {viewMode !== 'read' && (
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--color-primary)',
                color: 'white',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Ukládám...' : editingUser ? 'Uložit' : 'Přidat'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1,
              }}
            >
              Zrušit
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
