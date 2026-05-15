// FILE: app/lib/services/units.ts
// PURPOSE: Units service pro modul 040: list + detail + save.
// CONTRACT:
// - listUnits(params) -> UnitsListRow[] (s filtrem podle property, unit_type, status)
// - getUnitDetail(id) -> { unit: UnitDetailRow }
// - saveUnit(input) -> vrací uložený unit record

import { supabase } from '@/app/lib/supabaseClient'

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const d = new Date(`${value}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

function isActiveRange(start: string | null, end: string | null, indefinite: boolean | null, today: Date): boolean {
  const startDate = parseDate(start)
  if (!startDate) return false
  if (startDate.getTime() > today.getTime()) return false
  if (indefinite) return true
  const endDate = parseDate(end)
  if (!endDate) return true
  return endDate.getTime() > today.getTime()
}

type UnitContractState = {
  activeTenantId: string | null
  activeTenantName: string | null
  hasFutureContract: boolean
}

function deriveUnitContractState(rows: Array<any>, today: Date): UnitContractState {
  const active = rows
    .filter((row) => isActiveRange(row.datum_zacatek ?? null, row.datum_konec ?? null, !!row.doba_neurcita, today))
    .sort((a, b) => {
      const sa = parseDate(a.datum_zacatek ?? null)?.getTime() ?? 0
      const sb = parseDate(b.datum_zacatek ?? null)?.getTime() ?? 0
      return sb - sa
    })[0]

  const hasFutureContract = rows.some((row) => {
    const start = parseDate(row.datum_zacatek ?? null)
    return !!start && start.getTime() > today.getTime()
  })

  if (!active) {
    return {
      activeTenantId: null,
      activeTenantName: null,
      hasFutureContract,
    }
  }

  const tenant = Array.isArray(active.tenant) ? active.tenant[0] : active.tenant

  return {
    activeTenantId: active.tenant_id ?? null,
    activeTenantName: tenant?.display_name ?? null,
    hasFutureContract,
  }
}

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
  landlord_id: string | null
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
  disposition: string | null
  status: string | null
  tenant_id: string | null
  orientation_number: string | null
  year_renovated: number | null
  manager_name: string | null
  cadastral_area?: string | null
  parcel_number?: string | null
  lv_number?: string | null
  note?: string | null
  origin_module?: string | null
  
  // metadata
  is_archived: boolean | null
  created_at: string | null
  updated_at?: string | null
  
  // joined data
  property_name?: string | null
  landlord_name?: string | null
  tenant_name?: string | null
  unit_type_name?: string | null
  unit_type_code?: string | null
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
        orientation_number,
        year_renovated,
        manager_name,
        cadastral_area,
        parcel_number,
        lv_number,
        note,
        origin_module,
        is_archived,
        created_at,
        updated_at,
        property:properties!units_property_id_fkey(display_name),
        landlord:subjects!units_landlord_id_fkey(display_name),
        tenant:subjects!units_tenant_id_fkey(display_name),
        unit_type:generic_types!fk_units_type_generic(name, code, icon, color)
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

  const today = new Date()
  const unitIds = Array.from(new Set((data ?? []).map((row: any) => row.id).filter(Boolean))) as string[]
  const contractStateMap = new Map<string, UnitContractState>()

  if (unitIds.length > 0) {
    const { data: contractRows, error: contractsError } = await supabase
      .from('contracts')
      .select(
        `
          id,
          unit_id,
          tenant_id,
          datum_zacatek,
          datum_konec,
          doba_neurcita,
          is_archived,
          tenant:subjects!contracts_tenant_id_fkey(display_name)
        `
      )
      .in('unit_id', unitIds)
      .or('is_archived.is.null,is_archived.eq.false')

    if (contractsError) throw new Error(contractsError.message)

    const grouped = new Map<string, Array<any>>()
    for (const row of contractRows ?? []) {
      const uid = row.unit_id as string | null
      if (!uid) continue
      const list = grouped.get(uid) ?? []
      list.push(row)
      grouped.set(uid, list)
    }

    for (const uid of unitIds) {
      contractStateMap.set(uid, deriveUnitContractState(grouped.get(uid) ?? [], today))
    }
  }

  // Transform joined data
  const rows = (data ?? []).map((row: any) => {
    const property = Array.isArray(row.property) ? row.property[0] : row.property
    const landlord = Array.isArray(row.landlord) ? row.landlord[0] : row.landlord
    const tenant = Array.isArray(row.tenant) ? row.tenant[0] : row.tenant
    const unitType = Array.isArray(row.unit_type) ? row.unit_type[0] : row.unit_type
    const contractState = contractStateMap.get(row.id)

    const derivedStatus = contractState?.activeTenantId
      ? 'occupied'
      : contractState?.hasFutureContract
        ? 'reserved'
        : row.status === 'renovation'
          ? 'renovation'
          : 'available'

    const derivedTenantId = contractState?.activeTenantId ?? null
    const derivedTenantName = contractState?.activeTenantName ?? null

    return {
      ...row,
      status: derivedStatus,
      tenant_id: derivedTenantId,
      property_name: property?.display_name ?? null,
      landlord_name: landlord?.display_name ?? null,
      tenant_name: derivedTenantName ?? tenant?.display_name ?? null,
      unit_type_name: unitType?.name ?? null,
      unit_type_code: unitType?.code ?? null,
      unit_type_icon: unitType?.icon ?? null,
      unit_type_color: unitType?.color ?? null,
      user_count: 0, // TODO: count from subject_roles when unit_id field exists
    }
  })

  if (!status) return rows
  return rows.filter((row) => row.status === status)
}

/* =========================
   DETAIL
   ========================= */

export type UnitDetailRow = {
  id: string
  property_id: string | null
  unit_type_id: string | null
  landlord_id: string | null
  display_name: string | null
  internal_code: string | null
  
  // address (inherited or override)
  street: string | null
  house_number: string | null
  city: string | null
  zip: string | null
  country: string | null
  region: string | null
  
  // cadastral info
  cadastral_area: string | null
  parcel_number: string | null
  lv_number: string | null
  
  // unit info
  floor: number | null
  door_number: string | null
  area: number | null
  rooms: number | null
  disposition: string | null
  status: string | null
  tenant_id: string | null
  orientation_number: string | null
  year_renovated: number | null
  manager_name: string | null
  
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
  tenant_name?: string | null
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

  const today = new Date()
  const { data: contractRows, error: contractError } = await supabase
    .from('contracts')
    .select(
      `
        id,
        unit_id,
        tenant_id,
        datum_zacatek,
        datum_konec,
        doba_neurcita,
        is_archived,
        tenant:subjects!contracts_tenant_id_fkey(display_name)
      `
    )
    .eq('unit_id', id)
    .or('is_archived.is.null,is_archived.eq.false')

  if (contractError) throw new Error(contractError.message)

  const contractState = deriveUnitContractState((contractRows ?? []) as Array<any>, today)
  const derivedStatus = contractState.activeTenantId
    ? 'occupied'
    : contractState.hasFutureContract
      ? 'reserved'
      : data.status === 'renovation'
        ? 'renovation'
        : 'available'

  const property = Array.isArray(data.property) ? data.property[0] : data.property
  const unitType = Array.isArray(data.unit_type) ? data.unit_type[0] : data.unit_type

  return {
    unit: {
      ...data,
      status: derivedStatus,
      tenant_id: contractState.activeTenantId,
      tenant_name: contractState.activeTenantName,
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
  landlord_id?: string | null
  
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
  disposition?: string | null
  status?: string | null
  tenant_id?: string | null
  orientation_number?: string | null
  year_renovated?: number | null
  manager_name?: string | null
  
  // cadastre
  cadastral_area?: string | null
  parcel_number?: string | null
  lv_number?: string | null
  
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
    landlord_id: input.landlord_id ?? null,
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
    disposition: input.disposition ?? null,
    orientation_number: input.orientation_number ?? null,
    year_renovated: input.year_renovated ?? null,
    manager_name: input.manager_name ?? null,
    cadastral_area: input.cadastral_area ?? null,
    parcel_number: input.parcel_number ?? null,
    lv_number: input.lv_number ?? null,
    note: input.note ?? null,
    origin_module: input.origin_module ?? '040-nemovitost',
    is_archived: input.is_archived ?? false,
  }

  if (input.status !== undefined) {
    payload.status = input.status ?? 'available'
  } else if (!isUpdate) {
    payload.status = 'available'
  }

  if (input.tenant_id !== undefined) {
    payload.tenant_id = input.tenant_id ?? null
  } else if (!isUpdate) {
    payload.tenant_id = null
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
