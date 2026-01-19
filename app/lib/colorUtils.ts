// FILE: app/lib/colorUtils.ts
// PURPOSE: Utility funkce pro práci s barvami (kontrast, RGB konverze)

/**
 * Vrátí barvu textu (černá nebo bílá) podle jasu pozadí
 * @param backgroundColor - Hex barva pozadí (#RRGGBB nebo #RGB)
 * @returns 'black' nebo 'white'
 */
export function getContrastTextColor(backgroundColor: string | null | undefined): string {
  if (!backgroundColor) return 'inherit'
  
  // Odstranění # z hex kódu
  const hex = backgroundColor.replace('#', '')
  
  // Konverze hex na RGB
  let r: number, g: number, b: number
  
  if (hex.length === 3) {
    // Krátký formát #RGB -> #RRGGBB
    r = parseInt(hex[0] + hex[0], 16)
    g = parseInt(hex[1] + hex[1], 16)
    b = parseInt(hex[2] + hex[2], 16)
  } else if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16)
    g = parseInt(hex.substring(2, 4), 16)
    b = parseInt(hex.substring(4, 6), 16)
  } else {
    return 'inherit'
  }
  
  // Výpočet relativního jasu (luminance) podle W3C formula
  // https://www.w3.org/TR/WCAG20/#relativeluminancedef
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  
  // Pokud je jas > 0.5, použij černý text, jinak bílý
  return luminance > 0.5 ? '#000000' : '#FFFFFF'
}

/**
 * Vrátí RGBA string z hex barvy s průhledností
 * @param hexColor - Hex barva (#RRGGBB)
 * @param alpha - Průhlednost 0-1
 * @returns rgba(r, g, b, alpha)
 */
export function hexToRgba(hexColor: string, alpha: number = 1): string {
  const hex = hexColor.replace('#', '')
  
  let r: number, g: number, b: number
  
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16)
    g = parseInt(hex[1] + hex[1], 16)
    b = parseInt(hex[2] + hex[2], 16)
  } else if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16)
    g = parseInt(hex.substring(2, 4), 16)
    b = parseInt(hex.substring(4, 6), 16)
  } else {
    return `rgba(0, 0, 0, ${alpha})`
  }
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
