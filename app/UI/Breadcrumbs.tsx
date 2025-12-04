/*
 * FILE: app/UI/Breadcrumbs.tsx
 * PURPOSE: Drobečková navigace s libovolným počtem úrovní
 */

'use client'

import { uiConfig } from '../lib/uiConfig'
import { getIcon, IconKey } from './icons'

export type BreadcrumbSegment = {
  id: string
  label: string
  iconKey?: IconKey
}

type Props = {
  disabled?: boolean
  segments: BreadcrumbSegment[]
}

export default function Breadcrumbs({ disabled = false, segments }: Props) {
  const showIcons = uiConfig.showBreadcrumbIcons

  if (!segments || segments.length === 0) {
    return null
  }

  return (
    <nav className={`breadcrumbs ${disabled ? 'is-disabled' : ''}`}>
      {segments.map((seg, index) => (
        <span key={seg.id} className="breadcrumbs__item">
          {index > 0 && (
            <span className="breadcrumbs__separator">›</span>
          )}
          {showIcons && seg.iconKey && (
            <span className="breadcrumbs__icon">
              {getIcon(seg.iconKey)}
            </span>
          )}
          <span className="breadcrumbs__label">{seg.label}</span>
        </span>
      ))}
    </nav>
  )
}
