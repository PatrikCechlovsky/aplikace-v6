// FILE: app/UI/detail-sections/TenantUsersSection.tsx
// PURPOSE: Sekce pro správu uživatelů nájemního vztahu (spolubydlící, spoluuživatelé)
// NOTES: Seznam + formulář pro přidání/editaci uživatelů nájemníka

'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  listTenantUsers,
  createTenantUser,
  updateTenantUser,
  type TenantUser,
  type TenantUserFormData,
} from '@/app/lib/services/tenantUsers'
import { getTenantDetail } from '@/app/lib/services/tenants'
import { useToast } from '@/app/UI/Toast'
import { getIcon, type IconKey } from '@/app/UI/icons'
import createLogger from '@/app/lib/logger'

const logger = createLogger('TenantUsersSection')

type TenantUsersSectionProps = {
  tenantId: string
  viewMode: 'view' | 'edit' | 'create'
}

export default function TenantUsersSection({ tenantId, viewMode }: TenantUsersSectionProps) {
  const toast = useToast()
  const [users, setUsers] = useState<TenantUser[]>([])
  const [tenantRow, setTenantRow] = useState<TenantUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [formData, setFormData] = useState<TenantUserFormData>({
    first_name: '',
    last_name: '',
    birth_date: '',
    note: '',
  })
  const [isArchived, setIsArchived] = useState(false)
  
  const currentIndexRef = useRef<number>(-1)

  const loadUsers = useCallback(async () => {
    if (tenantId === 'new') {
      setUsers([])
      setTenantRow(null)
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

  useEffect(() => {
    let active = true

    async function loadTenant() {
      if (tenantId === 'new') {
        setTenantRow(null)
        return
      }

      try {
        const tenant = await getTenantDetail(tenantId)
        if (!active) return

        const isCompany = !!tenant.company_name && !tenant.first_name && !tenant.last_name
        const firstName = isCompany ? tenant.display_name ?? 'Nájemník' : tenant.first_name ?? ''
        const lastName = isCompany ? '' : tenant.last_name ?? ''

        setTenantRow({
          id: `tenant:${tenant.id}`,
          tenant_id: tenant.id,
          first_name: firstName,
          last_name: lastName,
          birth_date: tenant.birth_date ?? '',
          note: 'Nájemník',
          is_archived: !!tenant.is_archived,
          created_at: tenant.created_at ?? '',
          updated_at: tenant.updated_at ?? '',
          created_by: null,
        })
      } catch (err) {
        logger.error('loadTenant failed', err)
      }
    }

    void loadTenant()
    return () => {
      active = false
    }
  }, [tenantId])

  const selectUser = useCallback(
    (userId: string | null) => {
      setSelectedUserId(userId)
      currentIndexRef.current = userId ? users.findIndex((u) => u.id === userId) : -1

      if (userId) {
        const user = users.find((u) => u.id === userId)
        if (user) {
          setFormData({
            first_name: user.first_name,
            last_name: user.last_name,
            birth_date: user.birth_date,
            note: user.note || '',
          })
          setIsArchived(user.is_archived)
          setIsDirty(false)
        }
      } else {
        setFormData({
          first_name: '',
          last_name: '',
          birth_date: '',
          note: '',
        })
        setIsArchived(false)
        setIsDirty(false)
      }
    },
    [users]
  )

  const handleAdd = () => {
    selectUser(null)
  }

  const handlePrevious = () => {
    if (currentIndexRef.current > 0) {
      selectUser(users[currentIndexRef.current - 1].id)
    }
  }

  const handleNext = () => {
    if (currentIndexRef.current >= 0 && currentIndexRef.current < users.length - 1) {
      selectUser(users[currentIndexRef.current + 1].id)
    }
  }

  const handleSave = async () => {
    if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.birth_date) {
      toast.showError('Jméno, příjmení a datum narození jsou povinné')
      return
    }

    try {
      setSaving(true)
      if (selectedUserId) {
        await updateTenantUser(selectedUserId, formData)
        toast.showSuccess('Uživatel byl aktualizován')
      } else {
        await createTenantUser(tenantId, formData)
        toast.showSuccess('Uživatel byl přidán')
      }
      
      // Obnovit seznam
      const refreshed = await listTenantUsers(tenantId, false)
      setUsers(refreshed)

      // Pokud byl nový uživatel, vybrat ho
      if (!selectedUserId && refreshed.length > 0) {
        selectUser(refreshed[refreshed.length - 1].id)
      }

      setIsDirty(false)
    } catch (err: any) {
      logger.error('handleSave failed', err)
      toast.showError(err.message || 'Nepodařilo se uložit uživatele')
    } finally {
      setSaving(false)
    }
  }

  const canGoPrevious = currentIndexRef.current > 0
  const canGoNext = currentIndexRef.current >= 0 && currentIndexRef.current < users.length - 1
  const totalCount = (tenantRow ? 1 : 0) + users.length
  const readOnly = viewMode === 'view'
  const displayRows = tenantRow ? [tenantRow, ...users] : users

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
            Počet celkem: {totalCount} uživatelů
          </span>
        </h3>

        {loading && <div className="detail-form__hint">Načítám uživatele…</div>}

        {!loading && displayRows.length === 0 && <div className="detail-form__hint">Zatím žádní uživatelé.</div>}

        {!loading && displayRows.length > 0 && (
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
                {displayRows.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => {
                      if (readOnly) return
                      if (user.id.startsWith('tenant:')) return
                      selectUser(user.id)
                    }}
                    style={{
                      cursor: !readOnly ? 'pointer' : 'default',
                      borderBottom: '1px solid var(--color-border-soft)',
                      backgroundColor: selectedUserId === user.id ? 'var(--color-primary-soft)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '8px' }}>{user.first_name}</td>
                    <td style={{ padding: '8px' }}>{user.last_name}</td>
                    <td style={{ padding: '8px' }}>
                      {user.birth_date ? new Date(user.birth_date).toLocaleDateString('cs-CZ') : '—'}
                    </td>
                    <td style={{ padding: '8px' }}>{user.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Formulář */}
      {!readOnly && (
      <section className="detail-form__section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 className="detail-form__section-title">Formulář</h3>
          <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={handlePrevious}
                disabled={!canGoPrevious}
                className="common-actions__btn"
                title="Předchozí uživatel"
              >
                <span className="common-actions__icon">{getIcon('chevron-left' as IconKey)}</span>
                <span className="common-actions__label">Předchozí</span>
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={!canGoNext}
                className="common-actions__btn"
                title="Další uživatel"
              >
                <span className="common-actions__icon">{getIcon('chevron-right' as IconKey)}</span>
                <span className="common-actions__label">Další</span>
              </button>
              <button
                type="button"
                onClick={handleAdd}
                className="common-actions__btn"
                title="Přidat nového uživatele"
              >
                <span className="common-actions__icon">{getIcon('add' as IconKey)}</span>
                <span className="common-actions__label">Přidat</span>
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !isDirty}
                className="common-actions__btn"
                title={saving ? 'Ukládám…' : 'Uložit uživatele'}
              >
                <span className="common-actions__icon">{getIcon('save' as IconKey)}</span>
                <span className="common-actions__label">{saving ? 'Ukládám…' : 'Uložit'}</span>
              </button>
          </div>
        </div>

        <div className="detail-form__grid detail-form__grid--narrow">
          {/* Řádek 1: Jméno + Příjmení */}
          <div className="detail-form__field">
            <label className="detail-form__label">
              Jméno <span className="detail-form__required">*</span>
            </label>
            <input
              className="detail-form__input"
              type="text"
              value={formData.first_name}
              onChange={(e) => {
                setFormData({ ...formData, first_name: e.target.value })
                setIsDirty(true)
              }}
            />
          </div>
          <div className="detail-form__field">
            <label className="detail-form__label">
              Příjmení <span className="detail-form__required">*</span>
            </label>
            <input
              className="detail-form__input"
              type="text"
              value={formData.last_name}
              onChange={(e) => {
                setFormData({ ...formData, last_name: e.target.value })
                setIsDirty(true)
              }}
            />
          </div>

          {/* Řádek 2: Datum narození + Archivováno */}
          <div className="detail-form__field">
            <label className="detail-form__label">
              Datum narození <span className="detail-form__required">*</span>
            </label>
            <input
              className="detail-form__input"
              type="date"
              value={formData.birth_date}
              onChange={(e) => {
                setFormData({ ...formData, birth_date: e.target.value })
                setIsDirty(true)
              }}
            />
          </div>
          <div className="detail-form__field">
            <label className="detail-form__label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={isArchived}
                onChange={(e) => {
                  setIsArchived(e.target.checked)
                  setIsDirty(true)
                }}
              />
              Archivováno
            </label>
          </div>

          {/* Řádek 3: Poznámka přes oba sloupce */}
          <div className="detail-form__field detail-form__field--span-2">
            <label className="detail-form__label">Poznámka</label>
            <textarea
              className="detail-form__input"
              value={formData.note || ''}
              onChange={(e) => {
                setFormData({ ...formData, note: e.target.value })
                setIsDirty(true)
              }}
              rows={3}
              placeholder="např. manželka, syn, spoluuživatel garáže..."

            />
          </div>
        </div>
      </section>
      )}
    </div>
  )
}
