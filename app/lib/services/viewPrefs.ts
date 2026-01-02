// FILE: app/lib/services/viewPrefs.ts
// PURPOSE: Uložení / načtení uživatelských preferencí pro ListView (sloupce, řazení, šířky…)
//          - Primárně Supabase tabulka `ui_view_prefs`
//          - Fallback do localStorage (pokud tabulka/RLS není připravená)

import { supabase } from '@/app/lib/supabaseClient'

// =====================
// 2) TYPES
// =====================

export type ViewPrefsSortState = { key: string; dir: 'asc' | 'desc' } | null

export type ViewPrefs = {
  /** Verze schématu preferencí (pro migrace JSONu) */
  v?: number

  /** Řazení (ListView 3-cyklus posílá i null) */
  sort?: ViewPrefsSortState

  /** Šířky sloupců v px (per columnKey) */
  colWidths?: Record<string, number>

  /** Pořadí sloupců (keys) – volitelné, později UI drag&drop */
  colOrder?: string[]

  /** Skryté sloupce (keys) – volitelné, později UI checkboxy */
  colHidden?: string[]
}

// =====================
// 3) HELPERS
// =====================

const LS_PREFIX = 'ui:view-prefs:'

function lsKey(viewKey: string) {
  return `${LS_PREFIX}${viewKey}`
}

function safeJsonParse<T>(s: string | null): T | null {
  if (!s) return null
  try {
    return JSON.parse(s) as T
  } catch {
    return null
  }
}

function mergePrefs(base: ViewPrefs, incoming: ViewPrefs | null): ViewPrefs {
  if (!incoming) return base

  return {
    ...base,
    ...incoming,

    sort: typeof incoming.sort === 'undefined' ? base.sort : incoming.sort,
    colWidths: typeof incoming.colWidths === 'undefined' ? base.colWidths : incoming.colWidths,
    colOrder: typeof incoming.colOrder === 'undefined' ? base.colOrder : incoming.colOrder,
    colHidden: typeof incoming.colHidden === 'undefined' ? base.colHidden : incoming.colHidden,
  }
}

/** Apply prefs (hide/order/width) on top of base columns */
export function applyColumnPrefs<T extends { key: string }>(
  baseColumns: T[],
  prefs: Pick<ViewPrefs, 'colWidths' | 'colOrder' | 'colHidden'>
): T[] {
  let cols = [...baseColumns]

  // 1) hide
  const hidden = new Set((prefs.colHidden ?? []).map((x) => String(x)))
  if (hidden.size) cols = cols.filter((c) => !hidden.has(String(c.key)))

  // 2) order
  const order = (prefs.colOrder ?? []).map((x) => String(x))
  if (order.length) {
    const byKey = new Map(cols.map((c) => [String(c.key), c] as const))
    const ordered: T[] = []
    for (const k of order) {
      const c = byKey.get(k)
      if (c) ordered.push(c)
    }
    for (const c of cols) {
      if (!order.includes(String(c.key))) ordered.push(c)
    }
    cols = ordered
  }

  // 3) widths (px)
  const w = prefs.colWidths ?? {}
  cols = cols.map((c) => {
    const px = w[String(c.key)]
    if (!px || !Number.isFinite(px)) return c
    return { ...(c as any), width: `${Math.max(40, Math.round(px))}px` }
  })

  return cols
}
// =====================
// 4) DATA LOAD
// =====================

/**
 * Načte preference pro daný viewKey.
 * - Nejprve localStorage (rychlý start)
 * - Poté Supabase (pokud je dostupné)
 */
export async function loadViewPrefs(viewKey: string, defaults: ViewPrefs): Promise<ViewPrefs> {
  const ls = typeof window !== 'undefined' ? safeJsonParse<ViewPrefs>(window.localStorage.getItem(lsKey(viewKey))) : null
  let merged = mergePrefs(defaults, ls)

  try {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth?.user?.id) return merged

    const { data, error } = await supabase.from('ui_view_prefs').select('prefs').eq('view_key', viewKey).maybeSingle()
    if (error) throw error

    const prefsFromDb = (data as any)?.prefs as ViewPrefs | null | undefined
    merged = mergePrefs(merged, prefsFromDb ?? null)

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(lsKey(viewKey), JSON.stringify(merged))
    }

    return merged
  } catch {
    return merged
  }
}

/**
 * Uloží preference pro daný viewKey.
 * - Vždy localStorage
 * - Poté Supabase upsert (pokud je dostupné)
 */
export async function saveViewPrefs(viewKey: string, prefs: ViewPrefs): Promise<void> {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(lsKey(viewKey), JSON.stringify(prefs))
    }
  } catch {
    // ignore
  }

  try {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth?.user?.id) return

    const { error } = await supabase.from('ui_view_prefs').upsert(
      {
        user_id: auth.user.id,
        view_key: viewKey,
        prefs,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,view_key' }
    )

    if (error) throw error
  } catch {
    // ignore (RLS/table not ready)
  }
}
