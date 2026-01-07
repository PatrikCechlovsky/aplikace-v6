// FILE: app/lib/services/bankAccounts.ts
// PURPOSE: Service pro bankovní účty

import { supabase } from '@/app/lib/supabaseClient'
import createLogger from '@/app/lib/logger'

const logger = createLogger('bankAccounts')

export type BankAccountRow = {
  id: string
  subject_id: string
  label: string | null
  bank_id: string | null
  account_number: string | null
  iban: string | null
  swift: string | null
  note: string | null
  is_archived: boolean | null
  created_at: string | null
  updated_at: string | null
}

export type BankAccountWithBank = BankAccountRow & {
  bank_code?: string | null
  bank_name?: string | null
}

export type SaveBankAccountInput = {
  id?: string | null
  subjectId: string
  label?: string | null
  bankId?: string | null
  accountNumber?: string | null
  iban?: string | null
  swift?: string | null
  note?: string | null
  isArchived?: boolean | null
}

/**
 * Načte všechny účty pro daný subjekt (včetně archivovaných)
 */
export async function listBankAccounts(subjectId: string): Promise<BankAccountWithBank[]> {
  const { data, error } = await supabase
    .from('bank_accounts')
    .select(
      `
      id,
      subject_id,
      label,
      bank_id,
      account_number,
      iban,
      swift,
      note,
      is_archived,
      created_at,
      updated_at,
      bank_list:bank_id (
        bank_code,
        bank_name
      )
    `
    )
    .eq('subject_id', subjectId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)

  return (data ?? []).map((row: any) => ({
    id: row.id,
    subject_id: row.subject_id,
    label: row.label,
    bank_id: row.bank_id,
    account_number: row.account_number,
    iban: row.iban,
    swift: row.swift,
    note: row.note,
    is_archived: row.is_archived ?? false,
    created_at: row.created_at,
    updated_at: row.updated_at,
    bank_code: row.bank_list?.bank_code ?? null,
    bank_name: row.bank_list?.bank_name ?? null,
  }))
}

/**
 * Uloží nebo aktualizuje bankovní účet
 */
export async function saveBankAccount(input: SaveBankAccountInput): Promise<BankAccountRow> {
  const isNew = !input.id || input.id === 'new'

  // Debug: Získat aktuální session pro logování
  const { data: sessionData } = await supabase.auth.getSession()
  const currentUserId = sessionData?.session?.user?.id ?? null
  const currentUserEmail = sessionData?.session?.user?.email ?? null

  // Debug: Zkontrolovat subject pro RLS
  const { data: subjectData } = await supabase
    .from('subjects')
    .select('id, email, auth_user_id')
    .eq('id', input.subjectId)
    .single()

  logger.debug('saveBankAccount - Debug info', {
    isNew,
    subjectId: input.subjectId,
    currentUserId,
    currentUserEmail,
    subjectData: subjectData
      ? {
          id: subjectData.id,
          email: subjectData.email,
          auth_user_id: (subjectData as any).auth_user_id,
        }
      : null,
    payload,
  })

  const payload: any = {
    subject_id: input.subjectId,
    label: (input.label ?? '').trim() || null,
    bank_id: input.bankId || null,
    account_number: (input.accountNumber ?? '').trim() || null,
    iban: (input.iban ?? '').trim() || null,
    swift: (input.swift ?? '').trim() || null,
    note: (input.note ?? '').trim() || null,
    is_archived: input.isArchived ?? false,
  }

  if (isNew) {
    const { data, error } = await supabase
      .from('bank_accounts')
      .insert(payload)
      .select()
      .single()

    if (error) {
      logger.error('saveBankAccount - INSERT error', { error, payload, subjectId: input.subjectId })
      throw new Error(error.message)
    }
    if (!data) throw new Error('Nepodařilo se vytvořit účet.')

    return data as BankAccountRow
  } else {
    const { data, error } = await supabase
      .from('bank_accounts')
      .update(payload)
      .eq('id', input.id)
      .select()
      .single()

    if (error) {
      logger.error('saveBankAccount - UPDATE error', { error, payload, accountId: input.id })
      throw new Error(error.message)
    }
    if (!data) throw new Error('Nepodařilo se aktualizovat účet.')

    return data as BankAccountRow
  }
}

/**
 * Načte seznam bank z číselníku (modul 900)
 */
export async function listBanks(): Promise<Array<{ id: string; bank_code: string; bank_name: string; swift: string | null }>> {
  const { data, error } = await supabase
    .from('bank_list')
    .select('id, bank_code, bank_name, swift')
    .order('bank_code', { ascending: true })

  if (error) throw new Error(error.message)

  return (data ?? []) as Array<{ id: string; bank_code: string; bank_name: string; swift: string | null }>
}

