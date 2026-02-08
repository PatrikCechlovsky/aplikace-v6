// FILE: app/modules/900-nastaveni/tiles/VatRatesTile.tsx
// PURPOSE: UI pro správu sazeb DPH (vat_rates) přes generic_types
// NOTES: Wrapper kolem GenericTypeTile pro kategorii 'vat_rates'

'use client'

import GenericTypeTile, { GenericTypeItem } from '@/app/UI/GenericTypeTile'
import type { GenericTypeRow, GenericTypePayload } from '../services/genericTypes'
import { listByCategory, create, update } from '../services/genericTypes'

function mapRowToGeneric(row: GenericTypeRow): GenericTypeItem {
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

function mapGenericToPayload(input: GenericTypeItem): GenericTypePayload {
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

export default function VatRatesTile() {
  return (
    <GenericTypeTile
      title="DPH sazby"
      description="Číselník sazeb DPH (0 %, 10 %, 12 %, 15 %, 21 %)."
      fetchItems={async () => {
        const rows = await listByCategory('vat_rates')
        return rows.map(mapRowToGeneric)
      }}
      createItem={async (input) => {
        const payload = mapGenericToPayload(input)
        const created = await create('vat_rates', input.code, payload)
        return mapRowToGeneric(created)
      }}
      updateItem={async (codeKey, input) => {
        const payload = mapGenericToPayload(input)
        const updated = await update('vat_rates', codeKey, payload)
        return mapRowToGeneric(updated)
      }}
    />
  )
}
