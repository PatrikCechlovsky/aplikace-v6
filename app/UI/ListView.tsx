'use client'

/*
 * FILE: app/UI/ListView.tsx
 * PURPOSE: Opakovatelný ListView vzor pro všechny přehledové seznamy.
 *          - filtr (input)
 *          - zaškrtávátko „Zobrazit archivované“
 *          - tabulka se záhlavím a řádky.
 *
 * POZNÁMKA:
 * - Vizuální "panel" (rámeček okolo celého listu) je řešen přes .listview (ListView.css).
 * - generic-type__* třídy zůstávají pro tabulku/buňky, aby se držel jednotný styl v app.
 */

import React from 'react'
import '@/app/styles/components/ListView.css'

export type ListViewColumn = {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
  width?: string
}

function toRow(u: UiUser): ListViewRow<UiUser> {
  return {
    id: u.id,
    data: {
      roleLabel: u.roleLabel,
      displayName: u.displayName,
      email: u.email,
      isArchived: u.isArchived ? 'Ano' : '',
    },
    raw: u,
  }
}

export type ListViewProps<TData = any> = {
  columns: ListViewColumn[]
  rows: ListViewRow<TData>[]

  /** Text ve filtru */
  filterValue: string
  /** Změna filtru */
  onFilterChange: (value: string) => void
  /** Placeholder filtru */
  filterPlaceholder?: string

  /** Stav přepínače „Zobrazit archivované“ */
  showArchived?: boolean
  /** Změna přepínače „Zobrazit archivované“ */
  onShowArchivedChange?: (value: boolean) => void
  /** Popisek vedle checkboxu */
  showArchivedLabel?: string

  /** Text, pokud nejsou žádné záznamy */
  emptyText?: string

  /** ID aktuálně vybraného řádku – pro podbarvení */
  selectedId?: string | number | null

  /** Klik na řádek – typicky pro nastavení selectedId v rodiči */
  onRowClick?: (row: ListViewRow<TData>) => void

  /** Dvojklik na řádek – typicky pro otevření detailu (celostránkově) */
  onRowDoubleClick?: (row: ListViewRow<TData>) => void
}

export default function ListView<TData = any>({
  columns,
  rows,
  filterPlaceholder = 'Hledat podle názvu, kódu nebo popisu...',
  filterValue,
  onFilterChange,
  showArchived = false,
  onShowArchivedChange,
  showArchivedLabel = 'Zobrazit archivované',
  emptyText = 'Žádné záznamy.',
  selectedId = null,
  onRowClick,
  onRowDoubleClick,
}: ListViewProps<TData>) {
  const hasCheckbox = typeof onShowArchivedChange === 'function'

  return (
    <div className="listview">
      {/* Horní lišta: filtr + zobrazit archivované */}
      <div className="listview__toolbar">
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
      <div className="listview__table-wrapper">
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
                <td className="generic-type__cell" colSpan={columns.length}>
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const isSelected = selectedId !== null && row.id === selectedId

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
                    onDoubleClick={() => onRowDoubleClick?.(row)}
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
