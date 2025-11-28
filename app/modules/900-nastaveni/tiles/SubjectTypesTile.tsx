/*
 * FILE: app/modules/900-nastaveni/tiles/SubjectTypesTile.tsx
 * PURPOSE: Přehled + formulář pro číselník subject_types (typy subjektů)
 */

'use client'

import React, { useEffect, useState } from 'react'
import {
  SubjectType,
  fetchSubjectTypes,
  createSubjectType,
  updateSubjectType,
  deleteSubjectType,
} from '../services/subjectTypes'

type FormState = {
  id: string | null
  code: string
  label: string
  description: string
  is_active: boolean
}

const emptyForm: FormState = {
  id: null,
  code: '',
  label: '',
  description: '',
  is_active: true,
}

export default function SubjectTypesTile() {
  const [items, setItems] = useState<SubjectType[]>([])
  const [form, setForm] = useState<FormState>(emptyForm)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // načtení seznamu při prvním renderu
  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchSubjectTypes()
      setItems(data)
    } catch (err: any) {
      setError(err?.message ?? 'Chyba při načítání typů subjektů.')
    } finally {
      setLoading(false)
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  function handleCheckboxChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, checked } = e.target
    setForm(prev => ({
      ...prev,
      [name]: checked,
    }))
  }

  function handleEditClick(item: SubjectType) {
    setForm({
      id: item.id,
      code: item.code ?? '',
      label: item.label ?? '',
      description: item.description ?? '',
      is_active: item.is_active ?? true,
    })
    setSuccess(null)
    setError(null)
  }

  function handleCancelEdit() {
    setForm(emptyForm)
    setSuccess(null)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      if (!form.code.trim() || !form.label.trim()) {
        setError('Kód a název jsou povinné.')
        setSaving(false)
        return
      }

      if (form.id) {
        // EDIT
        const updated = await updateSubjectType(form.id, {
          code: form.code,
          label: form.label,
          description: form.description,
          is_active: form.is_active,
        })

        setItems(prev =>
          prev.map(item => (item.id === updated.id ? updated : item))
        )
        setSuccess('Typ subjektu byl upraven.')
      } else {
        // CREATE
        const created = await createSubjectType({
          code: form.code,
          label: form.label,
          description: form.description,
          is_active: form.is_active,
        })

        setItems(prev => [...prev, created])
        setSuccess('Typ subjektu byl vytvořen.')
      }

      setForm(emptyForm)
    } catch (err: any) {
      // typicky error z RLS (pokud by to zkoušel ne-admin)
      setError(err?.message ?? 'Chyba při ukládání typu subjektu.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Opravdu smazat tento typ subjektu?')) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      await deleteSubjectType(id)
      setItems(prev => prev.filter(item => item.id !== id))
      setSuccess('Typ subjektu byl smazán.')
      if (form.id === id) {
        setForm(emptyForm)
      }
    } catch (err: any) {
      setError(err?.message ?? 'Chyba při mazání typu subjektu.')
    } finally {
      setSaving(false)
    }
  }

  const isEditMode = !!form.id

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold">Typy subjektů</h2>
        <p className="text-sm text-gray-600">
          Číselník typů subjektů (person, company, landlord, tenant…).
          Přidávat/upravovat může pouze admin.
        </p>
      </header>

      {/* Formulář */}
      <section className="rounded-xl border border-gray-200 p-4 shadow-sm bg-white space-y-4">
        <h3 className="text-lg font-medium">
          {isEditMode ? 'Upravit typ subjektu' : 'Nový typ subjektu'}
        </h3>

        {error && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium" htmlFor="code">
                Kód typu subjektu
              </label>
              <input
                id="code"
                name="code"
                type="text"
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={form.code}
                onChange={handleChange}
                placeholder="např. person, company, landlord"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium" htmlFor="label">
                Název (label)
              </label>
              <input
                id="label"
                name="label"
                type="text"
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={form.label}
                onChange={handleChange}
                placeholder="např. Fyzická osoba, Firma, Pronajímatel"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" htmlFor="description">
              Popis
            </label>
            <textarea
              id="description"
              name="description"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm min-h-[60px]"
              value={form.description}
              onChange={handleChange}
              placeholder="Nepovinný popis typu subjektu..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="is_active"
              name="is_active"
              type="checkbox"
              className="h-4 w-4"
              checked={form.is_active}
              onChange={handleCheckboxChange}
            />
            <label htmlFor="is_active" className="text-sm">
              Aktivní typ subjektu
            </label>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {saving
                ? isEditMode
                  ? 'Ukládám...'
                  : 'Vytvářím...'
                : isEditMode
                ? 'Uložit změny'
                : 'Vytvořit'}
            </button>

            {isEditMode && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
              >
                Zrušit úpravy
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Přehled */}
      <section className="rounded-xl border border-gray-200 p-4 shadow-sm bg-white">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-medium">Přehled typů subjektů</h3>
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="text-sm underline disabled:opacity-60"
          >
            {loading ? 'Načítám...' : 'Obnovit seznam'}
          </button>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-gray-500">
            Zatím nejsou žádné typy subjektů. Přidej první pomocí formuláře
            nahoře.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-3 py-2 font-medium">Kód</th>
                  <th className="px-3 py-2 font-medium">Název</th>
                  <th className="px-3 py-2 font-medium">Popis</th>
                  <th className="px-3 py-2 font-medium">Aktivní</th>
                  <th className="px-3 py-2 font-medium text-right">Akce</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="px-3 py-2">{item.code}</td>
                    <td className="px-3 py-2">{item.label}</td>
                    <td className="px-3 py-2 text-gray-600">
                      {item.description}
                    </td>
                    <td className="px-3 py-2">
                      {item.is_active ? 'Ano' : 'Ne'}
                    </td>
                    <td className="px-3 py-2 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleEditClick(item)}
                        className="text-xs text-blue-600 underline"
                      >
                        Upravit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="text-xs text-red-600 underline"
                      >
                        Smazat
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
