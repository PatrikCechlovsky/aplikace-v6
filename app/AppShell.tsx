'use client'

/*
 * FILE: app/AppShell.tsx
 * PURPOSE: Hlavní shell aplikace – layout (6 bloků), autentizace, moduly
 */
/* ============================
   UI COMPONENT STYLES (ACTIVE + TODO)
=============================== */

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

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import HomeButton from '@/app/UI/HomeButton'
import Sidebar, { type SidebarSelection } from '@/app/UI/Sidebar'
import Breadcrumbs, { type BreadcrumbSegment } from '@/app/UI/Breadcrumbs'
import HomeActions from '@/app/UI/HomeActions'
import LoginPanel from '@/app/UI/LoginPanel'
import {
  applyThemeToLayout,
  loadThemeFromLocalStorage,
} from '@/app/lib/themeSettings'

import {
  applyIconDisplayToLayout,
  loadIconDisplayFromLocalStorage,
} from '@/app/lib/iconDisplaySettings'

import { uiConfig } from '@/app/lib/uiConfig'
import {
  getCurrentSession,
  onAuthStateChange,
  logout,
} from '@/app/lib/services/auth'
import { MODULE_SOURCES } from '@/app/modules.index'
import type { IconKey } from '@/app/UI/icons'

// 🔹 NOVĚ: horní lišta modulů (Excel styl)
import { TopMenu } from '@/app/UI/TopMenu'
import CommonActions from '@/app/UI/CommonActions'
import type { CommonActionId } from '@/app/UI/CommonActions'

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

type CommonActionsInput = CommonActionId[]

type CommonActionsState = {
  hasSelection: boolean
  isDirty: boolean
}

// 🔹 typ layoutu menu – boď sidebar vlevo, nebo horní lišta
type MenuLayout = 'sidebar' | 'top'

export default function AppShell({ initialModuleId = null }: AppShellProps) {
  const router = useRouter()

  // 🔐 Stav autentizace
  const [authLoading, setAuthLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<SessionUser | null>(null)
  const displayName = user?.displayName || user?.email || 'Uživatel'

  // 📦 Moduly a aktivní modul
  const [modules, setModules] = useState<ModuleConfig[]>([])
  const [modulesLoading, setModulesLoading] = useState(true)
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null)
  if (typeof window !== 'undefined') {
    ;(window as any).__modules = modules
  }

  // 📌 Výběr v sidebaru (nebo v TopMenu – používají stejný typ)
  const [activeSelection, setActiveSelection] =
    useState<SidebarSelection | null>(null)

  const [hasUnsavedChanges] = useState(false)

  // 🔹 Výchozí: sidebar vlevo, dokud si uživatel nezvolí jinak
  const [menuLayout, setMenuLayout] = useState<MenuLayout>('sidebar')

  // 🔹 Načtení preferovaného layoutu z localStorage (per-user)
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

  // 🔘 Common actions – dynamicky registruje aktuální tile
  const [commonActions, setCommonActions] = useState<
    CommonActionsInput | undefined
  >(undefined)

  // ✅ NOVĚ: dynamický state pro disabled podmínky
  const [commonActionsState, setCommonActionsState] = useState<CommonActionsState>({
    hasSelection: false,
    isDirty: false,
  })

  // ✅ NOVĚ: handler kliknutí na akce – registruje aktuální tile
  const [commonActionHandler, setCommonActionHandler] = useState<
    ((id: CommonActionId) => void) | undefined
  >(undefined)

  // 🎨 Při mountu aplikace nastavíme theme z localStorage
  useEffect(() => {
    const themeSettings = loadThemeFromLocalStorage()
    applyThemeToLayout(themeSettings)

    const iconSettings = loadIconDisplayFromLocalStorage()
    applyIconDisplayToLayout(iconSettings)
  }, [])

  // TABLE VIEW MODE – přidáme .view-table nebo .view-cards
  useEffect(() => {
    if (typeof document === 'undefined') return

    try {
      const raw = window.localStorage.getItem('app-view-settings')
      if (!raw) return
      const parsed = JSON.parse(raw)

      const viewMode = parsed.viewMode || 'cards'
      const layoutEl = document.querySelector('.layout')
      if (!layoutEl) return

      layoutEl.classList.toggle('view-table', viewMode === 'table')
      layoutEl.classList.toggle('view-cards', viewMode === 'cards')
    } catch (err) {
      console.error('Error loading viewMode:', err)
    }
  }, [])

  // 🔐 Načtení session
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
            email: session.user.email,
            displayName: meta.display_name ?? meta.full_name ?? meta.name ?? null,
          })
        } else {
          setIsAuthenticated(false)
          setUser(null)
          setActiveModuleId(null)
          setActiveSelection(null)
          setCommonActions(undefined)
          setCommonActionHandler(undefined)
          setCommonActionsState({ hasSelection: false, isDirty: false })
        }

        const { data: sub } = onAuthStateChange((event: string, session: any) => {
          console.log('[auth] event', event, session)

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
            setCommonActions(undefined)
            setCommonActionHandler(undefined)
            setCommonActionsState({ hasSelection: false, isDirty: false })
          }
        })

        unsubscribe = sub?.subscription?.unsubscribe
      } catch (err) {
        console.error('Chyba při načítání session:', err)
        setIsAuthenticated(false)
        setUser(null)
        setActiveModuleId(null)
        setActiveSelection(null)
        setCommonActions(undefined)
        setCommonActionHandler(undefined)
        setCommonActionsState({ hasSelection: false, isDirty: false })
      } finally {
        setAuthLoading(false)
      }
    }

    initAuth()

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  // 📦 Načtení modulů
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
  }, [])

  // 🧭 Nastavení počátečního modulu
  useEffect(() => {
    if (!isAuthenticated) return
    if (!modules.length) return
    if (activeModuleId) return

    if (initialModuleId && modules.some((m) => m.id === initialModuleId)) {
      setActiveModuleId(initialModuleId)
      setActiveSelection({ moduleId: initialModuleId })
    }
  }, [isAuthenticated, modules, activeModuleId, initialModuleId])

  // 🧹 Když nemáme vybraný tile, smažeme commonActions i handler i state
  useEffect(() => {
    if (!activeSelection?.tileId) {
      setCommonActions(undefined)
      setCommonActionHandler(undefined)
      setCommonActionsState({ hasSelection: false, isDirty: false })
    }
  }, [activeSelection?.tileId])

  // 🚪 Logout
  async function handleLogout() {
    await logout()
    setIsAuthenticated(false)
    setUser(null)
    setActiveModuleId(null)
    setActiveSelection(null)
    setCommonActions(undefined)
    setCommonActionHandler(undefined)
    setCommonActionsState({ hasSelection: false, isDirty: false })
    router.push('/')
  }

  // Sidebar / TopMenu klik
  function handleModuleSelect(selection: SidebarSelection) {
    setActiveModuleId(selection.moduleId)
    setActiveSelection(selection)
    setCommonActions(undefined)
    setCommonActionHandler(undefined)
    setCommonActionsState({ hasSelection: false, isDirty: false })
  }

  // 🏠 Home button
  function handleHomeClick() {
    if (!isAuthenticated) return

    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(
        'Máš neuložené změny. Opravdu chceš odejít na úvodní stránku?',
      )
      if (!confirmLeave) return
    }

    setActiveModuleId(null)
    setActiveSelection(null)
    setCommonActions(undefined)
    setCommonActionHandler(undefined)
    setCommonActionsState({ hasSelection: false, isDirty: false })
    router.push('/')
  }

  // 🔁 Nouzové tlačítko: rychlé přepnutí zpět na sidebar
  function forceSidebarLayout() {
    setMenuLayout('sidebar')

    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem('app-view-settings')
        const parsed = raw ? JSON.parse(raw) : {}
        const next = { ...parsed, menuLayout: 'sidebar' }
        window.localStorage.setItem('app-view-settings', JSON.stringify(next))
      } catch {
        // ignore
      }
    }
  }

  // 🧭 Breadcrumbs
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

  // 🧩 Hlavní obsah
  function renderContent() {
    if (authLoading) {
      return (
        <div className="content content--center">
          <p>Kontroluji přihlášení…</p>
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
          <p>Načítám moduly aplikace…</p>
        </div>
      )
    }

    if (!modules.length) {
      return (
        <div className="content content--center">
          <p>
            Nebyly nalezeny žádné moduly. Zkontroluj prosím soubor{' '}
            <code>modules.index.js</code>.
          </p>
        </div>
      )
    }

    if (!activeModuleId) {
      return (
        <div className="content">
          <h2>Dashboard</h2>
          <p>
            Vyber modul v levém menu nebo v horní liště. Po kliknutí se tady zobrazí jeho obsah.
          </p>
        </div>
      )
    }

    const activeModule = modules.find((m) => m.id === activeModuleId)

    if (!activeModule) {
      return (
        <div className="content">
          <h2>Neznámý modul</h2>
          <p>
            Aktivní modul s ID <code>{activeModuleId}</code> nebyl nalezen v konfiguraci.
          </p>
        </div>
      )
    }

    const selection = activeSelection

    if (!selection || (!selection.sectionId && !selection.tileId)) {
      return (
        <div className="content">
          <h2>{activeModule.introTitle ?? activeModule.label}</h2>
          <p>
            {activeModule.introText ??
              'Vlevo nebo nahoře vyber konkrétní oblast, kterou chceš v tomto modulu zobrazit nebo upravit.'}
          </p>
        </div>
      )
    }

    if (selection.sectionId && !selection.tileId) {
      const section = activeModule.sections?.find((s) => s.id === selection.sectionId)

      const title = section?.introTitle ?? section?.label ?? activeModule.label
      const text =
        section?.introText ??
        'Vyber konkrétní položku v levém menu / horní liště, kterou chceš upravit.'

      return (
        <div className="content">
          <h2>{activeModule.label}</h2>
          <section className="content__section">
            <h3 className="content__section-title">{title}</h3>
            <p>{text}</p>
          </section>
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
                onRegisterCommonActions={setCommonActions}
                onRegisterCommonActionsState={setCommonActionsState}
                onRegisterCommonActionHandler={setCommonActionHandler}
              />
            </section>
          </div>
        )
      }
    }

    if (activeModule.tiles && activeModule.tiles.length > 0) {
      return (
        <div className="content">
          <h2>{activeModule.label}</h2>
          <div className="content__tiles">
            {activeModule.tiles.map((tile) => {
              const TileComponent = tile.component
              return (
                <section key={tile.id} className="content__section" aria-label={tile.label}>
                  <h3 className="content__section-title">{tile.label}</h3>
                  <TileComponent />
                </section>
              )
            })}
          </div>
        </div>
      )
    }

    return (
      <div className="content">
        <h2>{activeModule.label}</h2>
        <p>
          Tento modul zatím nemá nakonfigurované žádné dlaždice ani formuláře. Přidej je do{' '}
          <code>{activeModule.id}/module.config.js</code>.
        </p>
      </div>
    )
  }

  // 🧱 Layout
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
            {menuLayout === 'top' && (
              <HomeButton disabled={!isAuthenticated} onClick={handleHomeClick} />
            )}

            <Breadcrumbs disabled={!isAuthenticated} segments={getBreadcrumbSegments()} />
          </div>

          <div className="layout__topbar-right">
            <HomeActions
              disabled={!isAuthenticated}
              onLogout={handleLogout}
              displayName={displayName}
              onForceSidebar={forceSidebarLayout}
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

      {/* CommonActions: vždy vlastní řádek nad obsahem (v obou režimech) */}
      <div className="layout__context">
        <CommonActions
          disabled={!isAuthenticated}
          actions={commonActions}
          hasSelection={commonActionsState.hasSelection}
          isDirty={commonActionsState.isDirty}
          onActionClick={(id) => commonActionHandler?.(id)}
        />
      </div>

      <main className="layout__content">{renderContent()}</main>
    </div>
  )
}
