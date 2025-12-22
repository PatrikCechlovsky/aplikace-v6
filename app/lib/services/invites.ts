// FILE: app/lib/services/invites.ts
// PURPOSE: Service pro vytvoření pozvánky (subject_invites) + (volitelně) vytvoření SUBJECTu pro nový email.
// CHANGE (2025-12-22):
// - "Vždy vytvořit novou pozvánku": před insert expirovat všechny aktivní pending pozvánky pro subject/email.

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

  subjectId: string | null
  subjectCreated: boolean
  message?: string | null
}

function normalizeEmail(email: string | null | undefined): string | null {
  const e = (email ?? '').trim().toLowerCase()
  return e || null
}

async function findSubjectByEmail(email: string): Promise<{ id: string } | null> {
  const { data, error } = await supabase.from('subjects').select('id').eq('email', email).maybeSingle()
  if (error) throw new Error(error.message)
  return data?.id ? { id: data.id } : null
}

async function createSubjectForNewInvite(input: { email: string; displayName?: string | null }): Promise<{ subjectId: string }> {
  // DB: subjects.origin_module je NOT NULL -> posíláme vždy.
  // DB: subjects.subject_type může být NOT NULL -> podle tvé DB. Pokud máš jiný kód, uprav.
  const payload: any = {
    subject_type: 'osoba',
    display_name: (input.displayName ?? '').trim() || input.email,
    email: input.email,
    is_archived: false,
    origin_module: '010',
  }

  const { data, error } = await supabase.from('subjects').insert(payload).select('id').single()
  if (error) throw new Error(error.message)
  if (!data?.id) throw new Error('Nepodařilo se vytvořit subjekt pro pozvánku.')
  return { subjectId: data.id }
}

/**
 * Expirovat všechny pending pozvánky pro stejného adresáta.
 * - preferujeme subject_id
 * - fallback: email
 *
 * Děláme:
 * - status = 'expired'
 * - expires_at = now
 *
 * Pozn.: Pokud máš v DB i pole "expired_at" nebo audit, můžeš doplnit.
 */
async function expireActiveInvites(params: { subjectId?: string | null; email?: string | null }) {
  const subjectId = (params.subjectId ?? '').trim() || null
  const email = normalizeEmail(params.email)

  if (!subjectId && !email) return

  const nowIso = new Date().toISOString()
  let q = supabase.from('subject_invites').update({ status: 'expired', expires_at: nowIso })

  // expirovat jen pending
  q = q.eq('status', 'pending')

  if (subjectId) q = q.eq('subject_id', subjectId)
  else if (email) q = q.eq('email', email)

  const { error } = await q
  if (error) throw new Error(error.message)
}

export async function sendInvite(v: InviteFormValue): Promise<InviteResult> {
  if (!v.roleCode?.trim()) throw new Error('Role je povinná.')

  const mode = v.mode
  const roleCode = v.roleCode.trim()

  if (mode === 'existing' && !v.subjectId) throw new Error('Musí být vybrán existující uživatel.')
  if (mode === 'new' && !v.email?.trim()) throw new Error('Email je povinný.')

  const email = mode === 'new' ? normalizeEmail(v.email) : null
  const displayName = (v.displayName ?? '').trim() || null
  const note = (v.note ?? '').trim() || null

  let subjectId: string | null = mode === 'existing' ? (v.subjectId ?? null) : null
  let subjectCreated = false

  // 1) NEW: kontrola duplicitního emailu + vytvoření SUBJECTu
  if (mode === 'new') {
    if (!email) throw new Error('Email je povinný.')
    const existing = await findSubjectByEmail(email)
    if (existing?.id) {
      // uživatel nechce 2 subjekty se stejným emailem
      throw new Error('Subjekt s tímto emailem už existuje. Použij režim „Existující uživatel“.')
    }

    const created = await createSubjectForNewInvite({ email, displayName })
    subjectId = created.subjectId
    subjectCreated = true
  }

  // ✅ 2) ALWAYS NEW INVITE: expirovat staré pending pozvánky pro stejného adresáta
  await expireActiveInvites({ subjectId, email })

  // 3) Insert nové pozvánky
  const payload: any = {
    invite_mode: mode, // NOT NULL
    subject_id: subjectId,
    email: email,

    role_code: roleCode,
    display_name: displayName,
    note,

    status: 'pending',
  }

  const { data, error } = await supabase
    .from('subject_invites')
    .insert(payload)
    .select(
      `
        id,
        status,
        invite_mode,
        role_code,
        email,
        subject_id,
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
  if (!data?.id) throw new Error('Pozvánku se nepodařilo vytvořit.')

  return {
    inviteId: data.id,
    status: data.status,
    mode: (data as any).invite_mode ?? mode,
    roleCode: data.role_code,
    email: data.email,
    createdAt: data.created_at,
    sentAt: data.sent_at,
    expiresAt: data.expires_at,
    createdBy: data.created_by,

    subjectId: (data as any).subject_id ?? subjectId ?? null,
    subjectCreated,
    message: subjectCreated
      ? 'Byl vytvořen nový subjekt + založena nová pozvánka (předchozí pending byly expirovány).'
      : 'Byla založena nová pozvánka (předchozí pending byly expirovány).',
  }
}

/**
 * Vrátí poslední pozvánku pro subject (ORDER BY created_at DESC LIMIT 1).
 */
export async function getLatestInviteForSubject(subjectId: string): Promise<InviteResult | null> {
  const id = (subjectId ?? '').trim()
  if (!id) return null

  const { data, error } = await supabase
    .from('subject_invites')
    .select('id,status,invite_mode,role_code,email,subject_id,created_at,sent_at,expires_at,created_by')
    .eq('subject_id', id)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) throw new Error(error.message)
  const row = (data ?? [])[0] as any
  if (!row?.id) return null

  return {
    inviteId: row.id,
    status: row.status ?? null,
    mode: (row.invite_mode ?? 'existing') as any,
    roleCode: row.role_code ?? null,
    email: row.email ?? null,
    createdAt: row.created_at ?? null,
    sentAt: row.sent_at ?? null,
    expiresAt: row.expires_at ?? null,
    createdBy: row.created_by ?? null,

    subjectId: row.subject_id ?? id,
    subjectCreated: false,
    message: null,
  }
}
