// FILE: app/modules/900-nastaveni/tiles/AppViewSettingsTile.tsx
// PURPOSE: Uživatelská nastavení vzhledu → výchozí zobrazení seznamů + rozložení hlavního menu
// Poznámka: Toto nastavení je per-user (uloženo v localStorage), aplikace-v6 standard.

'use client'

import React, { useEffect, useState } from 'react'

/* -------------------------------------------------------
   Typy nastavení – pouze to, co je povoleno v tomto tile.
-------------------------------------------------------- */
type ViewMode = 'table' | 'cards'
type MenuLayout = 'sidebar' | 'top'

interface AppViewSettings {
  viewMode: ViewMode
  menuLayout: MenuLayout
}

/* -------------------------------------------------------
   Klíč pro localStorage – per-user preference
-------------------------------------------------------- */
const STORAGE_KEY = 'app-view-settings'

/* -------------------------------------------------------
   Výchozí hodnoty (použije se při prvním spuštění)
-------------------------------------------------------- */
const DEFAULT_SETTINGS: AppViewSettings = {
  viewMode: 'table',
  menuLayout: 'sidebar',
}

/* -------------------------------------------------------
   Načtení nastavení z localStorage (bezpečné)
-------------------------------------------------------- */
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

/* -------------------------------------------------------
   Uložení nastavení do localStorage
-------------------------------------------------------- */
function saveSettings(settings: AppViewSettings) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // ignore
  }
}

/* -------------------------------------------------------
   TILE: Vzhled a zobrazení (pouze 2 volby + náhled tabulky)
-------------------------------------------------------- */
const AppViewSettingsTile: React.FC = () => {
  const [settings, setSettings] = useState<AppViewSettings>(DEFAULT_SETTINGS)

  // První načtení – jen klient
  useEffect(() => {
    setSettings(loadSettings())
  }, [])

  // Aktualizace jedné části nastavení
  function updateSettings(partial: Partial<AppViewSettings>) {
    const next = { ...settings, ...partial }
    setSettings(next)
    saveSettings(next)
    // zde bude napojení na globální UIConfig (fáze 2)
  }

  return (
    <section className="generic-type">
      {/* Hlavička tile */}
      <header className="generic-type__header">
        <h1 className="generic-type__title">Vzhled a zobrazení</h1>
        <p className="generic-type__description">
          Nastavení výchozího zobrazení seznamů a umístění hlavního menu.
          Nastavení je uloženo pro každého uživatele samostatně.
        </p>
      </header>

      <div className="generic-type__body">

        {/* PANEL: Nastavení výchozích pohledů */}
        <div className="generic-type__panel">
          <h2 className="generic-type__panel-title">Preferované rozložení</h2>

          {/* Výchozí zobrazení seznamů */}
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
                <span>Tabulkové (výchozí)</span>
              </label>

              <label className="generic-type__radio">
                <input
                  type="radio"
                  name="viewMode"
                  checked={settings.viewMode === 'cards'}
                  onChange={() => updateSettings({ viewMode: 'cards' })}
                />
                <span>Karty / Dlaždice</span>
              </label>
            </div>
          </div>

          {/* Rozložení hlavního menu */}
          <div className="generic-type__field-group">
            <label className="generic-type__label">Umístění hlavního menu</label>
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
                <span>Horní lišta (Excel styl)</span>
              </label>

            </div>
          </div>
        </div>

        {/* PANEL: Náhled tabulky */}
        <div className="generic-type__panel">
          <h2 className="generic-type__panel-title">Náhled tabulkového zobrazení</h2>
          <p className="generic-type__panel-description">
            Tato ukázka používá stejné styly jako skutečné seznamy v aplikaci.
            Náhled se automaticky přizpůsobuje podle vybraného barevného vzhledu.
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
                  <td>10. 12. 2025</td>
                </tr>
                <tr>
                  <td>USR-002</td>
                  <td>Firma Alfa s.r.o.</td>
                  <td>Aktivní</td>
                  <td>05. 12. 2025</td>
                </tr>
                <tr>
                  <td>USR-003</td>
                  <td>Testovací subjekt</td>
                  <td>Neaktivní</td>
                  <td>01. 12. 2025</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </section>
  )
}

export default AppViewSettingsTile
