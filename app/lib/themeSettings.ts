// FILE: app/lib/themeSettings.ts

import { supabase } from './supabaseClient'

export type ThemeMode = 'auto' | 'light' | 'dark'
export type ThemeAccent = 'neutral' | 'grey' | 'blue' | 'green' | 'purple'

export type ThemeSettings = {
  mode: ThemeMode
  accent: ThemeAccent
}

const STORAGE_KEY = 'pronajimatel_theme'

const DEFAULT_SETTINGS: ThemeSettings = {
  mode: 'auto',
  accent: 'neutral',
}

/**
 * Aplikuje theme (mode + accent) na .layout
 */
export function applyThemeToLayout(settings: ThemeSettings) {
  if (typeof document === 'undefined') return

  const layout = document.querySelector('.layout')
  if (!layout) return

  // smažeme staré class
  layout.classList.remove('theme-light', 'theme-dark')
  layout.classList.remove(
    'accent-neutral',
    'accent-grey',
    'accent-blue',
    'accent-green',
    'accent-purple',
  )

  // vyhodnotíme "auto" podle systému
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

/**
 * Načtení theme z localStorage
 */
export function loadThemeFromLocalStorage(): ThemeSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw)
    return {
      mode: (parsed.mode as ThemeMode) ?? DEFAULT_SETTINGS.mode,
      accent: (parsed.accent as ThemeAccent) ?? DEFAULT_SETTINGS.accent,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

/**
 * Uložení theme do localStorage
 */
export function saveThemeToLocalStorage(settings: ThemeSettings) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // ignoruj chybu
  }
}

/**
 * Načtení theme ze Supabase – volitelné, ale nevadí, že tu je
 */
export async function loadThemeSettingsFromSupabase(
  userId: string,
): Promise<ThemeSettings> {
  const { data, error } = await supabase
    .from('user_theme_settings')
    .select('mode, accent')
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data) {
    return DEFAULT_SETTINGS
  }

  return {
    mode: (data.mode as ThemeMode) ?? DEFAULT_SETTINGS.mode,
    accent: (data.accent as ThemeAccent) ?? DEFAULT_SETTINGS.accent,
  }
}

/**
 * Uložení theme do Supabase – volitelně
 */
export async function saveThemeSettingsToSupabase(
  userId: string,
  settings: ThemeSettings,
): Promise<void> {
  const { error } = await supabase.from('user_theme_settings').upsert(
    {
      user_id: userId,
      mode: settings.mode,
      accent: settings.accent,
    },
    { onConflict: 'user_id' },
  )

  if (error) {
    console.error('Failed to save theme settings', error)
  }
}
