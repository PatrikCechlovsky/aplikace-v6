// FILE: app/lib/services/tenantRelations.ts
// PURPOSE: Načítání vazeb nájemníka (jednotky, nemovitosti, pronajímatelé)
// NOTES: Používá Supabase a minimalizuje logiku v UI

import { supabase } from '@/app/lib/supabaseClient'
import type { UnitsListRow } from '@/app/lib/services/units'
import type { PropertiesListRow } from '@/app/lib/services/properties'

export type TenantRelationUnit = UnitsListRow

export type TenantRelationProperty = PropertiesListRow

export type TenantRelationLandlord = {
  id: string
  display_name: string | null
  email: string | null
  phone: string | null
  subject_type: string | null
  is_archived: boolean | null
}

export type TenantRelationsResult = {
  units: TenantRelationUnit[]
  properties: TenantRelationProperty[]
  landlords: TenantRelationLandlord[]
}

export async function getTenantRelations(tenantId: string, opts?: { includeArchived?: boolean }): Promise<TenantRelationsResult> {
  const includeArchived = !!opts?.includeArchived

  let unitsQuery = supabase
    .from('units')
    .select(
      `
        id,
        property_id,
        unit_type_id,
        landlord_id,
        display_name,
        internal_code,
        tenant_id,
        street,
        house_number,
        city,
        zip,
        country,
        region,
        floor,
        door_number,
        area,
        rooms,
        disposition,
        status,
        is_archived,
        orientation_number,
        year_renovated,
        manager_name,
        created_at,
        property:properties!units_property_id_fkey(display_name, landlord_id),
        unit_type:generic_types!fk_units_type_generic(name, icon, color)
      `
    )
    .eq('tenant_id', tenantId)
    .order('display_name', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (!includeArchived) {
    unitsQuery = unitsQuery.or('is_archived.is.null,is_archived.eq.false')
  }

  const { data: unitRows, error: unitsError } = await unitsQuery
  if (unitsError) throw new Error(unitsError.message)

  const units: TenantRelationUnit[] = (unitRows ?? []).map((row: any) => {
    const property = Array.isArray(row.property) ? row.property[0] : row.property
    const unitType = Array.isArray(row.unit_type) ? row.unit_type[0] : row.unit_type

    return {
      id: row.id,
      property_id: row.property_id ?? null,
      unit_type_id: row.unit_type_id ?? null,
      landlord_id: row.landlord_id ?? property?.landlord_id ?? null,
      display_name: row.display_name ?? null,
      internal_code: row.internal_code ?? null,

      street: row.street ?? null,
      house_number: row.house_number ?? null,
      city: row.city ?? null,
      zip: row.zip ?? null,
      country: row.country ?? null,
      region: row.region ?? null,

      floor: row.floor ?? null,
      door_number: row.door_number ?? null,
      area: row.area ?? null,
      rooms: row.rooms ?? null,
      disposition: row.disposition ?? null,
      status: row.status ?? null,
      tenant_id: row.tenant_id ?? null,
      orientation_number: row.orientation_number ?? null,
      year_renovated: row.year_renovated ?? null,
      manager_name: row.manager_name ?? null,

      is_archived: row.is_archived ?? null,
      created_at: row.created_at ?? null,

      property_name: property?.display_name ?? null,
      unit_type_name: unitType?.name ?? null,
      unit_type_icon: unitType?.icon ?? null,
      unit_type_color: unitType?.color ?? null,
    }
  })

  const propertyIds = Array.from(new Set(units.map((u) => u.property_id).filter(Boolean))) as string[]
  const landlordIdsFromUnits = Array.from(new Set(units.map((u) => u.landlord_id).filter(Boolean))) as string[]

  let properties: TenantRelationProperty[] = []
  if (propertyIds.length > 0) {
    let propertyQuery = supabase
      .from('properties')
      .select(
        `
          id,
          landlord_id,
          property_type_id,
          display_name,
          internal_code,
          street,
          house_number,
          city,
          zip,
          country,
          region,
          land_area,
          building_area,
          is_archived,
          created_at,
          landlord:subjects!properties_landlord_id_fkey(display_name),
          property_type:generic_types!fk_properties_type_generic(name, icon, color, order_index)
        `
      )
      .in('id', propertyIds)
      .order('display_name', { ascending: true, nullsFirst: false })

    if (!includeArchived) {
      propertyQuery = propertyQuery.or('is_archived.is.null,is_archived.eq.false')
    }

    const { data: propertyRows, error: propertyError } = await propertyQuery
    if (propertyError) throw new Error(propertyError.message)

    const unitCountMap: Record<string, number> = {}
    units.forEach((u) => {
      if (!u.property_id) return
      unitCountMap[u.property_id] = (unitCountMap[u.property_id] ?? 0) + 1
    })

    properties = (propertyRows ?? []).map((row: any) => {
      const landlord = Array.isArray(row.landlord) ? row.landlord[0] : row.landlord
      const propertyType = Array.isArray(row.property_type) ? row.property_type[0] : row.property_type

      return {
        id: row.id,
        landlord_id: row.landlord_id ?? null,
        property_type_id: row.property_type_id ?? null,
        display_name: row.display_name ?? null,
        internal_code: row.internal_code ?? null,

        street: row.street ?? null,
        house_number: row.house_number ?? null,
        city: row.city ?? null,
        zip: row.zip ?? null,
        country: row.country ?? null,
        region: row.region ?? null,

        land_area: row.land_area ?? null,
        building_area: row.building_area ?? null,

        is_archived: row.is_archived ?? null,
        created_at: row.created_at ?? null,

        landlord_name: landlord?.display_name ?? null,
        property_type_name: propertyType?.name ?? null,
        property_type_icon: propertyType?.icon ?? null,
        property_type_color: propertyType?.color ?? null,
        property_type_order_index: propertyType?.order_index ?? null,
        units_count: unitCountMap[row.id] ?? 0,
      }
    })
  }

  const landlordIdsFromProperties = Array.from(new Set(properties.map((p) => p.landlord_id).filter(Boolean))) as string[]
  const landlordIds = Array.from(new Set([...landlordIdsFromUnits, ...landlordIdsFromProperties]))

  let landlords: TenantRelationLandlord[] = []
  if (landlordIds.length > 0) {
    let landlordQuery = supabase
      .from('subjects')
      .select('id, display_name, email, phone, subject_type, is_archived')
      .in('id', landlordIds)

    if (!includeArchived) {
      landlordQuery = landlordQuery.or('is_archived.is.null,is_archived.eq.false')
    }

    const { data: landlordRows, error: landlordError } = await landlordQuery
    if (landlordError) throw new Error(landlordError.message)
    landlords = (landlordRows ?? []) as TenantRelationLandlord[]
  }

  return { units, properties, landlords }
}
