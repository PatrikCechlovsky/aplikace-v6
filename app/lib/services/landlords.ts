// FILE: app/lib/services/landlords.ts
// PURPOSE: Landlords service pro modul 030: list + detail + save.
// CONTRACT:
// - listLandlords(params) -> LandlordsListRow[] (s filtrem podle subject_type)
// - getLandlordDetail(id) -> { subject: LandlordDetailRow }
// - saveLandlord(input) -> vrací uložený SUBJECT ROW

import { supabase } from '@/app/lib/supabaseClient'
import { fetchSubjectTypes } from '@/app/modules/900-nastaveni/services/subjectTypes'
import { listUsers } from './users'

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

  // ✅ metadata z subject_types (pro barevné označení a řazení)
  subject_type_name?: string | null
  subject_type_color?: string | null
  subject_type_sort_order?: number | null
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
    } as LandlordsListRow
  })

  return rows
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
  // delegate_id bylo odstraněno - zástupci se ukládají do subject_delegates tabulky

  // Address (všechny typy)
  street?: string | null
  city?: string | null
  zip?: string | null
  house_number?: string | null
  country?: string | null
}

/* =========================
   DETAIL: getLandlordDetail
   ========================= */

export async function getLandlordDetail(subjectId: string): Promise<LandlordDetailRow> {
  try {
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
        city,
        zip,
        house_number,
        country
      `
    )
    .eq('id', subjectId)
    .single()

    if (subjectErr) {
      console.error('getLandlordDetail: Supabase error', {
        subjectId,
        error: subjectErr,
        code: subjectErr.code,
        message: subjectErr.message,
        details: subjectErr.details,
        hint: subjectErr.hint,
      })
      throw new Error(`Chyba při načítání pronajimatele: ${subjectErr.message}${subjectErr.hint ? ` (${subjectErr.hint})` : ''}`)
    }

    if (!subject?.id) {
      console.error('getLandlordDetail: Subject not found', { subjectId, subject })
      throw new Error('Pronajímatel nebyl nalezen.')
    }

    // Načíst zástupce z subject_delegates tabulky
    const { data: delegatesData, error: delegatesErr } = await supabase
      .from('subject_delegates')
      .select('delegate_subject_id')
      .eq('subject_id', subjectId)

    // delegateIds se přidá do výsledku (ale ne do typu LandlordDetailRow, protože to by vyžadovalo změnu typu)
    const result = subject as any as LandlordDetailRow
    if (!delegatesErr && delegatesData) {
      ;(result as any).delegateIds = delegatesData.map((row: any) => String(row.delegate_subject_id)).filter(Boolean)
    } else {
      ;(result as any).delegateIds = []
    }

    return result
  } catch (err: any) {
    console.error('getLandlordDetail: Unexpected error', { subjectId, error: err })
    if (err instanceof Error) throw err
    throw new Error(`Neočekávaná chyba při načítání pronajimatele: ${String(err)}`)
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
  delegateIds?: string[] // Pole ID zástupců (N:N vztah přes subject_delegates)

  // ADDRESS (všechny typy)
  street?: string | null
  city?: string | null
  zip?: string | null
  houseNumber?: string | null
  country?: string | null
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
    // delegate_id bylo odstraněno - zástupci se ukládají do subject_delegates tabulky

    // ADDRESS fields
    street: (input.street ?? '').trim() || null,
    city: (input.city ?? '').trim() || null,
    zip: (input.zip ?? '').trim() || null,
    house_number: (input.houseNumber ?? '').trim() || null,
    country: (input.country ?? '').trim() || null,

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
    
    street,
    city,
    zip,
    house_number,
    country
  `

  if (isNew) {
    const { data, error } = await supabase
      .from('subjects')
      .insert(subjectPayload)
      .select(selectFields)
      .single()

    if (error) throw new Error(error.message)
    if (!data || typeof data !== 'object' || !('id' in data)) throw new Error('Nepodařilo se vytvořit pronajimatele.')
    
    const dataObj = data as any
    subjectId = String(dataObj.id ?? '').trim() || null
    if (!subjectId) throw new Error('Nepodařilo se vytvořit pronajimatele.')

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

    return dataObj as LandlordDetailRow
  } else {
    const { data, error } = await supabase
      .from('subjects')
      .update(subjectPayload)
      .eq('id', subjectId)
      .select(selectFields)
      .single()

    if (error) throw new Error(error.message)
    if (!data || typeof data !== 'object' || !('id' in data)) throw new Error('Nepodařilo se aktualizovat pronajimatele.')

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

    return data as any as LandlordDetailRow
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

/* =========================
   DELEGATES: getAvailableDelegates
   ========================= */

export type DelegateOption = {
  id: string
  displayName: string
  email: string | null
  phone: string | null
  subjectType: string | null
  roleCode?: string | null // Pro uživatele s rolí
  source: 'landlord' | 'user' // Zda je z seznamu pronajímatelů nebo uživatelů
}

/**
 * Načte seznam dostupných zástupců pro výběr.
 * Kombinuje:
 * 1. Subjekty s typem "zastupce" ze seznamu pronajímatelů
 * 2. Osoby ze seznamu uživatelů s rolí pronajimatel, manager, nebo správce
 */
export async function getAvailableDelegates(searchText?: string): Promise<DelegateOption[]> {
  const search = (searchText ?? '').trim()
  const delegates: DelegateOption[] = []

  // 1) Načíst zástupce ze seznamu pronajímatelů (typ "zastupce")
  try {
    const landlords = await listLandlords({
      subjectType: 'zastupce',
      includeArchived: false,
      limit: 500,
      searchText: search || undefined,
    })

    for (const landlord of landlords) {
      delegates.push({
        id: landlord.id,
        displayName: landlord.display_name || '',
        email: landlord.email,
        phone: landlord.phone,
        subjectType: landlord.subject_type,
        source: 'landlord',
      })
    }
  } catch (err) {
    console.error('Failed to load delegates from landlords', err)
    // Pokračovat i při chybě
  }

  // 2) Načíst uživatele s rolí pronajimatel, manager, nebo správce
  try {
    const users = await listUsers({
      includeArchived: false,
      limit: 500,
      searchText: search || undefined,
    })

    // Povolené role pro zástupce
    const allowedRoles = ['pronajimatel', 'manager', 'spravce', 'správce']

    for (const user of users) {
      // Filtrovat jen uživatele s povolenou rolí
      if (user.role_code && allowedRoles.includes(user.role_code.toLowerCase())) {
        delegates.push({
          id: user.id,
          displayName: user.display_name || '',
          email: user.email,
          phone: user.phone,
          subjectType: user.subject_type,
          roleCode: user.role_code,
          source: 'user',
        })
      }
    }
  } catch (err) {
    console.error('Failed to load delegates from users', err)
    // Pokračovat i při chybě
  }

  // Seřadit podle displayName
  delegates.sort((a, b) => {
    const nameA = (a.displayName || '').toLowerCase()
    const nameB = (b.displayName || '').toLowerCase()
    return nameA.localeCompare(nameB, 'cs')
  })

  return delegates
}

/**
 * Načte seznam zástupců pro konkrétního pronajimatele.
 */
export async function getLandlordDelegates(landlordId: string): Promise<DelegateOption[]> {
  const { data, error } = await supabase
    .from('subject_delegates')
    .select('delegate_subject_id')
    .eq('subject_id', landlordId)

  if (error) throw new Error(error.message)

  const delegateIds = (data ?? []).map((row: any) => String(row.delegate_subject_id)).filter(Boolean)
  
  if (delegateIds.length === 0) {
    return []
  }

  // Načíst detaily zástupců
  const { data: subjects, error: subjectsError } = await supabase
    .from('subjects')
    .select('id, display_name, email, phone, subject_type')
    .in('id', delegateIds)

  if (subjectsError) throw new Error(subjectsError.message)

  const delegates: DelegateOption[] = []
  for (const subject of subjects ?? []) {
    delegates.push({
      id: subject.id,
      displayName: subject.display_name || '',
      email: subject.email,
      phone: subject.phone,
      subjectType: subject.subject_type,
      source: 'landlord', // Default, můžeme později rozlišit
    })
  }

  return delegates
}

