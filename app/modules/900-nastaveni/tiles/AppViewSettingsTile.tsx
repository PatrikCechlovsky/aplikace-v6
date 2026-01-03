// FILE: app/modules/900-nastaveni/tiles/AppViewSettingsTile.tsx
// PURPOSE: Uživatelská nastavení vzhledu → výchozí zobrazení seznamů + rozložení menu + Excel režim + hustota řádků
// Poznámka: Per-user (localStorage). Tile pouze ukládá, AppShell aplikuje třídy na .layout.

'use client'

/* =========================
   1) IMPORTS
   ========================= */
import React, { useEffect, useState } from 'react'

/* =========================
   2) TYPES
   ========================= */
type ViewMode = 'table' | 'cards'
type MenuLayout = 'sidebar' | 'top'
type UiStyle = 'default' | 'excel'
type Density = 'comfortable' | 'compact' | 'mini'

interface AppViewSettings {
  viewMode: ViewMode
  menuLayout: MenuLayout
  uiStyle: UiStyle
  density: Density
}

/* =========================
   3) HELPERS
   ========================= */
const STORAGE_KEY = 'app-view-settings'

const DEFAULT_SETTINGS: AppViewSettings = {
  viewMode: 'table',
  menuLayout: 'sidebar',
  uiStyle: 'default',
  density: 'comfortable',
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

function notifySettingsChanged() {
  if (typeof window === 'undefined') return
  // AppShell si na to může poslouchat a okamžitě přepnout třídy
  window.dispatchEvent(new CustomEvent('app-view-settings-changed'))
}

/* =========================
   6) RENDER
   ========================= */
const AppViewSettingsTile: React.FC = () => {
  const [settings, setSettings] = useState<AppViewSettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    setSettings(loadSettings())
  }, [])

  function updateSettings(partial: Partial<AppViewSettings>) {
    const next = { ...settings, ...partial }
    setSettings(next)
    saveSettings(next)
    notifySettingsChanged()
  }

  return (
    <section className="generic-type">
      <header className="generic-type__header">
        <h1 className="generic-type__title">Vzhled a zobrazení</h1>
        <p className="generic-type__description">
          Nastavení výchozího zobrazení seznamů, umístění menu a Excel stylu (mřížka).
          Uloženo pro každého uživatele samostatně.
        </p>
      </header>

      <div className="generic-type__body">
        <div className="generic-type__panel">
          <h2 className="generic-type__panel-title">Preferované rozložení</h2>

          {/* Zobrazení seznamů */}
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

          {/* Rozložení menu */}
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

          {/* Excel styl / mřížka */}
          <div className="generic-type__field-group">
            <label className="generic-type__label">Styl aplikace</label>
            <div className="generic-type__radio-row">
              <label className="generic-type__radio">
                <input
                  type="radio"
                  name="uiStyle"
                  checked={settings.uiStyle === 'default'}
                  onChange={() => updateSettings({ uiStyle: 'default' })}
                />
                <span>Standardní (moderní)</span>
              </label>

              <label className="generic-type__radio">
                <input
                  type="radio"
                  name="uiStyle"
                  checked={settings.uiStyle === 'excel'}
                  onChange={() => updateSettings({ uiStyle: 'excel' })}
                />
                <span>Excel (mřížka + ohraničení)</span>
              </label>
            </div>
          </div>

          {/* Hustota řádků */}
          <div className="generic-type__field-group">
            <label className="generic-type__label">Hustota</label>
            <div className="generic-type__radio-row">
              <label className="generic-type__radio">
                <input
                  type="radio"
                  name="density"
                  checked={settings.density === 'comfortable'}
                  onChange={() => updateSettings({ density: 'comfortable' })}
                />
                <span>Pohodlná</span>
              </label>

              <label className="generic-type__radio">
                <input
                  type="radio"
                  name="density"
                  checked={settings.density === 'compact'}
                  onChange={() => updateSettings({ density: 'compact' })}
                />
                <span>Kompaktní (nižší řádky)</span>
              </label>
               
              <label className="generic-type__radio">
                 <input
                   type="radio"
                   name="density"
                   checked={settings.density === 'mini'}
                   onChange={() => updateSettings({ density: 'mini' })}
                 />
                 <span>Mini</span>
               </label> 
            </div>
          </div>
        </div>

        {/* Náhled tabulky */}
        <div className="generic-type__panel">
          <h2 className="generic-type__panel-title">Náhled tabulkového zobrazení</h2>
          <p className="generic-type__panel-description">
            Náhled používá stejné styly jako seznamy. Excel styl přidá mřížku a kompaktní režim sníží výšku řádků.
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
