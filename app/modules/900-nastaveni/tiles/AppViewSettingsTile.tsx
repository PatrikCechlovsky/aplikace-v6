// FILE: app/modules/900-nastaveni/tiles/AppViewSettingsTile.tsx

'use client'

import React, { useEffect, useState } from 'react'

type ViewMode = 'table' | 'cards'
type MenuLayout = 'sidebar' | 'top'
type IconMode = 'text' | 'icon-text'

const STORAGE_KEY = 'app-view-settings'

interface AppViewSettings {
  viewMode: ViewMode
  menuLayout: MenuLayout
  iconMode: IconMode
}

const DEFAULT_SETTINGS: AppViewSettings = {
  viewMode: 'table',
  menuLayout: 'sidebar',
  iconMode: 'icon-text',
}

function loadSettings(): AppViewSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_SETTINGS, ...parsed }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function saveSettings(settings: AppViewSettings) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // ignore
  }
}

const AppViewSettingsTile: React.FC = () => {
  const [settings, setSettings] = useState<AppViewSettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    setSettings(loadSettings())
  }, [])

  function updateSettings(partial: Partial<AppViewSettings>) {
    const next = { ...settings, ...partial }
    setSettings(next)
    saveSettings(next)
    // 👉 sem se později může doplnit napojení na globální uiConfig / context
  }

  return (
    <section className="generic-type">
      <header className="generic-type__header">
        <h1 className="generic-type__title">Vzhled a zobrazení</h1>
        <p className="generic-type__description">
          Nastavení výchozího vzhledu aplikace a ukázkové tabulkové zobrazení
          podle aktuálního barevného tématu.
        </p>
      </header>

      <div className="generic-type__body">
        {/* 1) Nastavení vzhledu */}
        <div className="generic-type__panel">
          <h2 className="generic-type__panel-title">Výchozí zobrazení</h2>

          {/* Způsob zobrazení seznamů */}
          <div className="generic-type__field-group">
            <label className="generic-type__label">Zobrazení seznamů</label>
            <div className="generic-type__radio-row">
              <label className="generic-type__radio">
                <input
                  type="radio"
                  name="viewMode"
                  checked={settings.viewMode === 'table'}
                  onChange={() => updateSettings({ viewMode: 'table' })}
                />
                <span>Tabulka</span>
              </label>
              <label className="generic-type__radio">
                <input
                  type="radio"
                  name="viewMode"
                  checked={settings.viewMode === 'cards'}
                  onChange={() => updateSettings({ viewMode: 'cards' })}
                />
                <span>Dlaždice / karty</span>
              </label>
            </div>
          </div>

          {/* Rozložení menu */}
          <div className="generic-type__field-group">
            <label className="generic-type__label">
              Rozložení hlavního menu
            </label>
            <div className="generic-type__radio-row">
              <label className="generic-type__radio">
                <input
                  type="radio"
                  name="menuLayout"
                  checked={settings.menuLayout === 'sidebar'}
                  onChange={() => updateSettings({ menuLayout: 'sidebar' })}
                />
                <span>Sidebar vlevo</span>
              </label>
              <label className="generic-type__radio">
                <input
                  type="radio"
                  name="menuLayout"
                  checked={settings.menuLayout === 'top'}
                  onChange={() => updateSettings({ menuLayout: 'top' })}
                />
                <span>Horní menu (vodorovné)</span>
              </label>
            </div>
          </div>

          {/* Ikony */}
          <div className="generic-type__field-group">
            <label className="generic-type__label">Zobrazení ikon</label>
            <div className="generic-type__radio-row">
              <label className="generic-type__radio">
                <input
                  type="radio"
                  name="iconMode"
                  checked={settings.iconMode === 'text'}
                  onChange={() => updateSettings({ iconMode: 'text' })}
                />
                <span>Bez ikon (jen text)</span>
              </label>
              <label className="generic-type__radio">
                <input
                  type="radio"
                  name="iconMode"
                  checked={settings.iconMode === 'icon-text'}
                  onChange={() => updateSettings({ iconMode: 'icon-text' })}
                />
                <span>Ikona + text</span>
              </label>
            </div>
          </div>
        </div>

        {/* 2) Ukázkové tabulkové zobrazení */}
        <div className="generic-type__panel">
          <h2 className="generic-type__panel-title">
            Náhled tabulkového zobrazení
          </h2>
          <p className="generic-type__panel-description">
            Tento náhled používá stejné barvy a styly jako skutečné seznamy v
            aplikaci. Změnou motivu (téma vzhledu) uvidíš, jak se tabulka
            přizpůsobí.
          </p>

          <div className="generic-type__table-wrapper">
            <table className="generic-type__table">
              <thead>
                <tr>
                  <th>Kód</th>
                  <th>Název</th>
                  <th>Stav</th>
                  <th>Poslední změna</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>USR-001</td>
                  <td>Jan Novák</td>
                  <td>Aktivní</td>
                  <td>10.12.2025</td>
                </tr>
                <tr>
                  <td>USR-002</td>
                  <td>Firma Alfa s.r.o.</td>
                  <td>Aktivní</td>
                  <td>05.12.2025</td>
                </tr>
                <tr>
                  <td>USR-003</td>
                  <td>Testovací subjekt</td>
                  <td>Neaktivní</td>
                  <td>01.12.2025</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="generic-type__hint">
            V produkční verzi se zde může zobrazit buď ukázkový dataset, nebo
            skutečný seznam podle vybraných filtrů – důležité je, že tabulka
            využívá stejné CSS třídy jako ostatní seznamy.
          </p>
        </div>
      </div>
    </section>
  )
}

export default AppViewSettingsTile
