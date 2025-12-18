/*
 * FILE: app/modules/900-nastaveni/services/roleTypes.ts
 * PURPOSE: CRUD funkce pro číselník public.role_types (napojení na Supabase)
 */

import { supabase } from '@/app/lib/supabaseClient'

const SELECT_FIELDS = 'code, name, description, color, icon, order_index'

export type RoleTypeRow = {
  code: string
  name: string
  description: string | null
  color: string | null
  icon: string | null
  order_index: number | null
}

export type RoleTypePayload = {
  name: string
  description?: string | null
  color?: string | null
  icon?: string | null
  order_index?: number | null
}

function normalizeOrderIndex(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

function normalizeText(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s ? s : null
}

/**
 * Načte všechny typy rolí.
 */
export async function fetchRoleTypes(): Promise<RoleTypeRow[]> {
  const { data, error } = await supabase
    .from('role_types')
    .select(SELECT_FIELDS)
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
export async function createRoleType(code: string, payload: RoleTypePayload): Promise<RoleTypeRow> {
  const trimmedCode = code.trim()
  if (!trimmedCode) throw new Error('Kód typu role nesmí být prázdný')

  const insertPayload = {
    code: trimmedCode,
    name: payload.name.trim(),
    description: normalizeText(payload.description),
    color: normalizeText(payload.color),
    icon: normalizeText(payload.icon),
    order_index: normalizeOrderIndex(payload.order_index),
  }

  const { data, error } = await supabase
    .from('role_types')
    .insert(insertPayload)
    .select(SELECT_FIELDS)
    .maybeSingle()

  if (error) {
    console.error('createRoleType error', error)
    throw error
  }

  if (!data) {
    const { data: fetched, error: fetchErr } = await supabase
      .from('role_types')
      .select(SELECT_FIELDS)
      .eq('code', trimmedCode)
      .maybeSingle()

    if (fetchErr) {
      console.warn('createRoleType: insert ok, but cannot fetch row (RLS?)', fetchErr)
    }

    if (fetched) return fetched as RoleTypeRow
    return insertPayload as RoleTypeRow
  }

  return data as RoleTypeRow
}

/**
 * Aktualizuje existující typ role podle `codeKey`.
 */
export async function updateRoleType(codeKey: string, payload: RoleTypePayload): Promise<RoleTypeRow> {
  const trimmedKey = codeKey.trim()
  if (!trimmedKey) throw new Error('Chybí "code" pro update typu role')

  const updatePayload = {
    name: payload.name.trim(),
    description: normalizeText(payload.description),
    color: normalizeText(payload.color),
    icon: normalizeText(payload.icon),
    order_index: normalizeOrderIndex(payload.order_index),
  }

  const { data, error } = await supabase
    .from('role_types')
    .update(updatePayload)
    .eq('code', trimmedKey)
    .select(SELECT_FIELDS)
    .maybeSingle()

  if (error) {
    console.error('updateRoleType error', error)
    throw error
  }

  if (!data) {
    const { data: fetched, error: fetchErr } = await supabase
      .from('role_types')
      .select(SELECT_FIELDS)
      .eq('code', trimmedKey)
      .maybeSingle()

    if (fetchErr) {
      console.warn('updateRoleType: update ok/unknown, but cannot fetch row (RLS?)', fetchErr)
    }

    if (fetched) return fetched as RoleTypeRow
    return { code: trimmedKey, ...(updatePayload as any) } as RoleTypeRow
  }

  return data as RoleTypeRow
}

/**
 * Smaže typ role podle "code".
 */
export async function deleteRoleType(codeKey: string): Promise<void> {
  const trimmedKey = codeKey.trim()
  if (!trimmedKey) throw new Error('Chybí "code" pro smazání typu role')

  const { error } = await supabase.from('role_types').delete().eq('code', trimmedKey)

  if (error) {
    console.error('deleteRoleType error', error)
    throw error
  }
}
