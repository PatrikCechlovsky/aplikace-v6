// FILE: app/lib/services/invites.ts
// PURPOSE: Invite service – vytvoří záznam pozvánky (subject_invites).
// NOTE: RLS musí blokovat ne-invitery; UI jen zobrazí chybu.

import { createClient } from '@/app/lib/supabase/client'
import type { InviteFormValue } from '@/app/modules/010-sprava-uzivatelu/forms/InviteUserForm'

export type InviteResult = {
  inviteId: string
  status?: string | null
  mode?: 'existing' | 'new' | null
  roleCode?: string | null
  email?: string | null
  createdAt?: string | null
  sentAt?: string | null
  expiresAt?: string | null
  createdBy?: string | null
}

function normEmail(email: string): string {
  return (email ?? '').trim().toLowerCase()
}

export async function sendInvite(v: InviteFormValue): Promise<InviteResult> {
  const supabase = createClient()

  const mode = v.mode
  const roleCode = (v.roleCode ?? '').trim()
  const subjectId = v.subjectId ?? null
  const email = normEmail(v.email)
  const displayName = (v.displayName ?? '').trim()
  const note = (v.note ?? '').trim()

  if (!roleCode) throw new Error('Role je povinná.')
  if (mode === 'existing' && !subjectId) throw new Error('Vyber existujícího uživatele.')
  if (mode === 'new' && !email) throw new Error('Email je povinný.')

  // ⚠️ sloupce uprav přesně podle DB:
  // - subject_id nebo email
  // - role_code
  // - note / display_name volitelné
  const payload: any = {
    subject_id: mode === 'existing' ? subjectId : null,
    email: mode === 'new' ? email : null,
    role_code: roleCode,
    note: note || null,
    display_name: displayName || null,
    status: 'pending',
    // sent_at / expires_at může nastavovat DB trigger nebo až resend/email layer
  }

  const { data, error } = await supabase
    .from('subject_invites')
    .insert(payload)
    .select('id,status,role_code,email,created_at,sent_at,expires_at,created_by')
    .single()

  if (error) throw new Error(error.message)
  if (!data?.id) throw new Error('Pozvánku se nepodařilo vytvořit (bez id).')

  return {
    inviteId: data.id,
    status: data.status ?? 'pending',
    mode,
    roleCode: data.role_code ?? roleCode,
    email: data.email ?? (mode === 'new' ? email : null),
    createdAt: data.created_at ?? null,
    sentAt: data.sent_at ?? null,
    expiresAt: data.expires_at ?? null,
    createdBy: data.created_by ?? null,
  }
}
