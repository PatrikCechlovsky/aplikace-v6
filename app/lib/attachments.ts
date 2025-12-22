/**
 * FILE: app/lib/attachments.ts
 *
 * PURPOSE:
 *   Data layer pro sekci „Přílohy“ v DetailView (kontext entity).
 *
 * CONTEXT:
 *   - view pro list: `v_document_latest_version`
 *   - tabulky: `documents` + `document_versions`
 *   - storage: Supabase Storage bucket (default: 'documents')
 *
 * RULES:
 *   - Používat jednotného Supabase klienta z `app/lib/supabaseClient.ts`
 *   - Žádné další `createClient()` zde (kvůli GoTrueClient duplicitám)
 */

import { supabase } from '@/app/lib/supabaseClient'

const BUCKET = (process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'documents').trim()

export type AttachmentRow = {
  id: string
  entity_type: string
  entity_id: string
  title: string
  description: string | null
  is_archived: boolean
  created_at: string
  created_by: string | null

  // volitelně (pokud je ve view / tabulce)
  updated_at?: string | null
  updated_by?: string | null

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
  return name.replace(/[^\w.\-]+/g, '_')
}

function logDebug(...args: any[]) {
  // eslint-disable-next-line no-console
  console.log('[attachments]', ...args)
}

/* =========================================================
   READ – list latest docs
   ========================================================= */

export async function listAttachments(input: { entityType: string; entityId: string; includeArchived?: boolean }) {
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

export async function listAttachmentVersions(input: { documentId: string; includeArchived?: boolean }) {
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

/* =========================================================
   STORAGE – signed url + upload
   ========================================================= */

export async function getAttachmentSignedUrl(input: { filePath: string; expiresInSeconds?: number }) {
  const { filePath, expiresInSeconds = 60 } = input

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(filePath, expiresInSeconds)
  if (error) {
    logDebug('signedUrl error', { bucket: BUCKET, filePath, error })
    throw error
  }

  return data.signedUrl
}

async function uploadToStorage(input: { filePath: string; file: File }) {
  const { filePath, file } = input

  logDebug('upload start', { bucket: BUCKET, filePath, name: file.name, size: file.size, type: file.type })

  const { error } = await supabase.storage.from(BUCKET).upload(filePath, file, {
    upsert: false,
    contentType: file.type || 'application/octet-stream',
  })

  if (error) {
    logDebug('upload error', { bucket: BUCKET, filePath, error })
    throw error
  }

  logDebug('upload ok', { bucket: BUCKET, filePath })
}

async function getNextVersionNumber(documentId: string) {
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

/* =========================================================
   CREATE – new document + v001 upload
   ========================================================= */

export async function createAttachmentWithUpload(input: {
  entityType: string
  entityId: string
  title: string
  description?: string | null
  file: File
}) {
  const { entityType, entityId, title, description = null, file } = input

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

  await uploadToStorage({ filePath, file })

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

/* =========================================================
   CREATE – add new version (upload + insert)
   ========================================================= */

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

/* =========================================================
   UPDATE – metadata dokumentu (title/description)
   ========================================================= */

export async function updateAttachmentMetadata(input: { documentId: string; title: string; description?: string | null }) {
  const { documentId, title, description = null } = input

  const { data, error } = await supabase
    .from('documents')
    .update({ title, description })
    .eq('id', documentId)
    .select('*')
    .single()

  if (error) throw error
  return data
}
