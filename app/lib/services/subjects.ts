// FILE: app/lib/services/subjects.ts
// PURPOSE: Subjekty service pro modul 800: list + detail + save.
// NOTES: Všechny subjekty bez filtru role. Ukládá role z formuláře.

import { supabase } from '@/app/lib/supabaseClient'
import { fetchSubjectTypes } from '@/app/modules/900-nastaveni/services/subjectTypes'

/* =========================
   LIST
   ========================= */

export type SubjectsListParams = {
  searchText?: string
  subjectType?: string | null // filtrovat podle typu subjektu
  includeArchived?: boolean
  limit?: number
}

export type SubjectsListRow = {
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

  // ✅ address fields
  street?: string | null
  house_number?: string | null
  city?: string | null
  zip?: string | null
  country?: string | null

  // ✅ role flags
  is_landlord?: boolean | null
  is_tenant?: boolean | null
  is_user?: boolean | null
  is_landlord_delegate?: boolean | null
  is_tenant_delegate?: boolean | null
  is_maintenance?: boolean | null
  is_maintenance_delegate?: boolean | null

  // ✅ metadata z subject_types (pro barevné označení a řazení)
  subject_type_name?: string | null
  subject_type_color?: string | null
  subject_type_sort_order?: number | null
}

export async function listSubjects(params: SubjectsListParams = {}): Promise<SubjectsListRow[]> {
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
        dic,

        street,
        house_number,
        city,
        zip,
        country,

        is_landlord,
        is_tenant,
        is_user,
        is_landlord_delegate,
        is_tenant_delegate,
        is_maintenance,
        is_maintenance_delegate
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

  // Načíst metadata typů subjektů pro barevné označení a řazení
  let subjectTypesMap: Map<string, { name: string; color: string | null; sort_order: number | null }> = new Map()
  try {
    const subjectTypes = await fetchSubjectTypes()
    subjectTypesMap = new Map(
      subjectTypes.map((st) => [
        st.code,
        {
          name: st.name,
          color: st.color,
          sort_order: st.sort_order,
        },
      ])
    )
  } catch (err) {
    // Pokud se nepodaří načíst typy, pokračujeme bez metadat
    console.warn('Failed to load subject types metadata', err)
  }

  // Spojit data s metadaty typů
  const rows = (data ?? []).map((row: any) => {
    const subjectTypeCode = row.subject_type
    const metadata = subjectTypeCode ? subjectTypesMap.get(subjectTypeCode) : null

    return {
      ...row,
      subject_type_name: metadata?.name ?? null,
      subject_type_color: metadata?.color ?? null,
      subject_type_sort_order: metadata?.sort_order ?? null,
    } as SubjectsListRow
  })

  return rows
}

/* =========================
   DETAIL SHAPE
   ========================= */

export type SubjectDetailRow = {
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

  // Address (všechny typy)
  street?: string | null
  house_number?: string | null
  city?: string | null
  zip?: string | null
  country?: string | null

  // Role flags
  is_user?: boolean | null
  is_landlord?: boolean | null
  is_landlord_delegate?: boolean | null
  is_tenant?: boolean | null
  is_tenant_delegate?: boolean | null
  is_maintenance?: boolean | null
  is_maintenance_delegate?: boolean | null
}

export async function getSubjectDetail(subjectId: string): Promise<{ subject: SubjectDetailRow }> {
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

        street,
        house_number,
        city,
        zip,
        country,

        is_user,
        is_landlord,
        is_landlord_delegate,
        is_tenant,
        is_tenant_delegate,
        is_maintenance,
        is_maintenance_delegate
      `
    )
    .eq('id', subjectId)
    .single()

  if (subjectErr) {
    console.error('getSubjectDetail error', {
      subjectId,
      message: subjectErr.message,
      details: subjectErr.details,
      hint: subjectErr.hint,
    })
    throw new Error(`Chyba při načítání subjektu: ${subjectErr.message}${subjectErr.hint ? ` (${subjectErr.hint})` : ''}`)
  }

  if (!subject?.id) {
    console.error('getSubjectDetail: Subject not found', { subjectId, subject })
    throw new Error('Subjekt nebyl nalezen.')
  }

  return { subject: subject as SubjectDetailRow }
}

/* =========================
   SAVE INPUT
   ========================= */

export type SaveSubjectInput = {
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
  delegateIds?: string[] // Pole ID zástupců (N:N vztah přes subject_delegates)

  // ADDRESS (všechny typy)
  street?: string | null
  city?: string | null
  zip?: string | null
  houseNumber?: string | null
  country?: string | null

  // ROLE FLAGS
  isUser?: boolean | null
  isLandlord?: boolean | null
  isLandlordDelegate?: boolean | null
  isTenant?: boolean | null
  isTenantDelegate?: boolean | null
  isMaintenance?: boolean | null
  isMaintenanceDelegate?: boolean | null
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
   SAVE: saveSubject -> vrací SubjectDetailRow
   ========================= */

export async function saveSubject(input: SaveSubjectInput): Promise<SubjectDetailRow> {
  const isNew = !input.id || input.id === 'new'

  const canBeDelegate = ['osoba', 'osvc', 'zastupce'].includes(String(input.subjectType || '').trim())

  const email = normalizeEmail(input.email)

  // kontrola duplicitního emailu
  await assertEmailUnique(email, isNew ? null : (input.id ?? null))

  const subjectPayload: any = {
    subject_type: input.subjectType, // POVINNÉ

    display_name: (input.displayName ?? '').trim() || null,
    email,
    phone: (input.phone ?? '').trim() || null,
    is_archived: input.isArchived ?? false,

    // ✅ Role flags
    is_user: !!input.isUser,
    is_landlord: !!input.isLandlord,
    is_landlord_delegate: canBeDelegate ? !!input.isLandlordDelegate : false,
    is_tenant: !!input.isTenant,
    is_tenant_delegate: canBeDelegate ? !!input.isTenantDelegate : false,
    is_maintenance: !!input.isMaintenance,
    is_maintenance_delegate: canBeDelegate ? !!input.isMaintenanceDelegate : false,

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

    // ADDRESS fields
    street: (input.street ?? '').trim() || null,
    city: (input.city ?? '').trim() || null,
    zip: (input.zip ?? '').trim() || null,
    house_number: (input.houseNumber ?? '').trim() || null,
    country: (input.country ?? '').trim() || null,

    // DB: subjects.origin_module je NOT NULL -> musí být vždy
    origin_module: '800',
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

    street,
    city,
    zip,
    house_number,
    country,

    is_user,
    is_landlord,
    is_landlord_delegate,
    is_tenant,
    is_tenant_delegate,
    is_maintenance,
    is_maintenance_delegate
  `

  if (isNew) {
    const { data, error } = await supabase
      .from('subjects')
      .insert(subjectPayload)
      .select(selectFields)
      .single()

    if (error) throw new Error(error.message)
    if (!data || typeof data !== 'object' || !('id' in data)) throw new Error('Nepodařilo se vytvořit subjekt.')

    const dataObj = data as any
    subjectId = String(dataObj.id ?? '').trim() || null
    if (!subjectId) throw new Error('Nepodařilo se vytvořit subjekt.')

    // Uložit zástupce do subject_delegates tabulky
    if (input.delegateIds && input.delegateIds.length > 0) {
      const delegatesToInsert = input.delegateIds
        .map((id) => id.trim())
        .filter(Boolean)
        .map((delegateId) => ({
          subject_id: subjectId,
          delegate_subject_id: delegateId,
        }))

      if (delegatesToInsert.length > 0) {
        const { error: delegatesError } = await supabase
          .from('subject_delegates')
          .insert(delegatesToInsert)

        if (delegatesError) {
          console.error('Failed to save delegates', delegatesError)
          // Nevyhodit chybu, jen logovat - subject už je uložený
        }
      }
    }

    return dataObj as SubjectDetailRow
  } else {
    const { data, error } = await supabase
      .from('subjects')
      .update(subjectPayload)
      .eq('id', subjectId)
      .select(selectFields)
      .single()

    if (error) throw new Error(error.message)
    if (!data || typeof data !== 'object' || !('id' in data)) throw new Error('Nepodařilo se aktualizovat subjekt.')

    // Aktualizovat zástupce v subject_delegates tabulce
    // Nejdřív smazat všechny existující zástupce
    const { error: deleteError } = await supabase
      .from('subject_delegates')
      .delete()
      .eq('subject_id', subjectId)

    if (deleteError) {
      console.error('Failed to delete existing delegates', deleteError)
      // Nevyhodit chybu, pokračovat
    }

    // Pak přidat nové zástupce
    if (input.delegateIds && input.delegateIds.length > 0) {
      const delegatesToInsert = input.delegateIds
        .map((id) => id.trim())
        .filter(Boolean)
        .map((delegateId) => ({
          subject_id: subjectId,
          delegate_subject_id: delegateId,
        }))

      if (delegatesToInsert.length > 0) {
        const { error: delegatesError } = await supabase
          .from('subject_delegates')
          .insert(delegatesToInsert)

        if (delegatesError) {
          console.error('Failed to save delegates', delegatesError)
          // Nevyhodit chybu, jen logovat
        }
      }
    }

    return data as any as SubjectDetailRow
  }
}

/* =========================
   COUNT BY TYPE
   ========================= */

export type SubjectCountByType = {
  subject_type: string
  count: number
}

/**
 * Vrací počet subjektů podle typu subjektu.
 * Používá se pro zobrazení počtů v menu.
 */
export async function getSubjectCountsByType(includeArchived: boolean = false): Promise<SubjectCountByType[]> {
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
