// FILE: app/lib/attachments/attachmentsManagerUtils.ts
// PURPOSE: Centrální utility funkce pro AttachmentsManager integraci v Tiles
// NOTES: Eliminuje duplicitu 160+ řádků kódu v každém modulu

import type { CommonActionId, ViewMode } from '@/app/UI/CommonActions'
import type { AttachmentsManagerUiState } from '@/app/UI/detail-sections/DetailAttachmentsSection'

/**
 * Vrátí CommonActions pro attachments-manager režim podle mode a hasSelection
 */
export function getAttachmentsManagerActions(
  mode: 'list' | 'read' | 'edit' | 'new',
  hasSelection: boolean
): CommonActionId[] {
  if (mode === 'new') {
    return ['save', 'close']
  }
  
  if (mode === 'edit') {
    return ['save', 'attachmentsNewVersion', 'close']
  }
  
  if (mode === 'read') {
    return ['edit', 'attachmentsNewVersion', 'close']
  }
  
  // mode === 'list'
  const actions: CommonActionId[] = ['add']
  if (hasSelection) {
    actions.push('view', 'edit')
  }
  actions.push('attachmentsNewVersion', 'columnSettings', 'close')
  return actions
}

/**
 * Namapuje LocalViewMode + attachments mode na ViewMode pro CommonActions
 */
export function mapAttachmentsViewMode(
  viewMode: 'list' | 'read' | 'edit' | 'create' | 'attachments-manager',
  attachmentsMode: 'list' | 'read' | 'edit' | 'new'
): ViewMode {
  if (viewMode === 'list') return 'list'
  if (viewMode === 'edit') return 'edit'
  if (viewMode === 'create') return 'create'
  
  if (viewMode === 'attachments-manager') {
    // Mapuj podle mode attachments manageru
    if (attachmentsMode === 'list') return 'list'
    if (attachmentsMode === 'edit') return 'edit'
    if (attachmentsMode === 'new') return 'create'
    return 'read' // attachmentsMode === 'read'
  }
  
  return 'read'
}

/**
 * Zjistí, jestli má být hasSelection true nebo false
 */
export function getHasSelection(
  viewMode: 'list' | 'read' | 'edit' | 'create' | 'attachments-manager',
  selectedId: string | null,
  attachmentsManagerUi: AttachmentsManagerUiState
): boolean {
  if (viewMode === 'attachments-manager') {
    return !!attachmentsManagerUi.hasSelection
  }
  return !!selectedId
}

/**
 * Zjistí, jestli má být isDirty true nebo false
 */
export function getIsDirty(
  viewMode: 'list' | 'read' | 'edit' | 'create' | 'attachments-manager',
  isDirty: boolean,
  attachmentsManagerUi: AttachmentsManagerUiState
): boolean {
  if (viewMode === 'attachments-manager') {
    return !!attachmentsManagerUi.isDirty
  }
  return isDirty
}

/**
 * Určí, jestli close button má zavřít celý attachments manager nebo jen aktuální panel
 * @returns true = zavři jen panel (vrať se do list mode), false = zavři celý manager
 */
export function shouldCloseAttachmentsPanel(
  mode: 'list' | 'read' | 'edit' | 'new'
): boolean {
  // V read/edit/new mode zavři jen panel, v list mode zavři celý manager
  return mode === 'read' || mode === 'edit' || mode === 'new'
}
