/*
 * FILE: app/modules/900-nastaveni/tiles/SubjectTypesTile.tsx
 * PURPOSE: Číselník typů subjektů napojený na generický UI vzor ConfigListWithForm
 *
 * Primární klíč v DB = "code" (tabulka subject_types nemá sloupec "id").
 */

'use client'

import React, { useEffect, useState } from 'react'
import ConfigListWithForm, {
  ConfigItemBase,
} from '@/app/UI/ConfigListWithForm'
import {
  SubjectType,
  fetchSubjectTypes,
  createSubjectType,
  updateSubjectType,
  deleteSubjectType,
} from '../services/subjectTypes'

// UI reprezentace jednoho typu subjektu pro ConfigListWithForm
type SubjectTypeConfigItem = ConfigItemBase & {
  _dbCode?: string // skutečný klíč v DB (code)
  _isNew?: boolean
}

export default function SubjectTypesTile() {
  const [items, setItems] = useState<SubjectTypeConfigItem[]>([])
  const [selectedId, setSelectedId] = useState<string | number | null>(null)
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
      const rows: SubjectType[] = await fetchSubjectTypes()

      const mapped: SubjectTypeConfigItem[] = rows.map((r) => ({
        id: r.code, // v UI používáme jako ID "code"
        _dbCode: r.code,
        code: r.code ?? '',
        name: r.name ?? '',
        color: r.color ?? '',
        icon: r.icon ?? '',
        order: r.sort_order ?? undefined,
      }))

      setItems(mapped)
      if (mapped.length > 0) {
        setSelectedId(mapped[0].id)
      }
    } catch (err: any) {
      setError(err?.message ?? 'Chyba při načítání typů subjektu.')
    } finally {
      setLoading(false)
    }
  }

  // výběr položky v seznamu
  function handleSelect(id: string | number) {
    setSelectedId(id)
    setError(null)
    setSuccess(null)
  }

  // změna pole u aktuálně vybrané položky
  function updateItemField(field: keyof SubjectTypeConfigItem, value: any) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === selectedId ? { ...item, [field]: value } : item,
      ),
    )
  }

  // uložení vybrané položky (nové nebo existující)
  async function handleSave() {
    if (selectedId == null) {
      setError('Není vybrán žádný záznam.')
      return
    }

    const item = items.find((i) => i.id === selectedId)
    if (!item) {
      setError('Vybraný záznam nebyl nalezen.')
      return
    }

    if (!item.code.trim() || !item.name.trim()) {
      setError('Kód a název jsou povinné.')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      if (item._dbCode) {
        // UPDATE existujícího záznamu
        const updated = await updateSubjectType(item._dbCode, {
          code: item.code,
          name: item.name,
          description: '',
          color: item.color,
          icon: item.icon,
          order: item.order,
          is_active: true,
        })

        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  id: updated.code,
                  _dbCode: updated.code,
                  code: updated.code ?? '',
                  name: updated.name ?? '',
                  color: updated.color ?? '',
                  icon: updated.icon ?? '',
                  order: updated.sort_order ?? undefined,
                }
              : it,
          ),
        )
        setSelectedId(updated.code)
        setSuccess('Typ subjektu byl uložen.')
      } else {
        // CREATE nového záznamu
        const created = await createSubjectType({
          code: item.code,
          name: item.name,
          description: '',
          color: item.color,
          icon: item.icon,
          order: item.order,
          is_active: true,
        })

        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  id: created.code,
                  _dbCode: created.code,
                  code: created.code ?? '',
                  name: created.name ?? '',
                  color: created.color ?? '',
                  icon: created.icon ?? '',
                  order: created.sort_order ?? undefined,
                }
              : it,
          ),
        )
        setSelectedId(created.code)
        setSuccess('Typ subjektu byl vytvořen.')
      }
    } catch (err: any) {
      setError(err?.message ?? 'Chyba při ukládání typu subjektu.')
    } finally {
      setSaving(false)
    }
  }

  // vytvoření nové položky (zatím jen lokálně, bez DB)
  function handleNew() {
    const newId = `new-${Date.now()}`
    const newItem: SubjectTypeConfigItem = {
      id: newId,
      _isNew: true,
      code: '',
      name: '',
      color: undefined,
      icon: undefined,
      order: undefined,
    }

    setItems((prev) => [...prev, newItem])
    setSelectedId(newId)
    setError(null)
    setSuccess(null)
  }

  // smazání vybrané položky
  async function handleDelete() {
    if (selectedId == null) return
    const item = items.find((i) => i.id === selectedId)
    if (!item) return

    if (!window.confirm('Opravdu smazat tento typ subjektu?')) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      if (item._dbCode) {
        await deleteSubjectType(item._dbCode)
      }
      setItems((prev) => prev.filter((i) => i.id !== selectedId))
      setSelectedId(null)
      setSuccess('Typ subjektu byl smazán.')
    } catch (err: any) {
      setError(err?.message ?? 'Chyba při mazání typu subjektu.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="tile tile--config">
      <header className="tile__header">
        <h2 className="tile__title">Typy subjektů</h2>
        <p className="tile__subtitle">
          Číselník typů subjektů (osoba, firma, spolek…). Přidávat / upravovat
          může pouze admin.
        </p>
      </header>

      {error && <div className="msg msg--error">{error}</div>}
      {success && <div className="msg msg--success">{success}</div>}

      <ConfigListWithForm<SubjectTypeConfigItem>
        title="Typy subjektů"
        items={items}
        selectedId={selectedId}
        onSelect={handleSelect}
        onChangeField={updateItemField as any}
        onSave={handleSave}
        onNew={handleNew}
        onDelete={handleDelete}
        loading={loading || saving}
      />
    </div>
  )
}
