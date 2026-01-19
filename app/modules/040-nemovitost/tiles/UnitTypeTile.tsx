'use client'

// FILE: app/modules/040-nemovitost/tiles/UnitTypeTile.tsx
// PURPOSE: Filtrovaný seznam jednotek podle typu

import React from 'react'
import UnitsTile from './UnitsTile'
import type { CommonActionId, ViewMode } from '@/app/UI/CommonActions'

type UnitTypeTileProps = {
  unitTypeCode?: string | null
  propertyId?: string | null
  status?: string | null
  onRegisterCommonActions?: (actions: CommonActionId[]) => void
  onRegisterCommonActionsState?: (state: { viewMode: ViewMode; hasSelection: boolean; isDirty: boolean }) => void
  onRegisterCommonActionHandler?: (fn: (id: CommonActionId) => void) => void
}

export default function UnitTypeTile(props: UnitTypeTileProps) {
  return <UnitsTile {...props} />
}
