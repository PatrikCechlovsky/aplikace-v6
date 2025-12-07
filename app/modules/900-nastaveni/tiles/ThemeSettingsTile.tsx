'use client'
// ThemeSettingsTile.tsx

import { useEffect, useState } from 'react'
import type { ThemeMode, ThemeAccent, ThemeSettings } from '@/app/lib/themeSettings'
import {
  loadThemeSettingsFromSupabase,
  saveThemeSettingsToSupabase,
} from '@/app/lib/themeSettings'

const THEME_STORAGE_KEY = 'pronajimatel_theme'

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

// Aplikace class na root (nebo .layout) – uprav si selector podle projektu
function applyThemeToDocument(settings: ThemeSettings) {
  if (typeof document === 'undefined') return

  const root = document.documentElement // nebo document.querySelector('.layout')
  root.classList.remove('theme-light', 'theme-dark')
  root.classList.remove('accent-blue', 'accent-green', 'accent-landlord')

  const resolvedMode =
    settings.mode === 'auto'
      ? (window.matchMedia &&
          window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light')
      : settings.mode

  root.classList.add(`theme-${resolvedMode}`)
  root.classList.add(`accent-${settings.accent}`)
}

function loadInitialFromLocalStorage(): ThemeSettings {
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

export default function ThemeSettingsTile({ userId }: { userId?: string }) {
  const [mode, setMode] = useState<ThemeMode>('auto')
  const [accent, setAccent] = useState<ThemeAccent>('blue')
  const [isSaving, setIsSaving] = useState(false)

  // 1) při prvním načtení – nejdřív lokál, pak Supabase (pokud user)
  useEffect(() => {
    const local = loadInitialFromLocalStorage()
    setMode(local.mode)
    setAccent(local.accent)
    applyThemeToDocument(local)

    const fetchFromSupabase = async () => {
      if (!userId) return
      const fromDb = await loadThemeSettingsFromSupabase(userId)
      setMode(fromDb.mode)
      setAccent(fromDb.accent)
      applyThemeToDocument(fromDb)
      window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(fromDb))
    }

    fetchFromSupabase()
  }, [userId])

  // společná funkce – změní state, uloží, přepne theme
  const updateSettings = async (next: ThemeSettings) => {
    setMode(next.mode)
    setAccent(next.accent)
    applyThemeToDocument(next)

    // localStorage
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }

    // Supabase
    if (userId) {
      try {
        setIsSaving(true)
        await saveThemeSettingsToSupabase(userId, next)
      } finally {
        setIsSaving(false)
      }
    }
  }

  const handleModeChange = (newMode: ThemeMode) => {
    updateSettings({ mode: newMode, accent })
  }

  const handleAccentChange = (newAccent: ThemeAccent) => {
    updateSettings({ mode, accent: newAccent })
  }

  return (
    <section className="settings-tile">
      <header className="settings-tile__header">
        <h1 className="settings-tile__title">Barevné zobrazení</h1>
        <p className="settings-tile__description">
          Zvolte režim zobrazení a barevnou paletu aplikace.
        </p>
      </header>

      <div className="settings-tile__section">
        <h2 className="settings-tile__section-title">Režim vzhledu</h2>
        <div className="settings-tile__radio-group">
          <label className="settings-tile__radio">
            <input
              type="radio"
              name="theme-mode"
              value="auto"
              checked={mode === 'auto'}
              onChange={() => handleModeChange('auto')}
            />
            <span>Automaticky (podle systému)</span>
          </label>
          <label className="settings-tile__radio">
            <input
              type="radio"
              name="theme-mode"
              value="light"
              checked={mode === 'light'}
              onChange={() => handleModeChange('light')}
            />
            <span>Světlý režim</span>
          </label>
          <label className="settings-tile__radio">
            <input
              type="radio"
              name="theme-mode"
              value="dark"
              checked={mode === 'dark'}
              onChange={() => handleModeChange('dark')}
            />
            <span>Tmavý režim</span>
          </label>
        </div>
      </div>

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
                onClick={() => handleAccentChange(palette.id)}
                disabled={isSaving}
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

                <div className="palette-card__preview">
                  <span
                    className={`palette-preview palette-preview--${palette.id} primary`}
                  />
                  <span
                    className={`palette-preview palette-preview--${palette.id} soft`}
                  />
                  <span
                    className={`palette-preview palette-preview--${palette.id} accent`}
                  />
                </div>
              </button>
            )
          })}
        </div>

        {isSaving && (
          <p className="text-xs text-gray-400 mt-1">
            Ukládám nastavení vzhledu…
          </p>
        )}
      </div>
    </section>
  )
}
