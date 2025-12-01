/*
 * FILE: app/modules/900-nastaveni/tiles/SubjectTypesTile.tsx
 * PURPOSE: Wrapper kolem GenericTypeTile pro tabulku subject_types
 */

'use client'

import GenericTypeTile, {
  GenericTypeItem,
} from '@/app/UI/GenericTypeTile'

import type { SubjectType } from '../services/subjectTypes'
import {
  fetchSubjectTypes,
  createSubjectType,
  updateSubjectType,
} from '../services/subjectTypes'

// mapování z DB typu na generický typový záznam
function mapRowToGeneric(row: SubjectType): GenericTypeItem {
  return {
    code: row.code,
    name: row.name,
    description: row.description,
    color: row.color,
    icon: row.icon,
    sort_order: row.sort_order,
    active: row.active,
  }
}

// mapování z generického formuláře zpět na payload pro service
function mapGenericToPayload(input: GenericTypeItem) {
  return {
    code: input.code,
    name: input.name,
    description: input.description ?? '',
    color: input.color ?? undefined,
    icon: input.icon ?? undefined,
    order: input.sort_order ?? undefined,
    is_active: input.active ?? true,
  }
}

export default function SubjectTypesTile() {
  return (
    <GenericTypeTile
      title="Typy subjektů"
      description="Číselník typů subjektů (osoba, firma, spolek…). Přidávat / upravovat může pouze admin."
      fetchItems={async () => {
        const rows: SubjectType[] = await fetchSubjectTypes()
        return rows.map(mapRowToGeneric)
      }}
      createItem={async (input) => {
        const payload = mapGenericToPayload(input)
        const created = await createSubjectType(payload)
        return mapRowToGeneric(created as SubjectType)
      }}
      updateItem={async (codeKey, input) => {
        const payload = mapGenericToPayload(input)
        const updated = await updateSubjectType(codeKey, payload)
        return mapRowToGeneric(updated as SubjectType)
      }}
    />
  )
}
