'use client'

// FILE: app/modules/800-subjekty/tiles/SubjectTypeTile.tsx
// PURPOSE: Wrapper pro SubjectsTile s přednastaveným filtrem podle typu subjektu
// NOTES: Používá se pro zobrazení seznamů podle typů (Firma (4), Osoba (3), atd.)

import React from 'react'
import SubjectsTile from './SubjectsTile'
import type { CommonActionId, ViewMode } from '@/app/UI/CommonActions'

type Props = {
  subjectType: string // 'osoba' | 'osvc' | 'firma' | 'spolek' | 'statni' | 'zastupce'
  onRegisterCommonActions?: (actions: CommonActionId[]) => void
  onRegisterCommonActionsState?: (state: { viewMode: ViewMode; hasSelection: boolean; isDirty: boolean }) => void
  onRegisterCommonActionHandler?: (fn: ((id: CommonActionId) => void) | null) => void
}

/**
 * Wrapper komponenta, která předá subjectType do SubjectsTile jako přednastavený filtr.
 * SubjectsTile se pak automaticky filtruje podle tohoto typu.
 */
export default function SubjectTypeTile({ subjectType, ...props }: Props) {
  return <SubjectsTile subjectTypeFilter={subjectType} {...props} />
}
