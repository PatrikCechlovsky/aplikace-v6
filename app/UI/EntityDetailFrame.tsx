/*
 * FILE: app/UI/EntityDetailFrame.tsx
 * PURPOSE: Vzor hlavní karty detailu entity (form + sekce + přílohy + systém)
 */

'use client'

import React from 'react'

type Props = {
  title: string
  subtitle?: string
  children?: React.ReactNode
  attachmentsSlot?: React.ReactNode
  systemInfoSlot?: React.ReactNode
}

export default function EntityDetailFrame({
  title,
  subtitle,
  children,
  attachmentsSlot,
  systemInfoSlot,
}: Props) {
  return (
    <div className="entity-detail">
      <div className="entity-detail__header">
        <div>
          <h2 className="entity-detail__title">{title}</h2>
          {subtitle && (
            <div className="entity-detail__subtitle">{subtitle}</div>
          )}
        </div>
      </div>

      <div className="entity-detail__body">
        <div className="entity-detail__main">{children}</div>
        <div className="entity-detail__side">
          <div className="entity-detail__section">
            <div className="entity-detail__section-title">Přílohy</div>
            {attachmentsSlot ?? (
              <div className="entity-detail__section-empty">
                Zatím žádné přílohy.
              </div>
            )}
          </div>
          <div className="entity-detail__section">
            <div className="entity-detail__section-title">Systém</div>
            {systemInfoSlot ?? (
              <div className="entity-detail__section-empty">
                Systémové informace budou doplněny.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
