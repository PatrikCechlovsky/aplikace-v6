// FILE: app/lib/themeSettings.ts
import { supabase } from './supabaseClient' // 👈 uprav podle své cesty

export type ThemeMode = 'auto' | 'light' | 'dark'
export type ThemeAccent = 'blue' | 'green' | 'landlord'

export interface ThemeSettings {
  mode: ThemeMode
  accent: ThemeAccent
}

const DEFAULT_SETTINGS: ThemeSettings = {
  mode: 'auto',
  accent: 'blue',
}

export async function loadThemeSettingsFromSupabase(
  userId: string | null | undefined,
): Promise<ThemeSettings> {
  if (!userId) return DEFAULT_SETTINGS

  const { data, error } = await supabase
    .from('user_theme_settings')
    .select('theme_mode, theme_accent')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    return DEFAULT_SETTINGS
  }

  return {
    mode: (data.theme_mode as ThemeMode) ?? 'auto',
    accent: (data.theme_accent as ThemeAccent) ?? 'blue',
  }
}

export async function saveThemeSettingsToSupabase(
  userId: string | null | undefined,
  settings: ThemeSettings,
): Promise<void> {
  if (!userId) return

  await supabase.from('user_theme_settings').upsert(
    {
      user_id: userId,
      theme_mode: settings.mode,
      theme_accent: settings.accent,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )
}
