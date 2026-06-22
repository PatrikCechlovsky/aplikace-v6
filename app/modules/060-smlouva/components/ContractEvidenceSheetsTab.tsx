// FILE: app/modules/060-smlouva/components/ContractEvidenceSheetsTab.tsx
// PURPOSE: Záložka evidenčních listů smlouvy (list view)
// NOTES: Kliknutí otevře modální dialog, list se refreshuje po zavření

'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import ListView, { type ListViewRow, type ListViewSortState } from '@/app/UI/ListView'
import ListViewColumnsDrawer from '@/app/UI/ListViewColumnsDrawer'
import { useToast } from '@/app/UI/Toast'
import { getIcon, type IconKey } from '@/app/UI/icons'
import createLogger from '@/app/lib/logger'
import { applyColumnPrefs, loadViewPrefs, saveViewPrefs, type ViewPrefs } from '@/app/lib/services/viewPrefs'
import {
  listEvidenceSheets,
  createEvidenceSheetDraft,
  deleteEvidenceSheetDraft,
  activateEvidenceSheet,
  type EvidenceSheetRow,
} from '@/app/lib/services/contractEvidenceSheets'
import {
  EVIDENCE_SHEETS_BASE_COLUMNS,
  EVIDENCE_SHEETS_DEFAULT_SORT,
  EVIDENCE_SHEETS_VIEW_KEY,
} from '../evidenceSheetsColumns'
import EvidenceSheetDetailFrame from './EvidenceSheetDetailFrame'

const logger = createLogger('ContractEvidenceSheetsTab')

type Props = {
  contractId: string
  contractNumber: string | null
  contractSignedAt: string | null
  tenantId: string | null
  tenantLabel?: string | null
  tenantSubjectType?: string | null
  tenantBirthDate?: string | null
  landlordName?: string | null
  propertyName?: string | null
  unitName?: string | null
  contractValidTo?: string | null
  rentAmount: number | null
  readOnly?: boolean
  onCountChange?: (count: number) => void
  onNavigateToSheet?: (sheetId: string) => void
}

function isActiveSheet(row: EvidenceSheetRow): boolean {
  const today = new Date().toISOString().split('T')[0]
  const validFrom = row.valid_from
  const validTo = row.valid_to
  return !!validFrom && validFrom <= today && (!validTo || validTo >= today)
}

function getSheetBadge(row: EvidenceSheetRow): string | undefined {
  if (row.status === 'draft') return 'KONCEPT'
  if (row.status === 'archived') return 'ARCHIV'

  const today = new Date().toISOString().split('T')[0]
  if (row.valid_to && row.valid_to < today) return 'UKONČENÝ'
  if (row.valid_from && row.valid_from > today) return `AKTIVNÍ OD ${row.valid_from}`
  if (isActiveSheet(row)) return 'AKTIVNÍ'

  return undefined
}

type EvidenceSheetListItem = {
  id: string
  sheetNumber: number
  statusLabel: string
  validFrom: string
  validTo: string
  totalPersons: number
  servicesTotal: number
  totalAmount: number
  raw: EvidenceSheetRow
}

function formatMoney(value: number | null | undefined): string {
  const safe = typeof value === 'number' && Number.isFinite(value) ? value : 0
  return `${safe.toLocaleString('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Kč`
}

function getSortValue(item: EvidenceSheetListItem, key: string): string | number {
  switch (key) {
    case 'sheetNumber':
      return item.sheetNumber
    case 'status':
      return item.statusLabel
    case 'validFrom':
      return item.validFrom
    case 'validTo':
      return item.validTo
    case 'totalPersons':
      return item.totalPersons
    case 'servicesTotal':
      return item.servicesTotal
    case 'totalAmount':
      return item.totalAmount
    default:
      return ''
  }
}

export default function ContractEvidenceSheetsTab({
  contractId,
  contractNumber,
  contractSignedAt,
  contractValidTo,
  tenantId,
  tenantLabel,
  tenantSubjectType,
  tenantBirthDate,
  landlordName,
  propertyName,
  unitName,
  rentAmount,
  readOnly = false,
  onCountChange,
  onNavigateToSheet,
}: Props) {
  const toast = useToast()
  const [rows, setRows] = useState<EvidenceSheetRow[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list')
  const [searchText, setSearchText] = useState('')
  const [sort, setSort] = useState<ListViewSortState>(EVIDENCE_SHEETS_DEFAULT_SORT)
  const [colsOpen, setColsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const hasDraft = rows.some((row) => row.status === 'draft')
  const latestDraftId = rows.reduce<string | null>((current, next) => {
    if (next.status !== 'draft') return current
    if (!current) return next.id
    const currentSheet = rows.find((row) => row.id === current)
    if (!currentSheet) return next.id
    return next.sheet_number > currentSheet.sheet_number ? next.id : current
  }, null)
  const selectedSheet = selectedId ? rows.find((row) => row.id === selectedId) ?? null : null
  const selectedIsLastDraft = selectedSheet?.status === 'draft' && selectedSheet.id === latestDraftId
  const [colPrefs, setColPrefs] = useState<Pick<ViewPrefs, 'colWidths' | 'colOrder' | 'colHidden'>>({
    colWidths: {},
    colOrder: [],
    colHidden: [],
  })

  if (!contractId || contractId === 'new') {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        Evidenční listy budou dostupné po uložení smlouvy.
      </div>
    )
  }

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await listEvidenceSheets(contractId, false)
      setRows(data)
      onCountChange?.(data.length)
    } catch (err: any) {
      logger.error('load evidence sheets failed', err)
      toast.showError(err?.message ?? 'Nepodařilo se načíst evidenční listy')
    } finally {
      setLoading(false)
    }
  }, [contractId, toast, onCountChange])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const prefs = await loadViewPrefs(EVIDENCE_SHEETS_VIEW_KEY, {
          colWidths: {},
          colOrder: [],
          colHidden: [],
          sort: EVIDENCE_SHEETS_DEFAULT_SORT,
        })
        if (cancelled) return
        if (prefs) {
          setColPrefs({
            colWidths: prefs.colWidths ?? {},
            colOrder: prefs.colOrder ?? [],
            colHidden: prefs.colHidden ?? [],
          })
          if (prefs.sort) setSort(prefs.sort)
        }
      } catch (e: any) {
        if (!cancelled) logger.error('loadViewPrefs failed', e)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const handleCreate = useCallback(async () => {
    if (hasDraft) {
      toast.showWarning('Nejprve smažte nebo uvolněte existující koncept.')
      return
    }

    setIsProcessing(true)
    try {
      const created = await createEvidenceSheetDraft({
        contractId,
        rentAmount,
        copyFromLatest: true,
        contractValidTo: contractValidTo ?? null,
      })
      await load()
      setSelectedId(created.id)
      setViewMode('detail')
      toast.showSuccess('Evidenční list vytvořen jako koncept')
    } catch (err: any) {
      logger.error('create evidence sheet failed', err)
      toast.showError(err?.message ?? 'Nepodařilo se vytvořit evidenční list')
    } finally {
      setIsProcessing(false)
    }
  }, [contractId, rentAmount, load, toast, hasDraft, contractValidTo])

  const handleDeleteDraft = useCallback(async () => {
    if (!selectedId || !selectedIsLastDraft) {
      toast.showWarning('Nelze smazat vybraný evidenční list.')
      return
    }

    const confirmed = confirm('Tento koncept bude trvale smazán. Není možné ho obnovit. Pokračovat?')
    if (!confirmed) return

    setIsProcessing(true)
    try {
      await deleteEvidenceSheetDraft(selectedId)
      await load()
      setSelectedId(null)
      setViewMode('list')
      toast.showSuccess('Koncept byl trvale smazán.')
    } catch (err: any) {
      logger.error('delete evidence sheet draft failed', err)
      toast.showError(err?.message ?? 'Nepodařilo se smazat koncept')
    } finally {
      setIsProcessing(false)
    }
  }, [deleteEvidenceSheetDraft, selectedId, selectedIsLastDraft, load, toast])

  const handleCopySheet = useCallback(async () => {
    if (!selectedSheet) {
      toast.showWarning('Nejprve vyberte evidenční list')
      return
    }

    if (contractValidTo && selectedSheet.valid_to && selectedSheet.valid_to > contractValidTo) {
      toast.showWarning(`Platný do nesmí být později než konec smlouvy ${contractValidTo}.`)
      return
    }

    setIsProcessing(true)
    try {
      const created = await createEvidenceSheetDraft({
        contractId,
        rentAmount,
        copyFromLatest: true,
        validFrom: selectedSheet.valid_from,
        validTo: selectedSheet.valid_to,
        contractValidTo: contractValidTo ?? null,
      })
      await load()
      setSelectedId(created.id)
      setViewMode('detail')
      toast.showSuccess('Evidenční list zkopírován a otevřen.')
    } catch (err: any) {
      logger.error('copy evidence sheet failed', err)
      toast.showError(err?.message ?? 'Nepodařilo se kopírovat evidenční list')
    } finally {
      setIsProcessing(false)
    }
  }, [contractId, contractValidTo, load, rentAmount, selectedSheet, toast])

  const handleReleaseFromList = useCallback(async () => {
    if (!selectedId) {
      toast.showWarning('Nejprve vyberte evidenční list')
      return
    }

    const sheet = rows.find((r) => r.id === selectedId)
    if (!sheet || sheet.status !== 'draft') {
      toast.showWarning('Lze uvolnit pouze koncept')
      return
    }

    setIsProcessing(true)
    try {
      await activateEvidenceSheet(selectedId)
      await load()
      toast.showSuccess('Evidenční list byl aktivován')
    } catch (err: any) {
      logger.error('activate evidence sheet failed', err)
      toast.showError(err?.message ?? 'Nepodařilo se aktivovat evidenční list')
    } finally {
      setIsProcessing(false)
    }
  }, [selectedId, rows, load, toast])

  const openDetailRead = useCallback((forcedId?: string) => {
    const resolvedId = forcedId ?? selectedId
    if (!resolvedId) {
      toast.showWarning('Nejprve vyberte evidenční list')
      return
    }
    // Pokud je callback na navigaci, použi jej - otevře list na úrovni aplikace
    if (onNavigateToSheet) {
      onNavigateToSheet(resolvedId)
      return
    }
    // Fallback: inline detail view
    if (forcedId) setSelectedId(forcedId)
    setViewMode('detail')
  }, [selectedId, toast, onNavigateToSheet])

  const openDetailEdit = useCallback(() => {
    if (!selectedId) {
      toast.showWarning('Nejprve vyberte evidenční list')
      return
    }
    if (readOnly) return
    setViewMode('detail')
  }, [selectedId, readOnly, toast])

  const listItems = useMemo<EvidenceSheetListItem[]>(
    () =>
      rows.map((row) => ({
        id: row.id,
        sheetNumber: row.sheet_number,
        statusLabel: getSheetBadge(row) ?? row.status ?? '—',
        validFrom: row.valid_from ?? '',
        validTo: row.valid_to ?? '',
        totalPersons: row.total_persons ?? 1,
        servicesTotal: row.services_total ?? 0,
        totalAmount: row.total_amount ?? 0,
        raw: row,
      })),
    [rows]
  )

  const filteredItems = useMemo(() => {
    const q = searchText.trim().toLowerCase()
    if (!q) return listItems
    return listItems.filter((item) => {
      return (
        String(item.sheetNumber).includes(q) ||
        item.statusLabel.toLowerCase().includes(q) ||
        item.validFrom.toLowerCase().includes(q) ||
        item.validTo.toLowerCase().includes(q)
      )
    })
  }, [listItems, searchText])

  const sortedItems = useMemo(() => {
    if (!sort) return filteredItems
    const next = [...filteredItems]
    next.sort((a, b) => {
      const av = getSortValue(a, sort.key)
      const bv = getSortValue(b, sort.key)
      if (typeof av === 'number' && typeof bv === 'number') {
        return sort.dir === 'asc' ? av - bv : bv - av
      }
      const as = String(av).toLowerCase()
      const bs = String(bv).toLowerCase()
      if (as === bs) return 0
      return sort.dir === 'asc' ? (as < bs ? -1 : 1) : (as > bs ? -1 : 1)
    })
    return next
  }, [filteredItems, sort])

  const listRows = useMemo<ListViewRow<EvidenceSheetRow>[]>(
    () =>
      sortedItems.map((item) => ({
        id: item.id,
        raw: item.raw,
        data: {
          sheetNumber: item.sheetNumber,
          status: item.statusLabel,
          validFrom: item.validFrom || '—',
          validTo: item.validTo || '—',
          totalPersons: item.totalPersons,
          servicesTotal: formatMoney(item.servicesTotal),
          totalAmount: formatMoney(item.totalAmount),
        },
      })),
    [sortedItems]
  )

  const columns = useMemo(() => applyColumnPrefs(EVIDENCE_SHEETS_BASE_COLUMNS, colPrefs), [colPrefs])

  const handleSortChange = useCallback((nextSort: ListViewSortState) => {
    setSort(nextSort)
    void saveViewPrefs(EVIDENCE_SHEETS_VIEW_KEY, {
      colWidths: colPrefs.colWidths ?? {},
      colOrder: colPrefs.colOrder ?? [],
      colHidden: colPrefs.colHidden ?? [],
      sort: nextSort,
    })
  }, [colPrefs])

  const handleColumnResize = useCallback((key: string, width: number) => {
    setColPrefs((prev) => {
      const next = { ...prev, colWidths: { ...prev.colWidths, [key]: width } }
      void saveViewPrefs(EVIDENCE_SHEETS_VIEW_KEY, {
        colWidths: next.colWidths ?? {},
        colOrder: next.colOrder ?? [],
        colHidden: next.colHidden ?? [],
        sort,
      })
      return next
    })
  }, [sort])

  return (
    <div className="detail-form detail-form--fill">
      {viewMode === 'list' && (
        <section className="detail-form__section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 className="detail-form__section-title">Seznam evidenčních listů</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              {!readOnly && (
                <button
                  type="button"
                  className="common-actions__btn"
                  onClick={handleCreate}
                  disabled={hasDraft}
                  title={hasDraft ? 'Nejprve smažte nebo uvolněte existující koncept.' : undefined}
                >
                  <span className="common-actions__icon">{getIcon('add' as IconKey)}</span>
                  <span className="common-actions__label">Nový</span>
                </button>
              )}
              {selectedId && (
                <>
                  <button type="button" className="common-actions__btn" onClick={() => openDetailRead()}>
                    <span className="common-actions__icon">{getIcon('eye' as IconKey)}</span>
                    <span className="common-actions__label">Číst</span>
                  </button>
                  {!readOnly && (
                    <button type="button" className="common-actions__btn" onClick={openDetailEdit}>
                      <span className="common-actions__icon">{getIcon('edit' as IconKey)}</span>
                      <span className="common-actions__label">Editovat</span>
                    </button>
                  )}
                  {selectedSheet?.status === 'draft' && !readOnly && (
                    <button type="button" className="common-actions__btn" onClick={handleReleaseFromList}>
                      <span className="common-actions__icon">{getIcon('approve' as IconKey)}</span>
                      <span className="common-actions__label">Uvolnit</span>
                    </button>
                  )}
                  {selectedIsLastDraft && !readOnly && (
                    <button type="button" className="common-actions__btn" onClick={handleDeleteDraft}>
                      <span className="common-actions__icon">{getIcon('trash' as IconKey)}</span>
                      <span className="common-actions__label">Smazat</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {loading ? (
            <div className="detail-form__hint">Načítám evidenční listy...</div>
          ) : rows.length === 0 ? (
            <div className="detail-form__hint">Smlouva zatím nemá žádné evidenční listy.</div>
          ) : (
            <ListView
              columns={columns}
              rows={listRows}
              filterValue={searchText}
              onFilterChange={setSearchText}
              selectedId={selectedId}
              onRowClick={(row) => setSelectedId(String(row.id))}
              onRowDoubleClick={(row) => openDetailRead(String(row.id))}
              sort={sort}
              onSortChange={handleSortChange}
              onColumnResize={handleColumnResize}
              onColumnSettings={() => setColsOpen(true)}
            />
          )}

          <ListViewColumnsDrawer
            open={colsOpen}
            onClose={() => setColsOpen(false)}
            columns={EVIDENCE_SHEETS_BASE_COLUMNS}
            fixedFirstKey="sheetNumber"
            requiredKeys={['sheetNumber']}
            value={{
              order: colPrefs.colOrder ?? [],
              hidden: colPrefs.colHidden ?? [],
            }}
            sortBy={sort ?? undefined}
            onChange={(next) => {
              setColPrefs((prev) => {
                const updated = {
                  ...prev,
                  colOrder: next.order,
                  colHidden: next.hidden,
                }
                void saveViewPrefs(EVIDENCE_SHEETS_VIEW_KEY, {
                  colWidths: updated.colWidths ?? {},
                  colOrder: updated.colOrder ?? [],
                  colHidden: updated.colHidden ?? [],
                  sort,
                })
                return updated
              })
            }}
            onSortChange={(nextSort) => handleSortChange(nextSort)}
            onReset={() => {
              const resetPrefs = {
                colWidths: {},
                colOrder: [],
                colHidden: [],
              }
              setColPrefs(resetPrefs)
              setSort(EVIDENCE_SHEETS_DEFAULT_SORT)
              void saveViewPrefs(EVIDENCE_SHEETS_VIEW_KEY, {
                ...resetPrefs,
                sort: EVIDENCE_SHEETS_DEFAULT_SORT,
              })
            }}
          />
        </section>
      )}

      {viewMode === 'detail' && selectedId && (
        <section style={{ display: 'flex', flexDirection: 'column', flex: '1 1 0', minHeight: 0, maxHeight: '100%', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexShrink: 0 }}>
            <h3 className="detail-form__section-title" style={{ marginBottom: 0 }}>
              Detail evidenčního listu
            </h3>
            <div style={{ display: 'flex', gap: 8 }}>
              {selectedSheet?.status === 'active' && !readOnly && (
                <button
                  type="button"
                  className="common-actions__btn common-actions__btn--icon-only"
                  onClick={handleCopySheet}
                  disabled={isProcessing}
                >
                  <span className="common-actions__icon">{getIcon('duplicate' as IconKey)}</span>
                  <span className="common-actions__label">Kopírovat</span>
                </button>
              )}
              {selectedSheet?.status === 'draft' && !readOnly && (
                <button
                  type="button"
                  className="common-actions__btn common-actions__btn--icon-only"
                  onClick={handleReleaseFromList}
                  disabled={isProcessing}
                >
                  <span className="common-actions__icon">{getIcon('approve' as IconKey)}</span>
                  <span className="common-actions__label">Uvolnit</span>
                </button>
              )}
              {selectedIsLastDraft && !readOnly && (
                <button
                  type="button"
                  className="common-actions__btn common-actions__btn--icon-only"
                  onClick={handleDeleteDraft}
                  disabled={isProcessing}
                >
                  <span className="common-actions__icon">{getIcon('trash' as IconKey)}</span>
                  <span className="common-actions__label">Smazat</span>
                </button>
              )}
              <button
                type="button"
                className="common-actions__btn common-actions__btn--icon-only"
                onClick={() => setViewMode('list')}
                disabled={isProcessing}
              >
                <span className="common-actions__icon">{getIcon('close' as IconKey)}</span>
                <span className="common-actions__label">Zavřít</span>
              </button>
            </div>
          </div>

          <div style={{ flex: '1 1 0', minHeight: 0, overflow: 'hidden' }}>
            <EvidenceSheetDetailFrame
              sheetId={selectedId}
              contractId={contractId}
              tenantId={tenantId}
              tenantLabel={tenantLabel}
              tenantSubjectType={tenantSubjectType}
              tenantBirthDate={tenantBirthDate}
              landlordName={landlordName}
              propertyName={propertyName}
              unitName={unitName}
              contractNumber={contractNumber}
              contractSignedAt={contractSignedAt}
              contractValidTo={contractValidTo}
              readOnly={readOnly}
              onSheetUpdated={load}
            />
          </div>
        </section>
      )}
    </div>
  )
}
