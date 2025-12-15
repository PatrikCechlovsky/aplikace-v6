/*
 * FILE: app/lib/attachments.ts
 * PURPOSE:
 *   Data layer pro sekci „Přílohy“ v DetailView.
 *   Slouží k práci s dokumenty NAVÁZANÝMI NA KONKRÉTNÍ ENTITU.
 *
 * CONTEXT:
 *   - Používá tabulky `documents` a `document_versions`
 *   - Neřeší globální modul Dokumenty
 *   - Určeno výhradně pro DetailView (context entity)
 *
 * CURRENT STATE:
 *   - READ operace (načtení příloh k entitě)
 *
 * FUTURE:
 *   - upload nové přílohy
 *   - přidání nové verze
 *   - archivace přílohy / verze
 *
 * NOTE:
 *   Modul „Dokumenty“ bude mít vlastní data layer
 *   (např. app/lib/documents-module.ts nebo app/lib/documentsAdmin.ts)
 */

import { supabase } from './supabaseClient'

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

  if (!includeArchived) {
    q = q.eq('is_archived', false)
  }

  const { data, error } = await q
  if (error) throw error

  return (data ?? []) as AttachmentRow[]
}
