// FILE: app/page.tsx

'use client'

import LoginPanel from './UI/LoginPanel'

// Importy necháme odkomentované, protože se používají ↓

import HomeButton from './UI/HomeButton'
import Sidebar from './UI/Sidebar'
import Breadcrumbs from './UI/Breadcrumbs'
import HomeActions from './UI/HomeActions'
import CommonActions from './UI/CommonActions'

export default function HomePage() {
  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* BLOK 2 – Sidebar */}
      <Sidebar />

      <div className="flex-1 flex flex-col">

        {/* BLOK 1 + 4 – HomeButton & HomeActions */}
        <div className="flex justify-between items-center px-4 h-12 bg-white border-b">
          <HomeButton />
          <HomeActions />
        </div>

        {/* BLOK 3 – Breadcrumbs */}
        <div className="px-4 py-2 border-b bg-white">
          <Breadcrumbs />
        </div>

        {/* BLOK 5 – CommonActions */}
        <div className="px-4 py-2 border-b bg-white">
          <CommonActions />
        </div>

        {/* BLOK 6 – Content s LOGINEM */}
        <div className="flex-1 p-4 overflow-y-auto">
          <LoginPanel />
        </div>
      </div>
    </div>
  )
}
