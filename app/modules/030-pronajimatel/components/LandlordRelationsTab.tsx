// FILE: app/modules/030-pronajimatel/components/LandlordRelationsTab.tsx
// PURPOSE: Přehled vazeb pronajímatele (nemovitosti, jednotky, nájemníci) v read-only režimu
// NOTES: Používá RelationListWithDetail a zobrazuje detail entity se všemi záložkami

'use client'

import React, { useEffect, useMemo, useState } from 'react'
import RelationListWithDetail, { type RelationItem } from '@/app/UI/RelationListWithDetail'
import { getLandlordRelations, type LandlordRelationProperty, type LandlordRelationTenant, type LandlordRelationUnit } from '@/app/lib/services/landlordRelations'
import { getPropertyDetail, type PropertyDetailRow } from '@/app/lib/services/properties'
import { getUnitDetail, type UnitDetailRow } from '@/app/lib/services/units'
import { getTenantDetail, type TenantDetailRow } from '@/app/lib/services/tenants'

import PropertyDetailFrame, { type UiProperty } from '@/app/modules/040-nemovitost/components/PropertyDetailFrame'
import UnitDetailFrame, { type UiUnit } from '@/app/modules/040-nemovitost/components/UnitDetailFrame'
import TenantDetailFrame, { type UiTenant } from '@/app/modules/050-najemnik/forms/TenantDetailFrame'

type Props = {
  landlordId: string
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

export default function LandlordRelationsTab({ landlordId }: Props) {
  const [loading, setLoading] = useState(true)
  const [errorText, setErrorText] = useState<string | null>(null)

  const [properties, setProperties] = useState<LandlordRelationProperty[]>([])
  const [units, setUnits] = useState<LandlordRelationUnit[]>([])
  const [tenants, setTenants] = useState<LandlordRelationTenant[]>([])

  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null)
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null)

  const [propertyDetail, setPropertyDetail] = useState<UiProperty | null>(null)
  const [unitDetail, setUnitDetail] = useState<UiUnit | null>(null)
  const [tenantDetail, setTenantDetail] = useState<UiTenant | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setErrorText(null)

    ;(async () => {
      try {
        const result = await getLandlordRelations(landlordId, { includeArchived: false })
        if (!active) return

        setProperties(result.properties)
        setUnits(result.units)
        setTenants(result.tenants)

        setSelectedPropertyId((prev) => prev ?? result.properties[0]?.id ?? null)
        setSelectedUnitId((prev) => prev ?? result.units[0]?.id ?? null)
        setSelectedTenantId((prev) => prev ?? result.tenants[0]?.id ?? null)
      } catch (err: any) {
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

  if (loading) {
    return <div className="detail-form__hint">Načítám vazby pronajimatele…</div>
  }

  if (errorText) {
    return <div className="detail-form__hint">{errorText}</div>
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <RelationListWithDetail
        title="Nemovitosti"
        items={propertyItems}
        selectedId={selectedPropertyId}
        onSelect={(id) => setSelectedPropertyId(String(id))}
        emptyText="Pronajímatel nemá žádné nemovitosti."
      >
        {propertyDetail ? (
          <PropertyDetailFrame property={propertyDetail} viewMode="read" embedded />
        ) : (
          <div className="detail-form__hint">Detail nemovitosti se nepodařilo načíst.</div>
        )}
      </RelationListWithDetail>

      <RelationListWithDetail
        title="Jednotky"
        items={unitItems}
        selectedId={selectedUnitId}
        onSelect={(id) => setSelectedUnitId(String(id))}
        emptyText="Pronajímatel nemá žádné jednotky."
      >
        {unitDetail ? (
          <UnitDetailFrame unit={unitDetail} viewMode="read" embedded />
        ) : (
          <div className="detail-form__hint">Detail jednotky se nepodařilo načíst.</div>
        )}
      </RelationListWithDetail>

      <RelationListWithDetail
        title="Nájemníci"
        items={tenantItems}
        selectedId={selectedTenantId}
        onSelect={(id) => setSelectedTenantId(String(id))}
        emptyText="Pronajímatel nemá žádné nájemníky."
      >
        {tenantDetail ? (
          <TenantDetailFrame tenant={tenantDetail} viewMode="read" embedded />
        ) : (
          <div className="detail-form__hint">Detail nájemníka se nepodařilo načíst.</div>
        )}
      </RelationListWithDetail>
    </div>
  )
}
