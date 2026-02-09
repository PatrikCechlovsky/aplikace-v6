// FILE: app/lib/services/unitServices.ts
// PURPOSE: Service layer pro vazby služeb na jednotku (unit_services)
// NOTES: Používá view v_unit_services_list pro přehled

import { supabase } from '@/app/lib/supabaseClient'

export type UnitServiceRow = {
  id: string
  unit_id: string
  service_id: string | null
  name: string | null
  category_id: string | null
  billing_type_id: string | null
  service_unit_id: string | null
  vat_rate_id: string | null
  amount: number | null
  periodicity_id: string | null
  billing_periodicity_id: string | null
  payer_side: 'tenant' | 'landlord' | null
  is_rebillable: boolean | null
  split_to_units: boolean | null
  split_basis: string | null
  note: string | null
  is_archived: boolean | null
  created_at: string | null
  updated_at: string | null

  service_name?: string | null
  catalog_service_name?: string | null
  catalog_base_price?: number | null
  resolved_category_id?: string | null
  resolved_billing_type_id?: string | null
  resolved_unit_id?: string | null
  resolved_vat_rate_id?: string | null
  category_name?: string | null
  category_color?: string | null
  billing_type_name?: string | null
  billing_type_color?: string | null
  unit_name?: string | null
  vat_rate_name?: string | null
  periodicity_name?: string | null
  billing_periodicity_name?: string | null
}

export type SaveUnitServiceInput = {
  id?: string
  unit_id: string
  service_id?: string | null
  name?: string | null
  category_id?: string | null
  billing_type_id?: string | null
  service_unit_id?: string | null
  vat_rate_id?: string | null
  amount?: number | null
  periodicity_id?: string | null
  billing_periodicity_id?: string | null
  payer_side?: 'tenant' | 'landlord' | null
  is_rebillable?: boolean | null
  split_to_units?: boolean | null
  split_basis?: string | null
  note?: string | null
  is_archived?: boolean | null
}

export async function listUnitServices(unitId: string): Promise<UnitServiceRow[]> {
  const { data, error } = await supabase
    .from('v_unit_services_list')
    .select('*')
    .eq('unit_id', unitId)
    .order('service_name', { ascending: true, nullsFirst: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as UnitServiceRow[]
}

export async function saveUnitService(input: SaveUnitServiceInput): Promise<UnitServiceRow> {
  const payload = {
    unit_id: input.unit_id,
    service_id: input.service_id ?? null,
    name: input.name ?? null,
    category_id: input.category_id ?? null,
    billing_type_id: input.billing_type_id ?? null,
    service_unit_id: input.service_unit_id ?? null,
    vat_rate_id: input.vat_rate_id ?? null,
    amount: input.amount ?? null,
    periodicity_id: input.periodicity_id ?? null,
    billing_periodicity_id: input.billing_periodicity_id ?? null,
    payer_side: input.payer_side ?? 'tenant',
    is_rebillable: input.is_rebillable ?? true,
    split_to_units: input.split_to_units ?? false,
    split_basis: input.split_basis ?? null,
    note: input.note ?? null,
    is_archived: input.is_archived ?? false,
  }

  if (input.id) {
    const { data, error } = await supabase
      .from('unit_services')
      .update(payload)
      .eq('id', input.id)
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    return data as UnitServiceRow
  }

  const { data, error } = await supabase
    .from('unit_services')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data as UnitServiceRow
}
