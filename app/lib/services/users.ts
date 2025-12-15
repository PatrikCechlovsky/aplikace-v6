// FILE: app/lib/services/users.ts
// PURPOSE: CRUD pro modul 010 nad tabulkou public.subjects + role/permissions.

import { supabase } from '@/app/lib/supabaseClient'

const SUBJECT_TABLE = 'subjects'
const SUBJECT_ROLES_TABLE = 'subject_roles'
const SUBJECT_PERMS_TABLE = 'subject_permissions'

// IMPORTANT: v DB máš NOT NULL: subject_type, display_name, origin_module,
// created_at, updated_at, is_archived
const ORIGIN_MODULE = '010-sprava-uzivatelu'
const ORIGIN_ENTITY = 'user'

export type SubjectRow = {
  id: string
  subject_type: string
  auth_user_id: string | null

  title_before: string | null
  first_name: string | null
  last_name: string | null
  company_name: string | null

  display_name: string
  email: string | null
  phone: string | null

  login: string | null

  origin_module: string
  origin_entity: string | null

  created_at: string
  updated_at: string
  created_by: string | null

  is_archived: boolean
  archived_at: string | null
  archived_by: string | null
}

export type UserRoleRow = {
  subject_id: string
  role_code: string
}

export type UserPermissionRow = {
  subject_id: string
  permission_code: string
}

export type UsersListParams = {
  searchText?: string
  includeArchived?: boolean
  limit?: number
}

export type UsersListRow = SubjectRow & {
  role_code: string | null
}

export async function listUsers(params: UsersListParams = {}) {
  const { searchText = '', includeArchived = false, limit = 200 } = params

  // 1) subjects
  let q = supabase
    .from(SUBJECT_TABLE)
    .select(
      [
        'id',
        'subject_type',
        'auth_user_id',
        'title_before',
        'first_name',
        'last_name',
        'company_name',
        'display_name',
        'email',
        'phone',
        'login',
        'origin_module',
        'origin_entity',
        'created_at',
        'updated_at',
        'created_by',
        'is_archived',
        'archived_at',
        'archived_by',
      ].join(',')
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

  const { data: subjects, error: subjectsErr } = await q
  if (subjectsErr) throw subjectsErr

  const subjectRows = (subjects ?? []) as SubjectRow[]
  if (subjectRows.length === 0) return [] as UsersListRow[]

  // 2) roles (1 řádek na subject je u tebe typický případ)
  const ids = subjectRows.map((r) => r.id)
  const { data: roles, error: rolesErr } = await supabase
    .from(SUBJECT_ROLES_TABLE)
    .select('subject_id, role_code')
    .in('subject_id', ids)

  if (rolesErr) throw rolesErr

  const roleMap = new Map<string, string>()
  ;((roles ?? []) as UserRoleRow[]).forEach((r) => roleMap.set(r.subject_id, r.role_code))

  return subjectRows.map((s) => ({
    ...s,
    role_code: roleMap.get(s.id) ?? null,
  })) as UsersListRow[]
}

export type GetUserDetailResult = {
  subject: SubjectRow
  role_code: string | null
  permissions: string[] // permission_code[]
}

export async function getUserDetail(id: string): Promise<GetUserDetailResult> {
  // subject
  const { data: subject, error: subjectErr } = await supabase
    .from(SUBJECT_TABLE)
    .select(
      [
        'id',
        'subject_type',
        'auth_user_id',
        'title_before',
        'first_name',
        'last_name',
        'company_name',
        'display_name',
        'email',
        'phone',
        'login',
        'origin_module',
        'origin_entity',
        'created_at',
        'updated_at',
        'created_by',
        'is_archived',
        'archived_at',
        'archived_by',
      ].join(',')
    )
    .eq('id', id)
    .single()

  if (subjectErr) throw subjectErr
  const s = subject as SubjectRow

  // role
  const { data: roleRow, error: roleErr } = await supabase
    .from(SUBJECT_ROLES_TABLE)
    .select('subject_id, role_code')
    .eq('subject_id', id)
    .maybeSingle()

  if (roleErr) throw roleErr

  // permissions
  const { data: permRows, error: permErr } = await supabase
    .from(SUBJECT_PERMS_TABLE)
    .select('permission_code')
    .eq('subject_id', id)

  if (permErr) throw permErr

  return {
    subject: s,
    role_code: (roleRow as any)?.role_code ?? null,
    permissions: (permRows ?? []).map((p: any) => p.permission_code).filter(Boolean),
  }
}

export type SaveUserInput = {
  id: string // 'new' pro create

  // subjects
  subjectType?: string | null // např. 'osoba'
  authUserId?: string | null

  titleBefore?: string | null
  firstName?: string | null
  lastName?: string | null
  companyName?: string | null

  displayName: string
  email?: string | null
  phone?: string | null
  login?: string | null

  isArchived?: boolean

  // role + permissions (volitelné, lze zapojit později v UI)
  roleCode?: string | null
  permissionCodes?: string[] | null
}

export async function saveUser(input: SaveUserInput) {
  const isCreate = input.id === 'new'
  const id = isCreate ? crypto.randomUUID() : input.id

  const nowIso = new Date().toISOString()

  // ✅ DB vyžaduje NOT NULL
  const subjectType = (input.subjectType ?? 'osoba').trim()
  const displayName = (input.displayName ?? '').trim()

  if (!displayName) {
    throw new Error('display_name je povinné')
  }

  const payload: Partial<SubjectRow> & { id: string } = {
    id,
    subject_type: subjectType,
    auth_user_id: input.authUserId ?? null,

    title_before: input.titleBefore ?? null,
    first_name: input.firstName ?? null,
    last_name: input.lastName ?? null,
    company_name: input.companyName ?? null,

    display_name: displayName,
    email: input.email?.trim() ? input.email.trim() : null,
    phone: input.phone?.trim() ? input.phone.trim() : null,
    login: input.login?.trim() ? input.login.trim() : null,

    origin_module: ORIGIN_MODULE,
    origin_entity: ORIGIN_ENTITY,

    updated_at: nowIso,
    ...(isCreate ? { created_at: nowIso, is_archived: false } : {}),
    ...(typeof input.isArchived === 'boolean' ? { is_archived: input.isArchived } : {}),
  }

  // 1) upsert subject
  const { data: saved, error: saveErr } = await supabase
    .from(SUBJECT_TABLE)
    .upsert(payload, { onConflict: 'id' })
    .select(
      [
        'id',
        'subject_type',
        'auth_user_id',
        'title_before',
        'first_name',
        'last_name',
        'company_name',
        'display_name',
        'email',
        'phone',
        'login',
        'origin_module',
        'origin_entity',
        'created_at',
        'updated_at',
        'created_by',
        'is_archived',
        'archived_at',
        'archived_by',
      ].join(',')
    )
    .single()

  if (saveErr) throw saveErr

  const savedRow = saved as SubjectRow

  // 2) role sync (pokud přijde)
  if (input.roleCode != null) {
    const roleCode = input.roleCode.trim()
    await supabase.from(SUBJECT_ROLES_TABLE).delete().eq('subject_id', savedRow.id)
    if (roleCode) {
      const { error: roleInsErr } = await supabase.from(SUBJECT_ROLES_TABLE).insert({
        subject_id: savedRow.id,
        role_code: roleCode,
      })
      if (roleInsErr) throw roleInsErr
    }
  }

  // 3) permissions sync (pokud přijdou)
  if (input.permissionCodes != null) {
    const codes = input.permissionCodes.map((x) => (x ?? '').trim()).filter(Boolean)

    await supabase.from(SUBJECT_PERMS_TABLE).delete().eq('subject_id', savedRow.id)

    if (codes.length) {
      const { error: permInsErr } = await supabase.from(SUBJECT_PERMS_TABLE).insert(
        codes.map((c) => ({
          subject_id: savedRow.id,
          permission_code: c,
        }))
      )
      if (permInsErr) throw permInsErr
    }
  }

  return savedRow
}
