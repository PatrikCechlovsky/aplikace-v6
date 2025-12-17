// FILE: app/lib/services/invites.ts
// NEW
// PURPOSE: service vrstva pro pozvánky (invite flow).
// Backend může být tabulka "user_invites" nebo RPC/Edge Function – tady je to připravené.

import { supabase } from '@/app/lib/supabaseClient'
import type { InviteFormValue } from '@/app/modules/010-sprava-uzivatelu/forms/InviteUserForm'

const INVITES_TABLE = 'user_invites' // ✅ pokud máš jinak, přejmenuj tady

export type InviteResult = {
  inviteId: string
  status: 'pending' | 'sent' | 'accepted' | 'expired' | 'canceled' | string
  createdAt?: string | null
  sentAt?: string | null
}

export async function sendInvite(v: InviteFormValue): Promise<InviteResult> {
  // 1) normalizace
  const mode = v.mode
  const roleCode = (v.roleCode ?? '').trim()
  const email = (v.email ?? '').trim().toLowerCase()
  const displayName = (v.displayName ?? '').trim() || (email ? email.split('@')[0] : '')
  const note = (v.note ?? '').trim()

  if (!roleCode) throw new Error('Role je povinná.')
  if (mode === 'existing' && !v.subjectId) throw new Error('Chybí subjectId (existující uživatel).')
  if (mode === 'new' && !email) throw new Error('Email je povinný.')

  // 2) minimální payload – doplň si dle DB
  const payload: any = {
    mode, // 'existing' | 'new'
    subject_id: mode === 'existing' ? v.subjectId : null,
    email: mode === 'new' ? email : null,
    display_name: displayName,
    role_code: roleCode,
    note: note || null,
    status: 'pending',
  }

  // 3) pokus o insert do tabulky
  const { data, error } = await supabase
    .from(INVITES_TABLE)
    .insert(payload)
    .select('id,status,created_at,sent_at')
    .single()

  if (error) {
    // sem ti spadne, pokud tabulka/RLS neexistuje → aspoň jasná zpráva
    throw new Error(
      `Nepodařilo se uložit pozvánku (tabulka "${INVITES_TABLE}" / RLS / schéma). Detail: ${error.message}`
    )
  }

  // 4) pokud budeš později posílat email serverem, tady bude krok "send"
  // - buď RPC: supabase.rpc('invite_user', {...})
  // - nebo Edge Function: supabase.functions.invoke('invite-user', {...})
  // a pak update status/sent_at

  return {
    inviteId: data.id,
    status: data.status ?? 'pending',
    createdAt: data.created_at ?? null,
    sentAt: data.sent_at ?? null,
  }
}
