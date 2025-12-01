'use client'

/*
 * FILE: app/page.tsx
 * PURPOSE: Hlavní stránka aplikace – layout + login + přepínání modulů
 */

import { useEffect, useState } from 'react'

import HomeButton from '@/app/UI/HomeButton'
import Sidebar from '@/app/UI/Sidebar'
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

// První napojený formulář v Nastavení
import SubjectTypesTile from '@/app/modules/900-nastaveni/tiles/SubjectTypesTile'

type SessionUser = {
  email?: string | null
}

export default function HomePage() {
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<SessionUser | null>(null)

  const [activeModuleId, setActiveModuleId] = useState<string | null>(null)

  // 1) Načtení session + listener na změny
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

        // ❗ TADY byla chyba – druhý parametr JE session (ne newSession.session)
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
        setLoadingAuth(false)
      }
    }

    initAuth()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  // 2) Po přihlášení nastavíme výchozí modul
  useEffect(() => {
    if (isAuthenticated && !activeModuleId) {
      // můžeš změnit třeba na '900-nastaveni'
      setActiveModuleId('010-sprava-uzivatelu')
    }
  }, [isAuthenticated, activeModuleId])

  // Logout
  async function handleLogout() {
    await logout()
    setIsAuthenticated(false)
    setUser(null)
    setActiveModuleId(null)
  }

  // Klik v Sidebaru
  function handleModuleSelect(moduleId: string) {
    setActiveModuleId(moduleId)
  }

  // Co se ukáže v hlavním panelu
  function renderContent() {
    if (!isAuthenticated) {
      // nepřihlášený → LoginPanel
      return (
        <div className="content content--center">
          <LoginPanel />
        </div>
      )
    }

    if (!activeModuleId) {
      return (
        <div className="content">
          <h2>Vyber modul v levém menu</h2>
          <p>Po kliknutí na modul se tady zobrazí jeho obsah.</p>
        </div>
      )
    }

    // Nastavení – první napojený formulář
    if (activeModuleId === '900-nastaveni') {
      return (
        <div className="content">
          <h2>Nastavení – typy subjektů</h2>
          <p className="content__subtitle">
            Číselník napojený na Supabase tabulku <code>subject_types</code>.
          </p>
          <SubjectTypesTile />
        </div>
      )
    }

    // Ostatní moduly zatím jen placeholder
    return (
      <div className="content">
        <h2>Modul: {activeModuleId}</h2>
        <p>
          Modul je vybraný v sidebaru, ale ještě nemá svůj přehled/formulář.
          Napojíme je postupně podobně jako Nastavení.
        </p>
      </div>
    )
  }

  // Stav „načítám autentizaci“
  if (loadingAuth) {
    return (
      <div className={`layout theme-${uiConfig.theme}`}>
        <aside className="layout__sidebar sidebar">
          <div className="sidebar__loading">Načítám přihlášení…</div>
        </aside>
        <main className="layout__content">
          <p>Kontroluji session…</p>
        </main>
      </div>
    )
  }

  // Hlavní layout – včetně HomeButtonu (domeček)
  return (
    <div className={`layout theme-${uiConfig.theme}`}>
      {/* 1. HomeButton */}
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

      {/* 2. Sidebar */}
      <aside className="layout__sidebar">
        <Sidebar
          disabled={!isAuthenticated}
          activeModuleId={activeModuleId ?? undefined}
          onModuleSelect={handleModuleSelect}
        />
      </aside>

      {/* 3. Breadcrumbs */}
      <div className="layout__breadcrumbs">
        <Breadcrumbs disabled={!isAuthenticated} />
      </div>

      {/* 4. CommonActions (zatím bez konkrétních akcí) */}
      <div className="layout__actions">
        <CommonActions disabled={!isAuthenticated} />
      </div>

      {/* 5. Content */}
      <main className="layout__content">{renderContent()}</main>
    </div>
  )
}
