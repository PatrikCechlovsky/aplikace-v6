'use client'

/*
 * FILE: app/UI/DetailView.tsx
 * PURPOSE: Vzorový formulář detailu entity pro všechny moduly
 *
 * DŮLEŽITÉ:
 *  - DetailView už NEOBSAHUJE žádná akční tlačítka (edit, příloha, undo, reject).
 *  - Všechna akční tlačítka patří do CommonActions v horní liště aplikace.
 *  - DetailView jen zobrazuje obsah a spodní "Zavřít / Uložit" jako součást formuláře.
 *
 * Použití:
 *  <EntityDetailFrame title="…" subtitle="…">
 *    <DetailView
 *      mode={mode}
 *      isDirty={isDirty}
 *      isSaving={isSaving}
 *      onSave={handleSave}
 *      onCancel={handleCancel}
 *    >
 *      <UserDetailForm
 *        user={user}
 *        readOnly={mode === 'view'}
 *        onDirtyChange={setIsDirty}
 *      />
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

  /** Volitelný vlastní obsah – typicky konkrétní formulář modulu */
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

  return (
    <div className="bg-white rounded p-4 shadow-sm text-sm">
      {/* Hlavička formuláře – jen text, žádná tlačítka */}
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

        {isDirty && mode !== 'view' && (
          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
            Neuložené změny
          </span>
        )}
      </div>

      {/* TĚLO FORMULÁŘE: moduly vkládají vlastní children (např. UserDetailForm) */}
      <div className="space-y-6">
        {children ?? (
          <>
            {/* DEMO sekce – když nejsou children, ukážeme generickou šablonu */}
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
              </div>
            </section>

            <section className="mb-6">
              <h3 className="text-sm font-semibold mb-2">Poznámka</h3>
              <textarea
                className="w-full border rounded px-2 py-1.5 text-sm h-24 resize-y disabled:bg-gray-100"
                placeholder="Vnitřní poznámka k entitě…"
                disabled={readOnly}
              />
            </section>
          </>
        )}
      </div>

      {/* Ovládací prvky formuláře (spodní lišta) – součást formuláře, ne CommonActions */}
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
