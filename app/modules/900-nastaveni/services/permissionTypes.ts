/*
 * FILE: app/modules/900-nastaveni/services/permissionTypes.ts
 * PURPOSE: CRUD funkce pro číselník public.permission_types (napojení na Supabase)
 *
 * Struktura tabulky po sjednocení:
 *  - code        (text, PK / UNIQUE)
 *  - name        (text)
 *  - description (text, nullable)
 *  - color       (text, nullable)
 *  - icon        (text, nullable)
 *  - order_index (integer, nullable)
 *  - active      (boolean, default true)
 */

import { supabase } from '@/app/lib/supabaseClient'

const SELECT_FIELDS = 'code, name, description, color, icon, order_index, active'

function normalizeOrderIndex(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

function normalizeText(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s ? s : null
}

export type PermissionTypeRow = {
  code: string
  name: string
  description: string | null
  color: string | null
  icon: string | null
  order_index: number | null
  active: boolean | null
}

export type PermissionTypePayload = {
  name: string
  description?: string | null
  color?: string | null
  icon?: string | null
  order_index?: number | null
  active?: boolean | null
}

/**
 * Načte všechny typy oprávnění.
 */
export async function fetchPermissionTypes(): Promise<PermissionTypeRow[]> {
  const { data, error } = await supabase
    .from('permission_types')
    .select(SELECT_FIELDS)
    .order('order_index', { ascending: true, nullsFirst: true })
    .order('code', { ascending: true })

  if (error) {
    console.error('fetchPermissionTypes error', error)
    throw error
  }

  return (data ?? []) as PermissionTypeRow[]
}

/**
 * Vytvoří nový typ oprávnění.
 */
export async function createPermissionType(
  code: string,
  payload: PermissionTypePayload,
): Promise<PermissionTypeRow> {
  const trimmedCode = code.trim()

  if (!trimmedCode) {
    throw new Error('Kód oprávnění nesmí být prázdný')
  }

  const insertPayload = {
    code: trimmedCode,
    name: payload.name.trim(),
    description: normalizeText(payload.description),
    color: normalizeText(payload.color),
    icon: normalizeText(payload.icon),
    order_index: normalizeOrderIndex(payload.order_index),
    active: payload.active ?? true,
  }

  const { data, error } = await supabase
    .from('permission_types')
    .insert(insertPayload)
    .select(SELECT_FIELDS)
    .maybeSingle()

  if (error) {
    console.error('createPermissionType error', error)
    throw error
  }

  // Když RLS (nebo edge-case) nedovolí vrátit řádek, zkusíme ho dočíst zvlášť.
  if (!data) {
    const { data: fetched, error: fetchErr } = await supabase
      .from('permission_types')
      .select(SELECT_FIELDS)
      .eq('code', trimmedCode)
      .maybeSingle()

    if (fetchErr) {
      console.warn('createPermissionType: insert ok, but cannot fetch row (RLS?)', fetchErr)
    }

    return (fetched ?? insertPayload) as PermissionTypeRow
  }

  return data as PermissionTypeRow
}

/**
 * Aktualizuje existující oprávnění podle codeKey.
 */
export async function updatePermissionType(
  codeKey: string,
  payload: PermissionTypePayload,
): Promise<PermissionTypeRow> {
  const trimmedKey = codeKey.trim()

  if (!trimmedKey) {
    throw new Error('Chybí "code" pro update oprávnění')
  }

  const updatePayload = {
    name: payload.name.trim(),
    description: normalizeText(payload.description),
    color: normalizeText(payload.color),
    icon: normalizeText(payload.icon),
    order_index: normalizeOrderIndex(payload.order_index),
    active: payload.active ?? true,
  }

  const { data, error } = await supabase
    .from('permission_types')
    .update(updatePayload)
    .eq('code', trimmedKey)
    .select(SELECT_FIELDS)
    .maybeSingle()

  if (error) {
    console.error('updatePermissionType error', error)
    throw error
  }

  // 0 rows returned (často RLS / nebo nic netrefeno) – zkusíme dočíst řádek.
  if (!data) {
    const { data: fetched, error: fetchErr } = await supabase
      .from('permission_types')
      .select(SELECT_FIELDS)
      .eq('code', trimmedKey)
      .maybeSingle()

    if (fetchErr) {
      console.warn('updatePermissionType: update ok/unknown, but cannot fetch row (RLS?)', fetchErr)
    }

    return (fetched ?? { code: trimmedKey, ...(updatePayload as any) }) as PermissionTypeRow
  }

  return data as PermissionTypeRow
}

/**
 * Smazání (pokud někdy bude potřeba)
 */
export async function deletePermissionType(codeKey: string): Promise<void> {
  const trimmedKey = codeKey.trim()

  const { error } = await supabase
    .from('permission_types')
    .delete()
    .eq('code', trimmedKey)

  if (error) {
    console.error('deletePermissionType error', error)
    throw error
  }
}
