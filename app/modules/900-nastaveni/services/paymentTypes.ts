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
    .select('code, name, description, color, icon, order_index, active')
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
    description: payload.description?.trim() || null,
    color: payload.color?.trim() || null,
    icon: payload.icon?.trim() || null,
    order_index:
      typeof payload.order_index === 'number' && !Number.isNaN(payload.order_index)
        ? payload.order_index
        : null,
    active: payload.active ?? true,
  }

  const { data, error } = await supabase
    .from('payment_types')
    .insert(insertPayload)
    .select('code, name, description, color, icon, order_index, active')
    .single()

  if (error) {
    console.error('createPaymentType error', error)
    throw error
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
    description: payload.description?.trim() || null,
    color: payload.color?.trim() || null,
    icon: payload.icon?.trim() || null,
    order_index:
      typeof payload.order_index === 'number' && !Number.isNaN(payload.order_index)
        ? payload.order_index
        : null,
    active: payload.active ?? true,
  }

  const { data, error } = await supabase
    .from('payment_types')
    .update(updatePayload)
    .eq('code', trimmedKey)
    .select('code, name, description, color, icon, order_index, active')
    .single()

  if (error) {
    console.error('updatePaymentType error', error)
    throw error
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
