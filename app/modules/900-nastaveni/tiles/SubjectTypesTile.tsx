'use client'

/*
 * FILE: app/modules/900-nastaveni/tiles/SubjectTypesTile.tsx
 * LAYOUT:
 *  - nahoře seznam typů (cca 10 řádků + scroll)
 *  - pod seznamem formulář
 */

import React, { useEffect, useState } from 'react'
import type { SubjectType } from '../services/subjectTypes'
import {
  fetchSubjectTypes,
  createSubjectType,
  updateSubjectType,
  deleteSubjectType,
} from '../services/subjectTypes'

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

function formFromRow(row: SubjectType): FormState {
  return {
    code: row.code ?? '',
    name: row.name ?? '',
    description: row.description ?? '',
    color: row.color ?? '',
    icon: row.icon ?? '',
    order: row.sort_order ?? undefined,
    active: row.active ?? true,
  }
}

export default function SubjectTypesTile() {
  const [items, setItems] = useState<SubjectType[]>([])
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [isNew, setIsNew] = useState<boolean>(true)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // načtení dat z DB
  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const rows = await fetchSubjectTypes()
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
      setError(err?.message ?? 'Chyba při načítání typů subjektů.')
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
    const num = Number(value)
    if (Number.isNaN(num)) return
    handleFormChange('order', num)
  }

  async function handleSave() {
    if (!form.code.trim() || !form.name.trim()) {
      setError('Kód a název jsou povinné.')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      if (isNew || !selectedCode) {
        // CREATE
        const created = await createSubjectType({
          code: form.code,
          name: form.name,
          description: form.description,
          color: form.color || undefined,
          icon: form.icon || undefined,
          order: form.order,
          is_active: form.active,
        })

        setItems((prev) => [...prev, created])
        setSelectedCode(created.code)
        setForm(formFromRow(created))
        setIsNew(false)
        setSuccess('Typ subjektu byl vytvořen.')
      } else {
        // UPDATE
        const updated = await updateSubjectType(selectedCode, {
          code: form.code,
          name: form.name,
          description: form.description,
          color: form.color || undefined,
          icon: form.icon || undefined,
          order: form.order,
          is_active: form.active,
        })

        setItems((prev) =>
          prev.map((r) => (r.code === selectedCode ? updated : r)),
        )
        setSelectedCode(updated.code)
        setForm(formFromRow(updated))
        setIsNew(false)
        setSuccess('Typ subjektu byl uložen.')
      }
    } catch (err: any) {
      console.error(err)
      setError(err?.message ?? 'Chyba při ukládání typu subjektu.')
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

  async function handleDelete() {
    if (!selectedCode) return

    if (!window.confirm('Opravdu smazat tento typ subjektu?')) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      await deleteSubjectType(selectedCode)
      const remaining = items.filter((r) => r.code !== selectedCode)
      setItems(remaining)

      if (remaining.length > 0) {
        setSelectedCode(remaining[0].code)
        setForm(formFromRow(remaining[0]))
        setIsNew(false)
      } else {
        setSelectedCode(null)
        setForm(emptyForm)
        setIsNew(true)
      }

      setSuccess('Typ subjektu byl smazán.')
    } catch (err: any) {
      console.error(err)
      setError(err?.message ?? 'Chyba při mazání typu subjektu.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: '16px 24px' }}>
      <header style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
          Typy subjektů
        </h2>
        <p style={{ fontSize: 13, color: '#555' }}>
          Číselník typů subjektů (osoba, firma, spolek…). Přidávat / upravovat
          může pouze admin.
        </p>
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
          {/* 🔹 HORNÍ BLOK – SEZNAM + tlačítko „Nový“ */}
          <section
            style={{
              borderRadius: 8,
              border: '1px solid #ddd',
              background: '#fafafa',
              padding: 8,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <strong style={{ fontSize: 13 }}>Seznam typů subjektů</strong>
              <button
                type="button"
                onClick={handleNew}
                style={{
                  fontSize: 12,
                  padding: '4px 8px',
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  background: '#f97316',
                  color: '#fff',
                }}
              >
                + Nový
              </button>
            </div>

            <div
              style={{
                maxHeight: 260, // ~10 řádků, pak scroll
                overflowY: 'auto',
              }}
            >
              {items.length === 0 ? (
                <div style={{ fontSize: 13, color: '#777', padding: 4 }}>
                  Zatím žádné položky. Klikni na „Nový“ a vytvoř první typ.
                </div>
              ) : (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {items.map((item) => {
                    const isSelected = item.code === selectedCode
                    return (
                      <li key={item.code} style={{ marginBottom: 2 }}>
                        <button
                          type="button"
                          onClick={() => handleSelect(item.code)}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '6px 8px',
                            borderRadius: 6,
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 13,
                            background: isSelected
                              ? '#e0ecff'
                              : 'transparent',
                          }}
                        >
                          <div style={{ fontWeight: 600 }}>
                            {item.name || '(bez názvu)'}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: '#666',
                              marginTop: 2,
                            }}
                          >
                            {item.code}
                            {item.active === false ? ' • neaktivní' : ''}
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </section>

          {/* 🔹 DOLNÍ BLOK – FORMULÁŘ */}
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
              }}
            >
              <strong style={{ fontSize: 13 }}>
                {isNew ? 'Nový typ subjektu' : 'Detail typu subjektu'}
              </strong>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    fontSize: 12,
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                    background: '#16a34a',
                    color: '#fff',
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? 'Ukládám…' : 'Uložit'}
                </button>

                {!isNew && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={saving}
                    style={{
                      fontSize: 12,
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: 'none',
                      cursor: 'pointer',
                      background: '#dc2626',
                      color: '#fff',
                      opacity: saving ? 0.7 : 1,
                    }}
                  >
                    Smazat
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
                  gridTemplateColumns: '1fr 2fr',
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
                      handleFormChange('code', e.target.value.toUpperCase())
                    }
                    maxLength={30}
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
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    maxLength={100}
                    style={{
                      padding: '4px 6px',
                      borderRadius: 4,
                      border: '1px solid #ccc',
                    }}
                  />
                </label>
              </div>

              {/* Barva + Ikona + Pořadí + Aktivní */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr auto',
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <label style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ marginBottom: 2 }}>Barva (hex)</span>
                  <input
                    type="text"
                    value={form.color}
                    onChange={(e) => handleFormChange('color', e.target.value)}
                    placeholder="#f97316"
                    style={{
                      padding: '4px 6px',
                      borderRadius: 4,
                      border: '1px solid #ccc',
                    }}
                  />
                </label>

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

                <label style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ marginBottom: 2 }}>Pořadí</span>
                  <input
                    type="number"
                    value={form.order ?? ''}
                    onChange={(e) => handleOrderChange(e.target.value)}
                    style={{
                      padding: '4px 6px',
                      borderRadius: 4,
                      border: '1px solid #ccc',
                    }}
                  />
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 22,
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
