// FILE: app/modules/060-smlouva/components/EvidenceSheetServicesTab.tsx
// PURPOSE: Záložka služeb evidenčního listu
// NOTES: Položky služeb s jednotkou byt/osoba a výpočtem celku

'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  listEvidenceSheetServices,
  saveEvidenceSheetServices,
  type EvidenceSheetServiceInput,
} from '@/app/lib/services/contractEvidenceSheets'
import { useToast } from '@/app/UI/Toast'
import createLogger from '@/app/lib/logger'

const logger = createLogger('EvidenceSheetServicesTab')

type ServiceRow = EvidenceSheetServiceInput & { id: string }

type Props = {
  sheetId: string
  totalPersons: number
  readOnly?: boolean
  onTotalChange?: (total: number) => void
}

const emptyRow = (): ServiceRow => ({
  id: `tmp-${Math.random().toString(36).slice(2)}`,
  service_name: '',
  unit_type: 'flat',
  unit_price: 0,
  quantity: 1,
  total_amount: 0,
})

export default function EvidenceSheetServicesTab({
  sheetId,
  totalPersons,
  readOnly = false,
  onTotalChange,
}: Props) {
  const toast = useToast()
  const [rows, setRows] = useState<ServiceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [dirty, setDirty] = useState(false)

  const recomputeRow = useCallback((row: ServiceRow) => {
    const quantity = row.unit_type === 'person' ? totalPersons : row.quantity || 1
    const total = Number(row.unit_price || 0) * quantity
    return { ...row, quantity, total_amount: total }
  }, [totalPersons])

  const servicesTotal = useMemo(() => rows.reduce((sum, r) => sum + (r.total_amount || 0), 0), [rows])

  useEffect(() => {
    onTotalChange?.(servicesTotal)
  }, [servicesTotal, onTotalChange])

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await listEvidenceSheetServices(sheetId)
      const mapped: ServiceRow[] = data.map((s, idx) => ({
        id: s.id,
        service_name: s.service_name,
        unit_type: s.unit_type,
        unit_price: Number(s.unit_price),
        quantity: s.quantity,
        total_amount: Number(s.total_amount),
        order_index: s.order_index ?? idx,
      }))

      setRows(mapped.map(recomputeRow))
      setDirty(false)
    } catch (err: any) {
      logger.error('load services failed', err)
      toast.showError(err?.message ?? 'Nepodařilo se načíst služby evidenčního listu')
    } finally {
      setLoading(false)
    }
  }, [sheetId, toast, recomputeRow])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setRows((prev) => prev.map(recomputeRow))
  }, [recomputeRow])

  const addRow = useCallback(() => {
    if (readOnly) return
    setRows((prev) => [...prev, emptyRow()])
    setDirty(true)
  }, [readOnly])

  const removeRow = useCallback((id: string) => {
    if (readOnly) return
    setRows((prev) => prev.filter((r) => r.id !== id))
    setDirty(true)
  }, [readOnly])

  const updateRow = useCallback((id: string, patch: Partial<ServiceRow>) => {
    if (readOnly) return
    setRows((prev) => prev.map((r) => (r.id === id ? recomputeRow({ ...r, ...patch }) : r)))
    setDirty(true)
  }, [readOnly, recomputeRow])

  const handleSave = useCallback(async () => {
    try {
      const payload: EvidenceSheetServiceInput[] = rows.map((r, idx) => ({
        service_name: r.service_name,
        unit_type: r.unit_type,
        unit_price: r.unit_price,
        quantity: r.unit_type === 'person' ? totalPersons : r.quantity,
        total_amount: r.total_amount,
        order_index: idx,
      }))

      await saveEvidenceSheetServices(sheetId, payload)
      setDirty(false)
      toast.showSuccess('Služby evidenčního listu uloženy')
    } catch (err: any) {
      logger.error('save services failed', err)
      toast.showError(err?.message ?? 'Nepodařilo se uložit služby evidenčního listu')
    }
  }, [rows, sheetId, toast, totalPersons])

  if (loading) {
    return <div className="detail-form__hint">Načítám služby…</div>
  }

  return (
    <div className="detail-form">
      <section className="detail-form__section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 className="detail-form__section-title">Služby</h3>
          {!readOnly && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="common-actions__btn" onClick={addRow}>
                Přidat službu
              </button>
              <button type="button" className="common-actions__btn" onClick={handleSave} disabled={!dirty}>
                Uložit služby
              </button>
            </div>
          )}
        </div>

        {rows.length === 0 && <div className="detail-form__hint">Zatím žádné služby.</div>}

        {rows.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Služba</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Jednotka</th>
                  <th style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>Cena / jednotku</th>
                  <th style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>Počet</th>
                  <th style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>Celkem</th>
                  {!readOnly && <th style={{ padding: '8px' }} />}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid var(--color-border-soft)' }}>
                    <td style={{ padding: '8px' }}>
                      <input
                        className="detail-form__input"
                        value={row.service_name}
                        onChange={(e) => updateRow(row.id, { service_name: e.target.value })}
                        readOnly={readOnly}
                      />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <select
                        className="detail-form__input"
                        value={row.unit_type}
                        onChange={(e) => updateRow(row.id, { unit_type: e.target.value as 'flat' | 'person' })}
                        disabled={readOnly}
                      >
                        <option value="flat">byt</option>
                        <option value="person">osoba</option>
                      </select>
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>
                      <input
                        className="detail-form__input"
                        type="number"
                        value={row.unit_price}
                        onChange={(e) => updateRow(row.id, { unit_price: Number(e.target.value || 0) })}
                        readOnly={readOnly}
                      />
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>
                      <input
                        className="detail-form__input"
                        type="number"
                        value={row.unit_type === 'person' ? totalPersons : row.quantity}
                        onChange={(e) => updateRow(row.id, { quantity: Number(e.target.value || 1) })}
                        readOnly={readOnly || row.unit_type === 'person'}
                      />
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{row.total_amount}</td>
                    {!readOnly && (
                      <td style={{ padding: '8px', textAlign: 'right' }}>
                        <button type="button" className="common-actions__btn" onClick={() => removeRow(row.id)}>
                          Odebrat
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="detail-form__hint" style={{ marginTop: 12 }}>
          Služby celkem: <strong>{servicesTotal} Kč</strong>
        </div>
      </section>
    </div>
  )
}
