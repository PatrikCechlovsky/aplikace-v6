'use client'

/*
 * FILE: app/UI/GenericTypeTile.tsx
 * PURPOSE: Jednotný typový pohled pro číselníky typu:
 *          code, name, description, color, icon, sort_order, active
 *
 * Použití:
 *  - SubjectTypesTile jen napojí CRUD funkce ze svého service souboru.
 */

import React, { useEffect, useState } from 'react'

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
  updateItem: (codeKey: string, input: GenericTypeItem) => Promise<GenericTypeItem>
}

// sjednocené limity pro všechny typové formuláře
const CODE_MAX = 20
const NAME_MAX = 50
const COLOR_MAX = 10
const ORDER_MIN = 0
const ORDER_MAX = 999

// jednoduchá sdílená paleta barev
const COLOR_PALETTE = [
  '#f97316', // oranžová
  '#22c55e', // zelená
  '#3b82f6', // modrá
  '#6366f1', // indigo
  '#eab308', // žlutá
  '#f97373', // červená světlejší
  '#14b8a6', // tyrkys
  '#a855f7', // fialová
]

type FormState = {
  code: string
  name: string
  description: string
  color: string
  icon: string
  order: number | undefined
  active: boolean
}

const emptyForm: FormState = {
  code: '',
  name: '',
  description: '',
  color: '',
  icon: '',
  order: undefined,
  active: true,
}

function formFromRow(row: GenericTypeItem): FormState {
  return {
    code: row.code ?? '',
    name: row.name ?? '',
    description: (row.description ?? '') || '',
    color: (row.color ?? '') || '',
    icon: (row.icon ?? '') || '',
    order:
      typeof row.sort_order === 'number' && !Number.isNaN(row.sort_order)
        ? row.sort_order
        : undefined,
    active: row.active !== false,
  }
}

function rowFromForm(form: FormState): GenericTypeItem {
  return {
    code: form.code.trim(),
    name: form.name.trim(),
    description: form.description.trim() || null,
    color: form.color.trim() || null,
    icon: form.icon.trim() || null,
    sort_order:
      typeof form.order === 'number' && !Number.isNaN(form.order)
        ? form.order
        : null,
    active: form.active,
  }
}

export default function GenericTypeTile(props: GenericTypeTileProps) {
  const { title, description, fetchItems, createItem, updateItem } = props

  const [items, setItems] = useState<GenericTypeItem[]>([])
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [isNew, setIsNew] = useState<boolean>(true)

  const [filterText, setFilterText] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const rows = await fetchItems()
      setItems(rows)

      if (rows.length > 0) {
        setSelectedCode(rows[0].code)
        setForm(formFromRow(rows[0]))
        setIsNew(false)
      } else {
        setSelectedCode(null)
        setForm(emptyForm)
        setIsNew(true)
      }
    } catch (err: any) {
      console.error(err)
      setError(err?.message ?? 'Chyba při načítání typů.')
    } finally {
      setLoading(false)
    }
  }

  function handleSelect(code: string) {
    const row = items.find((r) => r.code === code)
    if (!row) return

    setSelectedCode(row.code)
    setForm(formFromRow(row))
    setIsNew(false)
    setError(null)
    setSuccess(null)
  }

  function handleFormChange<K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  function handleOrderChange(value: string) {
    if (value === '') {
      handleFormChange('order', undefined)
      return
    }
    let num = Number(value)
    if (Number.isNaN(num)) return
    if (num < ORDER_MIN) num = ORDER_MIN
    if (num > ORDER_MAX) num = ORDER_MAX
    handleFormChange('order', num)
  }

  // filtrovaný + (ne)archivovaný seznam
  const normalizedFilter = filterText.trim().toLowerCase()

  const filteredItems = items
    .filter((item) => (showArchived ? true : item.active !== false))
    .filter((item) => {
      if (!normalizedFilter) return true
      const haystack =
        (item.name ?? '') +
        ' ' +
        (item.code ?? '') +
        ' ' +
        (item.description ?? '')
      return haystack.toLowerCase().includes(normalizedFilter)
    })

  const selectedIndex = filteredItems.findIndex(
    (i) => i.code === selectedCode,
  )

  function selectByIndex(newIndex: number) {
    if (newIndex < 0 || newIndex >= filteredItems.length) return
    const row = filteredItems[newIndex]
    if (!row) return
    setSelectedCode(row.code)
    setForm(formFromRow(row))
    setIsNew(false)
    setError(null)
    setSuccess(null)
  }

  function handlePrev() {
    if (selectedIndex === -1) return
    selectByIndex(selectedIndex - 1)
  }

  function handleNext() {
    if (selectedIndex === -1) return
    selectByIndex(selectedIndex + 1)
  }

  async function handleSave() {
    const trimmedCode = form.code.trim()
    const trimmedName = form.name.trim()

    if (!trimmedCode || !trimmedName) {
      setError('Kód a název jsou povinné.')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const payload = rowFromForm(form)

      if (isNew || !selectedCode) {
        // CREATE
        const created = await createItem(payload)
        setItems((prev) => [...prev, created])
        setSelectedCode(created.code)
        setForm(formFromRow(created))
        setIsNew(false)
        setSuccess('Záznam byl vytvořen.')
      } else {
        // UPDATE
        const updated = await updateItem(selectedCode, payload)
        setItems((prev) =>
          prev.map((r) => (r.code === selectedCode ? updated : r)),
        )
        setSelectedCode(updated.code)
        setForm(formFromRow(updated))
        setIsNew(false)
        setSuccess('Záznam byl uložen.')
      }
    } catch (err: any) {
      console.error(err)
      setError(err?.message ?? 'Chyba při ukládání.')
    } finally {
      setSaving(false)
    }
  }

  function handleNew() {
    setSelectedCode(null)
    setForm(emptyForm)
    setIsNew(true)
    setError(null)
    setSuccess(null)
  }

  // archivace = active = false (žádné fyzické mazání)
  async function handleArchive() {
    if (!selectedCode) return

    if (!window.confirm('Opravdu archivovat tento záznam?')) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const payload = { ...rowFromForm(form), active: false }
      const updated = await updateItem(selectedCode, payload)
      setItems((prev) =>
        prev.map((r) => (r.code === selectedCode ? updated : r)),
      )
      setSelectedCode(updated.code)
      setForm(formFromRow(updated))
      setIsNew(false)
      setSuccess('Záznam byl archivován.')
    } catch (err: any) {
      console.error(err)
      setError(err?.message ?? 'Chyba při archivaci.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: '16px 24px' }}>
      <header style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
          {title}
        </h2>
        {description && (
          <p style={{ fontSize: 13, color: '#555' }}>{description}</p>
        )}
      </header>

      {error && (
        <div
          style={{
            marginBottom: 12,
            padding: '8px 12px',
            borderRadius: 6,
            background: '#ffe5e5',
            color: '#900',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            marginBottom: 12,
            padding: '8px 12px',
            borderRadius: 6,
            background: '#e5ffe8',
            color: '#086b1f',
            fontSize: 13,
          }}
        >
          {success}
        </div>
      )}

      {loading ? (
        <div>Načítání…</div>
      ) : (
        <>
          {/* 🔹 HORNÍ BLOK – FILTR + TABULKA */}
          <section
            style={{
              borderRadius: 8,
              border: '1px solid #ddd',
              background: '#fafafa',
              padding: 8,
              marginBottom: 16,
            }}
          >
            {/* řádek: filtr + "Zobrazit archivované" + tlačítko Nový */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <div style={{ flex: '1 1 220px' }}>
                <input
                  type="text"
                  placeholder="Filtrovat…"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '4px 8px',
                    borderRadius: 999,
                    border: '1px solid #ddd',
                    fontSize: 13,
                  }}
                />
              </div>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 13,
                }}
              >
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                />
                <span>Zobrazit archivované</span>
              </label>

              <button
                type="button"
                title="Nový záznam"
                onClick={handleNew}
                style={{
                  marginLeft: 'auto',
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  border: 'none',
                  background: '#f97316',
                  color: '#fff',
                  fontSize: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                +
              </button>
            </div>

            {/* tabulka typů */}
            <div
              style={{
                maxHeight: 260, // ~10 řádků
                overflowY: 'auto',
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: 13,
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '4px 6px',
                        borderBottom: '1px solid #ddd',
                      }}
                    >
                      Název
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '4px 6px',
                        borderBottom: '1px solid #ddd',
                      }}
                    >
                      Ikona
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '4px 6px',
                        borderBottom: '1px solid #ddd',
                      }}
                    >
                      Barva
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '4px 6px',
                        borderBottom: '1px solid '#ddd',
                      }}
                    >
                      Popis
                    </th>
                    <th
                      style={{
                        textAlign: 'right',
                        padding: '4px 6px',
                        borderBottom: '1px solid #ddd',
                      }}
                    >
                      Pořadí
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        style={{
                          padding: '6px 8px',
                          color: '#777',
                          fontStyle: 'italic',
                        }}
                      >
                        Žádné položky neodpovídají filtru.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const isSelected = item.code === selectedCode
                      const bgSelected = '#e0ecff'
                      const bgColor =
                        item.color && /^#.{3,6}/.test(item.color)
                          ? item.color
                          : isSelected
                          ? bgSelected
                          : 'transparent'

                      const rowStyle: React.CSSProperties = {
                        cursor: 'pointer',
                        background: isSelected ? '#f1f5ff' : 'transparent',
                      }

                      const nameCellStyle: React.CSSProperties = {
                        padding: '6px 6px',
                        borderBottom: '1px solid #eee',
                        background: bgColor,
                        fontWeight: 600,
                      }

                      const mutedStyle: React.CSSProperties = {
                        fontSize: 11,
                        color: '#555',
                        opacity: item.active === false ? 0.6 : 1,
                      }

                      return (
                        <tr
                          key={item.code}
                          style={rowStyle}
                          onClick={() => handleSelect(item.code)}
                        >
                          <td style={nameCellStyle}>
                            <div style={mutedStyle}>
                              {item.name || '(bez názvu)'}
                              {item.active === false ? ' • archivováno' : ''}
                            </div>
                            <div
                              style={{
                                fontSize: 10,
                                color: '#333',
                                opacity: 0.7,
                              }}
                            >
                              {item.code}
                            </div>
                          </td>
                          <td
                            style={{
                              padding: '6px 6px',
                              borderBottom: '1px solid #eee',
                              ...mutedStyle,
                            }}
                          >
                            {item.icon}
                          </td>
                          <td
                            style={{
                              padding: '6px 6px',
                              borderBottom: '1px solid #eee',
                              ...mutedStyle,
                            }}
                          >
                            {item.color}
                          </td>
                          <td
                            style={{
                              padding: '6px 6px',
                              borderBottom: '1px solid #eee',
                              ...mutedStyle,
                            }}
                          >
                            {item.description}
                          </td>
                          <td
                            style={{
                              padding: '6px 6px',
                              borderBottom: '1px solid #eee',
                              textAlign: 'right',
                              ...mutedStyle,
                            }}
                          >
                            {item.sort_order ?? ''}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* 🔹 DOLNÍ BLOK – FORMULÁŘ + navigace + aktivní + uložit / archivovat */}
          <section
            style={{
              borderRadius: 8,
              border: '1px solid #ddd',
              background: '#fff',
              padding: 12,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
                gap: 8,
              }}
            >
              <strong style={{ fontSize: 13 }}>
                {isNew ? 'Nový záznam' : 'Detail záznamu'}
              </strong>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {/* Aktivní */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 13,
                    marginRight: 8,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) =>
                      handleFormChange('active', e.target.checked)
                    }
                  />
                  <span>Aktivní</span>
                </label>

                {/* Předchozí / další */}
                <button
                  type="button"
                  title="Předchozí"
                  onClick={handlePrev}
                  disabled={selectedIndex <= 0}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    border: '1px solid #ccc',
                    background: '#f9fafb',
                    fontSize: 14,
                    cursor:
                      selectedIndex <= 0 ? 'not-allowed' : 'pointer',
                    opacity: selectedIndex <= 0 ? 0.5 : 1,
                  }}
                >
                  ‹
                </button>
                <button
                  type="button"
                  title="Následující"
                  onClick={handleNext}
                  disabled={
                    selectedIndex === -1 ||
                    selectedIndex >= filteredItems.length - 1
                  }
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    border: '1px solid #ccc',
                    background: '#f9fafb',
                    fontSize: 14,
                    cursor:
                      selectedIndex === -1 ||
                      selectedIndex >= filteredItems.length - 1
                        ? 'not-allowed'
                        : 'pointer',
                    opacity:
                      selectedIndex === -1 ||
                      selectedIndex >= filteredItems.length - 1
                        ? 0.5
                        : 1,
                  }}
                >
                  ›
                </button>

                {/* Uložit */}
                <button
                  type="button"
                  title="Uložit"
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    border: 'none',
                    background: '#16a34a',
                    color: '#fff',
                    fontSize: 17,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: saving ? 'default' : 'pointer',
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  💾
                </button>

                {/* Archivovat */}
                {!isNew && (
                  <button
                    type="button"
                    title="Archivovat"
                    onClick={handleArchive}
                    disabled={saving}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      border: 'none',
                      background: '#dc2626',
                      color: '#fff',
                      fontSize: 17,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: saving ? 'default' : 'pointer',
                      opacity: saving ? 0.7 : 1,
                    }}
                  >
                    🗄
                  </button>
                )}
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSave()
              }}
              style={{ fontSize: 13 }}
            >
              {/* Kód + Název */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <label style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ marginBottom: 2 }}>
                    Kód <span style={{ color: '#dc2626' }}>*</span>
                  </span>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) =>
                      handleFormChange(
                        'code',
                        e.target.value.toUpperCase().slice(0, CODE_MAX),
                      )
                    }
                    maxLength={CODE_MAX}
                    style={{
                      padding: '4px 6px',
                      borderRadius: 4,
                      border: '1px solid #ccc',
                    }}
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ marginBottom: 2 }}>
                    Název <span style={{ color: '#dc2626' }}>*</span>
                  </span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      handleFormChange(
                        'name',
                        e.target.value.slice(0, NAME_MAX),
                      )
                    }
                    maxLength={NAME_MAX}
                    style={{
                      padding: '4px 6px',
                      borderRadius: 4,
                      border: '1px solid #ccc',
                    }}
                  />
                </label>
              </div>

              {/* Barva + paleta + Ikona + Pořadí */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                {/* Barva */}
                <label style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ marginBottom: 2 }}>Barva (hex)</span>
                  <input
                    type="text"
                    value={form.color}
                    onChange={(e) =>
                      handleFormChange(
                        'color',
                        e.target.value.slice(0, COLOR_MAX),
                      )
                    }
                    maxLength={COLOR_MAX}
                    placeholder="#f97316"
                    style={{
                      padding: '4px 6px',
                      borderRadius: 4,
                      border: '1px solid #ccc',
                      marginBottom: 4,
                    }}
                  />
                  {/* paleta barev */}
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {COLOR_PALETTE.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleFormChange('color', c)}
                        title={c}
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 999,
                          border:
                            form.color === c
                              ? '2px solid #111827'
                              : '1px solid #ccc',
                          background: c,
                          padding: 0,
                          cursor: 'pointer',
                        }}
                      />
                    ))}
                  </div>
                </label>

                {/* Ikona – zatím text, později napojíme na centrální seznam ikon */}
                <label style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ marginBottom: 2 }}>Ikona</span>
                  <input
                    type="text"
                    value={form.icon}
                    onChange={(e) => handleFormChange('icon', e.target.value)}
                    placeholder="👤"
                    style={{
                      padding: '4px 6px',
                      borderRadius: 4,
                      border: '1px solid #ccc',
                    }}
                  />
                </label>

                {/* Pořadí */}
                <label style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ marginBottom: 2 }}>Pořadí</span>
                  <input
                    type="number"
                    value={form.order ?? ''}
                    onChange={(e) => handleOrderChange(e.target.value)}
                    min={ORDER_MIN}
                    max={ORDER_MAX}
                    style={{
                      padding: '4px 6px',
                      borderRadius: 4,
                      border: '1px solid #ccc',
                    }}
                  />
                </label>
              </div>

              {/* Popis */}
              <label
                style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
              >
                <span>Popis</span>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    handleFormChange('description', e.target.value)
                  }
                  rows={3}
                  style={{
                    padding: '4px 6px',
                    borderRadius: 4,
                    border: '1px solid #ccc',
                    resize: 'vertical',
                  }}
                />
              </label>
            </form>
          </section>
        </>
      )}
    </div>
  )
}
