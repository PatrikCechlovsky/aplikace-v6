// FILE: app/modules/060-smlouva/components/ContractDelegatesTab.tsx
// PURPOSE: Záložka zástupců ve smlouvě – výběr zástupce nájemníka a pronajímatele
// NOTES: Povinné pro firmy/spolky při aktivaci smlouvy

'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { getTenantDelegates } from '@/app/lib/services/tenants'
import { getLandlordDelegates } from '@/app/lib/services/landlords'
import { useToast } from '@/app/UI/Toast'
import createLogger from '@/app/lib/logger'

const logger = createLogger('ContractDelegatesTab')

type Option = { id: string; label: string }

type Props = {
  tenantId: string | null
  landlordId: string | null
  tenantSubjectType?: string | null
  landlordSubjectType?: string | null
  tenantDelegateId: string | null
  landlordDelegateId: string | null
  readOnly?: boolean
  onChangeTenantDelegate: (id: string | null) => void
  onChangeLandlordDelegate: (id: string | null) => void
}

export default function ContractDelegatesTab({
  tenantId,
  landlordId,
  tenantSubjectType,
  landlordSubjectType,
  tenantDelegateId,
  landlordDelegateId,
  readOnly = false,
  onChangeTenantDelegate,
  onChangeLandlordDelegate,
}: Props) {
  const toast = useToast()
  const [tenantOptions, setTenantOptions] = useState<Option[]>([])
  const [landlordOptions, setLandlordOptions] = useState<Option[]>([])

  const tenantRequired = useMemo(() => ['firma', 'spolek'].includes(String(tenantSubjectType || '')),
    [tenantSubjectType])
  const landlordRequired = useMemo(() => ['firma', 'spolek'].includes(String(landlordSubjectType || '')),
    [landlordSubjectType])

  useEffect(() => {
    let mounted = true

    async function loadDelegates() {
      try {
        if (tenantId) {
          const rows = await getTenantDelegates(tenantId)
          if (mounted) setTenantOptions(rows.map((d) => ({ id: d.id, label: d.displayName || '—' })))
        } else {
          setTenantOptions([])
        }

        if (landlordId) {
          const rows = await getLandlordDelegates(landlordId)
          if (mounted) setLandlordOptions(rows.map((d) => ({ id: d.id, label: d.displayName || '—' })))
        } else {
          setLandlordOptions([])
        }
      } catch (err: any) {
        logger.error('loadDelegates failed', err)
        toast.showError(err?.message ?? 'Nepodařilo se načíst zástupce')
      }
    }

    void loadDelegates()
    return () => {
      mounted = false
    }
  }, [tenantId, landlordId, toast])

  return (
    <div className="detail-form">
      <section className="detail-form__section">
        <h3 className="detail-form__section-title">Zástupci</h3>

        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">Zástupce nájemníka{tenantRequired ? ' *' : ''}</label>
            <select
              className={readOnly ? 'detail-form__input detail-form__input--readonly' : 'detail-form__input'}
              value={tenantDelegateId ?? ''}
              onChange={(e) => onChangeTenantDelegate(e.target.value || null)}
              disabled={readOnly}
            >
              <option value="">— vyberte zástupce —</option>
              {tenantOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="detail-form__field">
            <label className="detail-form__label">Zástupce pronajímatele{landlordRequired ? ' *' : ''}</label>
            <select
              className={readOnly ? 'detail-form__input detail-form__input--readonly' : 'detail-form__input'}
              value={landlordDelegateId ?? ''}
              onChange={(e) => onChangeLandlordDelegate(e.target.value || null)}
              disabled={readOnly}
            >
              <option value="">— vyberte zástupce —</option>
              {landlordOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="detail-form__hint" style={{ marginTop: 8 }}>
          Zástupce je povinný pro firmu/spolek při aktivaci smlouvy.
        </div>
      </section>
    </div>
  )
}
