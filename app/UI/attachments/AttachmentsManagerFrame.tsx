'use client'

/**
 * FILE: app/UI/attachments/AttachmentsManagerFrame.tsx
 *
 * PURPOSE:
 * Samostatná obrazovka (screen/tile) pro plnou správu příloh.
 *
 * PRAVIDLO:
 * - AttachmentsManagerFrame je pouze obal / screen.
 * - Všechny akce jsou přes CommonActions (nahoře v AppShell).
 * - Skutečný render a logika je v DetailAttachmentsSection (variant="manager").
 */

import React from 'react'
import DetailAttachmentsSection, {
  type AttachmentsManagerApi,
  type AttachmentsManagerUiState,
} from '@/app/UI/detail-sections/DetailAttachmentsSection'

export type AttachmentsManagerFrameProps = {
  entityType: string
  entityId: string
  entityLabel?: string | null

  canManage?: boolean
  readOnlyReason?: string | null

  // ✅ bridge do UsersTile (CommonActions)
  onRegisterManagerApi?: (api: AttachmentsManagerApi | null) => void
  onManagerStateChange?: (s: AttachmentsManagerUiState) => void
}

export default function AttachmentsManagerFrame({
  entityType,
  entityId,
  entityLabel = null,
  canManage = true,
  readOnlyReason = null,
  onRegisterManagerApi,
  onManagerStateChange,
}: AttachmentsManagerFrameProps) {
  return (
    <div className="detail-view__section">
      <div className="detail-form">
        <section className="detail-form__section">
          <h2 className="detail-form__section-title">Správa příloh</h2>
          <div className="detail-form__hint">
            Toto je správa příloh (verze, upload, metadata). V detailu entity je záložka Přílohy vždy pouze read-only seznam.
          </div>
        </section>
      </div>

      <DetailAttachmentsSection
        entityType={entityType}
        entityId={entityId}
        entityLabel={entityLabel}
        mode="view"
        variant="manager"
        canManage={canManage}
        readOnlyReason={readOnlyReason}
        onRegisterManagerApi={onRegisterManagerApi}
        onManagerStateChange={onManagerStateChange}
      />
    </div>
  )
}
