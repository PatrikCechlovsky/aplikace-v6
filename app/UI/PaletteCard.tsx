// FILE: app/UI/PaletteCard.tsx
// PURPOSE: Reusable dlaždice pro výběr nastavení (témata, vzhled, atd.)
// Použití: Dashboard, modul 900 (nastavení), další místa kde je potřeba výběr z možností

'use client'

import React from 'react'
import '@/app/styles/components/PaletteCard.css'

export interface PaletteCardProps {
  title: string
  description?: string
  selected?: boolean
  onSelect?: () => void
  disabled?: boolean
  preview?: React.ReactNode // Volitelné preview (např. barevné kolečka)
  badge?: string // Volitelný badge (např. "Aktivní")
}

/**
 * Reusable dlaždice pro výběr nastavení.
 * Fixní šířka: 180px (může se přizpůsobit gridu)
 */
export default function PaletteCard({
  title,
  description,
  selected = false,
  onSelect,
  disabled = false,
  preview,
  badge,
}: PaletteCardProps) {
  const handleClick = () => {
    if (!disabled && onSelect) {
      onSelect()
    }
  }

  return (
    <button
      type="button"
      className={`palette-card ${selected ? 'palette-card--active' : ''} ${disabled ? 'palette-card--disabled' : ''}`}
      onClick={handleClick}
      disabled={disabled}
      aria-pressed={selected}
    >
      <div className="palette-card__header">
        <span className="palette-card__title">{title}</span>
        {(selected && badge) || badge ? (
          <span className="palette-card__badge">{badge || (selected ? 'Aktivní' : '')}</span>
        ) : null}
      </div>

      {description ? <p className="palette-card__description">{description}</p> : null}

      {preview ? <div className="palette-card__preview">{preview}</div> : null}
    </button>
  )
}

