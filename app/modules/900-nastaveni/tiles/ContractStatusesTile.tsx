// FILE: app/modules/900-nastaveni/tiles/ContractStatusesTile.tsx
// PURPOSE: UI pro správu stavů smluv (contract_statuses) přes generic_types
// NOTES: Wrapper kolem GenericTypeTile pro kategorii 'contract_statuses'

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

export default function ContractStatusesTile() {
  return (
    <GenericTypeTile
      title="Stavy smluv"
      description="Číselník stavů smluv (koncept, aktivní, ukončená, archivovaná)."
      fetchItems={async () => {
        const rows = await listByCategory('contract_statuses')
        return rows.map(mapRowToGeneric)
      }}
      createItem={async (input) => {
        const payload = mapGenericToPayload(input)
        const created = await create('contract_statuses', input.code, payload)
        return mapRowToGeneric(created)
      }}
      updateItem={async (codeKey, input) => {
        const payload = mapGenericToPayload(input)
        const updated = await update('contract_statuses', codeKey, payload)
        return mapRowToGeneric(updated)
      }}
    />
  )
}
