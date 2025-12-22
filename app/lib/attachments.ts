/*
 * FILE: app/lib/attachments.ts
 * PURPOSE:
 *   Data layer pro sekci „Přílohy“ v DetailView (kontext entity).
 *
 * CONTEXT:
 *   - tabulky: `documents` + `document_versions`
 *   - view pro list: `v_document_latest_version`
 *   - Storage bucket: `documents`
 *
 * FEATURES:
 *   - listAttachments (READ latest)
 *   - listAttachmentVersions (READ versions)
 *   - getAttachmentSignedUrl (SIGNED URL)
 *   - createAttachmentWithUpload (CREATE document + version 1 + upload)
 *   - addAttachmentVersionWithUpload (CREATE next version + upload)
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

const BUCKET = 'TVUJ_REALNY_BUCKET'

export type AttachmentRow = {
  id: string
  entity_type: string
  entity_id: string
  title: string
  description: string | null
  is_archived: boolean
  created_at: string
  created_by: string | null

  // z view `v_document_latest_version`
  version_id: string
  version_number: number
  file_path: string
  file_name: string
  mime_type: string | null
  file_size: number | null
  version_created_at: string
  version_is_archived: boolean
}

export type AttachmentVersionRow = {
  id: string
  document_id: string
  version_number: number
  file_path: string
  file_name: string
  mime_type: string | null
  file_size: number | null
  is_archived: boolean
  created_at: string
  created_by: string | null
}

function pad3(n: number) {
  return String(n).padStart(3, '0')
}

function sanitizeFileName(name: string) {
  // minimal-safe: odstraní divné znaky pro storage path
  return name.replace(/[^\w.\-]+/g, '_')
}

export async function listAttachments(input: {
  entityType: string
  entityId: string
  includeArchived?: boolean
}) {
  const { entityType, entityId, includeArchived = false } = input

  let q = supabase
    .from('v_document_latest_version')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })

  if (!includeArchived) q = q.eq('is_archived', false)

  const { data, error } = await q
  if (error) throw error

  return (data ?? []) as AttachmentRow[]
}

export async function listAttachmentVersions(input: {
  documentId: string
  includeArchived?: boolean
}) {
  const { documentId, includeArchived = true } = input

  let q = supabase
    .from('document_versions')
    .select('*')
    .eq('document_id', documentId)
    .order('version_number', { ascending: false })

  if (!includeArchived) q = q.eq('is_archived', false)

  const { data, error } = await q
  if (error) throw error

  return (data ?? []) as AttachmentVersionRow[]
}

export async function getAttachmentSignedUrl(input: {
  filePath: string
  expiresInSeconds?: number
}) {
  const { filePath, expiresInSeconds = 60 } = input

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(filePath, expiresInSeconds)

  if (error) throw error
  return data.signedUrl
}

async function uploadToStorage(input: { filePath: string; file: File }) {
  const { filePath, file } = input

  const { error } = await supabase.storage.from(BUCKET).upload(filePath, file, {
    upsert: false,
    contentType: file.type || 'application/octet-stream',
  })
  if (error) throw error
}

async function getNextVersionNumber(documentId: string) {
  // vezmeme nejvyšší verzi a +1
  const { data, error } = await supabase
    .from('document_versions')
    .select('version_number')
    .eq('document_id', documentId)
    .order('version_number', { ascending: false })
    .limit(1)

  if (error) throw error
  const last = (data?.[0]?.version_number as number | undefined) ?? 0
  return last + 1
}

/**
 * Vytvoří nový dokument (documents), nahraje soubor do Storage a vytvoří verzi 1 (document_versions).
 */
export async function createAttachmentWithUpload(input: {
  entityType: string
  entityId: string
  title: string
  description?: string | null
  file: File
}) {
  const { entityType, entityId, title, description = null, file } = input

  // 1) documents
  const { data: doc, error: docErr } = await supabase
    .from('documents')
    .insert({
      entity_type: entityType,
      entity_id: entityId,
      title,
      description,
      is_archived: false,
    })
    .select('*')
    .single()

  if (docErr) throw docErr

  const documentId = doc.id as string
  const versionNumber = 1
  const safeName = sanitizeFileName(file.name)
  const filePath = `${entityType}/${entityId}/${documentId}/v${pad3(versionNumber)}_${safeName}`

  // 2) upload
  await uploadToStorage({ filePath, file })

  // 3) document_versions
  const { error: verErr } = await supabase.from('document_versions').insert({
    document_id: documentId,
    version_number: versionNumber,
    file_path: filePath,
    file_name: file.name,
    mime_type: file.type || null,
    file_size: file.size,
    is_archived: false,
  })

  if (verErr) throw verErr

  return { documentId, versionNumber, filePath }
}

/**
 * Přidá novou verzi k existujícímu dokumentu: upload + insert do document_versions.
 */
export async function addAttachmentVersionWithUpload(input: {
  entityType: string
  entityId: string
  documentId: string
  file: File
}) {
  const { entityType, entityId, documentId, file } = input

  const versionNumber = await getNextVersionNumber(documentId)
  const safeName = sanitizeFileName(file.name)
  const filePath = `${entityType}/${entityId}/${documentId}/v${pad3(versionNumber)}_${safeName}`

  await uploadToStorage({ filePath, file })

  const { error } = await supabase.from('document_versions').insert({
    document_id: documentId,
    version_number: versionNumber,
    file_path: filePath,
    file_name: file.name,
    mime_type: file.type || null,
    file_size: file.size,
    is_archived: false,
  })

  if (error) throw error
  return { versionNumber, filePath }
}
