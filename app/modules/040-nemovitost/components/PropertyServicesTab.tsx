// FILE: app/modules/040-nemovitost/components/PropertyServicesTab.tsx
// PURPOSE: Záložka služeb na nemovitosti – seznam + detail + přílohy
// NOTES: Umožňuje přidat službu z katalogu i vlastní položku

'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { listPropertyServices, savePropertyService, setPropertyServiceArchived, type PropertyServiceRow } from '@/app/lib/services/propertyServices'
import { listServiceCatalog, type ServiceCatalogRow } from '@/app/lib/services/serviceCatalog'
import { supabase } from '@/app/lib/supabaseClient'
import { useToast } from '@/app/UI/Toast'
import createLogger from '@/app/lib/logger'
import AttachmentsManagerFrame, { type AttachmentsManagerApi, type AttachmentsManagerUiState } from '@/app/UI/attachments/AttachmentsManagerFrame'
import DetailAttachmentsSection from '@/app/UI/detail-sections/DetailAttachmentsSection'
import { getIcon, type IconKey } from '@/app/UI/icons'
import ListView, { type ListViewRow, type ListViewSortState } from '@/app/UI/ListView'
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

const logger = createLogger('PropertyServicesTab')

type DetailMode = 'read' | 'edit' | 'create'

type Props = {
  propertyId: string
  readOnly?: boolean
  onCountChange?: (count: number) => void
  onAttachmentsChanged?: () => void
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
  validFrom: string | null
  validTo: string | null
}

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
}

function resolvePeriodicityId(
  items: Array<{ id: string; name: string }>,
  preferredNames: string[]
): string | null {
  if (!items.length) return null
  const normalizedPreferred = preferredNames.map((n) => normalizeName(n))
  const found = items.find((i) => normalizedPreferred.includes(normalizeName(i.name)))
  return found?.id ?? null
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
    payerSide: 'landlord',
    isRebillable: true,
    splitToUnits: false,
    splitBasis: '',
    note: '',
    validFrom: null,
    validTo: null,
  }
}

function addDaysToDateString(dateString: string | null, days: number): string | null {
  if (!dateString) return null
  const parts = dateString.split('-').map(Number)
  if (parts.length !== 3 || parts.some((p) => Number.isNaN(p))) return dateString
  const [year, month, day] = parts
  const date = new Date(Date.UTC(year, month - 1, day))
  if (Number.isNaN(date.getTime())) return dateString
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function buildFormValueFromRow(row: PropertyServiceRow): ServiceFormValue {
  const resolvedCategoryId = row.resolved_category_id ?? row.category_id ?? null
  const resolvedBillingTypeId = row.resolved_billing_type_id ?? row.billing_type_id ?? null
  const resolvedUnitId = row.resolved_unit_id ?? row.unit_id ?? null
  const resolvedVatId = row.resolved_vat_rate_id ?? row.vat_rate_id ?? null

  return {
    serviceId: row.service_id ?? '',
    name: row.name ?? row.service_name ?? row.catalog_service_name ?? '',
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
    validFrom: row.valid_from ?? null,
    validTo: row.valid_to ?? null,
  }
}

function normalizeServiceName(value: string | null | undefined): string {
  return (value ?? '').trim()
}

function hasDuplicateServiceName(
  services: PropertyServiceRow[],
  currentId: string | null,
  name: string | null | undefined
): boolean {
  const normalized = normalizeServiceName(name)
  if (!normalized) return false
  return services.some((s) => {
    if (currentId && s.id === currentId) return false
    const serviceName = s.name ?? s.service_name ?? s.catalog_service_name ?? ''
    return normalizeServiceName(serviceName) === normalized
  })
}

function isServiceActive(today: Date, validFrom: string | null, validTo: string | null): boolean {
  if (!validFrom && !validTo) return true // Bez omezení
  if (validFrom) {
    const fromDate = new Date(validFrom)
    if (today < fromDate) return false // Ještě nezačala
  }
  if (validTo) {
    const toDate = new Date(validTo)
    if (today > toDate) return false // Již skončila
  }
  return true
}

function getServiceStatus(
  today: Date,
  validFrom: string | null,
  validTo: string | null,
  isArchived: boolean
): string {
  if (isArchived) return 'Archivováno'
  if (validFrom) {
    const fromDate = new Date(validFrom)
    if (today < fromDate) return 'Čekající'
  }
  if (validTo) {
    const toDate = new Date(validTo)
    if (today > toDate) return 'Neaktivní'
  }
  return 'Aktivní'
}

export default function PropertyServicesTab({ propertyId, readOnly = false, onCountChange, onAttachmentsChanged }: Props) {
  const toast = useToast()

  const [services, setServices] = useState<PropertyServiceRow[]>([])
  const [loading, setLoading] = useState(true)

  const [catalog, setCatalog] = useState<ServiceCatalogRow[]>([])
  const [loadingCatalog, setLoadingCatalog] = useState(true)
  const [catalogSearchText, setCatalogSearchText] = useState('')
  const [catalogCategoryId, setCatalogCategoryId] = useState<string | null>(null)

  const [categories, setCategories] = useState<Array<{ id: string; name: string; color?: string | null }>>([])
  const [billingTypes, setBillingTypes] = useState<Array<{ id: string; name: string; color?: string | null }>>([])
  const [units, setUnits] = useState<Array<{ id: string; name: string }>>([])
  const [vatRates, setVatRates] = useState<Array<{ id: string; name: string }>>([])
  const [periodicities, setPeriodicities] = useState<Array<{ id: string; name: string }>>([])

  const [searchText, setSearchText] = useState('')
  const [colPrefs, setColPrefs] = useState<Pick<ViewPrefs, 'colWidths' | 'colOrder' | 'colHidden'>>({
    colWidths: {},
    colOrder: [],
    colHidden: [],
  })
  const [showInactive, setShowInactive] = useState(false)
  const [sort, setSort] = useState<ListViewSortState>(SERVICE_CATALOG_DEFAULT_SORT)
  const [colsOpen, setColsOpen] = useState(false)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detailMode, setDetailMode] = useState<DetailMode>('read')
  const [viewMode, setViewMode] = useState<'list' | 'detail' | 'attachments'>('list')
  const [activeTab, setActiveTab] = useState<'form' | 'attachments'>('form')
  const [attachmentsReturnView, setAttachmentsReturnView] = useState<'list' | 'detail'>('list')
  const [copySource, setCopySource] = useState<{ id: string; name: string } | null>(null)
  const [copyValidFrom, setCopyValidFrom] = useState<string | null>(null)

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
      const data = await listPropertyServices(propertyId, showInactive)
      setServices(data)
    } catch (e: any) {
      logger.error('listPropertyServices failed', e)
      toast.showError(e?.message ?? 'Chyba při načítání služeb')
    } finally {
      setLoading(false)
    }
  }, [propertyId, showInactive, toast])

  useEffect(() => {
    void reloadServices()
  }, [reloadServices])

  useEffect(() => {
    let cancelled = false

    async function loadCatalog() {
      try {
        setLoadingCatalog(true)
        const data = await listServiceCatalog({
          includeArchived: false,
          searchText: catalogSearchText,
          categoryId: catalogCategoryId,
        })
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
  }, [catalogSearchText, catalogCategoryId, toast])

  useEffect(() => {
    if (detailMode !== 'create') return
    if (periodicities.length === 0) return

    const monthlyId = resolvePeriodicityId(periodicities, ['Měsíčně', 'Mesicne'])
    const yearlyId = resolvePeriodicityId(periodicities, ['Ročně', 'Rocne', 'Roční', 'Rocni'])

    setFormValue((prev) => ({
      ...prev,
      periodicityId: prev.periodicityId ?? monthlyId,
      billingPeriodicityId: prev.billingPeriodicityId ?? yearlyId,
      payerSide: prev.payerSide ?? 'landlord',
    }))
  }, [detailMode, periodicities])

  useEffect(() => {
    let active = true

    async function loadPrefs() {
      const prefs = await loadViewPrefs(SERVICE_CATALOG_VIEW_KEY, {
        v: 1,
        sort: null,
        colWidths: {},
        colOrder: [],
        colHidden: [],
      })

      if (!active) return

      setColPrefs({
        colWidths: prefs.colWidths ?? {},
        colOrder: prefs.colOrder ?? [],
        colHidden: prefs.colHidden ?? [],
      })

      if (prefs.sort?.key) {
        setSort(prefs.sort as ListViewSortState)
      }
    }

    void loadPrefs()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadGenericTypes() {
      try {
        const [cats, bills, unitsRes, vats, periods] = await Promise.all([
          supabase.from('generic_types').select('id, name, color').eq('category', 'service_types').eq('active', true).order('order_index'),
          supabase.from('generic_types').select('id, name, color').eq('category', 'service_billing_types').eq('active', true).order('order_index'),
          supabase.from('generic_types').select('id, name').eq('category', 'service_units').eq('active', true).order('order_index'),
          supabase.from('generic_types').select('id, name').eq('category', 'vat_rates').eq('active', true).order('order_index'),
          supabase.from('generic_types').select('id, name').eq('category', 'service_periodicities').eq('active', true).order('order_index'),
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
      setFormValue(buildFormValueFromRow(row))
      setIsCustomService(!row.service_id)
    },
    [services]
  )

  const handleAdd = useCallback(() => {
    setSelectedId(null)
    setFormValue(buildEmptyFormValue())
    setIsCustomService(false)
    setCopySource(null)
    setCopyValidFrom(null)
  }, [])

  const openDetailRead = useCallback(() => {
    if (!selectedId) return
    selectService(selectedId)
    setCopySource(null)
    setCopyValidFrom(null)
    setDetailMode('read')
    setViewMode('detail')
    setActiveTab('form')
  }, [selectedId, selectService])

  const openDetailEdit = useCallback(() => {
    if (!selectedId || readOnly) {
      if (readOnly) toast.showSuccess('Nemovitost musí být v režimu úprav, abyste mohli službu upravit.')
      return
    }
    selectService(selectedId)
    setCopySource(null)
    setCopyValidFrom(null)
    setDetailMode('edit')
    setViewMode('detail')
    setActiveTab('form')
  }, [selectedId, selectService, readOnly, toast])

  const openDetailCreate = useCallback(() => {
    if (readOnly) {
      toast.showSuccess('Nemovitost musí být v režimu úprav, abyste mohli přidat službu.')
      return
    }
    handleAdd()
    setDetailMode('create')
    setViewMode('detail')
    setActiveTab('form')
  }, [handleAdd, readOnly, toast])

  const handleDuplicate = useCallback(() => {
    if (!selectedId) {
      toast.showSuccess('Nejprve vyberte službu')
      return
    }
    if (readOnly) {
      toast.showSuccess('Nemovitost musí být v režimu úprav, abyste mohli službu duplikovat.')
      return
    }
    const row = services.find((s) => s.id === selectedId)
    if (!row) return
    if (!row.valid_to) {
      toast.showSuccess('Nejprve vyplňte „Platí do“ u původní služby.')
      setSelectedId(row.id)
      selectService(row.id)
      setDetailMode('edit')
      setViewMode('detail')
      setActiveTab('form')
      return
    }
    const nextValidFrom = addDaysToDateString(row.valid_to, 1)
    if (!nextValidFrom) {
      toast.showSuccess('Nelze určit datum platnosti kopie. Zkontrolujte „Platí do“ u původní služby.')
      return
    }
    const baseForm = buildFormValueFromRow(row)
    setSelectedId(null)
    setCopySource({ id: row.id, name: baseForm.name })
    setCopyValidFrom(nextValidFrom)
    setDetailMode('create')
    setViewMode('detail')
    setActiveTab('form')
    setFormValue({
      ...baseForm,
      name: baseForm.name ? `${baseForm.name} (kopie)` : baseForm.name,
      validFrom: nextValidFrom,
      validTo: null,
    })
    setIsCustomService(!row.service_id)
    toast.showSuccess(`Nová služba platí od ukončení původní, tj. od: ${nextValidFrom}.`)
  }, [readOnly, selectedId, selectService, services, toast])

  const closeDetail = useCallback(() => {
    setViewMode('list')
    setDetailMode('read')
    setActiveTab('form')
    setCopySource(null)
    setCopyValidFrom(null)
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
    onAttachmentsChanged?.()
  }, [attachmentsReturnView, onAttachmentsChanged])

  const orderedServices = useMemo(() => {
    const items = [...services]
    return items.sort((a, b) => {
      const aDate = a.valid_from ? new Date(a.valid_from).getTime() : Number.NEGATIVE_INFINITY
      const bDate = b.valid_from ? new Date(b.valid_from).getTime() : Number.NEGATIVE_INFINITY
      if (aDate !== bDate) return bDate - aDate
      const aTo = a.valid_to ? new Date(a.valid_to).getTime() : Number.NEGATIVE_INFINITY
      const bTo = b.valid_to ? new Date(b.valid_to).getTime() : Number.NEGATIVE_INFINITY
      if (aTo !== bTo) return bTo - aTo
      const aName = normalizeServiceName(a.service_name ?? a.name ?? a.catalog_service_name ?? '')
      const bName = normalizeServiceName(b.service_name ?? b.name ?? b.catalog_service_name ?? '')
      return aName.localeCompare(bName, 'cs')
    })
  }, [services])

  const handlePrevious = useCallback(() => {
    if (!selectedId) return
    const index = orderedServices.findIndex((s) => s.id === selectedId)
    if (index > 0) {
      const prevService = orderedServices[index - 1]
      if (prevService) {
        selectService(prevService.id)
      }
    }
  }, [orderedServices, selectService, selectedId])

  const handleNext = useCallback(() => {
    if (!selectedId) return
    const index = orderedServices.findIndex((s) => s.id === selectedId)
    if (index >= 0 && index < orderedServices.length - 1) {
      const nextService = orderedServices[index + 1]
      if (nextService) {
        selectService(nextService.id)
      }
    }
  }, [orderedServices, selectService, selectedId])

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

  const isCopyMode = detailMode === 'create' && !!copySource

  const handleSave = useCallback(async () => {
    if (!formValue.name.trim()) {
      toast.showSuccess('Zadejte název služby.')
      return
    }
    if (!isCustomService && !formValue.serviceId.trim()) {
      toast.showSuccess('Vyberte službu z katalogu nebo zapněte režim "Vlastní služba".')
      return
    }

    if (isCopyMode) {
      if (!copyValidFrom) {
        toast.showSuccess('Platnost kopie musí začínat dnem po ukončení původní služby.')
        return
      }
      if (!formValue.validFrom) {
        toast.showSuccess('Platí od u kopie je povinné.')
        return
      }
      if (formValue.validFrom !== copyValidFrom) {
        setFormValue((prev) => ({ ...prev, validFrom: copyValidFrom }))
        toast.showSuccess(`Platí od u kopie je pevně nastaveno na ${copyValidFrom}.`)
        return
      }
    } else {
      if (!normalizeServiceName(formValue.name)) {
        toast.showSuccess('Vyplňte název služby.')
        return
      }
      if (hasDuplicateServiceName(services, selectedId, formValue.name)) {
        toast.showSuccess('Služba se stejným názvem už v nemovitosti existuje. Upravte název.')
        return
      }
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
        valid_from: formValue.validFrom || null,
        valid_to: formValue.validTo || null,
      })

      // Načíst aktualizovaný seznam služeb
      const updatedServices = await listPropertyServices(propertyId, showInactive)
      setServices(updatedServices)
      
      toast.showSuccess('Služba uložena')

      // Po vytvoření nové služby přepnout na poslední záznam
      if (!selectedId) {
        const last = updatedServices[updatedServices.length - 1]
        if (last) {
          setSelectedId(last.id)
          selectService(last.id)
        }
      }

      setDetailMode('read')
      setViewMode('detail')
      setCopySource(null)
      setCopyValidFrom(null)
    } catch (e: any) {
      logger.error('savePropertyService failed', e)
      toast.showError(e?.message ?? 'Chyba při ukládání služby')
    } finally {
      setSaving(false)
    }
  }, [copySource?.name, copyValidFrom, formValue, isCopyMode, isCustomService, propertyId, selectedId, selectService, toast])

  const handleSortChange = useCallback((nextSort: ListViewSortState) => {
    setSort(nextSort)
    void saveViewPrefs(SERVICE_CATALOG_VIEW_KEY, {
      colWidths: colPrefs.colWidths ?? {},
      colOrder: colPrefs.colOrder ?? [],
      colHidden: colPrefs.colHidden ?? [],
      sort: nextSort,
    })
  }, [colPrefs])

  const handleColumnResize = useCallback((key: string, px: number) => {
    setColPrefs((prev) => {
      const next = { ...prev, colWidths: { ...(prev.colWidths ?? {}), [key]: px } }
      void saveViewPrefs(SERVICE_CATALOG_VIEW_KEY, {
        colWidths: next.colWidths ?? {},
        colOrder: next.colOrder ?? [],
        colHidden: next.colHidden ?? [],
        sort: sort,
      })
      return next
    })
  }, [sort])

  const handleArchiveToggle = useCallback(
    async (serviceId: string, nextActive: boolean) => {
      if (readOnly) return
      try {
        await setPropertyServiceArchived(serviceId, !nextActive)
        
        // Aktualizovat seznam služeb
        const updatedServices = await listPropertyServices(propertyId, showInactive)
        setServices(updatedServices)
        
        if (!nextActive && selectedId === serviceId) {
          setSelectedId(null)
        }
      } catch (e: any) {
        logger.error('setPropertyServiceArchived failed', e)
        toast.showError(e?.message ?? 'Chyba při archivaci služby')
      }
    },
    [propertyId, readOnly, selectedId, toast]
  )

  const listItems = useMemo<ServiceCatalogListItem[]>(() => {
    const today = new Date()
    return orderedServices.map((row) => ({
      id: row.id,
      name: row.service_name ?? row.name ?? '—',
      categoryId: row.resolved_category_id ?? row.category_id ?? null,
      categoryName: row.category_name ?? '—',
      categoryColor: row.category_color ?? null,
      billingTypeName: row.billing_type_name ?? '—',
      billingTypeColor: row.billing_type_color ?? null,
      unitName: row.unit_name ?? '—',
      basePrice: row.amount ?? row.catalog_base_price ?? null,
      vatRateName: row.vat_rate_name ?? '—',
      active: !(row.is_archived ?? false) && isServiceActive(today, row.valid_from ?? null, row.valid_to ?? null),
      isArchived: !!row.is_archived,
    }))
  }, [orderedServices])

  const filteredItems = useMemo(() => {
    const q = searchText.trim().toLowerCase()
    const base = showInactive ? listItems : listItems.filter((item) => item.active)
    if (!q) return base
    return base.filter((item) => (
      item.name.toLowerCase().includes(q) ||
      item.categoryName.toLowerCase().includes(q) ||
      item.billingTypeName.toLowerCase().includes(q) ||
      item.unitName.toLowerCase().includes(q) ||
      item.vatRateName.toLowerCase().includes(q)
    ))
  }, [listItems, searchText, showInactive])

  useEffect(() => {
    onCountChange?.(filteredItems.length)
  }, [filteredItems.length, onCountChange])

  const columns = useMemo(() => applyColumnPrefs(SERVICE_CATALOG_BASE_COLUMNS, colPrefs), [colPrefs])

  const sortedRows = useMemo(() => {
    const rows = filteredItems.map((item) => {
      const row = buildServiceCatalogListRow(item)
      const isActive = !!item.active
      return {
        ...row,
        data: {
          ...row.data,
          active: (
            <input
              type="checkbox"
              checked={isActive}
              disabled={readOnly}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => handleArchiveToggle(String(row.id), e.target.checked)}
              aria-label={isActive ? 'Označit jako archivované' : 'Označit jako aktivní'}
              title={isActive ? 'Archivovat' : 'Obnovit'}
            />
          ),
        },
      }
    })
    if (!sort?.key) return rows
    const dir = sort.dir === 'desc' ? -1 : 1
    return [...rows].sort((a, b) => {
      const aVal = getServiceCatalogSortValue(a.raw as ServiceCatalogListItem, sort.key)
      const bVal = getServiceCatalogSortValue(b.raw as ServiceCatalogListItem, sort.key)
      if (aVal < bVal) return -1 * dir
      if (aVal > bVal) return 1 * dir
      return 0
    })
  }, [filteredItems, handleArchiveToggle, readOnly, sort])

  const selectedRow = useMemo(() => services.find((s) => s.id === selectedId) ?? null, [services, selectedId])
  const selectedIndex = useMemo(
    () => (selectedId ? orderedServices.findIndex((s) => s.id === selectedId) : -1),
    [orderedServices, selectedId]
  )
  const isFormReadOnly = readOnly || detailMode === 'read'
  const canGoPrevious = selectedIndex > 0
  const canGoNext = selectedIndex >= 0 && selectedIndex < services.length - 1
  const positionLabel = selectedIndex >= 0 ? `${selectedIndex + 1}/${orderedServices.length}` : null
  const tableMaxHeight = 'calc(100vh - 420px)'


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
    <div className="detail-form detail-form--fill">
      {viewMode === 'list' && (
        <>
          <section className="detail-form__section detail-form__section--auto">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 className="detail-form__section-title">Seznam služeb</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                {!readOnly && (
                  <button type="button" className="common-actions__btn" onClick={openDetailCreate}>
                    <span className="common-actions__icon">{getIcon('add' as IconKey)}</span>
                    <span className="common-actions__label">Nová</span>
                  </button>
                )}
                {!readOnly && selectedId && (
                  <button
                    type="button"
                    className="common-actions__btn"
                    onClick={handleDuplicate}
                    title="Vytvořit kopii vybrané služby"
                  >
                    <span className="common-actions__icon">{getIcon('duplicate' as IconKey)}</span>
                    <span className="common-actions__label">Kopie</span>
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
              <ListView
                columns={columns}
                rows={sortedRows}
                filterValue={searchText}
                onFilterChange={setSearchText}
                showArchived={showInactive}
                onShowArchivedChange={setShowInactive}
                showArchivedLabel="Zobrazit neaktivní"
                selectedId={selectedId}
                onRowClick={(row: ListViewRow) => setSelectedId(String(row.id))}
                onRowDoubleClick={(row: ListViewRow) => {
                  setSelectedId(String(row.id))
                  openDetailRead()
                }}
                sort={sort}
                onSortChange={handleSortChange}
                onColumnResize={handleColumnResize}
                onColumnSettings={() => setColsOpen(true)}
                tableWrapperMaxHeight={tableMaxHeight}
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
                  sort: sort,
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
            {/* Toolbar fixní nahoře */}
            <div className="detail-subdetail__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 className="detail-form__section-title" style={{ marginBottom: 0 }}>
                {detailMode === 'create' ? 'Nová služba' : 'Detail služby'}
              </h3>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {detailMode !== 'create' && selectedId && positionLabel && (
                <span className="common-actions__counter">{positionLabel}</span>
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
              {!readOnly && detailMode !== 'create' && (
                <button type="button" className="common-actions__btn" onClick={openDetailCreate}>
                  <span className="common-actions__icon">{getIcon('add' as IconKey)}</span>
                  <span className="common-actions__label">Přidat</span>
                </button>
              )}
              {detailMode !== 'read' && selectedId && (
                <button type="button" className="common-actions__btn" onClick={openDetailRead}>
                  <span className="common-actions__icon">{getIcon('view' as IconKey)}</span>
                  <span className="common-actions__label">Číst</span>
                </button>
              )}
              {detailMode === 'read' && !readOnly && selectedId && (
                <button type="button" className="common-actions__btn" onClick={openDetailEdit}>
                  <span className="common-actions__icon">{getIcon('edit' as IconKey)}</span>
                  <span className="common-actions__label">Editovat</span>
                </button>
              )}
              {!isFormReadOnly && (
                <button type="button" className="common-actions__btn" onClick={handleSave} disabled={saving}>
                  <span className="common-actions__icon">{getIcon('save' as IconKey)}</span>
                  <span className="common-actions__label">Uložit</span>
                </button>
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

            <div className="detail-subdetail__tabs" style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid var(--color-border)' }}>
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

            {/* Scrollovací oblast pro obsah */}
            <div className="detail-subdetail__content">
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

              {!isCustomService && detailMode === 'create' && (
                <div className="detail-form__field detail-form__field--span-2" style={{ padding: 12, background: 'var(--color-bg-secondary)', borderRadius: 4 }}>
                  <label className="detail-form__label" style={{ marginBottom: 8 }}>Katalogová služba</label>
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
                    value={formValue.serviceId}
                    onChange={(e) => handleCatalogChange(e.target.value)}
                    disabled={isFormReadOnly || loadingCatalog}
                  >
                    <option value="">{loadingCatalog ? 'Načítám katalog...' : '— vyber službu —'}</option>
                    {catalog.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="detail-form__field detail-form__field--span-2">
                <label className="detail-form__label">
                  Název služby
                  {formValue.validFrom || formValue.validTo ? (
                    <span
                      style={{
                        marginLeft: 12,
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 500,
                        backgroundColor: isServiceActive(new Date(), formValue.validFrom, formValue.validTo)
                          ? 'var(--color-success-light)'
                          : 'var(--color-warning-light)',
                        color: isServiceActive(new Date(), formValue.validFrom, formValue.validTo)
                          ? 'var(--color-success)'
                          : 'var(--color-warning)',
                      }}
                    >
                      {isServiceActive(new Date(), formValue.validFrom, formValue.validTo) ? '✓ Aktivní' : '⚠ Neaktivní'}
                    </span>
                  ) : null}
                </label>
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
                <label className="detail-form__label">Planost služby: od — do</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: 'var(--color-text-subtle)' }}>Platí od</label>
                    <input
                      type="date"
                      className="detail-form__input"
                      value={formValue.validFrom ?? ''}
                      onChange={(e) => setFormValue((prev) => ({ ...prev, validFrom: e.target.value || null }))}
                      disabled={isFormReadOnly || isCopyMode}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: 'var(--color-text-subtle)' }}>Platí do</label>
                    <input
                      type="date"
                      className="detail-form__input"
                      value={formValue.validTo ?? ''}
                      onChange={(e) => setFormValue((prev) => ({ ...prev, validTo: e.target.value || null }))}
                      readOnly={isFormReadOnly}
                    />
                  </div>
                </div>
              </div>

              <div className="detail-form__field detail-form__field--span-2">
                <label className="detail-form__label">Stav</label>
                <input
                  className="detail-form__input"
                  value={getServiceStatus(new Date(), formValue.validFrom, formValue.validTo, !!selectedRow?.is_archived)}
                  readOnly
                />
              </div>

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
            </div>
          </div>
        </section>
      )}

      {viewMode === 'attachments' && selectedId && (
        <section className="detail-form__section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 className="detail-form__section-title">Správa příloh</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => void attachmentsApiRef.current?.add()}
                className="common-actions__btn"
                title="Přidat přílohu"
              >
                <span className="common-actions__icon">{getIcon('add' as IconKey)}</span>
                <span className="common-actions__label">Přidat</span>
              </button>
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
