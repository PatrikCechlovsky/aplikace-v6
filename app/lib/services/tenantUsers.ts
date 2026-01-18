// FILE: app/lib/services/tenantUsers.ts
// PURPOSE: Service pro správu uživatelů nájemního vztahu (spolubydlící, spoluuživatelé)
// NOTES: CRUD operace pro tenant_users tabulku

import { supabase } from '../supabaseClient'
import createLogger from '../logger'

const logger = createLogger('tenantUsers.service')

export type TenantUser = {
  id: string
  tenant_id: string
  first_name: string
  last_name: string
  birth_date: string
  note: string | null
  is_archived: boolean
  created_at: string
  updated_at: string
  created_by: string | null
}

export type TenantUserFormData = {
  first_name: string
  last_name: string
  birth_date: string
  note?: string | null
}

/**
 * Načíst všechny uživatele pro daného nájemníka
 */
export async function listTenantUsers(tenantId: string, includeArchived: boolean = false): Promise<TenantUser[]> {
  logger.debug('listTenantUsers', { tenantId, includeArchived })

  let query = supabase
    .from('tenant_users')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (!includeArchived) {
    query = query.eq('is_archived', false)
  }

  const { data, error } = await query

  if (error) {
    logger.error('listTenantUsers failed', error)
    throw new Error(`Nepodařilo se načíst uživatele: ${error.message}`)
  }

  return data || []
}

/**
 * Načíst detail jednoho uživatele
 */
export async function getTenantUserDetail(userId: string): Promise<TenantUser | null> {
  logger.debug('getTenantUserDetail', { userId })

  const { data, error } = await supabase
    .from('tenant_users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    logger.error('getTenantUserDetail failed', error)
    throw new Error(`Nepodařilo se načíst uživatele: ${error.message}`)
  }

  return data
}

/**
 * Vytvořit nového uživatele
 */
export async function createTenantUser(tenantId: string, data: TenantUserFormData): Promise<TenantUser> {
  logger.debug('createTenantUser', { tenantId, data })

  const { data: result, error } = await supabase
    .from('tenant_users')
    .insert({
      tenant_id: tenantId,
      first_name: data.first_name,
      last_name: data.last_name,
      birth_date: data.birth_date,
      note: data.note || null,
    })
    .select()
    .single()

  if (error) {
    logger.error('createTenantUser failed', error)
    throw new Error(`Nepodařilo se vytvořit uživatele: ${error.message}`)
  }

  return result
}

/**
 * Aktualizovat uživatele
 */
export async function updateTenantUser(userId: string, data: TenantUserFormData): Promise<TenantUser> {
  logger.debug('updateTenantUser', { userId, data })

  const { data: result, error } = await supabase
    .from('tenant_users')
    .update({
      first_name: data.first_name,
      last_name: data.last_name,
      birth_date: data.birth_date,
      note: data.note || null,
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    logger.error('updateTenantUser failed', error)
    throw new Error(`Nepodařilo se aktualizovat uživatele: ${error.message}`)
  }

  return result
}

/**
 * Archivovat uživatele (soft delete)
 */
export async function archiveTenantUser(userId: string): Promise<void> {
  logger.debug('archiveTenantUser', { userId })

  const { error } = await supabase
    .from('tenant_users')
    .update({ is_archived: true })
    .eq('id', userId)

  if (error) {
    logger.error('archiveTenantUser failed', error)
    throw new Error(`Nepodařilo se archivovat uživatele: ${error.message}`)
  }
}

/**
 * Obnovit archivovaného uživatele
 */
export async function unarchiveTenantUser(userId: string): Promise<void> {
  logger.debug('unarchiveTenantUser', { userId })

  const { error } = await supabase
    .from('tenant_users')
    .update({ is_archived: false })
    .eq('id', userId)

  if (error) {
    logger.error('unarchiveTenantUser failed', error)
    throw new Error(`Nepodařilo se obnovit uživatele: ${error.message}`)
  }
}

/**
 * Smazat uživatele (hard delete - pouze pro admin)
 */
export async function deleteTenantUser(userId: string): Promise<void> {
  logger.debug('deleteTenantUser', { userId })

  const { error } = await supabase
    .from('tenant_users')
    .delete()
    .eq('id', userId)

  if (error) {
    logger.error('deleteTenantUser failed', error)
    throw new Error(`Nepodařilo se smazat uživatele: ${error.message}`)
  }
}
