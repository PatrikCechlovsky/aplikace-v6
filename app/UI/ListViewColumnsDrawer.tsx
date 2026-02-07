'use client'

// =====================
// 1) IMPORTS
// =====================

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import type { ListViewColumn } from '@/app/UI/ListView'
import '@/app/styles/components/ListViewColumnsDrawer.css'

// =====================
// 2) TYPES
// =====================

export type ColumnsDrawerValue = {
  order: string[]
  hidden: string[]
}

type Props = {
  open: boolean
  title?: string
  columns: ListViewColumn[]              // base (app) columns
  value: ColumnsDrawerValue              // current prefs (order/hidden)
  fixedFirstKey: string                  // první sloupec je zamčený
  requiredKeys?: string[]                // povinné (nelze skrýt, ale lze přesouvat)
  sortBy?: { key: string; dir: 'asc' | 'desc' }  // aktuální řazení
  onClose: () => void
  onChange: (next: ColumnsDrawerValue) => void
  onReset?: () => void
  onSortChange?: (sort: { key: string; dir: 'asc' | 'desc' }) => void
}

// =====================
// 3) HELPERS
// =====================

function uniq(arr: string[]) {
  return Array.from(new Set(arr))
}

function normalize(columns: ListViewColumn[], v: ColumnsDrawerValue, fixedFirstKey: string, requiredKeys: string[]) {
  const baseKeys = columns.map((c) => c.key)

  // order: jen známé keys + doplnit chybějící na konec
  const cleanedOrder = uniq((v.order ?? []).filter((k) => baseKeys.includes(k)))
  for (const k of baseKeys) if (!cleanedOrder.includes(k)) cleanedOrder.push(k)

  // první fixně
  const withoutFixed = cleanedOrder.filter((k) => k !== fixedFirstKey)
  const finalOrder = [fixedFirstKey, ...withoutFixed.filter(Boolean)]

  // hidden: jen známé, bez fixed + bez required
  const req = new Set(requiredKeys)
  const hidden = uniq((v.hidden ?? []).filter((k) => baseKeys.includes(k)))
    .filter((k) => k !== fixedFirstKey)
    .filter((k) => !req.has(k))

  return { order: finalOrder, hidden }
}

// =====================
// 4) DATA LOAD
// =====================
// (none)

// =====================
// 5) ACTION HANDLERS
// =====================

export default function ListViewColumnsDrawer({
  open,
  title = 'Sloupce',
  columns,
  value,
  fixedFirstKey,
  requiredKeys = [],
  sortBy,
  onClose,
  onChange,
  onReset,
  onSortChange
}: Props) {
  const [q, setQ] = useState('')

  const normalized = useMemo(() => normalize(columns, value, fixedFirstKey, requiredKeys), [columns, value, fixedFirstKey, requiredKeys])

  // lokální “view model” pro DnD a toggle
  const [order, setOrder] = useState<string[]>(normalized.order)
  const [hidden, setHidden] = useState<Set<string>>(new Set(normalized.hidden))

  useEffect(() => {
    setOrder(normalized.order)
    setHidden(new Set(normalized.hidden))
  }, [normalized.order, normalized.hidden, open])

  const baseByKey = useMemo(() => {
    const m = new Map<string, ListViewColumn>()
    for (const c of columns) m.set(c.key, c)
    return m
  }, [columns])

  const requiredSet = useMemo(() => new Set(requiredKeys), [requiredKeys])

  const items = useMemo(() => {
    const list = order
      .map((k) => baseByKey.get(k))
      .filter(Boolean) as ListViewColumn[]

    const qq = q.trim().toLowerCase()
    if (!qq) return list
    return list.filter((c) => `${c.label} ${c.key}`.toLowerCase().includes(qq))
  }, [order, baseByKey, q])

  const commit = useCallback(() => {
    const next = normalize(columns, { order, hidden: Array.from(hidden) }, fixedFirstKey, requiredKeys)
    onChange(next)
  }, [columns, order, hidden, fixedFirstKey, requiredKeys, onChange])

  const toggleVisible = useCallback(
    (key: string) => {
      if (key === fixedFirstKey) return
      if (requiredSet.has(key)) return

      setHidden((prev) => {
        const next = new Set(prev)
        if (next.has(key)) next.delete(key)
        else next.add(key)
        return next
      })
    },
    [fixedFirstKey, requiredSet]
  )

  // HTML5 DnD jednoduchá varianta
  const [dragKey, setDragKey] = useState<string | null>(null)

  const onDragStart = useCallback((key: string) => {
    if (key === fixedFirstKey) return
    setDragKey(key)
  }, [fixedFirstKey])

  const onDropOn = useCallback((overKey: string) => {
    if (!dragKey) return
    if (dragKey === overKey) return
    if (dragKey === fixedFirstKey) return
    if (overKey === fixedFirstKey) return // fixed zůstává první

    setOrder((prev) => {
      const arr = prev.filter((k) => k !== dragKey)
      const idx = arr.indexOf(overKey)
      arr.splice(Math.max(1, idx), 0, dragKey) // nikdy na index 0
      return [fixedFirstKey, ...arr.filter((k) => k !== fixedFirstKey)]
    })

    setDragKey(null)
  }, [dragKey, fixedFirstKey])

  // =====================
  // 6) RENDER
  // =====================

  if (!open) return null

  return (
    <div className="lvcols__overlay" onMouseDown={onClose}>
      <div className="lvcols__panel" onMouseDown={(e) => e.stopPropagation()}>
        <div className="lvcols__header">
          <div className="lvcols__title">{title}</div>
          <button type="button" className="lvcols__close" onClick={onClose} aria-label="Zavřít">✕</button>
        </div>

        <div className="lvcols__search">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Hledat sloupec…" />
        </div>

        {/* Sekce řazení */}
        {onSortChange && (
          <div className="lvcols__sort-section">
            <h3 className="lvcols__sort-heading">📊 VÝCHOZÍ ŘAZENÍ</h3>
            <div className="lvcols__sort-row">
              <label className="lvcols__sort-label">Seřadit podle:</label>
              <select
                className="lvcols__sort-select"
                value={sortBy?.key ?? ''}
                onChange={(e) => {
                  const newKey = e.target.value
                  if (newKey && onSortChange) {
                    onSortChange({ key: newKey, dir: sortBy?.dir ?? 'asc' })
                  }
                }}
              >
                {columns.filter(c => c.sortable !== false).map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="lvcols__sort-row">
              <label className="lvcols__sort-label">Směr:</label>
              <div className="lvcols__sort-radios">
                <label className="lvcols__sort-radio">
                  <input
                    type="radio"
                    name="sort-direction"
                    value="asc"
                    checked={sortBy?.dir === 'asc'}
                    onChange={() => {
                      if (onSortChange && sortBy) {
                        onSortChange({ key: sortBy.key, dir: 'asc' })
                      }
                    }}
                  />
                  <span>Vzestupně</span>
                </label>
                <label className="lvcols__sort-radio">
                  <input
                    type="radio"
                    name="sort-direction"
                    value="desc"
                    checked={sortBy?.dir === 'desc'}
                    onChange={() => {
                      if (onSortChange && sortBy) {
                        onSortChange({ key: sortBy.key, dir: 'desc' })
                      }
                    }}
                  />
                  <span>Sestupně</span>
                </label>
              </div>
            </div>
          </div>
        )}

        <div className="lvcols__list">
          {items.map((c) => {
            const key = c.key
            const isFixed = key === fixedFirstKey
            const isReq = requiredSet.has(key)
            const isHidden = hidden.has(key)

            return (
              <div
                key={key}
                className={['lvcols__item', isFixed ? 'is-fixed' : '', dragKey === key ? 'is-drag' : ''].filter(Boolean).join(' ')}
                draggable={!isFixed}
                onDragStart={() => onDragStart(key)}
                onDragOver={(e) => { e.preventDefault() }}
                onDrop={() => onDropOn(key)}
                title={isFixed ? 'První sloupec je pevný' : 'Táhni pro změnu pořadí'}
              >
                <div className="lvcols__drag">≡</div>
                <div className="lvcols__label">
                  <div className="lvcols__name">{c.label}</div>
                  <div className="lvcols__key">{key}{isReq ? ' • povinný' : ''}{isFixed ? ' • pevný' : ''}</div>
                </div>

                <button
                  type="button"
                  className={['lvcols__toggle', (!isHidden ? 'on' : 'off')].join(' ')}
                  onClick={() => toggleVisible(key)}
                  disabled={isFixed || isReq}
                  aria-label={isHidden ? 'Zobrazit' : 'Skrýt'}
                  title={isFixed ? 'Nelze skrýt' : isReq ? 'Povinný sloupec nelze skrýt' : (isHidden ? 'Zobrazit' : 'Skrýt')}
                >
                  {isHidden ? 'Skrývá se' : 'Viditelné'}
                </button>
              </div>
            )
          })}
        </div>

        <div className="lvcols__footer">
          <button type="button" className="lvcols__btn" onClick={onReset}>Reset</button>
          <div style={{ flex: 1 }} />
          <button type="button" className="lvcols__btn" onClick={onClose}>Zavřít</button>
          <button type="button" className="lvcols__btn lvcols__btn--primary" onClick={() => { commit(); onClose() }}>
            Použít
          </button>
        </div>
      </div>
    </div>
  )
}
