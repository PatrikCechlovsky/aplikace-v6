/*
 * FILE: app/modules/900-nastaveni/tiles/RoleTypesTile.tsx
 * PURPOSE: Wrapper kolem GenericTypeTile pro tabulku role_types
 */

'use client'

import GenericTypeTile, {
  GenericTypeItem,
} from '@/app/UI/GenericTypeTile'

import type {
  RoleTypeRow,
  RoleTypePayload,
} from '../services/roleTypes'

import {
  fetchRoleTypes,
  createRoleType,
  updateRoleType,
} from '../services/roleTypes'

/**
 * Mapování z DB řádku (RoleTypeRow) na generický typový záznam
 * používaný GenericTypeTile.
 */
function mapRowToGeneric(row: RoleTypeRow): GenericTypeItem {
  return {
    code: row.code,
    name: row.name,
    description: row.description ?? null,
    color: row.color ?? null,
    icon: row.icon ?? null,
    // v DB máš order_index → v UI používáme sort_order
    sort_order: row.order_index ?? null,
    // sloupec active zatím v role_types není → v UI vždy true
    active: true,
  }
}

/**
 * Mapování z GenericTypeItem (formulář) na payload pro service.
 * `code` se předává zvlášť jako parametr funkce.
 */
function mapGenericToPayload(input: GenericTypeItem): RoleTypePayload {
  return {
    name: input.name,
    description: input.description ?? null,
    color: input.color ?? null,
    icon: input.icon ?? null,
    // zpátky do DB ukládáme order_index
    order_index:
      typeof input.sort_order === 'number' && !Number.isNaN(input.sort_order)
        ? input.sort_order
        : null,
  }
}

export default function RoleTypesTile() {
  return (
    <GenericTypeTile
      title="Typy rolí"
      description="Číselník typů rolí uživatelů (administrátor, pronajímatel, nájemník, údržba…)."

      // načtení seznamu – Supabase service
      fetchItems={async () => {
        const rows = await fetchRoleTypes()
        return rows.map(mapRowToGeneric)
      }}

      // vytvoření nového záznamu
      createItem={async (input) => {
        const payload = mapGenericToPayload(input)
        const created = await createRoleType(input.code, payload)
        return mapRowToGeneric(created)
      }}

      // update existujícího záznamu
      updateItem={async (codeKey, input) => {
        const payload = mapGenericToPayload(input)
        const updated = await updateRoleType(codeKey, payload)
        return mapRowToGeneric(updated)
      }}
    />
  )
}
