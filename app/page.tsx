// FILE: app/page.tsx

'use client'

import Sidebar from './UI/Sidebar'
import HomeButton from './UI/HomeButton'
import HomeActions from './UI/HomeActions'
import Breadcrumbs from './UI/Breadcrumbs'
import CommonActions from './UI/CommonActions'
import LoginPanel from './UI/LoginPanel'

export default function HomePage() {
  return (
    <div className="layout">
      {/* Levý sloupec: 1 = HomeButton, 2 = Sidebar */}
      <div className="layout__sidebar">
        <HomeButton />
        <Sidebar />
      </div>

      {/* Horní lišta vpravo: 3 = Breadcrumbs, 4 = HomeActions */}
      <header className="layout__topbar">
        <Breadcrumbs />
        <HomeActions />
      </header>

      {/* Lišta akcí: 5 = CommonActions */}
      <div className="layout__actions">
        <CommonActions />
      </div>

      {/* Hlavní obsah: 6 = Content (teď login) */}
      <main className="layout__content">
        <LoginPanel />
      </main>
    </div>
  )
}
