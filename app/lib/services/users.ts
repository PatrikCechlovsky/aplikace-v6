// FILE: app/lib/services/users.ts
// PURPOSE: Service pro Users modul (010) – list + detail + save.
// NOTE:
// - listUsers čte z view v_users_list (rychlé pro list)
// - getUserDetail čte ze subjects + subject_roles + subject_permissions (detail)
// - saveUser dělá insert/update subjects + role + permissions (MVP)

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
  is_archived: boolean | null
  created_at: string | null

  // volitelné – pokud je máš ve view v_users_list
  first_login_at?: string | null
  last_invite_sent_at?: string | null
  last_invite_expires_at?: string | null
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
        role_code,
        is_archived,
        created_at,
        first_login_at,
        last_invite_sent_at,
        last_invite_expires_at
      `
    )
    .order('display_name', { ascending: true })
    .limit(limit)

  if (!includeArchived) {
    q = q.or('is_archived.is.null,is_archived.eq.false')
  }

  if (search) {
    // hledání přes více polí (ilike)
    // Pozn.: Supabase neumí multi-field ilike jedním příkazem → použijeme OR filtr
    const s = `%${search}%`
    q = q.or(`display_name.ilike.${s},email.ilike.${s},phone.ilike.${s}`)
  }

  const { data, error } = await q
  if (error) throw new Error(error.message)

  // Supabase typy občas vrací union s error stringy → tady to stabilizujeme bezpečně
  return (data ?? []) as unknown as UsersListRow[]
}

export type SubjectRow = {
  id: string
  display_name: string | null
  email: string | null
  phone: string | null
  is_archived: boolean | null
  created_at: string | null
  first_login_at?: string | null
  last_login_at?: string | null

  // ✅ pole, která UserDetailFrame používá
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

export async function getUserDetail(subjectId: string): Promise<UserDetailRow> {
  // 1) subject
  const { data: subject, error: subjectErr } = await supabase
    .from('subjects')
    .select(`
      id,
      display_name,
      email,
      phone,
      is_archived,
      created_at,
      first_login_at,
      last_login_at,
      title_before,
      first_name,
      last_name,
      login
    `)
    .eq('id', subjectId)
    .single()

  if (subjectErr) throw new Error(subjectErr.message)
  if (!subject?.id) throw new Error('Uživatel nebyl nalezen.')

  // 2) role (MVP: 1 role na subjekt)
  const { data: roleRow, error: roleErr } = await supabase
    .from('subject_roles')
    .select(`role_code`)
    .eq('subject_id', subjectId)
    .maybeSingle()

  if (roleErr) throw new Error(roleErr.message)

  // 3) permissions (MVP)
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
    subject: subject as SubjectRow,
    role_code: (roleRow as any)?.role_code ?? null,
    permissions,
  }
}

export type SaveUserInput = {
  id?: string | null

  // ✅ UI posílá subjectType (např. 'osoba')
  subjectType?: string | null

  // subjects
  displayName?: string | null
  email?: string | null
  phone?: string | null
  isArchived?: boolean | null

  // person fields (UI je evidentně používá)
  titleBefore?: string | null
  firstName?: string | null
  lastName?: string | null
  login?: string | null

  // role + permissions
  roleCode?: string | null
  permissionCodes?: string[]
}

export async function saveUser(input: SaveUserInput): Promise<UserDetailRow> {
  const isNew = !input.id || input.id === 'new'

  const subjectPayload: any = {
    // ✅ typ subjektu
    subject_type: input.subjectType ?? null,
  
    // základ
    display_name: (input.displayName ?? '').trim() || null,
    email: (input.email ?? '').trim().toLowerCase() || null,
    phone: (input.phone ?? '').trim() || null,
    is_archived: input.isArchived ?? false,
  
    // person fields
    title_before: (input.titleBefore ?? '').trim() || null,
    first_name: (input.firstName ?? '').trim() || null,
    last_name: (input.lastName ?? '').trim() || null,
    login: (input.login ?? '').trim() || null,
  }

  let subjectId = input.id ?? null

  if (isNew) {
    const { data, error } = await supabase
      .from('subjects')
      .insert(subjectPayload)
      .select(`
        id,
        display_name,
        email,
        phone,
        is_archived,
        created_at,
        first_login_at,
        last_login_at,
        title_before,
        first_name,
        last_name,
        login
      `)
      .single()

    if (error) throw new Error(error.message)
    subjectId = data?.id ?? null
    if (!subjectId) throw new Error('Nepodařilo se vytvořit uživatele.')
  } else {
    const { data, error } = await supabase
      .from('subjects')
      .update(subjectPayload)
      .eq('id', subjectId)
      .select(
        `
        id,
        display_name,
        email,
        phone,
        is_archived,
        created_at,
        first_login_at,
        last_login_at
      `
      )
      .single()

    if (error) throw new Error(error.message)
    subjectId = data?.id ?? subjectId
  }

  // role (pokud poslána)
  if (input.roleCode && subjectId) {
    const { error: roleUpsertErr } = await supabase.from('subject_roles').upsert(
      {
        subject_id: subjectId,
        role_code: input.roleCode,
      },
      { onConflict: 'subject_id' } // typicky 1 řádek na subjekt
    )
    if (roleUpsertErr) throw new Error(roleUpsertErr.message)
  }

  // permissions (pokud poslány)
  if (Array.isArray(input.permissionCodes) && subjectId) {
    // MVP: smaž a znovu vlož (jednoduché a auditovatelné)
    const { error: delErr } = await supabase.from('subject_permissions').delete().eq('subject_id', subjectId)
    if (delErr) throw new Error(delErr.message)

    const rows = input.permissionCodes
      .map((c) => (c ?? '').trim())
      .filter((c) => !!c)
      .map((c) => ({ subject_id: subjectId, permission_code: c }))

    if (rows.length > 0) {
      const { error: insErr } = await supabase.from('subject_permissions').insert(rows)
      if (insErr) throw new Error(insErr.message)
    }
  }

  // vrať detail v shape, který UserDetailFrame očekává (d.subject, d.role_code, d.permissions)
  return await getUserDetail(subjectId!)
}
