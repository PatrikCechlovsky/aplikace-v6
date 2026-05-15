// FILE: app/lib/services/contractUsers.ts
// PURPOSE: Service pro uživatele smlouvy (vybraní tenant_users)
// NOTES: Používá tabulku contract_users

import { supabase } from '@/app/lib/supabaseClient'

export type ContractUserRow = {
  id: string
  contract_id: string
  tenant_user_id: string
  is_archived: boolean | null
  created_at: string | null
  updated_at: string | null
}

export async function listContractUsers(contractId: string, includeArchived: boolean = false): Promise<ContractUserRow[]> {
  let query = supabase
    .from('contract_users')
    .select('*')
    .eq('contract_id', contractId)

  if (!includeArchived) {
    query = query.or('is_archived.is.null,is_archived.eq.false')
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  return (data ?? []) as ContractUserRow[]
}

export async function setContractUsers(contractId: string, tenantUserIds: string[]): Promise<void> {
  const { data, error } = await supabase
    .from('contract_users')
    .select('id, tenant_user_id')
    .eq('contract_id', contractId)

  if (error) throw new Error(error.message)

  const existing = (data ?? []).map((r: any) => String(r.tenant_user_id))
  const toAdd = tenantUserIds.filter((id) => !existing.includes(id))
  const toRemove = existing.filter((id) => !tenantUserIds.includes(id))

  if (toRemove.length > 0) {
    const { error: delErr } = await supabase
      .from('contract_users')
      .delete()
      .eq('contract_id', contractId)
      .in('tenant_user_id', toRemove)

    if (delErr) throw new Error(delErr.message)
  }

  if (toAdd.length > 0) {
    const payload = toAdd.map((id) => ({ contract_id: contractId, tenant_user_id: id }))
    const { error: insErr } = await supabase
      .from('contract_users')
      .insert(payload)

    if (insErr) throw new Error(insErr.message)
  }
}
