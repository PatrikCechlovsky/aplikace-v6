'use client'

/*
 * FILE: app/UI/GenericTypeTile.tsx
 * PURPOSE: Jednotný typový pohled pro číselníky typu:
 *          code, name, description, color, icon, sort_order, active
 *
 * UI vrstva:
 * - používá generickou komponentu ConfigListWithForm pro layout
 * - žádná logika Supabase, pouze práce s props fetch/create/update
 */

import React, { useEffect, useState } from 'react'
import ConfigListWithForm, {
  type ConfigItemBase,
  type ConfigListWithFormProps,
} from '@/app/UI/ConfigListWithForm'

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
  createItem: (input: GenericTypeItem) => Promise<GenericTypeItem>
  updateItem: (
    codeKey: string,
    input: GenericTypeItem,
  ) => Promise<GenericTypeItem>
}

// limity – stejné jako v původní verzi
const CODE_MAX = 20
const NAME_MAX = 50

type InternalItem = ConfigItemBase & {
  description: string
  active: boolean
  /** klientský příznak – nový řádek, ještě není v DB */
  _isNew?: boolean
}

/**
 * Mapování z generického API typu do interního typu pro UI
 */
function mapRowToInternal(row: GenericTypeItem): InternalItem {
  return {
    id: row.code,
    code: row.code,
    name: row.name,
    description: (row.description ?? '').toString(),
    color: row.color ?? '',
    icon: row.icon ?? '',
    order:
      typeof row.sort_order === 'number' && !Number.isNaN(row.sort_order)
        ? row.sort_order
        : undefined,
    active: row.active !== false,
  }
}

/**
 * Mapování z interního typu zpět na payload pro API
 */
function mapInternalToPayload(item: InternalItem): GenericTypeItem {
  return {
    code: item.code.trim(),
    name: item.name.trim(),
    description: item.description.trim() || null,
    color: item.color?.trim() || null,
    icon: item.icon?.trim() || null,
    sort_order:
      typeof item.order === 'number' && !Number.isNaN(item.order)
        ? item.order
        : null,
    active: item.active,
  }
}

export default function GenericTypeTile(props: GenericTypeTileProps) {
  const { title, description, fetchItems, createItem, updateItem } = props

  const [items, setItems] = useState<InternalItem[]>([])
  const [selectedId, setSelectedId] = useState<string | number | null>(null)
  const [selectedCodeKey, setSelectedCodeKey] = useState<string | null>(null)

  const [filterText, setFilterText] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const rows = await fetchItems()
        if (!isMounted) return

        const mapped = rows.map(mapRowToInternal)
        setItems(mapped)

        if (mapped.length > 0) {
          setSelectedId(mapped[0].id)
          setSelectedCodeKey(mapped[0].code)
        }
      } catch (_e) {
        if (!isMounted) return
        setError('Nepodařilo se načíst data.')
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [fetchItems])

  const normalizedFilter = filterText.trim().toLowerCase()

  const visibleItems = items
    .filter((item) => (showArchived ? true : item.active))
    .filter((item) => {
      if (!normalizedFilter) return true
      const haystack = `${item.name ?? ''} ${item.code ?? ''} ${
        item.description ?? ''
      }`.toLowerCase()
      return haystack.includes(normalizedFilter)
    })

  const selectedItem = items.find((x) => x.id === selectedId) ?? null

  function handleSelect(id: string | number) {
    const found = items.find((x) => x.id === id) ?? null
    setSelectedId(id)
    setSuccess(null)
    setError(null)
    if (found) {
      setSelectedCodeKey(found.code)
    } else {
      setSelectedCodeKey(null)
    }
  }

  function handleChangeField(field: keyof InternalItem, value: any) {
    if (!selectedId) return
    setItems((prev) =>
      prev.map((item) =>
        item.id === selectedId
          ? {
              ...item,
              [field]:
                field === 'code' || field === 'name'
                  ? String(value).slice(
                      0,
                      field === 'code' ? CODE_MAX : NAME_MAX,
                    )
                  : value,
            }
          : item,
      ),
    )
    setSuccess(null)
    setError(null)
  }

  function handleNew() {
    setSuccess(null)
    setError(null)

    const newItem: InternalItem = {
      id: `__new__-${Date.now()}`,
      code: '',
      name: '',
      description: '',
      color: '',
      icon: '',
      order: undefined,
      active: true,
      _isNew: true,
    }

    setItems((prev) => [newItem, ...prev])
    setSelectedId(newItem.id)
    setSelectedCodeKey(null)
  }

  async function handleSave() {
    if (!selectedItem) return

    const trimmedCode = selectedItem.code.trim()
    const trimmedName = selectedItem.name.trim()

    if (!trimmedCode) {
      setError('Kód je povinný.')
      setSuccess(null)
      return
    }
    if (!trimmedName) {
      setError('Název je povinný.')
      setSuccess(null)
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const payload = mapInternalToPayload(selectedItem)
      let saved: GenericTypeItem

      if (selectedItem._isNew || !selectedCodeKey) {
        saved = await createItem(payload)
      } else {
        saved = await updateItem(selectedCodeKey, payload)
      }

      const mapped = mapRowToInternal(saved)

      setItems((prev) =>
        prev.map((item) =>
          item.id === selectedItem.id ? mapped : item,
        ),
      )
      setSelectedId(mapped.id)
      setSelectedCodeKey(mapped.code)
      setSuccess('Uloženo.')
    } catch (_e) {
      setError('Uložení se nezdařilo.')
    } finally {
      setSaving(false)
    }
  }

  function handleToggleActive() {
    if (!selectedItem) return
    handleChangeField('active', !selectedItem.active)
  }

  const listProps: ConfigListWithFormProps<InternalItem> = {
    title,
    items: visibleItems,
    selectedId,
    onSelect: handleSelect,
    onChangeField: (field, value) =>
      handleChangeField(field as keyof InternalItem, value),
    onSave: handleSave,
    onNew: handleNew,
    loading: loading || saving,
  }

  return (
    <div className="generic-type-tile">
      <header className="generic-type-tile__header">
        <h2 className="generic-type-tile__title">{title}</h2>
        {description && (
          <p className="generic-type-tile__description">
            {description}
          </p>
        )}
      </header>

      {/* chybové / informační zprávy – sdílíme styly s login panelem */}
      {error && <p className="login-panel__error">{error}</p>}
      {success && <p className="login-panel__message">{success}</p>}

      {/* nástroje: filtr + archiv */}
      <div className="generic-type-tile__toolbar">
        <div className="generic-type-tile__toolbar-left">
          <label className="generic-type-tile__filter">
            <span>Filtrovat</span>
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Hledat podle názvu, kódu nebo popisu…"
            />
          </label>
        </div>
        <div className="generic-type-tile__toolbar-right">
          <label className="generic-type-tile__checkbox">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            <span>Zobrazit archivované</span>
          </label>
        </div>
      </div>

      {/* hlavní layout – seznam + formulář (kód, název, barva, ikona, pořadí) */}
      <ConfigListWithForm<InternalItem> {...listProps} />

      {/* doplňková část formuláře – popis + aktivní */}
      {selectedItem && (
        <div className="config-form generic-type-tile__extra-form">
          <div className="config-form__grid">
            <div className="config-form__field">
              <label>Popis</label>
              <textarea
                value={selectedItem.description}
                onChange={(e) =>
                  handleChangeField('description', e.target.value)
                }
                rows={3}
              />
            </div>

            <div className="config-form__field">
              <label>Stav</label>
              <label className="generic-type-tile__checkbox">
                <input
                  type="checkbox"
                  checked={selectedItem.active}
                  onChange={handleToggleActive}
                />
                <span>Aktivní záznam</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
