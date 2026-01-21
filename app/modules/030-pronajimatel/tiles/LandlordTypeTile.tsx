'use client'

// FILE: app/modules/030-pronajimatel/tiles/LandlordTypeTile.tsx
// PURPOSE: Wrapper pro LandlordsTile s přednastaveným filtrem podle typu subjektu
// Používá se pro zobrazení seznamů podle typů (Firma (4), Osoba (3), atd.)

import React from 'react'
import LandlordsTile from './LandlordsTile'
import type { CommonActionId, ViewMode } from '@/app/UI/CommonActions'

type Props = {
  subjectType: string // 'osoba' | 'osvc' | 'firma' | 'spolek' | 'statni' | 'zastupce'
  onRegisterCommonActions?: (actions: CommonActionId[]) => void
  onRegisterCommonActionsState?: (state: { viewMode: ViewMode; hasSelection: boolean; isDirty: boolean }) => void
  onRegisterCommonActionHandler?: (fn: ((id: CommonActionId) => void) | null) => void
}

/**
 * Wrapper komponenta, která předá subjectType do LandlordsTile jako přednastavený filtr.
 * LandlordsTile se pak automaticky filtruje podle tohoto typu.
 */
export default function LandlordTypeTile({ subjectType, ...props }: Props) {
  // LandlordsTile už podporuje filtrování podle subjectType z URL parametrů
  // Stačí mu předat subjectType jako prop a on si ho načte z URL nebo použije přednastavený
  return <LandlordsTile subjectTypeFilter={subjectType} {...props} />
}

