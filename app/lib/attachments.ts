/*
 * FILE: app/lib/attachments.ts
 * PURPOSE: Data layer pro sekci „Přílohy“ (DetailView). KROK 3+4a = READ + signed URL.
 */

import { supabase } from '@/app/lib/supabaseClient'

export type AttachmentRow = {
  id: string
  entity_type: string
  entity_id: string
  title: string
  description: string | null
  is_archived: boolean
  created_at: string

  version_id: string
  version_number: number
  file_path: string
  file_name: string
  mime_type: string | null
  file_size: number | null
  version_created_at: string
  version_is_archived: boolean
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
