/*
 * FILE: app/modules/900-nastaveni/services/propertyTypes.ts
 * PURPOSE: CRUD funkce pro číselník public.property_types (napojení na Supabase)
 *
 * V DB:
 *  - code        (text, PK / UNIQUE)
 *  - name        (text)
 *  - description (text, nullable)
 *  - color       (text, nullable)
 *  - icon        (text, nullable)
 *  - order_index (integer, nullable / default 0)
 */

import { supabase } from '@/app/lib/supabaseClient'

/**
 * Datový typ přesně podle tabulky v Supabase.
 */
export type PropertyTypeRow = {
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
export type PropertyTypePayload = {
  name: string
  description?: string | null
  color?: string | null
  icon?: string | null
  order_index?: number | null
}

/**
 * Načte všechny typy nemovitostí.
 */
export async function fetchPropertyTypes(): Promise<PropertyTypeRow[]> {
  const { data, error } = await supabase
    .from('property_types')
    .select('code, name, description, color, icon, order_index')
    .order('order_index', { ascending: true, nullsFirst: true })
    .order('code', { ascending: true })

  if (error) {
    console.error('fetchPropertyTypes error', error)
    throw error
  }

  return (data ?? []) as PropertyTypeRow[]
}

/**
 * Vytvoří nový typ nemovitosti.
 *
 * - `code` je PK → posílá se zvlášť (např. z formuláře)
 * - ostatní hodnoty jdou v `payload`
 */
export async function createPropertyType(
  code: string,
  payload: PropertyTypePayload,
): Promise<PropertyTypeRow> {
  const trimmedCode = code.trim()

  if (!trimmedCode) {
    throw new Error('Kód typu nemovitosti nesmí být prázdný')
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
    .from('property_types')
    .insert(insertPayload)
    .select('code, name, description, color, icon, order_index')
    .single()

  if (error) {
    console.error('createPropertyType error', error)
    throw error
  }

  return data as PropertyTypeRow
}

/**
 * Aktualizuje existující typ nemovitosti podle `codeKey`.
 */
export async function updatePropertyType(
  codeKey: string,
  payload: PropertyTypePayload,
): Promise<PropertyTypeRow> {
  const trimmedKey = codeKey.trim()

  if (!trimmedKey) {
    throw new Error('Chybí "code" pro update typu nemovitosti')
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
    .from('property_types')
    .update(updatePayload)
    .eq('code', trimmedKey)
    .select('code, name, description, color, icon, order_index')
    .single()

  if (error) {
    console.error('updatePropertyType error', error)
    throw error
  }

  return data as PropertyTypeRow
}

/**
 * Smaže typ nemovitosti podle "code".
 */
export async function deletePropertyType(codeKey: string): Promise<void> {
  const trimmedKey = codeKey.trim()

  if (!trimmedKey) {
    throw new Error('Chybí "code" pro smazání typu nemovitosti')
  }

  const { error } = await supabase
    .from('property_types')
    .delete()
    .eq('code', trimmedKey)

  if (error) {
    console.error('deletePropertyType error', error)
    throw error
  }
}
