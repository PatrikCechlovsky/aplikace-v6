/*
 * FILE: app/modules/900-nastaveni/tiles/PaymentTypesTile.tsx
 * PURPOSE: Wrapper kolem GenericTypeTile pro tabulku payment_types
 */

'use client'

import GenericTypeTile, {
  GenericTypeItem,
} from '@/app/UI/GenericTypeTile'

import type {
  PaymentTypeRow,
  PaymentTypePayload,
} from '../services/paymentTypes'

import {
  fetchPaymentTypes,
  createPaymentType,
  updatePaymentType,
} from '../services/paymentTypes'

/**
 * Mapování z DB → Generic item
 */
function mapRowToGeneric(row: PaymentTypeRow): GenericTypeItem {
  return {
    code: row.code,
    name: row.name,
    description: row.description ?? null,
    color: row.color ?? null,
    icon: row.icon ?? null,
    sort_order: row.order_index ?? null,
    active: row.active ?? true,
  }
}

/**
 * Mapování z Generic item → payload do DB
 */
function mapGenericToPayload(input: GenericTypeItem): PaymentTypePayload {
  return {
    name: input.name,
    description: input.description ?? null,
    color: input.color ?? null,
    icon: input.icon ?? null,
    order_index:
      typeof input.sort_order === 'number' && !Number.isNaN(input.sort_order)
        ? input.sort_order
        : null,
    active: input.active ?? true,
  }
}

export default function PaymentTypesTile() {
  return (
    <GenericTypeTile
      title="Typy plateb"
      description="Číselník typů plateb (příchozí / odchozí, plánovaná, pravidelná, neplánovaná…)."

      fetchItems={async () => {
        const rows = await fetchPaymentTypes()
        return rows.map(mapRowToGeneric)
      }}

      createItem={async (input) => {
        const payload = mapGenericToPayload(input)
        const created = await createPaymentType(input.code, payload)
        return mapRowToGeneric(created)
      }}

      updateItem={async (codeKey, input) => {
        const payload = mapGenericToPayload(input)
        const updated = await updatePaymentType(codeKey, payload)
        return mapRowToGeneric(updated)
      }}
    />
  )
}
