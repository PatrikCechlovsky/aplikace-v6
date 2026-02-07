'use client'

// FILE: app/modules/040-nemovitost/tiles/EquipmentTypeTile.tsx
// PURPOSE: Filtrovaný přehled vybavení podle typu (např. jen Kuchyňské spotřebiče)
// PATTERN: Factory pattern - stejný jako PropertyTypeTile a UnitTypeTile

import React from 'react'
import EquipmentCatalogTile from './EquipmentCatalogTile'
import type { CommonActionId, ViewMode } from '@/app/UI/CommonActions'

type Props = {
  equipmentTypeCode: string // kuchyne, koupelna, vytapeni, atd.
  onRegisterCommonActions?: (actions: CommonActionId[]) => void
  onRegisterCommonActionsState?: (state: { viewMode: ViewMode; hasSelection: boolean; isDirty: boolean }) => void
  onRegisterCommonActionHandler?: (fn: ((id: CommonActionId) => void) | null) => void
  onNavigate?: (tileId: string) => void
}

/**
 * Factory-wrapped tile that filters equipment catalog by equipment_type
 * Used in module.config.js to create type-specific tiles
 */
export default function EquipmentTypeTile({ 
  equipmentTypeCode,
  ...restProps 
}: Props) {
  // Prostě deleguje na EquipmentCatalogTile s filtrovaným equipment_type
  // Filter je aplikován v URL nebo přes prop
  
  return (
    <EquipmentCatalogTile
      {...restProps}
      equipmentTypeFilter={equipmentTypeCode}
    />
  )
}
