/*
 * FILE: app/UI/ConfigListWithForm.tsx
 * PURPOSE: Vzor pro nastavení typů (role, oprávnění, typ subjektu, typ nemovitosti...)
 * Layout = nahoře seznam, dole formulář vybraného typu.
 */

'use client'

import React from 'react'

export type ConfigItemBase = {
  id: string | number
  code: string
  name: string
  color?: string
  icon?: string
  order?: number
}

export type ConfigListWithFormProps<TItem extends ConfigItemBase> = {
  title: string
  items: TItem[]
  selectedId: string | number | null
  onSelect: (id: string | number) => void
  onChangeField: (field: keyof TItem, value: any) => void
  onSave: () => void
  onNew: () => void
  onDelete?: () => void
  loading?: boolean
}

/**
 * Generický UI vzor:
 * - horní panel = seznam typů (code, name, color, order)
 * - dolní panel = formulář vybraného typu + barevná paleta
 * Data neřešíme, jen UI a callbacky.
 */
export default function ConfigListWithForm<TItem extends ConfigItemBase>(
  props: ConfigListWithFormProps<TItem>,
) {
  const {
    title,
    items,
    selectedId,
    onSelect,
    onChangeField,
    onSave,
    onNew,
    onDelete,
    loading = false,
  } = props

  const selected = items.find((x) => x.id === selectedId) ?? null
  const hasItems = items.length > 0

  const colorPalette = [
    '#f4d35e',
    '#e05570',
    '#1e6fff',
    '#1fb086',
    '#d63ae5',
    '#6b7280',
    '#ff9f1c',
    '#0ea5e9',
    '#22c55e',
    '#a855f7',
    '#f97316',
    '#ef4444',
  ]

  return (
    <div className="relation-pane">
      {/* HORNÍ SEZNAM */}
      <div className="relation-pane__list">
        <div className="relation-pane__header">{title}</div>

        {loading && (
          <div className="relation-pane__empty">Načítání…</div>
        )}

        {!loading && !hasItems && (
          <div className="relation-pane__empty">
            Zatím žádné položky. Klikni na „Nový“, vytvoříš první typ.
          </div>
        )}

        {!loading && hasItems && (
          <ul className="relation-pane__list-inner">
            {items.slice(0, 200).map((item) => {
              const active = item.id === selectedId
              return (
                <li
                  key={item.id}
                  className={
                    'relation-pane__item' +
                    (active ? ' relation-pane__item--active' : '')
                  }
                  onClick={() => onSelect(item.id)}
                >
                  <div className="relation-pane__item-main">
                    <div className="relation-pane__item-line">
                      <span className="relation-pane__item-primary">
                        {item.name}
                      </span>
                      {typeof item.order === 'number' && (
                        <span className="relation-pane__item-order">
                          #{item.order}
                        </span>
                      )}
                    </div>
                    <div className="relation-pane__item-meta">
                      <span className="relation-pane__item-badge">
                        {item.code}
                      </span>
                      {item.color && (
                        <span
                          className="relation-pane__item-color"
                          style={{ backgroundColor: item.color }}
                        />
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* DOLNÍ FORMULÁŘ */}
      <div className="relation-pane__detail">
        {!selected && !loading && (
          <div className="relation-pane__empty">
            Vyber typ ze seznamu nahoře nebo klikni na „Nový“.
          </div>
        )}

        {selected && (
          <form
            className="config-form"
            onSubmit={(e) => {
              e.preventDefault()
              onSave()
            }}
          >
            <div className="config-form__grid">
              <div className="config-form__field">
                <label>Kód *</label>
                <input
                  value={selected.code}
                  onChange={(e) =>
                    onChangeField('code', e.target.value)
                  }
                  required
                />
              </div>

              <div className="config-form__field">
                <label>Název *</label>
                <input
                  value={selected.name}
                  onChange={(e) =>
                    onChangeField('name', e.target.value)
                  }
                  required
                />
              </div>

              <div className="config-form__field">
                <label>Barva</label>
                <input
                  value={selected.color ?? ''}
                  onChange={(e) =>
                    onChangeField('color', e.target.value)
                  }
                  placeholder="#e05570"
                />
                <div className="config-form__color-palette">
                  {colorPalette.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      className={
                        'config-form__color-swatch' +
                        (selected.color === hex
                          ? ' config-form__color-swatch--active'
                          : '')
                      }
                      style={{ backgroundColor: hex }}
                      onClick={() => onChangeField('color', hex)}
                    />
                  ))}
                </div>
              </div>

              <div className="config-form__field">
                <label>Ikona</label>
                <input
                  value={selected.icon ?? ''}
                  onChange={(e) =>
                    onChangeField('icon', e.target.value)
                  }
                  placeholder="users, manager, tenant..."
                />
              </div>

              <div className="config-form__field">
                <label>Pořadí</label>
                <input
                  type="number"
                  value={
                    typeof selected.order === 'number'
                      ? selected.order
                      : ''
                  }
                  onChange={(e) =>
                    onChangeField(
                      'order',
                      e.target.value === ''
                        ? undefined
                        : Number(e.target.value),
                    )
                  }
                  min={0}
                />
              </div>
            </div>

            <div className="config-form__buttons">
              <button
                type="button"
                onClick={onNew}
                className="btn btn--secondary"
              >
                Nový
              </button>
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="btn btn--danger"
                >
                  Smazat
                </button>
              )}
              <button type="submit" className="btn btn--primary">
                Uložit
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
