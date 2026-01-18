/**
 * Utility pro správu historie hodnot v formulářových polích
 * Ukládá posledních 5 hodnot pro každé pole do localStorage
 */

const STORAGE_PREFIX = 'form_history_'
const MAX_HISTORY_ITEMS = 5

/**
 * Získá klíč pro localStorage pro dané pole
 */
function getStorageKey(fieldId: string): string {
  return `${STORAGE_PREFIX}${fieldId}`
}

/**
 * Načte historii hodnot pro dané pole
 */
export function loadFieldHistory(fieldId: string): string[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const key = getStorageKey(fieldId)
    const raw = window.localStorage.getItem(key)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    // Filtrujeme prázdné hodnoty a vracíme jako stringy
    return parsed
      .filter((v) => v != null && String(v).trim() !== '')
      .map((v) => String(v))
      .slice(0, MAX_HISTORY_ITEMS)
  } catch {
    return []
  }
}

/**
 * Uloží hodnotu do historie pole
 * Přidá na začátek seznamu a zachová max MAX_HISTORY_ITEMS hodnot
 */
export function saveFieldHistory(fieldId: string, value: string): void {
  if (typeof window === 'undefined') {
    return
  }

  // Ignorujeme prázdné hodnoty
  const trimmed = value?.trim()
  if (!trimmed) {
    return
  }

  try {
    const key = getStorageKey(fieldId)
    const existing = loadFieldHistory(fieldId)

    // Odstraníme duplikáty (pokud už hodnota existuje)
    const withoutDuplicate = existing.filter((v) => v !== trimmed)

    // Přidáme novou hodnotu na začátek
    const updated = [trimmed, ...withoutDuplicate].slice(0, MAX_HISTORY_ITEMS)

    window.localStorage.setItem(key, JSON.stringify(updated))
  } catch {
    // Ignorujeme chyby (např. quota exceeded)
  }
}

/**
 * Vymaže historii pro dané pole
 */
export function clearFieldHistory(fieldId: string): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const key = getStorageKey(fieldId)
    window.localStorage.removeItem(key)
  } catch {
    // Ignorujeme chyby
  }
}

/**
 * Vymaže všechny historie formulářů
 */
export function clearAllFormHistory(): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const keys: string[] = []
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key?.startsWith(STORAGE_PREFIX)) {
        keys.push(key)
      }
    }
    keys.forEach((key) => window.localStorage.removeItem(key))
  } catch {
    // Ignorujeme chyby
  }
}


