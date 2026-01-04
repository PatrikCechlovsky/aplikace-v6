// FILE: app/modules/900-nastaveni/tiles/AppViewSettingsTile.tsx
// PURPOSE: Uživatelská nastavení vzhledu → rozložení menu + styl aplikace + hustota
// Poznámka: Per-user (localStorage). Tile pouze ukládá, AppShell aplikuje třídy na .layout.

'use client'

/* =========================
   1) IMPORTS
   ========================= */
import React, { useEffect, useState } from 'react'
import PaletteCard from '@/app/UI/PaletteCard'
import '@/app/styles/components/AppViewSettingsTile.css'

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

// ChoiceCard je nyní nahrazena reusable PaletteCard komponentou


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
    <section className="settings-tile">
      <header className="settings-tile__header">
        <h1 className="settings-tile__title">Vzhled a zobrazení</h1>
        <p className="settings-tile__description">
          Nastavení umístění menu, stylu aplikace (Excel mřížka) a hustoty (výchozí / kompaktní / mini).
          Uloženo pro každého uživatele samostatně.
        </p>
      </header>

      <div className="settings-tile__section">
        {/* 1) Umístění menu */}
        <div className="avs-section">
          <h2 className="avs-section__title">Umístění menu:</h2>
          <div className="avs-section__grid">
            <PaletteCard
              title="Sidebar vlevo"
              description="Klasické rozložení s navigací vlevo."
              selected={settings.menuLayout === 'sidebar'}
              onSelect={() => updateSettings({ menuLayout: 'sidebar' })}
            />
            <PaletteCard
              title="Horní lišta (Excel styl)"
              description="Navigace nahoře, víc místa na obsah."
              selected={settings.menuLayout === 'top'}
              onSelect={() => updateSettings({ menuLayout: 'top' })}
            />
          </div>
        </div>

        {/* 2) Grafické zobrazení */}
        <div className="avs-section">
          <h2 className="avs-section__title">Grafické zobrazení:</h2>
          <div className="avs-section__grid">
            <PaletteCard
              title="Standardní (moderní)"
              description="Čistý vzhled bez mřížky v tabulkách."
              selected={settings.uiStyle === 'default'}
              onSelect={() => updateSettings({ uiStyle: 'default' })}
            />
            <PaletteCard
              title="Excel (mřížka + ohraničení)"
              description="Tabulky s linkami jako v Excelu."
              selected={settings.uiStyle === 'excel'}
              onSelect={() => updateSettings({ uiStyle: 'excel' })}
            />
          </div>
        </div>

        {/* 3) Velikost buněk a textu */}
        <div className="avs-section">
          <h2 className="avs-section__title">Velikost buněk a textu:</h2>
          <div className="avs-section__grid avs-section__grid--three">
            <PaletteCard
              title="Pohodlná"
              description="Největší text a více prostoru."
              selected={settings.density === 'comfortable'}
              onSelect={() => updateSettings({ density: 'comfortable' })}
            />
            <PaletteCard
              title="Kompaktní"
              description="Nižší řádky, rychlejší skenování."
              selected={settings.density === 'compact'}
              onSelect={() => updateSettings({ density: 'compact' })}
            />
            <PaletteCard
              title="Mini"
              description="Nejhustší režim pro velké seznamy."
              selected={settings.density === 'mini'}
              onSelect={() => updateSettings({ density: 'mini' })}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default AppViewSettingsTile
