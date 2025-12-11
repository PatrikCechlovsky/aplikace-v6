/*
 * FILE: app/UI/EntityDetailFrame.tsx
 * PURPOSE: Vzor hlavní karty detailu entity.
 *          Zjednodušená verze: levý blok = obsah, žádný pravý sloupec.
 */

'use client'

import React from 'react'

type Props = {
  /** Volitelný nadpis entity (můžeme používat jen v některých modulech) */
  title?: string
  /** Volitelný podtitulek (např. e-mail, kód…) */
  subtitle?: string
  /** Vlastní obsah detailu (sekce formuláře) */
  children?: React.ReactNode
}

export default function EntityDetailFrame({ title, subtitle, children }: Props) {
  return (
    <div className="entity-detail">
      {(title || subtitle) && (
        <div className="entity-detail__header">
          <div>
            {title && <h2 className="entity-detail__title">{title}</h2>}
            {subtitle && (
              <div className="entity-detail__subtitle">{subtitle}</div>
            )}
          </div>
        </div>
      )}

      <div className="entity-detail__body">
        <div className="entity-detail__main">{children}</div>
      </div>
    </div>
  )
}
