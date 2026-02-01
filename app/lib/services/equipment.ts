// FILE: app/lib/services/equipment.ts
// PURPOSE: Equipment service pro modul 040: catalog + unit equipment + property equipment
// CONTRACT:
// - listEquipmentCatalog(params) -> EquipmentCatalogRow[]
// - getEquipmentDetail(id) -> { equipment: EquipmentDetailRow }
// - saveEquipment(input) -> vrací uložený equipment record
// - listUnitEquipment(unitId) -> UnitEquipmentRow[]
// - listPropertyEquipment(propertyId) -> PropertyEquipmentRow[]
// - saveUnitEquipment(input) -> vrací vazbu
// - savePropertyEquipment(input) -> vrací vazbu

import { supabase } from '@/app/lib/supabaseClient'

/* =========================
   EQUIPMENT CATALOG
   ========================= */

export type EquipmentCatalogParams = {
  searchText?: string
  equipmentTypeId?: string | null // filtrovat podle typu vybavení
  includeArchived?: boolean
  limit?: number
}

export type EquipmentCatalogRow = {
  id: string
  equipment_name: string
  equipment_type_id: string | null
  purchase_price: number | null
  purchase_date: string | null
  room_type_id: string | null
  default_lifespan_months: number | null
  default_revision_interval: number | null
  default_state: string | null
  default_description: string | null
  active: boolean | null
  is_archived: boolean | null
  created_at: string | null
  
  // joined data
  equipment_type_name?: string | null
  equipment_type_icon?: string | null
  equipment_type_color?: string | null
  room_type_name?: string | null
  room_type_icon?: string | null
  room_type_color?: string | null
}

export async function listEquipmentCatalog(params: EquipmentCatalogParams = {}): Promise<EquipmentCatalogRow[]> {
  const search = (params.searchText ?? '').trim()
  const includeArchived = !!params.includeArchived
  const limit = params.limit ?? 500
  const equipmentTypeId = params.equipmentTypeId?.trim() || null

  let q = supabase
    .from('equipment_catalog')
    .select(
      `
        id,
        equipment_name,
        equipment_type_id,
        purchase_price,
        purchase_date,
        room_type_id,
        default_lifespan_months,
        default_revision_interval,
        default_state,
        default_description,
        active,
        is_archived,
        created_at,
        equipment_type:equipment_type_id(name, icon, color),
        room_type:room_type_id(name, icon, color)
      `
    )
    .order('equipment_name', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (equipmentTypeId) {
    q = q.eq('equipment_type_id', equipmentTypeId)
  }

  if (!includeArchived) {
    q = q.or('is_archived.is.null,is_archived.eq.false')
  }

  if (search) {
    const s = `%${search}%`
    q = q.ilike('equipment_name', s)
  }

  const { data, error } = await q
  if (error) throw new Error(error.message)

  const rows = (data ?? []).map((row: any) => {
    const equipmentType = Array.isArray(row.equipment_type) ? row.equipment_type[0] : row.equipment_type
    const roomType = Array.isArray(row.room_type) ? row.room_type[0] : row.room_type

    return {
      ...row,
      equipment_type_name: equipmentType?.name ?? null,
      equipment_type_icon: equipmentType?.icon ?? null,
      equipment_type_color: equipmentType?.color ?? null,
      room_type_name: roomType?.name ?? null,
      room_type_icon: roomType?.icon ?? null,
      room_type_color: roomType?.color ?? null,
    }
  })

  return rows
}

export type EquipmentDetailRow = {
  id: string
  equipment_name: string
  equipment_type_id: string | null
  purchase_price: number | null
  purchase_date: string | null
  room_type_id: string | null
  default_lifespan_months: number | null
  default_revision_interval: number | null
  default_state: string | null
  default_description: string | null
  active: boolean | null
  origin_module: string | null
  is_archived: boolean | null
  created_at: string | null
  updated_at: string | null
  
  // joined data
  equipment_type_name?: string | null
  equipment_type_code?: string | null
}

export async function getEquipmentDetail(id: string): Promise<{ equipment: EquipmentDetailRow }> {
  const { data, error } = await supabase
    .from('equipment_catalog')
    .select(
      `
        *,
        equipment_type:generic_types!fk_equipment_type_generic(name, code)
      `
    )
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('Equipment not found')

  const equipmentType = Array.isArray(data.equipment_type) ? data.equipment_type[0] : data.equipment_type

  return {
    equipment: {
      ...data,
      equipment_type_name: equipmentType?.name ?? null,
      equipment_type_code: equipmentType?.code ?? null,
    },
  }
}

export type SaveEquipmentInput = {
  id?: string | null
  equipment_name: string
  equipment_type_id: string
  purchase_price?: number | null
  purchase_date?: string | null
  room_type_id?: string | null
  default_lifespan_months?: number | null
  default_revision_interval?: number | null
  default_state?: string | null
  default_description?: string | null
  active?: boolean
  is_archived?: boolean
}

export async function saveEquipment(input: SaveEquipmentInput): Promise<EquipmentDetailRow> {
  const isUpdate = !!input.id

  const payload: any = {
    equipment_name: input.equipment_name,
    equipment_type_id: input.equipment_type_id,
    purchase_price: input.purchase_price ?? null,
    purchase_date: input.purchase_date ?? null,
    room_type_id: input.room_type_id ?? null,
    default_lifespan_months: input.default_lifespan_months ?? null,
    default_revision_interval: input.default_revision_interval ?? null,
    default_state: input.default_state ?? 'good',
    default_description: input.default_description ?? null,
    active: input.active ?? true,
    is_archived: input.is_archived ?? false,
  }

  if (isUpdate) {
    const { data, error } = await supabase
      .from('equipment_catalog')
      .update(payload)
      .eq('id', input.id!)
      .select(
        `
          *,
          equipment_type:generic_types!fk_equipment_type_generic(name, code)
        `
      )
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Equipment not found after update')

    const equipmentType = Array.isArray(data.equipment_type) ? data.equipment_type[0] : data.equipment_type

    return {
      ...data,
      equipment_type_name: equipmentType?.name ?? null,
      equipment_type_code: equipmentType?.code ?? null,
    }
  } else {
    const { data, error } = await supabase
      .from('equipment_catalog')
      .insert(payload)
      .select(
        `
          *,
          equipment_type:generic_types!fk_equipment_type_generic(name, code)
        `
      )
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Equipment not created')

    const equipmentType = Array.isArray(data.equipment_type) ? data.equipment_type[0] : data.equipment_type

    return {
      ...data,
      equipment_type_name: equipmentType?.name ?? null,
      equipment_type_code: equipmentType?.code ?? null,
    }
  }
}

export async function archiveEquipment(id: string): Promise<void> {
  const { error } = await supabase.from('equipment_catalog').update({ is_archived: true }).eq('id', id)

  if (error) throw new Error(error.message)
}

/* =========================
   UNIT EQUIPMENT
   ========================= */

export type UnitEquipmentRow = {
  id: string
  unit_id: string
  equipment_id: string
  quantity: number
  state: string | null
  installation_date: string | null
  note: string | null
  is_archived: boolean | null
  created_at: string | null
  
  // joined from view (v_unit_equipment_list)
  catalog_equipment_name?: string
  equipment_type_name?: string
  catalog_purchase_price?: number | null
  purchase_price?: number | null
  total_price?: number | null
}

export async function listUnitEquipment(unitId: string): Promise<UnitEquipmentRow[]> {
  const { data, error } = await supabase
    .from('v_unit_equipment_list')
    .select('*')
    .eq('unit_id', unitId)
    .order('catalog_equipment_name', { ascending: true })

  if (error) throw new Error(error.message)

  return data ?? []
}

export type SaveUnitEquipmentInput = {
  id?: string | null
  unit_id: string
  equipment_id: string
  quantity?: number
  state?: string | null
  installation_date?: string | null
  note?: string | null
  is_archived?: boolean
}

export async function saveUnitEquipment(input: SaveUnitEquipmentInput): Promise<void> {
  const isUpdate = !!input.id

  const payload: any = {
    unit_id: input.unit_id,
    equipment_id: input.equipment_id,
    quantity: input.quantity ?? 1,
    state: input.state ?? 'good',
    installation_date: input.installation_date ?? null,
    note: input.note ?? null,
    is_archived: input.is_archived ?? false,
  }

  if (isUpdate) {
    const { error } = await supabase.from('unit_equipment').update(payload).eq('id', input.id!)

    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase.from('unit_equipment').insert(payload)

    if (error) throw new Error(error.message)
  }
}

export async function deleteUnitEquipment(id: string): Promise<void> {
  const { error } = await supabase.from('unit_equipment').update({ is_archived: true }).eq('id', id)

  if (error) throw new Error(error.message)
}

/* =========================
   PROPERTY EQUIPMENT
   ========================= */

export type PropertyEquipmentRow = {
  id: string
  property_id: string
  equipment_id: string
  quantity: number
  state: string | null
  installation_date: string | null
  note: string | null
  is_archived: boolean | null
  created_at: string | null
  
  // joined from view (v_property_equipment_list)
  catalog_equipment_name?: string
  equipment_type_name?: string
  catalog_purchase_price?: number | null
  purchase_price?: number | null
  total_price?: number | null
}

export async function listPropertyEquipment(propertyId: string): Promise<PropertyEquipmentRow[]> {
  const { data, error } = await supabase
    .from('v_property_equipment_list')
    .select('*')
    .eq('property_id', propertyId)
    .order('catalog_equipment_name', { ascending: true })

  if (error) throw new Error(error.message)

  return data ?? []
}

export type SavePropertyEquipmentInput = {
  id?: string | null
  property_id: string
  equipment_id: string
  quantity?: number
  state?: string | null
  installation_date?: string | null
  note?: string | null
  is_archived?: boolean
}

export async function savePropertyEquipment(input: SavePropertyEquipmentInput): Promise<void> {
  const isUpdate = !!input.id

  const payload: any = {
    property_id: input.property_id,
    equipment_id: input.equipment_id,
    quantity: input.quantity ?? 1,
    state: input.state ?? 'good',
    installation_date: input.installation_date ?? null,
    note: input.note ?? null,
    is_archived: input.is_archived ?? false,
  }

  if (isUpdate) {
    const { error } = await supabase.from('property_equipment').update(payload).eq('id', input.id!)

    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase.from('property_equipment').insert(payload)

    if (error) throw new Error(error.message)
  }
}

export async function deletePropertyEquipment(id: string): Promise<void> {
  const { error } = await supabase.from('property_equipment').update({ is_archived: true }).eq('id', id)

  if (error) throw new Error(error.message)
}
