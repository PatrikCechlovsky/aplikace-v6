// FILE: app/modules/060-smlouva/components/EvidenceSheetServicesTab.tsx
// PURPOSE: Záložka služeb evidenčního listu (seznam + detail)
// NOTES: Položky služeb s jednotkou byt/osoba a výpočtem celku. Identické jako UnitServicesTab.

'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  listEvidenceSheetServices,
  saveEvidenceSheetServices,
  type EvidenceSheetServiceInput,
} from '@/app/lib/services/contractEvidenceSheets'
import { listServiceCatalog, type ServiceCatalogRow } from '@/app/lib/services/serviceCatalog'
import { supabase } from '@/app/lib/supabaseClient'
import { useToast } from '@/app/UI/Toast'
import createLogger from '@/app/lib/logger'
import ListView, { type ListViewRow, type ListViewSortState } from '@/app/UI/ListView'
import ListViewColumnsDrawer from '@/app/UI/ListViewColumnsDrawer'
import { getIcon, type IconKey } from '@/app/UI/icons'
import { applyColumnPrefs, loadViewPrefs, saveViewPrefs, type ViewPrefs } from '@/app/lib/services/viewPrefs'
import {
  SERVICE_CATALOG_BASE_COLUMNS,
  SERVICE_CATALOG_DEFAULT_SORT,
  SERVICE_CATALOG_VIEW_KEY,
  buildServiceCatalogListRow,
  getServiceCatalogSortValue,
  type ServiceCatalogListItem,
} from '@/app/modules/070-sluzby/serviceCatalogListConfig'

const logger = createLogger('EvidenceSheetServicesTab')

type ServiceRow = EvidenceSheetServiceInput & {
  id: string
  category_name?: string | null
  category_color?: string | null
  billing_type_name?: string | null
  billing_type_color?: string | null
  unit_name?: string | null
  vat_rate_name?: string | null
  catalog_base_price?: number | null
  is_archived?: boolean | null
}

type GenericType = {
  id: string
  name: string
  color?: string | null
}

type Props = {
  sheetId: string
  totalPersons: number
  readOnly?: boolean
  onTotalChange?: (total: number) => void
}

const emptyRow = (): ServiceRow => ({
  id: `tmp-${Math.random().toString(36).slice(2)}`,
  service_id: null,
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
  const [catalog, setCatalog] = useState<ServiceCatalogRow[]>([])
  const [loadingCatalog, setLoadingCatalog] = useState(true)
  const [categories, setCategories] = useState<GenericType[]>([])
  const [catalogSearchText, setCatalogSearchText] = useState('')
  const [catalogCategoryId, setCatalogCategoryId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list')
  const [detailMode, setDetailMode] = useState<'read' | 'edit' | 'create'>('read')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [formValue, setFormValue] = useState<ServiceRow>(() => emptyRow())
  const [isCustomService, setIsCustomService] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [sort, setSort] = useState<ListViewSortState>(SERVICE_CATALOG_DEFAULT_SORT)
  const [colPrefs, setColPrefs] = useState<Pick<ViewPrefs, 'colWidths' | 'colOrder' | 'colHidden'>>({
    colWidths: {},
    colOrder: [],
    colHidden: [],
  })
  const [colsOpen, setColsOpen] = useState(false)
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
        service_id: s.service_id ?? null,
        service_name: s.service_name,
        unit_type: s.unit_type,
        unit_price: Number(s.unit_price),
        quantity: s.quantity,
        total_amount: Number(s.total_amount),
        order_index: s.order_index ?? idx,
        category_name: s.category_name ?? null,
        category_color: s.category_color ?? null,
        billing_type_name: s.billing_type_name ?? null,
        billing_type_color: s.billing_type_color ?? null,
        unit_name: s.unit_name ?? null,
        vat_rate_name: s.vat_rate_name ?? null,
        catalog_base_price: s.catalog_base_price ?? null,
        is_archived: s.is_archived ?? false,
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
    let cancelled = false

    async function loadGenericTypes() {
      try {
        const [cats] = await Promise.all([
          supabase.from('generic_types').select('id, name, color').eq('category', 'service_types').eq('active', true).order('order_index'),
        ])

        if (cats.error) throw cats.error

        if (cancelled) return
        setCategories((cats.data ?? []) as any)
      } catch (e: any) {
        if (!cancelled) {
          logger.error('loadGenericTypes failed', e)
          toast.showError('Chyba při načítání číselníků')
        }
      }
    }

    void loadGenericTypes()

    return () => {
      cancelled = true
    }
  }, [toast])

  useEffect(() => {
    let mounted = true

    void (async () => {
      const prefs = await loadViewPrefs(SERVICE_CATALOG_VIEW_KEY, {
        colWidths: {},
        colOrder: [],
        colHidden: [],
        sort: SERVICE_CATALOG_DEFAULT_SORT,
      })

      if (!mounted) return
      setColPrefs({
        colWidths: prefs.colWidths ?? {},
        colOrder: prefs.colOrder ?? [],
        colHidden: prefs.colHidden ?? [],
      })
      if (prefs.sort) setSort(prefs.sort)
    })()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        setLoadingCatalog(true)
        const data = await listServiceCatalog({
          includeArchived: false,
          searchText: catalogSearchText,
        })
        if (!cancelled) setCatalog(data)
      } catch (err: any) {
        if (!cancelled) {
          logger.error('load service catalog failed', err)
          toast.showError(err?.message ?? 'Nepodařilo se načíst katalog služeb')
        }
      } finally {
        if (!cancelled) setLoadingCatalog(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [catalogSearchText, toast])

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
    setIsCustomService(!row.service_id)
    setDetailMode('read')
    setViewMode('detail')
  }, [rows, selectedId])

  const openDetailEdit = useCallback(() => {
    if (!selectedId) return
    const row = rows.find((r) => r.id === selectedId)
    if (!row) return
    setFormValue({ ...row })
    setIsCustomService(!row.service_id)
    setDetailMode('edit')
    setViewMode('detail')
  }, [rows, selectedId])

  const openDetailCreate = useCallback(() => {
    setFormValue(recomputeRow(emptyRow()))
    setIsCustomService(false)
    setDetailMode('create')
    setViewMode('detail')
  }, [recomputeRow])

  const closeDetail = useCallback(() => {
    setViewMode('list')
  }, [])

  const persistRows = useCallback(async (nextRows: ServiceRow[]) => {
    const payload: EvidenceSheetServiceInput[] = nextRows.map((r, idx) => ({
      service_id: r.service_id ?? null,
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

    if (!isCustomService && !formValue.service_id) {
      toast.showError('Vyberte službu z katalogu')
      return
    }

    if (isCustomService && !formValue.service_name.trim()) {
      toast.showError('Vyplňte název služby')
      return
    }

    try {
      setSaving(true)
      const updatedValue = recomputeRow({
        ...formValue,
        service_id: isCustomService ? null : formValue.service_id ?? null,
        service_name: isCustomService ? formValue.service_name : (formValue.service_name || ''),
      })
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
  }, [detailMode, formValue, isCustomService, load, persistRows, readOnly, rows, toast, recomputeRow])

  const listItems = useMemo<ServiceCatalogListItem[]>(() => rows.map((row) => ({
    id: row.id,
    name: row.service_name || '—',
    categoryId: null,
    categoryName: row.category_name ?? '—',
    categoryColor: row.category_color ?? null,
    billingTypeName: row.billing_type_name ?? '—',
    billingTypeColor: row.billing_type_color ?? null,
    unitName: row.unit_name ?? '—',
    basePrice: row.unit_price ?? row.catalog_base_price ?? null,
    vatRateName: row.vat_rate_name ?? '—',
    active: !(row.is_archived ?? false),
    isArchived: !!row.is_archived,
  })), [rows])

  const filteredItems = useMemo(() => {
    const q = searchText.trim().toLowerCase()
    if (!q) return listItems
    return listItems.filter((item) => (
      item.name.toLowerCase().includes(q) ||
      item.categoryName.toLowerCase().includes(q) ||
      item.billingTypeName.toLowerCase().includes(q) ||
      item.unitName.toLowerCase().includes(q) ||
      item.vatRateName.toLowerCase().includes(q)
    ))
  }, [listItems, searchText])

  const preparedColumns = useMemo(() => applyColumnPrefs(SERVICE_CATALOG_BASE_COLUMNS, colPrefs), [colPrefs])

  const listRows: ListViewRow<ServiceCatalogListItem>[] = useMemo(() => {
    const rows = filteredItems.map((item) => buildServiceCatalogListRow(item))
    if (!sort?.key) return rows
    const dir = sort.dir === 'desc' ? -1 : 1
    return [...rows].sort((a, b) => {
      const aVal = getServiceCatalogSortValue(a.raw as ServiceCatalogListItem, sort.key)
      const bVal = getServiceCatalogSortValue(b.raw as ServiceCatalogListItem, sort.key)
      if (aVal < bVal) return -1 * dir
      if (aVal > bVal) return 1 * dir
      return 0
    })
  }, [filteredItems, sort])

  if (loading) {
    return <div className="detail-form__hint">Načítám služby…</div>
  }

  const isFormReadOnly = readOnly || detailMode === 'read'

  return (
    <div className="detail-form detail-form--fill">
      {viewMode === 'list' && (
        <>
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
              columns={preparedColumns}
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
              onSortChange={(next) => {
                setSort(next)
                void saveViewPrefs(SERVICE_CATALOG_VIEW_KEY, {
                  colWidths: colPrefs.colWidths ?? {},
                  colOrder: colPrefs.colOrder ?? [],
                  colHidden: colPrefs.colHidden ?? [],
                  sort: next,
                })
              }}
              onColumnResize={(key, width) => {
                setColPrefs((prev) => {
                  const next = { ...prev, colWidths: { ...prev.colWidths, [key]: width } }
                  void saveViewPrefs(SERVICE_CATALOG_VIEW_KEY, { ...next, sort })
                  return next
                })
              }}
              onColumnSettings={() => setColsOpen(true)}
              emptyText="Zatím nejsou přiřazeny žádné služby."
            />
          )}

          <div className="detail-form__hint" style={{ marginTop: 12 }}>
            Služby celkem: <strong>{servicesTotal} Kč</strong>
          </div>
        </section>

        <ListViewColumnsDrawer
          open={colsOpen}
          onClose={() => setColsOpen(false)}
          columns={SERVICE_CATALOG_BASE_COLUMNS}
          fixedFirstKey="category"
          requiredKeys={['name']}
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
              void saveViewPrefs(SERVICE_CATALOG_VIEW_KEY, {
                colWidths: updated.colWidths ?? {},
                colOrder: updated.colOrder ?? [],
                colHidden: updated.colHidden ?? [],
                sort,
              })
              return updated
            })
          }}
          onSortChange={(nextSort) => {
            setSort(nextSort)
            void saveViewPrefs(SERVICE_CATALOG_VIEW_KEY, {
              colWidths: colPrefs.colWidths ?? {},
              colOrder: colPrefs.colOrder ?? [],
              colHidden: colPrefs.colHidden ?? [],
              sort: nextSort,
            })
          }}
          onReset={() => {
            const resetPrefs = {
              colWidths: {},
              colOrder: [],
              colHidden: [],
            }
            setColPrefs(resetPrefs)
            setSort(SERVICE_CATALOG_DEFAULT_SORT)
            void saveViewPrefs(SERVICE_CATALOG_VIEW_KEY, {
              ...resetPrefs,
              sort: SERVICE_CATALOG_DEFAULT_SORT,
            })
          }}
        />
        </>
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

                <button type="button" className="common-actions__btn" onClick={closeDetail}>
                  <span className="common-actions__icon">{getIcon('close' as IconKey)}</span>
                  <span className="common-actions__label">Zavřít</span>
                </button>
              </div>
            </div>

            <div className="detail-subdetail__content">
              <div className="detail-form__grid detail-form__grid--narrow">
                <div className="detail-form__field detail-form__field--span-2" style={{ padding: 12, background: 'var(--color-bg-secondary)', borderRadius: 4 }}>
                  <label className="detail-form__label" style={{ marginBottom: 8 }}>
                    Typ služby
                  </label>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <input
                        type="radio"
                        name="service-type"
                        checked={!isCustomService}
                        onChange={() => setIsCustomService(false)}
                        disabled={isFormReadOnly}
                      />
                      <span>Služba z katalogu</span>
                    </label>

                    <label style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <input
                        type="radio"
                        name="service-type"
                        checked={isCustomService}
                        onChange={() => setIsCustomService(true)}
                        disabled={isFormReadOnly}
                      />
                      <span>Vlastní služba</span>
                    </label>
                  </div>
                </div>

                {!isCustomService && (
                  <div className="detail-form__field detail-form__field--span-2">
                    <label className="detail-form__label">Katalogová služba</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                      <input
                        type="text"
                        className="detail-form__input"
                        placeholder="Hledat název, kód nebo popis..."
                        value={catalogSearchText}
                        onChange={(e) => setCatalogSearchText(e.target.value)}
                        disabled={isFormReadOnly}
                      />
                      <select
                        className="detail-form__input"
                        value={catalogCategoryId || ''}
                        onChange={(e) => setCatalogCategoryId(e.target.value || null)}
                        disabled={isFormReadOnly}
                      >
                        <option value="">— všechny kategorie —</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <select
                      className="detail-form__input"
                      value={formValue.service_id || ''}
                      onChange={(e) => {
                        const id = e.target.value
                        const svc = catalog.find((c) => c.id === id)

                        setFormValue((prev) => recomputeRow({
                          ...prev,
                          service_id: id || null,
                          service_name: svc?.name ?? '',
                          unit_price: svc?.base_price ?? prev.unit_price,
                          catalog_base_price: svc?.base_price ?? null,
                          category_name: svc?.category_name ?? null,
                          category_color: svc?.category_color ?? null,
                          billing_type_name: svc?.billing_type_name ?? null,
                          billing_type_color: svc?.billing_type_color ?? null,
                          unit_name: svc?.unit_name ?? null,
                          vat_rate_name: svc?.vat_rate_name ?? null,
                        }))
                      }}
                      disabled={isFormReadOnly}
                    >
                      <option value="">{loadingCatalog ? 'Načítám katalog...' : '— vyberte službu —'}</option>
                      {!loadingCatalog && catalog.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.code ? `${c.code} – ${c.name}` : c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {isCustomService && (
                  <div className="detail-form__field detail-form__field--span-2">
                    <label className="detail-form__label">Název služby</label>
                    <input
                      className="detail-form__input"
                      value={formValue.service_name}
                      onChange={(e) => setFormValue((prev) => recomputeRow({ ...prev, service_name: e.target.value }))}
                      readOnly={isFormReadOnly}
                    />
                  </div>
                )}

                <div className="detail-form__field">
                  <label className="detail-form__label">Kategorie</label>
                  <select
                    className="detail-form__input"
                    value={formValue.category_name ?? ''}
                    onChange={() => {}}
                    disabled={true}
                  >
                    <option value="">{formValue.category_name ?? '—'}</option>
                  </select>
                </div>

                <div className="detail-form__field">
                  <label className="detail-form__label">Účtování</label>
                  <select
                    className="detail-form__input"
                    value={formValue.billing_type_name ?? ''}
                    onChange={() => {}}
                    disabled={true}
                  >
                    <option value="">{formValue.billing_type_name ?? '—'}</option>
                  </select>
                </div>

                <div className="detail-form__field">
                  <label className="detail-form__label">Jednotka</label>
                  <select
                    className="detail-form__input"
                    value={formValue.unit_type}
                    onChange={(e) => setFormValue((prev) => recomputeRow({ ...prev, unit_type: e.target.value as ServiceRow['unit_type'] }))}
                    disabled={isFormReadOnly}
                  >
                    <option value="flat">byt</option>
                    <option value="person">osoba</option>
                  </select>
                </div>

                <div className="detail-form__field">
                  <label className="detail-form__label">DPH</label>
                  <select
                    className="detail-form__input"
                    value={formValue.vat_rate_name ?? ''}
                    onChange={() => {}}
                    disabled={true}
                  >
                    <option value="">{formValue.vat_rate_name ?? '—'}</option>
                  </select>
                </div>

                <div className="detail-form__field">
                  <label className="detail-form__label">Cena / jednotku</label>
                  <input
                    className="detail-form__input"
                    type="number"
                    value={formValue.unit_price}
                    onChange={(e) => setFormValue((prev) => recomputeRow({ ...prev, unit_price: Number(e.target.value || 0) }))}
                    readOnly={isFormReadOnly}
                  />
                </div>

                <div className="detail-form__field">
                  <label className="detail-form__label">Počet</label>
                  <input
                    className="detail-form__input"
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
