'use client'

/*
 * FILE: app/UI/DetailView.tsx
 * PURPOSE: Vzorový formulář detailu entity pro všechny moduly
 *
 * Použití:
 *  <EntityDetailFrame title="Pronajímatel K1" subtitle="IČO 12345678">
 *    <DetailView mode="edit" />
 *  </EntityDetailFrame>
 */

import React from 'react'

export type DetailViewMode = 'create' | 'edit' | 'view'

export type DetailViewProps = {
  /**
   * Režim formuláře:
   * - 'create' → zakládám novou entitu
   * - 'edit'   → upravuji existující entitu
   * - 'view'   → jen čtení (vše read-only)
   */
  mode: DetailViewMode

  /** Má formulář neuložené změny? (pro indikaci v UI) */
  isDirty?: boolean

  /** Probíhá ukládání (disable vstupy + tlačítko Uložit) */
  isSaving?: boolean

  /** Callback pro Uložit – řeší si ho konkrétní modul */
  onSave?: () => void

  /** Callback pro Zrušit / Zavřít – řeší si ho konkrétní modul */
  onCancel?: () => void
}

const MODE_LABEL: Record<DetailViewMode, string> = {
  create: 'Nová entita',
  edit: 'Upravit entitu',
  view: 'Detail entity',
}

export default function DetailView({
  mode,
  isDirty = false,
  isSaving = false,
  onSave,
  onCancel,
}: DetailViewProps) {
  const readOnly = mode === 'view' || isSaving

  const handleSaveClick = () => {
    if (readOnly) return
    onSave?.()
  }

  const handleCancelClick = () => {
    onCancel?.()
  }

  return (
    <div className="bg-white rounded p-4 shadow-sm text-sm">
      {/* Hlavička formuláře */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">
            {MODE_LABEL[mode]} – pracovní šablona
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Tohle je vzorový formulář detailu entity. Konkrétní modul si
            nahradí pole podle svých potřeb, ale zachová rozložení sekcí.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isDirty && mode !== 'view' && (
            <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
              Neuložené změny
            </span>
          )}
        </div>
      </div>

      {/* SEKCE 1 – Základní údaje */}
      <section className="mb-6">
        <h3 className="text-sm font-semibold mb-2">Základní údaje</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">
              Název / jméno <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full border rounded px-2 py-1.5 text-sm disabled:bg-gray-100"
              placeholder="Např. Pronajímatel K1 / Jan Novák"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">
              Kód / interní označení
            </label>
            <input
              type="text"
              className="w-full border rounded px-2 py-1.5 text-sm disabled:bg-gray-100"
              placeholder="Např. PRON-K1-0001"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Stav</label>
            <select
              className="w-full border rounded px-2 py-1.5 text-sm disabled:bg-gray-100"
              disabled={readOnly}
            >
              <option>AKTIVNÍ</option>
              <option>PLÁNOVANÁ</option>
              <option>UKONČENÁ / ARCHIV</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">
              Kategorie / typ (podle modulu)
            </label>
            <input
              type="text"
              className="w-full border rounded px-2 py-1.5 text-sm disabled:bg-gray-100"
              placeholder="Např. Fyzická osoba / Bytový dům…"
              disabled={readOnly}
            />
          </div>
        </div>
      </section>

      {/* SEKCE 2 – Adresa / kontakty (volitelné) */}
      <section className="mb-6">
        <h3 className="text-sm font-semibold mb-2">Adresa a kontaktní údaje</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium mb-1">
              Ulice a číslo
            </label>
            <input
              type="text"
              className="w-full border rounded px-2 py-1.5 text-sm disabled:bg-gray-100"
              placeholder="Např. Hlavní 123"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Město</label>
            <input
              type="text"
              className="w-full border rounded px-2 py-1.5 text-sm disabled:bg-gray-100"
              placeholder="Např. Štětí"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">PSČ</label>
            <input
              type="text"
              className="w-full border rounded px-2 py-1.5 text-sm disabled:bg-gray-100"
              placeholder="Např. 411 08"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">E-mail</label>
            <input
              type="email"
              className="w-full border rounded px-2 py-1.5 text-sm disabled:bg-gray-100"
              placeholder="např. info@pronajimatel.cz"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Telefon</label>
            <input
              type="tel"
              className="w-full border rounded px-2 py-1.5 text-sm disabled:bg-gray-100"
              placeholder="+420 123 456 789"
              disabled={readOnly}
            />
          </div>
        </div>
      </section>

      {/* SEKCE 3 – Poznámka */}
      <section className="mb-6">
        <h3 className="text-sm font-semibold mb-2">Poznámka</h3>
        <textarea
          className="w-full border rounded px-2 py-1.5 text-sm h-24 resize-y disabled:bg-gray-100"
          placeholder="Vnitřní poznámka k entitě – neuvidí ji nájemník ani třetí strany."
          disabled={readOnly}
        />
        <p className="text-[11px] text-gray-500 mt-1">
          Poznámka je interní, slouží jen pro správce / tým.
        </p>
      </section>

      {/* Ovládací prvky formuláře */}
      <div className="flex items-center justify-between border-t pt-3 mt-4">
        <p className="text-[11px] text-gray-500">
          <span className="text-red-500">*</span> Povinné pole · Režim:{' '}
          {mode === 'create' && 'zakládání nové entity'}
          {mode === 'edit' && 'úprava existující entity'}
          {mode === 'view' && 'pouze čtení (bez editace)'}
        </p>

        <div className="flex gap-2">
          {mode !== 'view' && (
            <button
              type="button"
              className="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-60"
              onClick={handleCancelClick}
              disabled={isSaving}
            >
              Zrušit
            </button>
          )}
          <button
            type="button"
            className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            onClick={handleSaveClick}
            disabled={readOnly || !isDirty}
          >
            {mode === 'create'
              ? 'Vytvořit'
              : mode === 'edit'
                ? 'Uložit změny'
                : 'Zavřít'}
          </button>
        </div>
      </div>
    </div>
  )
}
