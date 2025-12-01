'use client'

/*
 * FILE: app/page.tsx
 * PURPOSE: Hlavní stránka aplikace – layout + login + přepínání modulů v jednom contentu
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

// ⚙️ PRVNÍ FORMULÁŘ: Nastavení typů subjektů
import SubjectTypesTile from '@/app/modules/900-nastaveni/tiles/SubjectTypesTile'

type SessionUser = {
  email?: string | null
}

export default function HomePage() {
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<SessionUser | null>(null)

  // aktivní modul z Sidebaru
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null)

  // 🧠 1) Načtení session při startu
  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    async function initAuth() {
      try {
        const { data } = await getCurrentSession()
        const session = data?.session ?? null

        if (session?.user) {
          setIsAuthenticated(true)
          setUser({ email: session.user.email })
        } else {
          setIsAuthenticated(false)
          setUser(null)
        }

        // Listener změn stavu (login/logout)
        const { data: sub } = onAuthStateChange((event: string, newSession: any) => {
          if (newSession?.session?.user) {
            setIsAuthenticated(true)
            setUser({ email: newSession.session.user.email })
          } else {
            setIsAuthenticated(false)
            setUser(null)
          }
        })

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
      if (unsubscribe) unsubscribe()
    }
  }, [])

  // 🧠 2) Po přihlášení nastavíme výchozí modul (např. Správa uživatelů)
  useEffect(() => {
    if (isAuthenticated && !activeModuleId) {
      // výchozí modul – můžeš kdykoliv změnit na '900-nastaveni'
      setActiveModuleId('010-sprava-uzivatelu')
    }
  }, [isAuthenticated, activeModuleId])

  // 🚪 odhlášení
  async function handleLogout() {
    await logout()
    setIsAuthenticated(false)
    setUser(null)
    setActiveModuleId(null)
  }

  // 🎯 callback ze Sidebaru – nastaví aktivní modul
  function handleModuleSelect(moduleId: string) {
    setActiveModuleId(moduleId)
  }

  // 📦 obsah hlavního panelu podle aktivního modulu
  function renderContent() {
    if (!isAuthenticated) {
      // nepřihlášený – místo contentu login panel
      return (
        <div className="content content--center">
          <LoginPanel />
        </div>
      )
    }

    // když není vybraný modul
    if (!activeModuleId) {
      return (
        <div className="content">
          <h2>Vyber modul v levém menu</h2>
          <p>Po kliknutí na modul se tady zobrazí jeho obsah.</p>
        </div>
      )
    }

    // 🔧 TADY MÁME PRVNÍ NAPOJENÍ NA FORMULÁŘ Z NASTAVENÍ
    if (activeModuleId === '900-nastaveni') {
      return (
        <div className="content">
          <h2>Nastavení – typy subjektů</h2>
          <p className="content__subtitle">
            První číselník napojený na Supabase: tabulka <code>subject_types</code>.
          </p>
          <SubjectTypesTile />
        </div>
      )
    }

    // ostatní moduly – zatím placeholder
    return (
      <div className="content">
        <h2>Modul: {activeModuleId}</h2>
        <p>
          Modul je vybraný v sidebaru, ale nemá ještě přiřazený konkrétní přehled/formulář.
          Až je vytvoříme, napojíme je sem podobně jako <code>SubjectTypesTile</code>.
        </p>
      </div>
    )
  }

  // ⏳ stav načítání autentizace
  if (loadingAuth) {
    return (
      <div className="layout">
        <aside className="layout__sidebar sidebar">
          <div className="sidebar__loading">Načítám přihlášení…</div>
        </aside>
        <main className="layout__content">
          <p>Kontroluji session…</p>
        </main>
      </div>
    )
  }

  // 🧱 Hlavní layout
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
        <Breadcrumbs
          disabled={!isAuthenticated}
        />
      </div>

      {/* 4. CommonActions (zatím bez konkrétních akcí) */}
      <div className="layout__actions">
        <CommonActions disabled={!isAuthenticated} />
      </div>

      {/* 5. Content – tady konečně uvidíš SubjectTypesTile */}
      <main className="layout__content">
        {renderContent()}
      </main>
    </div>
  )
}
