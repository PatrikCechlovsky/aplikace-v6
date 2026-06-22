// FILE: app/lib/services/contractEvidenceSheets.ts
// PURPOSE: Service layer pro evidenční listy smluv (přílohy služeb)
// NOTES: Pracuje s contract_evidence_sheets + users + services

import { supabase } from '../supabaseClient'
import createLogger from '../logger'
import type { TenantUser } from './tenantUsers'

const logger = createLogger('contractEvidenceSheets.service')

function formatIsoDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function subtractOneDay(dateString: string): string | null {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return null
  date.setDate(date.getDate() - 1)
  return formatIsoDate(date)
}

function normalizeText(value: string | null | undefined): string {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
}

function isAreaUnit(value: string | null | undefined): boolean {
  const normalized = normalizeText(value)
  return normalized.includes('m2') || normalized.includes('m²') || normalized.includes('metru') || normalized.includes('metr')
}

function isPersonUnit(value: string | null | undefined): boolean {
  const normalized = normalizeText(value)
  return normalized.includes('osob') || normalized.includes('osoba') || normalized.includes('person') || normalized.includes('persons')
}

async function getContractUnitArea(contractId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('contracts')
    .select('unit:units!contracts_unit_id_fkey(area)')
    .eq('id', contractId)
    .single()

  if (error) {
    logger.error('getContractUnitArea failed', { contractId, error })
    return null
  }

  const unit = Array.isArray(data?.unit) ? data?.unit[0] : data?.unit
  return unit?.area ?? null
}

async function loadServiceUnitInfo(serviceIds: string[]): Promise<Record<string, { unitName: string | null; billingTypeName: string | null }>> {
  if (!serviceIds.length) return {}

  const { data, error } = await supabase
    .from('service_catalog')
    .select('id, unit:unit_id(name), billing_type:billing_type_id(name)')
    .in('id', serviceIds)

  if (error) {
    logger.error('loadServiceUnitInfo failed', { serviceIds, error })
    return {}
  }

  return (data ?? []).reduce((acc: Record<string, { unitName: string | null; billingTypeName: string | null }>, row: any) => {
    const unit = Array.isArray(row.unit) ? row.unit[0] : row.unit
    const billingType = Array.isArray(row.billing_type) ? row.billing_type[0] : row.billing_type
    acc[row.id] = {
      unitName: unit?.name ?? null,
      billingTypeName: billingType?.name ?? null,
    }
    return acc
  }, {})
}

function resolveEvidenceSheetQuantity(
  currentQuantity: number,
  totalPersons: number,
  unitArea: number | null,
  unitName: string | null,
  billingTypeName: string | null,
  unitType: 'flat' | 'person'
): number {
  const referencedName = `${unitName ?? ''} ${billingTypeName ?? ''}`.trim()

  if (isPersonUnit(referencedName) || unitType === 'person') {
    return Math.max(1, totalPersons)
  }

  if (isAreaUnit(referencedName) && unitArea !== null) {
    return Math.max(1, Math.round(unitArea))
  }

  return currentQuantity || 1
}

function resolveEvidenceSheetAmount(unitPrice: number, quantity: number): number {
  return Number(unitPrice ?? 0) * quantity
}

export type EvidenceSheetStatus = 'draft' | 'active' | 'archived'

export type EvidenceSheetRow = {
  id: string
  contract_id: string
  sheet_number: number
  valid_from: string | null
  valid_to: string | null
  replaces_sheet_id: string | null
  rent_amount: number | null
  total_persons: number
  services_total: number
  total_amount: number
  description: string | null
  notes: string | null
  status: EvidenceSheetStatus
  is_archived: boolean
  created_at: string
  updated_at: string
}
export type EvidenceSheetUserRow = {
  id: string
  sheet_id: string
  tenant_user_id: string | null
  first_name: string | null
  last_name: string | null
  birth_date: string | null
  note: string | null
  is_archived: boolean
  created_at: string
  updated_at: string
}

export type EvidenceSheetServiceRow = {
  id: string
  sheet_id: string
  service_id: string | null
  service_name: string
  unit_type: 'flat' | 'person'
  unit_price: number
  quantity: number
  total_amount: number
  order_index: number
  is_archived: boolean
  valid_from: string | null
  valid_to: string | null
  created_at: string
  updated_at: string

  category_name?: string | null
  category_color?: string | null
  billing_type_name?: string | null
  billing_type_color?: string | null
  unit_name?: string | null
  vat_rate_name?: string | null
  catalog_base_price?: number | null
}

export type EvidenceSheetServiceInput = {
  service_id?: string | null
  service_name: string
  unit_type: 'flat' | 'person'
  unit_price: number
  quantity: number
  total_amount: number
  order_index?: number
  valid_from?: string | null
  valid_to?: string | null
}

export type EvidenceSheetUserInput = {
  id: string
  first_name: string
  last_name: string
  birth_date: string
  note?: string | null
}

export async function listEvidenceSheets(contractId: string, includeArchived = false): Promise<EvidenceSheetRow[]> {
  logger.debug('listEvidenceSheets', { contractId, includeArchived })
  let query = supabase
    .from('contract_evidence_sheets')
    .select('*')
    .eq('contract_id', contractId)
    .order('sheet_number', { ascending: false })

  if (!includeArchived) {
    query = query.eq('is_archived', false)
  }

  const { data, error } = await query
  if (error) {
    logger.error('listEvidenceSheets failed', error)
    throw new Error(`Nepodařilo se načíst evidenční listy: ${error.message}`)
  }

  return data || []
}

export async function getEvidenceSheet(sheetId: string): Promise<EvidenceSheetRow | null> {
  logger.debug('getEvidenceSheet', { sheetId })

  const { data, error } = await supabase
    .from('contract_evidence_sheets')
    .select('*')
    .eq('id', sheetId)
    .maybeSingle()

  if (error) {
    logger.error('getEvidenceSheet failed', error)
    throw new Error(`Nepodařilo se načíst evidenční list: ${error.message}`)
  }

  return data
}

export async function createEvidenceSheetDraft(params: {
  contractId: string
  rentAmount: number | null
  copyFromLatest?: boolean
  validFrom?: string | null
  validTo?: string | null
  contractValidTo?: string | null
}): Promise<EvidenceSheetRow> {
  logger.debug('createEvidenceSheetDraft', params)

  const { data: existingDraftRows, error: draftErr } = await supabase
    .from('contract_evidence_sheets')
    .select('id')
    .eq('contract_id', params.contractId)
    .eq('status', 'draft')
    .limit(1)

  if (draftErr) {
    logger.error('createEvidenceSheet check existing draft failed', draftErr)
    throw new Error(`Nepodařilo se ověřit existující koncept: ${draftErr.message}`)
  }

  if (existingDraftRows && existingDraftRows.length > 0) {
    throw new Error('Existuje již koncept evidenčního listu. Nejprve ho dokončete nebo smažte.')
  }

  const { data: latestRows, error: latestErr } = await supabase
    .from('contract_evidence_sheets')
    .select('id, sheet_number, valid_from, valid_to')
    .eq('contract_id', params.contractId)
    .order('sheet_number', { ascending: false })
    .limit(1)

  if (latestErr) {
    logger.error('createEvidenceSheet load latest failed', latestErr)
    throw new Error(`Nepodařilo se načíst poslední evidenční list: ${latestErr.message}`)
  }

  const latest = latestRows?.[0] ?? null
  const nextNumber = latest ? latest.sheet_number + 1 : 1
  const replaceNote = latest
    ? `Nahrazuje list č. ${latest.sheet_number}${latest.valid_from ? ` ze dne ${latest.valid_from}` : ''}`
    : null

  const validFrom = params.copyFromLatest ? params.validFrom ?? latest?.valid_from ?? null : params.validFrom ?? null
  const validTo = params.copyFromLatest ? params.validTo ?? latest?.valid_to ?? null : params.validTo ?? null

  // Server-side validation: validTo must not be later than contract end date
  if (params.contractValidTo && validTo && validTo > params.contractValidTo) {
    throw new Error(`Platný do nesmí být později než konec smlouvy ${params.contractValidTo}.`)
  }

  const { data: inserted, error: insertErr } = await supabase
    .from('contract_evidence_sheets')
    .insert({
      contract_id: params.contractId,
      sheet_number: nextNumber,
      valid_from: validFrom,
      valid_to: validTo,
      replaces_sheet_id: latest?.id ?? null,
      rent_amount: params.rentAmount,
      total_persons: 1,
      services_total: 0,
      total_amount: params.rentAmount ?? 0,
      notes: replaceNote,
      status: 'draft',
    })
    .select()
    .single()

  if (insertErr) {
    logger.error('createEvidenceSheet insert failed', insertErr)
    throw new Error(`Nepodařilo se vytvořit evidenční list: ${insertErr.message}`)
  }

  // Kopírování proběhne asynchronně na pozadí (bez await)
  if (params.copyFromLatest && latest?.id) {
    copyEvidenceSheetData(latest.id, inserted.id)
      .then(() => logger.debug('Background copy completed'))
      .catch((err) => logger.error('Background copy failed', err))
  }

  return inserted
}

export async function deleteEvidenceSheetDraft(sheetId: string): Promise<void> {
  logger.debug('deleteEvidenceSheetDraft', { sheetId })

  const sheet = await getEvidenceSheet(sheetId)
  if (!sheet) {
    throw new Error('Evidenční list nenalezen.')
  }

  if (sheet.status !== 'draft') {
    throw new Error('Lze smazat pouze koncept evidenčního listu.')
  }

  const { data: latestRows, error: latestErr } = await supabase
    .from('contract_evidence_sheets')
    .select('id, sheet_number')
    .eq('contract_id', sheet.contract_id)
    .order('sheet_number', { ascending: false })
    .limit(1)

  if (latestErr) {
    logger.error('deleteEvidenceSheetDraft load latest failed', latestErr)
    throw new Error(`Nepodařilo se ověřit poslední list: ${latestErr.message}`)
  }

  const latest = latestRows?.[0] ?? null
  if (!latest || latest.id !== sheetId) {
    throw new Error('Lze smazat pouze poslední koncept evidenčního listu.')
  }

  const { error: deleteErr } = await supabase
    .from('contract_evidence_sheets')
    .delete()
    .eq('id', sheetId)

  if (deleteErr) {
    logger.error('deleteEvidenceSheetDraft failed', deleteErr)
    throw new Error(`Nepodařilo se smazat evidenční list: ${deleteErr.message}`)
  }
}

async function copyEvidenceSheetData(fromSheetId: string, toSheetId: string) {
  logger.debug('copyEvidenceSheetData', { fromSheetId, toSheetId })

  try {
    const [users, services, sheet] = await Promise.all([
      listEvidenceSheetUsers(fromSheetId),
      listEvidenceSheetServices(fromSheetId),
      getEvidenceSheet(toSheetId),
    ])

    logger.debug('copyEvidenceSheetData loaded data', { usersCount: users.length, servicesCount: services.length })

    const totalPersons = 1 + users.length

    await setEvidenceSheetUsers(
      toSheetId,
      users
        .filter((u) => !!u.tenant_user_id)
        .map((u) => ({
          id: u.tenant_user_id as string,
          first_name: u.first_name ?? '',
          last_name: u.last_name ?? '',
          birth_date: u.birth_date ?? '',
          note: u.note ?? null,
        }))
    )

    logger.debug('copyEvidenceSheetData users set')

    const serviceIds = services.filter((s) => !!s.service_id).map((s) => s.service_id as string)
    const serviceUnitInfo = await loadServiceUnitInfo(serviceIds)
    const unitArea = sheet?.contract_id ? await getContractUnitArea(sheet.contract_id) : null

    const updatedServices = services.map((s, idx) => {
      const serviceInfo = s.service_id ? serviceUnitInfo[s.service_id] : null
      const unitName = serviceInfo?.unitName ?? null
      const billingTypeName = serviceInfo?.billingTypeName ?? null
      const quantity = resolveEvidenceSheetQuantity(
        s.quantity,
        totalPersons,
        unitArea,
        unitName,
        billingTypeName,
        s.unit_type
      )
      const total = resolveEvidenceSheetAmount(Number(s.unit_price), quantity)
      return {
        service_id: s.service_id ?? null,
        service_name: s.service_name,
        unit_type: s.unit_type,
        unit_price: Number(s.unit_price),
        quantity,
        total_amount: total,
        order_index: idx,
      }
    })

    await saveEvidenceSheetServices(toSheetId, updatedServices)

    logger.debug('copyEvidenceSheetData services set')

    if (sheet) {
      const servicesTotal = updatedServices.reduce((sum, s) => sum + s.total_amount, 0)
      const totalAmount = (sheet.rent_amount ?? 0) + servicesTotal
      await updateEvidenceSheet(toSheetId, {
        total_persons: totalPersons,
        services_total: servicesTotal,
        total_amount: totalAmount,
      })
    }

    logger.debug('copyEvidenceSheetData success')
  } catch (err: any) {
    logger.error('copyEvidenceSheetData failed', err)
    throw new Error(`Nepodařilo se zkopírovat data evidenčního listu: ${err?.message ?? 'neznámá chyba'}`)
  }
}

export async function updateEvidenceSheet(sheetId: string, patch: Partial<EvidenceSheetRow>): Promise<EvidenceSheetRow> {
  logger.debug('updateEvidenceSheet', { sheetId, patch })

  const { data, error } = await supabase
    .from('contract_evidence_sheets')
    .update(patch)
    .eq('id', sheetId)
    .select()
    .single()

  if (error) {
    logger.error('updateEvidenceSheet failed', error)
    throw new Error(`Nepodařilo se uložit evidenční list: ${error.message}`)
  }

  return data
}

export async function listEvidenceSheetUsers(sheetId: string): Promise<EvidenceSheetUserRow[]> {
  logger.debug('listEvidenceSheetUsers', { sheetId })

  const { data, error } = await supabase
    .from('contract_evidence_sheet_users')
    .select('*')
    .eq('sheet_id', sheetId)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('listEvidenceSheetUsers failed', error)
    throw new Error(`Nepodařilo se načíst osoby evidenčního listu: ${error.message}`)
  }

  return data || []
}

export async function setEvidenceSheetUsers(sheetId: string, users: EvidenceSheetUserInput[] | TenantUser[]): Promise<void> {
  logger.debug('setEvidenceSheetUsers', { sheetId, count: users.length })

  const { error: deleteErr } = await supabase
    .from('contract_evidence_sheet_users')
    .delete()
    .eq('sheet_id', sheetId)

  if (deleteErr) {
    logger.error('setEvidenceSheetUsers delete failed', deleteErr)
    throw new Error(`Nepodařilo se upravit osoby evidenčního listu: ${deleteErr.message}`)
  }

  if (users.length) {
    const payload = users.map((u) => ({
      sheet_id: sheetId,
      tenant_user_id: u.id,
      first_name: u.first_name,
      last_name: u.last_name,
      birth_date: u.birth_date || null,
      note: u.note ?? null,
    }))

    const { error: insertErr } = await supabase
      .from('contract_evidence_sheet_users')
      .insert(payload)

    if (insertErr) {
      logger.error('setEvidenceSheetUsers insert failed', insertErr)
      throw new Error(`Nepodařilo se uložit osoby evidenčního listu: ${insertErr.message}`)
    }
  }

  const totalPersons = 1 + users.length
  await updateEvidenceSheet(sheetId, { total_persons: totalPersons })
}

export async function listEvidenceSheetServices(sheetId: string): Promise<EvidenceSheetServiceRow[]> {
  logger.debug('listEvidenceSheetServices', { sheetId })

  const { data, error } = await supabase
    .from('contract_evidence_sheet_services')
    .select(
      `
        *,
        service:service_id(
          id,
          name,
          base_price,
          category:category_id(name, color),
          billing_type:billing_type_id(name, color),
          unit:unit_id(name),
          vat_rate:vat_rate_id(name)
        )
      `
    )
    .eq('sheet_id', sheetId)
    .order('order_index', { ascending: true })

  if (error) {
    logger.error('listEvidenceSheetServices failed', error)
    throw new Error(`Nepodařilo se načíst služby evidenčního listu: ${error.message}`)
  }

  return (data ?? []).map((row: any) => {
    const service = Array.isArray(row.service) ? row.service[0] : row.service
    const category = Array.isArray(service?.category) ? service?.category[0] : service?.category
    const billingType = Array.isArray(service?.billing_type) ? service?.billing_type[0] : service?.billing_type
    const unit = Array.isArray(service?.unit) ? service?.unit[0] : service?.unit
    const vatRate = Array.isArray(service?.vat_rate) ? service?.vat_rate[0] : service?.vat_rate

    return {
      ...row,
      service_id: row.service_id ?? service?.id ?? null,
      service_name: row.service_name ?? service?.name ?? '',
      catalog_base_price: service?.base_price ?? null,
      category_name: category?.name ?? null,
      category_color: category?.color ?? null,
      billing_type_name: billingType?.name ?? null,
      billing_type_color: billingType?.color ?? null,
      unit_name: unit?.name ?? null,
      vat_rate_name: vatRate?.name ?? null,
    } as EvidenceSheetServiceRow
  })
}

export async function saveEvidenceSheetServices(sheetId: string, services: EvidenceSheetServiceInput[]): Promise<void> {
  logger.debug('saveEvidenceSheetServices', { sheetId, count: services.length })

  const { error: deleteErr } = await supabase
    .from('contract_evidence_sheet_services')
    .delete()
    .eq('sheet_id', sheetId)

  if (deleteErr) {
    logger.error('saveEvidenceSheetServices delete failed', deleteErr)
    throw new Error(`Nepodařilo se uložit služby evidenčního listu: ${deleteErr.message}`)
  }

  if (services.length) {
    const sheet = await getEvidenceSheet(sheetId)
    const serviceIds = services.filter((s) => !!s.service_id).map((s) => s.service_id as string)
    const serviceUnitInfo = await loadServiceUnitInfo(serviceIds)
    const unitArea = sheet?.contract_id ? await getContractUnitArea(sheet.contract_id) : null

    const payload = services.map((s, idx) => {
      const serviceInfo = s.service_id ? serviceUnitInfo[s.service_id] : null
      const unitName = serviceInfo?.unitName ?? null
      const billingTypeName = serviceInfo?.billingTypeName ?? null
      const quantity = resolveEvidenceSheetQuantity(
        s.quantity,
        sheet?.total_persons ?? 1,
        unitArea,
        unitName,
        billingTypeName,
        s.unit_type
      )
      const total = resolveEvidenceSheetAmount(s.unit_price, quantity)

      return {
        sheet_id: sheetId,
        service_id: s.service_id ?? null,
        service_name: s.service_name,
        unit_type: s.unit_type,
        unit_price: s.unit_price,
        quantity,
        total_amount: total,
        order_index: s.order_index ?? idx,
        valid_from: s.valid_from ?? null,
        valid_to: s.valid_to ?? null,
      }
    })

    const { error: insertErr } = await supabase
      .from('contract_evidence_sheet_services')
      .insert(payload)

    if (insertErr) {
      logger.error('saveEvidenceSheetServices insert failed', insertErr)
      throw new Error(`Nepodařilo se uložit služby evidenčního listu: ${insertErr.message}`)
    }

    const servicesTotal = payload.reduce((sum, item) => sum + item.total_amount, 0)
    const updatedSheet = await getEvidenceSheet(sheetId)
    const totalAmount = (updatedSheet?.rent_amount ?? 0) + servicesTotal

    if (updatedSheet) {
      await updateEvidenceSheet(sheetId, { services_total: servicesTotal, total_amount: totalAmount })
    }
    return
  }

  const sheet = await getEvidenceSheet(sheetId)
  const servicesTotal = 0
  const totalAmount = (sheet?.rent_amount ?? 0) + servicesTotal

  if (sheet) {
    await updateEvidenceSheet(sheetId, { services_total: servicesTotal, total_amount: totalAmount })
  }
}

export async function setEvidenceSheetServiceArchived(id: string, isArchived: boolean): Promise<void> {
  logger.debug('setEvidenceSheetServiceArchived', { id, isArchived })

  const { error } = await supabase
    .from('contract_evidence_sheet_services')
    .update({ is_archived: isArchived })
    .eq('id', id)

  if (error) {
    logger.error('setEvidenceSheetServiceArchived failed', error)
    throw new Error(`Nepodařilo se archivovat službu: ${error.message}`)
  }
}

/**
 * Aktivuje evidence sheet (změní draft → active)
 * a zarchivuje předchozí aktivní verzi
 */
export async function activateEvidenceSheet(draftSheetId: string): Promise<EvidenceSheetRow> {
  logger.debug('activateEvidenceSheet', { draftSheetId })

  // 1. Načti draft sheet
  const draft = await getEvidenceSheet(draftSheetId)
  if (!draft) {
    throw new Error('Evidenční list nenalezen')
  }

  if (draft.status !== 'draft') {
    throw new Error(`Nemůžeš aktivovat list se stavem '${draft.status}' (pouze 'draft')`)
  }

  // 2. Najdi současný aktivní list (na stejné smlouvě)
  const { data: activeSheets, error: activeErr } = await supabase
    .from('contract_evidence_sheets')
    .select('id, valid_to')
    .eq('contract_id', draft.contract_id)
    .eq('status', 'active')
    .limit(1)

  if (activeErr) {
    logger.error('activateEvidenceSheet find active failed', activeErr)
    throw new Error(`Nepodařilo se najít aktivní list: ${activeErr.message}`)
  }

  // 3. Archivuj předchozí aktivní list (pokud existuje) a uprav jeho platnost
  if (activeSheets && activeSheets.length > 0) {
    const previous = activeSheets[0]
    const archivePatch: Record<string, string | null> = { status: 'archived' }

    if (draft.valid_from) {
      const adjustedValidTo = previous.valid_to && previous.valid_to >= draft.valid_from ? subtractOneDay(draft.valid_from) : null
      if (adjustedValidTo) {
        archivePatch.valid_to = adjustedValidTo
      }
    }

    const { error: archiveErr } = await supabase
      .from('contract_evidence_sheets')
      .update(archivePatch)
      .eq('id', previous.id)

    if (archiveErr) {
      logger.error('activateEvidenceSheet archive previous failed', archiveErr)
      throw new Error(`Nepodařilo se archivovat starý list: ${archiveErr.message}`)
    }
  }

  // 4. Aktivuj nový draft
  const { data: activated, error: activateErr } = await supabase
    .from('contract_evidence_sheets')
    .update({ status: 'active' })
    .eq('id', draftSheetId)
    .select()
    .single()

  if (activateErr) {
    logger.error('activateEvidenceSheet update draft failed', activateErr)
    throw new Error(`Nepodařilo se aktivovat list: ${activateErr.message}`)
  }

  logger.debug('activateEvidenceSheet success', { sheetId: draftSheetId })
  return activated
}
