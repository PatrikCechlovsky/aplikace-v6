'use client'
// ThemeSettingsTile.tsx


import { useEffect, useState } from 'react'
import type {
  ThemeMode,
  ThemeAccent,
  ThemeSettings,
} from '../../../lib/themeSettings'
import {
  loadThemeSettingsFromSupabase,
  saveThemeSettingsToSupabase,
} from '../../../lib/themeSettings'

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

// 🔧 Aplikujeme class na hlavní layout (.layout)
function applyThemeToLayout(settings: ThemeSettings) {
  if (typeof document === 'undefined') return

  const layout = document.querySelector('.layout')
  if (!layout) return

  // smažeme staré class
  layout.classList.remove('theme-light', 'theme-dark')
  layout.classList.remove('accent-blue', 'accent-green', 'accent-landlord')

  // vyhodnotíme "auto"
  const resolvedMode: ThemeMode =
    settings.mode === 'auto'
      ? window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : settings.mode

  layout.classList.add(`theme-${resolvedMode}`)
  layout.classList.add(`accent-${settings.accent}`)
}

// čtení z localStorage
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

type Props = {
  // až doplníme auth, můžeš sem poslat userId a bude se ukládat i do Supabase
  userId?: string
}

export default function ThemeSettingsTile({ userId }: Props) {
  const [mode, setMode] = useState<ThemeMode>('auto')
  const [accent, setAccent] = useState<ThemeAccent>('blue')
  const [isSaving, setIsSaving] = useState(false)

  // 1) při načtení komponenty – nejdřív localStorage, pak případně Supabase
  useEffect(() => {
    const local = loadInitialFromLocalStorage()
    setMode(local.mode)
    setAccent(local.accent)
    applyThemeToLayout(local)

    if (!userId) return

    let cancelled = false

    ;(async () => {
      const fromDb = await loadThemeSettingsFromSupabase(userId)
      if (cancelled) return
      setMode(fromDb.mode)
      setAccent(fromDb.accent)
      applyThemeToLayout(fromDb)
      try {
        window.localStorage.setItem(
          THEME_STORAGE_KEY,
          JSON.stringify(fromDb),
        )
      } catch {
        /* ignore */
      }
    })()

    return () => {
      cancelled = true
    }
  }, [userId])

  // společná funkce – okamžitě přepne vzhled + uloží
  const updateSettings = async (next: ThemeSettings) => {
    setMode(next.mode)
    setAccent(next.accent)

    // hned přepnout vzhled
    applyThemeToLayout(next)

    // localStorage
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }

    // Supabase – jen když máme userId, jinak se přeskočí
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

      {/* Palety */}
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
