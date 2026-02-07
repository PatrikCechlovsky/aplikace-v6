/*
 * FILE: app/modules/900-nastaveni/tiles/RoomTypesTile.tsx
 * PURPOSE: Wrapper kolem GenericTypeTile pro kategorii room_types
 */

'use client'

import GenericTypeTile, {
  GenericTypeItem,
} from '@/app/UI/GenericTypeTile'

import type {
  GenericTypeRow,
  GenericTypePayload,
} from '../services/genericTypes'

import {
  listByCategory,
  create,
  update,
} from '../services/genericTypes'

/**
 * Mapování z DB řádku (GenericTypeRow) na generický typový záznam
 * používaný GenericTypeTile.
 */
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

/**
 * Mapování z GenericTypeItem (formulář) na payload pro service.
 */
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

export default function RoomTypesTile() {
  return (
    <GenericTypeTile
      title="Typy místností"
      description="Číselník typů místností (kuchyně, koupelna, ložnice, obývací pokoj…). Používá se v equipment_catalog pro určení, do které místnosti vybavení patří."

      // načtení seznamu – Supabase service
      fetchItems={async () => {
        const rows = await listByCategory('room_types')
        return rows.map(mapRowToGeneric)
      }}

      // vytvoření nového záznamu
      createItem={async (input) => {
        const payload = mapGenericToPayload(input)
        const created = await create('room_types', input.code, payload)
        return mapRowToGeneric(created)
      }}

      // update existujícího záznamu
      updateItem={async (codeKey, input) => {
        const payload = mapGenericToPayload(input)
        const updated = await update('room_types', codeKey, payload)
        return mapRowToGeneric(updated)
      }}
    />
  )
}
