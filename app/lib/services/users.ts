// FILE: app/lib/services/users.ts
// PURPOSE: Načítání uživatelů pro modul 010 (list view).
// NOTE: Používá existující supabase klient z '@/app/lib/supabaseClient'.

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

  // ✅ TS-safe: supabase generika v projektu vrací union typy → přetypujeme přes unknown
  const rows = (Array.isArray(data) ? data : []) as unknown as UsersListRow[]
  return rows
}
