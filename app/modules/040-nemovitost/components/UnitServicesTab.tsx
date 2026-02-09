// FILE: app/modules/040-nemovitost/components/UnitServicesTab.tsx
// PURPOSE: Záložka služeb na jednotce – seznam + detail + přílohy
// NOTES: Umožňuje přidat službu z katalogu i vlastní položku

'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { listUnitServices, saveUnitService, type UnitServiceRow } from '@/app/lib/services/unitServices'
import { listServiceCatalog, type ServiceCatalogRow } from '@/app/lib/services/serviceCatalog'
import { supabase } from '@/app/lib/supabaseClient'
import { useToast } from '@/app/UI/Toast'
import createLogger from '@/app/lib/logger'
import AttachmentsManagerFrame, { type AttachmentsManagerApi, type AttachmentsManagerUiState } from '@/app/UI/attachments/AttachmentsManagerFrame'
import DetailAttachmentsSection from '@/app/UI/detail-sections/DetailAttachmentsSection'
import { getIcon, type IconKey } from '@/app/UI/icons'
import ListView, { type ListViewSortState } from '@/app/UI/ListView'
import ListViewColumnsDrawer from '@/app/UI/ListViewColumnsDrawer'
import { applyColumnPrefs, loadViewPrefs, saveViewPrefs, type ViewPrefs } from '@/app/lib/services/viewPrefs'
import {
  SERVICE_CATALOG_BASE_COLUMNS,
  SERVICE_CATALOG_DEFAULT_SORT,
  SERVICE_CATALOG_VIEW_KEY,
  buildServiceCatalogListRow,
  getServiceCatalogSortValue,
  type ServiceCatalogListItem,
} from '@/app/modules/070-sluzby/serviceCatalogListConfig'

import '@/app/styles/components/DetailForm.css'

const logger = createLogger('UnitServicesTab')

type DetailMode = 'read' | 'edit' | 'create'

type Props = {
  unitId: string
  readOnly?: boolean
  onCountChange?: (count: number) => void
}

type ServiceFormValue = {
  serviceId: string
  name: string
  categoryId: string | null
  billingTypeId: string | null
  unitId: string | null
  vatRateId: string | null
  amount: number | null
  periodicityId: string | null
  billingPeriodicityId: string | null
  payerSide: 'tenant' | 'landlord'
  isRebillable: boolean
  splitToUnits: boolean
  splitBasis: string
  note: string
}

function buildEmptyFormValue(): ServiceFormValue {
  return {
    serviceId: '',
    name: '',
    categoryId: null,
    billingTypeId: null,
    unitId: null,
    vatRateId: null,
    amount: null,
    periodicityId: null,
    billingPeriodicityId: null,
    payerSide: 'tenant',
    isRebillable: true,
    splitToUnits: false,
    splitBasis: '',
    note: '',
  }
}

export default function UnitServicesTab({ unitId, readOnly = false, onCountChange }: Props) {
  const toast = useToast()

  const [services, setServices] = useState<UnitServiceRow[]>([])
  const [loading, setLoading] = useState(true)

  const [catalog, setCatalog] = useState<ServiceCatalogRow[]>([])
  const [loadingCatalog, setLoadingCatalog] = useState(true)

  const [categories, setCategories] = useState<Array<{ id: string; name: string; color?: string | null }>>([])
  const [billingTypes, setBillingTypes] = useState<Array<{ id: string; name: string; color?: string | null }>>([])
  const [units, setUnits] = useState<Array<{ id: string; name: string }>>([])
  const [vatRates, setVatRates] = useState<Array<{ id: string; name: string }>>([])
  const [periodicities, setPeriodicities] = useState<Array<{ id: string; name: string }>>([])

  const [searchText, setSearchText] = useState('')
  const [sort, setSort] = useState<ListViewSortState>(SERVICE_CATALOG_DEFAULT_SORT)
  const [colPrefs, setColPrefs] = useState<Pick<ViewPrefs, 'colWidths' | 'colOrder' | 'colHidden'>>({
    colWidths: {},
    colOrder: [],
    colHidden: [],
  })
  const [colsOpen, setColsOpen] = useState(false)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detailMode, setDetailMode] = useState<DetailMode>('read')
  const [viewMode, setViewMode] = useState<'list' | 'detail' | 'attachments'>('list')
  const [activeTab, setActiveTab] = useState<'form' | 'attachments'>('form')
  const [attachmentsReturnView, setAttachmentsReturnView] = useState<'list' | 'detail'>('list')

  const [formValue, setFormValue] = useState<ServiceFormValue>(() => buildEmptyFormValue())
  const [isCustomService, setIsCustomService] = useState(false)
  const [saving, setSaving] = useState(false)

  const attachmentsApiRef = useRef<AttachmentsManagerApi | null>(null)
  const [attachmentsUiState, setAttachmentsUiState] = useState<AttachmentsManagerUiState>({
    hasSelection: false,
    isDirty: false,
    mode: 'list',
  })

  const reloadServices = useCallback(async () => {
    try {
      setLoading(true)
      const data = await listUnitServices(unitId)
      setServices(data)
    } catch (e: any) {
      logger.error('listUnitServices failed', e)
      toast.showError(e?.message ?? 'Chyba při načítání služeb')
    } finally {
      setLoading(false)
    }
  }, [toast, unitId])

  useEffect(() => {
    if (!unitId || unitId === 'new') {
      setServices([])
      setLoading(false)
      return
    }
    void reloadServices()
  }, [unitId, reloadServices])

  useEffect(() => {
    onCountChange?.(services.length)
  }, [services.length, onCountChange])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        setLoadingCatalog(true)
        const data = await listServiceCatalog()
        if (cancelled) return
        setCatalog(data)
      } catch (e: any) {
        if (!cancelled) {
          logger.error('listServiceCatalog failed', e)
          toast.showError('Chyba při načítání katalogu služeb')
        }
      } finally {
        if (!cancelled) setLoadingCatalog(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [toast])

  useEffect(() => {
    let cancelled = false

    async function loadGenericTypes() {
      try {
        const [cats, bills, unitsRes, vats, periods] = await Promise.all([
          supabase.from('generic_types').select('id, name, color').eq('category', 'service_types').order('order_index'),
          supabase.from('generic_types').select('id, name, color').eq('category', 'service_billing_types').order('order_index'),
          supabase.from('generic_types').select('id, name').eq('category', 'service_units').order('order_index'),
          supabase.from('generic_types').select('id, name').eq('category', 'vat_rates').order('order_index'),
          supabase.from('generic_types').select('id, name').eq('category', 'service_periodicities').order('order_index'),
        ])

        if (cats.error) throw cats.error
        if (bills.error) throw bills.error
        if (unitsRes.error) throw unitsRes.error
        if (vats.error) throw vats.error
        if (periods.error) throw periods.error

        if (cancelled) return
        setCategories((cats.data ?? []) as any)
        setBillingTypes((bills.data ?? []) as any)
        setUnits((unitsRes.data ?? []) as any)
        setVatRates((vats.data ?? []) as any)
        setPeriodicities((periods.data ?? []) as any)
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
    let cancelled = false

    ;(async () => {
      try {
        const prefs = await loadViewPrefs(SERVICE_CATALOG_VIEW_KEY, {
          colWidths: {},
          colOrder: [],
          colHidden: [],
          sort: SERVICE_CATALOG_DEFAULT_SORT,
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

  const selectService = useCallback(
    (id: string) => {
      const row = services.find((s) => s.id === id)
      if (!row) return
      setSelectedId(row.id)
      const resolvedCategoryId = row.resolved_category_id ?? row.category_id ?? null
      const resolvedBillingTypeId = row.resolved_billing_type_id ?? row.billing_type_id ?? null
      const resolvedUnitId = row.resolved_unit_id ?? row.service_unit_id ?? null
      const resolvedVatId = row.resolved_vat_rate_id ?? row.vat_rate_id ?? null

      setFormValue({
        serviceId: row.service_id ?? '',
        name: row.name ?? row.service_name ?? '',
        categoryId: resolvedCategoryId,
        billingTypeId: resolvedBillingTypeId,
        unitId: resolvedUnitId,
        vatRateId: resolvedVatId,
        amount: row.amount ?? row.catalog_base_price ?? null,
        periodicityId: row.periodicity_id ?? null,
        billingPeriodicityId: row.billing_periodicity_id ?? null,
        payerSide: (row.payer_side as 'tenant' | 'landlord') ?? 'tenant',
        isRebillable: row.is_rebillable ?? true,
        splitToUnits: row.split_to_units ?? false,
        splitBasis: row.split_basis ?? '',
        note: row.note ?? '',
      })
      setIsCustomService(!row.service_id)
    },
    [services]
  )

  const openDetailRead = useCallback(() => {
    if (!selectedId) return
    selectService(selectedId)
    setDetailMode('read')
    setViewMode('detail')
    setActiveTab('form')
  }, [selectedId, selectService])

  const openDetailEdit = useCallback(() => {
    if (!selectedId || readOnly) {
      toast.showWarning('Nejprve vyberte službu')
      return
    }
    selectService(selectedId)
    setDetailMode('edit')
    setViewMode('detail')
    setActiveTab('form')
  }, [selectedId, selectService, readOnly, toast])

  const openCreate = useCallback(() => {
    if (readOnly) return
    setDetailMode('create')
    setViewMode('detail')
    setActiveTab('form')
    setFormValue(buildEmptyFormValue())
    setIsCustomService(false)
  }, [readOnly])

  const closeDetail = useCallback(() => {
    if (viewMode !== 'detail') return
    setViewMode('list')
    setDetailMode('read')
  }, [viewMode])

  const openAttachmentsManager = useCallback(
    (returnView: 'list' | 'detail') => {
      if (!selectedId) return
      setAttachmentsReturnView(returnView)
      setViewMode('attachments')
    },
    [selectedId]
  )

  const closeAttachmentsManager = useCallback(() => {
    setViewMode(attachmentsReturnView)
  }, [attachmentsReturnView])

  const handleSave = useCallback(async () => {
    if (detailMode === 'read') return

    if (!isCustomService && !formValue.serviceId) {
      toast.showWarning('Vyberte službu z katalogu nebo zapněte režim "Vlastní služba".')
      return
    }

    if (isCustomService && !formValue.name?.trim()) {
      toast.showWarning('Vyplňte název vlastní služby.')
      return
    }

    try {
      setSaving(true)

      await saveUnitService({
        id: selectedId || undefined,
        unit_id: unitId,
        service_id: formValue.serviceId || null,
        name: formValue.name || null,
        category_id: formValue.categoryId || null,
        billing_type_id: formValue.billingTypeId || null,
        service_unit_id: formValue.unitId || null,
        vat_rate_id: formValue.vatRateId || null,
        amount: formValue.amount ?? null,
        periodicity_id: formValue.periodicityId || null,
        billing_periodicity_id: formValue.billingPeriodicityId || null,
        payer_side: formValue.payerSide,
        is_rebillable: formValue.isRebillable,
        split_to_units: formValue.splitToUnits,
        split_basis: formValue.splitBasis || null,
        note: formValue.note || null,
      })

      await reloadServices()
      toast.showSuccess('Služba uložena')

      if (!selectedId && services.length >= 0) {
        const next = await listUnitServices(unitId)
        const last = next[next.length - 1]
        if (last) {
          setSelectedId(last.id)
          selectService(last.id)
        }
      }

      setDetailMode('read')
      setViewMode('detail')
    } catch (e: any) {
      logger.error('saveUnitService failed', e)
      toast.showError(e?.message ?? 'Chyba při ukládání služby')
    } finally {
      setSaving(false)
    }
  }, [detailMode, formValue, isCustomService, reloadServices, selectedId, selectService, services.length, toast, unitId])

  const handleSortChange = useCallback(
    (nextSort: ListViewSortState) => {
      setSort(nextSort)
      void saveViewPrefs(SERVICE_CATALOG_VIEW_KEY, {
        colWidths: colPrefs.colWidths,
        colOrder: colPrefs.colOrder,
        colHidden: colPrefs.colHidden,
        sort: nextSort,
      })
    },
    [colPrefs]
  )

  const listItems = useMemo<ServiceCatalogListItem[]>(() => {
    return services.map((row) => ({
      id: row.id,
      name: row.service_name ?? row.name ?? '—',
      categoryName: row.category_name ?? '—',
      categoryColor: row.category_color ?? null,
      billingTypeName: row.billing_type_name ?? '—',
      billingTypeColor: row.billing_type_color ?? null,
      unitName: row.unit_name ?? '—',
      basePrice: row.amount ?? row.catalog_base_price ?? null,
      vatRateName: row.vat_rate_name ?? '—',
      active: !(row.is_archived ?? false),
      isArchived: !!row.is_archived,
    }))
  }, [services])

  const filteredItems = useMemo(() => {
    const q = searchText.trim().toLowerCase()
    if (!q) return listItems
    return listItems.filter((item) => {
      return (
        item.name.toLowerCase().includes(q) ||
        item.categoryName.toLowerCase().includes(q) ||
        item.billingTypeName.toLowerCase().includes(q) ||
        item.unitName.toLowerCase().includes(q) ||
        item.vatRateName.toLowerCase().includes(q)
      )
    })
  }, [listItems, searchText])

  const preparedColumns = useMemo(() => applyColumnPrefs(SERVICE_CATALOG_BASE_COLUMNS, colPrefs), [colPrefs])

  const sortedRows = useMemo(() => {
    const rows = filteredItems.map(buildServiceCatalogListRow)
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

  const selectedRow = useMemo(() => services.find((s) => s.id === selectedId) ?? null, [services, selectedId])
  const isFormReadOnly = readOnly || detailMode === 'read'

  if (!unitId || unitId === 'new') {
    return (
      <div className="detail-form">
        <section className="detail-form__section">
          <h3 className="detail-form__section-title">Služby</h3>
          <p style={{ color: 'var(--color-text-muted)', padding: '1rem 0' }}>
            Služby budou dostupné po uložení jednotky.
          </p>
        </section>
      </div>
    )
  }

  return (
    <div className="detail-form">
      {viewMode === 'list' && (
        <>
          <section className="detail-form__section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 className="detail-form__section-title">Seznam služeb</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                {!readOnly && (
                  <button type="button" className="common-actions__btn" onClick={openCreate}>
                    <span className="common-actions__icon">{getIcon('plus' as IconKey)}</span>
                    <span className="common-actions__label">Přidat</span>
                  </button>
                )}

                {selectedId && (
                  <>
                    <button type="button" className="common-actions__btn" onClick={openDetailRead}>
                      <span className="common-actions__icon">{getIcon('eye' as IconKey)}</span>
                      <span className="common-actions__label">Detail</span>
                    </button>
                    {!readOnly && (
                      <button type="button" className="common-actions__btn" onClick={openDetailEdit}>
                        <span className="common-actions__icon">{getIcon('edit' as IconKey)}</span>
                        <span className="common-actions__label">Upravit</span>
                      </button>
                    )}
                    <button type="button" className="common-actions__btn" onClick={() => openAttachmentsManager('list')}>
                      <span className="common-actions__icon">{getIcon('paperclip' as IconKey)}</span>
                      <span className="common-actions__label">Přílohy</span>
                    </button>
                  </>
                )}

              </div>
            </div>

            {loading && <div className="detail-form__hint">Načítám služby...</div>}

            {!loading && filteredItems.length === 0 && <div className="detail-form__hint">Zatím nejsou přiřazeny žádné služby.</div>}

            {!loading && filteredItems.length > 0 && (
              <ListView
                columns={preparedColumns}
                rows={sortedRows}
                filterValue={searchText}
                onFilterChange={setSearchText}
                selectedId={selectedId}
                onRowClick={(row) => setSelectedId(String(row.id))}
                onRowDoubleClick={(row) => {
                  setSelectedId(String(row.id))
                  openDetailRead()
                }}
                sort={sort}
                onSortChange={handleSortChange}
                onColumnSettings={() => setColsOpen(true)}
                onColumnResize={(key, width) => {
                  setColPrefs((prev) => {
                    const next = { ...prev, colWidths: { ...prev.colWidths, [key]: width } }
                    void saveViewPrefs(SERVICE_CATALOG_VIEW_KEY, { ...next, sort })
                    return next
                  })
                }}
                emptyText="Zatím nejsou přiřazeny žádné služby."
              />
            )}
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
            onChange={(next) => {
              setColPrefs((prev) => {
                const updated = {
                  ...prev,
                  colOrder: next.order,
                  colHidden: next.hidden,
                }
                void saveViewPrefs(SERVICE_CATALOG_VIEW_KEY, { ...updated, sort })
                return updated
              })
            }}
            onReset={() => {
              const resetPrefs = {
                colWidths: {},
                colOrder: [],
                colHidden: [],
              }
              setColPrefs(resetPrefs)
              void saveViewPrefs(SERVICE_CATALOG_VIEW_KEY, {
                ...resetPrefs,
                sort: SERVICE_CATALOG_DEFAULT_SORT,
              })
              setSort(SERVICE_CATALOG_DEFAULT_SORT)
            }}
          />
        </>
      )}

      {viewMode === 'detail' && (
        <section className="detail-form__section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 className="detail-form__section-title">
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

              {selectedId && (
                <button type="button" className="common-actions__btn" onClick={() => openAttachmentsManager('detail')}>
                  <span className="common-actions__icon">{getIcon('paperclip' as IconKey)}</span>
                  <span className="common-actions__label">Přílohy</span>
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <button
              type="button"
              className={activeTab === 'form' ? 'common-actions__btn common-actions__btn--active' : 'common-actions__btn'}
              onClick={() => setActiveTab('form')}
            >
              Formulář
            </button>

            <button
              type="button"
              className={activeTab === 'attachments' ? 'common-actions__btn common-actions__btn--active' : 'common-actions__btn'}
              onClick={() => setActiveTab('attachments')}
              disabled={!selectedId}
              style={{
                opacity: selectedId ? 1 : 0.5,
              }}
            >
              📎 Přílohy
            </button>
          </div>

          {activeTab === 'form' && (
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
                  <select
                    className="detail-form__input"
                    value={formValue.serviceId}
                    onChange={(e) => {
                      const id = e.target.value
                      const svc = catalog.find((c) => c.id === id)

                      setFormValue((prev) => ({
                        ...prev,
                        serviceId: id,
                        name: svc?.name ?? '',
                        categoryId: svc?.category_id ?? null,
                        billingTypeId: svc?.billing_type_id ?? null,
                        unitId: svc?.unit_id ?? null,
                        vatRateId: svc?.vat_rate_id ?? null,
                        amount: svc?.base_price ?? null,
                      }))
                    }}
                    disabled={isFormReadOnly}
                  >
                    <option value="">— vyberte službu —</option>
                    {loadingCatalog && <option value="">Načítám katalog...</option>}
                    {!loadingCatalog && catalog.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
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
                    value={formValue.name}
                    onChange={(e) => setFormValue((prev) => ({ ...prev, name: e.target.value }))}
                    readOnly={isFormReadOnly}
                  />
                </div>
              )}

              <div className="detail-form__field">
                <label className="detail-form__label">Kategorie</label>
                <select
                  className="detail-form__input"
                  value={formValue.categoryId ?? ''}
                  onChange={(e) => setFormValue((prev) => ({ ...prev, categoryId: e.target.value || null }))}
                  disabled={isFormReadOnly}
                >
                  <option value="">—</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="detail-form__field">
                <label className="detail-form__label">Účtování</label>
                <select
                  className="detail-form__input"
                  value={formValue.billingTypeId ?? ''}
                  onChange={(e) => setFormValue((prev) => ({ ...prev, billingTypeId: e.target.value || null }))}
                  disabled={isFormReadOnly}
                >
                  <option value="">—</option>
                  {billingTypes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="detail-form__field">
                <label className="detail-form__label">Jednotka</label>
                <select
                  className="detail-form__input"
                  value={formValue.unitId ?? ''}
                  onChange={(e) => setFormValue((prev) => ({ ...prev, unitId: e.target.value || null }))}
                  disabled={isFormReadOnly}
                >
                  <option value="">—</option>
                  {units.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="detail-form__field">
                <label className="detail-form__label">DPH</label>
                <select
                  className="detail-form__input"
                  value={formValue.vatRateId ?? ''}
                  onChange={(e) => setFormValue((prev) => ({ ...prev, vatRateId: e.target.value || null }))}
                  disabled={isFormReadOnly}
                >
                  <option value="">—</option>
                  {vatRates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="detail-form__field">
                <label className="detail-form__label">Částka</label>
                <input
                  className="detail-form__input"
                  type="number"
                  value={formValue.amount ?? ''}
                  onChange={(e) => setFormValue((prev) => ({ ...prev, amount: e.target.value ? Number(e.target.value) : null }))}
                  readOnly={isFormReadOnly}
                />
              </div>

              <div className="detail-form__field">
                <label className="detail-form__label">Periodicita</label>
                <select
                  className="detail-form__input"
                  value={formValue.periodicityId ?? ''}
                  onChange={(e) => setFormValue((prev) => ({ ...prev, periodicityId: e.target.value || null }))}
                  disabled={isFormReadOnly}
                >
                  <option value="">—</option>
                  {periodicities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="detail-form__field">
                <label className="detail-form__label">Periodicita vyúčtování</label>
                <select
                  className="detail-form__input"
                  value={formValue.billingPeriodicityId ?? ''}
                  onChange={(e) => setFormValue((prev) => ({ ...prev, billingPeriodicityId: e.target.value || null }))}
                  disabled={isFormReadOnly}
                >
                  <option value="">—</option>
                  {periodicities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="detail-form__field">
                <label className="detail-form__label">Kdo hradí</label>
                <select
                  className="detail-form__input"
                  value={formValue.payerSide}
                  onChange={(e) => setFormValue((prev) => ({ ...prev, payerSide: e.target.value as 'tenant' | 'landlord' }))}
                  disabled={isFormReadOnly}
                >
                  <option value="tenant">Nájemník</option>
                  <option value="landlord">Pronajímatel</option>
                </select>
              </div>

              <div className="detail-form__field">
                <label style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 22 }}>
                  <input
                    type="checkbox"
                    checked={formValue.isRebillable}
                    onChange={(e) => setFormValue((prev) => ({ ...prev, isRebillable: e.target.checked }))}
                    disabled={isFormReadOnly}
                  />
                  <span>Lze přeúčtovat</span>
                </label>
              </div>

              <div className="detail-form__field">
                <label style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 22 }}>
                  <input
                    type="checkbox"
                    checked={formValue.splitToUnits}
                    onChange={(e) => setFormValue((prev) => ({ ...prev, splitToUnits: e.target.checked }))}
                    disabled={isFormReadOnly}
                  />
                  <span>Rozpočítat na jednotky</span>
                </label>
              </div>

              {formValue.splitToUnits && (
                <div className="detail-form__field detail-form__field--span-2">
                  <label className="detail-form__label">Základ rozpočtu</label>
                  <input
                    className="detail-form__input"
                    value={formValue.splitBasis}
                    onChange={(e) => setFormValue((prev) => ({ ...prev, splitBasis: e.target.value }))}
                    readOnly={isFormReadOnly}
                    placeholder="např. m2, osoby, jednotky"
                  />
                </div>
              )}

              <div className="detail-form__field detail-form__field--span-2">
                <label className="detail-form__label">Poznámka</label>
                <textarea
                  className="detail-form__input"
                  value={formValue.note}
                  onChange={(e) => setFormValue((prev) => ({ ...prev, note: e.target.value }))}
                  readOnly={isFormReadOnly}
                />
              </div>
            </div>
          )}

          {activeTab === 'attachments' && selectedId && (
            <DetailAttachmentsSection
              entityType="unit_service_binding"
              entityId={selectedId}
              entityLabel={selectedRow?.service_name ?? selectedRow?.name ?? 'Služba'}
              mode="view"
            />
          )}
        </section>
      )}

      {viewMode === 'attachments' && selectedId && (
        <section className="detail-form__section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 className="detail-form__section-title">Správa příloh</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              {(attachmentsUiState.mode === 'edit' || attachmentsUiState.mode === 'new') && (
                <button
                  type="button"
                  onClick={() => void attachmentsApiRef.current?.save()}
                  disabled={!attachmentsUiState.isDirty}
                  className="common-actions__btn"
                  title="Uložit"
                >
                  <span className="common-actions__icon">{getIcon('save' as IconKey)}</span>
                  <span className="common-actions__label">Uložit</span>
                </button>
              )}

              <button type="button" onClick={closeAttachmentsManager} className="common-actions__btn" title="Zavřít správu příloh">
                <span className="common-actions__icon">{getIcon('close' as IconKey)}</span>
                <span className="common-actions__label">Zavřít</span>
              </button>
            </div>
          </div>

          <AttachmentsManagerFrame
            entityType="unit_service_binding"
            entityId={selectedId}
            entityLabel={selectedRow?.service_name ?? selectedRow?.name ?? 'Služba'}
            canManage={true}
            onRegisterManagerApi={(api) => {
              attachmentsApiRef.current = api
            }}
            onManagerStateChange={(state) => {
              setAttachmentsUiState(state)
            }}
          />
        </section>
      )}
    </div>
  )
}
