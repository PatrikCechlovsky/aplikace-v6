// FILE: app/lib/iconDisplaySettings.ts
// PURPOSE: Uživatelské nastavení zobrazení ikon (ikony + text vs. jen text)

export type IconDisplayMode = 'icons' | 'text'

export type IconDisplaySettings = {
  mode: IconDisplayMode
}

const STORAGE_KEY = 'pronajimatel_icon_display'

const DEFAULT_SETTINGS: IconDisplaySettings = {
  mode: 'icons',
}

/**
 * Aplikuje nastavení ikon na hlavní layout (přidá class na .layout).
 * - .icons-mode-icons  → standardní režim (ikony + text)
 * - .icons-mode-text   → textový režim (ikony se schovají)
 */
export function applyIconDisplayToLayout(settings: IconDisplaySettings) {
  if (typeof document === 'undefined') return

  const layout = document.querySelector('.layout')
  if (!layout) return

  layout.classList.remove('icons-mode-icons', 'icons-mode-text')

  const modeClass =
    settings.mode === 'text' ? 'icons-mode-text' : 'icons-mode-icons'

  layout.classList.add(modeClass)
}

/**
 * Načte nastavení ikon z localStorage.
 */
export function loadIconDisplayFromLocalStorage(): IconDisplaySettings {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS

    const parsed = JSON.parse(raw) as Partial<IconDisplaySettings> | null
    if (parsed && (parsed.mode === 'icons' || parsed.mode === 'text')) {
      return { mode: parsed.mode }
    }

    return DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

/**
 * Uloží nastavení ikon do localStorage.
 */
export function saveIconDisplayToLocalStorage(
  settings: IconDisplaySettings,
): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // ignoruj chybu
  }
}
