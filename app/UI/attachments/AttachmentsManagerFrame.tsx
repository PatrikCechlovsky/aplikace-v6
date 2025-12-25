'use client'

/**
 * FILE: app/UI/attachments/AttachmentsManagerFrame.tsx
 *
 * PURPOSE:
 * Samostatná obrazovka (screen/tile) pro plnou správu příloh:
 * - upload nové přílohy, nové verze, historie, edit metadat
 * - používá stejný core jako záložka u entity, ale v režimu "manager"
 */

import React from 'react'
import DetailAttachmentsSection from '@/app/UI/detail-sections/DetailAttachmentsSection'

export type AttachmentsManagerFrameProps = {
  entityType: string
  entityId: string
  entityLabel?: string | null
}

export default function AttachmentsManagerFrame({ entityType, entityId, entityLabel = null }: AttachmentsManagerFrameProps) {
  return (
    <div className="detail-view__section">
      <div className="detail-form">
        <section className="detail-form__section">
          <h2 className="detail-form__section-title">Správa příloh</h2>
          <div className="detail-form__hint">
            Toto je plná správa příloh (verze, historie, upload, metadata). V detailu entity je záložka Přílohy pouze read-only seznam.
          </div>
        </section>
      </div>

      <DetailAttachmentsSection
        entityType={entityType}
        entityId={entityId}
        entityLabel={entityLabel}
        mode="view"
        variant="manager"
      />
    </div>
  )
}
