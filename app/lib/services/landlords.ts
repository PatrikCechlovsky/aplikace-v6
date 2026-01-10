// FILE: app/lib/services/landlords.ts
// PURPOSE: Landlords service pro modul 030: list + detail + save.
// CONTRACT:
// - listLandlords(params) -> LandlordsListRow[] (s filtrem podle subject_type)
// - getLandlordDetail(id) -> { subject: LandlordDetailRow }
// - saveLandlord(input) -> vrací uložený SUBJECT ROW

import { supabase } from '@/app/lib/supabaseClient'

/* =========================
   LIST
   ========================= */

export type LandlordsListParams = {
  searchText?: string
  subjectType?: string | null // filtrovat podle typu subjektu
  includeArchived?: boolean
  limit?: number
}

export type LandlordsListRow = {
  id: string
  display_name: string | null
  email: string | null
  phone: string | null
  subject_type: string | null
  is_archived: boolean | null
  created_at: string | null

  // ✅ person fields (pro osoba, osvc, zastupce)
  title_before?: string | null
  first_name?: string | null
  last_name?: string | null

  // ✅ company fields (pro firma, spolek, statni)
  company_name?: string | null
  ic?: string | null
  dic?: string | null
}

export async function listLandlords(params: LandlordsListParams = {}): Promise<LandlordsListRow[]> {
  const search = (params.searchText ?? '').trim()
  const includeArchived = !!params.includeArchived
  const limit = params.limit ?? 500
  const subjectType = params.subjectType?.trim() || null

  let q = supabase
    .from('subjects')
    .select(
      `
        id,
        display_name,
        email,
        phone,
        subject_type,
        is_archived,
        created_at,
        
        title_before,
        first_name,
        last_name,
        
        company_name,
        ic,
        dic
      `
    )
    .order('display_name', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  // Filtrovat podle typu subjektu (pokud je zadán)
  if (subjectType) {
    q = q.eq('subject_type', subjectType)
  }

  if (!includeArchived) {
    q = q.or('is_archived.is.null,is_archived.eq.false')
  }

  if (search) {
    const s = `%${search}%`
    q = q.or(
      [
        `display_name.ilike.${s}`,
        `email.ilike.${s}`,
        `phone.ilike.${s}`,
        `first_name.ilike.${s}`,
        `last_name.ilike.${s}`,
        `title_before.ilike.${s}`,
        `company_name.ilike.${s}`,
        `ic.ilike.${s}`,
      ].join(',')
    )
  }

  const { data, error } = await q
  if (error) throw new Error(error.message)

  return (data ?? []) as unknown as LandlordsListRow[]
}

/* =========================
   DETAIL SHAPE
   ========================= */

export type LandlordDetailRow = {
  id: string
  subject_type: string | null

  display_name: string | null
  email: string | null
  phone: string | null
  is_archived: boolean | null
  created_at: string | null
  updated_at?: string | null

  // Person fields (osoba, osvc, zastupce)
  title_before?: string | null
  first_name?: string | null
  last_name?: string | null
  note?: string | null
  
  // Personal identification (osoba, osvc, zastupce)
  birth_date?: string | null // DATE as ISO string
  personal_id_number?: string | null
  id_doc_type?: string | null
  id_doc_number?: string | null

  // Company fields (firma, spolek, statni)
  company_name?: string | null
  ic?: string | null
  dic?: string | null
  ic_valid?: boolean | null
  dic_valid?: boolean | null
  delegate_id?: string | null // FK na subject (zástupce)

  // Address (všechny typy)
  street?: string | null
  city?: string | null
  zip?: string | null
  house_number?: string | null
  country?: string | null
  ruian_address_id?: string | null
  ruian_validated?: boolean | null
  address_source?: string | null
}

/* =========================
   DETAIL: getLandlordDetail
   ========================= */

export async function getLandlordDetail(subjectId: string): Promise<{ subject: LandlordDetailRow }> {
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
        
        title_before,
        first_name,
        last_name,
        note,
        
        birth_date,
        personal_id_number,
        id_doc_type,
        id_doc_number,
        
        company_name,
        ic,
        dic,
        ic_valid,
        dic_valid,
        delegate_id,
        
        street,
        city,
        zip,
        house_number,
        country,
        ruian_address_id,
        ruian_validated,
        address_source
      `
    )
    .eq('id', subjectId)
    .single()

  if (subjectErr) throw new Error(subjectErr.message)
  if (!subject?.id) throw new Error('Pronajímatel nebyl nalezen.')

  return {
    subject: subject as unknown as LandlordDetailRow,
  }
}

/* =========================
   SAVE INPUT
   ========================= */

export type SaveLandlordInput = {
  id?: string | null

  // SUBJECT
  subjectType: string // POVINNÉ - typ subjektu

  displayName?: string | null
  email?: string | null
  phone?: string | null
  isArchived?: boolean | null

  // PERSON (osoba, osvc, zastupce)
  titleBefore?: string | null
  firstName?: string | null
  lastName?: string | null
  note?: string | null

  // PERSONAL IDENTIFICATION (osoba, osvc, zastupce)
  birthDate?: string | null // DATE as ISO string (YYYY-MM-DD)
  personalIdNumber?: string | null
  idDocType?: string | null
  idDocNumber?: string | null

  // COMPANY (firma, spolek, statni)
  companyName?: string | null
  ic?: string | null
  dic?: string | null
  icValid?: boolean | null
  dicValid?: boolean | null
  delegateId?: string | null // FK na subject (zástupce)

  // ADDRESS (všechny typy)
  street?: string | null
  city?: string | null
  zip?: string | null
  houseNumber?: string | null
  country?: string | null
  ruianAddressId?: string | null
  ruianValidated?: boolean | null
  addressSource?: string | null
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
   SAVE: saveLandlord -> vrací LandlordDetailRow
   ========================= */

export async function saveLandlord(input: SaveLandlordInput): Promise<LandlordDetailRow> {
  const isNew = !input.id || input.id === 'new'

  const email = normalizeEmail(input.email)

  // kontrola duplicitního emailu
  await assertEmailUnique(email, isNew ? null : (input.id ?? null))

  const subjectPayload: any = {
    subject_type: input.subjectType, // POVINNÉ

    display_name: (input.displayName ?? '').trim() || null,
    email,
    phone: (input.phone ?? '').trim() || null,
    is_archived: input.isArchived ?? false,

    // PERSON fields
    title_before: (input.titleBefore ?? '').trim() || null,
    first_name: (input.firstName ?? '').trim() || null,
    last_name: (input.lastName ?? '').trim() || null,
    note: (input.note ?? '').trim() || null,

    // PERSONAL IDENTIFICATION fields
    birth_date: input.birthDate ? (input.birthDate.trim() || null) : null,
    personal_id_number: (input.personalIdNumber ?? '').trim() || null,
    id_doc_type: (input.idDocType ?? '').trim() || null,
    id_doc_number: (input.idDocNumber ?? '').trim() || null,

    // COMPANY fields
    company_name: (input.companyName ?? '').trim() || null,
    ic: (input.ic ?? '').trim() || null,
    dic: (input.dic ?? '').trim() || null,
    ic_valid: input.icValid ?? false,
    dic_valid: input.dicValid ?? false,
    delegate_id: input.delegateId?.trim() || null,

    // ADDRESS fields
    street: (input.street ?? '').trim() || null,
    city: (input.city ?? '').trim() || null,
    zip: (input.zip ?? '').trim() || null,
    house_number: (input.houseNumber ?? '').trim() || null,
    country: (input.country ?? '').trim() || null,
    ruian_address_id: (input.ruianAddressId ?? '').trim() || null,
    ruian_validated: input.ruianValidated ?? false,
    address_source: (input.addressSource ?? '').trim() || null,

    // DB: subjects.origin_module je NOT NULL -> musí být vždy
    origin_module: '030',
  }

  // 1) save subject (insert/update)
  let subjectId = input.id ?? null

  const selectFields = `
    id,
    subject_type,
    display_name,
    email,
    phone,
    is_archived,
    created_at,
    updated_at,
    
    title_before,
    first_name,
    last_name,
    note,
    
    birth_date,
    personal_id_number,
    id_doc_type,
    id_doc_number,
    
    company_name,
    ic,
    dic,
    ic_valid,
    dic_valid,
    delegate_id,
    
    street,
    city,
    zip,
    house_number,
    country,
    ruian_address_id,
    ruian_validated,
    address_source
  `

  if (isNew) {
    const { data, error } = await supabase
      .from('subjects')
      .insert(subjectPayload)
      .select(selectFields)
      .single()

    if (error) throw new Error(error.message)
    subjectId = data?.id ?? null
    if (!subjectId) throw new Error('Nepodařilo se vytvořit pronajimatele.')

    return data as unknown as LandlordDetailRow
  } else {
    const { data, error } = await supabase
      .from('subjects')
      .update(subjectPayload)
      .eq('id', subjectId)
      .select(selectFields)
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Nepodařilo se aktualizovat pronajimatele.')

    return data as unknown as LandlordDetailRow
  }
}

/* =========================
   COUNT BY TYPE
   ========================= */

export type LandlordCountByType = {
  subject_type: string
  count: number
}

/**
 * Vrací počet pronajímatelů podle typu subjektu.
 * Používá se pro zobrazení počtů v menu.
 */
export async function getLandlordCountsByType(includeArchived: boolean = false): Promise<LandlordCountByType[]> {
  let q = supabase
    .from('subjects')
    .select('subject_type')

  if (!includeArchived) {
    q = q.or('is_archived.is.null,is_archived.eq.false')
  }

  const { data, error } = await q

  if (error) throw new Error(error.message)

  // Seskupit podle typu a spočítat
  const counts = new Map<string, number>()
  for (const row of data ?? []) {
    const type = String(row?.subject_type ?? '').trim()
    if (type) {
      counts.set(type, (counts.get(type) ?? 0) + 1)
    }
  }

  return Array.from(counts.entries()).map(([subject_type, count]) => ({
    subject_type,
    count,
  }))
}

