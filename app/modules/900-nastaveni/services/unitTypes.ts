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
    .select('code, name, description, color, icon, order_index')
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
    description: payload.description?.trim() || null,
    color: payload.color?.trim() || null,
    icon: payload.icon?.trim() || null,
    order_index:
      typeof payload.order_index === 'number' && !Number.isNaN(payload.order_index)
        ? payload.order_index
        : null,
  }

  const { data, error } = await supabase
    .from('unit_types')
    .insert(insertPayload)
    .select('code, name, description, color, icon, order_index')
    .single()

  if (error) {
    console.error('createUnitType error', error)
    throw error
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
    description: payload.description?.trim() || null,
    color: payload.color?.trim() || null,
    icon: payload.icon?.trim() || null,
    order_index:
      typeof payload.order_index === 'number' && !Number.isNaN(payload.order_index)
        ? payload.order_index
        : null,
  }

  const { data, error } = await supabase
    .from('unit_types')
    .update(updatePayload)
    .eq('code', trimmedKey)
    .select('code, name, description, color, icon, order_index')
    .single()

  if (error) {
    console.error('updateUnitType error', error)
    throw error
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
