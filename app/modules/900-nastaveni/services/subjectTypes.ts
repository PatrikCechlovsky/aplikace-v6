/*
 * FILE: app/modules/900-nastaveni/services/subjectTypes.ts
 * PURPOSE: CRUD funkce pro číselník subject_types
 */

import { supabase } from '@/app/lib/supabaseClient'

export type SubjectType = {
  id: string
  code: string
  label: string
  description: string | null
  is_active: boolean
  created_at: string | null
}

/**
 * Načte všechny typy subjektů seřazené podle code/label.
 */
export async function fetchSubjectTypes(): Promise<SubjectType[]> {
  const { data, error } = await supabase
    .from('subject_types')
    .select('*')
    .order('code', { ascending: true })

  if (error) {
    console.error('fetchSubjectTypes error', error)
    throw error
  }

  return (data ?? []) as SubjectType[]
}

/**
 * Vytvoří nový typ subjektu.
 * RLS: INSERT povolený jen pro adminy (viz app_admins).
 */
export async function createSubjectType(input: {
  code: string
  label: string
  description?: string
  is_active?: boolean
}): Promise<SubjectType> {
  const payload = {
    code: input.code.trim(),
    label: input.label.trim(),
    description: input.description?.trim() ?? null,
    is_active: input.is_active ?? true,
  }

  const { data, error } = await supabase
    .from('subject_types')
    .insert(payload)
    .select('*')
    .single()

  if (error) {
    console.error('createSubjectType error', error)
    throw error
  }

  return data as SubjectType
}

/**
 * Upraví existující typ subjektu.
 */
export async function updateSubjectType(
  id: string,
  input: {
    code: string
    label: string
    description?: string
    is_active?: boolean
  }
): Promise<SubjectType> {
  const payload = {
    code: input.code.trim(),
    label: input.label.trim(),
    description: input.description?.trim() ?? null,
    is_active: input.is_active ?? true,
  }

  const { data, error } = await supabase
    .from('subject_types')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    console.error('updateSubjectType error', error)
    throw error
  }

  return data as SubjectType
}

/**
 * Smaže typ subjektu (volitelné).
 */
export async function deleteSubjectType(id: string): Promise<void> {
  const { error } = await supabase
    .from('subject_types')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('deleteSubjectType error', error)
    throw error
  }
}
