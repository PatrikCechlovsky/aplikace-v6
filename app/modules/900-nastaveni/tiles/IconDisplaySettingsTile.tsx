'use client'

/*
 * FILE: app/modules/900-nastaveni/tiles/IconDisplaySettingsTile.tsx
 * PURPOSE: Nastavení zobrazení ikon – dvě varianty:
 *  - S ikonkami (ikona + text)
 *  - Jen text (ikony se schovají, všude zůstane text)
 */

import { useEffect, useState } from 'react'
import {
  applyIconDisplayToLayout,
  loadIconDisplayFromLocalStorage,
  saveIconDisplayToLocalStorage,
  type IconDisplayMode,
  type IconDisplaySettings,
} from '@/app/lib/iconDisplaySettings'

type Preset = {
  id: IconDisplayMode
  title: string
  description: string
}

const PRESETS: Preset[] = [
  {
    id: 'icons',
    title: 'S ikonkami',
    description:
      'V sidebaru, tlačítkách i drobečkové navigaci se zobrazují ikony i text.',
  },
  {
    id: 'text',
    title: 'Jen text',
    description:
      'Ikony se skryjí, všude zůstane čitelný text (vhodné pro tisk nebo horší zrak).',
  },
]

export default function IconDisplaySettingsTile() {
  const [current, setCurrent] = useState<IconDisplayMode | null>(null)

  // Načtení aktuálního nastavení při mountu
  useEffect(() => {
    const settings = loadIconDisplayFromLocalStorage()
    setCurrent(settings.mode)
  }, [])

  const handleSelect = (mode: IconDisplayMode) => {
    const next: IconDisplaySettings = { mode }
    setCurrent(mode)

    // Okamžitě aplikujeme na layout
    applyIconDisplayToLayout(next)
    // A uložíme do localStorage
    saveIconDisplayToLocalStorage(next)
  }

  return (
    <section className="settings-tile">
      <header className="settings-tile__header">
        <h3 className="settings-tile__title">Zobrazení ikon</h3>
        <p className="settings-tile__description">
          Vyberte, jestli chcete v aplikaci používat ikony nebo jen textové
          popisky.
        </p>
      </header>

      <div className="settings-tile__section">
        <h4 className="settings-tile__section-title">Režim zobrazení</h4>

        <div className="settings-tile__palette-grid">
          {PRESETS.map((preset) => {
            const isActive = current === preset.id

            return (
              <button
                key={preset.id}
                type="button"
                className={
                  'palette-card' + (isActive ? ' palette-card--active' : '')
                }
                onClick={() => handleSelect(preset.id)}
              >
                <div className="palette-card__header">
                  <div>
                    <div className="palette-card__title">{preset.title}</div>
                    <p className="palette-card__description">
                      {preset.description}
                    </p>
                  </div>
                </div>

                {/* Malý náhled – pouze ilustrativní, bez logiky */}
                <div className="palette-card__preview">
                  {preset.id === 'icons' ? (
                    <>
                      <span>🏠 Modul</span>
                      <span>•</span>
                      <span>➕ Nový záznam</span>
                    </>
                  ) : (
                    <>
                      <span>Moduly</span>
                      <span>•</span>
                      <span>Nový záznam</span>
                    </>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
