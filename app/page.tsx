// FILE: app/page.tsx

'use client'

import HomeButton from './UI/HomeButton'
import Sidebar from './UI/Sidebar'
import Breadcrumbs from './UI/Breadcrumbs'
import HomeActions from './UI/HomeActions'
import CommonActions from './UI/CommonActions'
import Tabs from './UI/Tabs'
import DetailView from './UI/DetailView'
// import ListView from './UI/ListView' // použijeme později

export default function HomePage() {
  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* BLOK 2 – Sidebar (dynamický, načítá moduly z modules.index.js) */}
      <Sidebar />

      <div className="flex-1 flex flex-col">

        {/* BLOK 1 + 4 – HomeButton vlevo, HomeActions vpravo */}
        <div className="flex justify-between items-center px-4 h-12 bg-white border-b">
          <HomeButton />
          <HomeActions />
        </div>

        {/* BLOK 3 – Breadcrumbs */}
        <div className="px-4 py-2 border-b bg-white">
          <Breadcrumbs />
        </div>

        {/* BLOK 5 – CommonActions (zatím statické, později dynamické) */}
        <div className="px-4 py-2 border-b bg-white">
          <CommonActions />
        </div>

        {/* BLOK 6 – Tabs (10 záložek) + Detail hlavní karty */}
        <div className="flex-1 p-4 overflow-y-auto">
          <Tabs />
          <div className="mt-4">
            <DetailView />
          </div>
        </div>
      </div>
    </div>
  )
}
