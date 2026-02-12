// FILE: app/modules/060-smlouva/components/EvidenceSheetUsersTab.tsx
// PURPOSE: Záložka osob evidenčního listu (spolubydlící)
// NOTES: Výběr z tenant_users, nájemník je vždy započítán

'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { listTenantUsers, type TenantUser } from '@/app/lib/services/tenantUsers'
import { listEvidenceSheetUsers, setEvidenceSheetUsers } from '@/app/lib/services/contractEvidenceSheets'
import { useToast } from '@/app/UI/Toast'
import createLogger from '@/app/lib/logger'

const logger = createLogger('EvidenceSheetUsersTab')

type Props = {
  sheetId: string
  tenantId: string | null
  tenantLabel?: string | null
  readOnly?: boolean
  onCountChange?: (count: number) => void
}

type SelectableUser = TenantUser & { selected: boolean }

export default function EvidenceSheetUsersTab({
  sheetId,
  tenantId,
  tenantLabel = null,
  readOnly = false,
  onCountChange,
}: Props) {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<SelectableUser[]>([])
  const [dirty, setDirty] = useState(false)
  const [initialSelected, setInitialSelected] = useState<string[]>([])

  const selectedCount = useMemo(() => {
    const selected = users.filter((u) => u.selected).length
    return (tenantId ? 1 : 0) + selected
  }, [users, tenantId])

  useEffect(() => {
    onCountChange?.(selectedCount)
  }, [selectedCount, onCountChange])

  const loadUsers = useCallback(async () => {
    if (!tenantId) {
      setUsers([])
      setLoading(false)
      setDirty(false)
      return
    }

    try {
      setLoading(true)
      const [tenantUsers, selectedRows] = await Promise.all([
        listTenantUsers(tenantId, false),
        listEvidenceSheetUsers(sheetId),
      ])

      const selectedIds = selectedRows
        .map((r) => r.tenant_user_id)
        .filter((id): id is string => !!id)

      setInitialSelected(selectedIds)

      const mapped = tenantUsers.map((u) => ({
        ...u,
        selected: selectedIds.includes(u.id),
      }))

      setUsers(mapped)
      setDirty(false)
    } catch (err: any) {
      logger.error('loadUsers failed', err)
      toast.showError(err?.message ?? 'Nepodařilo se načíst osoby evidenčního listu')
    } finally {
      setLoading(false)
    }
  }, [sheetId, tenantId, toast])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  const toggleUser = useCallback(
    (id: string) => {
      if (readOnly) return
      setUsers((prev) => {
        const next = prev.map((u) => (u.id === id ? { ...u, selected: !u.selected } : u))
        const selectedIds = next.filter((u) => u.selected).map((u) => u.id)
        setDirty(JSON.stringify(selectedIds) !== JSON.stringify(initialSelected))
        return next
      })
    },
    [initialSelected, readOnly]
  )

  const handleSave = useCallback(async () => {
    try {
      const selected = users.filter((u) => u.selected)
      await setEvidenceSheetUsers(sheetId, selected)
      setInitialSelected(selected.map((u) => u.id))
      setDirty(false)
      toast.showSuccess('Osoby evidenčního listu uloženy')
    } catch (err: any) {
      logger.error('save evidence users failed', err)
      toast.showError(err?.message ?? 'Nepodařilo se uložit osoby evidenčního listu')
    }
  }, [sheetId, users, toast])

  if (!tenantId) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        Nejprve vyber nájemníka ve smlouvě.
      </div>
    )
  }

  return (
    <div className="detail-form">
      <section className="detail-form__section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 className="detail-form__section-title">
            Osoby
            <span style={{ marginLeft: 12, fontWeight: 400, fontSize: 13, color: 'var(--color-text-subtle)' }}>
              Počet celkem: {selectedCount} osob
            </span>
          </h3>
          {!readOnly && (
            <button type="button" className="common-actions__btn" onClick={handleSave} disabled={!dirty}>
              Uložit výběr
            </button>
          )}
        </div>

        <div className="detail-form__hint" style={{ marginBottom: 12 }}>
          Hlavní nájemník ({tenantLabel || '—'}) je vždy započítán.
        </div>

        {loading && <div className="detail-form__hint">Načítám osoby…</div>}

        {!loading && users.length === 0 && <div className="detail-form__hint">Zatím žádní spolubydlící.</div>}

        {!loading && users.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Vybrat</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Jméno</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Příjmení</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Datum narození</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--color-border-soft)' }}>
                    <td style={{ padding: '8px' }}>
                      <input
                        type="checkbox"
                        checked={user.selected}
                        onChange={() => toggleUser(user.id)}
                        disabled={readOnly}
                      />
                    </td>
                    <td style={{ padding: '8px' }}>{user.first_name}</td>
                    <td style={{ padding: '8px' }}>{user.last_name}</td>
                    <td style={{ padding: '8px' }}>
                      {user.birth_date ? new Date(user.birth_date).toLocaleDateString('cs-CZ') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
