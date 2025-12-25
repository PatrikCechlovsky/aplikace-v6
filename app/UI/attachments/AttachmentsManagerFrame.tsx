'use client'

// FILE: app/UI/attachments/AttachmentsManagerFrame.tsx
// Full attachments manager screen with CommonActions-controlled close + internal UI for versions/history.

import React from 'react'
import DetailAttachmentsSection from '@/app/UI/detail-sections/DetailAttachmentsSection'

export type AttachmentsManagerFrameProps = {
  entityType: string
  entityId: string
  entityLabel?: string | null
}

export default function AttachmentsManagerFrame({ entityType, entityId, entityLabel = null }: AttachmentsManagerFrameProps) {
  return (
    <div className="detail-form">
      <section className="detail-form__section">
        <h2 className="detail-form__section-title">Správa příloh</h2>
        <div className="detail-form__hint">
          Zde je plná správa verzí, historie a metadat. (Záložka u entity je jen read-only seznam.)
        </div>
      </section>

      <DetailAttachmentsSection entityType={entityType} entityId={entityId} entityLabel={entityLabel} mode="view" />
    </div>
  )
}
