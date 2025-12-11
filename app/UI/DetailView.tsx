'use client'

/*
 * FILE: app/UI/DetailView.tsx
 * PURPOSE: Vzorový formulář detailu entity pro všechny moduly
 *
 * Použití (obecný příklad):
 *  <EntityDetailFrame title="Pronajímatel K1" subtitle="IČO 12345678">
 *    <DetailView
 *      mode={mode}
 *      isDirty={isDirty}
 *      isSaving={isSaving}
 *      onModeChange={setMode}
 *      onAttach={handleAttach}
 *      onUndo={handleUndo}
 *      onReject={handleReject}
 *    >
 *      {...vlastní formulářové sekce...}
 *    </DetailView>
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

  /** Probíhá ukládání (disable vstupy + tlačítka) */
  isSaving?: boolean

  /** Callback pro Uložit – řeší si ho konkrétní modul (volitelné) */
  onSave?: () => void

  /** Callback pro Zrušit / Zavřít – řeší si ho konkrétní modul (volitelné) */
  onCancel?: () => void

  /** Přepnutí režimu view ↔ edit (Edit/View tlačítko) */
  onModeChange?: (mode: DetailViewMode) => void

  /** Paperclip – přidání přílohy / přepnutí na sekci příloh */
  onAttach?: () => void

  /** Undo – vrácení neuložených změn */
  onUndo?: () => void

  /** Reject – odmítnout / zamítnout / archivovat apod. */
  onReject?: () => void

  /** Volitelný vlastní obsah – pokud není dodán, použije se demo šablona */
  children?: React.ReactNode
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
  onModeChange,
  onAttach,
  onUndo,
  onReject,
  children,
}: DetailViewProps) {
  const readOnly = mode === 'view' || isSaving

  const handleSaveClick = () => {
    if (readOnly) return
    onSave?.()
  }

  const handleCancelClick = () => {
    onCancel?.()
  }

  const handleToggleMode = () => {
    if (!onModeChange || mode === 'create') return
    const nextMode: DetailViewMode = mode === 'view' ? 'edit' : 'view'
    onModeChange(nextMode)
  }

  const handleAttach = () => {
    onAttach?.()
  }

  const handleUndo = () => {
    if (!isDirty || isSaving) return
    onUndo?.()
  }

  const handleReject = () => {
    if (isSaving) return
    onReject?.()
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

          {/* 1) EDIT / VIEW toggle – jen pokud nejsem v create */}
          {mode !== 'create' && (
            <button
              type="button"
              className="px-2 py-1 text-xs border rounded hover:bg-gray-50 disabled:opacity-50"
              onClick={handleToggleMode}
              disabled={isSaving}
            >
              {mode === 'view' ? 'Upravit' : 'Detail'}
            </button>
          )}

          {/* 2) Paperclip – přílohy */}
          <button
            type="button"
            className="px-2 py-1 text-xs border rounded hover:bg-gray-50 disabled:opacity-50"
            onClick={handleAttach}
            disabled={isSaving}
          >
            📎 Příloha
          </button>

          {/* 3) Undo – vrátit změny */}
          <button
            type="button"
            className="px-2 py-1 text-xs border rounded hover:bg-gray-50 disabled:opacity-50"
            onClick={handleUndo}
            disabled={!isDirty || isSaving}
          >
            ↺ Vrátit změny
          </button>

          {/* 4) Reject – zamítnout */}
          <button
            type="button"
            className="px-2 py-1 text-xs border rounded border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"
            onClick={handleReject}
            disabled={isSaving}
          >
            ✕ Zamítnout
          </button>
        </div>
      </div>

      {/* TĚLO FORMULÁŘE: buď vlastní children (např. UserDetailForm),
          nebo fallback demo šablona tak jako doteď */}
      <div className="space-y-6">
        {children ?? (
          <>
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
                    <option>Aktivní</option>
                    <option>Archivovaný</option>
                    <option>Rozpracováno</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Kategorie / typ
                  </label>
                  <select
                    className="w-full border rounded px-2 py-1.5 text-sm disabled:bg-gray-100"
                    disabled={readOnly}
                  >
                    <option>Pronajímatel</option>
                    <option>Nemovitost</option>
                    <option>Jednotka</option>
                  </select>
                </div>
              </div>
            </section>

            {/* SEKCE 2 – Adresa (demo) */}
            <section className="mb-6">
              <h3 className="text-sm font-semibold mb-2">Adresa</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                  <label className="block text-xs font-medium mb-1">
                    Město
                  </label>
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
                  <label className="block text-xs font-medium mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    className="w-full border rounded px-2 py-1.5 text-sm disabled:bg-gray-100"
                    placeholder="např. info@pronajimatel.cz"
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Telefon
                  </label>
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
          </>
        )}
      </div>

      {/* Ovládací prvky formuláře (spodní lišta) */}
      <div className="flex items-center justify-between border-t pt-3 mt-4">
        <p className="text-[11px] text-gray-500">
          <span className="text-red-500">*</span> Povinné pole · Režim:{' '}
          {mode === 'create' && 'zakládání nové entity'}
          {mode === 'edit' && 'úprava existující entity'}
          {mode === 'view' && 'pouze čtení (bez editace)'}
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            className="px-3 py-1.5 text-xs border rounded hover:bg-gray-50 disabled:opacity-50"
            onClick={handleCancelClick}
            disabled={isSaving}
          >
            Zavřít
          </button>
          <button
            type="button"
            className="px-3 py-1.5 text-xs rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
            onClick={handleSaveClick}
            disabled={readOnly || isSaving}
          >
            Uložit
          </button>
        </div>
      </div>
    </div>
  )
}
