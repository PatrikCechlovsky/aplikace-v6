/**
 * FILE: app/lib/attachments.ts
 *
 * PURPOSE:
 *   Data layer pro práci s přílohami (documents + document_versions)
 *   pro DetailAttachmentsSection (list i manager).
 *
 * CONTEXT:
 *   - view (read-only list): v_document_latest_version
 *   - tabulky: documents, document_versions
 *   - storage bucket: 'documents'
 *
 * RULES:
 *   - Používat jednotného Supabase klienta z app/lib/supabaseClient.ts
 *   - Žádné createClient() zde (kvůli GoTrueClient duplicitám)
 *   - entity_type musí odpovídat hodnotám ve view (singular), UI může posílat plural
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

  // latest version fields (from view)
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

  // ✅ snapshot metadat pro konkrétní verzi
  title: string | null
  description: string | null
}

export type UserNameMap = Record<string, string>

export type ListAttachmentsArgs = {
  entityType: string
  entityId: string
  includeArchived: boolean
}

export type ListAttachmentVersionsArgs = {
  documentId: string
  includeArchived: boolean
}

export type GetSignedUrlArgs = {
  filePath: string
  expiresInSeconds?: number
}

export type CreateAttachmentWithUploadArgs = {
  entityType: string
  entityId: string
  entityLabel?: string | null
  title: string
  description?: string | null
  file: File
}

export type AddAttachmentVersionWithUploadArgs = {
  documentId: string
  entityType: string
  entityId: string
  entityLabel?: string | null
  file: File
}

export type UpdateAttachmentMetadataArgs = {
  documentId: string
  title: string
  description?: string | null
}

// ==================================================
// 3) HELPERS
// ==================================================
const DOCS_BUCKET = 'documents'

function normalizeEntityType(entityType: string): string {
  const t = (entityType ?? '').trim().toLowerCase()
  if (t === 'users') return 'user'
  if (t === 'subjects') return 'subject'
  return t
}

function normalizeAuthError(msg: string) {
  const m = (msg ?? '').toLowerCase()
  if (m.includes('jwt') || m.includes('permission') || m.includes('not allowed') || m.includes('rls') || m.includes('401') || m.includes('403')) {
    return 'Nemáš oprávnění zobrazit přílohy této entity.'
  }
  return msg
}

function safeFileName(name: string) {
  return (name ?? 'file').replace(/[^\w.\-]+/g, '_')
}

function buildStoragePath(params: {
  entityType: string
  entityId: string
  documentId: string
  versionNumber: number
  fileName: string
}) {
  const et = normalizeEntityType(params.entityType)
  const fn = safeFileName(params.fileName)
  const vn = String(params.versionNumber).padStart(3, '0')
  // stabilní a čitelné
  return `${et}/${params.entityId}/${params.documentId}/v${vn}_${fn}`
}

async function uploadToStorage(filePath: string, file: File) {
  const { error } = await supabase.storage.from(DOCS_BUCKET).upload(filePath, file, { upsert: true })
  if (error) throw new Error(error.message)
}

/**
 * ✅ Načte aktuální metadata z documents
 * (použijeme jako snapshot do document_versions při vytvoření nové verze)
 */
async function loadDocumentMeta(documentId: string): Promise<{ title: string | null; description: string | null; is_archived?: boolean | null }> {
  const { data, error } = await supabase.from('documents').select('title, description, is_archived').eq('id', documentId).maybeSingle()
  if (error) throw new Error(normalizeAuthError(error.message))
  return {
    title: (data as any)?.title ?? null,
    description: (data as any)?.description ?? null,
    is_archived: (data as any)?.is_archived ?? null,
  }
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

  if (!args.includeArchived) q = q.eq('is_archived', false)

  const { data, error } = await q
  if (error) throw new Error(normalizeAuthError(error.message))
  return (data ?? []) as AttachmentRow[]
}

export async function listAttachmentVersions(args: ListAttachmentVersionsArgs): Promise<AttachmentVersionRow[]> {
  let q = supabase
    .from('document_versions')
    .select('*')
    .eq('document_id', args.documentId)
    .order('version_number', { ascending: false })

  if (!args.includeArchived) q = q.eq('is_archived', false)

  const { data, error } = await q
  if (error) throw new Error(normalizeAuthError(error.message))
  return (data ?? []) as AttachmentVersionRow[]
}

/**
 * Fallback map userId -> display_name (pokud view nemá *_by_name).
 * Pokud ve vašem projektu používáte jinou tabulku/view, uprav jen zde.
 */
export async function loadUserDisplayNames(ids: (string | null | undefined)[]): Promise<UserNameMap> {
  const uniq = Array.from(new Set(ids.filter(Boolean).map((x) => String(x))))
  if (uniq.length === 0) return {}

  const { data, error } = await supabase.from('profiles').select('id, display_name').in('id', uniq)
  if (error) return {}

  const map: UserNameMap = {}
  for (const r of data ?? []) {
    const id = (r as any)?.id
    const dn = (r as any)?.display_name
    if (id && dn) map[String(id)] = String(dn)
  }
  return map
}

// ==================================================
// 5) ACTION HANDLERS
// ==================================================
export async function getAttachmentSignedUrl({ filePath, expiresInSeconds = 60 }: GetSignedUrlArgs): Promise<string> {
  const { data, error } = await supabase.storage.from(DOCS_BUCKET).createSignedUrl(filePath, expiresInSeconds)
  if (error) throw new Error(error.message)
  if (!data?.signedUrl) throw new Error('Signed URL nebyla vytvořena.')
  return data.signedUrl
}

export async function createAttachmentWithUpload(args: CreateAttachmentWithUploadArgs): Promise<{ documentId: string }> {
  const entityType = normalizeEntityType(args.entityType)

  // 1) create document
  const { data: doc, error: docErr } = await supabase
    .from('documents')
    .insert({
      entity_type: entityType,
      entity_id: args.entityId,
      title: args.title,
      description: args.description ?? null,
      is_archived: false,
    })
    .select('id, title, description')
    .single()

  if (docErr) throw new Error(normalizeAuthError(docErr.message))
  const documentId = (doc as any)?.id as string
  if (!documentId) throw new Error('Nepodařilo se vytvořit dokument.')

  // ✅ snapshot metadat pro verzi 1
  const snapTitle = (doc as any)?.title ?? args.title ?? null
  const snapDesc = (doc as any)?.description ?? args.description ?? null

  // 2) upload file
  const versionNumber = 1
  const filePath = buildStoragePath({
    entityType,
    entityId: args.entityId,
    documentId,
    versionNumber,
    fileName: args.file.name,
  })

  await uploadToStorage(filePath, args.file)

  // 3) insert version row (včetně snapshot metadat)
  const { error: verErr } = await supabase.from('document_versions').insert({
    document_id: documentId,
    version_number: versionNumber,
    file_path: filePath,
    file_name: args.file.name,
    mime_type: args.file.type ?? null,
    file_size: args.file.size ?? null,
    is_archived: false,

    // ✅ snapshot
    title: snapTitle,
    description: snapDesc,
  })

  if (verErr) throw new Error(normalizeAuthError(verErr.message))

  return { documentId }
}

export async function addAttachmentVersionWithUpload(args: AddAttachmentVersionWithUploadArgs): Promise<void> {
  // 1) zjisti next version_number
  const { data: maxRow, error: maxErr } = await supabase
    .from('document_versions')
    .select('version_number')
    .eq('document_id', args.documentId)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (maxErr) throw new Error(normalizeAuthError(maxErr.message))

  const nextVersion = ((maxRow as any)?.version_number ?? 0) + 1
  const entityType = normalizeEntityType(args.entityType)

  // ✅ 2) načti aktuální metadata dokumentu a ulož je jako snapshot do nové verze
  const meta = await loadDocumentMeta(args.documentId)

  // 3) upload file
  const filePath = buildStoragePath({
    entityType,
    entityId: args.entityId,
    documentId: args.documentId,
    versionNumber: nextVersion,
    fileName: args.file.name,
  })

  await uploadToStorage(filePath, args.file)

  // 4) insert version row (včetně snapshot metadat)
  const { error: verErr } = await supabase.from('document_versions').insert({
    document_id: args.documentId,
    version_number: nextVersion,
    file_path: filePath,
    file_name: args.file.name,
    mime_type: args.file.type ?? null,
    file_size: args.file.size ?? null,
    is_archived: false,

    // ✅ snapshot
    title: meta.title ?? null,
    description: meta.description ?? null,
  })

  if (verErr) throw new Error(normalizeAuthError(verErr.message))
}

export async function updateAttachmentMetadata(args: UpdateAttachmentMetadataArgs): Promise<void> {
  // ✅ aktualizujeme pouze documents (historie verzí zůstává beze změny)
  const { error } = await supabase
    .from('documents')
    .update({
      title: args.title,
      description: args.description ?? null,
    })
    .eq('id', args.documentId)

  if (error) throw new Error(normalizeAuthError(error.message))
}

// ==================================================
// 6) RENDER
// ==================================================
// (util soubor – bez render části)
