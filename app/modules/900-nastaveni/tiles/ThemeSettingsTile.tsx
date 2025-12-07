'use client'
// ThemeSettingsTile.tsx

import { useEffect, useState } from 'react'

type ThemeMode = 'auto' | 'light' | 'dark'
type ThemeAccent = 'blue' | 'green' | 'landlord'

const THEME_STORAGE_KEY = 'pronajimatel_theme'

interface ThemeSettings {
  mode: ThemeMode
  accent: ThemeAccent
}

// Přednastavené palety, které zobrazíme jako „dlaždice“
const PALETTES: { id: ThemeAccent; name: string; description: string }[] = [
  {
    id: 'blue',
    name: 'Výchozí modrá',
    description: 'Moderní modrá paleta vhodná pro většinu uživatelů.',
  },
  {
    id: 'green',
    name: 'Zelená',
    description: 'Klidnější vzhled s důrazem na zelené akcenty.',
  },
  {
    id: 'landlord',
    name: 'Pastelová Pronajímatel',
    description: 'Pastelová paleta ladící s vizuálem aplikace Pronajímatel.',
  },
]

function loadInitialTheme(): ThemeSettings {
  if (typeof window === 'undefined') {
    return { mode: 'auto', accent: 'blue' }
  }

  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (!raw) return { mode: 'auto', accent: 'blue' }
    const parsed = JSON.parse(raw)
    return {
      mode: parsed.mode ?? 'auto',
      accent: parsed.accent ?? 'blue',
    }
  } catch {
    return { mode: 'auto', accent: 'blue' }
  }
}

export default function BarevneZobrazeniTile() {
  const [mode, setMode] = useState<ThemeMode>('auto')
  const [accent, setAccent] = useState<ThemeAccent>('blue')

  // při prvním načtení stáhneme hodnoty z localStorage
  useEffect(() => {
    const initial = loadInitialTheme()
    setMode(initial.mode)
    setAccent(initial.accent)
  }, [])

  // vždy když se něco změní, uložíme to do localStorage
  useEffect(() => {
    const settings: ThemeSettings = { mode, accent }
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // ignorujeme chybu – jen fallback
    }
  }, [mode, accent])

  return (
    <section className="settings-tile">
      <header className="settings-tile__header">
        <h1 className="settings-tile__title">Barevné zobrazení</h1>
        <p className="settings-tile__description">
          Zvolte režim zobrazení a barevnou paletu aplikace.
        </p>
      </header>

      {/* Režim vzhledu */}
      <div className="settings-tile__section">
        <h2 className="settings-tile__section-title">Režim vzhledu</h2>
        <div className="settings-tile__radio-group">
          <label className="settings-tile__radio">
            <input
              type="radio"
              name="theme-mode"
              value="auto"
              checked={mode === 'auto'}
              onChange={() => setMode('auto')}
            />
            <span>Automaticky (podle systému)</span>
          </label>
          <label className="settings-tile__radio">
            <input
              type="radio"
              name="theme-mode"
              value="light"
              checked={mode === 'light'}
              onChange={() => setMode('light')}
            />
            <span>Světlý režim</span>
          </label>
          <label className="settings-tile__radio">
            <input
              type="radio"
              name="theme-mode"
              value="dark"
              checked={mode === 'dark'}
              onChange={() => setMode('dark')}
            />
            <span>Tmavý režim</span>
          </label>
        </div>
      </div>

      {/* Palety / akcenty */}
      <div className="settings-tile__section">
        <h2 className="settings-tile__section-title">Barevná paleta</h2>
        <div className="settings-tile__palette-grid">
          {PALETTES.map((palette) => {
            const isActive = palette.id === accent
            return (
              <button
                key={palette.id}
                type="button"
                className={`palette-card ${
                  isActive ? 'palette-card--active' : ''
                }`}
                onClick={() => setAccent(palette.id)}
              >
                <div className="palette-card__header">
                  <span className="palette-card__title">{palette.name}</span>
                  {isActive && (
                    <span className="palette-card__badge">Aktivní</span>
                  )}
                </div>
                <p className="palette-card__description">
                  {palette.description}
                </p>

                {/* Jednoduchý barevný náhled – zatím jen symbolicky */}
                <div className="palette-card__preview">
                  <span className={`palette-preview palette-preview--${palette.id} primary`} />
                  <span className={`palette-preview palette-preview--${palette.id} soft`} />
                  <span className={`palette-preview palette-preview--${palette.id} accent`} />
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
