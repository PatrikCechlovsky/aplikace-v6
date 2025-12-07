// FILE: app/lib/themeSettings.ts

import { supabase } from './supabaseClient' // cesta podle tebe

export type ThemeMode = 'auto' | 'light' | 'dark'

export function applyThemeToLayout(settings: ThemeSettings) { ... }

export function loadThemeFromLocalStorage(): ThemeSettings { ... }

// 🎨 NOVÝ seznam akcentů
export type ThemeAccent = 'neutral' | 'grey' | 'blue' | 'green' | 'purple'

export type ThemeSettings = {
  mode: ThemeMode
  accent: ThemeAccent
}

const DEFAULT_SETTINGS: ThemeSettings = {
  mode: 'auto',
  accent: 'neutral', // klidně změň na 'blue' nebo 'purple', jak chceš
}

// Načtení z DB
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

// Uložení do DB
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
