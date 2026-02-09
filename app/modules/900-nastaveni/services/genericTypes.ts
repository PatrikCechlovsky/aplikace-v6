// FILE: app/modules/900-nastaveni/services/genericTypes.ts
// PURPOSE: Univerzální CRUD funkce pro číselník public.generic_types
// NOTES: Sjednocení všech *_types tabulek (subject, property, unit, equipment)

import { supabase } from '@/app/lib/supabaseClient'

const SELECT_FIELDS = 'id, category, code, name, description, color, icon, order_index, active, created_at, updated_at'

/**
 * Podporované kategorie typů
 */
export type GenericTypeCategory = 
  | 'subject_types' 
  | 'property_types' 
  | 'unit_types' 
  | 'equipment_types' 
  | 'unit_dispositions'
  | 'room_types'
  | 'equipment_states'
  | 'service_types'
  | 'service_billing_types'
  | 'vat_rates'
  | 'service_units'
  | 'service_periodicities'
  | 'contract_types'
  | 'contract_statuses'
  | 'rent_periods'
  | 'payment_days'
  | 'deposit_states'
  | 'rent_payment_states'
  | 'contract_payment_states'
  | 'handover_protocol_types'
  | 'handover_protocol_statuses'

/**
 * Datový typ přesně podle tabulky generic_types
 */
export type GenericTypeRow = {
  id: string // UUID
  category: GenericTypeCategory
  code: string
  name: string
  description: string | null
  color: string | null
  icon: string | null
  order_index: number | null
  active: boolean
  created_at: string
  updated_at: string
}

/**
 * Payload pro INSERT/UPDATE
 */
export type GenericTypePayload = {
  name: string
  description?: string | null
  color?: string | null
  icon?: string | null
  order_index?: number | null
  active?: boolean
}

/**
 * Pomocné funkce pro normalizaci
 */
function normalizeOrderIndex(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

function normalizeText(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s ? s : null
}

/**
 * Načte všechny typy dané kategorie
 */
export async function listByCategory(category: GenericTypeCategory): Promise<GenericTypeRow[]> {
  const { data, error } = await supabase
    .from('generic_types')
    .select(SELECT_FIELDS)
    .eq('category', category)
    .order('order_index', { ascending: true, nullsFirst: true })
    .order('code', { ascending: true })

  if (error) {
    console.error(`listByCategory(${category}) error`, error)
    throw error
  }

  return (data ?? []) as GenericTypeRow[]
}

/**
 * Načte všechny aktivní typy dané kategorie
 */
export async function listActiveByCategory(category: GenericTypeCategory): Promise<GenericTypeRow[]> {
  const { data, error } = await supabase
    .from('generic_types')
    .select(SELECT_FIELDS)
    .eq('category', category)
    .eq('active', true)
    .order('order_index', { ascending: true, nullsFirst: true })
    .order('code', { ascending: true })

  if (error) {
    console.error(`listActiveByCategory(${category}) error`, error)
    throw error
  }

  return (data ?? []) as GenericTypeRow[]
}

/**
 * Načte konkrétní typ podle kategorie a kódu
 */
export async function get(category: GenericTypeCategory, code: string): Promise<GenericTypeRow | null> {
  const { data, error } = await supabase
    .from('generic_types')
    .select(SELECT_FIELDS)
    .eq('category', category)
    .eq('code', code)
    .maybeSingle()

  if (error) {
    console.error(`get(${category}, ${code}) error`, error)
    throw error
  }

  return data as GenericTypeRow | null
}

/**
 * Vytvoří nový typ
 */
export async function create(
  category: GenericTypeCategory,
  code: string,
  payload: GenericTypePayload
): Promise<GenericTypeRow> {
  const trimmedCode = code.trim()

  if (!trimmedCode) {
    throw new Error('Kód typu nesmí být prázdný')
  }

  if (!payload.name?.trim()) {
    throw new Error('Název typu nesmí být prázdný')
  }

  const row = {
    category,
    code: trimmedCode,
    name: payload.name.trim(),
    description: normalizeText(payload.description),
    color: normalizeText(payload.color),
    icon: normalizeText(payload.icon),
    order_index: normalizeOrderIndex(payload.order_index),
    active: payload.active ?? true,
  }

  const { data, error } = await supabase
    .from('generic_types')
    .insert(row)
    .select(SELECT_FIELDS)
    .single()

  if (error) {
    console.error('create generic_type error', error)
    throw error
  }

  return data as GenericTypeRow
}

/**
 * Aktualizuje existující typ
 */
export async function update(
  category: GenericTypeCategory,
  code: string,
  payload: GenericTypePayload
): Promise<GenericTypeRow> {
  if (!payload.name?.trim()) {
    throw new Error('Název typu nesmí být prázdný')
  }

  const row = {
    name: payload.name.trim(),
    description: normalizeText(payload.description),
    color: normalizeText(payload.color),
    icon: normalizeText(payload.icon),
    order_index: normalizeOrderIndex(payload.order_index),
    active: payload.active ?? true,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('generic_types')
    .update(row)
    .eq('category', category)
    .eq('code', code)
    .select(SELECT_FIELDS)
    .single()

  if (error) {
    console.error(`update generic_type(${category}, ${code}) error`, error)
    throw error
  }

  return data as GenericTypeRow
}

/**
 * Smaže typ (soft delete - nastaví active = false)
 */
export async function softDelete(category: GenericTypeCategory, code: string): Promise<void> {
  const { error } = await supabase
    .from('generic_types')
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq('category', category)
    .eq('code', code)

  if (error) {
    console.error(`softDelete generic_type(${category}, ${code}) error`, error)
    throw error
  }
}

/**
 * Hard delete - úplné smazání (použít opatrně!)
 */
export async function hardDelete(category: GenericTypeCategory, code: string): Promise<void> {
  const { error } = await supabase
    .from('generic_types')
    .delete()
    .eq('category', category)
    .eq('code', code)

  if (error) {
    console.error(`hardDelete generic_type(${category}, ${code}) error`, error)
    throw error
  }
}

/**
 * Reaktivuje smazaný typ
 */
export async function activate(category: GenericTypeCategory, code: string): Promise<void> {
  const { error } = await supabase
    .from('generic_types')
    .update({ active: true, updated_at: new Date().toISOString() })
    .eq('category', category)
    .eq('code', code)

  if (error) {
    console.error(`activate generic_type(${category}, ${code}) error`, error)
    throw error
  }
}

/**
 * Načte všechny kategorie s počty záznamů
 */
export async function getCategorySummary(): Promise<Array<{ category: GenericTypeCategory; count: number }>> {
  const { data, error } = await supabase
    .from('generic_types')
    .select('category')
    .eq('active', true)

  if (error) {
    console.error('getCategorySummary error', error)
    throw error
  }

  // Group by category
  const counts = (data ?? []).reduce((acc: Record<string, number>, row: { category: string }) => {
    acc[row.category] = (acc[row.category] || 0) + 1
    return acc
  }, {})

  return Object.entries(counts).map(([category, count]) => ({
    category: category as GenericTypeCategory,
    count: count as number,
  }))
}
