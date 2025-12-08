/*
 * FILE: app/modules/900-nastaveni/tiles/UnitTypesTile.tsx
 * PURPOSE: Wrapper kolem GenericTypeTile pro tabulku unit_types
 */

'use client'

import GenericTypeTile, {
  GenericTypeItem,
} from '@/app/UI/GenericTypeTile'

import type {
  UnitTypeRow,
  UnitTypePayload,
} from '../services/unitTypes'

import {
  fetchUnitTypes,
  createUnitType,
  updateUnitType,
} from '../services/unitTypes'

/**
 * Mapování z DB řádku (UnitTypeRow) na generický typový záznam
 * používaný GenericTypeTile.
 */
function mapRowToGeneric(row: UnitTypeRow): GenericTypeItem {
  return {
    code: row.code,
    name: row.name,
    description: row.description ?? null,
    color: row.color ?? null,
    icon: row.icon ?? null,
    // v DB máš order_index → v UI používáme sort_order
    sort_order: row.order_index ?? null,
    // sloupec active v unit_types zatím nemáš → v UI vždy true
    active: true,
  }
}

/**
 * Mapování z GenericTypeItem (formulář) na payload pro service.
 * `code` se předává zvlášť jako parametr funkce.
 */
function mapGenericToPayload(input: GenericTypeItem): UnitTypePayload {
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

export default function UnitTypesTile() {
  return (
    <GenericTypeTile
      title="Typy jednotek"
      description="Číselník typů jednotek (byt, kancelář, garáž, sklad, zahrada…)."

      // načtení seznamu – Supabase service
      fetchItems={async () => {
        const rows = await fetchUnitTypes()
        return rows.map(mapRowToGeneric)
      }}

      // vytvoření nového záznamu
      createItem={async (input) => {
        const payload = mapGenericToPayload(input)
        const created = await createUnitType(input.code, payload)
        return mapRowToGeneric(created)
      }}

      // update existujícího záznamu
      updateItem={async (codeKey, input) => {
        const payload = mapGenericToPayload(input)
        const updated = await updateUnitType(codeKey, payload)
        return mapRowToGeneric(updated)
      }}
    />
  )
}
