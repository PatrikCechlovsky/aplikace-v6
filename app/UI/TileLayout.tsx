'use client'

/**
 * FILE: app/UI/TileLayout.tsx
 * PURPOSE: Jednotný layout pattern pro všechny tiles a formuláře
 * 
 * Struktura:
 * - .tile-layout (wrapper)
 *   - .tile-layout__header (nadpis + popis, bez pozadí)
 *   - .tile-layout__content (tabulka/formulář, s theme pozadím)
 */

import React from 'react'
import '@/app/styles/components/TileLayout.css'

type Props = {
  title: string
  description?: string | null
  children: React.ReactNode
}

export default function TileLayout({ title, description, children }: Props) {
  return (
    <div className="tile-layout">
      <div className="tile-layout__header">
        <h1 className="tile-layout__title">{title}</h1>
        {description && <p className="tile-layout__description">{description}</p>}
      </div>
      <div className="tile-layout__content">{children}</div>
    </div>
  )
}

