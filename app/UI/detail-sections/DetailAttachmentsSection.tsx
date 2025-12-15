/*
 * FILE: app/UI/detail-sections/DetailAttachmentsSection.tsx
 * PURPOSE:
 *   UI sekce „Přílohy“ pro DetailView.
 *   Povinná součást každého detailu entity (uživatel, nemovitost, smlouva, …).
 *
 * CONTEXT:
 *   - Sekce je renderována z DetailView (sekce id: 'attachments')
 *   - Neřeší žádné akce (upload, archivace, verze)
 *   - Akce budou řízeny přes CommonActions / horní lištu
 *
 * CURRENT STATE (KROK 1):
 *   - pouze skeleton / placeholder
 *   - žádné napojení na Supabase
 *   - žádná lokální tlačítka
 *
 * NEXT STEPS:
 *   - KROK 2: napojení do DetailView přes ctx (entityType, entityId, mode)
 *   - KROK 3: data layer (documents, document_versions)
 */

'use client'

import React from 'react'

export type DetailAttachmentsSectionProps = {
  /** Typ entity (např. 'user', 'property', 'contract') */
  entityType: string

  /** ID entity */
  entityId: string

  /** Režim detailu */
  mode: 'view' | 'edit' | 'create'
}

export default function DetailAttachmentsSection({
  entityType,
  entityId,
  mode,
}: DetailAttachmentsSectionProps) {
  return (
    <div className="detail-view__section">
      <div className="detail-view__placeholder">
        Přílohy pro entitu <strong>{entityType}</strong> (
        <code>{entityId}</code>)<br />
        Režim: <strong>{mode}</strong>
        <br />
        <br />
        Sekce je připravena – logika načítání dokumentů, verzí a archivace
        bude doplněna v dalších krocích.
      </div>
    </div>
  )
}
