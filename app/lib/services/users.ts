// FILE: app/lib/services/users.ts
// PURPOSE: CRUD pro modul 010 (Users) nad entitou subject (Supabase). UI nesmí volat Supabase přímo.

import { supabase } from '@/app/lib/supabaseClient'

/**
 * POZOR:
 * - podle docs je tabulka `subject` (singulár).
 * - pokud ji máš v DB jako `subjects`, změň SUBJECT_TABLE níže.
 */
const SUBJECT_TABLE = 'subject'

export type SubjectUserRow = {
  id: string
  display_name: string | null
  email: string | null
  phone: string | null
  is_archived: boolean | null
  created_at: string | null
}

export type UsersListParams = {
  searchText?: string
  includeArchived?: boolean
  limit?: number
}

export async function listUsers(params: UsersListParams = {}) {
  const { searchText = '', includeArchived = false, limit = 200 } = params

  let q = supabase
    .from(SUBJECT_TABLE)
    .select('id, display_name, email, phone, is_archived, created_at')
    .order('display_name', { ascending: true })
    .limit(limit)

  if (!includeArchived) {
    q = q.eq('is_archived', false)
  }

  // jednoduchý fulltext-ish filtr (bez trigramů): display_name/email/phone ilike
  const s = searchText.trim()
  if (s) {
    const pattern = `%${s}%`
    q = q.or(`display_name.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern}`)
  }

  const { data, error } = await q
  if (error) throw error

  return (data ?? []) as SubjectUserRow[]
}

export type SaveUserInput = {
  id: string // 'new' pro create
  displayName: string
  email: string
  phone?: string
}

export async function saveUser(input: SaveUserInput) {
  const isCreate = input.id === 'new'
  const id = isCreate ? crypto.randomUUID() : input.id

  const payload = {
    id,
    display_name: input.displayName || null,
    email: input.email || null,
    phone: input.phone?.trim() ? input.phone.trim() : null,
  }

  const { data, error } = await supabase
    .from(SUBJECT_TABLE)
    .upsert(payload, { onConflict: 'id' })
    .select('id, display_name, email, phone, is_archived, created_at')
    .single()

  if (error) throw error
  return data as SubjectUserRow
}
