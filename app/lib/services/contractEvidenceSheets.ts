// FILE: app/lib/services/contractEvidenceSheets.ts
// PURPOSE: Service layer pro evidenční listy smluv (přílohy služeb)
// NOTES: Pracuje s contract_evidence_sheets + users + services

import { supabase } from '../supabaseClient'
import createLogger from '../logger'
import type { TenantUser } from './tenantUsers'

const logger = createLogger('contractEvidenceSheets.service')

export type EvidenceSheetRow = {
  id: string
  contract_id: string
  sheet_number: number
  valid_from: string
  valid_to: string | null
  replaces_sheet_id: string | null
  rent_amount: number | null
  total_persons: number
  services_total: number
  total_amount: number
  description: string | null
  notes: string | null
  pdf_document_id: string | null
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
  service_name: string
  unit_type: 'flat' | 'person'
  unit_price: number
  quantity: number
  total_amount: number
  order_index: number
  is_archived: boolean
  created_at: string
  updated_at: string
}

export type EvidenceSheetServiceInput = {
  service_name: string
  unit_type: 'flat' | 'person'
  unit_price: number
  quantity: number
  total_amount: number
  order_index?: number
}

export type EvidenceSheetUserInput = {
  id: string
  first_name: string
  last_name: string
  birth_date: string
  note?: string | null
}

function dateToISODate(d: Date): string {
  return d.toISOString().split('T')[0]
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

export async function createEvidenceSheet(params: {
  contractId: string
  validFrom: string
  rentAmount: number | null
  copyFromLatest?: boolean
}): Promise<EvidenceSheetRow> {
  logger.debug('createEvidenceSheet', params)

  const { data: latestRows, error: latestErr } = await supabase
    .from('contract_evidence_sheets')
    .select('id, sheet_number, valid_to')
    .eq('contract_id', params.contractId)
    .order('sheet_number', { ascending: false })
    .limit(1)

  if (latestErr) {
    logger.error('createEvidenceSheet load latest failed', latestErr)
    throw new Error(`Nepodařilo se načíst poslední evidenční list: ${latestErr.message}`)
  }

  const latest = latestRows?.[0] ?? null
  const nextNumber = latest ? latest.sheet_number + 1 : 1

  const { data: inserted, error: insertErr } = await supabase
    .from('contract_evidence_sheets')
    .insert({
      contract_id: params.contractId,
      sheet_number: nextNumber,
      valid_from: params.validFrom,
      valid_to: null,
      replaces_sheet_id: latest?.id ?? null,
      rent_amount: params.rentAmount,
      total_persons: 1,
      services_total: 0,
      total_amount: params.rentAmount ?? 0,
    })
    .select()
    .single()

  if (insertErr) {
    logger.error('createEvidenceSheet insert failed', insertErr)
    throw new Error(`Nepodařilo se vytvořit evidenční list: ${insertErr.message}`)
  }

  if (latest?.id) {
    const prevEnd = new Date(params.validFrom)
    prevEnd.setDate(prevEnd.getDate() - 1)
    const prevEndDate = dateToISODate(prevEnd)

    const { error: updatePrevErr } = await supabase
      .from('contract_evidence_sheets')
      .update({ valid_to: prevEndDate })
      .eq('id', latest.id)

    if (updatePrevErr) {
      logger.error('createEvidenceSheet update previous failed', updatePrevErr)
      throw new Error(`Nepodařilo se ukončit předchozí evidenční list: ${updatePrevErr.message}`)
    }
  }

  if (params.copyFromLatest && latest?.id) {
    await copyEvidenceSheetData(latest.id, inserted.id)
  }

  return inserted
}

async function copyEvidenceSheetData(fromSheetId: string, toSheetId: string) {
  const [users, services, sheet] = await Promise.all([
    listEvidenceSheetUsers(fromSheetId),
    listEvidenceSheetServices(fromSheetId),
    getEvidenceSheet(toSheetId),
  ])

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

  const updatedServices = services.map((s, idx) => {
    const quantity = s.unit_type === 'person' ? totalPersons : s.quantity
    const total = Number(s.unit_price) * quantity
    return {
      service_name: s.service_name,
      unit_type: s.unit_type,
      unit_price: Number(s.unit_price),
      quantity,
      total_amount: total,
      order_index: idx,
    }
  })

  await saveEvidenceSheetServices(toSheetId, updatedServices)

  if (sheet) {
    const servicesTotal = updatedServices.reduce((sum, s) => sum + s.total_amount, 0)
    const totalAmount = (sheet.rent_amount ?? 0) + servicesTotal
    await updateEvidenceSheet(toSheetId, {
      total_persons: totalPersons,
      services_total: servicesTotal,
      total_amount: totalAmount,
    })
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
    .select('*')
    .eq('sheet_id', sheetId)
    .eq('is_archived', false)
    .order('order_index', { ascending: true })

  if (error) {
    logger.error('listEvidenceSheetServices failed', error)
    throw new Error(`Nepodařilo se načíst služby evidenčního listu: ${error.message}`)
  }

  return data || []
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
    const payload = services.map((s, idx) => ({
      sheet_id: sheetId,
      service_name: s.service_name,
      unit_type: s.unit_type,
      unit_price: s.unit_price,
      quantity: s.quantity,
      total_amount: s.total_amount,
      order_index: s.order_index ?? idx,
    }))

    const { error: insertErr } = await supabase
      .from('contract_evidence_sheet_services')
      .insert(payload)

    if (insertErr) {
      logger.error('saveEvidenceSheetServices insert failed', insertErr)
      throw new Error(`Nepodařilo se uložit služby evidenčního listu: ${insertErr.message}`)
    }
  }

  const sheet = await getEvidenceSheet(sheetId)
  const servicesTotal = services.reduce((sum, s) => sum + (s.total_amount || 0), 0)
  const totalAmount = (sheet?.rent_amount ?? 0) + servicesTotal

  if (sheet) {
    await updateEvidenceSheet(sheetId, { services_total: servicesTotal, total_amount: totalAmount })
  }
}
