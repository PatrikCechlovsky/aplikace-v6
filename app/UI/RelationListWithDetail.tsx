/*
 * FILE: app/UI/RelationListWithDetail.tsx
 * PURPOSE: Vzor záložky "vazby" – nahoře seznam, dole detail
 */

'use client'

import React from 'react'

export type RelationItem = {
  id: string | number
  primary: React.ReactNode      // hlavní text (např. "Byt 2+kk")
  secondary?: React.ReactNode   // podtext (např. "2. patro, 55 m²")
  badge?: React.ReactNode       // štítek (např. "AKTIVNÍ", "UKONČENÁ")
}

type Props = {
  title: string
  items: RelationItem[]
  selectedId: string | number | null
  onSelect: (id: string | number) => void
  emptyText?: string
  children?: React.ReactNode // sem se vloží detail entity vazby
}

export default function RelationListWithDetail({
  title,
  items,
  selectedId,
  onSelect,
  emptyText = 'Tato entita nemá data v této kategorii.',
  children,
}: Props) {
  const hasItems = items.length > 0

  return (
    <div className="relation-pane">
      <div className="relation-pane__list">
        <div className="relation-pane__header">{title}</div>

        {!hasItems && (
          <div className="relation-pane__empty">{emptyText}</div>
        )}

        {hasItems && (
          <ul className="relation-pane__list-inner">
            {items.slice(0, 8).map((item) => {
              const active = item.id === selectedId
              return (
                <li
                  key={item.id}
                  className={
                    'relation-pane__item' + (active ? ' relation-pane__item--active' : '')
                  }
                  onClick={() => onSelect(item.id)}
                >
                  <div className="relation-pane__item-main">
                    <span className="relation-pane__item-primary">
                      {item.primary}
                    </span>
                    {item.badge && (
                      <span className="relation-pane__item-badge">{item.badge}</span>
                    )}
                  </div>
                  {item.secondary && (
                    <div className="relation-pane__item-secondary">
                      {item.secondary}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="relation-pane__detail">
        {hasItems && selectedId == null && (
          <div className="relation-pane__empty">
            Vyber položku ze seznamu nahoře.
          </div>
        )}

        {hasItems && selectedId != null && children}

        {!hasItems && null}
      </div>
    </div>
  )
}
