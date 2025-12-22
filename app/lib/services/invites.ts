// FILE: app/lib/services/invites.ts
// PURPOSE: Service pro vytvoření pozvánky (subject_invites) pro modul 010.
//          Řeší i vytvoření subjektu při "new" a ochrany:
//          - duplicitní email subjektu
//          - duplicitní aktivní pozvánka (resend blok / reuse)
// NOTE: RLS řeší oprávnění – UI jen zobrazuje chyby.

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
  createdBy?: string | null
  subjectId?: string | null
  displayName?: string | null

  /** volitelný hint pro UI (např. reuse aktivní pozvánky) */
  info?: string | null
}

const ORIGIN_MODULE = '010-sprava-uzivatelu'
const SUBJECT_TYPE = 'osoba'
const DEFAULT_INVITE_VALID_DAYS = 7

function normalizeEmail(email: string) {
  return (email ?? '').trim().toLowerCase()
}

function addDaysIso(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

function nowIso() {
  return new Date().toISOString()
}

function mapInviteRowToResult(row: any, fallback: InviteFormValue, info?: string | null): InviteResult {
  return {
    inviteId: row.id,
    status: row.status ?? null,
    mode: (row.invite_mode ?? fallback.mode) as any,
    roleCode: row.role_code ?? null,
    email: row.email ?? fallback.email ?? null,
    createdAt: row.created_at ?? null,
    sentAt: row.sent_at ?? null,
    expiresAt: row.expires_at ?? null,
    createdBy: row.created_by ?? null,
    subjectId: row.subject_id ?? null,
    displayName: row.display_name ?? fallback.displayName ?? null,
    info: info ?? null,
  }
}

async function findSubjectByEmail(emailNorm: string) {
  if (!emailNorm) return null

  // přesnější než eq (kvůli případům uloženého emailu s jiným casem)
  const { data, error } = await supabase
    .from('subjects')
    .select('id, email, display_name, first_login_at, is_archived')
    .ilike('email', emailNorm)
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data ?? null
}

async function createSubjectForInvite(params: { emailNorm: string; displayName: string }) {
  const payload = {
    subject_type: SUBJECT_TYPE,
    display_name: params.displayName?.trim() || params.emailNorm,
    email: params.emailNorm,
    origin_module: ORIGIN_MODULE, // ✅ NOT NULL constraint
    is_archived: false,
  }

  const { data, error } = await supabase.from('subjects').insert(payload).select('id, email, display_name').single()
  if (error) throw error
  return data
}

async function findActiveInvite(params: { subjectId: string; emailNorm: string }) {
  const n = nowIso()

  // Aktivní = není accepted/canceled a není po expiraci
  const { data, error } = await supabase
    .from('subject_invites')
    .select('*')
    .eq('subject_id', params.subjectId)
    .is('accepted_at', null)
    .is('canceled_at', null)
    .gt('expires_at', n)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error

  // fallback: některé starší testy mohly mít subject_id null (tvoje CSV to ukazuje) → zkus i email
  if (!data && params.emailNorm) {
    const r2 = await supabase
      .from('subject_invites')
      .select('*')
      .ilike('email', params.emailNorm)
      .is('accepted_at', null)
      .is('canceled_at', null)
      .gt('expires_at', n)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (r2.error) throw r2.error
    return r2.data ?? null
  }

  return data ?? null
}

export async function sendInvite(v: InviteFormValue): Promise<InviteResult> {
  // -----------------------------
  // Validace vstupu
  // -----------------------------
  const roleCode = (v.roleCode ?? '').trim()
  if (!roleCode) throw new Error('Role je povinná.')

  const emailNorm = normalizeEmail(v.email)

  if (v.mode === 'existing') {
    if (!v.subjectId) throw new Error('Musí být vybrán existující uživatel.')
    // u existing chceme email jen jako auditní stopu, ale když není vyplněný, neblokujeme
  }

  if (v.mode === 'new') {
    if (!emailNorm) throw new Error('Email je povinný.')
  }

  // -----------------------------
  // 1) Resolve subjectId
  // -----------------------------
  let subjectId = (v.subjectId ?? '').trim() || null
  let displayName = (v.displayName ?? '').trim()

  if (v.mode === 'new') {
    // 1a) blok duplicitního emailu subjektu (už existuje user)
    const existingSubject = await findSubjectByEmail(emailNorm)
    if (existingSubject?.id) {
      // nechceme zakládat nový subjekt se stejným emailem
      throw new Error(
        'Subjekt s tímto e-mailem už existuje. Použij režim „Pozvat existujícího“ (vyber uživatele ze seznamu).'
      )
    }

    // 1b) vytvoř nový subject (povinné pro to, aby se zobrazil v seznamu)
    const created = await createSubjectForInvite({
      emailNorm,
      displayName: displayName || emailNorm,
    })

    subjectId = created.id
    displayName = created.display_name ?? displayName
  } else {
    // existing: subjectId je povinný
    subjectId = subjectId ?? null
  }

  if (!subjectId) {
    throw new Error('Chybí subjectId – nelze vytvořit pozvánku.')
  }

  // -----------------------------
  // 2) Anti-dup: aktivní pozvánka
  // -----------------------------
  const active = await findActiveInvite({ subjectId, emailNorm })
  if (active?.id) {
    // místo zakládání další → vrátíme tu existující (UI uvidí systém tab s reálným ID)
    return mapInviteRowToResult(active, v, 'Pozvánka už existuje a je stále aktivní – zobrazuji existující záznam.')
  }

  // -----------------------------
  // 3) Insert invite
  // -----------------------------
  const insertPayload: any = {
    invite_mode: v.mode, // ✅ NOT NULL
    subject_id: subjectId, // ✅ vždy vyplněné
    email: emailNorm || null,
    display_name: displayName || null,
    role_code: roleCode,
    note: (v.note ?? '').trim() || null,

    // volitelně – pokud DB nemá trigger na expiraci/status, tak tohle pomůže
    status: 'pending',
    sent_at: nowIso(),
    expires_at: addDaysIso(DEFAULT_INVITE_VALID_DAYS),
  }

  const { data, error } = await supabase.from('subject_invites').insert(insertPayload).select('*').single()
  if (error) throw error

  return mapInviteRowToResult(data, v, null)
}
