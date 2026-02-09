'use client'

/*
 * FILE: app/UI/ListView.tsx
 * PURPOSE: Opakovatelný ListView vzor pro všechny přehledové seznamy.
 *          - filtr (input)
 *          - zaškrtávátko „Zobrazit archivované“
 *          - tabulka se záhlavím a řádky
 *          - (NEW) 3-stavové řazení přes klik na hlavičku sloupce
 */

import React, { useCallback, useEffect, useRef } from 'react'
import { getIcon, type IconKey } from '@/app/UI/icons'
import '@/app/styles/components/ListView.css'

// ============================================================================
// 2) TYPES
// ============================================================================

export type ListViewSortDir = 'asc' | 'desc'
export type ListViewSortState = { key: string; dir: ListViewSortDir } | null

export type ListViewColumn = {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
  width?: number | string
  sortable?: boolean
  resizable?: boolean
  minWidthPx?: number
  maxWidthPx?: number
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

  filterValue: string
  onFilterChange: (value: string) => void
  filterPlaceholder?: string

  showArchived?: boolean
  onShowArchivedChange?: (value: boolean) => void
  showArchivedLabel?: string

  emptyText?: string

  selectedId?: string | number | null
  onRowClick?: (row: ListViewRow<TData>) => void
  onRowDoubleClick?: (row: ListViewRow<TData>) => void

  sort?: ListViewSortState
  onSortChange?: (next: ListViewSortState) => void

  onColumnResize?: (columnKey: string, widthPx: number) => void

  /** otevřít dialog nastavení sloupců */
  onColumnSettings?: () => void
  columnSettingsAriaLabel?: string

  /** max výška scrollovatelné tabulky (např. pro vazby) */
  tableWrapperMaxHeight?: string | number
}

// ============================================================================
// 3) HELPERS
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
// 4) DATA LOAD
// ============================================================================
// (none)

// ============================================================================
// 5) ACTION HANDLERS
// ============================================================================
// (inline + hooks)

// ============================================================================
// 6) RENDER
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
  onColumnResize,
  onColumnSettings,
  columnSettingsAriaLabel = 'Nastavit sloupce',
  tableWrapperMaxHeight,
}: ListViewProps<TData>) {
  const tableWrapperStyle = typeof tableWrapperMaxHeight !== 'undefined'
    ? { maxHeight: typeof tableWrapperMaxHeight === 'number' ? `${tableWrapperMaxHeight}px` : tableWrapperMaxHeight }
    : undefined
  const dragRef = useRef<{
    key: string
    startX: number
    startW: number
    minW: number
    maxW: number
  } | null>(null)

  const stopDrag = useCallback(() => {
    dragRef.current = null
  }, [])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return
      e.preventDefault()

      const d = dragRef.current
      const dx = e.clientX - d.startX
      let w = d.startW + dx
      if (!Number.isFinite(w)) return

      if (w < d.minW) w = d.minW
      if (w > d.maxW) w = d.maxW

      onColumnResize?.(d.key, Math.round(w))
    }

    const onUp = () => {
      if (!dragRef.current) return
      stopDrag()
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [onColumnResize, stopDrag])

  return (
    <div className="listview">
      <div className="listview__toolbar">
        <div className="listview__toolbar-left">
          {typeof onShowArchivedChange === 'function' ? (
            <label className="generic-type__checkbox-label">
              <input type="checkbox" checked={showArchived} onChange={(e) => onShowArchivedChange?.(e.target.checked)} />
              <span>{showArchivedLabel}</span>
            </label>
          ) : null}
        </div>

        <div className="listview__toolbar-right">
          <input
            type="text"
            className="generic-type__filter-input"
            placeholder={filterPlaceholder}
            value={filterValue}
            onChange={(e) => onFilterChange(e.target.value)}
          />
          {typeof onColumnSettings === 'function' && (
            <button
              type="button"
              className="listview__columns-btn"
              onClick={onColumnSettings}
              title={columnSettingsAriaLabel}
              aria-label={columnSettingsAriaLabel}
            >
              {getIcon('settings' as IconKey)}
            </button>
          )}
        </div>
      </div>

      <div className="listview__table-wrapper" style={tableWrapperStyle}>
        <table className="generic-type__table" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr>
              {columns.map((col) => {
                const alignClass = getAlignClass(col.align)
                const canSort = !!col.sortable && typeof onSortChange === 'function'
                const indicator = canSort ? sortIndicator(sort ?? undefined, col.key) : ''
                const canResize = typeof onColumnResize === 'function' && (col.resizable ?? true)

                return (
                  <th
                    key={col.key}
                    className={['generic-type__cell', alignClass].filter(Boolean).join(' ')}
                    style={{
                      ...getColStyle(col.width),
                      cursor: canSort ? 'pointer' : undefined,
                      userSelect: canSort ? 'none' : undefined,
                      // ❗DŮLEŽITÉ: už NENÍ inline `position: relative`
                      // sticky se řídí CSS (thead th { position: sticky })
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

                    {/* RESIZE úchyt (tahání šířky) */}
                    {canResize ? (
                      <span
                        role="separator"
                        aria-orientation="vertical"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          e.stopPropagation()

                          const th = e.currentTarget.parentElement as HTMLElement | null
                          if (!th) return
                          const rect = th.getBoundingClientRect()
                          const startW = rect.width

                          const minW = col.minWidthPx ?? 80
                          const maxW = col.maxWidthPx ?? 1200

                          dragRef.current = {
                            key: col.key,
                            startX: e.clientX,
                            startW,
                            minW,
                            maxW,
                          }
                        }}
                        style={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          width: 10,
                          height: '100%',
                          cursor: 'col-resize',
                          userSelect: 'none',
                        }}
                        title="Táhni pro změnu šířky"
                      />
                    ) : null}
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
                  <tr key={row.id} className={rowClassNames} onClick={() => onRowClick?.(row)} onDoubleClick={() => onRowDoubleClick?.(row)}>
                    {columns.map((col) => {
                      const alignClass = getAlignClass(col.align)
                      return (
                        <td key={col.key} className={['generic-type__cell', alignClass].filter(Boolean).join(' ')} style={getColStyle(col.width)}>
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
