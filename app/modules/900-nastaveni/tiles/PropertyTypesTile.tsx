/*
 * FILE: app/modules/900-nastaveni/tiles/PropertyTypesTile.tsx
 * PURPOSE: Wrapper kolem GenericTypeTile pro tabulku property_types
 */

'use client'

import GenericTypeTile, {
  GenericTypeItem,
} from '@/app/UI/GenericTypeTile'

import type {
  PropertyTypeRow,
  PropertyTypePayload,
} from '../services/propertyTypes'

import {
  fetchPropertyTypes,
  createPropertyType,
  updatePropertyType,
  deletePropertyType,
} from '../services/propertyTypes'

/**
 * Mapování z DB řádku (PropertyTypeRow) na generický typový záznam
 * používaný GenericTypeTile.
 */
function mapRowToGeneric(row: PropertyTypeRow): GenericTypeItem {
  return {
    code: row.code,
    name: row.name,
    description: row.description ?? null,
    color: row.color ?? null,
    icon: row.icon ?? null,
    // v DB je order_index, v UI používáme sort_order
    sort_order: row.order_index ?? null,
    // v tabulce zatím nemáme sloupec active → v UI bereme jako vždy aktivní
    active: true,
  }
}

/**
 * Mapování z GenericTypeItem (formulář) na payload pro service.
 * `code` se předává zvlášť jako parametr funkce.
 */
function mapGenericToPayload(input: GenericTypeItem): PropertyTypePayload {
  return {
    name: input.name,
    description: input.description ?? null,
    color: input.color ?? null,
    icon: input.icon ?? null,
    order_index:
      typeof input.sort_order === 'number' && !Number.isNaN(input.sort_order)
        ? input.sort_order
        : null,
  }
}

export default function PropertyTypesTile() {
  return (
    <GenericTypeTile
      title="Typy nemovitostí"
      description="Číselník typů nemovitostí (rodinný dům, bytový dům, pozemek, průmyslový objekt…)."

      // načtení seznamu – Supabase service
      fetchItems={async () => {
        const rows = await fetchPropertyTypes()
        return rows.map(mapRowToGeneric)
      }}

      // vytvoření nového záznamu
      createItem={async (input) => {
        const payload = mapGenericToPayload(input)
        const created = await createPropertyType(input.code, payload)
        return mapRowToGeneric(created)
      }}

      // update existujícího záznamu
      updateItem={async (codeKey, input) => {
        const payload = mapGenericToPayload(input)
        const updated = await updatePropertyType(codeKey, payload)
        return mapRowToGeneric(updated)
      }}

      // pokud GenericTypeTile umí delete, můžeš předat i to (jinak klidně smaž)
      deleteItem={async (codeKey) => {
        await deletePropertyType(codeKey)
      }}
    />
  )
}
