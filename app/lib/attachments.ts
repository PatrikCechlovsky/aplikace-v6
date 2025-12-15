/*
 * FILE: app/lib/attachments.ts
 * PURPOSE:
 *   Data layer pro sekci „Přílohy“ v DetailView (kontext entity).
 *
 * CONTEXT:
 *   - používá tabulky `documents` + `document_versions`
 *   - pro list v UI čte přes view `v_document_latest_version`
 *   - Storage bucket: `documents`
 *
 * CURRENT STATE (KROK 3 + 4a + 4b):
 *   - READ: list příloh pro entitu (latest version)
 *   - READ: list verzí pro dokument
 *   - signed URL: otevření souboru/verze ze Storage
 */

import { createClient } from '@supabase/supabase-js'

// ✅ client-side Supabase client (stejný vzor jako UserDetailFrame)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type AttachmentRow = {
  id: string
  entity_type: string
  entity_id: string
  title: string
  description: string | null
  is_archived: boolean
  created_at: string

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
    .from('documents')
    .createSignedUrl(filePath, expiresInSeconds)

  if (error) throw error
  return data.signedUrl
}
