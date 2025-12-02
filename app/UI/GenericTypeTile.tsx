'use client'

/*
 * FILE: app/UI/GenericTypeTile.tsx
 * PURPOSE: Generický číselníkový formulář (typy subjektů, typy jednotek…)
 *
 * - Seznam nahoře (filtr, Zobrazit archivované, velké tlačítko Přidat)
 * - Uprostřed hlášky (chyba, info, rozdělaná práce)
 * - Dole detail + navigace: ← Předchozí, → Další, Uložit, Archivovat
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

type GenericTypeTileProps = {
  title: string
  description?: string

  fetchItems: () => Promise<GenericTypeItem[]>
  createItem: (input: GenericTypeItem) => Promise<GenericTypeItem>
  updateItem: (codeKey: string, input: GenericTypeItem) => Promise<GenericTypeItem>
}

type PendingAction =
  | null
  | { type: 'select'; code: string }
  | { type: 'new' }
  | { type: 'prev' }
  | { type: 'next' }
  | { type: 'archive' }

export default function GenericTypeTile(props: GenericTypeTileProps) {
  const { title, description, fetchItems, createItem, updateItem } = props

  const [items, setItems] = useState<GenericTypeItem[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  const [form, setForm] = useState<GenericTypeItem>({
    code: '',
    name: '',
    description: '',
    color: '',
    icon: '',
    sort_order: null,
    active: true,
  })

  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)

  // ---------------------------------------------------------------------------
  // Načtení dat
  // ---------------------------------------------------------------------------

  useEffect(() => {
    let isMounted = true

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const rows = await fetchItems()
        if (!isMounted) return

        const sorted = [...rows].sort((a, b) => {
          const aOrder = typeof a.sort_order === 'number' ? a.sort_order : 9999
          const bOrder = typeof b.sort_order === 'number' ? b.sort_order : 9999
          if (aOrder !== bOrder) return aOrder - bOrder
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

  // ---------------------------------------------------------------------------
  // Odvozený seznam
  // ---------------------------------------------------------------------------

  const visibleItems = useMemo(() => {
    const f = filter.trim().toLowerCase()

    return items.filter((item) => {
      const isActive = item.active ?? true
      if (!showArchived && !isActive) return false
      if (!f) return true

      const haystack = [item.name ?? '', item.code ?? '', item.description ?? '']
        .join(' ')
        .toLowerCase()

      return haystack.includes(f)
    })
  }, [items, filter, showArchived])

  const selectedIndex = useMemo(() => {
    if (!selectedCode) return -1
    return visibleItems.findIndex((x) => x.code === selectedCode)
  }, [visibleItems, selectedCode])

  // ---------------------------------------------------------------------------
  // Pomocné funkce – bez kontroly rozdělané práce
  // ---------------------------------------------------------------------------

  function applySelect(item: GenericTypeItem) {
    setSelectedCode(item.code)
    setForm({
      code: item.code,
      name: item.name,
      description: item.description ?? '',
      color: item.color ?? '',
      icon: item.icon ?? '',
      sort_order: item.sort_order ?? null,
      active: item.active ?? true,
    })
    setDirty(false)
    setError(null)
    setInfo(null)
    setPendingAction(null)
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
    const prevItem = visibleItems[selectedIndex - 1]
    if (prevItem) applySelect(prevItem)
  }

  function performNavigateNext() {
    if (selectedIndex < 0 || selectedIndex >= visibleItems.length - 1) return
    const nextItem = visibleItems[selectedIndex + 1]
    if (nextItem) applySelect(nextItem)
  }

  async function performArchiveCurrent() {
    if (!selectedCode) return
    const current = items.find((x) => x.code === selectedCode)
    if (!current) return

    setSaving(true)
    try {
      const updated = await updateItem(selectedCode, {
        ...current,
        active: false,
      })

      setItems((prev) => {
        const withoutOld = prev.filter((x) => x.code !== selectedCode)
        const merged = [...withoutOld, updated]

        merged.sort((a, b) => {
          const aOrder = typeof a.sort_order === 'number' ? a.sort_order : 9999
          const bOrder = typeof b.sort_order === 'number' ? b.sort_order : 9999
          if (aOrder !== bOrder) return aOrder - bOrder
          return (a.name ?? '').localeCompare(b.name ?? '', 'cs')
        })

        return merged
      })

      applySelect(updated)
      setInfo('Záznam byl archivován.')
    } catch (e) {
      console.error('GenericTypeTile – archive failed', e)
      setError('Archivace se nezdařila. Zkus to prosím znovu.')
    } finally {
      setSaving(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Rozdělaná práce – požadavek vs. provedení akce
  // ---------------------------------------------------------------------------

  function requestSelect(item: GenericTypeItem) {
    if (!dirty) {
      applySelect(item)
    } else {
      setPendingAction({ type: 'select', code: item.code })
    }
  }

  function requestNew() {
    if (!dirty) {
      resetFormToNew()
    } else {
      setPendingAction({ type: 'new' })
    }
  }

  function requestPrev() {
    if (!dirty) {
      performNavigatePrev()
    } else {
      setPendingAction({ type: 'prev' })
    }
  }

  function requestNext() {
    if (!dirty) {
      performNavigateNext()
    } else {
      setPendingAction({ type: 'next' })
    }
  }

  function requestArchive() {
    if (!dirty) {
      setPendingAction(null)
      void performArchiveCurrent()
    } else {
      setPendingAction({ type: 'archive' })
    }
  }

  function handleDiscardChanges() {
    const action = pendingAction
    setPendingAction(null)
    setDirty(false)
    setError(null)

    if (!action) return

    switch (action.type) {
      case 'new':
        resetFormToNew()
        break
      case 'select': {
        const target = items.find((x) => x.code === action.code)
        if (target) applySelect(target)
        break
      }
      case 'prev':
        performNavigatePrev()
        break
      case 'next':
        performNavigateNext()
        break
      case 'archive':
        void performArchiveCurrent()
        break
    }
  }

  function handleKeepEditing() {
    setPendingAction(null)
  }

  // ---------------------------------------------------------------------------
  // Změny ve formuláři
  // ---------------------------------------------------------------------------

  function handleChangeField<K extends keyof GenericTypeItem>(
    field: K,
    value: GenericTypeItem[K],
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
    setDirty(true)
    setError(null)
    setInfo(null)
  }

  function handleChangeSortOrder(raw: string) {
    if (!raw.trim()) {
      handleChangeField('sort_order', null)
      return
    }
    const parsed = Number(raw)
    if (Number.isNaN(parsed)) {
      handleChangeField('sort_order', null)
    } else {
      handleChangeField('sort_order', parsed)
    }
  }

  // ---------------------------------------------------------------------------
  // Uložení
  // ---------------------------------------------------------------------------

  async function handleSave() {
    setError(null)
    setInfo(null)

    const code = (form.code ?? '').trim()
    const name = (form.name ?? '').trim()

    if (!code || !name) {
      setError('Kód a název jsou povinné.')
      return
    }

    setSaving(true)

    try {
      let saved: GenericTypeItem

      if (!selectedCode) {
        saved = await createItem({
          ...form,
          code,
          name,
        })
      } else {
        saved = await updateItem(selectedCode, {
          ...form,
          code,
          name,
        })
      }

      setItems((prev) => {
        const withoutOld = prev.filter((x) => x.code !== selectedCode)
        const merged = [...withoutOld]

        const idx = merged.findIndex((x) => x.code === saved.code)
        if (idx >= 0) merged[idx] = saved
        else merged.push(saved)

        merged.sort((a, b) => {
          const aOrder = typeof a.sort_order === 'number' ? a.sort_order : 9999
          const bOrder = typeof b.sort_order === 'number' ? b.sort_order : 9999
          if (aOrder !== bOrder) return aOrder - bOrder
          return (a.name ?? '').localeCompare(b.name ?? '', 'cs')
        })

        return merged
      })

      applySelect(saved)
      setDirty(false)
      setInfo('Změny byly úspěšně uloženy.')
    } catch (e) {
      console.error('GenericTypeTile – save failed', e)
      setError('Uložení se nezdařilo. Zkontroluj připojení nebo práva.')
    } finally {
      setSaving(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const hasUnsavedPrompt = !!pendingAction && dirty

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
              placeholder="Hledat podle názvu, kódu nebo popisu…"
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
                <span>Zobrazit archivované</span>
              </label>

              {/* Velké červené tlačítko PŘIDAT */}
             <button
                type="button"
                className="generic-type__button-add-top generic-type__button--with-label"
                onClick={requestNew}
                disabled={saving}
                title="Přidat nový záznam"
              >
                <span className="generic-type__button-icon">
                  {/* tady klidně můžeš později dát getIcon('plus' as IconKey) */}
                  ➕
                </span>
                <span className="generic-type__button-text">Přidat</span>
              </button>
            </div>
          </div>

          <div className="generic-type__table-wrapper">
            {loading ? (
              <div className="generic-type__loading">Načítám data…</div>
            ) : visibleItems.length === 0 ? (
              <div className="generic-type__empty">
                Žádné položky neodpovídají filtru.
              </div>
            ) : (
              <table className="generic-type__table">
                <thead>
                  <tr>
                    <th className="generic-type__th">Název</th>
                    <th className="generic-type__th generic-type__th--small">
                      Kód
                    </th>
                    <th className="generic-type__th generic-type__th--small">
                      Pořadí
                    </th>
                    <th className="generic-type__th generic-type__th--small">
                      Ikona
                    </th>
                    <th className="generic-type__th generic-type__th--small">
                      Barva
                    </th>
                    <th className="generic-type__th">Popis</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleItems.map((item) => {
                    const isSelected = item.code === selectedCode
                    const isActive = item.active ?? true
                    const rowClassNames = [
                      'generic-type__row',
                      isSelected ? 'generic-type__row--selected' : '',
                      !isActive ? 'generic-type__row--archived' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')

                    const iconSymbol = item.icon
                      ? getIcon(item.icon as IconKey)
                      : ''

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
                        <td className="generic-type__cell generic-type__cell--code">
                          <span className="generic-type__name-sub">
                            {item.code}
                          </span>
                        </td>

                        {/* Pořadí */}
                        <td className="generic-type__cell generic-type__cell--small generic-type__cell--center">
                          {typeof item.sort_order === 'number'
                            ? item.sort_order
                            : ''}
                        </td>

                        {/* Ikona */}
                        <td className="generic-type__cell generic-type__cell--center">
                          {iconSymbol && (
                            <span className="generic-type__icon-preview">
                              {iconSymbol}
                            </span>
                          )}
                        </td>

                        {/* Barva */}
                        <td className="generic-type__cell generic-type__cell--center">
                          {item.color ? (
                            <span
                              className="generic-type__color-dot"
                              style={{ backgroundColor: item.color || '' }}
                            />
                          ) : (
                            <span className="generic-type__color-dot generic-type__color-dot--empty" />
                          )}
                        </td>

                        {/* Popis */}
                        <td className="generic-type__cell generic-type__cell--description">
                          {item.description}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* HLÁŠKY MEZI SEZNAMEM A FORMEM ------------------------------------- */}
        {(error || info) && (
          <div className="generic-type__alert-wrapper">
            {error && (
              <div className="generic-type__alert generic-type__alert--error">
                {error}
              </div>
            )}
            {info && !error && (
              <div className="generic-type__alert generic-type__alert--info">
                {info}
              </div>
            )}
          </div>
        )}

        {hasUnsavedPrompt && (
          <div className="generic-type__alert-wrapper">
            <div className="generic-type__alert generic-type__alert--warning">
              <div className="generic-type__alert-text">
                Máš rozdělanou práci, která není uložená. Co chceš udělat?
              </div>
              <div className="generic-type__alert-actions">
                <button
                  type="button"
                  className="generic-type__alert-btn"
                  onClick={handleKeepEditing}
                >
                  Pokračovat v úpravách
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
              {/* z prava má být: Archivovat | Uložit | → | ←
                  → pořadí v DOMu: ←, →, Uložit, Archivovat */}
              <button
                type="button"
                className="generic-type__button-nav"
                onClick={requestPrev}
                disabled={selectedIndex <= 0}
                title="Předchozí"
              >
                ‹
              </button>
              <button
                type="button"
                className="generic-type__button-nav"
                onClick={requestNext}
                disabled={
                  selectedIndex < 0 || selectedIndex >= visibleItems.length - 1
                }
                title="Další"
              >
                ›
              </button>

              <button
                type="button"
                className="generic-type__button-save-main generic-type__button--with-label"
                onClick={handleSave}
                disabled={saving || !dirty}
                title="Uložit změny"
              >
                <span className="generic-type__button-icon">
                  💾{/* sem můžeš dát getIcon('save' as IconKey) */}
                </span>
                <span className="generic-type__button-text">
                  {saving ? 'Ukládám…' : 'Uložit'}
                </span>
              </button>
              
              <button
                type="button"
                className="generic-type__button-archive generic-type__button--with-label"
                onClick={requestArchive}
                disabled={!selectedCode || saving}
                title="Archivovat záznam (nejde mazat)"
              >
                <span className="generic-type__button-icon">
                  🗄️{/* sem můžeš dát getIcon('archive' as IconKey) */}
                </span>
                <span className="generic-type__button-text">Archivovat</span>
              </button>
            </div>
          </div>

          <div className="generic-type__form-grid">
            {/* Kód + Název */}
            <div className="generic-type__field">
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

            <div className="generic-type__field">
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
                  const isSelected =
                    (form.color ?? '').toLowerCase() ===
                    c.hex.toLowerCase()
                  const swatchClassNames = [
                    'generic-type__swatch',
                    isSelected ? 'generic-type__swatch--selected' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className={swatchClassNames}
                      onClick={() => handleChangeField('color', c.hex)}
                      title={c.label ?? c.hex}
                    >
                      <span
                        className="generic-type__swatch-inner"
                        style={{ backgroundColor: c.hex }}
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
                    Náhled:
                  </span>
                  <span className="generic-type__icon-preview">
                    {getIcon(form.icon as IconKey)}
                  </span>
                </div>
              )}
            </div>

            {/* Pořadí */}
            <div className="generic-type__field generic-type__field--small">
              <label className="generic-type__label">Pořadí</label>
              <input
                type="number"
                className="generic-type__input"
                value={
                  typeof form.sort_order === 'number'
                    ? String(form.sort_order)
                    : ''
                }
                onChange={(e) => handleChangeSortOrder(e.target.value)}
              />
            </div>

            {/* Aktivní */}
            <div className="generic-type__field generic-type__field--inline">
              <label className="generic-type__checkbox-label">
                <input
                  type="checkbox"
                  checked={form.active ?? true}
                  onChange={(e) => handleChangeField('active', e.target.checked)}
                />
                <span>Aktivní záznam</span>
              </label>
            </div>
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
    </section>
  )
}
