// FILE: app/lib/services/units.ts
// PURPOSE: Units service pro modul 040: list + detail + save.
// CONTRACT:
// - listUnits(params) -> UnitsListRow[] (s filtrem podle property, unit_type, status)
// - getUnitDetail(id) -> { unit: UnitDetailRow }
// - saveUnit(input) -> vrací uložený unit record

import { supabase } from '@/app/lib/supabaseClient'

/* =========================
   LIST
   ========================= */

export type UnitsListParams = {
  searchText?: string
  propertyId?: string | null // filtrovat podle nemovitosti
  unitTypeId?: string | null // filtrovat podle typu jednotky
  status?: string | null // filtrovat podle stavu (occupied, available, reserved, renovation)
  includeArchived?: boolean
  limit?: number
}

export type UnitsListRow = {
  id: string
  property_id: string | null
  unit_type_id: string | null
  display_name: string | null
  internal_code: string | null
  
  // address (inherited or override)
  street: string | null
  house_number: string | null
  city: string | null
  zip: string | null
  country: string | null
  region: string | null
  
  // unit info
  floor: number | null
  door_number: string | null
  area: number | null
  rooms: number | null
  status: string | null
  
  // metadata
  is_archived: boolean | null
  created_at: string | null
  
  // joined data
  property_name?: string | null
  unit_type_name?: string | null
  unit_type_icon?: string | null
  unit_type_color?: string | null
  user_count?: number
}

export async function listUnits(params: UnitsListParams = {}): Promise<UnitsListRow[]> {
  const search = (params.searchText ?? '').trim()
  const includeArchived = !!params.includeArchived
  const limit = params.limit ?? 500
  const propertyId = params.propertyId?.trim() || null
  const unitTypeId = params.unitTypeId?.trim() || null
  const status = params.status?.trim() || null

  let q = supabase
    .from('units')
    .select(
      `
        id,
        property_id,
        unit_type_id,
        display_name,
        internal_code,
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
    .order('display_name', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (propertyId) {
    q = q.eq('property_id', propertyId)
  }

  if (unitTypeId) {
    q = q.eq('unit_type_id', unitTypeId)
  }

  if (status) {
    q = q.eq('status', status)
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
        `door_number.ilike.${s}`,
        `street.ilike.${s}`,
        `city.ilike.${s}`,
      ].join(',')
    )
  }

  const { data, error } = await q
  if (error) throw new Error(error.message)

  // Transform joined data
  const rows = (data ?? []).map((row: any) => {
    const property = Array.isArray(row.property) ? row.property[0] : row.property
    const unitType = Array.isArray(row.unit_type) ? row.unit_type[0] : row.unit_type

    return {
      ...row,
      property_name: property?.display_name ?? null,
      unit_type_name: unitType?.name ?? null,
      unit_type_icon: unitType?.icon ?? null,
      unit_type_color: unitType?.color ?? null,
      user_count: 0, // TODO: count from subject_roles when unit_id field exists
    }
  })

  return rows
}

/* =========================
   DETAIL
   ========================= */

export type UnitDetailRow = {
  id: string
  property_id: string | null
  unit_type_id: string | null
  display_name: string | null
  internal_code: string | null
  
  // address (inherited or override)
  street: string | null
  house_number: string | null
  city: string | null
  zip: string | null
  country: string | null
  region: string | null
  
  // unit info
  floor: number | null
  door_number: string | null
  area: number | null
  rooms: number | null
  status: string | null
  
  // note
  note: string | null
  
  // metadata
  origin_module: string | null
  is_archived: boolean | null
  created_at: string | null
  updated_at: string | null
  
  // joined data
  property_name?: string | null
  unit_type_name?: string | null
  unit_type_code?: string | null
}

export async function getUnitDetail(id: string): Promise<{ unit: UnitDetailRow }> {
  const { data, error } = await supabase
    .from('units')
    .select(
      `
        *,
        property:properties!units_property_id_fkey(display_name),
        unit_type:generic_types!fk_units_type_generic(name, code)
      `
    )
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('Unit not found')

  const property = Array.isArray(data.property) ? data.property[0] : data.property
  const unitType = Array.isArray(data.unit_type) ? data.unit_type[0] : data.unit_type

  return {
    unit: {
      ...data,
      property_name: property?.display_name ?? null,
      unit_type_name: unitType?.name ?? null,
      unit_type_code: unitType?.code ?? null,
    },
  }
}

/* =========================
   SAVE (INSERT / UPDATE)
   ========================= */

export type SaveUnitInput = {
  id?: string | null // pokud je null/undefined = INSERT, jinak UPDATE
  property_id: string | null
  unit_type_id: string | null
  display_name: string | null
  internal_code?: string | null
  
  // address (inherited or override)
  street?: string | null
  house_number?: string | null
  city?: string | null
  zip?: string | null
  country?: string | null
  region?: string | null
  
  // unit info
  floor?: number | null
  door_number?: string | null
  area?: number | null
  rooms?: number | null
  status?: string | null
  
  // note
  note?: string | null
  
  // metadata
  origin_module?: string | null
  is_archived?: boolean
}

export async function saveUnit(input: SaveUnitInput): Promise<UnitDetailRow> {
  const isUpdate = !!input.id

  const payload: any = {
    property_id: input.property_id,
    unit_type_id: input.unit_type_id,
    display_name: input.display_name,
    internal_code: input.internal_code ?? null,
    street: input.street ?? null,
    house_number: input.house_number ?? null,
    city: input.city ?? null,
    zip: input.zip ?? null,
    country: input.country ?? null,
    region: input.region ?? null,
    floor: input.floor ?? null,
    door_number: input.door_number ?? null,
    area: input.area ?? null,
    rooms: input.rooms ?? null,
    status: input.status ?? 'available',
    note: input.note ?? null,
    origin_module: input.origin_module ?? '040-nemovitost',
    is_archived: input.is_archived ?? false,
  }

  if (isUpdate) {
    const { data, error } = await supabase
      .from('units')
      .update(payload)
      .eq('id', input.id!)
      .select(
        `
          *,
          property:properties!units_property_id_fkey(display_name),
          unit_type:generic_types!fk_units_type_generic(name, code)
        `
      )
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Unit not found after update')

    const property = Array.isArray(data.property) ? data.property[0] : data.property
    const unitType = Array.isArray(data.unit_type) ? data.unit_type[0] : data.unit_type

    return {
      ...data,
      property_name: property?.display_name ?? null,
      unit_type_name: unitType?.name ?? null,
      unit_type_code: unitType?.code ?? null,
    }
  } else {
    const { data, error } = await supabase
      .from('units')
      .insert(payload)
      .select(
        `
          *,
          property:properties!units_property_id_fkey(display_name),
          unit_type:generic_types!fk_units_type_generic(name, code)
        `
      )
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Unit not created')

    const property = Array.isArray(data.property) ? data.property[0] : data.property
    const unitType = Array.isArray(data.unit_type) ? data.unit_type[0] : data.unit_type

    return {
      ...data,
      property_name: property?.display_name ?? null,
      unit_type_name: unitType?.name ?? null,
      unit_type_code: unitType?.code ?? null,
    }
  }
}

/* =========================
   COUNTS
   ========================= */

export type UnitCountByType = {
  unit_type_id: string | null
  count: number
}

/**
 * Vrátí počty jednotek seskupené podle unit_type_id.
 * @param includeArchived - pokud true, počítá i archivované
 */
export async function getUnitCountsByType(includeArchived = false): Promise<UnitCountByType[]> {
  let q = supabase
    .from('units')
    .select('unit_type_id', { count: 'exact', head: false })

  if (!includeArchived) {
    q = q.or('is_archived.is.null,is_archived.eq.false')
  }

  const { data, error } = await q

  if (error) throw new Error(error.message)
  if (!data) return []

  // Seskupit podle unit_type_id
  const countsMap = new Map<string | null, number>()
  for (const row of data) {
    const typeId = row.unit_type_id
    countsMap.set(typeId, (countsMap.get(typeId) ?? 0) + 1)
  }

  return Array.from(countsMap.entries()).map(([unit_type_id, count]) => ({
    unit_type_id,
    count,
  }))
}

/* =========================
   DELETE (SOFT)
   ========================= */

export async function archiveUnit(id: string): Promise<void> {
  const { error } = await supabase.from('units').update({ is_archived: true }).eq('id', id)

  if (error) throw new Error(error.message)
}

export async function unarchiveUnit(id: string): Promise<void> {
  const { error } = await supabase.from('units').update({ is_archived: false }).eq('id', id)

  if (error) throw new Error(error.message)
}
