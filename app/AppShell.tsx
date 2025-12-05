'use client'

/*
 * FILE: app/AppShell.tsx
 * PURPOSE: Hlavní shell aplikace – layout (6 bloků), autentizace, moduly
 */

import { useEffect, useState } from 'react'

import HomeButton from '@/app/UI/HomeButton'
import Sidebar, { type SidebarSelection } from '@/app/UI/Sidebar'
import Breadcrumbs from '@/app/UI/Breadcrumbs'
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

// Minimalistická podoba konfigurace modulu pro potřeby shellu
type ModuleTileConfig = {
  id: string
  label: string
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

type AppShellProps = {
  /**
   * Počáteční modul, pokud přichází z URL (/modules/[moduleId]).
   * Pokud je neplatný, použije se první modul.
   */
  initialModuleId?: string | null
}

export default function AppShell({ initialModuleId = null }: AppShellProps) {
  // 🔐 Stav autentizace
  const [authLoading, setAuthLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<SessionUser | null>(null)
  const displayName = user?.displayName || user?.email || 'Uživatel'

  // 📦 Moduly a aktivní modul
  const [modules, setModules] = useState<ModuleConfig[]>([])
  const [modulesLoading, setModulesLoading] = useState(true)
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null)

  // 📌 Globální výběr v sidebaru (modul / sekce / tile)
  const [activeSelection, setActiveSelection] =
    useState<SidebarSelection | null>(null)

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
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  // 2) Načtení modulů přes MODULE_SOURCES
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

    // preferuj initialModuleId, pokud existuje
    let targetId: string | null = null

    if (initialModuleId && modules.some((m) => m.id === initialModuleId)) {
      targetId = initialModuleId
    } else {
      targetId = modules[0].id
    }

    if (targetId) {
      setActiveModuleId(targetId)
      setActiveSelection({ moduleId: targetId })
    }
  }, [isAuthenticated, modules, activeModuleId, initialModuleId])

  // 🚪 Odhlášení
  async function handleLogout() {
    await logout()
    setIsAuthenticated(false)
    setUser(null)
    setActiveModuleId(null)
    setActiveSelection(null)
  }

  // Klik v Sidebaru → změna aktivního modulu / sekce / tile
  function handleModuleSelect(selection: SidebarSelection) {
    setActiveModuleId(selection.moduleId)
    setActiveSelection(selection)
  }

  // Klik na HomeButton → návrat na dashboard
  function handleHomeClick() {
    if (!isAuthenticated) return
    setActiveModuleId(null)
    setActiveSelection(null)
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
          <p>
            Nebyly nalezeny žádné moduly. Zkontroluj prosím soubor{' '}
            <code>modules.index.js</code>.
          </p>
        </div>
      )
    }

    // 5) Není vybraný modul → zobrazíme dashboard
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

    // 🎯 Speciální chování pro modul 900-nastaveni – text podle úrovně výběru
    if (activeModule.id === '900-nastaveni') {
      // 1) Kliknuto jen na modul „Nastavení“
      if (
        !selection ||
        selection.moduleId !== '900-nastaveni' ||
        (!selection.sectionId && !selection.tileId)
      ) {
        return (
          <div className="content">
            <h2>{activeModule.label}</h2>
            <p>
              Tento modul slouží k nastavení číselníků, vzhledu a ikon celé
              aplikace. Vlevo vyber konkrétní oblast, kterou chceš upravit.
            </p>
          </div>
        )
      }

      // 2) Vybraná sekce (Nastavení typů / vzhledu / ikon), ale ještě žádný tile
      if (selection.sectionId && !selection.tileId) {
        let title = 'Nastavení'
        let text =
          'Vyber konkrétní položku v levém menu, kterou chceš upravit.'

        if (selection.sectionId === 'types-settings') {
          title = 'Nastavení typů'
          text =
            'Zde najdeš všechny číselníky a předvolby pro výběrová pole (např. typy subjektů, typy smluv, typy majetku…).'
        } else if (selection.sectionId === 'theme-settings') {
          title = 'Nastavení vzhledu'
          text =
            'Tady bude konfigurace vzhledu aplikace – barevná schémata, motivy a layout.'
        } else if (selection.sectionId === 'icon-settings') {
          title = 'Nastavení ikon'
          text =
            'Zde bude mapování ikon a emoji k jednotlivým modulům a akcím.'
        }

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

      // 3) Vybraný konkrétní tile (např. Typy subjektů)
      if (selection.tileId && activeModule.tiles?.length) {
        const tile = activeModule.tiles.find(
          (t) => t.id === selection.tileId,
        )
      
        if (tile) {
          const TileComponent = tile.component
      
          // Nadpis + popis si řeší samotná tile (SubjectTypesTile),
          // tady už nic dalšího nevykreslujeme, aby se to neduplikovalo.
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


    // 🧩 Výchozí chování pro ostatní moduly – zobrazíme všechny tiles
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
          Přidej je do <code>{activeModule.id}/module.config.js</code> (pole{' '}
          <code>tiles</code>, <code>overview</code>, <code>detail</code>).
        </p>
      </div>
    )
  }

  // 🧱 Hlavní layout – 6 bloků podle dokumentace
  return (
    <div className={`layout theme-${uiConfig.theme}`}>
      {/* 1 + 2. Levý sloupec – HomeButton + Sidebar */}
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

      {/* 3 + 4. Horní lišta – vlevo Breadcrumbs, vpravo HomeActions */}
      <header className="layout__topbar">
        <div className="layout__topbar-inner">
          <div className="layout__topbar-left">
            <Breadcrumbs disabled={!isAuthenticated} />
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

      {/* 5. CommonActions – pod breadcrumbs */}
      <div className="layout__actions">
        <CommonActions disabled={!isAuthenticated} />
      </div>

      {/* 6. Content – hlavní plocha */}
      <main className="layout__content">{renderContent()}</main>
    </div>
  )
}
