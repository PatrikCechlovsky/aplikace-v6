'use client'

/*
 * FILE: app/UI/DetailView.tsx
 * PURPOSE: Jednoduchý obal pro detail formuláře entity.
 *          Žádná demo hlavička ani spodní lišta – jen wrapper,
 *          který umí nést informaci o režimu (create/edit/view).
 */

import React from 'react'

export type DetailViewMode = 'create' | 'edit' | 'view'

export type DetailViewProps = {
  /** Režim formuláře (zatím jen informativně) */
  mode: DetailViewMode

  /** Má formulář neuložené změny? (pro budoucí použití) */
  isDirty?: boolean

  /** Probíhá ukládání (pro budoucí použití) */
  isSaving?: boolean

  /** Callback pro Uložit – řeší si konkrétní modul (nepoužito v UI) */
  onSave?: () => void

  /** Callback pro Zrušit / Zavřít – řeší si konkrétní modul (nepoužito v UI) */
  onCancel?: () => void

  /** Vlastní obsah formuláře (sekce jednotlivých modulů) */
  children?: React.ReactNode
}

export default function DetailView({ children }: DetailViewProps) {
  return <div className="detail-view">{children}</div>
}
