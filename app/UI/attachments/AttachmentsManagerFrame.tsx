'use client'

/**
 * FILE: app/UI/attachments/AttachmentsManagerFrame.tsx
 *
 * PURPOSE:
 * Samostatná obrazovka (screen/tile) pro plnou správu příloh:
 * - upload nové přílohy, nové verze, historie, edit metadat
 * - používá stejný core jako záložka u entity, ale v režimu "manager"
 *
 * EDGE-CASES:
 * - canManage=false => manager tile se otevře, ale UI je pouze read-only
 */

import React from 'react'
import DetailAttachmentsSection from '@/app/UI/detail-sections/DetailAttachmentsSection'

export type AttachmentsManagerFrameProps = {
  entityType: string
  entityId: string
  entityLabel?: string | null

  canManage?: boolean
  readOnlyReason?: string | null
}

export default function AttachmentsManagerFrame({
  entityType,
  entityId,
  entityLabel = null,
  canManage = true,
  readOnlyReason = null,
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
      />
    </div>
  )
}
