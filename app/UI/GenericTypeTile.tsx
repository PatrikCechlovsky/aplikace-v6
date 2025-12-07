'use client'

/*
 * FILE: app/UI/GenericTypeTile.tsx
 * PURPOSE: Generický číselníkový formulář (typy subjektů, typy jednotek…)
 */

import React, { useEffect, useMemo, useState } from 'react'
import { getIcon, IconKey } from '@/app/UI/icons'
import { APP_COLOR_PALETTE } from '@/app/lib/colorPalette'

export type GenericTypeItem = {
  code: string
  name: string
  description?: string | null
  color?: string | null
  icon?: string | null
  sort_order?: number | null
  active?: boolean | null
}

export type GenericTypeTileProps = {
  title: string
  description?: string
  fetchItems: () => Promise<GenericTypeItem[]>
  createItem: (data: GenericTypeItem) => Promise<GenericTypeItem>
  updateItem: (code: string, data: GenericTypeItem) => Promise<GenericTypeItem>
}

/**
 * Vnitřní reprezentace formuláře – používáme stejná pole jako v GenericTypeItem.
 * Díky tomu se jednoduše posílá do create/update.
 */
type GenericTypeFormState = GenericTypeItem

/**
 * Druhy „čekající“ akce – používá se při konfliktu nebo neuložených změnách.
 */
type PendingAction =
  | { type: 'select'; target: GenericTypeItem }
  | { type: 'new' }
  | { type: 'archive'; target: GenericTypeItem }
  | { type: 'restore'; target: GenericTypeItem }
  | { type: 'navigate-prev' }
  | { type: 'navigate-next' }

/**
 * Vrací sort_order položky – pokud není, vrací undefined.
 */
function getItemSortOrder(item: GenericTypeItem): number | undefined {
  const raw = item.sort_order
  if (typeof raw !== 'number') return undefined
  if (!Number.isFinite(raw)) return undefined
  return raw
}

export default function GenericTypeTile({
  title,
  description,
  fetchItems,
  createItem,
  updateItem,
}: GenericTypeTileProps) {
  const [items, setItems] = useState<GenericTypeItem[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [orderEditInfo, setOrderEditInfo] = useState<string | null>(null)

  const [form, setForm] = useState<GenericTypeFormState>({
    code: '',
    name: '',
    description: '',
    color: '',
    icon: '',
    sort_order: null,
    active: true,
  })

  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)

  // -------------------------------------------------------------
  // Odvozené hodnoty
  // -------------------------------------------------------------

  const selectedIndex = useMemo(() => {
    if (!selectedCode) return -1
    return items.findIndex((it) => it.code === selectedCode)
  }, [items, selectedCode])

  // Pořadí z formuláře (i když ještě není uložené)
  const currentSortOrder =
    typeof form.sort_order === 'number' && Number.isFinite(form.sort_order)
      ? form.sort_order
      : undefined

  // Map sort_order → count (z existujících položek)
  const sortOrderCounts = useMemo(() => {
    const counts = new Map<number, number>()

    items.forEach((it) => {
      const n = getItemSortOrder(it)
      if (n == null) return
      counts.set(n, (counts.get(n) ?? 0) + 1)
    })

    return counts
  }, [items])

  // Set všech „problémových“ pořadí (count > 1)
  const duplicateSortOrders = useMemo(() => {
    const dups = new Set<number>()
    sortOrderCounts.forEach((count, order) => {
      if (count > 1) dups.add(order)
    })
    return dups
  }, [sortOrderCounts])

  // Položky zobrazené v přehledu (filtr + archivace)
  const filteredItems = useMemo(() => {
    const q = filter.trim().toLowerCase()

    return items.filter((item) => {
      if (!showArchived && item.active === false) {
        return false
      }

      if (!q) return true

      const haystack = [
        item.name ?? '',
        item.code ?? '',
        item.description ?? '',
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(q)
    })
  }, [items, filter, showArchived])

  // Set barev, které jsou už použité (kromě aktuálně editovaného záznamu)
  const usedColors = useMemo(() => {
    const currentCode = selectedCode
    const colors = new Set<string>()

    items.forEach((it) => {
      if (!it.color) return
      if (it.code === currentCode) return
      colors.add(it.color.toLowerCase())
    })

    return Array.from(colors)
  }, [items, selectedCode])

  // Existuje nějaká položka s duplicitním pořadím?
  const hasAnyDuplicateOrder = useMemo(() => duplicateSortOrders.size > 0, [
    duplicateSortOrders,
  ])

  // -------------------------------------------------------------
  // Načtení dat / výběr / práce s formulářem
  // -------------------------------------------------------------

  // První načtení – fetchItems
  useEffect(() => {
    let isMounted = true

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const data = await fetchItems()
        if (!isMounted) return

        const sorted = [...data].sort((a, b) => {
          const aOrder = getItemSortOrder(a)
          const bOrder = getItemSortOrder(b)
          if (aOrder != null && bOrder != null) {
            return aOrder - bOrder
          }
          if (aOrder != null) return -1
          if (bOrder != null) return 1
          return (a.name ?? '').localeCompare(b.name ?? '', 'cs')
        })

        setItems(sorted)

        if (sorted.length > 0) {
          applySelect(sorted[0])
        } else {
          resetFormToNew(true)
        }
      } catch (e) {
        console.error('GenericTypeTile – fetchItems failed', e)
        if (!isMounted) return
        setError('Nepodařilo se načíst data. Zkuste to prosím znovu.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    load()
    return () => {
      isMounted = false
    }
  }, [fetchItems])

  // Pomocná funkce – nastaví formulář podle položky
  function fillFormFromItem(item: GenericTypeItem) {
    setForm({
      code: item.code ?? '',
      name: item.name ?? '',
      description: item.description ?? '',
      color: item.color ?? '',
      icon: item.icon ?? '',
      sort_order:
        typeof item.sort_order === 'number' && Number.isFinite(item.sort_order)
          ? item.sort_order
          : null,
      active: item.active ?? true,
    })
    setDirty(false)
    setError(null)
    setInfo(null)
    setPendingAction(null)
  }

  // Vybereme položku v přehledu a přepíšeme formulář
  function applySelect(item: GenericTypeItem) {
    setSelectedCode(item.code)
    fillFormFromItem(item)
  }

  function resetFormToNew(silent = false) {
    setSelectedCode(null)
    setForm({
      code: '',
      name: '',
      description: '',
      color: '',
      icon: '',
      sort_order: null,
      active: true,
    })
    setDirty(false)
    if (!silent) {
      setError(null)
      setInfo(null)
    }
    setPendingAction(null)
  }

  function performNavigatePrev() {
    if (selectedIndex <= 0) return
    const target = items[selectedIndex - 1]
    if (!target) return
    applySelect(target)
  }

  function performNavigateNext() {
    if (selectedIndex < 0 || selectedIndex >= items.length - 1) return
    const target = items[selectedIndex + 1]
    if (!target) return
    applySelect(target)
  }

  // -------------------------------------------------------------
  // Validace formuláře
  // -------------------------------------------------------------

  function validateForm(): string | null {
    if (!form.code || !form.code.trim()) {
      return 'Kód je povinný.'
    }
    if (!form.name || !form.name.trim()) {
      return 'Název je povinný.'
    }
    if (form.color && !/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(form.color)) {
      return 'Barva musí být ve formátu HEX (např. #E74C3C).'
    }
    return null
  }

  // -------------------------------------------------------------
  // Zpracování polí formuláře
  // -------------------------------------------------------------

  function handleChangeField<K extends keyof GenericTypeFormState>(
    field: K,
    value: GenericTypeFormState[K],
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
    setDirty(true)
    setError(null)
    setInfo(null)

    // speciální logika pro sort_order – když uživatel „šáhne“ na pořadí,
    // dáme vědět, že přesné pořadí se řeší tlačítky
    if (field === 'sort_order') {
      setOrderEditInfo(
        'Pořadí upravujte prosím pomocí šipek nahoru/dolů v seznamu.',
      )
    }
  }

  function handleToggleActive() {
    handleChangeField('active', !(form.active ?? true))
  }

  // -------------------------------------------------------------
  // Akce – vytvořit / uložit / archivovat / obnovit
  // -------------------------------------------------------------

  async function handleCreateOrUpdate() {
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)
    setError(null)
    setInfo(null)

    const payload: GenericTypeItem = {
      code: form.code.trim(),
      name: form.name.trim(),
      description: form.description?.trim() || null,
      color: form.color?.trim() || null,
      icon: form.icon?.trim() || null,
      sort_order:
        typeof form.sort_order === 'number' && Number.isFinite(form.sort_order)
          ? form.sort_order
          : null,
      active: form.active ?? true,
    }

    try {
      if (!selectedCode) {
        // CREATE
        const created = await createItem(payload)

        setItems((prev) => {
          const merged = [...prev, created]
          return merged.sort((a, b) => {
            const aOrder = getItemSortOrder(a)
            const bOrder = getItemSortOrder(b)
            if (aOrder != null && bOrder != null) return aOrder - bOrder
            if (aOrder != null) return -1
            if (bOrder != null) return 1
            return (a.name ?? '').localeCompare(b.name ?? '', 'cs')
          })
        })

        applySelect(created)
        setInfo('Záznam byl vytvořen.')
      } else {
        // UPDATE
        const updated = await updateItem(selectedCode, payload)

        setItems((prev) => {
          const idx = prev.findIndex((it) => it.code === selectedCode)
          if (idx === -1) return prev
          const next = [...prev]
          next[idx] = updated
          return next.sort((a, b) => {
            const aOrder = getItemSortOrder(a)
            const bOrder = getItemSortOrder(b)
            if (aOrder != null && bOrder != null) return aOrder - bOrder
            if (aOrder != null) return -1
            if (bOrder != null) return 1
            return (a.name ?? '').localeCompare(b.name ?? '', 'cs')
          })
        })

        applySelect(updated)
        setInfo('Záznam byl uložen.')
      }

      setDirty(false)
      setPendingAction(null)
    } catch (e) {
      console.error('GenericTypeTile – save failed', e)
      setError('Uložení se nezdařilo. Zkus to prosím znovu.')
    } finally {
      setSaving(false)
    }
  }

  async function handleArchiveToggleInternal(target: GenericTypeItem) {
    const updatedPayload: GenericTypeItem = {
      ...target,
      active: !(target.active ?? true),
    }

    setSaving(true)
    setError(null)
    setInfo(null)

    try {
      const updated = await updateItem(target.code, updatedPayload)

      setItems((prev) => {
        const idx = prev.findIndex((it) => it.code === target.code)
        if (idx === -1) return prev
        const next = [...prev]
        next[idx] = updated
        return next
      })

      applySelect(updated)

      if (updated.active) {
        setInfo('Záznam byl obnoven z archivu.')
      } else {
        setInfo('Záznam byl archivován.')
      }
      setDirty(false)
      setPendingAction(null)
    } catch (e) {
      console.error('GenericTypeTile – archive failed', e)
      setError('Archivace se nezdařila. Zkus to prosím znovu.')
    } finally {
      setSaving(false)
    }
  }

  // -------------------------------------------------------------
  // Rozdělaná práce – požadavek vs. provedení akce
  // -------------------------------------------------------------

  function confirmPendingAction() {
    if (!pendingAction) return

    // když je formulář špinavý, nejdřív uložit
    if (dirty && (pendingAction.type === 'select' || pendingAction.type === 'new')) {
      handleCreateOrUpdate()
      return
    }

    switch (pendingAction.type) {
      case 'select':
        applySelect(pendingAction.target)
        break
      case 'new':
        resetFormToNew()
        break
      case 'archive':
      case 'restore':
        handleArchiveToggleInternal(pendingAction.target)
        break
      case 'navigate-prev':
        performNavigatePrev()
        break
      case 'navigate-next':
        performNavigateNext()
        break
      default:
        break
    }

    setPendingAction(null)
  }

  function handleDiscardChanges() {
    setPendingAction(null)
    if (!selectedCode) {
      resetFormToNew()
    } else {
      const current = items.find((it) => it.code === selectedCode)
      if (current) {
        fillFormFromItem(current)
      } else {
        resetFormToNew()
      }
    }
  }

  // -------------------------------------------------------------
  // Požadavky na akce – kontrola dirty stavu
  // -------------------------------------------------------------

  function requestSelect(target: GenericTypeItem) {
    if (dirty) {
      setPendingAction({ type: 'select', target })
      return
    }
    applySelect(target)
  }

  function requestNew() {
    if (dirty) {
      setPendingAction({ type: 'new' })
      return
    }
    resetFormToNew()
  }

  function requestArchiveToggle() {
    if (!selectedCode) return
    const current = items.find((it) => it.code === selectedCode)
    if (!current) return

    if (dirty) {
      setPendingAction({
        type: current.active ? 'archive' : 'restore',
        target: current,
      })
      return
    }

    handleArchiveToggleInternal(current)
  }

  function requestPrev() {
    if (selectedIndex <= 0) return
    if (dirty) {
      setPendingAction({ type: 'navigate-prev' })
      return
    }
    performNavigatePrev()
  }

  function requestNext() {
    if (selectedIndex < 0 || selectedIndex >= items.length - 1) return
    if (dirty) {
      setPendingAction({ type: 'navigate-next' })
      return
    }
    performNavigateNext()
  }

  // -------------------------------------------------------------
  // Změna pořadí v seznamu – tlačítka ↑ / ↓ vedle pole „Pořadí“
  // -------------------------------------------------------------

  function moveSelectedItem(up: boolean) {
    if (selectedIndex < 0 || selectedIndex >= items.length) return

    const current = items[selectedIndex]
    const neighborIndex = up ? selectedIndex - 1 : selectedIndex + 1
    if (neighborIndex < 0 || neighborIndex >= items.length) return

    const neighbor = items[neighborIndex]

    // prohodíme sort_order
    const aOrder = getItemSortOrder(current)
    const bOrder = getItemSortOrder(neighbor)

    if (aOrder == null || bOrder == null) {
      // pokud nějaké pořadí chybí, neděláme nic – pořadí se řeší až při editu
      return
    }

    const updatedCurrent: GenericTypeItem = {
      ...current,
      sort_order: bOrder,
    }
    const updatedNeighbor: GenericTypeItem = {
      ...neighbor,
      sort_order: aOrder,
    }

    const updatedItems = [...items]
    updatedItems[selectedIndex] = updatedCurrent
    updatedItems[neighborIndex] = updatedNeighbor

    // seřadíme podle nového pořadí
    updatedItems.sort((a, b) => {
      const aOrder2 = getItemSortOrder(a)
      const bOrder2 = getItemSortOrder(b)
      if (aOrder2 != null && bOrder2 != null) return aOrder2 - bOrder2
      if (aOrder2 != null) return -1
      if (bOrder2 != null) return 1
      return (a.name ?? '').localeCompare(b.name ?? '', 'cs')
    })

    setItems(updatedItems)

    // aktualizujeme form, aby se zobrazilo nové pořadí
    setForm((prev) => ({
      ...prev,
      sort_order:
        prev.code === updatedCurrent.code
          ? updatedCurrent.sort_order
          : prev.code === updatedNeighbor.code
          ? updatedNeighbor.sort_order
          : prev.sort_order,
    }))

    setDirty(true)
  }

  function moveSelectedItemUp() {
    moveSelectedItem(true)
  }

  function moveSelectedItemDown() {
    moveSelectedItem(false)
  }

  // -------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------

  return (
    <section className="generic-type">
      <header className="generic-type__header">
        <h1 className="generic-type__title">{title}</h1>
        {description && (
          <p className="generic-type__description">{description}</p>
        )}
      </header>

      <div className="generic-type__body">
        {/* HORNÍ SEZNAM ------------------------------------------------------ */}
        <div className="generic-type__list">
          <div className="generic-type__list-toolbar">
            <input
              type="text"
              className="generic-type__filter-input"
              placeholder="Hledat podle názvu, kódu nebo popisu..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />

            <div className="generic-type__list-toolbar-right">
              <label className="generic-type__checkbox-label">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                />
                Zobrazit archivované
              </label>
            </div>
          </div>

          {loading ? (
            <div className="generic-type__loading">Načítám číselník…</div>
          ) : filteredItems.length === 0 ? (
            <div className="generic-type__empty">
              Nebyl nalezen žádný záznam.
            </div>
          ) : (
            <div className="generic-type__table-wrapper">
              <table className="generic-type__table">
                <thead>
                  <tr>
                    <th className="generic-type__cell generic-type__cell--name">
                      Název
                    </th>
                    <th className="generic-type__cell">Kód</th>
                    <th className="generic-type__cell generic-type__cell--center">
                      Pořadí
                    </th>
                    <th className="generic-type__cell generic-type__cell--center">
                      Ikona
                    </th>
                    <th className="generic-type__cell">
                      Barva
                    </th>
                    <th className="generic-type__cell">Popis</th>
                    <th className="generic-type__cell generic-type__cell--center">
                      Stav
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => {
                    const isSelected = item.code === selectedCode
                    const rowClassNames = [
                      'generic-type__row',
                      isSelected ? 'generic-type__row--selected' : '',
                      duplicateSortOrders.has(
                        getItemSortOrder(item) ?? Number.NaN,
                      )
                        ? 'generic-type__row--duplicate-order'
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ')

                    const iconSymbol = item.icon
                      ? getIcon(item.icon as IconKey)
                      : null

                    return (
                      <tr
                        key={item.code}
                        className={rowClassNames}
                        onClick={() => requestSelect(item)}
                      >
                        {/* Název */}
                        <td className="generic-type__cell generic-type__cell--name">
                          {item.color ? (
                            <span
                              className="generic-type__name-badge"
                              style={{ backgroundColor: item.color || '' }}
                            >
                              {item.name}
                            </span>
                          ) : (
                            <span className="generic-type__name-main">
                              {item.name}
                            </span>
                          )}
                        </td>

                        {/* Kód */}
                        <td className="generic-type__cell">{item.code}</td>

                        {/* Pořadí */}
                        <td className="generic-type__cell generic-type__cell--center">
                          {typeof item.sort_order === 'number'
                            ? item.sort_order
                            : ''}
                        </td>

                        {/* Ikona */}
                        <td className="generic-type__cell generic-type__cell--center">
                          {iconSymbol && (
                            <span className="generic-type__icon-in-list">
                              {iconSymbol}
                            </span>
                          )}
                        </td>

                        {/* Barva (HEX) */}
                        <td className="generic-type__cell generic-type__cell--color">
                          {item.color || ''}
                        </td>

                        {/* Popis */}
                        <td className="generic-type__cell">
                          {item.description}
                        </td>

                        {/* Stav */}
                        <td className="generic-type__cell generic-type__cell--center">
                          {item.active === false ? (
                            <span className="generic-type__status-badge generic-type__status-badge--archived">
                              Archivovaný
                            </span>
                          ) : (
                            <span className="generic-type__status-badge generic-type__status-badge--active">
                              Aktivní
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* INFO / ERROR / KONFLIKTY ---------------------------------------- */}
        {error && (
          <div className="generic-type__alert-wrapper">
            <div className="generic-type__alert generic-type__alert--error">
              {error}
            </div>
          </div>
        )}

        {info && (
          <div className="generic-type__alert-wrapper">
            <div className="generic-type__alert generic-type__alert--info">
              {info}
            </div>
          </div>
        )}

        {hasAnyDuplicateOrder && (
          <div className="generic-type__alert-wrapper">
            <div className="generic-type__alert generic-type__alert--warning">
              <div>
                Některé položky mají stejné pořadí. Upravte prosím pořadí pomocí
                šipek v seznamu, aby bylo unikátní.
              </div>
            </div>
          </div>
        )}

        {pendingAction && (
          <div className="generic-type__alert-wrapper">
            <div className="generic-type__alert generic-type__alert--warning">
              <div className="generic-type__alert-text">
                Máte neuložené změny. Chcete je nejdříve uložit, nebo je
                zahodit?
              </div>
              <div className="generic-type__alert-actions">
                <button
                  type="button"
                  className="generic-type__alert-btn generic-type__alert-btn--primary"
                  onClick={confirmPendingAction}
                  disabled={saving}
                >
                  Uložit změny
                </button>
                <button
                  type="button"
                  className="generic-type__alert-btn generic-type__alert-btn--danger"
                  onClick={handleDiscardChanges}
                >
                  Zahodit změny
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DOLNÍ FORMULÁŘ ---------------------------------------------------- */}
        <div className="generic-type__form">
          <div className="generic-type__form-header-row">
            <h2 className="generic-type__form-title">Detail typu</h2>

            <div className="generic-type__form-nav">
              {/* Předchozí */}
              <button
                type="button"
                className="generic-type__button-nav generic-type__button--with-label"
                onClick={requestPrev}
                disabled={selectedIndex <= 0}
              >
                <span className="generic-type__button-icon">
                  {getIcon('prev' as IconKey)}
                </span>
                <span className="generic-type__button-text">Předchozí</span>
              </button>

              {/* Další */}
              <button
                type="button"
                className="generic-type__button-nav generic-type__button--with-label"
                onClick={requestNext}
                disabled={
                  selectedIndex < 0 || selectedIndex >= items.length - 1
                }
              >
                <span className="generic-type__button-icon">
                  {getIcon('next' as IconKey)}
                </span>
                <span className="generic-type__button-text">Další</span>
              </button>

              {/* Nový */}
              <button
                type="button"
                className="generic-type__button generic-type__button--with-label"
                onClick={requestNew}
              >
                <span className="generic-type__button-icon">
                  {getIcon('add' as IconKey)}
                </span>
                <span className="generic-type__button-text">Nový</span>
              </button>

              {/* Uložit */}
              <button
                type="button"
                className="generic-type__button generic-type__button--with-label"
                onClick={handleCreateOrUpdate}
                disabled={saving}
              >
                <span className="generic-type__button-icon">
                  {getIcon('save' as IconKey)}
                </span>
                <span className="generic-type__button-text">Uložit</span>
              </button>

              {/* Archivovat / Obnovit */}
              <button
                type="button"
                className="generic-type__button generic-type__button--with-label"
                onClick={requestArchiveToggle}
                disabled={!selectedCode}
              >
                <span className="generic-type__button-icon">
                  {getIcon('archive' as IconKey)}
                </span>
                <span className="generic-type__button-text">
                  {form.active === false ? 'Obnovit' : 'Archivovat'}
                </span>
              </button>
            </div>
          </div>

          <div className="generic-type__form-grid">
            {/* Pořadí + šipky hned vedle pole */}
            <div className="generic-type__field generic-type__field--small">
              <label className="generic-type__label">Pořadí</label>

              <div className="generic-type__order-wrapper">
                <input
                  type="number"
                  readOnly
                  className="generic-type__input generic-type__input--order"
                  value={
                    typeof form.sort_order === 'number'
                      ? String(form.sort_order)
                      : ''
                  }
                  onKeyDown={(e) => {
                    e.preventDefault()
                    setOrderEditInfo(
                      'Pořadí upravujte prosím pomocí šipek nahoru/dolů.',
                    )
                  }}
                />

                <div className="generic-type__order-buttons">
                  <button
                    type="button"
                    className="generic-type__order-btn"
                    onClick={moveSelectedItemUp}
                    disabled={selectedIndex <= 0}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    className="generic-type__order-btn"
                    onClick={moveSelectedItemDown}
                    disabled={
                      selectedIndex < 0 || selectedIndex >= items.length - 1
                    }
                  >
                    ▼
                  </button>
                </div>
              </div>

              {orderEditInfo && (
                <div className="generic-type__order-hint">{orderEditInfo}</div>
              )}
            </div>

            {/* Aktivní */}
            <div className="generic-type__field generic-type__field--small">
              <label className="generic-type__label">&nbsp;</label>
              <label className="generic-type__checkbox-label">
                <input
                  type="checkbox"
                  checked={form.active ?? true}
                  onChange={handleToggleActive}
                />
                Aktivní záznam
              </label>
            </div>

            {/* Kód */}
            <div className="generic-type__field generic-type__field--small">
              <label className="generic-type__label">
                Kód <span className="generic-type__required">*</span>
              </label>
              <input
                type="text"
                className="generic-type__input"
                value={form.code}
                onChange={(e) => handleChangeField('code', e.target.value)}
              />
            </div>

            {/* Název */}
            <div className="generic-type__field generic-type__field--wide">
              <label className="generic-type__label">
                Název <span className="generic-type__required">*</span>
              </label>
              <input
                type="text"
                className="generic-type__input"
                value={form.name}
                onChange={(e) => handleChangeField('name', e.target.value)}
              />
            </div>

            {/* Barva */}
            <div className="generic-type__field">
              <label className="generic-type__label">Barva (HEX)</label>
              <input
                type="text"
                className="generic-type__input"
                placeholder="#E74C3C"
                value={form.color ?? ''}
                onChange={(e) => handleChangeField('color', e.target.value)}
              />
              <div className="generic-type__palette">
                {APP_COLOR_PALETTE.map((c) => {
                  const hex = c.hex
                  const lowerHex = hex.toLowerCase()
                  const currentColor = (form.color ?? '').toLowerCase()

                  const isSelected = currentColor === lowerHex
                  const isUsedByOther =
                    usedColors.includes(lowerHex) && !isSelected

                  const swatchClassNames = [
                    'generic-type__swatch',
                    isSelected ? 'generic-type__swatch--selected' : '',
                    isUsedByOther ? 'generic-type__swatch--disabled' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')

                  const usedByItem = items.find(
                    (it) =>
                      it.color && it.color.toLowerCase() === lowerHex && it.code !== form.code,
                  )
                  const usedByName = usedByItem?.name

                  return (
                    <button
                      key={c.id}
                      type="button"
                      className={swatchClassNames}
                      disabled={isUsedByOther}
                      onClick={() => {
                        if (isUsedByOther) return
                        handleChangeField('color', hex)
                      }}
                      title={
                        isUsedByOther && usedByName
                          ? `Barva je již použita u: ${usedByName}`
                          : c.label ?? hex
                      }
                    >
                      <span
                        className="generic-type__swatch-inner"
                        style={{ backgroundColor: hex }}
                      />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Ikona */}
            <div className="generic-type__field">
              <label className="generic-type__label">
                Ikona (klíč z&nbsp;icons.ts)
              </label>
              <input
                type="text"
                className="generic-type__input"
                placeholder="např. user, building, tenant…"
                value={form.icon ?? ''}
                onChange={(e) => handleChangeField('icon', e.target.value)}
              />
              {form.icon && (
                <div className="generic-type__icon-preview-row">
                  <span className="generic-type__icon-preview-label">
                    Náhled ikony:
                  </span>
                  <span className="generic-type__icon-preview">
                    {getIcon(form.icon as IconKey)}
                  </span>
                </div>
              )}
            </div>

            {/* Popis */}
            <div className="generic-type__field generic-type__field--full">
              <label className="generic-type__label">Popis</label>
              <textarea
                className="generic-type__textarea"
                rows={3}
                value={form.description ?? ''}
                onChange={(e) =>
                  handleChangeField('description', e.target.value)
                }
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
