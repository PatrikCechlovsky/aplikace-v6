/*
 * FILE: app/modules/900-nastaveni/tiles/SubjectTypesTile.tsx
 * PURPOSE: Wrapper kolem GenericTypeTile pro tabulku subject_types
 */

'use client'

import GenericTypeTile, {
  GenericTypeItem,
} from '@/app/UI/GenericTypeTile'

import type {
  SubjectType,
  SubjectTypePayload,
} from '../services/subjectTypes'
import {
  fetchSubjectTypes,
  createSubjectType,
  updateSubjectType,
} from '../services/subjectTypes'

/**
 * Mapování z DB řádku (SubjectType) na generický typový záznam
 * používaný GenericTypeTile.
 */
function mapRowToGeneric(row: SubjectType): GenericTypeItem {
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
function mapGenericToPayload(input: GenericTypeItem): SubjectTypePayload {
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

export default function SubjectTypesTile() {
  return (
    <GenericTypeTile
      title="Typy-subjektů"
      description="Číselník typů subjektů (osoba, firma, společenství, pronajímatel…)."

      // načtení seznamu – napojení na Supabase přes service
      fetchItems={async () => {
        const rows = await fetchSubjectTypes()
        return rows.map(mapRowToGeneric)
      }}

      // vytvoření nového záznamu
      createItem={async (input) => {
        const payload = mapGenericToPayload(input)
        const created = await createSubjectType(input.code, payload)
        return mapRowToGeneric(created as SubjectType)
      }}

      // update existujícího záznamu
      updateItem={async (codeKey, input) => {
        const payload = mapGenericToPayload(input)
        const updated = await updateSubjectType(codeKey, payload)
        return mapRowToGeneric(updated as SubjectType)
      }}
    />
  )
}
