/*
 * FILE: app/modules/900-nastaveni/services/roleTypes.ts
 * PURPOSE: CRUD funkce pro číselník public.role_types (napojení na Supabase)
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
export type RoleTypeRow = {
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
export type RoleTypePayload = {
  name: string
  description?: string | null
  color?: string | null
  icon?: string | null
  order_index?: number | null
}

/**
 * Načte všechny typy rolí.
 */
export async function fetchRoleTypes(): Promise<RoleTypeRow[]> {
  const { data, error } = await supabase
    .from('role_types')
    .select('code, name, description, color, icon, order_index')
    .order('order_index', { ascending: true, nullsFirst: true })
    .order('code', { ascending: true })

  if (error) {
    console.error('fetchRoleTypes error', error)
    throw error
  }

  return (data ?? []) as RoleTypeRow[]
}

/**
 * Vytvoří nový typ role.
 */
export async function createRoleType(
  code: string,
  payload: RoleTypePayload,
): Promise<RoleTypeRow> {
  const trimmedCode = code.trim()

  if (!trimmedCode) {
    throw new Error('Kód typu role nesmí být prázdný')
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
    .from('role_types')
    .insert(insertPayload)
    .select('code, name, description, color, icon, order_index')
    .single()

  if (error) {
    console.error('createRoleType error', error)
    throw error
  }

  return data as RoleTypeRow
}

/**
 * Aktualizuje existující typ role podle `codeKey`.
 */
export async function updateRoleType(
  codeKey: string,
  payload: RoleTypePayload,
): Promise<RoleTypeRow> {
  const trimmedKey = codeKey.trim()

  if (!trimmedKey) {
    throw new Error('Chybí "code" pro update typu role')
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
    .from('role_types')
    .update(updatePayload)
    .eq('code', trimmedKey)
    .select('code, name, description, color, icon, order_index')
    .single()

  if (error) {
    console.error('updateRoleType error', error)
    throw error
  }

  return data as RoleTypeRow
}

/**
 * Smaže typ role podle "code".
 */
export async function deleteRoleType(codeKey: string): Promise<void> {
  const trimmedKey = codeKey.trim()

  if (!trimmedKey) {
    throw new Error('Chybí "code" pro smazání typu role')
  }

  const { error } = await supabase
    .from('role_types')
    .delete()
    .eq('code', trimmedKey)

  if (error) {
    console.error('deleteRoleType error', error)
    throw error
  }
}
