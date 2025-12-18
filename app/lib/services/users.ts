// FILE: app/lib/services/users.ts
// PURPOSE: Users service pro modul 010: list + detail + save.
// CONTRACT: UserDetailFrame očekává návratový tvar: { subject, role_code, permissions, roles? }.
// NOTE: permissions/roles jsou načítané "best-effort" – když tabulka/view neexistuje, vrátíme [] a jedeme dál.

import { supabase } from '@/app/lib/supabaseClient'

/* =========================
   LIST (UsersTile)
   ========================= */

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

  return (Array.isArray(data) ? data : []) as unknown as UsersListRow[]
}

/* =========================
   DETAIL (UserDetailFrame)
   ========================= */

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

  // pokud existuje v subjects
  role_code?: string | null
}

// ✅ KONTRAKT: UI čte d.subject, d.role_code, d.permissions
export type UserDetailRow = {
  subject: UserDetailSubject
  role_code: string | null
  permissions: string[]
  roles?: string[] | null
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

async function tryLoadPermissions(subjectId: string): Promise<string[]> {
  // Best-effort: když tabulka/view neexistuje, vrátíme []
  // Uprav si názvy dle DB: subject_permissions / v_subject_permissions apod.
  try {
    const { data, error } = await supabase
      .from('subject_permissions')
      .select('permission_code')
      .eq('subject_id', subjectId)

    if (error) return []
    const rows = (Array.isArray(data) ? data : []) as any[]
    return rows.map((r) => String(r.permission_code)).filter(Boolean)
  } catch {
    return []
  }
}

async function tryLoadRoles(subjectId: string): Promise<string[] | null> {
  // Best-effort: pokud máš roles ve vazbě (subject_roles), načteme je, jinak null
  try {
    const { data, error } = await supabase
      .from('subject_roles')
      .select('role_code')
      .eq('subject_id', subjectId)

    if (error) return null
    const rows = (Array.isArray(data) ? data : []) as any[]
    const codes = rows.map((r) => String(r.role_code)).filter(Boolean)
    return codes.length ? codes : null
  } catch {
    return null
  }
}

function pickRoleCode(subject: UserDetailSubject, roles: string[] | null): string | null {
  // priorita: subjects.role_code, fallback: první role z vazby
  const direct = (subject.role_code ?? '').trim()
  if (direct) return direct
  if (roles && roles.length) return roles[0]
  return null
}

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

  const subject = data as unknown as UserDetailSubject

  // best-effort doplňky (nepoloží appku)
  const [roles, permissions] = await Promise.all([tryLoadRoles(subject.id), tryLoadPermissions(subject.id)])

  return {
    subject,
    roles,
    permissions,
    role_code: pickRoleCode(subject, roles),
  }
}

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

  const isUpdate = !!(input.id && String(input.id).trim() && String(input.id) !== 'new')

  const q = isUpdate
    ? supabase
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
    : supabase
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

  const { data, error } = await q
  if (error) throw new Error(error.message)

  const subject = data as unknown as UserDetailSubject
  const [roles, permissions] = await Promise.all([tryLoadRoles(subject.id), tryLoadPermissions(subject.id)])

  return {
    subject,
    roles,
    permissions,
    role_code: pickRoleCode(subject, roles),
  }
}
