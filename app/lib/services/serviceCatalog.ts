// FILE: app/lib/services/serviceCatalog.ts
// PURPOSE: Service layer pro katalog služeb (service_catalog)
// NOTES: CRUD + list s filtry a joiny na generic_types

import { supabase } from '@/app/lib/supabaseClient'
import type { ServiceCatalogFormValue } from '@/app/modules/070-sluzby/forms/ServiceCatalogDetailForm'

export type ServiceCatalogParams = {
  searchText?: string
  categoryId?: string | null
  billingTypeId?: string | null
  includeArchived?: boolean
  limit?: number
}

export type ServiceCatalogRow = {
  id: string
  code: string
  name: string
  category_id: string | null
  billing_type_id: string | null
  unit_id: string | null
  vat_rate_id: string | null
  base_price: number | null
  description: string | null
  note: string | null
  active: boolean | null
  is_archived: boolean | null
  created_at: string | null

  category_name?: string | null
  category_color?: string | null
  billing_type_name?: string | null
  unit_name?: string | null
  vat_rate_name?: string | null
  billing_type_color?: string | null
}

export async function listServiceCatalog(params: ServiceCatalogParams = {}): Promise<ServiceCatalogRow[]> {
  const search = (params.searchText ?? '').trim()
  const includeArchived = !!params.includeArchived
  const limit = params.limit ?? 500
  const categoryId = params.categoryId?.trim() || null
  const billingTypeId = params.billingTypeId?.trim() || null

  let q = supabase
    .from('service_catalog')
    .select(
      `
        id,
        code,
        name,
        category_id,
        billing_type_id,
        unit_id,
        vat_rate_id,
        base_price,
        description,
        note,
        active,
        is_archived,
        created_at,
        category:category_id(name, color),
        billing_type:billing_type_id(name, color),
        unit:unit_id(name),
        vat_rate:vat_rate_id(name)
      `
    )
    .order('name', { ascending: true })
    .order('code', { ascending: true })
    .limit(limit)

  if (categoryId) {
    q = q.eq('category_id', categoryId)
  }

  if (billingTypeId) {
    q = q.eq('billing_type_id', billingTypeId)
  }

  if (!includeArchived) {
    q = q.or('is_archived.is.null,is_archived.eq.false')
  }

  if (search) {
    const s = `%${search}%`
    q = q.or(`name.ilike.${s},code.ilike.${s}`)
  }

  const { data, error } = await q
  if (error) throw new Error(error.message)

  return (data ?? []).map((row: any) => {
    const category = Array.isArray(row.category) ? row.category[0] : row.category
    const billingType = Array.isArray(row.billing_type) ? row.billing_type[0] : row.billing_type
    const unit = Array.isArray(row.unit) ? row.unit[0] : row.unit
    const vatRate = Array.isArray(row.vat_rate) ? row.vat_rate[0] : row.vat_rate

    return {
      ...row,
      category_name: category?.name ?? null,
      category_color: category?.color ?? null,
      billing_type_name: billingType?.name ?? null,
      billing_type_color: billingType?.color ?? null,
      unit_name: unit?.name ?? null,
      vat_rate_name: vatRate?.name ?? null,
    } as ServiceCatalogRow
  })
}

export async function getServiceCatalogById(id: string): Promise<ServiceCatalogRow | null> {
  const { data, error } = await supabase
    .from('service_catalog')
    .select(
      `
        id,
        code,
        name,
        category_id,
        billing_type_id,
        unit_id,
        vat_rate_id,
        base_price,
        description,
        note,
        active,
        is_archived,
        created_at
      `
    )
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(error.message)

  return (data ?? null) as ServiceCatalogRow | null
}

export async function createServiceCatalog(formData: ServiceCatalogFormValue): Promise<ServiceCatalogRow> {
  const payload = {
    code: formData.code?.trim(),
    name: formData.name?.trim(),
    category_id: formData.category_id || null,
    billing_type_id: formData.billing_type_id || null,
    unit_id: formData.unit_id || null,
    vat_rate_id: formData.vat_rate_id || null,
    base_price: formData.base_price ?? null,
    description: formData.description ?? null,
    note: formData.note ?? null,
    active: formData.active ?? true,
    is_archived: formData.is_archived ?? false,
  }

  const { data, error } = await supabase
    .from('service_catalog')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw new Error(error.message)

  return data as ServiceCatalogRow
}

export async function updateServiceCatalog(id: string, formData: ServiceCatalogFormValue): Promise<ServiceCatalogRow> {
  const payload = {
    code: formData.code?.trim(),
    name: formData.name?.trim(),
    category_id: formData.category_id || null,
    billing_type_id: formData.billing_type_id || null,
    unit_id: formData.unit_id || null,
    vat_rate_id: formData.vat_rate_id || null,
    base_price: formData.base_price ?? null,
    description: formData.description ?? null,
    note: formData.note ?? null,
    active: formData.active ?? true,
    is_archived: formData.is_archived ?? false,
  }

  const { data, error } = await supabase
    .from('service_catalog')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw new Error(error.message)

  return data as ServiceCatalogRow
}

export async function archiveServiceCatalog(id: string): Promise<void> {
  const { error } = await supabase
    .from('service_catalog')
    .update({ is_archived: true })
    .eq('id', id)

  if (error) throw new Error(error.message)
}
