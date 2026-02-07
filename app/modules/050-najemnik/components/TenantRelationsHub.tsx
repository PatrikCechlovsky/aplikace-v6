// FILE: app/modules/050-najemnik/components/TenantRelationsHub.tsx
// PURPOSE: Samostatný content „Vazby“ pro nájemníka s taby a list+detail layoutem.
// NOTES: Otevírá se z CommonActions akce „Vazby“.

'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import DetailTabs, { type DetailTabItem } from '@/app/UI/DetailTabs'
import ListView, { type ListViewColumn, type ListViewRow, type ListViewSortState } from '@/app/UI/ListView'
import ListViewColumnsDrawer from '@/app/UI/ListViewColumnsDrawer'
import { getIcon } from '@/app/UI/icons'
import createLogger from '@/app/lib/logger'
import { applyColumnPrefs, loadViewPrefs, saveViewPrefs, type ViewPrefs, type ViewPrefsSortState } from '@/app/lib/services/viewPrefs'
import { getTenantDetail, type TenantDetailRow } from '@/app/lib/services/tenants'
import { getPropertyDetail, type PropertyDetailRow } from '@/app/lib/services/properties'
import { getUnitDetail, type UnitDetailRow } from '@/app/lib/services/units'
import { getLandlordDetail, type LandlordDetailRow } from '@/app/lib/services/landlords'
import { getTenantRelations, type TenantRelationProperty, type TenantRelationUnit, type TenantRelationLandlord } from '@/app/lib/services/tenantRelations'

import { LANDLORDS_BASE_COLUMNS } from '@/app/modules/030-pronajimatel/landlordsColumns'
import { PROPERTIES_BASE_COLUMNS } from '@/app/modules/040-nemovitost/propertiesColumns'
import { UNITS_BASE_COLUMNS } from '@/app/modules/040-nemovitost/unitsColumns'
import { TENANTS_BASE_COLUMNS } from '@/app/modules/050-najemnik/tenantsColumns'

import LandlordDetailFrame, { type UiLandlord } from '@/app/modules/030-pronajimatel/forms/LandlordDetailFrame'
import PropertyDetailFrame, { type UiProperty } from '@/app/modules/040-nemovitost/components/PropertyDetailFrame'
import UnitDetailFrame, { type UiUnit } from '@/app/modules/040-nemovitost/components/UnitDetailFrame'
import TenantDetailFrame, { type UiTenant } from '@/app/modules/050-najemnik/forms/TenantDetailFrame'

import '@/app/styles/components/TileLayout.css'
import '@/app/styles/components/DetailForm.css'
import '@/app/styles/components/CommonActions.css'

const logger = createLogger('TenantRelationsHub')

type RelationsTabId = 'tenant' | 'landlord' | 'property' | 'units' | 'contracts' | 'payments' | 'energy'

type Props = {
  tenantId: string
  tenantLabel?: string | null
}

type RelationNavItem = {
  id: string
  title: string
}

const TENANT_COLUMNS: ListViewColumn[] = TENANTS_BASE_COLUMNS
const LANDLORD_COLUMNS: ListViewColumn[] = LANDLORDS_BASE_COLUMNS
const PROPERTY_COLUMNS: ListViewColumn[] = PROPERTIES_BASE_COLUMNS
const UNIT_COLUMNS: ListViewColumn[] = UNITS_BASE_COLUMNS

const MAX_RELATION_ROWS_HEIGHT = 'calc(var(--table-header-h) + (var(--table-row-h) * 5) + 2px)'

function normalizeText(v: any): string {
  return String(v ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function compareValues(a: any, b: any): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a ?? '').localeCompare(String(b ?? ''), 'cs', { sensitivity: 'base' })
}

function sortItems<T>(items: T[], sort: ListViewSortState, getValue: (item: T, key: string) => any): T[] {
  if (!sort) return items
  const dir = sort.dir === 'asc' ? 1 : -1
  return [...items].sort((a, b) => compareValues(getValue(a, sort.key), getValue(b, sort.key)) * dir)
}

function useRelationListPrefs(
  viewKey: string,
  baseColumns: ListViewColumn[],
  defaultSort: ListViewSortState,
  opts?: { readOnly?: boolean }
) {
  const readOnly = !!opts?.readOnly
  const defaultSortRef = useRef<ListViewSortState>(defaultSort)
  const [sort, setSort] = useState<ListViewSortState>(defaultSort)
  const [colPrefs, setColPrefs] = useState<Pick<ViewPrefs, 'colWidths' | 'colOrder' | 'colHidden'>>({
    colWidths: {},
    colOrder: [],
    colHidden: [],
  })
  const [colsOpen, setColsOpen] = useState(false)
  const prefsLoadedRef = useRef(false)
  const saveTimerRef = useRef<any>(null)

  useEffect(() => {
    void (async () => {
      const prefs = await loadViewPrefs(viewKey, { v: 1, sort: defaultSortRef.current as ViewPrefsSortState, colWidths: {}, colOrder: [], colHidden: [] })
      setSort((prefs.sort as ViewPrefsSortState) ?? defaultSortRef.current)
      setColPrefs({
        colWidths: prefs.colWidths ?? {},
        colOrder: prefs.colOrder ?? [],
        colHidden: prefs.colHidden ?? [],
      })
      prefsLoadedRef.current = true
    })()
  }, [viewKey])

  useEffect(() => {
    if (readOnly) return
    if (!prefsLoadedRef.current) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)

    const payload: ViewPrefs = {
      v: 1,
      sort: sort as ViewPrefsSortState,
      colWidths: colPrefs.colWidths ?? {},
      colOrder: colPrefs.colOrder ?? [],
      colHidden: colPrefs.colHidden ?? [],
    }

    saveTimerRef.current = setTimeout(() => {
      void saveViewPrefs(viewKey, payload)
    }, 500)
  }, [viewKey, sort, colPrefs, readOnly])

  const columns = useMemo(() => applyColumnPrefs(baseColumns, colPrefs), [baseColumns, colPrefs])

  const handleColumnResize = useCallback((key: string, px: number) => {
    setColPrefs((p) => ({ ...p, colWidths: { ...(p.colWidths ?? {}), [key]: px } }))
  }, [])

  return {
    sort,
    setSort,
    columns,
    colPrefs,
    setColPrefs,
    colsOpen,
    setColsOpen,
    handleColumnResize,
  }
}

function RelationDetailPanel({
  title,
  items,
  selectedId,
  onSelect,
  children,
}: {
  title: string
  items: RelationNavItem[]
  selectedId: string | number | null
  onSelect: (id: string | number) => void
  children: React.ReactNode
}) {
  const idx = selectedId == null ? -1 : items.findIndex((i) => i.id === selectedId)
  const current = idx >= 0 ? items[idx] : null
  const canPrev = idx > 0
  const canNext = idx >= 0 && idx < items.length - 1
  const positionLabel = idx >= 0 ? `${idx + 1} z ${items.length}` : `0 z ${items.length}`

  return (
    <div className="relation-detail">
      <div className="relation-detail__toolbar">
        <div className="relation-detail__title">{current?.title ?? title}</div>
        <div className="relation-detail__nav">
          <div className="relation-detail__count">{positionLabel}</div>
          <button
            type="button"
            className="relation-detail__nav-btn"
            onClick={() => canPrev && onSelect(items[idx - 1].id)}
            disabled={!canPrev}
            aria-label="Předchozí"
          >
            {getIcon('chevron-left')}
          </button>
          <button
            type="button"
            className="relation-detail__nav-btn"
            onClick={() => canNext && onSelect(items[idx + 1].id)}
            disabled={!canNext}
            aria-label="Další"
          >
            {getIcon('chevron-right')}
          </button>
        </div>
      </div>
      <div className="relation-detail__content">{children}</div>
    </div>
  )
}

function mapTenantDetailToUi(row: TenantDetailRow): UiTenant {
  return {
    id: row.id,
    displayName: row.display_name ?? '—',
    email: row.email ?? null,
    phone: row.phone ?? null,
    subjectType: row.subject_type ?? null,
    isArchived: row.is_archived ?? null,
    createdAt: row.created_at ?? '',

    titleBefore: row.title_before ?? null,
    firstName: row.first_name ?? null,
    lastName: row.last_name ?? null,
    note: row.note ?? null,

    birthDate: row.birth_date ?? null,
    personalIdNumber: row.personal_id_number ?? null,
    idDocType: row.id_doc_type ?? null,
    idDocNumber: row.id_doc_number ?? null,

    companyName: row.company_name ?? null,
    ic: row.ic ?? null,
    dic: row.dic ?? null,
    icValid: row.ic_valid ?? null,
    dicValid: row.dic_valid ?? null,
    delegateIds: (row as any).delegateIds ?? [],

    street: row.street ?? null,
    city: row.city ?? null,
    zip: row.zip ?? null,
    houseNumber: row.house_number ?? null,
    country: row.country ?? null,

    isUser: null,
    isLandlord: null,
    isLandlordDelegate: null,
    isTenant: true,
    isTenantDelegate: null,
    isMaintenance: null,
    isMaintenanceDelegate: null,
  }
}

function mapLandlordDetailToUi(row: LandlordDetailRow): UiLandlord {
  return {
    id: row.id,
    displayName: row.display_name ?? '—',
    email: row.email ?? null,
    phone: row.phone ?? null,
    subjectType: row.subject_type ?? null,
    isArchived: row.is_archived ?? null,
    createdAt: row.created_at ?? '',

    titleBefore: row.title_before ?? null,
    firstName: row.first_name ?? null,
    lastName: row.last_name ?? null,
    note: row.note ?? null,

    birthDate: row.birth_date ?? null,
    personalIdNumber: row.personal_id_number ?? null,
    idDocType: row.id_doc_type ?? null,
    idDocNumber: row.id_doc_number ?? null,

    companyName: row.company_name ?? null,
    ic: row.ic ?? null,
    dic: row.dic ?? null,
    icValid: row.ic_valid ?? null,
    dicValid: row.dic_valid ?? null,
    delegateIds: [],

    street: row.street ?? null,
    city: row.city ?? null,
    zip: row.zip ?? null,
    houseNumber: row.house_number ?? null,
    country: row.country ?? null,

    isUser: null,
    isLandlord: true,
    isLandlordDelegate: null,
    isTenant: null,
    isTenantDelegate: null,
    isMaintenance: null,
    isMaintenanceDelegate: null,
  }
}

function mapPropertyDetailToUi(row: PropertyDetailRow): UiProperty {
  return {
    id: row.id,
    landlordId: row.landlord_id ?? null,
    propertyTypeId: row.property_type_id ?? null,
    displayName: row.display_name ?? null,
    internalCode: row.internal_code ?? null,

    street: row.street ?? null,
    houseNumber: row.house_number ?? null,
    city: row.city ?? null,
    zip: row.zip ?? null,
    country: row.country ?? null,
    region: row.region ?? null,

    landArea: row.land_area ?? null,
    builtUpArea: row.built_up_area ?? null,
    buildingArea: row.building_area ?? null,
    numberOfFloors: row.number_of_floors ?? null,
    floorsAboveGround: row.floors_above_ground ?? null,
    floorsBelowGround: row.floors_below_ground ?? null,
    unitsCount: row.units_count ?? null,

    buildYear: row.build_year ?? null,
    reconstructionYear: row.reconstruction_year ?? null,

    cadastralArea: row.cadastral_area ?? null,
    parcelNumber: row.parcel_number ?? null,
    lvNumber: row.lv_number ?? null,

    note: row.note ?? null,
    originModule: row.origin_module ?? null,
    isArchived: row.is_archived ?? null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  }
}

function mapUnitDetailToUi(row: UnitDetailRow): UiUnit {
  return {
    id: row.id,
    propertyId: row.property_id ?? null,
    unitTypeId: row.unit_type_id ?? null,
    landlordId: row.landlord_id ?? null,
    displayName: row.display_name ?? null,
    internalCode: row.internal_code ?? null,

    street: row.street ?? null,
    houseNumber: row.house_number ?? null,
    city: row.city ?? null,
    zip: row.zip ?? null,
    country: row.country ?? null,
    region: row.region ?? null,

    floor: row.floor ?? null,
    doorNumber: row.door_number ?? null,
    area: row.area ?? null,
    rooms: row.rooms ?? null,
    disposition: row.disposition ?? null,
    status: row.status ?? null,
    tenantId: row.tenant_id ?? null,
    orientationNumber: row.orientation_number ?? null,
    yearRenovated: row.year_renovated ?? null,
    managerName: row.manager_name ?? null,

    cadastralArea: null,
    parcelNumber: null,
    lvNumber: null,

    note: row.note ?? null,
    originModule: row.origin_module ?? null,
    isArchived: row.is_archived ?? null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  }
}

function createLandlordFallback(id: string, displayName?: string | null): UiLandlord {
  return {
    id,
    displayName: displayName ?? '—',
    email: null,
    phone: null,
    subjectType: null,
    isArchived: null,
    createdAt: '',

    titleBefore: null,
    firstName: null,
    lastName: null,
    note: null,

    birthDate: null,
    personalIdNumber: null,
    idDocType: null,
    idDocNumber: null,

    companyName: null,
    ic: null,
    dic: null,
    icValid: null,
    dicValid: null,
    delegateIds: [],

    street: null,
    city: null,
    zip: null,
    houseNumber: null,
    country: null,

    isUser: null,
    isLandlord: true,
    isLandlordDelegate: null,
    isTenant: null,
    isTenantDelegate: null,
    isMaintenance: null,
    isMaintenanceDelegate: null,
  }
}

export default function TenantRelationsHub({ tenantId, tenantLabel }: Props) {
  const [activeTab, setActiveTab] = useState<RelationsTabId>('tenant')
  const [loading, setLoading] = useState(true)
  const [errorText, setErrorText] = useState<string | null>(null)

  const [tenantDetail, setTenantDetail] = useState<UiTenant | null>(null)
  const [units, setUnits] = useState<TenantRelationUnit[]>([])
  const [properties, setProperties] = useState<TenantRelationProperty[]>([])
  const [landlords, setLandlords] = useState<TenantRelationLandlord[]>([])

  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(tenantId)
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)
  const [selectedLandlordId, setSelectedLandlordId] = useState<string | null>(null)

  const [selectedUnitDetail, setSelectedUnitDetail] = useState<UiUnit | null>(null)
  const [selectedPropertyDetail, setSelectedPropertyDetail] = useState<UiProperty | null>(null)
  const [selectedLandlordDetail, setSelectedLandlordDetail] = useState<UiLandlord | null>(null)

  const tenantsList = useRelationListPrefs('030.tenants.list', TENANT_COLUMNS, { key: 'displayName', dir: 'asc' }, { readOnly: true })
  const unitsList = useRelationListPrefs('040.units.list', UNIT_COLUMNS, { key: 'displayName', dir: 'asc' }, { readOnly: true })
  const propertiesList = useRelationListPrefs('040.properties.list', PROPERTY_COLUMNS, { key: 'displayName', dir: 'asc' }, { readOnly: true })
  const landlordsList = useRelationListPrefs('030.landlords.list', LANDLORD_COLUMNS, { key: 'displayName', dir: 'asc' }, { readOnly: true })

  const [tenantFilter, setTenantFilter] = useState('')
  const [unitsFilter, setUnitsFilter] = useState('')
  const [propertiesFilter, setPropertiesFilter] = useState('')
  const [landlordsFilter, setLandlordsFilter] = useState('')

  useEffect(() => {
    setSelectedTenantId(tenantId)
  }, [tenantId])

  useEffect(() => {
    let active = true
    if (!tenantId) {
      setErrorText('Chybí identifikátor nájemníka.')
      setLoading(false)
      return () => {
        active = false
      }
    }
    setLoading(true)
    setErrorText(null)

    ;(async () => {
      try {
        const [tenantRow, relations] = await Promise.all([
          getTenantDetail(tenantId),
          getTenantRelations(tenantId, { includeArchived: false }),
        ])
        if (!active) return

        setTenantDetail(mapTenantDetailToUi(tenantRow))
        setUnits(relations.units)
        setProperties(relations.properties)
        setLandlords(relations.landlords)

        setSelectedUnitId((prev) => prev ?? relations.units[0]?.id ?? null)
        setSelectedPropertyId((prev) => prev ?? relations.properties[0]?.id ?? null)
        setSelectedLandlordId((prev) => prev ?? relations.landlords[0]?.id ?? null)
      } catch (err: any) {
        logger.error('Failed to load tenant relations', err)
        if (!active) return
        setErrorText(err?.message || 'Nepodařilo se načíst vazby nájemníka.')
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [tenantId])

  useEffect(() => {
    let active = true
    const unitId = selectedUnitId
    if (!unitId) {
      setSelectedUnitDetail(null)
      return () => {
        active = false
      }
    }

    ;(async () => {
      try {
        const unitRes = await getUnitDetail(unitId)
        if (!active) return
        setSelectedUnitDetail(mapUnitDetailToUi(unitRes.unit))
      } catch (err) {
        if (active) setSelectedUnitDetail(null)
      }
    })()

    return () => {
      active = false
    }
  }, [selectedUnitId])

  useEffect(() => {
    let active = true
    const propertyId = selectedPropertyId
    if (!propertyId) {
      setSelectedPropertyDetail(null)
      return () => {
        active = false
      }
    }

    ;(async () => {
      try {
        const propertyRes = await getPropertyDetail(propertyId)
        if (!active) return
        setSelectedPropertyDetail(mapPropertyDetailToUi(propertyRes.property))
      } catch (err) {
        if (active) setSelectedPropertyDetail(null)
      }
    })()

    return () => {
      active = false
    }
  }, [selectedPropertyId])

  useEffect(() => {
    let active = true
    const landlordId = selectedLandlordId
    if (!landlordId) {
      setSelectedLandlordDetail(null)
      return () => {
        active = false
      }
    }

    ;(async () => {
      try {
        const landlordRow = await getLandlordDetail(landlordId)
        if (!active) return
        setSelectedLandlordDetail(mapLandlordDetailToUi(landlordRow))
      } catch (err) {
        if (active) {
          const fallbackName = landlords.find((l) => l.id === landlordId)?.display_name ?? null
          setSelectedLandlordDetail(createLandlordFallback(landlordId, fallbackName))
        }
      }
    })()

    return () => {
      active = false
    }
  }, [selectedLandlordId, landlords])

  const tenantData = useMemo(() => (tenantDetail ? [tenantDetail] : []), [tenantDetail])
  const tenantFiltered = useMemo(() => {
    const f = normalizeText(tenantFilter)
    if (!f) return tenantData
    return tenantData.filter((t) => {
      const hay = normalizeText([t.subjectType, t.displayName, t.email, t.phone].filter(Boolean).join(' '))
      return hay.includes(f)
    })
  }, [tenantData, tenantFilter])
  const tenantSorted = useMemo(() => {
    return sortItems(tenantFiltered, tenantsList.sort, (t, key) => {
      switch (key) {
        case 'subjectTypeLabel':
          return normalizeText(t.subjectType)
        case 'displayName':
          return normalizeText(t.displayName)
        case 'fullAddress':
          return ''
        case 'email':
          return normalizeText(t.email)
        case 'phone':
          return normalizeText(t.phone)
        case 'companyName':
          return ''
        case 'ic':
          return ''
        case 'firstName':
          return ''
        case 'lastName':
          return ''
        case 'isArchived':
          return t.isArchived ? 1 : 0
        default:
          return ''
      }
    })
  }, [tenantFiltered, tenantsList.sort])
  const tenantRows = useMemo<ListViewRow<UiTenant>[]>(() => {
    return tenantSorted.map((t) => ({
      id: t.id,
      data: {
        subjectTypeLabel: t.subjectType || '—',
        displayName: t.displayName || '—',
        fullAddress: '—',
        email: t.email || '—',
        phone: t.phone || '—',
        companyName: '—',
        ic: '—',
        firstName: '—',
        lastName: '—',
        isArchived: t.isArchived ? 'Ano' : 'Ne',
      },
      raw: t,
    }))
  }, [tenantSorted])
  const tenantNavItems = useMemo<RelationNavItem[]>(() => tenantSorted.map((t) => ({ id: t.id, title: t.displayName || '—' })), [tenantSorted])

  const unitsFiltered = useMemo(() => {
    const f = normalizeText(unitsFilter)
    if (!f) return units
    return units.filter((u) => {
      const hay = normalizeText([u.unit_type_name, u.display_name, u.internal_code, u.property_name, u.status, u.floor, u.rooms, u.area].filter(Boolean).join(' '))
      return hay.includes(f)
    })
  }, [units, unitsFilter])
  const unitsSorted = useMemo(() => {
    return sortItems(unitsFiltered, unitsList.sort, (u, key) => {
      switch (key) {
        case 'unitTypeName':
          return normalizeText(u.unit_type_name)
        case 'displayName':
          return normalizeText(u.display_name || u.internal_code)
        case 'propertyName':
          return normalizeText(u.property_name)
        case 'floor':
          return u.floor ?? 0
        case 'area':
          return u.area ?? 0
        case 'rooms':
          return u.rooms ?? 0
        case 'status':
          return normalizeText(u.status)
        default:
          return ''
      }
    })
  }, [unitsFiltered, unitsList.sort])
  const unitsRows = useMemo<ListViewRow<TenantRelationUnit>[]>(() => {
    return unitsSorted.map((u) => ({
      id: u.id,
      data: {
        unitTypeName: u.unit_type_name || '—',
        displayName: u.display_name || u.internal_code || '—',
        propertyName: u.property_name || '—',
        floor: u.floor ?? '—',
        area: u.area ?? '—',
        rooms: u.rooms ?? '—',
        status: u.status || '—',
      },
      raw: u,
    }))
  }, [unitsSorted])
  const unitNavItems = useMemo<RelationNavItem[]>(() => unitsSorted.map((u) => ({ id: u.id, title: u.display_name || u.internal_code || '—' })), [unitsSorted])

  const propertiesFiltered = useMemo(() => {
    const f = normalizeText(propertiesFilter)
    if (!f) return properties
    return properties.filter((p) => {
      const address = [[p.street, p.house_number].filter(Boolean).join(' '), p.city, p.zip].filter(Boolean).join(', ')
      const hay = normalizeText([p.display_name, address].filter(Boolean).join(' '))
      return hay.includes(f)
    })
  }, [properties, propertiesFilter])
  const propertiesSorted = useMemo(() => {
    return sortItems(propertiesFiltered, propertiesList.sort, (p, key) => {
      const address = [[p.street, p.house_number].filter(Boolean).join(' '), p.city, p.zip].filter(Boolean).join(', ')
      switch (key) {
        case 'propertyTypeName':
          return normalizeText(p.property_type_name)
        case 'displayName':
          return normalizeText(p.display_name)
        case 'fullAddress':
          return normalizeText(address)
        case 'landlordName':
          return normalizeText(p.landlord_name)
        case 'buildingArea':
          return p.building_area ?? 0
        case 'unitsCount':
          return p.units_count ?? 0
        default:
          return ''
      }
    })
  }, [propertiesFiltered, propertiesList.sort])
  const propertiesRows = useMemo<ListViewRow<TenantRelationProperty>[]>(() => {
    return propertiesSorted.map((p) => {
      const address = [[p.street, p.house_number].filter(Boolean).join(' '), p.city, p.zip].filter(Boolean).join(', ')
      return {
        id: p.id,
        data: {
          propertyTypeName: p.property_type_name || '—',
          displayName: p.display_name || '—',
          fullAddress: address || '—',
          landlordName: p.landlord_name || '—',
          buildingArea: p.building_area ?? '—',
          unitsCount: p.units_count ?? '—',
        },
        raw: p,
      }
    })
  }, [propertiesSorted])
  const propertyNavItems = useMemo<RelationNavItem[]>(() => propertiesSorted.map((p) => ({ id: p.id, title: p.display_name || '—' })), [propertiesSorted])

  const landlordsFiltered = useMemo(() => {
    const f = normalizeText(landlordsFilter)
    if (!f) return landlords
    return landlords.filter((l) => {
      const hay = normalizeText([l.display_name, l.subject_type, l.email, l.phone].filter(Boolean).join(' '))
      return hay.includes(f)
    })
  }, [landlords, landlordsFilter])
  const landlordsSorted = useMemo(() => {
    return sortItems(landlordsFiltered, landlordsList.sort, (l, key) => {
      switch (key) {
        case 'subjectTypeLabel':
          return normalizeText(l.subject_type)
        case 'displayName':
          return normalizeText(l.display_name)
        case 'fullAddress':
          return ''
        case 'email':
          return normalizeText(l.email)
        case 'phone':
          return normalizeText(l.phone)
        case 'companyName':
          return ''
        case 'ic':
          return ''
        case 'firstName':
          return ''
        case 'lastName':
          return ''
        case 'isArchived':
          return l.is_archived ? 1 : 0
        default:
          return ''
      }
    })
  }, [landlordsFiltered, landlordsList.sort])
  const landlordsRows = useMemo<ListViewRow<TenantRelationLandlord>[]>(() => {
    return landlordsSorted.map((l) => ({
      id: l.id,
      data: {
        subjectTypeLabel: l.subject_type || '—',
        displayName: l.display_name || '—',
        fullAddress: '—',
        email: l.email || '—',
        phone: l.phone || '—',
        companyName: '—',
        ic: '—',
        firstName: '—',
        lastName: '—',
        isArchived: l.is_archived ? 'Ano' : 'Ne',
      },
      raw: l,
    }))
  }, [landlordsSorted])
  const landlordNavItems = useMemo<RelationNavItem[]>(() => landlordsSorted.map((l) => ({ id: l.id, title: l.display_name || '—' })), [landlordsSorted])

  const tabs: DetailTabItem[] = useMemo(() => {
    return [
      { id: 'landlord', label: `Pronajímatel (${landlordsRows.length})` },
      { id: 'property', label: `Nemovitost (${propertiesRows.length})` },
      { id: 'units', label: `Jednotky (${unitsRows.length})` },
      { id: 'tenant', label: `Nájemník (${tenantRows.length})` },
      { id: 'contracts', label: 'Smlouvy (0)' },
      { id: 'payments', label: 'Platby (0)' },
      { id: 'energy', label: 'Energie (0)' },
    ]
  }, [landlordsRows.length, propertiesRows.length, unitsRows.length, tenantRows.length])

  const headerTitle = tenantDetail?.displayName || tenantLabel || 'Nájemník'

  if (loading) {
    return (
      <div className="tile-layout">
        <div className="tile-layout__header">
          <h1 className="tile-layout__title">Vazby – {headerTitle}</h1>
        </div>
        <div className="tile-layout__content">
          <div className="detail-form__hint">Načítám vazby nájemníka…</div>
        </div>
      </div>
    )
  }

  if (errorText) {
    return (
      <div className="tile-layout">
        <div className="tile-layout__header">
          <h1 className="tile-layout__title">Vazby – {headerTitle}</h1>
        </div>
        <div className="tile-layout__content">
          <div className="detail-form__hint">{errorText}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="tile-layout">
      <div className="tile-layout__header">
        <h1 className="tile-layout__title">Vazby – {headerTitle}</h1>
        <p className="tile-layout__description">Přehled vazeb entity s rychlým přepínáním detailů.</p>
      </div>
      <div className="tile-layout__content" style={{ display: 'grid', gap: 12 }}>
        <DetailTabs items={tabs} activeId={activeTab} onChange={(id) => setActiveTab(id as RelationsTabId)} ariaLabel="Vazby" />

        {activeTab === 'tenant' && (
          <div className="relation-pane">
            <div className="relation-pane__list">
              <ListView
                columns={tenantsList.columns}
                rows={tenantRows}
                filterValue={tenantFilter}
                onFilterChange={setTenantFilter}
                selectedId={selectedTenantId}
                onRowClick={(row) => setSelectedTenantId(String(row.id))}
                sort={tenantsList.sort}
                onSortChange={tenantsList.setSort}
                onColumnResize={tenantsList.handleColumnResize}
                tableWrapperMaxHeight={MAX_RELATION_ROWS_HEIGHT}
                emptyText="Nájemník nebyl nalezen."
                toolbarRight={
                  <button
                    type="button"
                    className="common-actions__btn"
                    title="Nastavit sloupce"
                    onClick={() => tenantsList.setColsOpen(true)}
                  >
                    {getIcon('settings')}
                    <span className="common-actions__label">Sloupce</span>
                  </button>
                }
              />
              <ListViewColumnsDrawer
                open={tenantsList.colsOpen}
                onClose={() => tenantsList.setColsOpen(false)}
                columns={TENANT_COLUMNS}
                fixedFirstKey="subjectTypeLabel"
                requiredKeys={['email']}
                value={{
                  order: tenantsList.colPrefs.colOrder ?? [],
                  hidden: tenantsList.colPrefs.colHidden ?? [],
                }}
                onChange={(next) => {
                  tenantsList.setColPrefs((p) => ({
                    ...p,
                    colOrder: next.order,
                    colHidden: next.hidden,
                  }))
                }}
                onReset={() => {
                  tenantsList.setColPrefs((p) => ({
                    ...p,
                    colOrder: [],
                    colHidden: [],
                  }))
                }}
              />
            </div>
            <div className="relation-pane__detail">
              {tenantRows.length === 0 && <div className="detail-form__hint">Žádná data k zobrazení.</div>}
              {tenantRows.length > 0 && selectedTenantId == null && (
                <div className="detail-form__hint">Vyber položku ze seznamu nahoře.</div>
              )}
              {tenantRows.length > 0 && selectedTenantId != null && (
                <RelationDetailPanel
                  title="Nájemník"
                  items={tenantNavItems}
                  selectedId={selectedTenantId}
                  onSelect={(id) => setSelectedTenantId(String(id))}
                >
                  {tenantDetail ? (
                    <TenantDetailFrame tenant={tenantDetail} viewMode="read" embedded />
                  ) : (
                    <div className="detail-form__hint">Detail nájemníka se nepodařilo načíst.</div>
                  )}
                </RelationDetailPanel>
              )}
            </div>
          </div>
        )}

        {activeTab === 'landlord' && (
          <div className="relation-pane">
            <div className="relation-pane__list">
              <ListView
                columns={landlordsList.columns}
                rows={landlordsRows}
                filterValue={landlordsFilter}
                onFilterChange={setLandlordsFilter}
                selectedId={selectedLandlordId}
                onRowClick={(row) => setSelectedLandlordId(String(row.id))}
                sort={landlordsList.sort}
                onSortChange={landlordsList.setSort}
                onColumnResize={landlordsList.handleColumnResize}
                tableWrapperMaxHeight={MAX_RELATION_ROWS_HEIGHT}
                emptyText="Nájemník nemá pronajímatele."
                toolbarRight={
                  <button
                    type="button"
                    className="common-actions__btn"
                    title="Nastavit sloupce"
                    onClick={() => landlordsList.setColsOpen(true)}
                  >
                    {getIcon('settings')}
                    <span className="common-actions__label">Sloupce</span>
                  </button>
                }
              />
              <ListViewColumnsDrawer
                open={landlordsList.colsOpen}
                onClose={() => landlordsList.setColsOpen(false)}
                columns={LANDLORD_COLUMNS}
                fixedFirstKey="subjectTypeLabel"
                requiredKeys={['email']}
                value={{
                  order: landlordsList.colPrefs.colOrder ?? [],
                  hidden: landlordsList.colPrefs.colHidden ?? [],
                }}
                onChange={(next) => {
                  landlordsList.setColPrefs((p) => ({
                    ...p,
                    colOrder: next.order,
                    colHidden: next.hidden,
                  }))
                }}
                onReset={() => {
                  landlordsList.setColPrefs((p) => ({
                    ...p,
                    colOrder: [],
                    colHidden: [],
                  }))
                }}
              />
            </div>
            <div className="relation-pane__detail">
              {landlordsRows.length === 0 && <div className="detail-form__hint">Žádná data k zobrazení.</div>}
              {landlordsRows.length > 0 && selectedLandlordId == null && (
                <div className="detail-form__hint">Vyber položku ze seznamu nahoře.</div>
              )}
              {landlordsRows.length > 0 && selectedLandlordId != null && (
                <RelationDetailPanel
                  title="Pronajímatel"
                  items={landlordNavItems}
                  selectedId={selectedLandlordId}
                  onSelect={(id) => setSelectedLandlordId(String(id))}
                >
                  {selectedLandlordDetail ? (
                    <LandlordDetailFrame landlord={selectedLandlordDetail} viewMode="read" embedded />
                  ) : (
                    <div className="detail-form__hint">Detail pronajimatele se nepodařilo načíst.</div>
                  )}
                </RelationDetailPanel>
              )}
            </div>
          </div>
        )}

        {activeTab === 'property' && (
          <div className="relation-pane">
            <div className="relation-pane__list">
              <ListView
                columns={propertiesList.columns}
                rows={propertiesRows}
                filterValue={propertiesFilter}
                onFilterChange={setPropertiesFilter}
                selectedId={selectedPropertyId}
                onRowClick={(row) => setSelectedPropertyId(String(row.id))}
                sort={propertiesList.sort}
                onSortChange={propertiesList.setSort}
                onColumnResize={propertiesList.handleColumnResize}
                tableWrapperMaxHeight={MAX_RELATION_ROWS_HEIGHT}
                emptyText="Nájemník nemá nemovitosti."
                toolbarRight={
                  <button
                    type="button"
                    className="common-actions__btn"
                    title="Nastavit sloupce"
                    onClick={() => propertiesList.setColsOpen(true)}
                  >
                    {getIcon('settings')}
                    <span className="common-actions__label">Sloupce</span>
                  </button>
                }
              />
              <ListViewColumnsDrawer
                open={propertiesList.colsOpen}
                onClose={() => propertiesList.setColsOpen(false)}
                columns={PROPERTY_COLUMNS}
                fixedFirstKey="propertyTypeName"
                requiredKeys={['displayName']}
                value={{
                  order: propertiesList.colPrefs.colOrder ?? [],
                  hidden: propertiesList.colPrefs.colHidden ?? [],
                }}
                onChange={(next) => {
                  propertiesList.setColPrefs((p) => ({
                    ...p,
                    colOrder: next.order,
                    colHidden: next.hidden,
                  }))
                }}
                onReset={() => {
                  propertiesList.setColPrefs((p) => ({
                    ...p,
                    colOrder: [],
                    colHidden: [],
                  }))
                }}
              />
            </div>
            <div className="relation-pane__detail">
              {propertiesRows.length === 0 && <div className="detail-form__hint">Žádná data k zobrazení.</div>}
              {propertiesRows.length > 0 && selectedPropertyId == null && (
                <div className="detail-form__hint">Vyber položku ze seznamu nahoře.</div>
              )}
              {propertiesRows.length > 0 && selectedPropertyId != null && (
                <RelationDetailPanel
                  title="Nemovitost"
                  items={propertyNavItems}
                  selectedId={selectedPropertyId}
                  onSelect={(id) => setSelectedPropertyId(String(id))}
                >
                  {selectedPropertyDetail ? (
                    <PropertyDetailFrame property={selectedPropertyDetail} viewMode="read" embedded />
                  ) : (
                    <div className="detail-form__hint">Detail nemovitosti se nepodařilo načíst.</div>
                  )}
                </RelationDetailPanel>
              )}
            </div>
          </div>
        )}

        {activeTab === 'units' && (
          <div className="relation-pane">
            <div className="relation-pane__list">
              <ListView
                columns={unitsList.columns}
                rows={unitsRows}
                filterValue={unitsFilter}
                onFilterChange={setUnitsFilter}
                selectedId={selectedUnitId}
                onRowClick={(row) => setSelectedUnitId(String(row.id))}
                sort={unitsList.sort}
                onSortChange={unitsList.setSort}
                onColumnResize={unitsList.handleColumnResize}
                tableWrapperMaxHeight={MAX_RELATION_ROWS_HEIGHT}
                emptyText="Nájemník nemá jednotky."
                toolbarRight={
                  <button
                    type="button"
                    className="common-actions__btn"
                    title="Nastavit sloupce"
                    onClick={() => unitsList.setColsOpen(true)}
                  >
                    {getIcon('settings')}
                    <span className="common-actions__label">Sloupce</span>
                  </button>
                }
              />
              <ListViewColumnsDrawer
                open={unitsList.colsOpen}
                onClose={() => unitsList.setColsOpen(false)}
                columns={UNIT_COLUMNS}
                fixedFirstKey="unitTypeName"
                requiredKeys={['displayName']}
                value={{
                  order: unitsList.colPrefs.colOrder ?? [],
                  hidden: unitsList.colPrefs.colHidden ?? [],
                }}
                onChange={(next) => {
                  unitsList.setColPrefs((p) => ({
                    ...p,
                    colOrder: next.order,
                    colHidden: next.hidden,
                  }))
                }}
                onReset={() => {
                  unitsList.setColPrefs((p) => ({
                    ...p,
                    colOrder: [],
                    colHidden: [],
                  }))
                }}
              />
            </div>
            <div className="relation-pane__detail">
              {unitsRows.length === 0 && <div className="detail-form__hint">Žádná data k zobrazení.</div>}
              {unitsRows.length > 0 && selectedUnitId == null && (
                <div className="detail-form__hint">Vyber položku ze seznamu nahoře.</div>
              )}
              {unitsRows.length > 0 && selectedUnitId != null && (
                <RelationDetailPanel
                  title="Jednotky"
                  items={unitNavItems}
                  selectedId={selectedUnitId}
                  onSelect={(id) => setSelectedUnitId(String(id))}
                >
                  {selectedUnitDetail ? (
                    <UnitDetailFrame unit={selectedUnitDetail} viewMode="read" embedded />
                  ) : (
                    <div className="detail-form__hint">Detail jednotky se nepodařilo načíst.</div>
                  )}
                </RelationDetailPanel>
              )}
            </div>
          </div>
        )}

        {activeTab === 'contracts' && (
          <div className="relation-pane">
            <div className="relation-pane__list">
              <ListView
                columns={[{ key: 'name', label: 'Smlouva', width: 260 }]}
                rows={[]}
                filterValue=""
                onFilterChange={() => undefined}
                emptyText="Zatím nejsou žádné smlouvy."
                tableWrapperMaxHeight={MAX_RELATION_ROWS_HEIGHT}
              />
            </div>
            <div className="relation-pane__detail">
              <div className="detail-form__hint">Detail smlouvy bude dostupný po doplnění vazeb.</div>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="relation-pane">
            <div className="relation-pane__list">
              <ListView
                columns={[{ key: 'name', label: 'Platby', width: 260 }]}
                rows={[]}
                filterValue=""
                onFilterChange={() => undefined}
                emptyText="Zatím nejsou žádné platby."
                tableWrapperMaxHeight={MAX_RELATION_ROWS_HEIGHT}
              />
            </div>
            <div className="relation-pane__detail">
              <div className="detail-form__hint">Detail plateb bude dostupný po doplnění vazeb.</div>
            </div>
          </div>
        )}

        {activeTab === 'energy' && (
          <div className="relation-pane">
            <div className="relation-pane__list">
              <ListView
                columns={[{ key: 'name', label: 'Energie', width: 260 }]}
                rows={[]}
                filterValue=""
                onFilterChange={() => undefined}
                emptyText="Zatím nejsou žádné vazby na energie."
                tableWrapperMaxHeight={MAX_RELATION_ROWS_HEIGHT}
              />
            </div>
            <div className="relation-pane__detail">
              <div className="detail-form__hint">Detail energií bude dostupný po doplnění vazeb.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
