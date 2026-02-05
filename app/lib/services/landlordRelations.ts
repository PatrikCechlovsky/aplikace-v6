// FILE: app/lib/services/landlordRelations.ts
// PURPOSE: Načítání vazeb pronajímatele (nemovitosti, jednotky, nájemníci)
// NOTES: Používá existující služby a minimalizuje logiku v UI

import { supabase } from '@/app/lib/supabaseClient'
import { listProperties, type PropertiesListRow } from '@/app/lib/services/properties'
import { listUnits, type UnitsListRow } from '@/app/lib/services/units'

export type LandlordRelationProperty = PropertiesListRow

export type LandlordRelationUnit = UnitsListRow

export type LandlordRelationTenant = {
  id: string
  display_name: string | null
  email: string | null
  phone: string | null
  subject_type: string | null
  is_archived: boolean | null
}

export type LandlordRelationsResult = {
  properties: LandlordRelationProperty[]
  units: LandlordRelationUnit[]
  tenants: LandlordRelationTenant[]
}

export async function getLandlordRelations(landlordId: string, opts?: { includeArchived?: boolean }): Promise<LandlordRelationsResult> {
  const includeArchived = !!opts?.includeArchived

  const properties = await listProperties({ landlordId, includeArchived, limit: 500 })
  const propertyIds = properties.map((p) => p.id)

  const unitsLists = await Promise.all(
    propertyIds.map((propertyId) =>
      listUnits({ propertyId, includeArchived, limit: 500 })
    )
  )

  const units = unitsLists.flat()

  const tenantIds = Array.from(new Set(units.map((u) => u.tenant_id).filter(Boolean))) as string[]
  let tenants: LandlordRelationTenant[] = []

  if (tenantIds.length > 0) {
    let q = supabase
      .from('subjects')
      .select('id, display_name, email, phone, subject_type, is_archived')
      .in('id', tenantIds)

    if (!includeArchived) {
      q = q.or('is_archived.is.null,is_archived.eq.false')
    }

    const { data, error } = await q
    if (error) throw new Error(error.message)
    tenants = (data ?? []) as LandlordRelationTenant[]
  }

  return { properties, units, tenants }
}
