/*
 * FILE: app/page.tsx
 * PURPOSE: Hlavní stránka – layout 6 částí + login / obsah po přihlášení
 */

'use client'

import { useEffect, useState } from 'react'
import type { Session, AuthChangeEvent } from '@supabase/supabase-js'

import HomeButton from './UI/HomeButton'
import Sidebar from './UI/Sidebar'
import Breadcrumbs from './UI/Breadcrumbs'
import HomeActions from './UI/HomeActions'
import CommonActions from './UI/CommonActions'
import LoginPanel from './UI/LoginPanel'


import {
  getCurrentSession,
  onAuthStateChange,
  logout as authLogout,
} from './lib/services/auth'

export default function HomePage() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // inicialní načtení session
    getCurrentSession().then(({ data }) => {
      setSession(data.session ?? null)
      setLoading(false)
    })

    // posluchač změn auth stavu
    const {
      data: { subscription },
    } = onAuthStateChange((event: AuthChangeEvent, newSession: Session | null) => {
      setSession(newSession)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const isAuthenticated = !!session

  const handleLogout = async () => {
    await authLogout()
  }

  return (
    <div className="layout">
      {/* 1+2 – levý sloupec */}
      <div className="layout__sidebar">
        <HomeButton disabled={!isAuthenticated} />
        <Sidebar disabled={!isAuthenticated} />
      </div>

      {/* 3+4 – horní lišta */}
      <header className="layout__topbar">
        <Breadcrumbs disabled={!isAuthenticated} />
        <HomeActions disabled={!isAuthenticated} onLogout={handleLogout} />
      </header>

      {/* 5 – společné akce */}
      <div className="layout__actions">
        <CommonActions disabled={!isAuthenticated} />
      </div>

                 {/* 6 – obsah */}
      <main className="layout__content">
        {loading ? (
          <div>Načítání…</div>
        ) : !isAuthenticated ? (
          <LoginPanel />
        ) : (
          <div>
            <h1>Vítej v aplikaci Pronajímatel v6</h1>
            <p>Zde bude dashboard nebo výchozí přehled po přihlášení.</p>

            {/* Sem později můžeme vložit třeba MfaSetupPanel nebo modulový přehled */}
          </div>
  
  )
}
