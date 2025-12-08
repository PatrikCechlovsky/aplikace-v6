/*
 * FILE: app/modules/900-nastaveni/services/propertyTypes.ts
 * PURPOSE: CRUD funkce pro číselník public.property_types (napojení na Supabase)
 *
 * V DB:
 *  - code        (text, PK)
 *  - name        (text)
 *  - description (text, nullable)
 *  - color       (text, nullable)
 *  - icon        (text, nullable)
 *  - sort_order  (integer, nullable)
 *  - active      (boolean)
 */

import { supabase } from '@/app/lib/supabaseClient'

/**
 * Datový typ přesně podle tabulky v Supabase.
 */
export type PropertyType = {
  code: string
  name: string
  description: string | null
  color: string | null
  icon: string | null
  sort_order: number | null
  active: boolean | null
}

/**
 * Payload pro INSERT/UPDATE – vše kromě PK `code`.
 */
export type PropertyTypePayload = {
  name: string
  description?: string | null
  color?: string | null
  icon?: string | null
  sort_order?: number | null
  active?: boolean | null
}

/**
 * Načte všechny typy nemovitostí.
 */
export async function fetchPropertyTypes(): Promise<PropertyType[]> {
  const { data, error } = await supabase
    .from('property_types')
    .select('code, name, description, color, icon, sort_order, active')
    .order('sort_order', { ascending: true, nullsFirst: true })
    .order('code', { ascending: true })

  if (error) {
    console.error('fetchPropertyTypes error', error)
    throw error
  }

  return (data ?? []) as PropertyType[]
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
): Promise<PropertyType> {
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
    sort_order:
      typeof payload.sort_order === 'number' && !Number.isNaN(payload.sort_order)
        ? payload.sort_order
        : null,
    active: payload.active ?? true,
  }

  const { data, error } = await supabase
    .from('property_types')
    .insert(insertPayload)
    .select('code, name, description, color, icon, sort_order, active')
    .single()

  if (error) {
    console.error('createPropertyType error', error)
    throw error
  }

  return data as PropertyType
}

/**
 * Aktualizuje existující typ nemovitosti podle `codeKey`.
 */
export async function updatePropertyType(
  codeKey: string,
  payload: PropertyTypePayload,
): Promise<PropertyType> {
  const trimmedKey = codeKey.trim()

  if (!trimmedKey) {
    throw new Error('Chybí "code" pro update typu nemovitosti')
  }

  const updatePayload = {
    name: payload.name.trim(),
    description: payload.description?.trim() || null,
    color: payload.color?.trim() || null,
    icon: payload.icon?.trim() || null,
    sort_order:
      typeof payload.sort_order === 'number' && !Number.isNaN(payload.sort_order)
        ? payload.sort_order
        : null,
    active: payload.active ?? true,
  }

  const { data, error } = await supabase
    .from('property_types')
    .update(updatePayload)
    .eq('code', trimmedKey)
    .select('code, name, description, color, icon, sort_order, active')
    .single()

  if (error) {
    console.error('updatePropertyType error', error)
    throw error
  }

  return data as PropertyType
}

/**
 * Smaže typ nemovitosti podle "code".
 * (Použiješ později – GenericTypeTile zatím delete nepotřebuje.)
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
