/*
 * FILE: app/modules/900-nastaveni/services/paymentTypes.ts
 * PURPOSE: CRUD funkce pro číselník public.payment_types (napojení na Supabase)
 *
 * Struktura tabulky:
 *  - code        (text, PK / UNIQUE)
 *  - name        (text)
 *  - description (text, nullable)
 *  - color       (text, nullable)
 *  - icon        (text, nullable)
 *  - order_index (integer, nullable)
 *  - active      (boolean, default true)
 */

import { supabase } from '@/app/lib/supabaseClient'

const SELECT_FIELDS = 'code, name, description, color, icon, order_index, active'

function normalizeOrderIndex(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

function normalizeText(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s ? s : null
}

export type PaymentTypeRow = {
  code: string
  name: string
  description: string | null
  color: string | null
  icon: string | null
  order_index: number | null
  active: boolean | null
}

export type PaymentTypePayload = {
  name: string
  description?: string | null
  color?: string | null
  icon?: string | null
  order_index?: number | null
  active?: boolean | null
}

/**
 * Načte všechny typy plateb.
 */
export async function fetchPaymentTypes(): Promise<PaymentTypeRow[]> {
  const { data, error } = await supabase
    .from('payment_types')
    .select(SELECT_FIELDS)
    .order('order_index', { ascending: true, nullsFirst: true })
    .order('code', { ascending: true })

  if (error) {
    console.error('fetchPaymentTypes error', error)
    throw error
  }

  return (data ?? []) as PaymentTypeRow[]
}

/**
 * Vytvoří nový typ platby.
 */
export async function createPaymentType(
  code: string,
  payload: PaymentTypePayload,
): Promise<PaymentTypeRow> {
  const trimmedCode = code.trim()

  if (!trimmedCode) {
    throw new Error('Kód typu platby nesmí být prázdný')
  }

  const insertPayload = {
    code: trimmedCode,
    name: payload.name.trim(),
    description: normalizeText(payload.description),
    color: normalizeText(payload.color),
    icon: normalizeText(payload.icon),
    order_index: normalizeOrderIndex(payload.order_index),
    active: payload.active ?? true,
  }

  const { data, error } = await supabase
    .from('payment_types')
    .insert(insertPayload)
    .select(SELECT_FIELDS)
    .maybeSingle()

  if (error) {
    console.error('createPaymentType error', error)
    throw error
  }

  if (!data) {
    const { data: fetched, error: fetchErr } = await supabase
      .from('payment_types')
      .select(SELECT_FIELDS)
      .eq('code', trimmedCode)
      .maybeSingle()

    if (fetchErr) {
      console.warn('createPaymentType: insert ok, but cannot fetch row (RLS?)', fetchErr)
    }

    return (fetched ?? insertPayload) as PaymentTypeRow
  }

  return data as PaymentTypeRow
}

/**
 * Aktualizuje existující typ platby podle codeKey.
 */
export async function updatePaymentType(
  codeKey: string,
  payload: PaymentTypePayload,
): Promise<PaymentTypeRow> {
  const trimmedKey = codeKey.trim()

  if (!trimmedKey) {
    throw new Error('Chybí "code" pro update typu platby')
  }

  const updatePayload = {
    name: payload.name.trim(),
    description: normalizeText(payload.description),
    color: normalizeText(payload.color),
    icon: normalizeText(payload.icon),
    order_index: normalizeOrderIndex(payload.order_index),
    active: payload.active ?? true,
  }

  const { data, error } = await supabase
    .from('payment_types')
    .update(updatePayload)
    .eq('code', trimmedKey)
    .select(SELECT_FIELDS)
    .maybeSingle()

  if (error) {
    console.error('updatePaymentType error', error)
    throw error
  }

  if (!data) {
    const { data: fetched, error: fetchErr } = await supabase
      .from('payment_types')
      .select(SELECT_FIELDS)
      .eq('code', trimmedKey)
      .maybeSingle()

    if (fetchErr) {
      console.warn('updatePaymentType: update ok/unknown, but cannot fetch row (RLS?)', fetchErr)
    }

    return (fetched ?? { code: trimmedKey, ...(updatePayload as any) }) as PaymentTypeRow
  }

  return data as PaymentTypeRow
}

/**
 * Mazání – připravené do budoucna.
 */
export async function deletePaymentType(codeKey: string): Promise<void> {
  const trimmedKey = codeKey.trim()

  const { error } = await supabase
    .from('payment_types')
    .delete()
    .eq('code', trimmedKey)

  if (error) {
    console.error('deletePaymentType error', error)
    throw error
  }
}
