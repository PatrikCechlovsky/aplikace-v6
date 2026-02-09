// FILE: app/modules/900-nastaveni/tiles/HandoverProtocolTypesTile.tsx
// PURPOSE: UI pro správu typů předávacích protokolů (handover_protocol_types) přes generic_types
// NOTES: Wrapper kolem GenericTypeTile pro kategorii 'handover_protocol_types'

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

export default function HandoverProtocolTypesTile() {
  return (
    <GenericTypeTile
      title="Typy předávacích protokolů"
      description="Číselník typů protokolů (předání, převzetí, ukončení nájmu)."
      fetchItems={async () => {
        const rows = await listByCategory('handover_protocol_types')
        return rows.map(mapRowToGeneric)
      }}
      createItem={async (input) => {
        const payload = mapGenericToPayload(input)
        const created = await create('handover_protocol_types', input.code, payload)
        return mapRowToGeneric(created)
      }}
      updateItem={async (codeKey, input) => {
        const payload = mapGenericToPayload(input)
        const updated = await update('handover_protocol_types', codeKey, payload)
        return mapRowToGeneric(updated)
      }}
    />
  )
}
