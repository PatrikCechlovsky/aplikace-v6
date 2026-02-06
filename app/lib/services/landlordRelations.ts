// FILE: app/lib/services/landlordRelations.ts
// PURPOSE: Načítání vazeb pronajímatele (nemovitosti, jednotky, nájemníci)
// NOTES: Používá existující služby a minimalizuje logiku v UI

import { supabase } from '@/app/lib/supabaseClient'
import { listProperties, type PropertiesListRow } from '@/app/lib/services/properties'
import { type UnitsListRow } from '@/app/lib/services/units'

export type LandlordRelationProperty = PropertiesListRow

export type LandlordRelationUnit = UnitsListRow

export type LandlordRelationTenant = {
  id: string
  display_name: string | null
  email: string | null
  phone: string | null
  subject_type: string | null
  is_archived: boolean | null
}

export type LandlordRelationsResult = {
  properties: LandlordRelationProperty[]
  units: LandlordRelationUnit[]
  tenants: LandlordRelationTenant[]
}

export async function getLandlordRelations(landlordId: string, opts?: { includeArchived?: boolean }): Promise<LandlordRelationsResult> {
  const includeArchived = !!opts?.includeArchived

  const properties = await listProperties({ landlordId, includeArchived, limit: 500 })
  const propertyIds = properties.map((p) => p.id)

  let units: UnitsListRow[] = []
  if (propertyIds.length > 0) {
    let q = supabase
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
          status,
          is_archived,
          created_at,
          property:properties!units_property_id_fkey(display_name),
          unit_type:generic_types!fk_units_type_generic(name, icon, color)
        `
      )
      .in('property_id', propertyIds)
      .order('display_name', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(2000)

    if (!includeArchived) {
      q = q.or('is_archived.is.null,is_archived.eq.false')
    }

    const { data, error } = await q
    if (error) throw new Error(error.message)

    units = (data ?? []).map((row: any) => {
      const property = Array.isArray(row.property) ? row.property[0] : row.property
      const unitType = Array.isArray(row.unit_type) ? row.unit_type[0] : row.unit_type

      return {
        id: row.id,
        property_id: row.property_id,
        unit_type_id: row.unit_type_id,
        landlord_id: row.landlord_id,
        display_name: row.display_name,
        internal_code: row.internal_code,
        tenant_id: row.tenant_id,
        street: row.street,
        house_number: row.house_number,
        city: row.city,
        zip: row.zip,
        country: row.country,
        region: row.region,
        floor: row.floor,
        door_number: row.door_number,
        area: row.area,
        rooms: row.rooms,
        status: row.status,
        is_archived: row.is_archived,
        created_at: row.created_at,

        property_name: property?.display_name ?? null,
        unit_type_name: unitType?.name ?? null,
        unit_type_icon: unitType?.icon ?? null,
        unit_type_color: unitType?.color ?? null,
        user_count: row.user_count ?? null,
      } as UnitsListRow
    })
  }

  const tenantIds = Array.from(new Set(units.map((u) => u.tenant_id).filter(Boolean))) as string[]
  let tenants: LandlordRelationTenant[] = []

  if (tenantIds.length > 0) {
    let q = supabase
      .from('subjects')
      .select('id, display_name, email, phone, subject_type, is_archived')
      .in('id', tenantIds)

    if (!includeArchived) {
      q = q.or('is_archived.is.null,is_archived.eq.false')
    }

    const { data, error } = await q
    if (error) throw new Error(error.message)
    tenants = (data ?? []) as LandlordRelationTenant[]
  }

  return { properties, units, tenants }
}
