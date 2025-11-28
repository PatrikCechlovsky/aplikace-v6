/*
 * FILE: app/modules/900-nastaveni/services/subjectTypes.ts
 * PURPOSE: CRUD funkce pro číselník subject_types
 *
 * POZNÁMKA:
 *  Tabulka subject_types nemá "id" ani "label".
 *  Primární klíč = "code", textový název = "name".
 */

import { supabase } from '@/app/lib/supabaseClient'

export type SubjectType = {
  code: string
  name: string
  description: string | null
  color: string | null
  icon: string | null
  sort_order: number | null
  is_active: boolean
  created_at: string | null
}

/**
 * Načte všechny typy subjektů.
 */
export async function fetchSubjectTypes(): Promise<SubjectType[]> {
  const { data, error } = await supabase
    .from('subject_types')
    .select(
      'code, name, description, color, icon, sort_order, is_active, created_at',
    )
    .order('sort_order', { ascending: true, nullsFirst: true })
    .order('code', { ascending: true })

  if (error) {
    console.error('fetchSubjectTypes error', error)
    throw error
  }

  return (data ?? []) as SubjectType[]
}

/**
 * Vytvoří nový typ subjektu.
 */
export async function createSubjectType(input: {
  code: string
  name: string
  description?: string
  color?: string
  icon?: string
  order?: number
  is_active?: boolean
}): Promise<SubjectType> {
  const payload = {
    code: input.code.trim(),
    name: input.name.trim(),
    description: input.description?.trim() ?? null,
    color: input.color ?? null,
    icon: input.icon ?? null,
    sort_order:
      typeof input.order === 'number' ? input.order : (null as number | null),
    is_active: input.is_active ?? true,
  }

  const { data, error } = await supabase
    .from('subject_types')
    .insert(payload)
    .select(
      'code, name, description, color, icon, sort_order, is_active, created_at',
    )
    .single()

  if (error) {
    console.error('createSubjectType error', error)
    throw error
  }

  return data as SubjectType
}

/**
 * Upraví existující typ subjektu.
 * Klíč = původní "code".
 */
export async function updateSubjectType(
  codeKey: string,
  input: {
    code: string
    name: string
    description?: string
    color?: string
    icon?: string
    order?: number
    is_active?: boolean
  },
): Promise<SubjectType> {
  const payload = {
    code: input.code.trim(),
    name: input.name.trim(),
    description: input.description?.trim() ?? null,
    color: input.color ?? null,
    icon: input.icon ?? null,
    sort_order:
      typeof input.order === 'number' ? input.order : (null as number | null),
    is_active: input.is_active ?? true,
  }

  const { data, error } = await supabase
    .from('subject_types')
    .update(payload)
    .eq('code', codeKey)
    .select(
      'code, name, description, color, icon, sort_order, is_active, created_at',
    )
    .single()

  if (error) {
    console.error('updateSubjectType error', error)
    throw error
  }

  return data as SubjectType
}

/**
 * Smaže typ subjektu podle "code".
 */
export async function deleteSubjectType(codeKey: string): Promise<void> {
  const { error } = await supabase
    .from('subject_types')
    .delete()
    .eq('code', codeKey)

  if (error) {
    console.error('deleteSubjectType error', error)
    throw error
  }
}
