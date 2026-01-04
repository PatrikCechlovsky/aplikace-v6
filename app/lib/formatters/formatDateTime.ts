/*
 * FILE: app/lib/formatters/formatDateTime.ts
 * PURPOSE: Centrální formátování dat a času pro celou aplikaci.
 *          Všechna zobrazení dat v UI musí používat tyto funkce.
 */

/**
 * Formátuje datum a čas do jednotného CZ formátu:
 * dd.mm.rrrr hh:mm
 *
 * - vstup: ISO string | null | undefined
 * - výstup: string (nebo '—' pokud není hodnota)
 *
 * Používat pouze pro ZOBRAZENÍ v UI.
 */
export function formatDateTime(value?: string | null): string {
  if (!value) return '—'

  const d = new Date(value)
  if (isNaN(d.getTime())) return '—'

  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    `${pad(d.getDate())}.` +
    `${pad(d.getMonth() + 1)}.` +
    `${d.getFullYear()} ` +
    `${pad(d.getHours())}:` +
    `${pad(d.getMinutes())}`
  )
}

/**
 * Formátuje pouze datum (bez času) do jednotného CZ formátu:
 * dd.mm.rrrr
 *
 * - vstup: ISO string | null | undefined
 * - výstup: string (nebo '—' pokud není hodnota)
 *
 * Používat pouze pro ZOBRAZENÍ v UI.
 */
export function formatDate(value?: string | null): string {
  if (!value) return '—'

  const d = new Date(value)
  if (isNaN(d.getTime())) return '—'

  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    `${pad(d.getDate())}.` +
    `${pad(d.getMonth() + 1)}.` +
    `${d.getFullYear()}`
  )
}
