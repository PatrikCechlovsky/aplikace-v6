'use client'

/*
 * FILE: app/UI/GenericTypeTile.tsx
 * PURPOSE: Generický typový pohled pro číselníky (kód, název, barva, ikona, pořadí, aktivita)
 *
 * Použití:
 *  - UI je společné pro všechny číselníky typu:
 *      code, name, description, color, icon, sort_order, active
 *  - Datová logika (Supabase) je schovaná v "wrapper" tiles komponentě
 *    (např. app/modules/900-nastaveni/tiles/SubjectTypesTile.tsx)
 */

import React, { useEffect, useMemo, useState } from 'react'
import { getIcon, IconKey } from '@/app/UI/icons'

/**
 * Reprezentace jednoho záznamu v číselníku.
 * - všechny hodnoty kromě code a name jsou volitelné
 */
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
  /** Nadpis karty, např. "Typy subjektů" */
  title: string
  /** Popis pod nadpisem */
  description?: string

  /** Načtení seznamu položek z datové vrstvy */
  fetchItems: () => Promise<GenericTypeItem[]>

  /** Vytvoření nové položky – vrací uložený záznam z DB */
  createItem: (input: GenericTypeItem) => Promise<GenericTypeItem>

  /**
   * Update existující položky.
   * @param codeKey původní kód (primární klíč) – může se lišit od input.code, pokud uživatel kód změnil
   * @param input   nová data
   */
  updateItem: (codeKey: string, input: GenericTypeItem) => Promise<GenericTypeItem>
}

/**
 * Centrální paleta barev (24 odstínů).
 * Používá se ve formuláři a můžeš ji znovu použít i jinde.
 */
const COLOR_PALETTE: string[] = [
  '#E74C3C',
  '#E05570',
  '#A569BD',
  '#5DADE2',
  '#1ABC9C',
  '#3498DB',
  '#27AE60',
  '#1E8449',
  '#F9F635',
  '#F4D03F',
  '#F5B041',
  '#E67E22',
  '#935633',
  '#D7CCC8',
  '#95AA56',
  '#566573',
  '#956573',
  '#424949',
  '#212F3D',
  '#F1948A',
  '#BB8FCE',
  '#7FB3D5',
  '#A3E4D7',
  '#F8C471',
]

export default function GenericTypeTile(props: GenericTypeTileProps) {
  const { title, description, fetchItems, createItem, updateItem } = props

  const [items, setItems] = useState<GenericTypeItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)

  const [selectedCode, setSelectedCode] = useState<string | null>(null)

  const [filter, setFilter] = useState<string>('')
  const [showArchived, setShowArchived] = useState<boolean>(false)

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
  const [dirty, setDirty] = useState<boolean>(false)

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
          return (a.name ?? '').localeCompare(b.name ?? '')
        })
        setItems(sorted)

        if (sorted.length > 0) {
          const first = sorted[0]
          setSelectedCode(first.code)
          setForm({
            code: first.code,
            name: first.name,
            description: first.description ?? '',
            color: first.color ?? '',
            icon: first.icon ?? '',
            sort_order: first.sort_order ?? null,
            active: first.active ?? true,
          })
          setDirty(false)
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
  // Odvozený seznam podle filtru a archivace
  // ---------------------------------------------------------------------------

  const visibleItems = useMemo(() => {
    const f = filter.trim().toLowerCase()

    return items.filter((item) => {
      const isActive = item.active ?? true
      if (!showArchived && !isActive) return false

      if (!f) return true

      const haystack = [
        item.name ?? '',
        item.code ?? '',
        item.description ?? '',
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(f)
    })
  }, [items, filter, showArchived])

  // ---------------------------------------------------------------------------
  // Pomocné funkce
  // ---------------------------------------------------------------------------

  function resetFormToNew() {
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
    setError(null)
    setInfo(null)
    setDirty(false)
  }

  function handleSelectRow(item: GenericTypeItem) {
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
    setError(null)
    setInfo(null)
    setDirty(false)
  }

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
  }

  function handleChangeSortOrder(raw: string) {
    if (!raw.trim()) {
      handleChangeField('sort_order', null)
      return
    }
    const parsed = Number(raw)
    if (Number.isNaN(parsed)) {
      // uživateli nebráníme psát, jen hodnotu neuložíme jako číslo
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
        // nový záznam
        saved = await createItem({
          ...form,
          code,
          name,
        })
      } else {
        // update existujícího
        saved = await updateItem(selectedCode, {
          ...form,
          code,
          name,
        })
      }

      // aktualizace lokálního seznamu
      setItems((prev) => {
        const withoutOld = prev.filter((x) => x.code !== selectedCode)
        const merged = [...withoutOld]

        const existingIndex = merged.findIndex((x) => x.code === saved.code)
        if (existingIndex >= 0) {
          merged[existingIndex] = saved
        } else {
          merged.push(saved)
        }

        merged.sort((a, b) => {
          const aOrder = typeof a.sort_order === 'number' ? a.sort_order : 9999
          const bOrder = typeof b.sort_order === 'number' ? b.sort_order : 9999
          if (aOrder !== bOrder) return aOrder - bOrder
          return (a.name ?? '').localeCompare(b.name ?? '')
        })

        return merged
      })

      setSelectedCode(saved.code)
      setForm({
        code: saved.code,
        name: saved.name,
        description: saved.description ?? '',
        color: saved.color ?? '',
        icon: saved.icon ?? '',
        sort_order: saved.sort_order ?? null,
        active: saved.active ?? true,
      })
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

            <label className="generic-type__checkbox-label">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
              />
              <span>Zobrazit archivované</span>
            </label>
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
                      Ikona
                    </th>
                    <th className="generic-type__th generic-type__th--small">
                      Barva
                    </th>
                    <th className="generic-type__th">Popis</th>
                    <th className="generic-type__th generic-type__th--small">
                      Pořadí
                    </th>
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
                        onClick={() => handleSelectRow(item)}
                      >
                        <td className="generic-type__cell generic-type__cell--name">
                          <div className="generic-type__name-main">
                            {item.color ? (
                              <span
                                className="generic-type__name-badge"
                                style={{ backgroundColor: item.color || '' }}
                              >
                                {item.name}
                              </span>
                            ) : (
                              <span>{item.name}</span>
                            )}
                          </div>
                          <div className="generic-type__name-sub">{item.code}</div>
                        </td>

                        <td className="generic-type__cell generic-type__cell--center">
                          {iconSymbol && (
                            <span className="generic-type__icon-preview">
                              {iconSymbol}
                            </span>
                          )}
                        </td>

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

                        <td className="generic-type__cell generic-type__cell--description">
                          {item.description}
                        </td>

                        <td className="generic-type__cell generic-type__cell--small">
                          {typeof item.sort_order === 'number'
                            ? item.sort_order
                            : ''}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* PROSTŘEDNÍ HLÁŠKA ------------------------------------------------- */}
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

        {/* DOLNÍ FORMULÁŘ ---------------------------------------------------- */}
        <div className="generic-type__form">
          <h2 className="generic-type__form-title">Detail typu</h2>

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

            {/* Barva + Ikona + Pořadí */}
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
                {COLOR_PALETTE.map((hex) => {
                  const isSelected = (form.color ?? '').toLowerCase() ===
                    hex.toLowerCase()
                  const swatchClassNames = [
                    'generic-type__swatch',
                    isSelected ? 'generic-type__swatch--selected' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')
                  return (
                    <button
                      key={hex}
                      type="button"
                      className={swatchClassNames}
                      onClick={() => handleChangeField('color', hex)}
                      title={hex}
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
                  <span className="generic-type__icon-preview-label">Náhled:</span>
                  <span className="generic-type__icon-preview">
                    {getIcon(form.icon as IconKey)}
                  </span>
                </div>
              )}
            </div>

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

            {/* Stav / aktivita */}
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

          {/* Akční tlačítka */}
          <div className="generic-type__buttons">
            <button
              type="button"
              className="generic-type__button"
              onClick={resetFormToNew}
              disabled={saving}
            >
              Nový
            </button>

            <button
              type="button"
              className="generic-type__button generic-type__button--primary"
              onClick={handleSave}
              disabled={saving || !dirty}
            >
              {saving ? 'Ukládám…' : 'Uložit'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
