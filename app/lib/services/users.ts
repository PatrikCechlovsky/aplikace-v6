// FILE: app/lib/services/users.ts
// PURPOSE: CRUD pro modul 010 nad tabulkou public.subjects (Supabase)

import { supabase } from '@/app/lib/supabaseClient'

const SUBJECT_TABLE = 'subjects'

export type SubjectRow = {
  id: string
  subject_type: string | null
  auth_user_id: string | null
  display_name: string | null
  email: string | null
  phone: string | null
  is_archived: boolean // ✅ NOVĚ
  archived_at: string | null // ✅ volitelné
  archived_by: string | null // ✅ volitelné
  created_at: string | null
  updated_at: string | null
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
    .select(
      'id, subject_type, auth_user_id, display_name, email, phone, is_archived, archived_at, archived_by, created_at, updated_at'
    )
    .order('display_name', { ascending: true })
    .limit(limit)

  if (!includeArchived) {
    q = q.eq('is_archived', false)
  }

  const s = searchText.trim()
  if (s) {
    const pattern = `%${s}%`
    q = q.or(`display_name.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern}`)
  }

  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as SubjectRow[]
}

export type SaveUserInput = {
  id: string // 'new' pro create
  subjectType?: string | null // např. 'user' dle subject_types.code
  authUserId?: string | null
  displayName: string
  email: string
  phone?: string
}

export async function saveUser(input: SaveUserInput) {
  const isCreate = input.id === 'new'
  const id = isCreate ? crypto.randomUUID() : input.id
  const subjectType = (input.subjectType ?? 'osoba') // <- změna
  
  const payload = {
    id,
    subject_type: input.subjectType ?? null,
    auth_user_id: input.authUserId ?? null,
    display_name: input.displayName || null,
    email: input.email || null,
    phone: input.phone?.trim() ? input.phone.trim() : null,
  }

  const { data, error } = await supabase
    .from(SUBJECT_TABLE)
    .upsert(payload, { onConflict: 'id' })
    .select(
      'id, subject_type, auth_user_id, display_name, email, phone, is_archived, archived_at, archived_by, created_at, updated_at'
    )
    .single()

  if (error) throw error
  return data as SubjectRow
}
