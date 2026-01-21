// FILE: app/UI/attachments/AttachmentsManagerTile.tsx
// PURPOSE: Univerzální tile pro správu příloh jakékoliv entity s vlastní CommonActions logikou
// NOTES: Používá se ve všech modulech místo duplicitní logiky v každém Tile

'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import TileLayout from '@/app/UI/TileLayout'
import DetailAttachmentsSection, {
  type AttachmentsManagerApi,
  type AttachmentsManagerUiState,
} from '@/app/UI/detail-sections/DetailAttachmentsSection'
import type { CommonActionId, ViewMode } from '@/app/UI/CommonActions'

export type AttachmentsManagerTileProps = {
  /** Typ entity (landlords, properties, units, tenants, ...) */
  entityType: string
  
  /** ID entity */
  entityId: string
  
  /** Popisek entity (zobrazí se v titulku) */
  entityLabel?: string | null
  
  /** Callback pro zavření manageru (vrací se do entity) */
  onClose: () => void
  
  /** Callback pro registraci CommonActions */
  onRegisterCommonActions?: (actions: CommonActionId[]) => void
  
  /** Callback pro registraci stavu CommonActions */
  onRegisterCommonActionsState?: (state: { viewMode: ViewMode; hasSelection: boolean; isDirty: boolean }) => void
  
  /** Callback pro registraci handleru CommonActions */
  onRegisterCommonActionHandler?: (handler: ((actionId: CommonActionId) => void) | null) => void
}

type LocalViewMode = 'list' | 'read' | 'edit' | 'new'

/**
 * AttachmentsManagerTile - univerzální správa příloh
 * 
 * CommonActions pattern:
 * - list (prázdný): add, columnSettings, close
 * - list (s výběrem): view, edit, columnSettings, close
 * - read: edit, attachmentsNewVersion, close
 * - edit: save, attachmentsNewVersion, close
 * - new: save, close
 * 
 * Zavřít znamená:
 * - v read/edit/new režimu: zavřít detail a vrátit se do list
 * - v list režimu: zavřít celý manager a vrátit se do entity
 */
export default function AttachmentsManagerTile({
  entityType,
  entityId,
  entityLabel = null,
  onClose,
  onRegisterCommonActions,
  onRegisterCommonActionsState,
  onRegisterCommonActionHandler,
}: AttachmentsManagerTileProps) {
  const [localViewMode, setLocalViewMode] = useState<LocalViewMode>('list')
  const [hasSelection, setHasSelection] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  const attachmentsApiRef = useRef<AttachmentsManagerApi | null>(null)

  // ============================================================================
  // CALLBACKS FROM DetailAttachmentsSection
  // ============================================================================
  
  const handleRegisterManagerApi = useCallback((api: AttachmentsManagerApi | null) => {
    attachmentsApiRef.current = api
  }, [])

  const handleManagerStateChange = useCallback((state: AttachmentsManagerUiState) => {
    setLocalViewMode(state.mode)
    setHasSelection(state.hasSelection)
    setIsDirty(state.isDirty)
  }, [])

  // ============================================================================
  // COMMON ACTIONS DEFINITION
  // ============================================================================
  
  useEffect(() => {
    if (!onRegisterCommonActions || !onRegisterCommonActionsState) return

    const actions: CommonActionId[] = []

    // LIST MODE (prázdný)
    if (localViewMode === 'list' && !hasSelection) {
      actions.push('add', 'columnSettings', 'close')
    }
    // LIST MODE (s výběrem)
    else if (localViewMode === 'list' && hasSelection) {
      actions.push('view', 'edit', 'columnSettings', 'close')
    }
    // READ MODE
    else if (localViewMode === 'read') {
      actions.push('edit', 'attachmentsNewVersion', 'close')
    }
    // EDIT MODE
    else if (localViewMode === 'edit') {
      actions.push('save', 'attachmentsNewVersion', 'close')
    }
    // NEW MODE
    else if (localViewMode === 'new') {
      actions.push('save', 'close')
    }

    onRegisterCommonActions(actions)
    onRegisterCommonActionsState({
      viewMode: (localViewMode === 'new' ? 'create' : localViewMode === 'list' ? 'list' : localViewMode) as ViewMode,
      hasSelection,
      isDirty,
    })
  }, [localViewMode, hasSelection, isDirty])
  // POZNÁMKA: onRegisterCommonActions a onRegisterCommonActionsState NEJSOU v dependencies!
  // Jsou stabilní (useCallback v AppShell), ale jejich přidání do dependencies způsobuje problémy.

  // ============================================================================
  // REGISTRACE COMMON ACTIONS HANDLER
  // ============================================================================
  
  useEffect(() => {
    if (!onRegisterCommonActionHandler) return

    // Handler pro CommonActions
    const handler = (actionId: CommonActionId) => {
      const api = attachmentsApiRef.current
      if (!api) return

      switch (actionId) {
        case 'add':
          api.add()
          break
        case 'view':
          api.view()
          break
        case 'edit':
          api.edit()
          break
        case 'save':
          void api.save()
          break
        case 'attachmentsNewVersion':
          api.newVersion()
          break
        case 'columnSettings':
          api.columnSettings()
          break
        case 'close':
          if (localViewMode === 'list') {
            // Zavřít celý manager → vrátit se do entity
            onClose()
          } else {
            // Zavřít detail → vrátit se do list
            api.close()
          }
          break
      }
    }

    onRegisterCommonActionHandler(handler)
    return () => onRegisterCommonActionHandler(null)
  }, [localViewMode, onClose])
  // POZNÁMKA: onRegisterCommonActionHandler NENÍ v dependencies!
  // Je stabilní (useCallback v AppShell), ale jeho přidání do dependencies způsobuje problémy.

  // ============================================================================
  // RENDER
  // ============================================================================
  
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
        canManage={true}
        onRegisterManagerApi={handleRegisterManagerApi}
        onManagerStateChange={handleManagerStateChange}
      />
    </TileLayout>
  )
}
