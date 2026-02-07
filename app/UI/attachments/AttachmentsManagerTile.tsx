// FILE: app/UI/attachments/AttachmentsManagerTile.tsx
// PURPOSE: Univerzální tile pro správu příloh jakékoliv entity - vystavuje API pro parent
// NOTES: Stejný pattern jako AttachmentsManagerFrame - parent registruje CommonActions

'use client'

import React from 'react'
import TileLayout from '@/app/UI/TileLayout'
import DetailAttachmentsSection, {
  type AttachmentsManagerApi,
  type AttachmentsManagerUiState,
} from '@/app/UI/detail-sections/DetailAttachmentsSection'

// ✅ re-export typů pro pohodlný import z parent Tiles
export type { AttachmentsManagerApi, AttachmentsManagerUiState }

export type AttachmentsManagerTileProps = {
  /** Typ entity (landlords, properties, units, tenants, ...) */
  entityType: string
  
  /** ID entity */
  entityId: string
  
  /** Popisek entity (zobrazí se v titulku) */
  entityLabel?: string | null
  
  /** Oprávnění ke správě příloh */
  canManage?: boolean
  
  /** Důvod read-only režimu */
  readOnlyReason?: string | null
  
  /** ✅ Bridge do parent Tile (CommonActions) - vystavuje API pro akce */
  onRegisterManagerApi?: (api: AttachmentsManagerApi | null) => void
  
  /** ✅ Bridge do parent Tile (CommonActions) - vystavuje stav pro registraci actions */
  onManagerStateChange?: (state: AttachmentsManagerUiState) => void
}

/**
 * AttachmentsManagerTile - univerzální správa příloh
 * 
 * PRAVIDLO:
 * - AttachmentsManagerTile je pouze obal / screen.
 * - Všechny CommonActions jsou přes parent (stejně jako AttachmentsManagerFrame).
 * - Skutečný render a logika je v DetailAttachmentsSection (variant="manager").
 * - Parent registruje CommonActions na základě state z onManagerStateChange.
 * - Parent volá akce přes API z onRegisterManagerApi.
 */
export default function AttachmentsManagerTile({
  entityType,
  entityId,
  entityLabel = null,
  canManage = true,
  readOnlyReason = null,
  onRegisterManagerApi,
  onManagerStateChange,
}: AttachmentsManagerTileProps) {
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
