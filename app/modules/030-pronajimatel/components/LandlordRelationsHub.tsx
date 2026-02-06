// FILE: app/modules/030-pronajimatel/components/LandlordRelationsHub.tsx
// PURPOSE: Samostatný content „Vazby“ pro pronajímatele s taby a list+detail layoutem.
// NOTES: Otevírá se z CommonActions akce „Vazby“.

'use client'

import React, { useEffect, useMemo, useState } from 'react'
import DetailTabs, { type DetailTabItem } from '@/app/UI/DetailTabs'
import RelationListWithDetail, { type RelationItem } from '@/app/UI/RelationListWithDetail'
import { getIcon } from '@/app/UI/icons'
import createLogger from '@/app/lib/logger'
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

const logger = createLogger('LandlordRelationsHub')

type RelationsTabId = 'landlord' | 'properties' | 'units' | 'tenants' | 'contracts' | 'energy' | 'payments'

type Props = {
  landlordId: string
  landlordLabel?: string | null
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

function RelationDetailNav({
  title,
  items,
  selectedId,
  onSelect,
  children,
}: {
  title: string
  items: RelationItem[]
  selectedId: string | number | null
  onSelect: (id: string | number) => void
  children: React.ReactNode
}) {
  const idx = selectedId == null ? -1 : items.findIndex((i) => i.id === selectedId)
  const current = idx >= 0 ? items[idx] : null
  const canPrev = idx > 0
  const canNext = idx >= 0 && idx < items.length - 1

  return (
    <RelationListWithDetail title={title} items={items} selectedId={selectedId} onSelect={onSelect}>
      <div className="relation-detail">
        <div className="relation-detail__toolbar">
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
          <div className="relation-detail__title">{current?.primary ?? title}</div>
        </div>
        <div className="relation-detail__content">{children}</div>
      </div>
    </RelationListWithDetail>
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

  useEffect(() => {
    setSelectedLandlordId(landlordId)
  }, [landlordId])

  useEffect(() => {
    let active = true
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

  const landlordItems: RelationItem[] = useMemo(() => {
    return [
      {
        id: landlordId,
        primary: landlordDetail?.displayName ?? landlordLabel ?? '—',
        secondary: [landlordDetail?.email, landlordDetail?.phone].filter(Boolean).join(' · ') || '—',
      },
    ]
  }, [landlordId, landlordDetail, landlordLabel])

  const propertyItems: RelationItem[] = useMemo(() => {
    return properties.map((p) => {
      const address = [
        [p.street, p.house_number].filter(Boolean).join(' '),
        p.city,
        p.zip,
      ]
        .filter(Boolean)
        .join(', ')

      return {
        id: p.id,
        primary: p.display_name || '—',
        secondary: address || '—',
        badge: p.is_archived ? 'Archivováno' : undefined,
      }
    })
  }, [properties])

  const unitItems: RelationItem[] = useMemo(() => {
    return units.map((u) => {
      const secondary = u.property_name ? `Nemovitost: ${u.property_name}` : '—'
      return {
        id: u.id,
        primary: u.display_name || u.internal_code || '—',
        secondary,
        badge: u.is_archived ? 'Archivováno' : undefined,
      }
    })
  }, [units])

  const tenantItems: RelationItem[] = useMemo(() => {
    return tenants.map((t) => {
      const secondary = [t.email, t.phone].filter(Boolean).join(' · ') || '—'
      return {
        id: t.id,
        primary: t.display_name || '—',
        secondary,
        badge: t.is_archived ? 'Archivováno' : undefined,
      }
    })
  }, [tenants])

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
          <RelationDetailNav
            title="Pronajímatel"
            items={landlordItems}
            selectedId={selectedLandlordId}
            onSelect={(id) => setSelectedLandlordId(String(id))}
          >
            {landlordDetail ? (
              <LandlordDetailFrame landlord={landlordDetail} viewMode="read" embedded />
            ) : (
              <div className="detail-form__hint">Detail pronajimatele se nepodařilo načíst.</div>
            )}
          </RelationDetailNav>
        )}

        {activeTab === 'properties' && (
          <RelationDetailNav
            title="Nemovitosti"
            items={propertyItems}
            selectedId={selectedPropertyId}
            onSelect={(id) => setSelectedPropertyId(String(id))}
          >
            {propertyDetail ? (
              <PropertyDetailFrame property={propertyDetail} viewMode="read" embedded />
            ) : (
              <div className="detail-form__hint">Detail nemovitosti se nepodařilo načíst.</div>
            )}
          </RelationDetailNav>
        )}

        {activeTab === 'units' && (
          <RelationDetailNav
            title="Jednotky"
            items={unitItems}
            selectedId={selectedUnitId}
            onSelect={(id) => setSelectedUnitId(String(id))}
          >
            {unitDetail ? (
              <UnitDetailFrame unit={unitDetail} viewMode="read" embedded />
            ) : (
              <div className="detail-form__hint">Detail jednotky se nepodařilo načíst.</div>
            )}
          </RelationDetailNav>
        )}

        {activeTab === 'tenants' && (
          <RelationDetailNav
            title="Nájemníci"
            items={tenantItems}
            selectedId={selectedTenantId}
            onSelect={(id) => setSelectedTenantId(String(id))}
          >
            {tenantDetail ? (
              <TenantDetailFrame tenant={tenantDetail} viewMode="read" embedded />
            ) : (
              <div className="detail-form__hint">Detail nájemníka se nepodařilo načíst.</div>
            )}
          </RelationDetailNav>
        )}

        {activeTab === 'contracts' && (
          <RelationListWithDetail title="Smlouvy" items={[]} selectedId={null} onSelect={() => undefined} emptyText="Zatím nejsou žádné smlouvy." />
        )}

        {activeTab === 'energy' && (
          <RelationListWithDetail title="Energie" items={[]} selectedId={null} onSelect={() => undefined} emptyText="Zatím nejsou žádné vazby na energie." />
        )}

        {activeTab === 'payments' && (
          <RelationListWithDetail title="Platby" items={[]} selectedId={null} onSelect={() => undefined} emptyText="Zatím nejsou žádné platby." />
        )}
      </div>
    </div>
  )
}
