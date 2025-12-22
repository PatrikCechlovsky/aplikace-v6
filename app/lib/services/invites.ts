// FILE: app/lib/services/invites.ts
// PURPOSE: Service pro vytvoření pozvánky (subject_invites) + (volitelně) vytvoření SUBJECTu pro nový email.
// NOTE:
// - RLS rozhoduje, jestli insert projde. Když padá "new row violates row-level security policy", chybí policy.
// - DB kontrakty: subject_invites.invite_mode je NOT NULL (posíláme vždy).
// - UX kontrakt: nechceme duplicitní pozvánky (pending) ani duplicitní email v subjects.

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

  // rozšíření pro UI:
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

async function ensureNoActiveInvite(params: { subjectId?: string | null; email?: string | null }) {
  const subjectId = (params.subjectId ?? '').trim() || null
  const email = normalizeEmail(params.email)

  if (!subjectId && !email) return

  // Aktivní = pending a (expires_at je null nebo v budoucnu)
  // Pozn.: "now" děláme na klientovi, DB porovnání přes filtr nejde 1:1, proto bereme poslední a kontrolujeme v JS.
  let q = supabase
    .from('subject_invites')
    .select('id,status,invite_mode,role_code,email,subject_id,created_at,sent_at,expires_at,created_by')
    .order('created_at', { ascending: false })
    .limit(1)

  if (subjectId) q = q.eq('subject_id', subjectId)
  else if (email) q = q.eq('email', email)

  const { data, error } = await q
  if (error) throw new Error(error.message)

  const row = (data ?? [])[0] as any
  if (!row?.id) return

  const status = String(row.status ?? '').toLowerCase()
  if (status !== 'pending') return

  const expiresAt = row.expires_at ? new Date(row.expires_at).getTime() : null
  const now = Date.now()
  const isActive = expiresAt == null || expiresAt > now

  if (isActive) {
    throw new Error(
      'Pozvánka už existuje a je stále aktivní (pending). Neodesílej ji znovu – použij resend až ho doplníme.'
    )
  }
}

async function createSubjectForNewInvite(input: {
  email: string
  displayName?: string | null
}): Promise<{ subjectId: string }> {
  // DB: subjects.origin_module je NOT NULL -> posíláme vždy.
  // DB: subjects.subject_type často bývá NOT NULL -> zvolíme "user" (pokud máš jiný kód, uprav zde).
  const payload: any = {
    subject_type: 'user',
    display_name: (input.displayName ?? '').trim() || input.email,
    email: input.email,
    is_archived: false,

    origin_module: '010',
  }

  const { data, error } = await supabase
    .from('subjects')
    .insert(payload)
    .select('id,email,display_name')
    .single()

  if (error) throw new Error(error.message)
  if (!data?.id) throw new Error('Nepodařilo se vytvořit subjekt pro pozvánku.')

  return { subjectId: data.id }
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
      // přesně co chceš: nedovolíme mít 2 subjekty se stejným emailem
      throw new Error('Subjekt s tímto emailem už existuje. Použij režim „Existující uživatel“.')
    }

    const created = await createSubjectForNewInvite({ email, displayName })
    subjectId = created.subjectId
    subjectCreated = true
  }

  // 2) Blokace duplicitních aktivních pozvánek (pending)
  await ensureNoActiveInvite({ subjectId, email })

  // 3) Insert pozvánky
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
    message: subjectCreated ? 'Byl vytvořen nový subjekt + založena pozvánka.' : 'Byla založena pozvánka.',
  }
}
