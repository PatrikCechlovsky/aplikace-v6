/*
 * FILE: app/UI/EntityList.tsx
 * PURPOSE: Vzor přehledu entit v modulu (seznam entit)
 */

'use client'

import React from 'react'

export type EntityListColumn = {
  key: string
  label: string
  width?: string
  align?: 'left' | 'right' | 'center'
}

export type EntityListRow = {
  id: string | number
  typeColor?: string // barva levého proužku podle typu entity
  data: Record<string, React.ReactNode>
}

type Props = {
  columns: EntityListColumn[]
  rows: EntityListRow[]
  loading?: boolean
  onRowDoubleClick?: (row: EntityListRow) => void
  onRowClick?: (row: EntityListRow) => void
  emptyText?: string
}

export default function EntityList({
  columns,
  rows,
  loading = false,
  onRowDoubleClick,
  onRowClick,
  emptyText = 'Žádné záznamy k zobrazení.',
}: Props) {
  return (
    <div className="entity-list">
      <div className="entity-list__header-row">
        <div className="entity-list__type-col" />
        {columns.map((col) => (
          <div
            key={col.key}
            className="entity-list__cell entity-list__cell--header"
            style={{ width: col.width }}
          >
            {col.label}
          </div>
        ))}
      </div>

      {loading && <div className="entity-list__empty">Načítání…</div>}

      {!loading && rows.length === 0 && (
        <div className="entity-list__empty">{emptyText}</div>
      )}

      {!loading &&
        rows.map((row) => (
          <div
            key={row.id}
            className="entity-list__row"
            onDoubleClick={() => onRowDoubleClick?.(row)}
            onClick={() => onRowClick?.(row)}
          >
            <div
              className="entity-list__type-col"
              style={{
                backgroundColor: row.typeColor ?? '#e5e7eb',
              }}
            />
            {columns.map((col) => (
              <div
                key={col.key}
                className="entity-list__cell"
                style={{ width: col.width, textAlign: col.align ?? 'left' }}
              >
                {row.data[col.key]}
              </div>
            ))}
          </div>
        ))}
    </div>
  )
}
