/*
 * FILE: app/UI/Breadcrumbs.tsx
 * PURPOSE: Drobečková navigace – ukazuje cestu podle segmentů z AppShellu
 */

'use client'

import { uiConfig } from '../lib/uiConfig'
import { getIcon } from './icons'
import type { IconKey } from './icons'

export type BreadcrumbSegment = {
  label: string
  icon?: IconKey
}

type Props = {
  disabled?: boolean
  segments?: BreadcrumbSegment[]
}

/**
 * Pokud nejsou segmenty předané, zobrazí fallback
 * "🏠 Dashboard / Domov" (původní chování).
 */
export default function Breadcrumbs({ disabled = false, segments }: Props) {
  const showIcons = uiConfig.showBreadcrumbIcons

  const effectiveSegments: BreadcrumbSegment[] =
    segments && segments.length > 0
      ? segments
      : [
          { label: 'Dashboard', icon: 'home' },
          { label: 'Domov' },
        ]

  return (
    <nav className={`breadcrumbs ${disabled ? 'is-disabled' : ''}`}>
      {effectiveSegments.map((seg, index) => (
        <span key={index} className="breadcrumbs__segment">
          {index > 0 && (
            <span className="breadcrumbs__separator"> / </span>
          )}

          {showIcons && seg.icon && (
            <span className="breadcrumbs__icon">
              {getIcon(seg.icon)}
            </span>
          )}

          <span className="breadcrumbs__label">{seg.label}</span>
        </span>
      ))}
    </nav>
  )
}
