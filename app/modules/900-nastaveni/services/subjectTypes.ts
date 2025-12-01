/*
 * FILE: app/modules/900-nastaveni/services/subjectTypes.ts
 * PURPOSE: CRUD funkce pro číselník public.subject_types (napojení na Supabase)
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
export type SubjectType = {
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
export type SubjectTypePayload = {
  name: string
  description?: string | null
  color?: string | null
  icon?: string | null
  sort_order?: number | null
  active?: boolean | null
}

/**
 * Načte všechny typy subjektů.
 */
export async function fetchSubjectTypes(): Promise<SubjectType[]> {
  const { data, error } = await supabase
    .from('subject_types')
    .select('code, name, description, color, icon, sort_order, active')
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
 *
 * - `code` je PK → posílá se zvlášť (např. z formuláře)
 * - ostatní hodnoty jdou v `payload`
 */
export async function createSubjectType(
  code: string,
  payload: SubjectTypePayload,
): Promise<SubjectType> {
  const trimmedCode = code.trim()

  if (!trimmedCode) {
    throw new Error('Kód typu subjektu nesmí být prázdný')
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
    .from('subject_types')
    .insert(insertPayload)
    .select('code, name, description, color, icon, sort_order, active')
    .single()

  if (error) {
    console.error('createSubjectType error', error)
    throw error
  }

  return data as SubjectType
}

/**
 * Aktualizuje existující typ subjektu podle `codeKey`.
 */
export async function updateSubjectType(
  codeKey: string,
  payload: SubjectTypePayload,
): Promise<SubjectType> {
  const trimmedKey = codeKey.trim()

  if (!trimmedKey) {
    throw new Error('Chybí "code" pro update typu subjektu')
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
    .from('subject_types')
    .update(updatePayload)
    .eq('code', trimmedKey)
    .select('code, name, description, color, icon, sort_order, active')
    .single()

  if (error) {
    console.error('updateSubjectType error', error)
    throw error
  }

  return data as SubjectType
}

/**
 * Smaže typ subjektu podle "code".
 * (Použiješ později – GenericTypeTile zatím delete nepotřebuje.)
 */
export async function deleteSubjectType(codeKey: string): Promise<void> {
  const trimmedKey = codeKey.trim()

  if (!trimmedKey) {
    throw new Error('Chybí "code" pro smazání typu subjektu')
  }

  const { error } = await supabase
    .from('subject_types')
    .delete()
    .eq('code', trimmedKey)

  if (error) {
    console.error('deleteSubjectType error', error)
    throw error
  }
}
