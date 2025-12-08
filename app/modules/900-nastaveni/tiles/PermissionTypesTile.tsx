/*
 * FILE: app/modules/900-nastaveni/tiles/PermissionTypesTile.tsx
 * PURPOSE: Wrapper kolem GenericTypeTile pro tabulku permission_types
 */

'use client'

import GenericTypeTile, {
  GenericTypeItem,
} from '@/app/UI/GenericTypeTile'

import type {
  PermissionTypeRow,
  PermissionTypePayload,
} from '../services/permissionTypes'

import {
  fetchPermissionTypes,
  createPermissionType,
  updatePermissionType,
} from '../services/permissionTypes'

/**
 * Mapování z DB → Generic item
 */
function mapRowToGeneric(row: PermissionTypeRow): GenericTypeItem {
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
function mapGenericToPayload(input: GenericTypeItem): PermissionTypePayload {
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

export default function PermissionTypesTile() {
  return (
    <GenericTypeTile
      title="Typy oprávnění"
      description="Definice typů oprávnění v systému (čtení, řízení, finance…)."

      fetchItems={async () => {
        const rows = await fetchPermissionTypes()
        return rows.map(mapRowToGeneric)
      }}

      createItem={async (input) => {
        const payload = mapGenericToPayload(input)
        const created = await createPermissionType(input.code, payload)
        return mapRowToGeneric(created)
      }}

      updateItem={async (codeKey, input) => {
        const payload = mapGenericToPayload(input)
        const updated = await updatePermissionType(codeKey, payload)
        return mapRowToGeneric(updated)
      }}
    />
  )
}
