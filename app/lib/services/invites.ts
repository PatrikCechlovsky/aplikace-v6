// FILE: app/lib/services/invites.ts
// PURPOSE: Service pro vytvoření pozvánky (subject_invites) + pro "new" vytvoří rovnou subject.
// NOTE: RLS řeší oprávnění – UI jen zobrazuje chyby.
// STYLE: žádné zkracování, držet hlavičky FILE/PURPOSE.

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
  subjectId?: string | null
}

function normalizeEmail(email: string | null | undefined): string | null {
  const e = (email ?? '').trim().toLowerCase()
  return e || null
}

function pickDisplayName(input: { displayName?: string; email?: string | null }): string {
  const dn = (input.displayName ?? '').trim()
  if (dn) return dn
  const em = (input.email ?? '').trim()
  if (!em) return 'Nový uživatel'
  return em.split('@')[0] || em
}

function isoNow(): string {
  return new Date().toISOString()
}

function isoPlusDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

async function findSubjectByEmail(email: string): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from('subjects')
    .select('id')
    .eq('email', email)
    .limit(1)
    .maybeSingle()

  if (error) {
    // když RLS nedovolí SELECT, chceme to vědět (a ne tiše pokračovat)
    console.error('[invites.findSubjectByEmail] DB error:', error)
    throw new Error(error.message)
  }

  return data?.id ? { id: data.id } : null
}

async function ensureNoActiveInvite(params: { subjectId: string | null; email: string | null }) {
  // Aktivní = pending a (expires_at je NULL nebo v budoucnu)
  // (je to “best effort” na FE; ideálně ještě DB unique/trigger – viz níže v doporučení)
  let q = supabase.from('subject_invites').select('id, status, expires_at').eq('status', 'pending').limit(1)

  if (params.subjectId) q = q.eq('subject_id', params.subjectId)
  else if (params.email) q = q.eq('email', params.email)
  else return

  const { data, error } = await q.maybeSingle()

  if (error) {
    console.error('[invites.ensureNoActiveInvite] DB error:', error)
    throw new Error(error.message)
  }

  if (!data?.id) return

  const expiresAt = (data as any).expires_at as string | null
  if (!expiresAt) {
    throw new Error('Pozvánka už existuje a je aktivní (pending).')
  }

  const exp = new Date(expiresAt).getTime()
  const now = Date.now()
  if (exp > now) {
    throw new Error(`Pozvánka už existuje a je aktivní (pending) – platí do ${expiresAt}.`)
  }

  // když je expirovaná, dovolíme založit novou (status ale pořád může být pending → ideálně DB job/trigger)
}

async function createSubjectForInvite(params: { email: string; displayName: string }) {
  // v minulosti ti padalo na NOT NULL subject_type → dáme default "osoba"
  // (hodnota je z generic_type:subject_type – typické: osoba, osvc, firma…)
  const payload = {
    subject_type: 'osoba',
    display_name: params.displayName,
    email: params.email,
    is_archived: false,
  }

  const { data, error } = await supabase
    .from('subjects')
    .insert(payload)
    .select('id')
    .single()

  if (error) {
    console.error('[invites.createSubjectForInvite] DB error:', error)
    throw new Error(error.message)
  }

  if (!data?.id) throw new Error('Subjekt se nepodařilo vytvořit.')

  return { id: data.id as string }
}

export async function sendInvite(v: InviteFormValue): Promise<InviteResult> {
  if (!v.roleCode?.trim()) throw new Error('Role je povinná.')

  const mode = v.mode

  if (mode === 'existing' && !v.subjectId) {
    throw new Error('Musí být vybrán existující uživatel.')
  }

  const email = mode === 'new' ? normalizeEmail(v.email) : null
  if (mode === 'new' && !email) throw new Error('Email je povinný.')

  // 1) vyřeš subjectId
  let subjectId: string | null = mode === 'existing' ? (v.subjectId ?? null) : null

  if (mode === 'new') {
    // 1a) duplicita emailu → už existuje subjekt? tak to NESMÍME založit znovu
    const existing = await findSubjectByEmail(email!)
    if (existing?.id) {
      throw new Error('Uživatel se stejným emailem už existuje. Použij režim „Pozvat existujícího“.')
    }

    // 1b) vytvoř nový subject
    const displayName = pickDisplayName({ displayName: v.displayName, email })
    const created = await createSubjectForInvite({ email: email!, displayName })
    subjectId = created.id
  }

  // 2) blokace duplicitní aktivní pozvánky (pending + neexpirovaná)
  await ensureNoActiveInvite({ subjectId, email })

  // 3) vytvoř invite + rovnou nastav "odesláno" časy (ať je to vidět v UI)
  const now = isoNow()
  const expiresAt = isoPlusDays(7) // můžeš změnit (např. 14), nebo přesunout do triggeru

  const payload = {
    invite_mode: mode, // NOT NULL
    subject_id: subjectId,
    // necháme email i u "new" (audit), ale klidně můžeš dát null a brát email ze subjectu
    email: mode === 'new' ? email : null,
    role_code: v.roleCode,
    display_name: v.displayName?.trim() || null,
    note: v.note?.trim() || null,
    status: 'pending',
    sent_at: now,
    expires_at: expiresAt,
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
        created_at,
        sent_at,
        expires_at,
        created_by,
        subject_id
      `
    )
    .single()

  if (error) {
    console.error('[invites.sendInvite] DB error:', error)
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
    subjectId: (data as any).subject_id ?? subjectId,
  }
}
