// FILE: app/lib/services/permissions.ts
// PURPOSE: Runtime služby pro práci s oprávněními uživatelů (Subject permissions)
// - Číselník oprávnění (permission_types) = zdroj pravdy (modul 900)
// - Přiřazení oprávnění uživateli (subject_permissions) = vazba (modul 010)
//
// TABULKY:
// - public.permission_types(code, name, description, color, icon, order_index, active, ...)
// - public.subject_permissions(subject_id, permission_code, ...metadata)
//
// POZN:
// - Ukládání řešíme "replace" stylem: smaž existující + vlož nové (jednoduché, spolehlivé)
// - Záměrně bez velkých změn a bez magie.

import { supabase } from '@/app/lib/supabaseClient'

const PERMISSION_TYPES_SELECT = 'code, name, description, color, icon, order_index, active'

export type PermissionTypeRow = {
  code: string
  name: string
  description: string | null
  color: string | null
  icon: string | null
  order_index: number | null
  active: boolean | null
}

export type SubjectPermissionRow = {
  subject_id: string
  permission_code: string
}

/**
 * Načte číselník oprávnění (z modulu 900).
 * - default: vrací jen active (pokud includeInactive=false)
 */
export async function listPermissionTypes(opts?: { includeInactive?: boolean }): Promise<PermissionTypeRow[]> {
  const includeInactive = !!opts?.includeInactive

  let q = supabase
    .from('permission_types')
    .select(PERMISSION_TYPES_SELECT)
    .order('order_index', { ascending: true, nullsFirst: true })
    .order('code', { ascending: true })

  if (!includeInactive) {
    q = q.or('active.is.null,active.eq.true')
  }

  const { data, error } = await q
  if (error) throw new Error(error.message)

  return (data ?? []) as PermissionTypeRow[]
}

/**
 * Načte permission kódy přiřazené uživateli.
 */
export async function listSubjectPermissionCodes(subjectId: string): Promise<string[]> {
  const sid = (subjectId ?? '').trim()
  if (!sid) return []

  const { data, error } = await supabase
    .from('subject_permissions')
    .select('permission_code')
    .eq('subject_id', sid)

  if (error) throw new Error(error.message)

  return (data ?? [])
    .map((r: any) => String(r?.permission_code ?? '').trim())
    .filter((x: string) => !!x)
}

/**
 * Nahradí všechna oprávnění uživatele zadaným seznamem.
 * (delete + insert)
 */
export async function replaceSubjectPermissions(subjectId: string, permissionCodes: string[]): Promise<void> {
  const sid = (subjectId ?? '').trim()
  if (!sid) throw new Error('Chybí subjectId')

  const normalized = (permissionCodes ?? [])
    .map((c) => String(c ?? '').trim())
    .filter((c) => !!c)

  // 1) smazat vše
  const { error: delErr } = await supabase.from('subject_permissions').delete().eq('subject_id', sid)
  if (delErr) throw new Error(delErr.message)

  // 2) vložit nové
  if (normalized.length === 0) return

  const rows = normalized.map((c) => ({ subject_id: sid, permission_code: c }))

  const { error: insErr } = await supabase.from('subject_permissions').insert(rows)
  if (insErr) throw new Error(insErr.message)
}

/**
 * Helper: toggle jednoho permission kódu (pohodlné pro checkbox UI).
 * Vrací nový seznam kódů.
 */
export function togglePermissionCode(current: string[], code: string, enabled?: boolean): string[] {
  const c = String(code ?? '').trim()
  if (!c) return current ?? []

  const set = new Set((current ?? []).map((x) => String(x ?? '').trim()).filter(Boolean))
  const has = set.has(c)

  const wantEnabled = typeof enabled === 'boolean' ? enabled : !has
  if (wantEnabled) set.add(c)
  else set.delete(c)

  return Array.from(set)
}

/**
 * Helper: porovná dvě sady permission codes (po normalizaci).
 */
export function equalPermissionSets(a: string[] | null | undefined, b: string[] | null | undefined): boolean {
  const na = (a ?? []).map((x) => String(x ?? '').trim()).filter(Boolean).sort()
  const nb = (b ?? []).map((x) => String(x ?? '').trim()).filter(Boolean).sort()
  if (na.length !== nb.length) return false
  for (let i = 0; i < na.length; i++) {
    if (na[i] !== nb[i]) return false
  }
  return true
}
