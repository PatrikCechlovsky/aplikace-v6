/*
 * FILE: app/lib/attachments.ts
 * PURPOSE:
 *   Data layer pro sekci „Přílohy“ v DetailView (kontext entity).
 *
 * CONTEXT:
 *   - používá tabulky `documents` + `document_versions`
 *   - pro přehled v UI čteme přes view `v_document_latest_version`
 *
 * CURRENT STATE (KROK 3):
 *   - pouze READ: načtení příloh pro konkrétní entitu
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

// NOTE: Používáme stejný vzor jako ve tvém UserDetailFrame (client-side createClient).
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type AttachmentRow = {
  id: string
  entity_type: string
  entity_id: string
  title: string
  description: string | null
  is_archived: boolean
  created_at: string

  // z view "v_document_latest_version"
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
