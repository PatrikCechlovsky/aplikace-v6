'use client'

// FILE: app/modules/030-pronajimatel/tiles/TenantTypeTile.tsx
// PURPOSE: Wrapper pro TenantsTile s přednastaveným filtrem podle typu subjektu
// Používá se pro zobrazení seznamů podle typů (Firma (4), Osoba (3), atd.)

import React from 'react'
import TenantsTile from './TenantsTile'
import type { CommonActionId, ViewMode } from '@/app/UI/CommonActions'

type Props = {
  subjectType: string // 'osoba' | 'osvc' | 'firma' | 'spolek' | 'statni' | 'zastupce'
  onRegisterCommonActions?: (actions: CommonActionId[]) => void
  onRegisterCommonActionsState?: (state: { viewMode: ViewMode; hasSelection: boolean; isDirty: boolean }) => void
  onRegisterCommonActionHandler?: (fn: (id: CommonActionId) => void) => void
}

/**
 * Wrapper komponenta, která předá subjectType do TenantsTile jako přednastavený filtr.
 * TenantsTile se pak automaticky filtruje podle tohoto typu.
 */
export default function TenantTypeTile({ subjectType, ...props }: Props) {
  // TenantsTile už podporuje filtrování podle subjectType z URL parametrů
  // Stačí mu předat subjectType jako prop a on si ho načte z URL nebo použije přednastavený
  return <TenantsTile subjectTypeFilter={subjectType} {...props} />
}

