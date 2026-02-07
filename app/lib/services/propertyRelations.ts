// FILE: app/lib/services/propertyRelations.ts
// PURPOSE: Načítání vazeb nemovitosti (jednotky, nájemníci)
// NOTES: Používá existující služby a minimalizuje logiku v UI

import { supabase } from '@/app/lib/supabaseClient'
import { listUnits, type UnitsListRow } from '@/app/lib/services/units'

export type PropertyRelationUnit = UnitsListRow

export type PropertyRelationTenant = {
  id: string
  display_name: string | null
  email: string | null
  phone: string | null
  subject_type: string | null
  is_archived: boolean | null
}

export type PropertyRelationsResult = {
  units: PropertyRelationUnit[]
  tenants: PropertyRelationTenant[]
}

export async function getPropertyRelations(propertyId: string, opts?: { includeArchived?: boolean }): Promise<PropertyRelationsResult> {
  const includeArchived = !!opts?.includeArchived

  const units = await listUnits({ propertyId, includeArchived, limit: 500 })
  const tenantIds = Array.from(new Set(units.map((u) => u.tenant_id).filter(Boolean))) as string[]

  let tenants: PropertyRelationTenant[] = []
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
    tenants = (data ?? []) as PropertyRelationTenant[]
  }

  return { units, tenants }
}
