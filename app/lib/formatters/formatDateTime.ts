// app/lib/formatters/formatDateTime.ts
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
