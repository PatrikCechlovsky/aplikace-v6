/*
 * FILE: app/UI/Breadcrumbs.tsx
 * PURPOSE: Drobečková navigace s optional ikonkami – jednoduchá verze
 */

'use client'

import { uiConfig } from '../lib/uiConfig'
import { getIcon } from './icons'

type Props = {
  disabled?: boolean
}

/**
 * Zatím jednoduchá verze:
 * - vždy zobrazuje "🏠 Dashboard / Domov"
 * - později ji rozšíříme na skutečnou cestu (modul / detail / atd.)
 * - žádný prop `segments` – jen `disabled`
 */
export default function Breadcrumbs({ disabled = false }: Props) {
  const showIcons = uiConfig.showBreadcrumbIcons

  return (
    <nav className={`breadcrumbs ${disabled ? 'is-disabled' : ''}`}>
      {showIcons && (
        <span style={{ marginRight: 6 }}>{getIcon('home')}</span>
      )}
      <span>Dashboard</span>
      <span style={{ margin: '0 4px' }}>/</span>
      <span>Domov</span>
    </nav>
  )
}
