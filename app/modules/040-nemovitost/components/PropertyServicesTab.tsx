// FILE: app/modules/040-nemovitost/components/PropertyServicesTab.tsx
// PURPOSE: Záložka služeb na nemovitosti – seznam + detail + přílohy
// NOTES: Umožňuje přidat službu z katalogu i vlastní položku

'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { listPropertyServices, savePropertyService, type PropertyServiceRow } from '@/app/lib/services/propertyServices'
import { listServiceCatalog, type ServiceCatalogRow } from '@/app/lib/services/serviceCatalog'
import { supabase } from '@/app/lib/supabaseClient'
import { useToast } from '@/app/UI/Toast'
import createLogger from '@/app/lib/logger'
import AttachmentsManagerFrame, { type AttachmentsManagerApi, type AttachmentsManagerUiState } from '@/app/UI/attachments/AttachmentsManagerFrame'
import DetailAttachmentsSection from '@/app/UI/detail-sections/DetailAttachmentsSection'
import { getIcon, type IconKey } from '@/app/UI/icons'
import { getContrastTextColor } from '@/app/lib/colorUtils'

import '@/app/styles/components/DetailForm.css'

const logger = createLogger('PropertyServicesTab')

type DetailMode = 'read' | 'edit' | 'create'

type Props = {
  propertyId: string
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

export default function PropertyServicesTab({ propertyId, readOnly = false, onCountChange }: Props) {
  const toast = useToast()

  const [services, setServices] = useState<PropertyServiceRow[]>([])
  const [loading, setLoading] = useState(true)

  const [catalog, setCatalog] = useState<ServiceCatalogRow[]>([])
  const [loadingCatalog, setLoadingCatalog] = useState(true)

  const [categories, setCategories] = useState<Array<{ id: string; name: string; color?: string | null }>>([])
  const [billingTypes, setBillingTypes] = useState<Array<{ id: string; name: string; color?: string | null }>>([])
  const [units, setUnits] = useState<Array<{ id: string; name: string }>>([])
  const [vatRates, setVatRates] = useState<Array<{ id: string; name: string }>>([])
  const [periodicities, setPeriodicities] = useState<Array<{ id: string; name: string }>>([])

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
      const data = await listPropertyServices(propertyId)
      setServices(data)
    } catch (e: any) {
      logger.error('listPropertyServices failed', e)
      toast.showError(e?.message ?? 'Chyba při načítání služeb')
    } finally {
      setLoading(false)
    }
  }, [propertyId, toast])

  useEffect(() => {
    void reloadServices()
  }, [reloadServices])

  useEffect(() => {
    let cancelled = false

    async function loadCatalog() {
      try {
        setLoadingCatalog(true)
        const data = await listServiceCatalog({ includeArchived: false })
        if (!cancelled) setCatalog(data)
      } catch (e: any) {
        if (!cancelled) {
          logger.error('listServiceCatalog failed', e)
          toast.showError(e?.message ?? 'Chyba při načítání katalogu služeb')
        }
      } finally {
        if (!cancelled) setLoadingCatalog(false)
      }
    }

    void loadCatalog()
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

        if (!cancelled) {
          setCategories(cats.data ?? [])
          setBillingTypes(bills.data ?? [])
          setUnits(unitsRes.data ?? [])
          setVatRates(vats.data ?? [])
          setPeriodicities(periods.data ?? [])
        }
      } catch (e: any) {
        if (!cancelled) {
          logger.error('loadGenericTypes failed', e)
          toast.showError(e?.message ?? 'Chyba při načítání číselníků')
        }
      }
    }

    void loadGenericTypes()
    return () => {
      cancelled = true
    }
  }, [toast])

  const selectService = useCallback(
    (id: string) => {
      const row = services.find((s) => s.id === id)
      if (!row) return
      setSelectedId(row.id)
      const resolvedCategoryId = row.resolved_category_id ?? row.category_id ?? null
      const resolvedBillingTypeId = row.resolved_billing_type_id ?? row.billing_type_id ?? null
      const resolvedUnitId = row.resolved_unit_id ?? row.unit_id ?? null
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

  const handleAdd = useCallback(() => {
    setSelectedId(null)
    setFormValue(buildEmptyFormValue())
    setIsCustomService(false)
  }, [])

  const openDetailRead = useCallback(() => {
    if (!selectedId) return
    selectService(selectedId)
    setDetailMode('read')
    setViewMode('detail')
    setActiveTab('form')
  }, [selectedId, selectService])

  const openDetailEdit = useCallback(() => {
    if (!selectedId || readOnly) {
      if (readOnly) toast.showWarning('Nemovitost musí být v režimu úprav, abyste mohli službu upravit.')
      return
    }
    selectService(selectedId)
    setDetailMode('edit')
    setViewMode('detail')
    setActiveTab('form')
  }, [selectedId, selectService, readOnly, toast])

  const openDetailCreate = useCallback(() => {
    if (readOnly) {
      toast.showWarning('Nemovitost musí být v režimu úprav, abyste mohli přidat službu.')
      return
    }
    handleAdd()
    setDetailMode('create')
    setViewMode('detail')
    setActiveTab('form')
  }, [handleAdd, readOnly, toast])

  const closeDetail = useCallback(() => {
    setViewMode('list')
    setDetailMode('read')
    setActiveTab('form')
  }, [])

  const openAttachmentsManager = useCallback(
    (returnTo: 'list' | 'detail') => {
      if (!selectedId) return
      setAttachmentsReturnView(returnTo)
      setViewMode('attachments')
    },
    [selectedId]
  )

  const closeAttachmentsManager = useCallback(() => {
    setViewMode(attachmentsReturnView)
    setActiveTab('form')
  }, [attachmentsReturnView])

  const handlePrevious = useCallback(() => {
    if (!selectedId) return
    const index = services.findIndex((s) => s.id === selectedId)
    if (index > 0) {
      const prevService = services[index - 1]
      if (prevService) {
        selectService(prevService.id)
      }
    }
  }, [services, selectService, selectedId])

  const handleNext = useCallback(() => {
    if (!selectedId) return
    const index = services.findIndex((s) => s.id === selectedId)
    if (index >= 0 && index < services.length - 1) {
      const nextService = services[index + 1]
      if (nextService) {
        selectService(nextService.id)
      }
    }
  }, [services, selectService, selectedId])

  const handleCatalogChange = useCallback(
    (serviceId: string) => {
      const found = catalog.find((c) => c.id === serviceId)
      setFormValue((prev) => ({
        ...prev,
        serviceId,
        name: found?.name ?? prev.name,
        categoryId: found?.category_id ?? prev.categoryId,
        billingTypeId: found?.billing_type_id ?? prev.billingTypeId,
        unitId: found?.unit_id ?? prev.unitId,
        vatRateId: found?.vat_rate_id ?? prev.vatRateId,
        amount: found?.base_price ?? prev.amount,
      }))
      setIsCustomService(false)
    },
    [catalog]
  )

  const handleSave = useCallback(async () => {
    if (!formValue.name.trim()) {
      toast.showWarning('Zadejte název služby.')
      return
    }
    if (!isCustomService && !formValue.serviceId.trim()) {
      toast.showWarning('Vyberte službu z katalogu nebo zapněte režim "Vlastní služba".')
      return
    }

    try {
      setSaving(true)

      await savePropertyService({
        id: selectedId || undefined,
        property_id: propertyId,
        service_id: formValue.serviceId || null,
        name: formValue.name || null,
        category_id: formValue.categoryId || null,
        billing_type_id: formValue.billingTypeId || null,
        unit_id: formValue.unitId || null,
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
        const next = await listPropertyServices(propertyId)
        const last = next[next.length - 1]
        if (last) {
          setSelectedId(last.id)
          selectService(last.id)
        }
      }

      setDetailMode('read')
      setViewMode('detail')
    } catch (e: any) {
      logger.error('savePropertyService failed', e)
      toast.showError(e?.message ?? 'Chyba při ukládání služby')
    } finally {
      setSaving(false)
    }
  }, [formValue, isCustomService, propertyId, reloadServices, selectedId, selectService, services.length, toast])

  const selectedRow = useMemo(() => services.find((s) => s.id === selectedId) ?? null, [services, selectedId])
  const selectedIndex = useMemo(() => (selectedId ? services.findIndex((s) => s.id === selectedId) : -1), [services, selectedId])
  const isFormReadOnly = readOnly || detailMode === 'read'
  const canGoPrevious = selectedIndex > 0
  const canGoNext = selectedIndex >= 0 && selectedIndex < services.length - 1
  const positionLabel = selectedIndex >= 0 ? `${selectedIndex + 1}/${services.length}` : null

  useEffect(() => {
    onCountChange?.(services.length)
  }, [services.length, onCountChange])

  if (!propertyId || propertyId === 'new') {
    return (
      <div className="detail-form">
        <section className="detail-form__section">
          <h3 className="detail-form__section-title">Služby</h3>
          <p style={{ color: 'var(--color-text-muted)', padding: '1rem 0' }}>
            Služby budou dostupné po uložení nemovitosti.
          </p>
        </section>
      </div>
    )
  }

  return (
    <div className="detail-form">
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

          {loading ? (
            <div className="detail-form__hint">Načítám služby...</div>
          ) : services.length === 0 ? (
            <div className="detail-form__hint">Zatím nejsou přiřazeny žádné služby.</div>
          ) : (
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Název</th>
                  <th>Kategorie</th>
                  <th>Účtování</th>
                  <th>Jednotka</th>
                  <th>Částka</th>
                  <th>Periodicita</th>
                  <th>Přeúčtovat</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => {
                  const isActive = s.id === selectedId
                  return (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedId(s.id)}
                      style={{ backgroundColor: isActive ? 'var(--color-bg-2)' : undefined, cursor: 'pointer' }}
                    >
                      <td>{s.service_name ?? s.name ?? '—'}</td>
                      <td>
                        {s.category_color ? (
                          <span
                            className="generic-type__name-badge"
                            style={{ backgroundColor: s.category_color, color: getContrastTextColor(s.category_color) }}
                          >
                            {s.category_name ?? '—'}
                          </span>
                        ) : (
                          s.category_name ?? '—'
                        )}
                      </td>
                      <td>
                        {s.billing_type_color ? (
                          <span
                            className="generic-type__name-badge"
                            style={{ backgroundColor: s.billing_type_color, color: getContrastTextColor(s.billing_type_color) }}
                          >
                            {s.billing_type_name ?? '—'}
                          </span>
                        ) : (
                          s.billing_type_name ?? '—'
                        )}
                      </td>
                      <td>{s.unit_name ?? '—'}</td>
                      <td style={{ textAlign: 'right' }}>{s.amount != null ? `${s.amount.toFixed(2)} Kč` : '—'}</td>
                      <td>{s.periodicity_name ?? '—'}</td>
                      <td>{s.is_rebillable ? 'Ano' : 'Ne'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </section>
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
              {!isFormReadOnly && (
                <button type="button" className="common-actions__btn" onClick={handleSave} disabled={saving}>
                  <span className="common-actions__icon">{getIcon('save' as IconKey)}</span>
                  <span className="common-actions__label">Uložit</span>
                </button>
              )}
              {detailMode !== 'create' && selectedId && positionLabel && (
                <span className="detail-form__hint" style={{ marginLeft: 4, marginRight: 4 }}>
                  {positionLabel}
                </span>
              )}
              {detailMode !== 'create' && selectedId && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevious}
                    disabled={!canGoPrevious}
                    className="common-actions__btn"
                    title="Předchozí služba"
                  >
                    <span className="common-actions__icon">{getIcon('chevron-left' as IconKey)}</span>
                    <span className="common-actions__label">Předchozí</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!canGoNext}
                    className="common-actions__btn"
                    title="Další služba"
                  >
                    <span className="common-actions__icon">{getIcon('chevron-right' as IconKey)}</span>
                    <span className="common-actions__label">Další</span>
                  </button>
                </>
              )}
              {selectedId && (
                <button type="button" className="common-actions__btn" onClick={() => openAttachmentsManager('detail')}>
                  <span className="common-actions__icon">{getIcon('paperclip' as IconKey)}</span>
                  <span className="common-actions__label">Přílohy</span>
                </button>
              )}
              <button type="button" className="common-actions__btn" onClick={closeDetail}>
                <span className="common-actions__icon">{getIcon('close' as IconKey)}</span>
                <span className="common-actions__label">Zavřít</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid var(--color-border)' }}>
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              style={{
                padding: '8px 16px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                borderBottom: activeTab === 'form' ? '2px solid var(--color-primary)' : '2px solid transparent',
                color: activeTab === 'form' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              }}
            >
              Formulář
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('attachments')}
              disabled={!selectedId}
              style={{
                padding: '8px 16px',
                border: 'none',
                background: 'transparent',
                cursor: selectedId ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: 500,
                borderBottom: activeTab === 'attachments' ? '2px solid var(--color-primary)' : '2px solid transparent',
                color: activeTab === 'attachments' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
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
                      onChange={() => {
                        setIsCustomService(false)
                      }}
                      disabled={isFormReadOnly}
                    />
                    <span>Z katalogu</span>
                  </label>
                  <label style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <input
                      type="radio"
                      name="service-type"
                      checked={isCustomService}
                      onChange={() => {
                        setIsCustomService(true)
                        setFormValue((prev) => ({ ...prev, serviceId: '' }))
                      }}
                      disabled={isFormReadOnly}
                    />
                    <span>Vlastní služba</span>
                  </label>
                </div>
              </div>

              {!isCustomService && (
                <div className="detail-form__field detail-form__field--span-2" style={{ padding: 12, background: 'var(--color-bg-secondary)', borderRadius: 4 }}>
                  <label className="detail-form__label" style={{ marginBottom: 8 }}>Katalogová služba</label>
                  <select
                    className="detail-form__input"
                    value={formValue.serviceId}
                    onChange={(e) => handleCatalogChange(e.target.value)}
                    disabled={isFormReadOnly || loadingCatalog}
                  >
                    <option value="">— vyber službu —</option>
                    {catalog.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="detail-form__field detail-form__field--span-2">
                <label className="detail-form__label">Název služby</label>
                <input
                  className="detail-form__input"
                  value={formValue.name}
                  onChange={(e) => setFormValue((prev) => ({ ...prev, name: e.target.value }))}
                  readOnly={isFormReadOnly}
                />
              </div>

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
                  type="number"
                  className="detail-form__input"
                  value={formValue.amount ?? ''}
                  onChange={(e) => setFormValue((prev) => ({ ...prev, amount: e.target.value === '' ? null : Number(e.target.value) }))}
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
                <label className="detail-form__label">Vyúčtování</label>
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
                  <span>Lze přeúčtovat nájemníkům</span>
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
              entityType="property_service_binding"
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
            entityType="property_service_binding"
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
