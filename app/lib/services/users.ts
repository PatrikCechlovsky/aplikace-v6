// FILE: app/lib/services/users.ts
// PURPOSE: Users service pro modul 010: list + detail + save (MVP).
// NOTE: LIST jde přes view 'v_users_list'. DETAIL/SAVE jde přes 'subjects'.

import { supabase } from '@/app/lib/supabaseClient'

export type UsersListParams = {
  searchText?: string
  includeArchived?: boolean
  limit?: number
}

export type UsersListRow = {
  id: string
  display_name: string | null
  email: string | null
  phone: string | null
  role_code: string | null
  created_at: string | null
  is_archived: boolean | null

  first_login_at?: string | null
  last_invite_sent_at?: string | null
  last_invite_expires_at?: string | null
}

// ✅ přesně to, co chce UserDetailFrame: d.subject
export type UserDetailSubject = {
  id: string
  display_name: string | null
  email: string | null
  phone: string | null
  is_archived: boolean | null
  created_at: string | null
  updated_at?: string | null
  first_login_at?: string | null
  last_login_at?: string | null
  note?: string | null
  role_code?: string | null
}

export type UserDetailRow = {
  subject: UserDetailSubject
  // do budoucna: roles, permissions, audit…
  roles?: any[] | null
}

export type SaveUserInput = {
  id?: string | null
  display_name?: string | null
  email?: string | null
  phone?: string | null
  is_archived?: boolean | null
  role_code?: string | null
  note?: string | null
}

/** LIST */
export async function listUsers(params: UsersListParams = {}): Promise<UsersListRow[]> {
  const search = (params.searchText ?? '').trim()
  const includeArchived = !!params.includeArchived
  const limit = Math.max(1, Math.min(params.limit ?? 200, 2000))

  let q = supabase
    .from('v_users_list')
    .select(
      [
        'id',
        'display_name',
        'email',
        'phone',
        'role_code',
        'created_at',
        'is_archived',
        'first_login_at',
        'last_invite_sent_at',
        'last_invite_expires_at',
      ].join(',')
    )
    .order('display_name', { ascending: true })
    .limit(limit)

  if (!includeArchived) q = q.eq('is_archived', false)

  if (search) {
    q = q.or(
      [
        `display_name.ilike.%${search}%`,
        `email.ilike.%${search}%`,
        `phone.ilike.%${search}%`,
      ].join(',')
    )
  }

  const { data, error } = await q
  if (error) throw new Error(error.message)

  return (Array.isArray(data) ? data : []) as unknown as UsersListRow[]
}

/** DETAIL – vrací { subject } */
export async function getUserDetail(id: string): Promise<UserDetailRow | null> {
  const userId = (id ?? '').trim()
  if (!userId) return null

  const { data, error } = await supabase
    .from('subjects')
    .select(
      [
        'id',
        'display_name',
        'email',
        'phone',
        'is_archived',
        'created_at',
        'updated_at',
        'first_login_at',
        'last_login_at',
        'note',
        'role_code',
      ].join(',')
    )
    .eq('id', userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  return { subject: data as unknown as UserDetailSubject, roles: null }
}

/** SAVE – vrací stejně { subject } */
export async function saveUser(input: SaveUserInput): Promise<UserDetailRow> {
  const payload: any = {
    display_name: input.display_name ?? null,
    email: input.email ?? null,
    phone: input.phone ?? null,
    is_archived: input.is_archived ?? null,
    note: input.note ?? null,
    role_code: input.role_code ?? null,
  }

  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k])

  // UPDATE
  if (input.id && String(input.id).trim() && String(input.id) !== 'new') {
    const { data, error } = await supabase
      .from('subjects')
      .update(payload)
      .eq('id', String(input.id))
      .select(
        [
          'id',
          'display_name',
          'email',
          'phone',
          'is_archived',
          'created_at',
          'updated_at',
          'first_login_at',
          'last_login_at',
          'note',
          'role_code',
        ].join(',')
      )
      .single()

    if (error) throw new Error(error.message)
    return { subject: data as unknown as UserDetailSubject, roles: null }
  }

  // INSERT
  const { data, error } = await supabase
    .from('subjects')
    .insert(payload)
    .select(
      [
        'id',
        'display_name',
        'email',
        'phone',
        'is_archived',
        'created_at',
        'updated_at',
        'first_login_at',
        'last_login_at',
        'note',
        'role_code',
      ].join(',')
    )
    .single()

  if (error) throw new Error(error.message)
  return { subject: data as unknown as UserDetailSubject, roles: null }
}
