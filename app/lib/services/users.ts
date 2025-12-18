// FILE: app/lib/services/users.ts
// PURPOSE: Users list service (v_users_list / subjects) pro modul 010.
// NOTE: Upravit názvy view/tabulky podle tvého Supabase schématu.

import { createClient } from '@/app/lib/supabase/client'

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

  // volitelné (pokud je máš ve view v_users_list)
  first_login_at?: string | null
  last_invite_sent_at?: string | null
  last_invite_expires_at?: string | null
}

export async function listUsers(params: UsersListParams = {}): Promise<UsersListRow[]> {
  const supabase = createClient()

  const search = (params.searchText ?? '').trim()
  const includeArchived = !!params.includeArchived
  const limit = Math.max(1, Math.min(params.limit ?? 200, 2000))

  // ✅ Doporučení: napoj na view `v_users_list` (MVP)
  // Pokud view nemáš, změň na `subjects` + join na role.
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
    // jednoduché OR hledání – uprav podle toho, co tvé view podporuje
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

  return (data ?? []) as UsersListRow[]
}
