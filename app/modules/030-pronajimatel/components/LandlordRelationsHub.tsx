// FILE: app/modules/030-pronajimatel/components/LandlordRelationsHub.tsx
// PURPOSE: Samostatný content „Vazby“ pro pronajímatele s taby a list+detail layoutem.
// NOTES: Otevírá se z CommonActions akce „Vazby“.

'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import DetailTabs, { type DetailTabItem } from '@/app/UI/DetailTabs'
import ListView, { type ListViewColumn, type ListViewRow, type ListViewSortState } from '@/app/UI/ListView'
import ListViewColumnsDrawer from '@/app/UI/ListViewColumnsDrawer'
import { getIcon } from '@/app/UI/icons'
import createLogger from '@/app/lib/logger'
import { applyColumnPrefs, loadViewPrefs, saveViewPrefs, type ViewPrefs, type ViewPrefsSortState } from '@/app/lib/services/viewPrefs'
import { getLandlordRelations, type LandlordRelationProperty, type LandlordRelationTenant, type LandlordRelationUnit } from '@/app/lib/services/landlordRelations'
import { getLandlordDetail, type LandlordDetailRow } from '@/app/lib/services/landlords'
import { getPropertyDetail, type PropertyDetailRow } from '@/app/lib/services/properties'
import { getUnitDetail, type UnitDetailRow } from '@/app/lib/services/units'
import { getTenantDetail, type TenantDetailRow } from '@/app/lib/services/tenants'

import LandlordDetailFrame, { type UiLandlord } from '@/app/modules/030-pronajimatel/forms/LandlordDetailFrame'
import PropertyDetailFrame, { type UiProperty } from '@/app/modules/040-nemovitost/components/PropertyDetailFrame'
import UnitDetailFrame, { type UiUnit } from '@/app/modules/040-nemovitost/components/UnitDetailFrame'
import TenantDetailFrame, { type UiTenant } from '@/app/modules/050-najemnik/forms/TenantDetailFrame'

import '@/app/styles/components/TileLayout.css'
import '@/app/styles/components/DetailForm.css'
import '@/app/styles/components/CommonActions.css'

const logger = createLogger('LandlordRelationsHub')

type RelationsTabId = 'landlord' | 'properties' | 'units' | 'tenants' | 'contracts' | 'energy' | 'payments'

type Props = {
  landlordId: string
  landlordLabel?: string | null
}

const LANDLORD_COLUMNS: ListViewColumn[] = [
  { key: 'displayName', label: 'Pronajímatel', width: 220, sortable: true },
  { key: 'subjectType', label: 'Typ', width: 160, sortable: true },
  { key: 'email', label: 'E-mail', width: 220, sortable: true },
  { key: 'phone', label: 'Telefon', width: 160, sortable: true },
  { key: 'archived', label: 'Archiv', width: 120, sortable: true, align: 'center' },
]

const PROPERTY_COLUMNS: ListViewColumn[] = [
  { key: 'displayName', label: 'Nemovitost', width: 240, sortable: true },
  { key: 'address', label: 'Adresa', width: 320, sortable: true },
  { key: 'archived', label: 'Archiv', width: 120, sortable: true, align: 'center' },
]

const UNIT_COLUMNS: ListViewColumn[] = [
  { key: 'displayName', label: 'Jednotka', width: 220, sortable: true },
  { key: 'propertyName', label: 'Nemovitost', width: 260, sortable: true },
  { key: 'status', label: 'Stav', width: 140, sortable: true },
  { key: 'archived', label: 'Archiv', width: 120, sortable: true, align: 'center' },
]

const TENANT_COLUMNS: ListViewColumn[] = [
  { key: 'displayName', label: 'Nájemník', width: 220, sortable: true },
  { key: 'email', label: 'E-mail', width: 220, sortable: true },
  { key: 'phone', label: 'Telefon', width: 160, sortable: true },
  { key: 'archived', label: 'Archiv', width: 120, sortable: true, align: 'center' },
]

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
    delegateIds: [],

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

type RelationNavItem = {
  id: string
  title: string
}

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

function useRelationListPrefs(viewKey: string, baseColumns: ListViewColumn[], defaultSort: ListViewSortState) {
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
      const prefs = await loadViewPrefs(viewKey, { v: 1, sort: defaultSort as ViewPrefsSortState, colWidths: {}, colOrder: [], colHidden: [] })
      setSort((prefs.sort as ViewPrefsSortState) ?? defaultSort)
      setColPrefs({
        colWidths: prefs.colWidths ?? {},
        colOrder: prefs.colOrder ?? [],
        colHidden: prefs.colHidden ?? [],
      })
      prefsLoadedRef.current = true
    })()
  }, [viewKey, defaultSort])

  useEffect(() => {
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
  }, [viewKey, sort, colPrefs])

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

  return (
    <div className="relation-detail">
      <div className="relation-detail__toolbar">
        <div className="relation-detail__title">{current?.title ?? title}</div>
        <div className="relation-detail__nav">
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

export default function LandlordRelationsHub({ landlordId, landlordLabel }: Props) {
  const [activeTab, setActiveTab] = useState<RelationsTabId>('landlord')
  const [loading, setLoading] = useState(true)
  const [errorText, setErrorText] = useState<string | null>(null)

  const [landlordDetail, setLandlordDetail] = useState<UiLandlord | null>(null)
  const [properties, setProperties] = useState<LandlordRelationProperty[]>([])
  const [units, setUnits] = useState<LandlordRelationUnit[]>([])
  const [tenants, setTenants] = useState<LandlordRelationTenant[]>([])

  const [selectedLandlordId, setSelectedLandlordId] = useState<string | null>(landlordId)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null)
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null)

  const [propertyDetail, setPropertyDetail] = useState<UiProperty | null>(null)
  const [unitDetail, setUnitDetail] = useState<UiUnit | null>(null)
  const [tenantDetail, setTenantDetail] = useState<UiTenant | null>(null)

  const landlordList = useRelationListPrefs('relations.landlord.landlord', LANDLORD_COLUMNS, { key: 'displayName', dir: 'asc' })
  const propertiesList = useRelationListPrefs('relations.landlord.properties', PROPERTY_COLUMNS, { key: 'displayName', dir: 'asc' })
  const unitsList = useRelationListPrefs('relations.landlord.units', UNIT_COLUMNS, { key: 'displayName', dir: 'asc' })
  const tenantsList = useRelationListPrefs('relations.landlord.tenants', TENANT_COLUMNS, { key: 'displayName', dir: 'asc' })

  const [landlordFilter, setLandlordFilter] = useState('')
  const [propertiesFilter, setPropertiesFilter] = useState('')
  const [unitsFilter, setUnitsFilter] = useState('')
  const [tenantsFilter, setTenantsFilter] = useState('')

  useEffect(() => {
    setSelectedLandlordId(landlordId)
  }, [landlordId])

  useEffect(() => {
    let active = true
    if (!landlordId) {
      setErrorText('Chybí identifikátor pronajímatele.')
      setLoading(false)
      return () => {
        active = false
      }
    }
    setLoading(true)
    setErrorText(null)

    ;(async () => {
      try {
        const [relations, landlordRow] = await Promise.all([
          getLandlordRelations(landlordId, { includeArchived: false }),
          getLandlordDetail(landlordId),
        ])
        if (!active) return

        setLandlordDetail(mapLandlordDetailToUi(landlordRow))
        setProperties(relations.properties)
        setUnits(relations.units)
        setTenants(relations.tenants)

        setSelectedPropertyId((prev) => prev ?? relations.properties[0]?.id ?? null)
        setSelectedUnitId((prev) => prev ?? relations.units[0]?.id ?? null)
        setSelectedTenantId((prev) => prev ?? relations.tenants[0]?.id ?? null)
      } catch (err: any) {
        logger.error('Failed to load landlord relations', err)
        if (!active) return
        setErrorText(err?.message || 'Nepodařilo se načíst vazby pronajimatele.')
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [landlordId])

  useEffect(() => {
    let active = true
    if (!selectedPropertyId) {
      setPropertyDetail(null)
      return
    }

    ;(async () => {
      try {
        const detail = await getPropertyDetail(selectedPropertyId)
        if (!active) return
        setPropertyDetail(mapPropertyDetailToUi(detail.property))
      } catch (err) {
        if (active) setPropertyDetail(null)
      }
    })()

    return () => {
      active = false
    }
  }, [selectedPropertyId])

  useEffect(() => {
    let active = true
    if (!selectedUnitId) {
      setUnitDetail(null)
      return
    }

    ;(async () => {
      try {
        const detail = await getUnitDetail(selectedUnitId)
        if (!active) return
        setUnitDetail(mapUnitDetailToUi(detail.unit))
      } catch (err) {
        if (active) setUnitDetail(null)
      }
    })()

    return () => {
      active = false
    }
  }, [selectedUnitId])

  useEffect(() => {
    let active = true
    if (!selectedTenantId) {
      setTenantDetail(null)
      return
    }

    ;(async () => {
      try {
        const detail = await getTenantDetail(selectedTenantId)
        if (!active) return
        setTenantDetail(mapTenantDetailToUi(detail))
      } catch (err) {
        if (active) setTenantDetail(null)
      }
    })()

    return () => {
      active = false
    }
  }, [selectedTenantId])

  const landlordData = useMemo(() => (landlordDetail ? [landlordDetail] : []), [landlordDetail])
  const landlordFiltered = useMemo(() => {
    const f = normalizeText(landlordFilter)
    if (!f) return landlordData
    return landlordData.filter((l) => {
      const hay = normalizeText([l.displayName, l.subjectType, l.email, l.phone].filter(Boolean).join(' '))
      return hay.includes(f)
    })
  }, [landlordData, landlordFilter])
  const landlordSorted = useMemo(() => {
    return sortItems(landlordFiltered, landlordList.sort, (l, key) => {
      switch (key) {
        case 'displayName':
          return normalizeText(l.displayName)
        case 'subjectType':
          return normalizeText(l.subjectType)
        case 'email':
          return normalizeText(l.email)
        case 'phone':
          return normalizeText(l.phone)
        case 'archived':
          return l.isArchived ? 1 : 0
        default:
          return ''
      }
    })
  }, [landlordFiltered, landlordList.sort])
  const landlordRows = useMemo<ListViewRow<UiLandlord>[]>(() => {
    return landlordSorted.map((l) => ({
      id: l.id,
      data: {
        displayName: l.displayName || '—',
        subjectType: l.subjectType || '—',
        email: l.email || '—',
        phone: l.phone || '—',
        archived: l.isArchived ? 'Ano' : 'Ne',
      },
      raw: l,
    }))
  }, [landlordSorted])
  const landlordNavItems = useMemo<RelationNavItem[]>(() => landlordSorted.map((l) => ({ id: l.id, title: l.displayName || '—' })), [landlordSorted])

  const propertyFiltered = useMemo(() => {
    const f = normalizeText(propertiesFilter)
    if (!f) return properties
    return properties.filter((p) => {
      const address = [[p.street, p.house_number].filter(Boolean).join(' '), p.city, p.zip].filter(Boolean).join(', ')
      const hay = normalizeText([p.display_name, address].filter(Boolean).join(' '))
      return hay.includes(f)
    })
  }, [properties, propertiesFilter])
  const propertySorted = useMemo(() => {
    return sortItems(propertyFiltered, propertiesList.sort, (p, key) => {
      const address = [[p.street, p.house_number].filter(Boolean).join(' '), p.city, p.zip].filter(Boolean).join(', ')
      switch (key) {
        case 'displayName':
          return normalizeText(p.display_name)
        case 'address':
          return normalizeText(address)
        case 'archived':
          return p.is_archived ? 1 : 0
        default:
          return ''
      }
    })
  }, [propertyFiltered, propertiesList.sort])
  const propertyRows = useMemo<ListViewRow<LandlordRelationProperty>[]>(() => {
    return propertySorted.map((p) => {
      const address = [[p.street, p.house_number].filter(Boolean).join(' '), p.city, p.zip].filter(Boolean).join(', ')
      return {
        id: p.id,
        data: {
          displayName: p.display_name || '—',
          address: address || '—',
          archived: p.is_archived ? 'Ano' : 'Ne',
        },
        raw: p,
      }
    })
  }, [propertySorted])
  const propertyNavItems = useMemo<RelationNavItem[]>(() => propertySorted.map((p) => ({ id: p.id, title: p.display_name || '—' })), [propertySorted])

  const unitFiltered = useMemo(() => {
    const f = normalizeText(unitsFilter)
    if (!f) return units
    return units.filter((u) => {
      const hay = normalizeText([u.display_name, u.internal_code, u.property_name, u.status].filter(Boolean).join(' '))
      return hay.includes(f)
    })
  }, [units, unitsFilter])
  const unitSorted = useMemo(() => {
    return sortItems(unitFiltered, unitsList.sort, (u, key) => {
      switch (key) {
        case 'displayName':
          return normalizeText(u.display_name || u.internal_code)
        case 'propertyName':
          return normalizeText(u.property_name)
        case 'status':
          return normalizeText(u.status)
        case 'archived':
          return u.is_archived ? 1 : 0
        default:
          return ''
      }
    })
  }, [unitFiltered, unitsList.sort])
  const unitRows = useMemo<ListViewRow<LandlordRelationUnit>[]>(() => {
    return unitSorted.map((u) => ({
      id: u.id,
      data: {
        displayName: u.display_name || u.internal_code || '—',
        propertyName: u.property_name || '—',
        status: u.status || '—',
        archived: u.is_archived ? 'Ano' : 'Ne',
      },
      raw: u,
    }))
  }, [unitSorted])
  const unitNavItems = useMemo<RelationNavItem[]>(() => unitSorted.map((u) => ({ id: u.id, title: u.display_name || u.internal_code || '—' })), [unitSorted])

  const tenantFiltered = useMemo(() => {
    const f = normalizeText(tenantsFilter)
    if (!f) return tenants
    return tenants.filter((t) => {
      const hay = normalizeText([t.display_name, t.email, t.phone].filter(Boolean).join(' '))
      return hay.includes(f)
    })
  }, [tenants, tenantsFilter])
  const tenantSorted = useMemo(() => {
    return sortItems(tenantFiltered, tenantsList.sort, (t, key) => {
      switch (key) {
        case 'displayName':
          return normalizeText(t.display_name)
        case 'email':
          return normalizeText(t.email)
        case 'phone':
          return normalizeText(t.phone)
        case 'archived':
          return t.is_archived ? 1 : 0
        default:
          return ''
      }
    })
  }, [tenantFiltered, tenantsList.sort])
  const tenantRows = useMemo<ListViewRow<LandlordRelationTenant>[]>(() => {
    return tenantSorted.map((t) => ({
      id: t.id,
      data: {
        displayName: t.display_name || '—',
        email: t.email || '—',
        phone: t.phone || '—',
        archived: t.is_archived ? 'Ano' : 'Ne',
      },
      raw: t,
    }))
  }, [tenantSorted])
  const tenantNavItems = useMemo<RelationNavItem[]>(() => tenantSorted.map((t) => ({ id: t.id, title: t.display_name || '—' })), [tenantSorted])

  const tabs: DetailTabItem[] = useMemo(() => {
    return [
      { id: 'landlord', label: 'Pronajímatel' },
      { id: 'properties', label: 'Nemovitosti' },
      { id: 'units', label: 'Jednotky' },
      { id: 'tenants', label: 'Nájemníci' },
      { id: 'contracts', label: 'Smlouvy' },
      { id: 'energy', label: 'Energie' },
      { id: 'payments', label: 'Platby' },
    ]
  }, [])

  const headerTitle = landlordDetail?.displayName || landlordLabel || 'Pronajímatel'

  if (loading) {
    return (
      <div className="tile-layout">
        <div className="tile-layout__header">
          <h1 className="tile-layout__title">Vazby – {headerTitle}</h1>
        </div>
        <div className="tile-layout__content">
          <div className="detail-form__hint">Načítám vazby pronajimatele…</div>
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

        {activeTab === 'landlord' && (
          <div className="relation-pane">
            <div className="relation-pane__list">
              <div className="relation-pane__header">Pronajímatel</div>
              <ListView
                columns={landlordList.columns}
                rows={landlordRows}
                filterValue={landlordFilter}
                onFilterChange={setLandlordFilter}
                selectedId={selectedLandlordId}
                onRowClick={(row) => setSelectedLandlordId(String(row.id))}
                sort={landlordList.sort}
                onSortChange={landlordList.setSort}
                onColumnResize={landlordList.handleColumnResize}
                tableWrapperMaxHeight={MAX_RELATION_ROWS_HEIGHT}
                emptyText="Pronajímatel nebyl nalezen."
                toolbarRight={
                  <button
                    type="button"
                    className="common-actions__btn"
                    title="Nastavit sloupce"
                    onClick={() => landlordList.setColsOpen(true)}
                  >
                    {getIcon('settings')}
                    <span className="common-actions__label">Sloupce</span>
                  </button>
                }
              />
              <ListViewColumnsDrawer
                open={landlordList.colsOpen}
                onClose={() => landlordList.setColsOpen(false)}
                columns={LANDLORD_COLUMNS}
                fixedFirstKey="displayName"
                requiredKeys={['displayName']}
                value={{
                  order: landlordList.colPrefs.colOrder ?? [],
                  hidden: landlordList.colPrefs.colHidden ?? [],
                }}
                onChange={(next) => {
                  landlordList.setColPrefs((p) => ({
                    ...p,
                    colOrder: next.order,
                    colHidden: next.hidden,
                  }))
                }}
                onReset={() => {
                  landlordList.setColPrefs((p) => ({
                    ...p,
                    colOrder: [],
                    colHidden: [],
                  }))
                }}
              />
            </div>
            <div className="relation-pane__detail">
              {landlordRows.length === 0 && <div className="detail-form__hint">Žádná data k zobrazení.</div>}
              {landlordRows.length > 0 && selectedLandlordId == null && (
                <div className="detail-form__hint">Vyber položku ze seznamu nahoře.</div>
              )}
              {landlordRows.length > 0 && selectedLandlordId != null && (
                <RelationDetailPanel
                  title="Pronajímatel"
                  items={landlordNavItems}
                  selectedId={selectedLandlordId}
                  onSelect={(id) => setSelectedLandlordId(String(id))}
                >
                  {landlordDetail ? (
                    <LandlordDetailFrame landlord={landlordDetail} viewMode="read" embedded />
                  ) : (
                    <div className="detail-form__hint">Detail pronajimatele se nepodařilo načíst.</div>
                  )}
                </RelationDetailPanel>
              )}
            </div>
          </div>
        )}

        {activeTab === 'properties' && (
          <div className="relation-pane">
            <div className="relation-pane__list">
              <div className="relation-pane__header">Nemovitosti</div>
              <ListView
                columns={propertiesList.columns}
                rows={propertyRows}
                filterValue={propertiesFilter}
                onFilterChange={setPropertiesFilter}
                selectedId={selectedPropertyId}
                onRowClick={(row) => setSelectedPropertyId(String(row.id))}
                sort={propertiesList.sort}
                onSortChange={propertiesList.setSort}
                onColumnResize={propertiesList.handleColumnResize}
                tableWrapperMaxHeight={MAX_RELATION_ROWS_HEIGHT}
                emptyText="Pronajímatel nemá žádné nemovitosti."
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
                fixedFirstKey="displayName"
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
              {propertyRows.length === 0 && <div className="detail-form__hint">Žádná data k zobrazení.</div>}
              {propertyRows.length > 0 && selectedPropertyId == null && (
                <div className="detail-form__hint">Vyber položku ze seznamu nahoře.</div>
              )}
              {propertyRows.length > 0 && selectedPropertyId != null && (
                <RelationDetailPanel
                  title="Nemovitosti"
                  items={propertyNavItems}
                  selectedId={selectedPropertyId}
                  onSelect={(id) => setSelectedPropertyId(String(id))}
                >
                  {propertyDetail ? (
                    <PropertyDetailFrame property={propertyDetail} viewMode="read" embedded />
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
              <div className="relation-pane__header">Jednotky</div>
              <ListView
                columns={unitsList.columns}
                rows={unitRows}
                filterValue={unitsFilter}
                onFilterChange={setUnitsFilter}
                selectedId={selectedUnitId}
                onRowClick={(row) => setSelectedUnitId(String(row.id))}
                sort={unitsList.sort}
                onSortChange={unitsList.setSort}
                onColumnResize={unitsList.handleColumnResize}
                tableWrapperMaxHeight={MAX_RELATION_ROWS_HEIGHT}
                emptyText="Pronajímatel nemá žádné jednotky."
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
                fixedFirstKey="displayName"
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
              {unitRows.length === 0 && <div className="detail-form__hint">Žádná data k zobrazení.</div>}
              {unitRows.length > 0 && selectedUnitId == null && (
                <div className="detail-form__hint">Vyber položku ze seznamu nahoře.</div>
              )}
              {unitRows.length > 0 && selectedUnitId != null && (
                <RelationDetailPanel
                  title="Jednotky"
                  items={unitNavItems}
                  selectedId={selectedUnitId}
                  onSelect={(id) => setSelectedUnitId(String(id))}
                >
                  {unitDetail ? (
                    <UnitDetailFrame unit={unitDetail} viewMode="read" embedded />
                  ) : (
                    <div className="detail-form__hint">Detail jednotky se nepodařilo načíst.</div>
                  )}
                </RelationDetailPanel>
              )}
            </div>
          </div>
        )}

        {activeTab === 'tenants' && (
          <div className="relation-pane">
            <div className="relation-pane__list">
              <div className="relation-pane__header">Nájemníci</div>
              <ListView
                columns={tenantsList.columns}
                rows={tenantRows}
                filterValue={tenantsFilter}
                onFilterChange={setTenantsFilter}
                selectedId={selectedTenantId}
                onRowClick={(row) => setSelectedTenantId(String(row.id))}
                sort={tenantsList.sort}
                onSortChange={tenantsList.setSort}
                onColumnResize={tenantsList.handleColumnResize}
                tableWrapperMaxHeight={MAX_RELATION_ROWS_HEIGHT}
                emptyText="Pronajímatel nemá žádné nájemníky."
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
                fixedFirstKey="displayName"
                requiredKeys={['displayName']}
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
                  title="Nájemníci"
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

        {activeTab === 'contracts' && (
          <div className="relation-pane">
            <div className="relation-pane__list">
              <div className="relation-pane__header">Smlouvy</div>
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

        {activeTab === 'energy' && (
          <div className="relation-pane">
            <div className="relation-pane__list">
              <div className="relation-pane__header">Energie</div>
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

        {activeTab === 'payments' && (
          <div className="relation-pane">
            <div className="relation-pane__list">
              <div className="relation-pane__header">Platby</div>
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
      </div>
    </div>
  )
}
