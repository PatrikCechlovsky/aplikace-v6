// FILE: app/UI/DetailTabs.tsx
// PURPOSE: Jednoduché "ouška" (tabs) pro přepínání sekcí v DetailView.
//          Čistě UI navigace – žádná znalost dat.

'use client'

import React from 'react'

export type DetailTabItem = {
  id: string
  label: string
  icon?: React.ReactNode
  disabled?: boolean
  count?: number
}

type Props = {
  items: DetailTabItem[]
  activeId: string
  onChange: (id: string) => void
  ariaLabel?: string
}

export default function DetailTabs({
  items,
  activeId,
  onChange,
  ariaLabel = 'Sekce detailu',
}: Props) {
  return (
    <nav className="detail-tabs" aria-label={ariaLabel}>
      <div className="detail-tabs__rail" role="tablist">
        {items.map((it) => {
          const isActive = it.id === activeId
          const displayLabel = typeof it.count === 'number' ? `${it.label} (${it.count})` : it.label
          return (
            <button
              key={it.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`detail-section-${it.id}`}
              disabled={!!it.disabled}
              className={
                isActive ? 'detail-tabs__tab is-active' : 'detail-tabs__tab'
              }
              onClick={() => onChange(it.id)}
            >
              {it.icon && <span className="detail-tabs__icon">{it.icon}</span>}
              <span className="detail-tabs__label">{displayLabel}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
