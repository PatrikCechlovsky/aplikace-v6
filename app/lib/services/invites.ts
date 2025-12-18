// FILE: app/lib/services/invites.ts
// PURPOSE: Service pro vytvoření pozvánky (subject_invites)
// NOTE: RLS řeší oprávnění – UI jen zobrazuje chyby

import { supabase } from '@/app/lib/supabaseClient'
import type { InviteFormValue } from '@/app/modules/010-sprava-uzivatelu/forms/InviteUserForm'

export type InviteResult = {
  inviteId: string
  status: string | null
  mode: 'existing' | 'new'
  roleCode: string | null
  email: string | null
  createdAt: string | null
  sentAt: string | null
  expiresAt: string | null
  createdBy: string | null
}

function normalizeEmail(email: string | null | undefined): string | null {
  const e = (email ?? '').trim().toLowerCase()
  return e || null
}

export async function sendInvite(v: InviteFormValue): Promise<InviteResult> {
  if (!v.roleCode?.trim()) {
    throw new Error('Role je povinná.')
  }

  if (v.mode === 'existing' && !v.subjectId) {
    throw new Error('Musí být vybrán existující uživatel.')
  }

  if (v.mode === 'new' && !v.email?.trim()) {
    throw new Error('Email je povinný.')
  }

  const payload = {
    subject_id: v.mode === 'existing' ? v.subjectId : null,
    email: v.mode === 'new' ? normalizeEmail(v.email) : null,
    role_code: v.roleCode,
    display_name: v.displayName?.trim() || null,
    note: v.note?.trim() || null,
    status: 'pending',
    // sent_at / expires_at:
    // - buď řeší trigger
    // - nebo až resend/email layer
  }

  const { data, error } = await supabase
    .from('subject_invites')
    .insert(payload)
    .select(
      `
        id,
        status,
        role_code,
        email,
        created_at,
        sent_at,
        expires_at,
        created_by
      `
    )
    .single()

  if (error) {
    console.error('[sendInvite] DB error:', error)
    throw new Error(error.message)
  }

  if (!data?.id) {
    throw new Error('Pozvánku se nepodařilo vytvořit.')
  }

  return {
    inviteId: data.id,
    status: data.status,
    mode: v.mode,
    roleCode: data.role_code,
    email: data.email,
    createdAt: data.created_at,
    sentAt: data.sent_at,
    expiresAt: data.expires_at,
    createdBy: data.created_by,
  }
}
