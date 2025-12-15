// FILE: app/lib/services/users.roles.ts
// PURPOSE: Načtení rolí k subjectům (010)

import { supabase } from '@/app/lib/supabaseClient'

export async function getRoleLabelsForSubjects(subjectIds: string[]) {
  if (!subjectIds.length) return new Map<string, string>()

  const { data, error } = await supabase
    .from('subject_roles')
    .select('subject_id, role_code, role_types(name)')
    .in('subject_id', subjectIds)

  if (error) throw error

  const map = new Map<string, string>()
  for (const r of data ?? []) {
    const subjectId = (r as any).subject_id as string
    const roleName = (r as any).role_types?.name as string | undefined
    // vezmeme první roli, později můžeš skládat více rolí
    if (subjectId && roleName && !map.has(subjectId)) map.set(subjectId, roleName)
  }

  return map
}
