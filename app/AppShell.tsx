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

  // URL state (MVP): /modules/010?m=010&s=...&t=...
  const urlState = useMemo(() => {
    const m = searchParams?.get('m')
    const s = searchParams?.get('s')
    const t = searchParams?.get('t')
    return {
      moduleId: m && m.trim() ? m.trim() : null,
      sectionId: s && s.trim() ? s.trim() : null,
      tileId: t && t.trim() ? t.trim() : null,
    }
  }, [searchParams])

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

      setOrDelete('m', next.moduleId ?? null)
      setOrDelete('s', next.sectionId ?? null)
      setOrDelete('t', next.tileId ?? null)

      const qs = sp.toString()
      const basePath = next.moduleId ? `/modules/${next.moduleId}` : '/'
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
    setCommonActions(actions)
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
          const modModule: any = await loader()
          const cfg: any = modModule.default
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
      setActiveModuleId(urlState.moduleId)
      setActiveSelection({
        moduleId: urlState.moduleId,
        sectionId: urlState.sectionId ?? undefined,
        tileId: urlState.tileId ?? undefined,
      })
      resetCommonActions()
    }

    // 2) Fallback (legacy)
    if (initialModuleId && modules.some((m) => m.id === initialModuleId)) {
      setActiveModuleId(initialModuleId)
      setActiveSelection({ moduleId: initialModuleId })
      resetCommonActions()
      // legacy init – OK to drop unknown params
      setUrlState({ moduleId: initialModuleId, sectionId: null, tileId: null }, 'replace', false)
    }
  }, [isAuthenticated, modules, activeModuleId, initialModuleId, urlState.moduleId, urlState.sectionId, urlState.tileId])

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

    const differs =
      current.moduleId !== target.moduleId || current.sectionId !== target.sectionId || current.tileId !== target.tileId
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

    if (!target.moduleId) {
      setActiveModuleId(null)
      setActiveSelection(null)
      resetCommonActions()
      return
    }

    if (!modules.some((m) => m.id === target.moduleId)) return
    setActiveModuleId(target.moduleId)
    setActiveSelection({
      moduleId: target.moduleId,
      sectionId: target.sectionId ?? undefined,
      tileId: target.tileId ?? undefined,
    })

    if ((activeSelection?.tileId ?? null) !== (target.tileId ?? null)) resetCommonActions()
  }, [activeSelection, isAuthenticated, modules, modulesLoading, setUrlState, urlState.moduleId, urlState.sectionId, urlState.tileId])

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
    const sameSelection =
      activeSelection?.moduleId === selection.moduleId &&
      (activeSelection?.sectionId ?? null) === (selection.sectionId ?? null) &&
      (activeSelection?.tileId ?? null) === (selection.tileId ?? null)

    // ✅ FIX: Pokud je stejná selection, ale máme otevřený detail (tile-specifické parametry),
    // zavřeme detail a otevřeme seznam
    if (sameSelection) {
      const id = searchParams?.get('id')
      const vm = searchParams?.get('vm')
      const t = searchParams?.get('t')
      // Zkontroluj, jestli máme tile-specifické parametry (id nebo vm, nebo t jiné než users-list)
      const hasTileSpecificParams = id || vm || (t && t !== 'users-list')
      if (hasTileSpecificParams) {
        // Zavřeme detail - zahoďme tile-specifické parametry
        // Použijeme keepOtherParams=false, což zahodí všechny parametry kromě m/s/t
        setUrlState(
          {
            moduleId: selection.moduleId,
            sectionId: selection.sectionId ?? null,
            tileId: selection.tileId ?? null,
          },
          'replace',
          false // keepOtherParams=false znamená zahodit tile-specifické parametry (id/vm/am/t)
        )
        resetCommonActions()
      }
      return
    }

    if (!confirmIfDirty()) return

    // ✅ AUTO-SELECT: Pokud není vybrán tile, ale modul má tiles, automaticky vyber první
    let finalSelection = { ...selection }
    if (!selection.tileId && !selection.sectionId) {
      const targetModule = modules.find(m => m.id === selection.moduleId)
      if (targetModule?.tiles && targetModule.tiles.length > 0) {
        const firstTile = targetModule.tiles.find(t => t.component) || targetModule.tiles[0]
        if (firstTile) {
          finalSelection.tileId = firstTile.id
        }
      }
    }

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
    if (selection?.sectionId && activeModule.sections?.length) {
      const section = activeModule.sections.find((s) => s.id === selection.sectionId)
      if (section) segments.push({ label: section.label, icon: section.icon })
    }

    if (selection?.tileId && activeModule.tiles?.length) {
      const tile = activeModule.tiles.find((t) => t.id === selection.tileId)
      if (tile) segments.push({ label: tile.label, icon: tile.icon })
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
      const tile = activeModule.tiles.find((t) => t.id === selection.tileId)
      if (tile) {
        const TileComponent = tile.component
        return (
          <div className="content">
            <section className="content__section" aria-label={tile.label}>
              <TileComponent
                onRegisterCommonActions={registerCommonActions}
                onRegisterCommonActionsState={registerCommonActionsUi}
                onRegisterCommonActionHandler={registerCommonActionHandler}
              />
            </section>
          </div>
        )
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
