// FILE: app/lib/services/invites.ts
// PURPOSE: Service vrstva pro pozvánky (invite flow).
// MVP: zatím jen uloží procesní záznam do tabulky user_invites (status=pending).

import { supabase } from '@/app/lib/supabaseClient'
import type { InviteFormValue } from '@/app/modules/010-sprava-uzivatelu/forms/InviteUserForm'

const INVITES_TABLE = 'user_invites'

export type InviteResult = {
  inviteId: string
  status: 'pending' | 'sent' | 'accepted' | 'expired' | 'canceled' | string
  createdAt?: string | null
  createdBy?: string | null
  sentAt?: string | null
  mode?: 'existing' | 'new' | string
  subjectId?: string | null
  email?: string | null
  roleCode?: string | null
}

export async function sendInvite(v: InviteFormValue): Promise<InviteResult> {
  const mode = v.mode
  const roleCode = (v.roleCode ?? '').trim()
  const email = (v.email ?? '').trim().toLowerCase()
  const displayName = (v.displayName ?? '').trim() || (email ? email.split('@')[0] : '')
  const note = (v.note ?? '').trim()

  if (!roleCode) throw new Error('Role je povinná.')
  if (mode === 'existing' && !v.subjectId) throw new Error('Vyber existujícího uživatele (subjectId).')
  if (mode === 'new' && !email) throw new Error('Email je povinný.')

  // MVP payload (bez tokenu/email odeslání)
  const payload: any = {
    mode, // 'existing' | 'new'
    subject_id: mode === 'existing' ? v.subjectId : null,

    // ✅ ukládáme email vždy jako auditní kopii (u new povinné, u existing předvyplněné)
    email: email || null,

    display_name: displayName || null,
    role_code: roleCode,
    note: note || null,
    status: 'pending',
  }

  const { data, error } = await supabase
    .from(INVITES_TABLE)
    .insert(payload)
    .select('id,status,created_at,created_by,sent_at,mode,subject_id,email,role_code')
    .single()

  if (error) {
    throw new Error(
      `Nepodařilo se uložit pozvánku (tabulka "${INVITES_TABLE}" / RLS / schéma). Detail: ${error.message}`
    )
  }

  return {
    inviteId: data.id,
    status: data.status ?? 'pending',
    createdAt: data.created_at ?? null,
    createdBy: data.created_by ?? null,
    sentAt: data.sent_at ?? null,
    mode: data.mode ?? mode,
    subjectId: data.subject_id ?? (mode === 'existing' ? v.subjectId : null),
    email: data.email ?? (email || null),
    roleCode: data.role_code ?? roleCode,
  }
}
