// FILE: app/modules/060-smlouva/components/ContractAccountsTab.tsx
// PURPOSE: Záložka účtů ve smlouvě – výběr účtu nájemníka a pronajímatele
// NOTES: Oba účty jsou povinné pro aktivaci smlouvy

'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { listBankAccounts, type BankAccountWithBank } from '@/app/lib/services/bankAccounts'
import { useToast } from '@/app/UI/Toast'
import createLogger from '@/app/lib/logger'

const logger = createLogger('ContractAccountsTab')

type Option = { id: string; label: string }

type Props = {
  tenantId: string | null
  landlordId: string | null
  tenantAccountId: string | null
  landlordAccountId: string | null
  readOnly?: boolean
  onChangeTenantAccount: (id: string | null) => void
  onChangeLandlordAccount: (id: string | null) => void
}

function formatAccount(row: BankAccountWithBank): string {
  const number = row.account_number || row.iban || '—'
  const bank = row.bank_code ? `/${row.bank_code}` : ''
  const label = row.label ? ` (${row.label})` : ''
  return `${number}${bank}${label}`
}

export default function ContractAccountsTab({
  tenantId,
  landlordId,
  tenantAccountId,
  landlordAccountId,
  readOnly = false,
  onChangeTenantAccount,
  onChangeLandlordAccount,
}: Props) {
  const toast = useToast()
  const [tenantAccounts, setTenantAccounts] = useState<Option[]>([])
  const [landlordAccounts, setLandlordAccounts] = useState<Option[]>([])

  useEffect(() => {
    let mounted = true

    async function loadAccounts() {
      try {
        if (tenantId) {
          const rows = await listBankAccounts(tenantId)
          if (mounted) setTenantAccounts(rows.filter((r) => !r.is_archived).map((r) => ({ id: r.id, label: formatAccount(r) })))
        } else {
          setTenantAccounts([])
        }

        if (landlordId) {
          const rows = await listBankAccounts(landlordId)
          if (mounted) setLandlordAccounts(rows.filter((r) => !r.is_archived).map((r) => ({ id: r.id, label: formatAccount(r) })))
        } else {
          setLandlordAccounts([])
        }
      } catch (err: any) {
        logger.error('loadAccounts failed', err)
        toast.showError(err?.message ?? 'Nepodařilo se načíst účty')
      }
    }

    void loadAccounts()
    return () => {
      mounted = false
    }
  }, [tenantId, landlordId, toast])

  const tenantRequired = useMemo(() => true, [])
  const landlordRequired = useMemo(() => true, [])

  return (
    <div className="detail-form">
      <section className="detail-form__section">
        <h3 className="detail-form__section-title">Účty</h3>

        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">Účet nájemníka{tenantRequired ? ' *' : ''}</label>
            <select
              className={readOnly ? 'detail-form__input detail-form__input--readonly' : 'detail-form__input'}
              value={tenantAccountId ?? ''}
              onChange={(e) => onChangeTenantAccount(e.target.value || null)}
              disabled={readOnly}
            >
              <option value="">— vyberte účet —</option>
              {tenantAccounts.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="detail-form__field">
            <label className="detail-form__label">Účet pronajímatele{landlordRequired ? ' *' : ''}</label>
            <select
              className={readOnly ? 'detail-form__input detail-form__input--readonly' : 'detail-form__input'}
              value={landlordAccountId ?? ''}
              onChange={(e) => onChangeLandlordAccount(e.target.value || null)}
              disabled={readOnly}
            >
              <option value="">— vyberte účet —</option>
              {landlordAccounts.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="detail-form__hint" style={{ marginTop: 8 }}>
          Účty jsou povinné pro aktivaci smlouvy.
        </div>
      </section>
    </div>
  )
}
