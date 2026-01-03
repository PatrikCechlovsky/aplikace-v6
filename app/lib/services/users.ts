// FILE: app/lib/services/users.ts
// PURPOSE: Users service pro modul 010: list + detail + save.
// CONTRACT (dle UserDetailFrame.tsx):
// - getUserDetail(id) -> { subject, role_code, permissions }
// - saveUser(input) -> vrací uložený SUBJECT ROW (saved.id, saved.display_name, ...)

import { supabase } from '@/app/lib/supabaseClient'

/* =========================
   LIST
   ========================= */
/* =========================
   LIST
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
  subject_type: string | null
  role_code: string | null
  is_archived: boolean | null
  created_at: string | null

  // login/invite (existuje ve v_users_list)
  first_login_at?: string | null
  last_login_at?: string | null
  last_invite_sent_at?: string | null
  last_invite_expires_at?: string | null
  last_invite_status?: string | null
}

export async function listUsers(params: UsersListParams = {}): Promise<UsersListRow[]> {
  const search = (params.searchText ?? '').trim()
  const includeArchived = !!params.includeArchived
  const limit = params.limit ?? 500

  let q = supabase
    .from('v_users_list')
    .select(
      `
        id,
        display_name,
        email,
        phone,
        subject_type,
        role_code,
        is_archived,
        created_at,
        first_login_at,
        last_login_at,
        last_invite_sent_at,
        last_invite_expires_at,
        last_invite_status
      `
    )
    .order('display_name', { ascending: true, nullsFirst: false })
    .limit(limit)

  if (!includeArchived) {
    q = q.or('is_archived.is.null,is_archived.eq.false')
  }

  if (search) {
    const s = `%${search}%`
    // rozšířeno i o systémová pole (když budeš chtít vyhledávat i podle nich)
    q = q.or(
      [
        `display_name.ilike.${s}`,
        `email.ilike.${s}`,
        `phone.ilike.${s}`,
        `role_code.ilike.${s}`,
        `last_invite_status.ilike.${s}`,
      ].join(',')
    )
  }

  const { data, error } = await q
  if (error) throw new Error(error.message)

  return (data ?? []) as unknown as UsersListRow[]
}
/* =========================
   DETAIL SHAPE
   ========================= */

export type SubjectRow = {
  id: string
  subject_type?: string | null

  display_name: string | null
  email: string | null
  phone: string | null
  is_archived: boolean | null
  created_at: string | null
  updated_at?: string | null

  first_login_at?: string | null
  last_login_at?: string | null

  // person fields (UserDetailFrame je používá)
  title_before?: string | null
  first_name?: string | null
  last_name?: string | null
  login?: string | null
}

export type UserDetailRow = {
  subject: SubjectRow
  role_code: string | null
  permissions: string[]
}

/* =========================
   DETAIL: getUserDetail
   ========================= */

export async function getUserDetail(subjectId: string): Promise<UserDetailRow> {
  const { data: subject, error: subjectErr } = await supabase
    .from('subjects')
    .select(
      `
        id,
        subject_type,
        display_name,
        email,
        phone,
        is_archived,
        created_at,
        updated_at,
        first_login_at,
        last_login_at,
        title_before,
        first_name,
        last_name,
        login
      `
    )
    .eq('id', subjectId)
    .single()

  if (subjectErr) throw new Error(subjectErr.message)
  if (!subject?.id) throw new Error('Uživatel nebyl nalezen.')

  // role – MVP: 1 role na subject (upsert na subject_id)
  const { data: roleRow, error: roleErr } = await supabase
    .from('subject_roles')
    .select(`role_code`)
    .eq('subject_id', subjectId)
    .maybeSingle()

  if (roleErr) throw new Error(roleErr.message)

  // permissions – MVP
  const { data: permRows, error: permErr } = await supabase
    .from('subject_permissions')
    .select(`permission_code`)
    .eq('subject_id', subjectId)

  if (permErr) throw new Error(permErr.message)

  const permissions =
    (permRows ?? [])
      .map((x: any) => (x?.permission_code ?? '').trim())
      .filter((x: string) => !!x) ?? []

  return {
    subject: subject as unknown as SubjectRow,
    role_code: (roleRow as any)?.role_code ?? null,
    permissions,
  }
}

/* =========================
   SAVE INPUT
   ========================= */

export type SaveUserInput = {
  id?: string | null

  // SUBJECT
  subjectType?: string | null

  displayName?: string | null
  email?: string | null
  phone?: string | null
  isArchived?: boolean | null

  // PERSON
  titleBefore?: string | null
  firstName?: string | null
  lastName?: string | null
  login?: string | null

  // ROLE + PERMISSIONS
  roleCode?: string | null
  permissionCodes?: string[]
}

/* =========================
   HELPERS
   ========================= */

function normalizeEmail(email: string | null | undefined): string | null {
  const e = (email ?? '').trim().toLowerCase()
  return e || null
}

async function assertEmailUnique(email: string | null, ignoreSubjectId?: string | null) {
  if (!email) return

  let q = supabase.from('subjects').select('id').eq('email', email).limit(1)
  if (ignoreSubjectId) q = q.neq('id', ignoreSubjectId)

  const { data, error } = await q
  if (error) throw new Error(error.message)

  if ((data ?? []).length > 0) {
    throw new Error('Subjekt s tímto emailem už existuje. Zadej jiný email.')
  }
}

/* =========================
   SAVE: saveUser -> vrací SubjectRow (plochý row)
   ========================= */

export async function saveUser(input: SaveUserInput): Promise<SubjectRow> {
  const isNew = !input.id || input.id === 'new'

  const email = normalizeEmail(input.email)

  // kontrola duplicitního emailu (přesně jak chceš)
  await assertEmailUnique(email, isNew ? null : (input.id ?? null))

  const subjectPayload: any = {
    subject_type: input.subjectType ?? 'osoba',

    display_name: (input.displayName ?? '').trim() || null,
    email,
    phone: (input.phone ?? '').trim() || null,
    is_archived: input.isArchived ?? false,

    title_before: (input.titleBefore ?? '').trim() || null,
    first_name: (input.firstName ?? '').trim() || null,
    last_name: (input.lastName ?? '').trim() || null,
    login: (input.login ?? '').trim() || null,

    // DB: subjects.origin_module je NOT NULL -> musí být vždy
    origin_module: '010',
  }

  // 1) save subject (insert/update)
  let subjectId = input.id ?? null

  if (isNew) {
    const { data, error } = await supabase
      .from('subjects')
      .insert(subjectPayload)
      .select(
        `
        id,
        subject_type,
        display_name,
        email,
        phone,
        is_archived,
        created_at,
        updated_at,
        first_login_at,
        last_login_at,
        title_before,
        first_name,
        last_name,
        login
      `
      )
      .single()

    if (error) throw new Error(error.message)
    subjectId = data?.id ?? null
    if (!subjectId) throw new Error('Nepodařilo se vytvořit uživatele.')

    // 2) role + permissions (volitelné)
    await saveRoleAndPermissions(subjectId, input.roleCode ?? null, input.permissionCodes ?? null)

    return data as unknown as SubjectRow
  } else {
    const { data, error } = await supabase
      .from('subjects')
      .update(subjectPayload)
      .eq('id', subjectId)
      .select(
        `
        id,
        subject_type,
        display_name,
        email,
        phone,
        is_archived,
        created_at,
        updated_at,
        first_login_at,
        last_login_at,
        title_before,
        first_name,
        last_name,
        login
      `
      )
      .single()

    if (error) throw new Error(error.message)

    await saveRoleAndPermissions(subjectId!, input.roleCode ?? null, input.permissionCodes ?? null)

    return data as unknown as SubjectRow
  }
}

async function saveRoleAndPermissions(
  subjectId: string,
  roleCode: string | null,
  permissionCodes: string[] | null
) {
  // role (pokud poslána)
  if (roleCode) {
    const { error: roleUpsertErr } = await supabase.from('subject_roles').upsert(
      {
        subject_id: subjectId,
        role_code: roleCode,
      },
      { onConflict: 'subject_id' }
    )
    if (roleUpsertErr) throw new Error(roleUpsertErr.message)
  }

  // permissions (pokud poslané)
  if (Array.isArray(permissionCodes)) {
    const { error: delErr } = await supabase.from('subject_permissions').delete().eq('subject_id', subjectId)
    if (delErr) throw new Error(delErr.message)

    const rows = permissionCodes
      .map((c) => (c ?? '').trim())
      .filter((c) => !!c)
      .map((c) => ({ subject_id: subjectId, permission_code: c }))

    if (rows.length > 0) {
      const { error: insErr } = await supabase.from('subject_permissions').insert(rows)
      if (insErr) throw new Error(insErr.message)
    }
  }
}
