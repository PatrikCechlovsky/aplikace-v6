// FILE: app/modules/900-nastaveni/tiles/AppViewSettingsTile.tsx
// PURPOSE: Uživatelská nastavení vzhledu → rozložení menu + styl aplikace + hustota
// Poznámka: Per-user (localStorage). Tile pouze ukládá, AppShell aplikuje třídy na .layout.

'use client'

/* =========================
   1) IMPORTS
   ========================= */
import React, { useEffect, useState } from 'react'

/* =========================
   2) TYPES
   ========================= */
type MenuLayout = 'sidebar' | 'top'
type UiStyle = 'default' | 'excel'
type Density = 'comfortable' | 'compact' | 'mini'

interface AppViewSettings {
  menuLayout: MenuLayout
  uiStyle: UiStyle
  density: Density
}

/* =========================
   3) HELPERS
   ========================= */
const STORAGE_KEY = 'app-view-settings'

const DEFAULT_SETTINGS: AppViewSettings = {
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
  window.dispatchEvent(new CustomEvent('app-view-settings-changed'))
}

type ChoiceCardProps = {
  title: string
  description?: string
  selected: boolean
  onSelect: () => void
  icon?: React.ReactNode
}

function ChoiceCard({ title, description, selected, onSelect, icon }: ChoiceCardProps) {
  return (
    <button
      type="button"
      className={`palette-card ${selected ? 'palette-card--active' : ''}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <div className="palette-card__header">
        <span className="palette-card__title">{title}</span>
        {selected ? <span className="palette-card__badge">Aktivní</span> : null}
      </div>

      {description ? <p className="palette-card__description">{description}</p> : null}

      {/* Místo tří teček theme preview dáme jednoduchý “indikátor” – stejné rozměry */}
      <div className="palette-card__preview">
        <span className={`palette-preview ${selected ? 'palette-preview--active' : ''}`} />
        <span className="palette-preview palette-preview--ghost" />
        <span className="palette-preview palette-preview--ghost" />
      </div>
    </button>
  )
}


/* =========================
   4) DATA LOAD
   ========================= */
// (not used)

/* =========================
   5) ACTION HANDLERS
   ========================= */
// (inside component)

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
          Nastavení umístění menu, stylu aplikace (Excel mřížka) a hustoty (výchozí / kompaktní / mini).
          Uloženo pro každého uživatele samostatně.
        </p>
      </header>

      <div className="generic-type__body">
        {/* Nastavení */}
        <div className="generic-type__panel">
          <h2 className="generic-type__panel-title">Nastavení</h2>

          {/* Menu layout */}
          <div className="generic-type__field-group">
            <div className="generic-type__label">Umístění hlavního menu</div>
            <div className="avs-grid avs-grid--2">
              <ChoiceCard
                title="Sidebar vlevo"
                description="Klasické rozložení s navigací vlevo."
                selected={settings.menuLayout === 'sidebar'}
                onSelect={() => updateSettings({ menuLayout: 'sidebar' })}
              />
              <ChoiceCard
                title="Horní lišta (Excel styl)"
                description="Navigace nahoře, víc místa na obsah."
                selected={settings.menuLayout === 'top'}
                onSelect={() => updateSettings({ menuLayout: 'top' })}
              />
            </div>
          </div>

          {/* UI style */}
          <div className="generic-type__field-group">
            <div className="generic-type__label">Styl aplikace</div>
            <div className="avs-grid avs-grid--2">
              <ChoiceCard
                title="Standardní (moderní)"
                description="Čistý vzhled bez mřížky v tabulkách."
                selected={settings.uiStyle === 'default'}
                onSelect={() => updateSettings({ uiStyle: 'default' })}
              />
              <ChoiceCard
                title="Excel (mřížka + ohraničení)"
                description="Tabulky s linkami jako v Excelu."
                selected={settings.uiStyle === 'excel'}
                onSelect={() => updateSettings({ uiStyle: 'excel' })}
              />
            </div>
          </div>
          {/* Density */}
          <div className="generic-type__field-group">
            <div className="generic-type__label">Hustota</div>
            <div className="avs-grid avs-grid--3">
              <ChoiceCard
                title="Pohodlná"
                description="Největší text a více prostoru."
                selected={settings.density === 'comfortable'}
                onSelect={() => updateSettings({ density: 'comfortable' })}
              />
              <ChoiceCard
                title="Kompaktní"
                description="Nižší řádky, rychlejší skenování."
                selected={settings.density === 'compact'}
                onSelect={() => updateSettings({ density: 'compact' })}
              />
              <ChoiceCard
                title="Mini"
                description="Nejhustší režim pro velké seznamy."
                selected={settings.density === 'mini'}
                onSelect={() => updateSettings({ density: 'mini' })}
              />
            </div>
          </div>
        </div>

        {/* Náhled tabulky */}
        <div className="generic-type__panel">
          <h2 className="generic-type__panel-title">Náhled tabulkového zobrazení</h2>
          <p className="generic-type__panel-description">
            Náhled používá stejné styly jako seznamy. Excel styl přidá mřížku a hustota upraví výšku řádků a typografii.
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
