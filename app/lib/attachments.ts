/**
 * FILE: app/lib/attachments.ts
 *
 * PURPOSE:
 *   Data layer pro práci s přílohami (documents + versions)
 *   používaný v DetailView a ve správě příloh.
 *
 * CONTEXT:
 *   - view (read-only list): v_document_latest_version
 *   - tabulky: documents, document_versions
 *   - storage: Supabase Storage bucket 'documents'
 *
 * RULES:
 *   - Používat jednotného Supabase klienta z app/lib/supabaseClient.ts
 *   - Žádné createClient() zde (kvůli duplicitám GoTrueClient)
 *   - entity_type musí odpovídat hodnotám ve view (singular)
 */

// ==================================================
// 1) IMPORTS
// ==================================================
import { supabase } from '@/app/lib/supabaseClient'

// ==================================================
// 2) TYPES
// ==================================================
export type AttachmentRow = {
  id: string

  entity_type: string
  entity_id: string

  title: string
  description: string | null
  is_archived: boolean

  created_at: string | null
  created_by: string | null
  updated_at: string | null
  updated_by: string | null

  // latest version (from view)
  version_id: string | null
  version_number: number | null
  version_created_at: string | null
  version_created_by: string | null
  version_created_by_name?: string | null

  file_path: string
  file_name: string
  mime_type?: string | null
  file_size?: number | null

  created_by_name?: string | null
  updated_by_name?: string | null
}

export type AttachmentVersionRow = {
  id: string
  document_id: string
  version_number: number
  file_path: string
  file_name: string
  mime_type: string | null
  file_size: number | null
  created_at: string | null
  created_by: string | null
  is_archived: boolean
}

export type UserNameMap = Record<string, string>

export type ListAttachmentsArgs = {
  entityType: string
  entityId: string
  includeArchived: boolean
}

export type GetSignedUrlArgs = {
  filePath: string
  expiresInSeconds?: number
}

// ==================================================
// 3) HELPERS
// ==================================================
const DOCS_BUCKET = 'documents'

/**
 * UI často pracuje s pluralem (users, subjects),
 * ale DB/view používá singular (user, subject).
 * Normalizace je centrálně zde.
 */
function normalizeEntityType(entityType: string): string {
  const t = (entityType ?? '').trim().toLowerCase()
  if (t === 'users') return 'user'
  if (t === 'subjects') return 'subject'
  return t
}

function normalizeAuthError(msg: string) {
  const m = (msg ?? '').toLowerCase()
  if (
    m.includes('jwt') ||
    m.includes('permission') ||
    m.includes('not allowed') ||
    m.includes('rls') ||
    m.includes('401') ||
    m.includes('403')
  ) {
    return 'Nemáš oprávnění zobrazit přílohy této entity.'
  }
  return msg
}

// ==================================================
// 4) DATA LOAD
// ==================================================
export async function listAttachments(args: ListAttachmentsArgs): Promise<AttachmentRow[]> {
  const entityType = normalizeEntityType(args.entityType)

  let q = supabase
    .from('v_document_latest_version')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', args.entityId)
    .order('version_created_at', { ascending: false })

  if (!args.includeArchived) {
    q = q.eq('is_archived', false)
  }

  const { data, error } = await q
  if (error) throw new Error(normalizeAuthError(error.message))

  return (data ?? []) as AttachmentRow[]
}

export async function listAttachmentVersions({
  documentId,
  includeArchived,
}: {
  documentId: string
  includeArchived: boolean
}): Promise<AttachmentVersionRow[]> {
  let q = supabase
    .from('document_versions')
    .select('*')
    .eq('document_id', documentId)
    .order('version_number', { ascending: false })

  if (!includeArchived) {
    q = q.eq('is_archived', false)
  }

  const { data, error } = await q
  if (error) throw new Error(normalizeAuthError(error.message))

  return (data ?? []) as AttachmentVersionRow[]
}

export async function loadUserDisplayNames(
  ids: (string | null | undefined)[]
): Promise<UserNameMap> {
  const uniq = Array.from(new Set(ids.filter(Boolean))) as string[]
  if (uniq.length === 0) return {}

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', uniq)

  if (error) return {}

  const map: UserNameMap = {}
  for (const r of data ?? []) {
    if (r.id && r.display_name) {
      map[String(r.id)] = String(r.display_name)
    }
  }
  return map
}

// ==================================================
// 5) ACTION HANDLERS
// ==================================================
export async function getAttachmentSignedUrl({
  filePath,
  expiresInSeconds = 60,
}: GetSignedUrlArgs): Promise<string> {
  const { data, error } = await supabase
    .storage
    .from(DOCS_BUCKET)
    .createSignedUrl(filePath, expiresInSeconds)

  if (error) throw new Error(error.message)
  if (!data?.signedUrl) throw new Error('Signed URL nebyla vytvořena.')

  return data.signedUrl
}

// ==================================================
// 6) RENDER
// ==================================================
// (util soubor – bez render části)
