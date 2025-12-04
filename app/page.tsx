'use client'

/*
 * FILE: app/page.tsx
 * PURPOSE: Hlavní stránka aplikace – layout (6 bloků) + autentizace + vykreslení modulů
 */

import { useEffect, useState } from 'react'

import HomeButton from '@/app/UI/HomeButton'
import Sidebar from '@/app/UI/Sidebar'
import Breadcrumbs from '@/app/UI/Breadcrumbs'
import HomeActions from '@/app/UI/HomeActions'
import CommonActions from '@/app/UI/CommonActions'
import LoginPanel from '@/app/UI/LoginPanel'
import type { SidebarSelection } from '@/app/UI/Sidebar'
import type { BreadcrumbSegment } from '@/app/UI/Breadcrumbs'


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
}

// Minimalistická podoba konfigurace modulu pro potřeby page.tsx
type ModuleTileConfig = {
  id: string
  label: string
  // libovolný React komponent
  component: React.ComponentType<any>
}

type ModuleConfig = {
  id: string
  label: string
  icon?: IconKey
  order?: number
  enabled?: boolean
  tiles?: ModuleTileConfig[]
}

export default function HomePage() {
  // 🔐 Stav autentizace
  const [authLoading, setAuthLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<SessionUser | null>(null)

  // 📦 Moduly a aktivní modul
  const [modules, setModules] = useState<ModuleConfig[]>([])
  const [modulesLoading, setModulesLoading] = useState(true)
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null)
  const [activeSelection, setActiveSelection] = useState<SidebarSelection | null>(null)

  // TODO: globální informace o neuložených změnách – zatím false
  const [hasUnsavedChanges] = useState(false)


  // 1) Načtení session + listener na změny (login/logout)
  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    async function initAuth() {
      try {
        const { data, error } = await getCurrentSession()
        if (error) {
          console.error('getCurrentSession error:', error)
        }

        const session = data?.session ?? null

        if (session?.user) {
          setIsAuthenticated(true)
          setUser({ email: session.user.email })
        } else {
          setIsAuthenticated(false)
          setUser(null)
        }

        // Supabase: callback(event, session)
        const { data: sub } = onAuthStateChange(
          (event: string, session: any) => {
            console.log('[auth] event', event, session)

            if (session?.user) {
              setIsAuthenticated(true)
              setUser({ email: session.user.email })
            } else {
              setIsAuthenticated(false)
              setUser(null)
              setActiveModuleId(null)
            }
          },
        )

        unsubscribe = sub?.subscription?.unsubscribe
      } catch (err) {
        console.error('Chyba při načítání session:', err)
        setIsAuthenticated(false)
        setUser(null)
      } finally {
        setAuthLoading(false)
      }
    }

    initAuth()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  // 2) Načtení modulů přes MODULE_SOURCES (lazy loading podle dokumentace)
  useEffect(() => {
    let cancelled = false

    async function loadModules() {
      try {
        const loaded: ModuleConfig[] = []

        for (const loader of MODULE_SOURCES) {
          const modModule: any = await loader()
          const cfg: ModuleConfig = modModule.default

          if (!cfg?.id) continue
          if (cfg.enabled === false) continue

          loaded.push({
            id: cfg.id,
            label: cfg.label ?? cfg.id,
            icon: cfg.icon,
            order: cfg.order ?? 9999,
            enabled: cfg.enabled ?? true,
            tiles: cfg.tiles ?? [],
          })
        }

        loaded.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

        if (!cancelled) {
          setModules(loaded)
        }
      } catch (err) {
        console.error('Chyba při načítání modulů:', err)
      } finally {
        if (!cancelled) {
          setModulesLoading(false)
        }
      }
    }

    loadModules()

    return () => {
      cancelled = true
    }
  }, [])

  // 3) Po načtení modulů + přihlášení nastavíme výchozí modul
  useEffect(() => {
    if (!isAuthenticated) return
    if (!modules.length) return
    if (activeModuleId) return

    const firstEnabled = modules[0]
    if (firstEnabled) {
      setActiveModuleId(firstEnabled.id)
    }
  }, [isAuthenticated, modules, activeModuleId])

  // 🚪 Odhlášení
  async function handleLogout() {
    await logout()
    setIsAuthenticated(false)
    setUser(null)
    setActiveModuleId(null)
  }

  // Klik v Sidebaru → změna aktivního modulu
  function handleModuleSelect(moduleId: string) {
    setActiveModuleId(moduleId)
  }

  // 🧩 Hlavní obsah (blok 6 – Content)
  function renderContent() {
    // 1) Načítám autentizaci
    if (authLoading) {
      return (
        <div className="content content--center">
          <p>Kontroluji přihlášení…</p>
        </div>
      )
    }

    // 2) Nepřihlášený uživatel → LoginPanel
    if (!isAuthenticated) {
      return (
        <div className="content content--center">
          <LoginPanel />
        </div>
      )
    }

    // 3) Přihlášený, ale ještě se načítají moduly
    if (modulesLoading) {
      return (
        <div className="content content--center">
          <p>Načítám moduly aplikace…</p>
        </div>
      )
    }

    // 4) Nemám žádný modul – chyba konfigurace
    if (!modules.length) {
      return (
        <div className="content content--center">
          <p>Nebyly nalezeny žádné moduly. Zkontroluj prosím soubor <code>modules.index.js</code>.</p>
        </div>
      )
    }

    // 5) Není vybraný modul → zobrazíme dashboard
    if (!activeModuleId) {
      return (
        <div className="content">
          <h2>Dashboard</h2>
          <p>Vyber modul v levém menu. Po kliknutí se tady zobrazí jeho obsah.</p>
        </div>
      )
    }

    const activeModule = modules.find((m) => m.id === activeModuleId)

    if (!activeModule) {
      return (
        <div className="content">
          <h2>Neznámý modul</h2>
          <p>
            Aktivní modul s ID <code>{activeModuleId}</code> nebyl nalezen
            v konfiguraci. Zkontroluj <code>module.config.js</code>.
          </p>
        </div>
      )
    }

    // 6) Pokud má modul definované tiles, vykreslíme je (např. SubjectTypesTile u 900-nastaveni)
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
                  <h3 className="content__section-title">{tile.label}</h3>
                  <TileComponent />
                </section>
              )
            })}
          </div>
        </div>
      )
    }

    // 7) Modul nemá tiles – zatím jen placeholder
    return (
      <div className="content">
        <h2>{activeModule.label}</h2>
        <p>
          Tento modul zatím nemá nakonfigurované žádné dlaždice ani formuláře.
          Přidej je do <code>{activeModule.id}/module.config.js</code> (pole <code>tiles</code>, <code>overview</code>, <code>detail</code>).
        </p>
      </div>
    )
  }

  // 🧱 Hlavní layout – 6 bloků podle dokumentace
  return (
    <div className={`layout theme-${uiConfig.theme}`}>
      {/* 1. HomeButton – vlevo nahoře */}
      <header className="layout__topbar">
        <div className="layout__topbar-inner">
          <HomeButton disabled={!isAuthenticated} />
          <div className="layout__topbar-right">
            <HomeActions
              disabled={!isAuthenticated}
              onLogout={handleLogout}
            />
          </div>
        </div>
      </header>

      {/* 2. Sidebar – levý sloupec */}
      <aside className="layout__sidebar">
        <Sidebar
          disabled={!isAuthenticated}
          activeModuleId={activeModuleId ?? undefined}
          onModuleSelect={handleModuleSelect}
        />
      </aside>

      {/* 3. Breadcrumbs – nad obsahem */}
      <div className="layout__breadcrumbs">
        <Breadcrumbs disabled={!isAuthenticated} />
      </div>

      {/* 4. HomeActions – už je uvnitř topbaru (viz výše) */}

      {/* 5. CommonActions – pod breadcrumbs */}
      <div className="layout__actions">
        <CommonActions disabled={!isAuthenticated} />
      </div>

      {/* 6. Content – hlavní plocha */}
      <main className="layout__content">
        {renderContent()}
      </main>
    </div>
  )
}
