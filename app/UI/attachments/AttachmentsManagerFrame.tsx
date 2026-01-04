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
import TileLayout from '@/app/UI/TileLayout'
import DetailAttachmentsSection, {
  type AttachmentsManagerApi,
  type AttachmentsManagerUiState,
} from '@/app/UI/detail-sections/DetailAttachmentsSection'

// ✅ re-export typů pro pohodlný import z UsersTile
export type { AttachmentsManagerApi, AttachmentsManagerUiState }

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
  const title = entityLabel ? `Správa příloh: ${entityLabel}` : 'Správa příloh'
  
  return (
    <TileLayout
      title={title}
      description="Toto je správa příloh (verze, upload, metadata). V detailu entity je záložka Přílohy vždy pouze read-only seznam."
    >
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
    </TileLayout>
  )
}
