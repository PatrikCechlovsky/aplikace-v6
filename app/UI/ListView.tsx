'use client'

/*
 * FILE: app/UI/ListView.tsx
 * PURPOSE: Opakovatelný ListView vzor pro všechny přehledové seznamy.
 *          - filtr (input)
 *          - zaškrtávátko „Zobrazit archivované“
 *          - tabulka se záhlavím a řádky
 *          - (NEW) 3-stavové řazení přes klik na hlavičku sloupce
 */

import React from 'react'
import '@/app/styles/components/ListView.css'

// ============================================================================
// TYPES
// ============================================================================

export type ListViewSortDir = 'asc' | 'desc'

/**
 * null = bez řazení (ponecháš “původní pořadí” – typicky backend / uživatel)
 * jinak řadíš podle key + dir
 */
export type ListViewSortState = { key: string; dir: ListViewSortDir } | null

export type ListViewColumn = {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
  /** Šířka sloupce (doporučeno číslo v px, nebo string "180px") */
  width?: number | string
  /** Je sloupec řaditelný klikem v hlavičce */
  sortable?: boolean
}

export type ListViewRow<TData = any> = {
  /** Unikátní identifikátor řádku (pro výběr, klíč v Reactu…) */
  id: string | number
  /** Data pro jednotlivé buňky – klíče odpovídají columns[].key */
  data: Record<string, React.ReactNode>
  /** Volitelná extra CSS class pro řádek */
  className?: string
  /** Původní raw data – rodič si je může předat dál (např. do detailu) */
  raw?: TData
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

  /** (NEW) stav řazení */
  sort?: ListViewSortState
  /** (NEW) změna řazení */
  onSortChange?: (next: ListViewSortState) => void
}

// ============================================================================
// HELPERS
// ============================================================================

function getAlignClass(align?: 'left' | 'center' | 'right') {
  return align === 'center' ? 'generic-type__cell--center' : align === 'right' ? 'generic-type__cell--right' : ''
}

function getColStyle(w?: number | string): React.CSSProperties | undefined {
  if (w === undefined || w === null || w === '') return undefined
  const widthValue = typeof w === 'number' ? `${w}px` : w
  return { width: widthValue, minWidth: widthValue, maxWidth: widthValue }
}

function nextSortState(current: ListViewSortState | undefined, key: string): ListViewSortState {
  if (!current || current.key !== key) return { key, dir: 'asc' }
  if (current.dir === 'asc') return { key, dir: 'desc' }
  return null
}

function sortIndicator(current: ListViewSortState | undefined, key: string): string {
  if (!current || current.key !== key) return ''
  return current.dir === 'asc' ? '▲' : '▼'
}
// ============================================================================
// RENDER
// ============================================================================

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
  sort = null,
  onSortChange,
}: ListViewProps<TData>) {
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
          {typeof onShowArchivedChange === 'function' ? (
            <label className="generic-type__checkbox-label">
              <input type="checkbox" checked={showArchived} onChange={(e) => onShowArchivedChange?.(e.target.checked)} />
              <span>{showArchivedLabel}</span>
            </label>
          ) : (
            <div style={{ width: 180, height: 20 }} />
          )}
        </div>
      </div>

      {/* Vlastní tabulka (scroll = tady, aby sticky header fungoval) */}
      <div className="listview__table-wrapper">
        <table className="generic-type__table" style={{ tableLayout: 'fixed', width: '100%' }}>
          <thead>
            <tr>
              {columns.map((col) => {
                const alignClass = getAlignClass(col.align)
                const canSort = !!col.sortable && typeof onSortChange === 'function'
                const indicator = canSort ? sortIndicator(sort ?? undefined, col.key) : ''

                return (
                  <th
                    key={col.key}
                    className={['generic-type__cell', alignClass].filter(Boolean).join(' ')}
                    style={{
                      ...getColStyle(col.width),
                      cursor: canSort ? 'pointer' : undefined,
                      userSelect: canSort ? 'none' : undefined,
                    }}
                    onClick={() => {
                      if (!canSort) return
                      onSortChange?.(nextSortState(sort ?? undefined, col.key))
                    }}
                    title={canSort ? 'Klik: A–Z → Z–A → bez řazení' : undefined}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span>{col.label}</span>
                      {indicator ? <span aria-hidden="true">{indicator}</span> : null}
                    </span>
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

                const rowClassNames = ['generic-type__row', isSelected ? 'generic-type__row--selected' : '', row.className ?? '']
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
                      const alignClass = getAlignClass(col.align)
                      return (
                        <td
                          key={col.key}
                          className={['generic-type__cell', alignClass].filter(Boolean).join(' ')}
                          style={getColStyle(col.width)}
                        >
                          {row.data[col.key] ?? null}
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
