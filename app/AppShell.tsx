// FILE: app/AppShell.tsx
// PURPOSE: Hlavní aplikační shell se 6-sekčním layoutem, navigací modulů a URL stavem.
// NOTES: URL stav používá cestu /[moduleId] + query parametry (s, t) bez duplicity m.

'use client'

import './styles/components/AppShell.css'
import './styles/components/Sidebar.css'
import './styles/components/Breadcrumbs.css'
import './styles/components/CommonActions.css'
import './styles/components/HomeActions.css'
import './styles/components/TopMenu.css'
import './styles/components/HomeButton.css'
import './styles/components/LoginPanel.css'
import './styles/components/GenericTypeTile.css'
import './styles/components/ThemeSettingsTile.css'
import './styles/components/Entity.css'
import './styles/components/TableView.css'
import './styles/components/DetailTabs.css'
import './styles/components/DetailForm.css'
import './styles/components/EntityDetailFrame.css'
import './styles/components/DetailAttachments.css'
import './styles/components/ExcelMode.css'
import './styles/components/DensityTypography.css'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import HomeButton from '@/app/UI/HomeButton'
import Sidebar, { type SidebarSelection } from '@/app/UI/Sidebar'
import Breadcrumbs, { type BreadcrumbSegment } from '@/app/UI/Breadcrumbs'
import HomeActions from '@/app/UI/HomeActions'
import LoginPanel from '@/app/UI/LoginPanel'
import ErrorBoundary from '@/app/UI/ErrorBoundary'
import { SkeletonCentered } from '@/app/UI/SkeletonLoader'

import { applyThemeToLayout, loadThemeFromLocalStorage } from '@/app/lib/themeSettings'
import { applyIconDisplayToLayout, loadIconDisplayFromLocalStorage } from '@/app/lib/iconDisplaySettings'

import { getCurrentSession, onAuthStateChange, logout } from '@/app/lib/services/auth'
import { getLandlordCountsByType } from '@/app/lib/services/landlords'
import { getSubjectCountsByType } from '@/app/lib/services/subjects'
import { fetchSubjectTypes } from '@/app/modules/900-nastaveni/services/subjectTypes'

import { MODULE_SOURCES } from '@/app/modules.index'
import type { IconKey } from '@/app/UI/icons'

import { TopMenu } from '@/app/UI/TopMenu'
import CommonActions from '@/app/UI/CommonActions'
import type { CommonActionId, CommonActionsUiState, ViewMode } from '@/app/UI/CommonActions'
import '@/app/styles/components/TileLayout.css'

type SessionUser = {
  id?: string | null
  email?: string | null
  displayName?: string | null
}

type ModuleTileConfig = {
  id: string
  label: string
  component: React.ComponentType<any>
  icon?: IconKey
  sectionId?: string
  order?: number
  children?: ModuleTileConfig[]
}

type ModuleSectionConfig = {
  id: string
  label: string
  icon?: IconKey
  introTitle?: string
  introText?: string
}

type ModuleConfig = {
  id: string
  label: string
  icon?: IconKey
  order?: number
  enabled?: boolean
  tiles?: ModuleTileConfig[]
  sections?: ModuleSectionConfig[]
  introTitle?: string
  introText?: string
}

type AppShellProps = {
  initialModuleId?: string | null
}

type MenuLayout = 'sidebar' | 'top'

export default function AppShell({ initialModuleId = null }: AppShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // URL state (MVP): /010? s=...&t=...
  const urlState = useMemo(() => {
    const m = searchParams?.get('m')
    const s = searchParams?.get('s')
    const t = searchParams?.get('t')
    const pathParts = (pathname ?? '').split('/').filter(Boolean)
    const pathModuleId = pathParts.length ? (pathParts[0] === 'modules' ? pathParts[1] : pathParts[0]) : null
    const moduleId = m && m.trim() ? m.trim() : pathModuleId
    return {
      moduleId: moduleId && moduleId.trim() ? moduleId.trim() : null,
      sectionId: s && s.trim() ? s.trim() : null,
      tileId: t && t.trim() ? t.trim() : null,
    }
  }, [pathname, searchParams])

  const setUrlState = useCallback(
    (
      next: { moduleId?: string | null; sectionId?: string | null; tileId?: string | null },
      mode: 'replace' | 'push' = 'replace',
      keepOtherParams: boolean = true
    ) => {
      // IMPORTANT:
      // - keepOtherParams=true  => preserve unknown query params (filters etc.)
      // - keepOtherParams=false => drop unknown params (tile-specific state like id/vm/...)
      const sp = keepOtherParams
        ? new URLSearchParams(searchParams?.toString() ?? '')
        : new URLSearchParams()

      const setOrDelete = (key: string, val?: string | null) => {
        if (val && val.trim()) sp.set(key, val.trim())
        else sp.delete(key)
      }

      // ✅ Neuchovávej duplicitní modul v query parametru
      sp.delete('m')
      setOrDelete('s', next.sectionId ?? null)
      setOrDelete('t', next.tileId ?? null)

      const qs = sp.toString()
      const basePath = next.moduleId ? `/${next.moduleId}` : '/'
      const nextUrl = qs ? `${basePath}?${qs}` : basePath

      const currentQs = searchParams?.toString() ?? ''
      const currentUrl = currentQs ? `${pathname}?${currentQs}` : pathname

      // ✅ guard proti nekonečné smyčce
      if (nextUrl === currentUrl) return

      if (mode === 'push') router.push(nextUrl)
      else router.replace(nextUrl)
    },
    [pathname, router, searchParams]
  )

  // Auth
  const [authLoading, setAuthLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<SessionUser | null>(null)
  const displayName = user?.displayName || user?.email || 'Uživatel'

  // Modules
  const [modules, setModules] = useState<ModuleConfig[]>([])
  const [modulesLoading, setModulesLoading] = useState(true)
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null)
  const [activeSelection, setActiveSelection] = useState<SidebarSelection | null>(null)
  
  // ✅ Counter pro force remount tile při opakovaném kliknutí
  const [tileRenderKey, setTileRenderKey] = useState(0)
  
  // ✅ Flag pro home button - aby se nevolal confirmIfDirty znovu
  const homeButtonClickRef = useRef(false)

  // Menu layout
  const [menuLayout, setMenuLayout] = useState<MenuLayout>('sidebar')

  // CommonActions v6 – registry inputs
  const [commonActions, setCommonActions] = useState<CommonActionId[] | undefined>(undefined)
  const [commonActionsUi, setCommonActionsUi] = useState<CommonActionsUiState>({
    viewMode: 'list',
    hasSelection: false,
    isDirty: false,
  })
  const [commonActionHandler, setCommonActionHandler] = useState<((id: CommonActionId) => void) | undefined>(
    undefined
  )

  const registerCommonActions = useCallback((actions: CommonActionId[]) => {
    setCommonActions((prev) => {
      // Kontrola jestli se pole změnilo (délka + obsah)
      if (prev && prev.length === actions.length && prev.every((a, i) => a === actions[i])) {
        return prev // Nezměnilo se → neměnit state → žádný re-render
      }
      return actions
    })
  }, [])

  const registerCommonActionsUi = useCallback((next: any) => {
    if (!next || typeof next !== 'object') return

    setCommonActionsUi((prev) => {
      const viewMode = typeof next.viewMode === 'string' ? (next.viewMode as ViewMode) : prev.viewMode
      const hasSelection = typeof next.hasSelection === 'boolean' ? next.hasSelection : prev.hasSelection
      const isDirty = typeof next.isDirty === 'boolean' ? next.isDirty : prev.isDirty

      if (prev.viewMode === viewMode && prev.hasSelection === hasSelection && prev.isDirty === isDirty) {
        return prev
      }

      return { viewMode, hasSelection, isDirty }
    })
  }, [])

  const registerCommonActionHandler = useCallback((fn: (id: CommonActionId) => void) => {
    setCommonActionHandler(() => fn)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const w = window as any
    const getState = () => ({
      commonActionsUi,
      activeSelection,
      urlState,
      searchParams: Object.fromEntries(searchParams?.entries() || []),
    })

    w.__appDebug = {
      getState,
      dump: () => console.log('APP_DEBUG', getState()),
      navigate: (selection: SidebarSelection) => handleModuleSelect(selection),
    }

    return () => {
      if (w.__appDebug) delete w.__appDebug
    }
  }, [commonActionsUi, activeSelection, urlState, searchParams, handleModuleSelect])

  const getDefaultTileId = useCallback(
    (moduleId?: string | null) => {
      if (!moduleId) return null
      const module = modules.find((m) => m.id === moduleId)
      const tiles = module?.tiles ?? []
      if (!tiles.length) return null
      const sorted = [...tiles].sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999))
      return sorted[0]?.id ?? null
    },
    [modules]
  )

  function resetCommonActions() {
    setCommonActions(undefined)
    setCommonActionHandler(undefined)
    setCommonActionsUi({ viewMode: 'list', hasSelection: false, isDirty: false })
  }

  function confirmIfDirty(message?: string) {
    const vm = commonActionsUi.viewMode
    const shouldGuard = vm === 'edit' || vm === 'create'
    if (!shouldGuard) return true
    if (!commonActionsUi.isDirty) return true
    return window.confirm(message ?? 'Máš neuložené změny. Opravdu chceš pokračovat?')
  }

  // Apply theme + icon mode
  useEffect(() => {
    const themeSettings = loadThemeFromLocalStorage()
    applyThemeToLayout(themeSettings)

    const iconSettings = loadIconDisplayFromLocalStorage()
    applyIconDisplayToLayout(iconSettings)
  }, [])

  // Load menuLayout from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem('app-view-settings')
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (parsed.menuLayout === 'top' || parsed.menuLayout === 'sidebar') {
        setMenuLayout(parsed.menuLayout as MenuLayout)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return
    const el = document.querySelector('.layout')
    if (!el) return
    el.classList.toggle('layout--topmenu', menuLayout === 'top')
  }, [menuLayout])

  // ✅ Poslouchej změny menuLayout z AppViewSettingsTile
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    function onSettingsChanged() {
      try {
        const raw = window.localStorage.getItem('app-view-settings')
        if (!raw) return
        const parsed = JSON.parse(raw)
        if (parsed.menuLayout === 'top' || parsed.menuLayout === 'sidebar') {
          setMenuLayout(parsed.menuLayout as MenuLayout)
        }
      } catch {
        // ignore
      }
    }
    
    window.addEventListener('app-view-settings-changed', onSettingsChanged)
    return () => window.removeEventListener('app-view-settings-changed', onSettingsChanged)
  }, [])

  // -------------------------
  // App view settings (table/cards + excel style + density)
  // -------------------------
  type AppViewMode = 'table' | 'cards'
  type UiStyle = 'default' | 'excel'
  type Density = 'comfortable' | 'compact' | 'mini'
  
  function readAppViewSettings(): { viewMode: AppViewMode; uiStyle: UiStyle; density: Density; menuLayout?: 'sidebar' | 'top' } {
    if (typeof window === 'undefined') return { viewMode: 'table', uiStyle: 'default', density: 'comfortable' }
    try {
      const raw = window.localStorage.getItem('app-view-settings')
      const parsed = raw ? JSON.parse(raw) : {}
      return {
        viewMode: parsed.viewMode === 'cards' ? 'cards' : 'table',
        uiStyle: parsed.uiStyle === 'excel' ? 'excel' : 'default',
        density: parsed.density === 'mini' ? 'mini' : parsed.density === 'compact' ? 'compact' : 'comfortable',
        menuLayout: parsed.menuLayout === 'top' ? 'top' : parsed.menuLayout === 'sidebar' ? 'sidebar' : undefined,
      }
    } catch {
      return { viewMode: 'table', uiStyle: 'default', density: 'comfortable' }
    }
  }
  
  function applyAppViewClasses() {
    if (typeof document === 'undefined') return
    const el = document.querySelector('.layout')
    if (!el) return
  
    const s = readAppViewSettings()
  
    el.classList.toggle('layout--cards', s.viewMode === 'cards')
    el.classList.toggle('layout--table', s.viewMode !== 'cards')
  
    el.classList.toggle('layout--excel', s.uiStyle === 'excel')
    el.classList.remove(
      'layout--density-comfortable',
      'layout--density-compact',
      'layout--density-mini'
    )
    // a pak nasadíme jednu správnou
    switch (s.density) {
      case 'mini':
        el.classList.add('layout--density-mini')
        break
      case 'compact':
        el.classList.add('layout--density-compact')
        break
      default:
        el.classList.add('layout--density-comfortable')
        break
    }
  }
  
  useEffect(() => {
    // initial apply
    applyAppViewClasses()
  
    // live updates from settings tile
    function onChanged() {
      applyAppViewClasses()
    }
  
    window.addEventListener('app-view-settings-changed', onChanged as any)
    return () => window.removeEventListener('app-view-settings-changed', onChanged as any)
  }, [])

  // Auth init
  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    async function initAuth() {
      try {
        const { data, error } = await getCurrentSession()
        if (error) console.error('getCurrentSession error:', error)

        const session = data?.session ?? null
        if (session?.user) {
          const meta = session.user.user_metadata || {}
          setIsAuthenticated(true)
          setUser({
            id: session.user.id,
            email: session.user.email,
            displayName: meta.display_name ?? meta.full_name ?? meta.name ?? null,
          })
        } else {
          setIsAuthenticated(false)
          setUser(null)
          setActiveModuleId(null)
          setActiveSelection(null)
          resetCommonActions()
        }

        const { data: sub } = onAuthStateChange((event: string, sess: any) => {
          console.log('[auth] event', event)

          if (sess?.user) {
            const meta = sess.user.user_metadata || {}
            setIsAuthenticated(true)
            setUser({
              id: sess.user.id,
              email: sess.user.email,
              displayName: meta.display_name ?? meta.full_name ?? meta.name ?? null,
            })
          } else {
            setIsAuthenticated(false)
            setUser(null)
            setActiveModuleId(null)
            setActiveSelection(null)
            resetCommonActions()
          }
        })

        unsubscribe = sub?.subscription?.unsubscribe
      } catch (err) {
        console.error('Chyba při načítání session:', err)
        setIsAuthenticated(false)
        setUser(null)
        setActiveModuleId(null)
        setActiveSelection(null)
        resetCommonActions()
      } finally {
        setAuthLoading(false)
      }
    }

    initAuth()
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  // Load modules
  useEffect(() => {
    let cancelled = false

    async function loadModules() {
      try {
        const loaded: ModuleConfig[] = []

        for (const loader of MODULE_SOURCES) {
          try {
            const modModule: any = await loader()
            const cfg: any = modModule.default ?? modModule
            if (!cfg?.id) continue
            if (cfg.enabled === false) continue

            // Pro modul 030 (Pronajímatelé) načteme počty podle typů a aktualizujeme labels + ikony
            if (cfg.id === '030-pronajimatel' && Array.isArray(cfg.tiles)) {
              try {
                // Načíst počty podle typů
                const counts = await getLandlordCountsByType(false)
                const countsMap = new Map(counts.map((c) => [c.subject_type, c.count]))

                // Načíst typy subjektů z modulu 900 pro ikony a barvy
                const subjectTypes = await fetchSubjectTypes()
                const typesMap = new Map(subjectTypes.map((t) => [t.code, t]))

                // Mapování typů subjektů na názvy (fallback, pokud není v DB)
                const typeLabels: Record<string, string> = {
                  osoba: 'Osoba',
                  osvc: 'OSVČ',
                  firma: 'Firma',
                  spolek: 'Spolek',
                  statni: 'Státní',
                  zastupce: 'Zástupce',
                }

                // Aktualizovat tiles s počty, ikonami a filtrovat jen ty s počtem > 0
                const updatedTiles = cfg.tiles
                  .map((tile: any) => {
                    // Pokud je tile pro typ subjektu, aktualizovat label s počtem a ikonu z modulu 900
                    if (tile.dynamicLabel && tile.subjectType) {
                      const count = countsMap.get(tile.subjectType) ?? 0
                      const typeDef = typesMap.get(tile.subjectType)
                      const typeLabel = typeDef?.name || typeLabels[tile.subjectType] || tile.subjectType
                      const icon = typeDef?.icon || tile.icon || 'user' // Ikona z modulu 900 nebo fallback

                      // Vrátit tile s aktualizovaným labelem a ikonou
                      return {
                        ...tile,
                        label: `${typeLabel} (${count})`,
                        icon: icon as IconKey,
                        _count: count, // Uložit počet pro pozdější použití
                        _color: typeDef?.color || null, // Uložit barvu pro pozdější použití
                      }
                    }
                    return tile
                  })
                  .filter((tile: any) => {
                    // Filtrovat tiles s dynamicLabel - zobrazit jen pokud mají počet > 0
                    if (tile.dynamicLabel && tile.subjectType) {
                      const count = countsMap.get(tile.subjectType) ?? 0
                      return count > 0
                    }
                    return true // Ostatní tiles zobrazit vždy (Přehled pronajímatelů, Přidat pronajimatele)
                  })

                loaded.push({
                  id: cfg.id,
                  label: cfg.label ?? cfg.id,
                  icon: cfg.icon,
                  order: cfg.order ?? 9999,
                  enabled: cfg.enabled ?? true,
                  tiles: updatedTiles,
                  sections: cfg.sections ?? [],
                  introTitle: cfg.introTitle,
                  introText: cfg.introText,
                })
              } catch (countErr) {
                console.error('Chyba při načítání počtů pronajímatelů:', countErr)
                // Fallback na původní konfiguraci bez počtů
                loaded.push({
                  id: cfg.id,
                  label: cfg.label ?? cfg.id,
                  icon: cfg.icon,
                  order: cfg.order ?? 9999,
                  enabled: cfg.enabled ?? true,
                  tiles: cfg.tiles ?? [],
                  sections: cfg.sections ?? [],
                  introTitle: cfg.introTitle,
                  introText: cfg.introText,
                })
              }
            } else if (cfg.id === '800-subjekty' && Array.isArray(cfg.tiles)) {
              try {
                const counts = await getSubjectCountsByType(false)
                const countsMap = new Map(counts.map((c) => [c.subject_type, c.count]))

                const subjectTypes = await fetchSubjectTypes()
                const typesMap = new Map(subjectTypes.map((t) => [t.code, t]))

                const typeLabels: Record<string, string> = {
                  osoba: 'Osoba',
                  osvc: 'OSVČ',
                  firma: 'Firma',
                  spolek: 'Spolek',
                  statni: 'Státní',
                  zastupce: 'Zástupce',
                }

                const updatedTiles = cfg.tiles
                  .map((tile: any) => {
                    if (tile.dynamicLabel && tile.subjectType) {
                      const count = countsMap.get(tile.subjectType) ?? 0
                      const typeDef = typesMap.get(tile.subjectType)
                      const typeLabel = typeDef?.name || typeLabels[tile.subjectType] || tile.subjectType
                      const icon = typeDef?.icon || tile.icon || 'user'

                      return {
                        ...tile,
                        label: `${typeLabel} (${count})`,
                        icon: icon as IconKey,
                        _count: count,
                        _color: typeDef?.color || null,
                      }
                    }
                    return tile
                  })
                  .filter((tile: any) => {
                    if (tile.dynamicLabel && tile.subjectType) {
                      const count = countsMap.get(tile.subjectType) ?? 0
                      return count > 0
                    }
                    return true
                  })

                loaded.push({
                  id: cfg.id,
                  label: cfg.label ?? cfg.id,
                  icon: cfg.icon,
                  order: cfg.order ?? 9999,
                  enabled: cfg.enabled ?? true,
                  tiles: updatedTiles,
                  sections: cfg.sections ?? [],
                  introTitle: cfg.introTitle,
                  introText: cfg.introText,
                })
              } catch (countErr) {
                console.error('Chyba při načítání počtů subjektů:', countErr)
                loaded.push({
                  id: cfg.id,
                  label: cfg.label ?? cfg.id,
                  icon: cfg.icon,
                  order: cfg.order ?? 9999,
                  enabled: cfg.enabled ?? true,
                  tiles: cfg.tiles ?? [],
                  sections: cfg.sections ?? [],
                  introTitle: cfg.introTitle,
                  introText: cfg.introText,
                })
              }
            } else {
              // Ostatní moduly bez změn
              loaded.push({
                id: cfg.id,
                label: cfg.label ?? cfg.id,
                icon: cfg.icon,
                order: cfg.order ?? 9999,
                enabled: cfg.enabled ?? true,
                tiles: cfg.tiles ?? [],
                sections: cfg.sections ?? [],
                introTitle: cfg.introTitle,
                introText: cfg.introText,
              })
            }
          } catch (err) {
            console.error('Chyba při načítání modulu:', err)
          }
        }

        loaded.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        if (!cancelled) setModules(loaded)
      } catch (err) {
        console.error('Chyba při načítání modulů:', err)
      } finally {
        if (!cancelled) setModulesLoading(false)
      }
    }

    loadModules()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated]) // Načíst počty až po autentizaci

  // Initial module
  useEffect(() => {
    if (!isAuthenticated) return
    if (!modules.length) return
    if (activeModuleId) return

    // 1) URL-first
    if (urlState.moduleId && modules.some((m) => m.id === urlState.moduleId) && activeSelection?.moduleId !== urlState.moduleId) {
      const defaultTileId = !urlState.sectionId && !urlState.tileId ? getDefaultTileId(urlState.moduleId) : null
      const resolvedTileId = urlState.tileId ?? defaultTileId ?? undefined

      setActiveModuleId(urlState.moduleId)
      setActiveSelection({
        moduleId: urlState.moduleId,
        sectionId: urlState.sectionId ?? undefined,
        tileId: resolvedTileId,
      })

      if (defaultTileId && !urlState.tileId) {
        setUrlState({ moduleId: urlState.moduleId, sectionId: null, tileId: defaultTileId }, 'replace', true)
      }

      resetCommonActions()
    }

    // 2) Fallback (legacy)
    if (initialModuleId && modules.some((m) => m.id === initialModuleId)) {
      const defaultTileId = getDefaultTileId(initialModuleId)
      setActiveModuleId(initialModuleId)
      setActiveSelection({ moduleId: initialModuleId, tileId: defaultTileId ?? undefined })
      resetCommonActions()
      // legacy init – OK to drop unknown params
      setUrlState({ moduleId: initialModuleId, sectionId: null, tileId: defaultTileId ?? null }, 'replace', false)
    }
  }, [activeModuleId, getDefaultTileId, initialModuleId, isAuthenticated, modules, setUrlState, urlState.moduleId, urlState.sectionId, urlState.tileId])

  // React to browser back/forward (URL -> state)
  useEffect(() => {
    if (!isAuthenticated) return
    if (modulesLoading) return

    const current = {
      moduleId: activeSelection?.moduleId ?? null,
      sectionId: activeSelection?.sectionId ?? null,
      tileId: activeSelection?.tileId ?? null,
    }

    const target = {
      moduleId: urlState.moduleId ?? null,
      sectionId: urlState.sectionId ?? null,
      tileId: urlState.tileId ?? null,
    }

    const normalizedTarget = {
      moduleId: target.moduleId,
      sectionId: target.sectionId,
      tileId:
        !target.sectionId && !target.tileId && target.moduleId
          ? getDefaultTileId(target.moduleId)
          : target.tileId,
    }

    const differs =
      current.moduleId !== normalizedTarget.moduleId ||
      current.sectionId !== normalizedTarget.sectionId ||
      current.tileId !== normalizedTarget.tileId
    if (!differs) return

    // ✅ FIX: Pokud změna přichází z home buttonu, přeskoč confirmIfDirty
    if (homeButtonClickRef.current) {
      homeButtonClickRef.current = false
      // Pokračuj bez confirmIfDirty
    } else {
      if (!confirmIfDirty()) {
        // keep unknown params here (we are reverting user navigation)
        setUrlState(current, 'replace', true)
        return
      }
    }

    if (!normalizedTarget.moduleId) {
      setActiveModuleId(null)
      setActiveSelection(null)
      resetCommonActions()
      return
    }

    if (!modules.some((m) => m.id === normalizedTarget.moduleId)) return
    setActiveModuleId(normalizedTarget.moduleId)
    setActiveSelection({
      moduleId: normalizedTarget.moduleId,
      sectionId: normalizedTarget.sectionId ?? undefined,
      tileId: normalizedTarget.tileId ?? undefined,
    })

    if (!target.sectionId && !target.tileId && normalizedTarget.tileId) {
      setUrlState(
        { moduleId: normalizedTarget.moduleId, sectionId: null, tileId: normalizedTarget.tileId },
        'replace',
        true
      )
    }

    if ((activeSelection?.tileId ?? null) !== (normalizedTarget.tileId ?? null)) resetCommonActions()
  }, [activeSelection, getDefaultTileId, isAuthenticated, modules, modulesLoading, setUrlState, urlState.moduleId, urlState.sectionId, urlState.tileId])

  useEffect(() => {
    if (!activeSelection?.tileId) resetCommonActions()
  }, [activeSelection?.tileId])

  async function handleLogout() {
    if (!confirmIfDirty('Máš neuložené změny. Opravdu se chceš odhlásit?')) return
    await logout()
    setIsAuthenticated(false)
    setUser(null)
    setActiveModuleId(null)
    setActiveSelection(null)
    resetCommonActions()
    router.push('/')
  }

  function handleModuleSelect(selection: SidebarSelection) {
    const finalSelection = { ...selection }
    if (finalSelection.moduleId && !finalSelection.sectionId && !finalSelection.tileId) {
      const defaultTileId = getDefaultTileId(finalSelection.moduleId)
      if (defaultTileId) finalSelection.tileId = defaultTileId
    }

    const sameSelection =
      activeSelection?.moduleId === finalSelection.moduleId &&
      (activeSelection?.sectionId ?? null) === (finalSelection.sectionId ?? null) &&
      (activeSelection?.tileId ?? null) === (finalSelection.tileId ?? null)

    console.log('🔍 handleModuleSelect:', { 
      selection: finalSelection, 
      sameSelection, 
      tileRenderKey,
      searchParams: Object.fromEntries(searchParams?.entries() || [])
    })

    // ✅ FIX: Pokud je stejná selection, ale máme otevřený detail (tile-specifické parametry),
    // zavřeme detail a otevřeme seznam
    if (sameSelection) {
      const id = searchParams?.get('id')
      const vm = searchParams?.get('vm')
      // Zkontroluj, jestli máme tile-specifické parametry (pouze id nebo vm, NE t!)
      // Parametr 't' (tileId) je normální navigační parametr, ne detail-specific
      const hasTileSpecificParams = id || vm
      if (hasTileSpecificParams) {
        // Zavřeme detail - zahoďme tile-specifické parametry
        // Použijeme keepOtherParams=false, což zahodí všechny parametry kromě s/t
        setUrlState(
          {
            moduleId: finalSelection.moduleId,
            sectionId: finalSelection.sectionId ?? null,
            tileId: finalSelection.tileId ?? null,
          },
          'replace',
          false // keepOtherParams=false znamená zahodit tile-specifické parametry (id/vm/am/t)
        )
        resetCommonActions()
        return
      }
      
      // ✅ FIX: Pokud klikneš na stejný tile znovu (bez detail params)
      // → force remount tile (aby se CommonActions znovu zaregistroval)
      if (finalSelection.tileId) {
        console.log('⚡ Force remount - incrementing tileRenderKey from', tileRenderKey, 'to', tileRenderKey + 1)
        setTileRenderKey(prev => prev + 1)
        // NEMAŽ CommonActions - nechej staré, tile se remountuje a přepíše je
        return
      }
      
      return
    }

    if (!confirmIfDirty()) return

    // Pokud klikneš na modul bez tileId → otevři výchozí tile (AUTO-SELECT)

    const prevModule = activeSelection?.moduleId ?? null
    const prevTile = activeSelection?.tileId ?? null

    const nextModule = finalSelection.moduleId ?? null
    const nextTile = finalSelection.tileId ?? null

    const moduleChanged = prevModule !== nextModule
    const tileChanged = prevTile !== nextTile

    setActiveModuleId(finalSelection.moduleId)
    setActiveSelection(finalSelection)

    // ✅ KEY FIX:
    // Když měníš modul nebo tile, zahoď tile-specifické parametry (id/vm/...)
    // Jinak se ti přenáší "vybraný záznam" mezi moduly/tiles.
    const keepOtherParams = !(moduleChanged || tileChanged)

    setUrlState(
      {
        moduleId: finalSelection.moduleId,
        sectionId: finalSelection.sectionId ?? null,
        tileId: finalSelection.tileId ?? null,
      },
      'push',
      keepOtherParams
    )

    if (tileChanged) resetCommonActions()
  }

  function handleHomeClick() {
    if (!isAuthenticated) return
    
    // ✅ FIX: Zkontroluj isDirty přímo z commonActionsUi
    // Pokud je dirty v edit/create režimu, zeptej se uživatele
    const hasDirtyChanges = commonActionsUi.isDirty && (commonActionsUi.viewMode === 'edit' || commonActionsUi.viewMode === 'create')
    
    if (hasDirtyChanges) {
      const ok = window.confirm('Máš neuložené změny. Opravdu chceš odejít na úvodní stránku?')
      if (!ok) return
    }

    // ✅ FIX: Nastav flag, aby se v useEffect nevolal confirmIfDirty znovu
    homeButtonClickRef.current = true
    
    // ✅ FIX: Nejdříve aktualizuj URL, pak teprve stav
    // Tím se vyhneme dvojímu kliknutí - URL změna způsobí, že useEffect aktualizuje stav
    setUrlState({ moduleId: null, sectionId: null, tileId: null }, 'replace', false)
    resetCommonActions()
  }


  function getBreadcrumbSegments(): BreadcrumbSegment[] {
    const segments: BreadcrumbSegment[] = [{ label: 'Dashboard', icon: 'home' }]

    if (!isAuthenticated || !activeModuleId) {
      segments.push({ label: 'Domov' })
      return segments
    }

    const activeModule = modules.find((m) => m.id === activeModuleId)
    if (!activeModule) {
      segments.push({ label: 'Domov' })
      return segments
    }

    segments.push({ label: activeModule.label, icon: activeModule.icon })

    const selection = activeSelection
    
    // Pokud má modul SECTIONS (např. Nastavení):
    if (selection?.sectionId && activeModule.sections?.length) {
      const section = activeModule.sections.find((s) => s.id === selection.sectionId)
      if (section) {
        segments.push({ label: section.label, icon: section.icon })
      }
    }

    // Zobrazit tile pokud existuje
    if (selection?.tileId && activeModule.tiles?.length) {
      // Najít tile - může být parent nebo child
      let tile = activeModule.tiles.find((t) => t.id === selection.tileId)
      let parentTile = null
      
      // Pokud tile nebyl nalezen na první úrovni, hledat v children
      if (!tile) {
        for (const t of activeModule.tiles) {
          if (t.children) {
            const childTile = t.children.find((c) => c.id === selection.tileId)
            if (childTile) {
              parentTile = t
              tile = childTile
              break
            }
          }
        }
      }
      
      // Pokud je to child tile, přidat nejdřív parent
      if (parentTile) {
        segments.push({ label: parentTile.label, icon: parentTile.icon })
      }
      
      // Přidat samotný tile
      if (tile) {
        segments.push({ label: tile.label, icon: tile.icon })
      }
    }

    return segments
  }

  function renderContent() {
    if (authLoading) {
      return (
        <div className="content content--center">
          <SkeletonCentered message="Kontroluji přihlášení…" />
        </div>
      )
    }

    if (!isAuthenticated) {
      return (
        <div className="content content--center">
          <LoginPanel />
        </div>
      )
    }

    if (modulesLoading) {
      return (
        <div className="content content--center">
          <SkeletonCentered message="Načítám moduly aplikace…" />
        </div>
      )
    }

    if (!modules.length) {
      return (
        <div className="content content--center">
          <p>
            Nebyly nalezeny žádné moduly. Zkontroluj prosím soubor <code>modules.index.js</code>.
          </p>
        </div>
      )
    }

    if (!activeModuleId) {
      return (
        <div className="content">
          <h2>Dashboard</h2>
          <p>Vyber modul v menu.</p>
        </div>
      )
    }

    const activeModule = modules.find((m) => m.id === activeModuleId)
    if (!activeModule) {
      return (
        <div className="content">
          <h2>Neznámý modul</h2>
          <p>
            Aktivní modul <code>{activeModuleId}</code> nebyl nalezen.
          </p>
        </div>
      )
    }

    const selection = activeSelection
    if (!selection || (!selection.sectionId && !selection.tileId)) {
      const title = activeModule.introTitle ?? activeModule.label
      const description = activeModule.introText ?? 'Vyber položku v menu.'
      return (
        <div className="tile-layout">
          <div className="tile-layout__header">
            <h1 className="tile-layout__title">{title}</h1>
            {description && <p className="tile-layout__description">{description}</p>}
          </div>
        </div>
      )
    }

    if (selection.sectionId && !selection.tileId) {
      const section = activeModule.sections?.find((s) => s.id === selection.sectionId)
      const title = section?.introTitle ?? section?.label ?? activeModule.label
      const description = section?.introText ?? 'Vyber konkrétní položku v menu.'
      return (
        <div className="tile-layout">
          <div className="tile-layout__header">
            <h1 className="tile-layout__title">{title}</h1>
            {description && <p className="tile-layout__description">{description}</p>}
          </div>
        </div>
      )
    }

    if (selection.tileId && activeModule.tiles?.length) {
      // Rekurzivní vyhledávání včetně children
      const findTileRecursive = (tiles: any[], id: string): any | null => {
        for (const t of tiles) {
          if (t.id === id) return t
          if (t.children?.length) {
            const found = findTileRecursive(t.children, id)
            if (found) return found
          }
        }
        return null
      }
      
      const tile = findTileRecursive(activeModule.tiles, selection.tileId)
      if (tile) {
        const TileComponent = tile.component
        if (!TileComponent) {
          console.error('❌ AppShell: Tile nemá component!', tile)
          return (
            <div className="tile-layout">
              <div className="tile-layout__header">
                <h1 className="tile-layout__title">{tile.label}</h1>
                <p className="tile-layout__description">Tento tile nemá nakonfigurovanou komponentu.</p>
              </div>
            </div>
          )
        }
        return (
          <div className="content">
            <section className="content__section" aria-label={tile.label}>
              <TileComponent
                key={`${selection.tileId}-${tileRenderKey}`}
                onRegisterCommonActions={registerCommonActions}
                onRegisterCommonActionsState={registerCommonActionsUi}
                onRegisterCommonActionHandler={registerCommonActionHandler}
                onNavigate={(tileId: string) => {
                  // Naviguj na jiný tile v rámci stejného modulu
                  handleModuleSelect({ moduleId: selection.moduleId, tileId })
                  // ✅ Zavři Sidebar přehledy (sbalit modul) při navigaci
                  // Toto umožní čistou navigaci list → create bez otevřených filtrů
                  if (typeof window !== 'undefined') {
                    // Force Sidebar collapse po navigaci (příští render)
                    setTimeout(() => {
                      // URL update už proběhl v handleModuleSelect, jen necháme Sidebar se syncnout
                    }, 0)
                  }
                }}
              />
            </section>
          </div>
        )
      } else {
        console.error('❌ AppShell: Tile s id', selection.tileId, 'nebyl nalezen v modulu', activeModule.label)
      }
    }

    return (
      <div className="tile-layout">
        <div className="tile-layout__header">
          <h1 className="tile-layout__title">{activeModule.label}</h1>
          <p className="tile-layout__description">Modul nemá nakonfigurované tiles.</p>
        </div>
      </div>
    )
  }

  function handleCommonActionClick(id: CommonActionId) {
    if (id === 'save') {
      commonActionHandler?.(id)
      return
    }
    if (!confirmIfDirty()) return
    commonActionHandler?.(id)
  }

  const hasUnsavedChanges =
    commonActionsUi.isDirty && (commonActionsUi.viewMode === 'edit' || commonActionsUi.viewMode === 'create')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = (e: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [hasUnsavedChanges])

  return (
    <div className="layout">
      {menuLayout === 'sidebar' && (
        <aside className="layout__sidebar">
          <HomeButton disabled={!isAuthenticated} onClick={handleHomeClick} />
          <Sidebar
            disabled={!isAuthenticated}
            activeModuleId={activeModuleId ?? undefined}
            activeSelection={activeSelection ?? undefined}
            hasUnsavedChanges={hasUnsavedChanges}
            onModuleSelect={handleModuleSelect}
          />
        </aside>
      )}

      <header className="layout__topbar">
        <div className="layout__topbar-inner">
          <div className="layout__topbar-left">
            {menuLayout === 'top' && <HomeButton disabled={!isAuthenticated} onClick={handleHomeClick} />}
            <Breadcrumbs disabled={!isAuthenticated} segments={getBreadcrumbSegments()} />
          </div>

          <div className="layout__topbar-right">
            <HomeActions
              disabled={!isAuthenticated}
              onLogout={handleLogout}
              displayName={displayName}
              onProfileClick={() => {
                handleModuleSelect({ moduleId: '020-muj-ucet' })
              }}
            />
          </div>
        </div>
      </header>

      {menuLayout === 'top' && (
        <div className="layout__nav">
          <TopMenu
            modules={modules.map((m) => ({
              id: m.id,
              label: m.label,
              enabled: m.enabled,
              icon: m.icon,
              hasChildren: !!(m.sections?.length || m.tiles?.length),
              sections: (m.sections ?? []).map((s) => ({
                id: s.id,
                label: s.label ?? s.id,
                icon: s.icon ?? null,
              })),
              tiles: (m.tiles ?? []).map((t) => ({
                id: t.id,
                label: t.label ?? t.id,
                icon: t.icon ?? null,
                sectionId: t.sectionId ?? null,
                children: (t.children ?? []).map((c) => ({
                  id: c.id,
                  label: c.label ?? c.id,
                  icon: c.icon ?? null,
                })),
              })),
            }))}
            activeModuleId={activeModuleId ?? undefined}
            activeSectionId={activeSelection?.sectionId ?? null}
            activeTileId={activeSelection?.tileId ?? null}
            onSelectModule={(id) => handleModuleSelect({ moduleId: id })}
            onSelectSection={(sectionId) => {
              const moduleId = activeModuleId ?? activeSelection?.moduleId
              if (!moduleId) return
              handleModuleSelect({ moduleId, sectionId })
            }}
            onSelectTile={(tileId) => {
              const moduleId = activeModuleId ?? activeSelection?.moduleId
              if (!moduleId) return
              handleModuleSelect({ moduleId, tileId })
            }}
          />
        </div>
      )}

      <div className="layout__context">
        <CommonActions
          disabled={!isAuthenticated}
          actions={commonActions}
          ui={commonActionsUi}
          onActionClick={handleCommonActionClick}
        />
      </div>

      <main className="layout__content">
        <ErrorBoundary>
          {renderContent()}
        </ErrorBoundary>
      </main>
    </div>
  )
}
