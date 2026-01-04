'use client'

/*
 * FILE: app/modules/900-nastaveni/tiles/ThemeSettingsTile.tsx
 * PURPOSE: Nastavení barevného vzhledu – výběr předvoleného tématu.
 *
 * Poznámka:
 *  - Při načtení NEvybírá žádný preset.
 *  - Výchozí vzhled aplikace se řídí DEFAULT_SETTINGS v app/lib/themeSettings.ts.
 *  - Preset se zvýrazní až po kliknutí uživatele.
 */

import { useEffect, useState } from 'react'
import {
  applyThemeToLayout,
  loadThemeFromLocalStorage,
  saveThemeToLocalStorage,
  saveThemeSettingsToSupabase,
  type ThemeSettings,
  type ThemeMode,
  type ThemeAccent,
} from '../../../lib/themeSettings'


import { getCurrentSession } from '../../../lib/services/auth'

type ThemePreset = {
  id: string
  label: string
  description: string
  mode: ThemeMode
  accent: ThemeAccent
}

/**
 * 5 barevných rodin × (light + dark) + 1 auto
 * = 11 předvoleb
 */
const PRESETS: ThemePreset[] = [
  {
    id: 'auto-neutral',
    label: 'Automaticky – neutrální',
    description:
      'Řídí se nastavením systému (světlý / tmavý), neutrální barevné schéma.',
    mode: 'auto',
    accent: 'neutral',
  },

  // 1) Neutral
  {
    id: 'neutral-light',
    label: 'Neutral – světlé',
    description: 'Čisté světlé prostředí s jemným modrofialovým akcentem.',
    mode: 'light',
    accent: 'neutral',
  },
  {
    id: 'neutral-dark',
    label: 'Neutral – tmavé',
    description:
      'Tmavý režim se standardním akcentem, vhodný pro večerní práci.',
    mode: 'dark',
    accent: 'neutral',
  },

  // 2) Grey
  {
    id: 'grey-light',
    label: 'Grey – světlé',
    description:
      'Světlé šedé prostředí vhodné pro profesionální a úřední práci.',
    mode: 'light',
    accent: 'grey',
  },
  {
    id: 'grey-dark',
    label: 'Grey – tmavé',
    description: 'Tmavé grafitové prostředí s decentním šedým zvýrazněním.',
    mode: 'dark',
    accent: 'grey',
  },

  // 3) Blue
  {
    id: 'blue-light',
    label: 'Blue – světlé',
    description: 'Klasické světlé prostředí s modrými prvky.',
    mode: 'light',
    accent: 'blue',
  },
  {
    id: 'blue-dark',
    label: 'Blue – tmavé',
    description:
      'Tmavý režim s modrým akcentem, šetrný pro oči při práci večer.',
    mode: 'dark',
    accent: 'blue',
  },

  // 4) Green
  {
    id: 'green-light',
    label: 'Green – světlé',
    description: 'Světlé prostředí s jemným zeleným zvýrazněním.',
    mode: 'light',
    accent: 'green',
  },
  {
    id: 'green-dark',
    label: 'Green – tmavé',
    description: 'Tmavý režim s klidným zeleným akcentem.',
    mode: 'dark',
    accent: 'green',
  },

  // 5) Purple
  {
    id: 'purple-light',
    label: 'Purple – světlé',
    description: 'Světlé prostředí v pastelových barvách aplikace.',
    mode: 'light',
    accent: 'purple',
  },
  {
    id: 'purple-dark',
    label: 'Purple – tmavé',
    description: 'Tmavé prostředí s fialovým akcentem.',
    mode: 'dark',
    accent: 'purple',
  },
]

const AUTO_PRESET_ID = 'auto-neutral'

const THEME_GROUPS: {
  key: string
  lightId: string
  darkId: string
}[] = [
  { key: 'neutral', lightId: 'neutral-light', darkId: 'neutral-dark' },
  { key: 'grey', lightId: 'grey-light', darkId: 'grey-dark' },
  { key: 'blue', lightId: 'blue-light', darkId: 'blue-dark' },
  { key: 'green', lightId: 'green-light', darkId: 'green-dark' },
  { key: 'purple', lightId: 'purple-light', darkId: 'purple-dark' },
]

export default function ThemeSettingsTile() {
  // ❗ Tady už NEdobíráme hodnoty z localStorage / DB
  // – začínáme bez vybraného presetu.
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // načtu aktuální theme z localStorage a zkusím k němu najít preset
  useEffect(() => {
    const current = loadThemeFromLocalStorage()

    const matchedPreset = PRESETS.find(
      (p) => p.mode === current.mode && p.accent === current.accent,
    )

    if (matchedPreset) {
      setSelectedPresetId(matchedPreset.id)
    }
  }, [])
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

  // 1) Uložení nového nastavení
  const updateSettings = async (next: ThemeSettings) => {
    // Okamžitě aplikujeme vzhled
    applyThemeToLayout(next)
    saveThemeToLocalStorage(next)

    // A pokud známe userId, uložíme ho i do Supabase
    if (!userId) return

    try {
      setIsSaving(true)
      await saveThemeSettingsToSupabase(userId, next)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePresetClick = (preset: ThemePreset) => {
    // Označíme kartu jako aktivní (jen lokálně v UI)
    setSelectedPresetId(preset.id)

    // A uložíme nové nastavení
    void updateSettings({
      mode: preset.mode,
      accent: preset.accent,
    })
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
        {/* === AUTOMATICKÉ TÉMA (samostatně) === */}
        <div className="settings-theme__grid-auto">
          {PRESETS.filter((p) => p.id === AUTO_PRESET_ID).map((preset) => {
            const isActive = preset.id === selectedPresetId
        
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
                  <span className="palette-card__title">{preset.label}</span>
                  {isActive && (
                    <span className="palette-card__badge">Aktivní</span>
                  )}
                </div>
        
                <p className="palette-card__description">{preset.description}</p>
        
                <div className="palette-card__preview">
                  <span className={`palette-preview palette-preview--${preset.accent} palette-preview--${preset.mode} primary`} />
                  <span className={`palette-preview palette-preview--${preset.accent} palette-preview--${preset.mode} soft`} />
                  <span className={`palette-preview palette-preview--${preset.accent} palette-preview--${preset.mode} accent`} />
                </div>
              </button>
            )
          })}
        </div>
        
        {/* === PÁRY SVĚTLÉ / TMAVÉ === */}
        <div className="settings-theme__pairs">
          {THEME_GROUPS.map((group) => {
            const light = PRESETS.find((p) => p.id === group.lightId)
            const dark = PRESETS.find((p) => p.id === group.darkId)
        
            if (!light || !dark) return null
        
            return (
              <div key={group.key} className="settings-theme__pair">
                {[light, dark].map((preset) => {
                  const isActive = preset.id === selectedPresetId
        
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
                        <span className="palette-card__title">{preset.label}</span>
                        {isActive && (
                          <span className="palette-card__badge">Aktivní</span>
                        )}
                      </div>
        
                      <p className="palette-card__description">
                        {preset.description}
                      </p>
        
                      <div className="palette-card__preview">
                        <span className={`palette-preview palette-preview--${preset.accent} palette-preview--${preset.mode} primary`} />
                        <span className={`palette-preview palette-preview--${preset.accent} palette-preview--${preset.mode} soft`} />
                        <span className={`palette-preview palette-preview--${preset.accent} palette-preview--${preset.mode} accent`} />
                      </div>
                    </button>
                  )
                })}
              </div>
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
