/*
 * FILE: app/modules/900-nastaveni/tiles/PropertyTypesTile.tsx
 * PURPOSE: Wrapper kolem GenericTypeTile pro tabulku property_types
 */

'use client'

import GenericTypeTile, {
  GenericTypeItem,
} from '@/app/UI/GenericTypeTile'

import type {
  PropertyType,
  PropertyTypePayload,
} from '../services/propertyTypes'
import {
  fetchPropertyTypes,
  createPropertyType,
  updatePropertyType,
} from '../services/propertyTypes'

/**
 * Mapování z DB řádku (PropertyType) na generický typový záznam
 * používaný GenericTypeTile.
 * Stejná logika jako u SubjectTypesTile.
 */
function mapRowToGeneric(row: PropertyType): GenericTypeItem {
  return {
    code: row.code,
    name: row.name,
    description: row.description,
    color: row.color,
    icon: row.icon,
    sort_order: row.sort_order ?? null,
    active: row.active ?? true,
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
    sort_order:
      typeof input.sort_order === 'number' && !Number.isNaN(input.sort_order)
        ? input.sort_order
        : null,
    active: input.active ?? true,
  }
}

export default function PropertyTypesTile() {
  return (
    <GenericTypeTile
      title="Typy nemovitostí"
      description="Číselník typů nemovitostí (rodinný dům, bytový dům, pozemek, průmyslový objekt…)."

      // načtení seznamu – napojení na Supabase přes service
      fetchItems={async () => {
        const rows = await fetchPropertyTypes()
        return rows.map(mapRowToGeneric)
      }}

      // vytvoření nového záznamu
      createItem={async (input) => {
        const payload = mapGenericToPayload(input)
        const created = await createPropertyType(input.code, payload)
        return mapRowToGeneric(created as PropertyType)
      }}

      // update existujícího záznamu
      updateItem={async (codeKey, input) => {
        const payload = mapGenericToPayload(input)
        const updated = await updatePropertyType(codeKey, payload)
        return mapRowToGeneric(updated as PropertyType)
      }}
    />
  )
}
