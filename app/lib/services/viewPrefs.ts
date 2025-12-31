// FILE: app/lib/services/viewPrefs.ts
// PURPOSE: Uložení / načtení uživatelských preferencí pro ListView (sloupce, řazení, šířky…)
//          - Primárně Supabase tabulka `ui_view_prefs`
//          - Fallback do localStorage (pokud tabulka/RLS není připravená)

import { supabase } from '@/app/lib/supabaseClient'

export type ViewPrefsSortState = { key: string; dir: 'asc' | 'desc' } | null

export type ViewPrefs = {
  /** Slouží pro budoucí rozšíření (sloupce, šířky, pořadí). Pro MVP ukládáme minimálně sort. */
  sort?: ViewPrefsSortState
  /** Verze schématu preferencí (pro migrace JSONu) */
  v?: number
}

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
  }
}

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
    // fallback already prepared
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
