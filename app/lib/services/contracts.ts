// FILE: app/lib/services/contracts.ts
// PURPOSE: Contracts service pro modul 060: list + detail + save.
// CONTRACT:
// - listContracts(params) -> ContractsListRow[]
// - getContractDetail(id) -> { contract: ContractDetailRow }
// - saveContract(input) -> uložený contract

import { supabase } from '@/app/lib/supabaseClient'

/* =========================
   LIST
   ========================= */

export type ContractsListParams = {
  searchText?: string
  includeArchived?: boolean
  limit?: number
}

export type ContractsListRow = {
  id: string
  cislo_smlouvy: string | null
  stav: string | null
  landlord_id: string | null
  tenant_id: string | null
  property_id: string | null
  unit_id: string | null
  datum_zacatek: string | null
  datum_konec: string | null
  doba_neurcita: boolean | null
  stav_plateb_smlouvy: string | null
  is_archived: boolean | null
  created_at: string | null

  landlord_name?: string | null
  tenant_name?: string | null
  property_name?: string | null
  unit_name?: string | null
}

export async function listContracts(params: ContractsListParams = {}): Promise<ContractsListRow[]> {
  const search = (params.searchText ?? '').trim()
  const includeArchived = !!params.includeArchived
  const limit = params.limit ?? 500

  let q = supabase
    .from('contracts')
    .select(
      `
        id,
        cislo_smlouvy,
        stav,
        landlord_id,
        tenant_id,
        property_id,
        unit_id,
        datum_zacatek,
        datum_konec,
        doba_neurcita,
        stav_plateb_smlouvy,
        is_archived,
        created_at,
        landlord:subjects!contracts_landlord_id_fkey(display_name),
        tenant:subjects!contracts_tenant_id_fkey(display_name),
        property:properties!contracts_property_id_fkey(display_name),
        unit:units!contracts_unit_id_fkey(display_name)
      `
    )
    .order('datum_zacatek', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!includeArchived) {
    q = q.or('is_archived.is.null,is_archived.eq.false')
  }

  if (search) {
    const s = `%${search}%`
    q = q.or([`cislo_smlouvy.ilike.${s}`, `stav.ilike.${s}`].join(','))
  }

  const { data, error } = await q
  if (error) throw new Error(error.message)

  return (data ?? []).map((row: any) => {
    const landlord = Array.isArray(row.landlord) ? row.landlord[0] : row.landlord
    const tenant = Array.isArray(row.tenant) ? row.tenant[0] : row.tenant
    const property = Array.isArray(row.property) ? row.property[0] : row.property
    const unit = Array.isArray(row.unit) ? row.unit[0] : row.unit

    return {
      ...row,
      landlord_name: landlord?.display_name ?? null,
      tenant_name: tenant?.display_name ?? null,
      property_name: property?.display_name ?? null,
      unit_name: unit?.display_name ?? null,
    } as ContractsListRow
  })
}

/* =========================
   DETAIL
   ========================= */

export type ContractDetailRow = {
  id: string
  cislo_smlouvy: string | null
  stav: string | null
  landlord_id: string | null
  tenant_id: string | null
  pocet_uzivatelu: number | null
  property_id: string | null
  unit_id: string | null
  pomer_plochy_k_nemovitosti: string | null
  datum_podpisu: string | null
  datum_zacatek: string | null
  datum_konec: string | null
  doba_neurcita: boolean | null
  najem_vyse: number | null
  periodicita_najmu: string | null
  den_platby: string | null
  kauce_potreba: boolean | null
  kauce_castka: number | null
  pozadovany_datum_kauce: string | null
  stav_kauce: string | null
  stav_najmu: string | null
  stav_plateb_smlouvy: string | null
  poznamky: string | null
  is_archived: boolean | null
  created_at: string | null
  created_by: string | null
  updated_at: string | null
  updated_by: string | null

  landlord_name?: string | null
  tenant_name?: string | null
  property_name?: string | null
  unit_name?: string | null
}

export async function getContractDetail(id: string): Promise<{ contract: ContractDetailRow }> {
  const { data, error } = await supabase
    .from('contracts')
    .select(
      `
        *,
        landlord:subjects!contracts_landlord_id_fkey(display_name),
        tenant:subjects!contracts_tenant_id_fkey(display_name),
        property:properties!contracts_property_id_fkey(display_name),
        unit:units!contracts_unit_id_fkey(display_name)
      `
    )
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('Smlouva nenalezena')

  const landlord = Array.isArray(data.landlord) ? data.landlord[0] : data.landlord
  const tenant = Array.isArray(data.tenant) ? data.tenant[0] : data.tenant
  const property = Array.isArray(data.property) ? data.property[0] : data.property
  const unit = Array.isArray(data.unit) ? data.unit[0] : data.unit

  return {
    contract: {
      ...data,
      landlord_name: landlord?.display_name ?? null,
      tenant_name: tenant?.display_name ?? null,
      property_name: property?.display_name ?? null,
      unit_name: unit?.display_name ?? null,
    } as ContractDetailRow,
  }
}

/* =========================
   SAVE
   ========================= */

export type SaveContractInput = {
  id?: string | null
  cislo_smlouvy: string
  stav: string
  landlord_id: string | null
  tenant_id: string | null
  pocet_uzivatelu?: number | null
  property_id: string | null
  unit_id: string | null
  pomer_plochy_k_nemovitosti?: string | null
  datum_podpisu?: string | null
  datum_zacatek: string
  datum_konec?: string | null
  doba_neurcita?: boolean | null
  najem_vyse?: number | null
  periodicita_najmu: string
  den_platby: string
  kauce_potreba?: boolean | null
  kauce_castka?: number | null
  pozadovany_datum_kauce?: string | null
  stav_kauce?: string | null
  stav_najmu?: string | null
  stav_plateb_smlouvy?: string | null
  poznamky?: string | null
  is_archived?: boolean | null
}

export async function saveContract(input: SaveContractInput): Promise<ContractDetailRow> {
  const payload = {
    cislo_smlouvy: input.cislo_smlouvy?.trim() || null,
    stav: input.stav?.trim() || null,
    landlord_id: input.landlord_id || null,
    tenant_id: input.tenant_id || null,
    pocet_uzivatelu: input.pocet_uzivatelu ?? null,
    property_id: input.property_id || null,
    unit_id: input.unit_id || null,
    pomer_plochy_k_nemovitosti: input.pomer_plochy_k_nemovitosti || null,
    datum_podpisu: input.datum_podpisu || null,
    datum_zacatek: input.datum_zacatek || null,
    datum_konec: input.datum_konec || null,
    doba_neurcita: input.doba_neurcita ?? false,
    najem_vyse: input.najem_vyse ?? null,
    periodicita_najmu: input.periodicita_najmu || null,
    den_platby: input.den_platby || null,
    kauce_potreba: input.kauce_potreba ?? false,
    kauce_castka: input.kauce_castka ?? null,
    pozadovany_datum_kauce: input.pozadovany_datum_kauce || null,
    stav_kauce: input.stav_kauce || null,
    stav_najmu: input.stav_najmu || null,
    stav_plateb_smlouvy: input.stav_plateb_smlouvy || null,
    poznamky: input.poznamky || null,
    is_archived: input.is_archived ?? false,
    updated_at: new Date().toISOString(),
  }

  if (input.id && input.id !== 'new') {
    const { data, error } = await supabase
      .from('contracts')
      .update(payload)
      .eq('id', input.id)
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    return data as ContractDetailRow
  }

  const { data, error } = await supabase
    .from('contracts')
    .insert({ ...payload, created_at: new Date().toISOString() })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data as ContractDetailRow
}
