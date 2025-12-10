'use client'

/*
 * FILE: app/UI/ListView.tsx
 * PURPOSE: Opakovatelný ListView vzor pro všechny přehledové seznamy.
 *          Vizuálně vychází z horní části GenericTypeTile:
 *          - filtr (input)
 *          - zaškrtávátko „Zobrazit archivované“
 *          - tabulka se záhlavím a řádky.
 */

import React from 'react'

export type ListViewColumn = {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
  width?: string
}

export type ListViewRow<TData = any> = {
  id: string | number
  data: Record<string, React.ReactNode>
  className?: string
  raw?: TData
}

export type ListViewProps<TData = any> = {
  columns: ListViewColumn[]
  rows: ListViewRow<TData>[]
  filterPlaceholder?: string
  filterValue: string
  onFilterChange: (value: string) => void
  showArchived?: boolean
  onShowArchivedChange?: (value: boolean) => void
  showArchivedLabel?: string
  emptyText?: string
  selectedId?: string | number | null
  onRowClick?: (row: ListViewRow<TData>) => void
}

export default function ListView<TData = any>({
  columns,
  rows,
  filterPlaceholder = 'Hledat podle názvu, kódu nebo popisu...…',
  filterValue,
  onFilterChange,
  showArchived = false,
  onShowArchivedChange,
  showArchivedLabel = 'Zobrazit archivované',
  emptyText = 'Žádné záznamy.',
  selectedId = null,
  onRowClick,
}: ListViewProps<TData>) {
  const hasCheckbox = typeof onShowArchivedChange === 'function'

  return (
    <div className="generic-type__list">
      {/* Horní lišta: filtr + zobrazit archivované */}
      <div className="generic-type__list-toolbar">
        <input
          type="text"
          className="generic-type__filter-input"
          placeholder={filterPlaceholder}
          value={filterValue}
          onChange={(e) => onFilterChange(e.target.value)}
        />

        <div className="generic-type__list-toolbar-right">
          {hasCheckbox && (
            <label className="generic-type__checkbox-label">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => onShowArchivedChange?.(e.target.checked)}
              />
              <span>{showArchivedLabel}</span>
            </label>
          )}
        </div>
      </div>

      {/* Vlastní tabulka */}
      <div className="generic-type__table-wrapper">
        <table className="generic-type__table">
          <thead>
            <tr>
              {columns.map((col) => {
                const alignClass =
                  col.align === 'center'
                    ? 'generic-type__cell--center'
                    : col.align === 'right'
                    ? 'generic-type__cell--right'
                    : ''
                return (
                  <th
                    key={col.key}
                    className={['generic-type__cell', alignClass]
                      .filter(Boolean)
                      .join(' ')}
                    style={col.width ? { width: col.width } : undefined}
                  >
                    {col.label}
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr className="generic-type__row generic-type__row--empty">
                <td
                  className="generic-type__cell"
                  colSpan={columns.length}
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const isSelected =
                  selectedId !== null && row.id === selectedId

                const rowClassNames = [
                  'generic-type__row',
                  isSelected ? 'generic-type__row--selected' : '',
                  row.className ?? '',
                ]
                  .filter(Boolean)
                  .join(' ')

                return (
                  <tr
                    key={row.id}
                    className={rowClassNames}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((col) => {
                      const alignClass =
                        col.align === 'center'
                          ? 'generic-type__cell--center'
                          : col.align === 'right'
                          ? 'generic-type__cell--right'
                          : ''
                      return (
                        <td
                          key={col.key}
                          className={['generic-type__cell', alignClass]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          {row.data[col.key]}
                        </td>
                      )
                    })}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
