// FILE: app/modules/060-smlouva/components/ContractUsersTab.tsx
// PURPOSE: Záložka uživatelů ve smlouvě – výběr z uživatelů nájemníka
// NOTES: Umožňuje vyloučit uživatele ze smlouvy, nájemník je vždy zahrnut

'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { listTenantUsers, type TenantUser } from '@/app/lib/services/tenantUsers'
import { listContractUsers, setContractUsers } from '@/app/lib/services/contractUsers'
import { useToast } from '@/app/UI/Toast'
import createLogger from '@/app/lib/logger'

const logger = createLogger('ContractUsersTab')

type Props = {
  contractId: string | null
  tenantId: string | null
  tenantLabel?: string | null
  readOnly?: boolean
  onSelectionCountChange?: (count: number) => void
}

type SelectableUser = TenantUser & { selected: boolean }

export default function ContractUsersTab({
  contractId,
  tenantId,
  tenantLabel = null,
  readOnly = false,
  onSelectionCountChange,
}: Props) {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<SelectableUser[]>([])
  const [dirty, setDirty] = useState(false)
  const [initialSelected, setInitialSelected] = useState<string[]>([])

  const canLoad = !!contractId && contractId !== 'new' && !!tenantId

  const selectedCount = useMemo(() => {
    const selected = users.filter((u) => u.selected).length
    return (tenantId ? 1 : 0) + selected
  }, [users, tenantId])

  useEffect(() => {
    onSelectionCountChange?.(selectedCount)
  }, [selectedCount, onSelectionCountChange])

  const loadUsers = useCallback(async () => {
    if (!canLoad) {
      setUsers([])
      setLoading(false)
      setDirty(false)
      return
    }

    try {
      setLoading(true)
      const [tenantUsers, contractUsers] = await Promise.all([
        listTenantUsers(tenantId as string, false),
        listContractUsers(contractId as string, false),
      ])

      const selectedIds = contractUsers.map((r) => r.tenant_user_id)
      setInitialSelected(selectedIds)

      const mapped = tenantUsers.map((u) => ({
        ...u,
        selected: selectedIds.includes(u.id),
      }))

      setUsers(mapped)
      setDirty(false)
    } catch (err: any) {
      logger.error('loadUsers failed', err)
      toast.showError(err?.message ?? 'Nepodařilo se načíst uživatele nájemníka')
    } finally {
      setLoading(false)
    }
  }, [canLoad, contractId, tenantId, toast])

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

  const selectAll = useCallback(() => {
    if (readOnly) return
    setUsers((prev) => {
      const next = prev.map((u) => ({ ...u, selected: true }))
      const selectedIds = next.map((u) => u.id)
      setDirty(JSON.stringify(selectedIds) !== JSON.stringify(initialSelected))
      return next
    })
  }, [initialSelected, readOnly])

  const clearAll = useCallback(() => {
    if (readOnly) return
    setUsers((prev) => {
      const next = prev.map((u) => ({ ...u, selected: false }))
      const selectedIds: string[] = []
      setDirty(JSON.stringify(selectedIds) !== JSON.stringify(initialSelected))
      return next
    })
  }, [initialSelected, readOnly])

  const handleSave = useCallback(async () => {
    if (!contractId || contractId === 'new') return
    try {
      const selectedIds = users.filter((u) => u.selected).map((u) => u.id)
      await setContractUsers(contractId, selectedIds)
      setInitialSelected(selectedIds)
      setDirty(false)
      toast.showSuccess('Uživatelé smlouvy uloženi')
    } catch (err: any) {
      logger.error('save contract users failed', err)
      toast.showError(err?.message ?? 'Nepodařilo se uložit uživatele smlouvy')
    }
  }, [contractId, users, toast])

  if (!tenantId) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        Nejprve vyber nájemníka.
      </div>
    )
  }

  if (!canLoad) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        Uživatelé smlouvy budou dostupní po uložení smlouvy.
      </div>
    )
  }

  return (
    <div className="detail-form">
      <section className="detail-form__section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 className="detail-form__section-title">
            Seznam uživatelů
            <span style={{ marginLeft: 12, fontWeight: 400, fontSize: 13, color: 'var(--color-text-subtle)' }}>
              Počet celkem: {selectedCount} uživatelů
            </span>
          </h3>
          {!readOnly && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="common-actions__btn" onClick={selectAll}>
                Vybrat všechny
              </button>
              <button type="button" className="common-actions__btn" onClick={clearAll}>
                Vyčistit výběr
              </button>
              <button type="button" className="common-actions__btn" onClick={handleSave} disabled={!dirty}>
                Uložit výběr
              </button>
            </div>
          )}
        </div>

        <div className="detail-form__hint" style={{ marginBottom: 12 }}>
          Hlavní nájemník ({tenantLabel || '—'}) je vždy zahrnut.
        </div>

        {loading && <div className="detail-form__hint">Načítám uživatele…</div>}

        {!loading && users.length === 0 && <div className="detail-form__hint">Zatím žádní uživatelé nájemníka.</div>}

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
                  <tr
                    key={user.id}
                    style={{ borderBottom: '1px solid var(--color-border-soft)' }}
                  >
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
                    <td style={{ padding: '8px' }}>{user.birth_date ? new Date(user.birth_date).toLocaleDateString('cs-CZ') : '—'}</td>
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
