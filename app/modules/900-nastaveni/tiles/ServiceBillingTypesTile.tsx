// FILE: app/modules/900-nastaveni/tiles/ServiceBillingTypesTile.tsx
// PURPOSE: UI pro správu typů účtování služeb (service_billing_types) přes generic_types
// NOTES: Wrapper kolem GenericTypeTile pro kategorii 'service_billing_types'

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

export default function ServiceBillingTypesTile() {
  return (
    <GenericTypeTile
      title="Typy účtování služeb"
      description="Číselník typů účtování (pevná sazba, měřená spotřeba, na počet osob, na m², procento z nájmu, poměr plochy)."
      fetchItems={async () => {
        const rows = await listByCategory('service_billing_types')
        return rows.map(mapRowToGeneric)
      }}
      createItem={async (input) => {
        const payload = mapGenericToPayload(input)
        const created = await create('service_billing_types', input.code, payload)
        return mapRowToGeneric(created)
      }}
      updateItem={async (codeKey, input) => {
        const payload = mapGenericToPayload(input)
        const updated = await update('service_billing_types', codeKey, payload)
        return mapRowToGeneric(updated)
      }}
    />
  )
}
