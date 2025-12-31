'use client'

/*
 * FILE: app/UI/ListView.tsx
 * PURPOSE: Opakovatelný ListView vzor pro všechny přehledové seznamy.
 *          - filtr (input)
 *          - zaškrtávátko „Zobrazit archivované“
 *          - tabulka se záhlavím a řádky
 *          - ✅ 3-stavové řazení na sloupcích (user → asc → desc → user)
 */

//
// 1) IMPORTS
//
import React, { useMemo } from 'react'
import '@/app/styles/components/ListView.css'

//
// 2) TYPES
//
export type ListViewSortMode = 'user' | 'asc' | 'desc'

export type ListViewSortState = {
  key: string | null
  mode: ListViewSortMode
}

export type ListViewColumn = {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
  /** Šířka sloupce (doporučeno číslo v px, nebo string "180px") */
  width?: number | string

  /** ✅ Povolit řazení klikem na hlavičku */
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

  /** ✅ Řazení (stav drží rodič) */
  sort?: ListViewSortState
  /** ✅ Změna řazení */
  onSortChange?: (next: ListViewSortState) => void
}

//
// 3) HELPERS
//
function getAlignClass(align?: 'left' | 'center' | 'right') {
  return align === 'center' ? 'generic-type__cell--center' : align === 'right' ? 'generic-type__cell--right' : ''
}

function getColStyle(w?: number | string): React.CSSProperties | undefined {
  if (w === undefined || w === null || w === '') return undefined
  const widthValue = typeof w === 'number' ? `${w}px` : w
  return { width: widthValue, minWidth: widthValue, maxWidth: widthValue }
}
function getSortIndicator(mode: ListViewSortMode): string {
  if (mode === 'asc') return '▲'
  if (mode === 'desc') return '▼'
  return ''
}

function buildNextSort(cur: ListViewSortState | undefined, colKey: string): ListViewSortState {
  const current = cur ?? { key: null, mode: 'user' as const }

  // klik na jiný sloupec => rovnou ASC
  if (current.key !== colKey) return { key: colKey, mode: 'asc' }

  // klik na stejný sloupec => user -> asc -> desc -> user
  const nextMode: ListViewSortMode = current.mode === 'user' ? 'asc' : current.mode === 'asc' ? 'desc' : 'user'
  return { key: colKey, mode: nextMode }
}

//
// 6) RENDER
//
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
  sort,
  onSortChange,
}: ListViewProps<TData>) {
  const canSort = typeof onSortChange === 'function'

  const headerButtonStyle: React.CSSProperties = useMemo(
    () => ({
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: 'transparent',
      border: 'none',
      padding: 0,
      margin: 0,
      cursor: 'pointer',
      font: 'inherit',
      color: 'inherit',
      userSelect: 'none',
    }),
    []
  )

  return (
    <div className="listview">
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

      <div className="listview__table-wrapper">
        <table className="generic-type__table" style={{ tableLayout: 'fixed', width: '100%' }}>
          <thead>
            <tr>
              {columns.map((col) => {
                const alignClass = getAlignClass(col.align)
                const isSortable = !!col.sortable && canSort
                const isActive = sort?.key === col.key && sort?.mode !== 'user'
                const indicator = isActive ? getSortIndicator(sort?.mode ?? 'user') : ''

                return (
                  <th
                    key={col.key}
                    className={['generic-type__cell', alignClass].filter(Boolean).join(' ')}
                    style={getColStyle(col.width)}
                  >
                    {isSortable ? (
                      <button
                        type="button"
                        style={headerButtonStyle}
                        onClick={() => onSortChange?.(buildNextSort(sort, col.key))}
                        aria-label={`Seřadit podle: ${col.label}`}
                        title="Klik: A–Z, Z–A, původní řazení"
                      >
                        <span>{col.label}</span>
                        <span aria-hidden="true" style={{ width: 12, textAlign: 'center', opacity: indicator ? 1 : 0.25 }}>
                          {indicator || ' '}
                        </span>
                      </button>
                    ) : (
                      col.label
                    )}
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
