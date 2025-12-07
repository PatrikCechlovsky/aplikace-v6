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
import { getCurrentSession } from '../../../lib/services/auth'

const THEME_STORAGE_KEY = 'pronajimatel_theme'

// ---------------------------------------------------------
// 1) PŘEDVOLBY – KAŽDÁ DLAŽDICE = 1 KOMBINACE (MODE + ACCENT)
// ---------------------------------------------------------

type ThemePreset = {
  id: string
  label: string
  description: string
  mode: ThemeMode
  accent: ThemeAccent
}

const PRESETS: ThemePreset[] = [
  {
    id: 'auto-blue',
    label: 'Automaticky – modrá',
    description: 'Řídí se nastavením systému (světlý/tmavý), akcent modrou.',
    mode: 'auto',
    accent: 'blue',
  },
  {
    id: 'light-blue',
    label: 'Světlé – modrá',
    description: 'Klasické světlé prostředí s modrými prvky.',
    mode: 'light',
    accent: 'blue',
  },
  {
    id: 'dark-blue',
    label: 'Tmavé – modrá',
    description: 'Tmavý režim s modrým akcentem, šetrný pro oči večer.',
    mode: 'dark',
    accent: 'blue',
  },
  {
    id: 'light-green',
    label: 'Světlé – zelená',
    description: 'Světlé prostředí s jemným zeleným zvýrazněním.',
    mode: 'light',
    accent: 'green',
  },
  {
    id: 'dark-green',
    label: 'Tmavé – zelená',
    description: 'Tmavý režim s klidným zeleným akcentem.',
    mode: 'dark',
    accent: 'green',
  },
  {
    id: 'light-landlord',
    label: 'Světlé – Pronajímatel',
    description: 'Světlé prostředí v pastelových barvách aplikace Pronajímatel.',
    mode: 'light',
    accent: 'landlord',
  },
  {
    id: 'dark-landlord',
    label: 'Tmavé – Pronajímatel',
    description: 'Tmavé prostředí s fialovým akcentem Pronajímatel.',
    mode: 'dark',
    accent: 'landlord',
  },
]

// ---------------------------------------------------------
// 2) APLIKACE TÉMAT NA .layout
// ---------------------------------------------------------

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

export default function ThemeSettingsTile() {
  const [mode, setMode] = useState<ThemeMode>('auto')
  const [accent, setAccent] = useState<ThemeAccent>('blue')
  const [isSaving, setIsSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // 0) zjistíme aktuálního uživatele (jen na clientu)
  useEffect(() => {
    let cancelled = false

    ;(async () => {
      const { data, error } = await getCurrentSession()
      if (cancelled) return
      if (!error && data.session?.user?.id) {
        setUserId(data.session.user.id)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

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

  const handlePresetClick = (preset: ThemePreset) => {
    updateSettings({ mode: preset.mode, accent: preset.accent })
  }

  return (
    <section className="settings-tile">
      <header className="settings-tile__header">
        <h1 className="settings-tile__title">Barevné zobrazení</h1>
        <p className="settings-tile__description">
          Vyber si jedno z předvolených témat. Nastavení se okamžitě použije a
          uloží k tvému účtu.
        </p>
      </header>

      <div className="settings-tile__section">
        <h2 className="settings-tile__section-title">Předvolená témata</h2>

        <div className="settings-tile__palette-grid">
          {PRESETS.map((preset) => {
            const isActive =
              preset.mode === mode && preset.accent === accent

            return (
              <button
                key={preset.id}
                type="button"
                className={`palette-card ${
                  isActive ? 'palette-card--active' : ''
                }`}
                onClick={() => handlePresetClick(preset)}
                disabled={isSaving}
              >
                <div className="palette-card__header">
                  <span className="palette-card__title">
                    {preset.label}
                  </span>
                  {isActive && (
                    <span className="palette-card__badge">Aktivní</span>
                  )}
                </div>

                <p className="palette-card__description">
                  {preset.description}
                </p>

                <div className="palette-card__preview">
                  <span
                    className={`palette-preview palette-preview--${preset.accent} primary`}
                  />
                  <span
                    className={`palette-preview palette-preview--${preset.accent} soft`}
                  />
                  <span
                    className={`palette-preview palette-preview--${preset.accent} accent`}
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
