// FILE: app/modules/060-smlouva/components/EvidenceSheetServicesTab.tsx
// PURPOSE: Záložka služeb evidenčního listu (seznam + detail)
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
import ListView, { type ListViewColumn, type ListViewRow, type ListViewSortState } from '@/app/UI/ListView'
import { getIcon, type IconKey } from '@/app/UI/icons'

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

const columns: ListViewColumn[] = [
  { key: 'service_name', label: 'Služba', sortable: true, resizable: true, minWidthPx: 180 },
  { key: 'unit_type', label: 'Jednotka', sortable: true, resizable: true, minWidthPx: 100 },
  { key: 'unit_price', label: 'Cena / jednotku', sortable: true, align: 'right', resizable: true, minWidthPx: 140 },
  { key: 'quantity', label: 'Počet', sortable: true, align: 'right', resizable: true, minWidthPx: 90 },
  { key: 'total_amount', label: 'Celkem', sortable: true, align: 'right', resizable: true, minWidthPx: 120 },
]

function getUnitLabel(value: ServiceRow['unit_type']) {
  return value === 'person' ? 'osoba' : 'byt'
}

function getSortValue(row: ServiceRow, key: string): string | number {
  switch (key) {
    case 'service_name':
      return row.service_name?.toLowerCase() ?? ''
    case 'unit_type':
      return row.unit_type
    case 'unit_price':
      return row.unit_price ?? 0
    case 'quantity':
      return row.quantity ?? 0
    case 'total_amount':
      return row.total_amount ?? 0
    default:
      return ''
  }
}

export default function EvidenceSheetServicesTab({
  sheetId,
  totalPersons,
  readOnly = false,
  onTotalChange,
}: Props) {
  const toast = useToast()
  const [rows, setRows] = useState<ServiceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list')
  const [detailMode, setDetailMode] = useState<'read' | 'edit' | 'create'>('read')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [formValue, setFormValue] = useState<ServiceRow>(() => emptyRow())
  const [searchText, setSearchText] = useState('')
  const [sort, setSort] = useState<ListViewSortState>({ key: 'service_name', dir: 'asc' })
  const [saving, setSaving] = useState(false)

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
      setSelectedId(null)
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
    setFormValue((prev) => recomputeRow(prev))
  }, [recomputeRow])

  const openDetailRead = useCallback((id?: string) => {
    const resolvedId = id ?? selectedId
    if (!resolvedId) return
    const row = rows.find((r) => r.id === resolvedId)
    if (!row) return
    setFormValue({ ...row })
    setDetailMode('read')
    setViewMode('detail')
  }, [rows, selectedId])

  const openDetailEdit = useCallback(() => {
    if (!selectedId) return
    const row = rows.find((r) => r.id === selectedId)
    if (!row) return
    setFormValue({ ...row })
    setDetailMode('edit')
    setViewMode('detail')
  }, [rows, selectedId])

  const openDetailCreate = useCallback(() => {
    setFormValue(recomputeRow(emptyRow()))
    setDetailMode('create')
    setViewMode('detail')
  }, [recomputeRow])

  const closeDetail = useCallback(() => {
    setViewMode('list')
  }, [])

  const persistRows = useCallback(async (nextRows: ServiceRow[]) => {
    const payload: EvidenceSheetServiceInput[] = nextRows.map((r, idx) => ({
      service_name: r.service_name,
      unit_type: r.unit_type,
      unit_price: r.unit_price,
      quantity: r.unit_type === 'person' ? totalPersons : r.quantity,
      total_amount: r.total_amount,
      order_index: idx,
    }))

    await saveEvidenceSheetServices(sheetId, payload)
  }, [sheetId, totalPersons])

  const handleSave = useCallback(async () => {
    if (readOnly) return

    if (!formValue.service_name.trim()) {
      toast.showError('Vyplňte název služby')
      return
    }

    try {
      setSaving(true)
      const updatedValue = recomputeRow(formValue)
      const nextRows = detailMode === 'create'
        ? [...rows, updatedValue]
        : rows.map((r) => (r.id === updatedValue.id ? updatedValue : r))

      await persistRows(nextRows)
      toast.showSuccess('Služby evidenčního listu uloženy')
      await load()
      setViewMode('list')
    } catch (err: any) {
      logger.error('save services failed', err)
      toast.showError(err?.message ?? 'Nepodařilo se uložit služby evidenčního listu')
    } finally {
      setSaving(false)
    }
  }, [detailMode, formValue, load, persistRows, readOnly, rows, toast, recomputeRow])

  const handleDelete = useCallback(async () => {
    if (readOnly || !selectedId) return
    const row = rows.find((r) => r.id === selectedId)
    if (!row) return
    const shouldContinue = window.confirm(`Opravdu odebrat službu "${row.service_name}"?`)
    if (!shouldContinue) return

    try {
      setSaving(true)
      const nextRows = rows.filter((r) => r.id !== selectedId)
      await persistRows(nextRows)
      toast.showSuccess('Služba odebrána')
      await load()
      setViewMode('list')
    } catch (err: any) {
      logger.error('delete service failed', err)
      toast.showError(err?.message ?? 'Nepodařilo se odebrat službu evidenčního listu')
    } finally {
      setSaving(false)
    }
  }, [load, persistRows, readOnly, rows, selectedId, toast])

  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase()
    if (!query) return rows
    return rows.filter((row) => row.service_name.toLowerCase().includes(query))
  }, [rows, searchText])

  const sortedRows = useMemo(() => {
    const data = [...filteredRows]
    if (!sort) return data
    const dir = sort.dir === 'asc' ? 1 : -1
    return data.sort((a, b) => {
      const aVal = getSortValue(a, sort.key)
      const bVal = getSortValue(b, sort.key)
      if (aVal < bVal) return -1 * dir
      if (aVal > bVal) return 1 * dir
      return 0
    })
  }, [filteredRows, sort])

  const listRows: ListViewRow<ServiceRow>[] = useMemo(() => sortedRows.map((row) => ({
    id: row.id,
    raw: row,
    data: {
      service_name: row.service_name || '—',
      unit_type: getUnitLabel(row.unit_type),
      unit_price: row.unit_price ?? 0,
      quantity: row.quantity ?? 0,
      total_amount: row.total_amount ?? 0,
    },
  })), [sortedRows])

  if (loading) {
    return <div className="detail-form__hint">Načítám služby…</div>
  }

  const isFormReadOnly = readOnly || detailMode === 'read'
  const inputClass = isFormReadOnly ? 'detail-form__input detail-form__input--readonly' : 'detail-form__input'

  return (
    <div className="detail-form detail-form--fill">
      {viewMode === 'list' && (
        <section className="detail-form__section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 className="detail-form__section-title">Seznam služeb</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              {!readOnly && (
                <button type="button" className="common-actions__btn" onClick={openDetailCreate}>
                  <span className="common-actions__icon">{getIcon('add' as IconKey)}</span>
                  <span className="common-actions__label">Nová</span>
                </button>
              )}
              {selectedId && (
                <>
                  <button type="button" className="common-actions__btn" onClick={() => openDetailRead()}>
                    <span className="common-actions__icon">{getIcon('eye' as IconKey)}</span>
                    <span className="common-actions__label">Detail</span>
                  </button>
                  {!readOnly && (
                    <button type="button" className="common-actions__btn" onClick={openDetailEdit}>
                      <span className="common-actions__icon">{getIcon('edit' as IconKey)}</span>
                      <span className="common-actions__label">Upravit</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="detail-form__hint">Zatím nejsou přiřazeny žádné služby.</div>
          ) : (
            <ListView
              columns={columns}
              rows={listRows}
              filterValue={searchText}
              onFilterChange={setSearchText}
              selectedId={selectedId}
              onRowClick={(row: ListViewRow) => setSelectedId(String(row.id))}
              onRowDoubleClick={(row: ListViewRow) => {
                setSelectedId(String(row.id))
                openDetailRead(String(row.id))
              }}
              sort={sort}
              onSortChange={setSort}
              emptyText="Zatím nejsou přiřazeny žádné služby."
            />
          )}

          <div className="detail-form__hint" style={{ marginTop: 12 }}>
            Služby celkem: <strong>{servicesTotal} Kč</strong>
          </div>
        </section>
      )}

      {viewMode === 'detail' && (
        <section className="detail-form__section detail-form__section--scroll">
          <div className="detail-subdetail">
            <div className="detail-subdetail__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 className="detail-form__section-title" style={{ marginBottom: 0 }}>
                {detailMode === 'create' ? 'Nová služba' : 'Detail služby'}
              </h3>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {detailMode === 'read' && !readOnly && selectedId && (
                  <button type="button" className="common-actions__btn" onClick={openDetailEdit}>
                    <span className="common-actions__icon">{getIcon('edit' as IconKey)}</span>
                    <span className="common-actions__label">Upravit</span>
                  </button>
                )}

                {(detailMode === 'edit' || detailMode === 'create') && (
                  <button type="button" className="common-actions__btn" onClick={() => void handleSave()} disabled={saving}>
                    <span className="common-actions__icon">{getIcon('save' as IconKey)}</span>
                    <span className="common-actions__label">Uložit</span>
                  </button>
                )}

                {!readOnly && detailMode !== 'create' && (
                  <button type="button" className="common-actions__btn" onClick={() => void handleDelete()} disabled={saving}>
                    <span className="common-actions__icon">{getIcon('delete' as IconKey)}</span>
                    <span className="common-actions__label">Odebrat</span>
                  </button>
                )}

                <button type="button" className="common-actions__btn" onClick={closeDetail}>
                  <span className="common-actions__icon">{getIcon('close' as IconKey)}</span>
                  <span className="common-actions__label">Zavřít</span>
                </button>
              </div>
            </div>

            <div className="detail-subdetail__content">
              <div className="detail-form__grid detail-form__grid--narrow">
                <div className="detail-form__field detail-form__field--span-2">
                  <label className="detail-form__label">Služba *</label>
                  <input
                    className={inputClass}
                    value={formValue.service_name}
                    onChange={(e) => setFormValue((prev) => recomputeRow({ ...prev, service_name: e.target.value }))}
                    readOnly={isFormReadOnly}
                  />
                </div>

                <div className="detail-form__field">
                  <label className="detail-form__label">Jednotka</label>
                  <select
                    className={inputClass}
                    value={formValue.unit_type}
                    onChange={(e) => setFormValue((prev) => recomputeRow({ ...prev, unit_type: e.target.value as ServiceRow['unit_type'] }))}
                    disabled={isFormReadOnly}
                  >
                    <option value="flat">byt</option>
                    <option value="person">osoba</option>
                  </select>
                </div>

                <div className="detail-form__field">
                  <label className="detail-form__label">Cena / jednotku</label>
                  <input
                    className={inputClass}
                    type="number"
                    value={formValue.unit_price}
                    onChange={(e) => setFormValue((prev) => recomputeRow({ ...prev, unit_price: Number(e.target.value || 0) }))}
                    readOnly={isFormReadOnly}
                  />
                </div>

                <div className="detail-form__field">
                  <label className="detail-form__label">Počet</label>
                  <input
                    className={inputClass}
                    type="number"
                    value={formValue.unit_type === 'person' ? totalPersons : formValue.quantity}
                    onChange={(e) => setFormValue((prev) => recomputeRow({ ...prev, quantity: Number(e.target.value || 1) }))}
                    readOnly={isFormReadOnly || formValue.unit_type === 'person'}
                  />
                </div>

                <div className="detail-form__field">
                  <label className="detail-form__label">Celkem</label>
                  <input className="detail-form__input detail-form__input--readonly" value={formValue.total_amount} readOnly />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
