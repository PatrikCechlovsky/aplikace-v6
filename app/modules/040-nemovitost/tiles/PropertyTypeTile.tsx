'use client'

// FILE: app/modules/040-nemovitost/tiles/PropertyTypeTile.tsx
// PURPOSE: Filtrovaný seznam nemovitostí podle typu

import React from 'react'
import PropertiesTile from './PropertiesTile'
import type { CommonActionId, ViewMode } from '@/app/UI/CommonActions'

type PropertyTypeTileProps = {
  propertyTypeCode?: string | null
  onRegisterCommonActions?: (actions: CommonActionId[]) => void
  onRegisterCommonActionsState?: (state: { viewMode: ViewMode; hasSelection: boolean; isDirty: boolean }) => void
  onRegisterCommonActionHandler?: (fn: ((id: CommonActionId) => void) | null) => void
}

export default function PropertyTypeTile(props: PropertyTypeTileProps) {
  return <PropertiesTile {...props} />
}
