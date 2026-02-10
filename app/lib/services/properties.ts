// FILE: app/lib/services/properties.ts
// PURPOSE: Properties service pro modul 040: list + detail + save.
// CONTRACT:
// - listProperties(params) -> PropertiesListRow[] (s filtrem podle landlord, property_type)
// - getPropertyDetail(id) -> { property: PropertyDetailRow, units: UnitsListRow[] }
// - saveProperty(input) -> vrací uložený property record

import { supabase } from '@/app/lib/supabaseClient'

/* =========================
   LIST
   ========================= */

export type PropertiesListParams = {
  searchText?: string
  landlordId?: string | null // filtrovat podle pronajímatele
  propertyTypeId?: string | null // filtrovat podle typu nemovitosti
  region?: string | null // filtrovat podle kraje
  includeArchived?: boolean
  limit?: number
}

export type PropertiesListRow = {
  id: string
  landlord_id: string | null
  property_type_id: string | null
  display_name: string | null
  internal_code: string | null
  
  // address
  street: string | null
  house_number: string | null
  city: string | null
  zip: string | null
  country: string | null
  region: string | null
  
  // area info
  land_area: number | null
  building_area: number | null
  
  // metadata
  is_archived: boolean | null
  created_at: string | null
  
  // joined data
  landlord_name?: string | null
  property_type_name?: string | null
  property_type_icon?: string | null
  property_type_color?: string | null
  property_type_order_index?: number | null
  units_count?: number
}

export async function listProperties(params: PropertiesListParams = {}): Promise<PropertiesListRow[]> {
  const search = (params.searchText ?? '').trim()
  const includeArchived = !!params.includeArchived
  const limit = params.limit ?? 500
  const landlordId = params.landlordId?.trim() || null
  const propertyTypeId = params.propertyTypeId?.trim() || null
  const region = params.region?.trim() || null

  let q = supabase
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
    .order('display_name', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (landlordId) {
    q = q.eq('landlord_id', landlordId)
  }

  if (propertyTypeId) {
    q = q.eq('property_type_id', propertyTypeId)
  }

  if (region) {
    q = q.eq('region', region)
  }

  if (!includeArchived) {
    q = q.or('is_archived.is.null,is_archived.eq.false')
  }

  if (search) {
    const s = `%${search}%`
    q = q.or(
      [
        `display_name.ilike.${s}`,
        `internal_code.ilike.${s}`,
        `street.ilike.${s}`,
        `city.ilike.${s}`,
        `zip.ilike.${s}`,
      ].join(',')
    )
  }

  const { data, error } = await q
  if (error) throw new Error(error.message)

  // Get property IDs for counting units
  const propertyIds = (data ?? []).map((row: any) => row.id)
  
  // Count units for each property
  const unitCounts: Record<string, number> = {}
  if (propertyIds.length > 0) {
    const { data: countsData } = await supabase
      .from('units')
      .select('property_id')
      .in('property_id', propertyIds)
      .or('is_archived.is.null,is_archived.eq.false')
    
    if (countsData) {
      countsData.forEach((row: any) => {
        unitCounts[row.property_id] = (unitCounts[row.property_id] || 0) + 1
      })
    }
  }

  // Transform joined data
  const rows = (data ?? []).map((row: any) => {
    const landlord = Array.isArray(row.landlord) ? row.landlord[0] : row.landlord
    const propertyType = Array.isArray(row.property_type) ? row.property_type[0] : row.property_type

    return {
      ...row,
      landlord_name: landlord?.display_name ?? null,
      property_type_name: propertyType?.name ?? null,
      property_type_icon: propertyType?.icon ?? null,
      property_type_color: propertyType?.color ?? null,
      property_type_order_index: propertyType?.order_index ?? null,
      units_count: unitCounts[row.id] || 0,
    }
  })

  return rows
}

/* =========================
   DETAIL
   ========================= */

export type PropertyDetailRow = {
  id: string
  landlord_id: string | null
  property_type_id: string | null
  display_name: string | null
  internal_code: string | null
  
  // address
  street: string | null
  house_number: string | null
  city: string | null
  zip: string | null
  country: string | null
  region: string | null
  
  // area info
  land_area: number | null
  built_up_area: number | null
  building_area: number | null
  number_of_floors: number | null
  floors_above_ground: number | null
  floors_below_ground: number | null
  units_count: number | null
  
  // dates
  build_year: number | null
  reconstruction_year: number | null
  
  // cadastre
  cadastral_area: string | null
  parcel_number: string | null
  lv_number: string | null
  
  // note
  note: string | null
  
  // metadata
  origin_module: string | null
  is_archived: boolean | null
  created_at: string | null
  updated_at: string | null
  
  // joined data
  landlord_name?: string | null
  property_type_name?: string | null
  property_type_code?: string | null
}

export async function getPropertyDetail(id: string): Promise<{ property: PropertyDetailRow }> {
  const { data, error } = await supabase
    .from('properties')
    .select(
      `
        *,
        landlord:subjects!properties_landlord_id_fkey(display_name),
        property_type:generic_types!fk_properties_type_generic(name, code)
      `
    )
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('Property not found')

  const landlord = Array.isArray(data.landlord) ? data.landlord[0] : data.landlord
  const propertyType = Array.isArray(data.property_type) ? data.property_type[0] : data.property_type

  return {
    property: {
      ...data,
      landlord_name: landlord?.display_name ?? null,
      property_type_name: propertyType?.name ?? null,
      property_type_code: propertyType?.code ?? null,
    },
  }
}

/* =========================
   SAVE (INSERT / UPDATE)
   ========================= */

export type SavePropertyInput = {
  id?: string | null // pokud je null/undefined = INSERT, jinak UPDATE
  landlord_id: string
  property_type_id: string
  display_name: string
  internal_code?: string | null
  
  // address
  street?: string | null
  house_number?: string | null
  city?: string | null
  zip?: string | null
  country?: string | null
  region?: string | null
  
  // area info
  land_area?: number | null
  built_up_area?: number | null
  building_area?: number | null
  number_of_floors?: number | null
  floors_above_ground?: number | null
  floors_below_ground?: number | null
  units_count?: number | null
  
  // dates
  build_year?: number | null
  reconstruction_year?: number | null
  
  // cadastre
  cadastral_area?: string | null
  parcel_number?: string | null
  lv_number?: string | null
  
  // note
  note?: string | null
  
  // metadata
  is_archived?: boolean
}

export async function saveProperty(input: SavePropertyInput): Promise<PropertyDetailRow> {
  const isUpdate = !!input.id

  const normalizedZip = (input.zip ?? '')
    .toString()
    .replace(/\D+/g, '')
    .trim() || null

  const payload: any = {
    landlord_id: input.landlord_id,
    property_type_id: input.property_type_id,
    display_name: input.display_name,
    internal_code: input.internal_code ?? null,
    street: input.street ?? null,
    house_number: input.house_number ?? null,
    city: input.city ?? null,
    zip: normalizedZip,
    country: input.country ?? null,
    region: input.region ?? null,
    land_area: input.land_area ?? null,
    built_up_area: input.built_up_area ?? null,
    building_area: input.building_area ?? null,
    number_of_floors: input.number_of_floors ?? null,
    floors_above_ground: input.floors_above_ground ?? null,
    floors_below_ground: input.floors_below_ground ?? null,
    units_count: input.units_count ?? null,
    build_year: input.build_year ?? null,
    reconstruction_year: input.reconstruction_year ?? null,
    cadastral_area: input.cadastral_area ?? null,
    parcel_number: input.parcel_number ?? null,
    lv_number: input.lv_number ?? null,
    note: input.note ?? null,
    is_archived: input.is_archived ?? false,
  }

  if (isUpdate) {
    const { data, error } = await supabase
      .from('properties')
      .update(payload)
      .eq('id', input.id!)
      .select(
        `
          *,
          landlord:subjects!properties_landlord_id_fkey(display_name),
          property_type:generic_types!fk_properties_type_generic(name, code)
        `
      )
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Property not found after update')

    const landlord = Array.isArray(data.landlord) ? data.landlord[0] : data.landlord
    const propertyType = Array.isArray(data.property_type) ? data.property_type[0] : data.property_type

    return {
      ...data,
      landlord_name: landlord?.display_name ?? null,
      property_type_name: propertyType?.name ?? null,
      property_type_code: propertyType?.code ?? null,
    }
  } else {
    const { data, error } = await supabase
      .from('properties')
      .insert(payload)
      .select(
        `
          *,
          landlord:subjects!properties_landlord_id_fkey(display_name),
          property_type:generic_types!fk_properties_type_generic(name, code)
        `
      )
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Property not created')

    const landlord = Array.isArray(data.landlord) ? data.landlord[0] : data.landlord
    const propertyType = Array.isArray(data.property_type) ? data.property_type[0] : data.property_type

    return {
      ...data,
      landlord_name: landlord?.display_name ?? null,
      property_type_name: propertyType?.name ?? null,
      property_type_code: propertyType?.code ?? null,
    }
  }
}

/* =========================
   COUNTS BY TYPE
   ========================= */

export type PropertyCountByType = {
  property_type_id: string | null
  count: number
}

/**
 * Vrátí počty nemovitostí seskupené podle property_type_id.
 * @param includeArchived - pokud true, počítá i archivované
 */
export async function getPropertyCountsByType(includeArchived = false): Promise<PropertyCountByType[]> {
  let q = supabase
    .from('properties')
    .select('property_type_id', { count: 'exact', head: false })

  if (!includeArchived) {
    q = q.or('is_archived.is.null,is_archived.eq.false')
  }

  const { data, error } = await q

  if (error) throw new Error(error.message)
  if (!data) return []

  // Seskupit podle property_type_id
  const countsMap = new Map<string | null, number>()
  for (const row of data) {
    const typeId = row.property_type_id
    countsMap.set(typeId, (countsMap.get(typeId) ?? 0) + 1)
  }

  return Array.from(countsMap.entries()).map(([property_type_id, count]) => ({
    property_type_id,
    count,
  }))
}

/* =========================
   DELETE (SOFT)
   ========================= */

export async function archiveProperty(id: string): Promise<void> {
  const { error } = await supabase.from('properties').update({ is_archived: true }).eq('id', id)

  if (error) throw new Error(error.message)
}

export async function unarchiveProperty(id: string): Promise<void> {
  const { error } = await supabase.from('properties').update({ is_archived: false }).eq('id', id)

  if (error) throw new Error(error.message)
}
