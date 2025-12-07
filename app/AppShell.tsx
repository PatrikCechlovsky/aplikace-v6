'use client'

/*
 * FILE: app/AppShell.tsx
 * PURPOSE: Hlavní shell aplikace – layout (6 bloků), autentizace, moduly
 */
'use client'

import { useEffect } from 'react'
import { applyThemeToLayout, loadThemeFromLocalStorage } from '@/app/lib/themeSettings'

export default function AppShell(/* props */) {
  useEffect(() => {
    // při mountu aplikace nastavit theme z localStorage
    const settings = loadThemeFromLocalStorage()
    applyThemeToLayout(settings)
  }, [])

  return (
    <div className="layout">
      {/* sidebar, topbar, obsah… */}
    </div>
  )
}


import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import HomeButton from '@/app/UI/HomeButton'
import Sidebar, { type SidebarSelection } from '@/app/UI/Sidebar'
import Breadcrumbs, {
  type BreadcrumbSegment,
} from '@/app/UI/Breadcrumbs'
import HomeActions from '@/app/UI/HomeActions'
import CommonActions from '@/app/UI/CommonActions'
import LoginPanel from '@/app/UI/LoginPanel'

import { uiConfig } from '@/app/lib/uiConfig'
import {
  getCurrentSession,
  onAuthStateChange,
  logout,
} from '@/app/lib/services/auth'

import { MODULE_SOURCES } from '@/app/modules.index'
import type { IconKey } from '@/app/UI/icons'

type SessionUser = {
  email?: string | null
  displayName?: string | null
}

type ModuleTileConfig = {
  id: string
  label: string
  component: React.ComponentType<any>
  icon?: IconKey
  // volitelně: do jaké sekce tile patří (použije Sidebar)
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

  // 📌 Výběr v sidebaru
  const [activeSelection, setActiveSelection] =
    useState<SidebarSelection | null>(null)

  const [hasUnsavedChanges] = useState(false)

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
            displayName:
              meta.display_name ??
              meta.full_name ??
              meta.name ??
              null,
          })
        } else {
          setIsAuthenticated(false)
          setUser(null)
          setActiveModuleId(null)
          setActiveSelection(null)
        }

        const { data: sub } = onAuthStateChange(
          (event: string, session: any) => {
            console.log('[auth] event', event, session)

            if (session?.user) {
              const meta = session.user.user_metadata || {}
              setIsAuthenticated(true)
              setUser({
                email: session.user.email,
                displayName:
                  meta.display_name ??
                  meta.full_name ??
                  meta.name ??
                  null,
              })
            } else {
              setIsAuthenticated(false)
              setUser(null)
              setActiveModuleId(null)
              setActiveSelection(null)
            }
          },
        )

        unsubscribe = sub?.subscription?.unsubscribe
      } catch (err) {
        console.error('Chyba při načítání session:', err)
        setIsAuthenticated(false)
        setUser(null)
        setActiveModuleId(null)
        setActiveSelection(null)
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

  // 🧭 Nastavení počátečního modulu (pouze pokud je v URL)
  useEffect(() => {
    if (!isAuthenticated) return
    if (!modules.length) return
    if (activeModuleId) return

    if (initialModuleId && modules.some((m) => m.id === initialModuleId)) {
      setActiveModuleId(initialModuleId)
      setActiveSelection({ moduleId: initialModuleId })
    }
    // jinak Dashboard / Domov
  }, [isAuthenticated, modules, activeModuleId, initialModuleId])

  // 🚪 Logout
  async function handleLogout() {
    await logout()
    setIsAuthenticated(false)
    setUser(null)
    setActiveModuleId(null)
    setActiveSelection(null)
    router.push('/')
  }

  // Sidebar klik
  function handleModuleSelect(selection: SidebarSelection) {
    setActiveModuleId(selection.moduleId)
    setActiveSelection(selection)
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
    router.push('/')
  }

  // 🧭 Breadcrumbs – generické podle module.sections + tiles
  function getBreadcrumbSegments(): BreadcrumbSegment[] {
    const segments: BreadcrumbSegment[] = [
      { label: 'Dashboard', icon: 'home' },
    ]

    if (!isAuthenticated || !activeModuleId) {
      segments.push({ label: 'Domov' })
      return segments
    }

    const activeModule = modules.find((m) => m.id === activeModuleId)
    if (!activeModule) {
      segments.push({ label: 'Domov' })
      return segments
    }

    // Modul
    segments.push({
      label: activeModule.label,
      icon: activeModule.icon,
    })

    const selection = activeSelection

    // Sekce (pokud modul nějaké má)
    if (selection?.sectionId && activeModule.sections?.length) {
      const section = activeModule.sections.find(
        (s) => s.id === selection.sectionId,
      )
      if (section) {
        segments.push({
          label: section.label,
          icon: section.icon,
        })
      }
    }

    // Tile (konkrétní obrazovka)
    if (selection?.tileId && activeModule.tiles?.length) {
      const tile = activeModule.tiles.find(
        (t) => t.id === selection.tileId,
      )
      if (tile) {
        segments.push({
          label: tile.label,
          icon: tile.icon,
        })
      }
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

    // Dashboard (bez vybraného modulu)
    if (!activeModuleId) {
      return (
        <div className="content">
          <h2>Dashboard</h2>
          <p>
            Vyber modul v levém menu. Po kliknutí se tady zobrazí jeho
            obsah.
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
            Aktivní modul s ID <code>{activeModuleId}</code> nebyl nalezen v
            konfiguraci. Zkontroluj <code>module.config.js</code>.
          </p>
        </div>
      )
    }

    const selection = activeSelection

    // 1) Vybraný jen modul – zobrazíme úvod modulu (introTitle/introText)
    if (!selection || (!selection.sectionId && !selection.tileId)) {
      return (
        <div className="content">
          <h2>{activeModule.introTitle ?? activeModule.label}</h2>
          <p>
            {activeModule.introText ??
              'Vlevo vyber konkrétní oblast, kterou chceš v tomto modulu zobrazit nebo upravit.'}
          </p>
        </div>
      )
    }

    // 2) Vybraná sekce, ale žádný tile → úvod sekce
    if (selection.sectionId && !selection.tileId) {
      const section = activeModule.sections?.find(
        (s) => s.id === selection.sectionId,
      )

      const title =
        section?.introTitle ?? section?.label ?? activeModule.label
      const text =
        section?.introText ??
        'Vyber konkrétní položku v levém menu, kterou chceš upravit.'

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

    // 3) Vybraný konkrétní tile
    if (selection.tileId && activeModule.tiles?.length) {
      const tile = activeModule.tiles.find(
        (t) => t.id === selection.tileId,
      )

      if (tile) {
        const TileComponent = tile.component

        return (
          <div className="content">
            <section
              className="content__section"
              aria-label={tile.label}
            >
              <TileComponent />
            </section>
          </div>
        )
      }
    }

    // 4) Výchozí chování – zobrazit všechny tiles modulu
    if (activeModule.tiles && activeModule.tiles.length > 0) {
      return (
        <div className="content">
          <h2>{activeModule.label}</h2>
          <div className="content__tiles">
            {activeModule.tiles.map((tile) => {
              const TileComponent = tile.component
              return (
                <section
                  key={tile.id}
                  className="content__section"
                  aria-label={tile.label}
                >
                  <h3 className="content__section-title">
                    {tile.label}
                  </h3>
                  <TileComponent />
                </section>
              )
            })}
          </div>
        </div>
      )
    }

    // 5) Modul bez tiles
    return (
      <div className="content">
        <h2>{activeModule.label}</h2>
        <p>
          Tento modul zatím nemá nakonfigurované žádné dlaždice ani formuláře.
          Přidej je do <code>{activeModule.id}/module.config.js</code> (pole{' '}
          <code>tiles</code>, <code>overview</code>, <code>detail</code>).
        </p>
      </div>
    )
  }

  // 🧱 Layout
  return (
    <div className={`layout theme-${uiConfig.theme}`}>
      <aside className="layout__sidebar">
        <HomeButton
          disabled={!isAuthenticated}
          onClick={handleHomeClick}
        />

        <Sidebar
          disabled={!isAuthenticated}
          activeModuleId={activeModuleId ?? undefined}
          activeSelection={activeSelection ?? undefined}
          hasUnsavedChanges={hasUnsavedChanges}
          onModuleSelect={handleModuleSelect}
        />
      </aside>

      <header className="layout__topbar">
        <div className="layout__topbar-inner">
          <div className="layout__topbar-left">
            <Breadcrumbs
              disabled={!isAuthenticated}
              segments={getBreadcrumbSegments()}
            />
          </div>

          <div className="layout__topbar-right">
            <HomeActions
              disabled={!isAuthenticated}
              onLogout={handleLogout}
              displayName={displayName}
            />
          </div>
        </div>
      </header>

      <div className="layout__actions">
        <CommonActions disabled={!isAuthenticated} />
      </div>

      <main className="layout__content">{renderContent()}</main>
    </div>
  )
}
