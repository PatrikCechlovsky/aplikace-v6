// app/page.tsx
'use client'

import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabaseClient'

import HomeButton from './UI/HomeButton'
import Sidebar from './UI/Sidebar'
import Breadcrumbs from './UI/Breadcrumbs'
import HomeActions from './UI/HomeActions'
import CommonActions from './UI/CommonActions'
import LoginPanel from './UI/LoginPanel'

export default function HomePage() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // načtení session + posluchač změn (login / logout)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const isAuthenticated = !!session

  const handleLogout = async () => {
    await supabase.auth.signOut()
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

      {/* 5 – common actions */}
      <div className="layout__actions">
        <CommonActions disabled={!isAuthenticated} />
      </div>

      {/* 6 – content */}
      <main className="layout__content">
        {loading ? (
          <div>Načítání…</div>
        ) : !isAuthenticated ? (
          <LoginPanel />
        ) : (
          <div>
            {/* TODO: sem dáme dashboard / výchozí přehled */}
            <h1>Vítej v aplikaci Pronajímatel v6</h1>
            <p>Zatím jednoduchý dashboard po přihlášení.</p>
          </div>
        )}
      </main>
    </div>
  )
}
