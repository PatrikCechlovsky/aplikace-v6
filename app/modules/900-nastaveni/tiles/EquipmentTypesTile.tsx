// FILE: app/modules/900-nastaveni/tiles/EquipmentTypesTile.tsx
// PURPOSE: UI pro správu typů vybavení (equipment_types) přes generic_types
// NOTES: Wrapper kolem GenericTypeTile pro kategorii 'equipment_types'

'use client'

import GenericTypeTile, { GenericTypeItem } from '@/app/UI/GenericTypeTile'
import { 
  listByCategory, 
  create, 
  update, 
  GenericTypeRow 
} from '@/app/lib/services/genericTypes'

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
function mapGenericToPayload(input: GenericTypeItem) {
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

export default function EquipmentTypesTile() {
  return (
    <GenericTypeTile
      title="Typy vybavení"
      description="Číselník typů vybavení (Spotřebiče, Nábytek, Sanitární technika, Kuchyňské spotřebiče, Vytápění, Technika, Osvětlení, Zahradní vybavení, Ostatní)."

      // načtení seznamu z generic_types WHERE category='equipment_types'
      fetchItems={async () => {
        const rows = await listByCategory('equipment_types')
        return rows.map(mapRowToGeneric)
      }}

      // vytvoření nového záznamu
      createItem={async (input) => {
        const payload = mapGenericToPayload(input)
        const created = await create('equipment_types', input.code, payload)
        return mapRowToGeneric(created)
      }}

      // update existujícího záznamu
      updateItem={async (codeKey, input) => {
        const payload = mapGenericToPayload(input)
        const updated = await update('equipment_types', codeKey, payload)
        return mapRowToGeneric(updated)
      }}
    />
  )
}
