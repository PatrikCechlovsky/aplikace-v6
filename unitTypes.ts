/*
 * FILE: app/modules/900-nastaveni/services/unitTypes.ts
 * PURPOSE: CRUD funkce pro číselník public.unit_types (napojení na Supabase)
 *
 * V DB:
 *  - code        (text, PK / UNIQUE)
 *  - name        (text)
 *  - description (text, nullable)
 *  - color       (text, nullable)
 *  - icon        (text, nullable)
 *  - order_index (integer, nullable)
 */

import { supabase } from '@/app/lib/supabaseClient'

const SELECT_FIELDS = 'code, name, description, color, icon, order_index'

function normalizeOrderIndex(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

function normalizeText(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s ? s : null
}

/**
 * Datový typ přesně podle tabulky v Supabase.
 */
export type UnitTypeRow = {
  code: string
  name: string
  description: string | null
  color: string | null
  icon: string | null
  order_index: number | null
}

/**
 * Payload pro INSERT/UPDATE – vše kromě PK `code`.
 */
export type UnitTypePayload = {
  name: string
  description?: string | null
  color?: string | null
  icon?: string | null
  order_index?: number | null
}

/**
 * Načte všechny typy jednotek.
 */
export async function fetchUnitTypes(): Promise<UnitTypeRow[]> {
  const { data, error } = await supabase
    .from('unit_types')
    .select(SELECT_FIELDS)
    .order('order_index', { ascending: true, nullsFirst: true })
    .order('code', { ascending: true })

  if (error) {
    console.error('fetchUnitTypes error', error)
    throw error
  }

  return (data ?? []) as UnitTypeRow[]
}

/**
 * Vytvoří nový typ jednotky.
 */
export async function createUnitType(
  code: string,
  payload: UnitTypePayload,
): Promise<UnitTypeRow> {
  const trimmedCode = code.trim()

  if (!trimmedCode) {
    throw new Error('Kód typu jednotky nesmí být prázdný')
  }

  const insertPayload = {
    code: trimmedCode,
    name: payload.name.trim(),
    description: normalizeText(payload.description),
    color: normalizeText(payload.color),
    icon: normalizeText(payload.icon),
    order_index: normalizeOrderIndex(payload.order_index),
  }

  const { data, error } = await supabase
    .from('unit_types')
    .insert(insertPayload)
    .select(SELECT_FIELDS)
    .maybeSingle()

  if (error) {
    console.error('createUnitType error', error)
    throw error
  }

  if (!data) {
    const { data: fetched, error: fetchErr } = await supabase
      .from('unit_types')
      .select(SELECT_FIELDS)
      .eq('code', trimmedCode)
      .maybeSingle()

    if (fetchErr) {
      console.warn('createUnitType: insert ok, but cannot fetch row (RLS?)', fetchErr)
    }

    return (fetched ?? insertPayload) as UnitTypeRow
  }

  return data as UnitTypeRow
}

/**
 * Aktualizuje existující typ jednotky podle `codeKey`.
 */
export async function updateUnitType(
  codeKey: string,
  payload: UnitTypePayload,
): Promise<UnitTypeRow> {
  const trimmedKey = codeKey.trim()

  if (!trimmedKey) {
    throw new Error('Chybí \"code\" pro update typu jednotky')
  }

  const updatePayload = {
    name: payload.name.trim(),
    description: normalizeText(payload.description),
    color: normalizeText(payload.color),
    icon: normalizeText(payload.icon),
    order_index: normalizeOrderIndex(payload.order_index),
  }

  const { data, error } = await supabase
    .from('unit_types')
    .update(updatePayload)
    .eq('code', trimmedKey)
    .select(SELECT_FIELDS)
    .maybeSingle()

  if (error) {
    console.error('updateUnitType error', error)
    throw error
  }

  if (!data) {
    const { data: fetched, error: fetchErr } = await supabase
      .from('unit_types')
      .select(SELECT_FIELDS)
      .eq('code', trimmedKey)
      .maybeSingle()

    if (fetchErr) {
      console.warn('updateUnitType: update ok/unknown, but cannot fetch row (RLS?)', fetchErr)
    }

    return (fetched ?? { code: trimmedKey, ...(updatePayload as any) }) as UnitTypeRow
  }

  return data as UnitTypeRow
}

/**
 * Smaže typ jednotky podle "code".
 * (GenericTypeTile delete zatím nepoužívá, ale je připraveno do budoucna.)
 */
export async function deleteUnitType(codeKey: string): Promise<void> {
  const trimmedKey = codeKey.trim()

  if (!trimmedKey) {
    throw new Error('Chybí \"code\" pro smazání typu jednotky')
  }

  const { error } = await supabase
    .from('unit_types')
    .delete()
    .eq('code', trimmedKey)

  if (error) {
    console.error('deleteUnitType error', error)
    throw error
  }
}
