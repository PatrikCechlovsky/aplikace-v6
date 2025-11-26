// FILE: app/page.tsx

'use client'

import HomeButton from '@/app/UI/HomeButton'
import Sidebar from '@/app/UI/Sidebar'
import Breadcrumbs from '@/app/UI/Breadcrumbs'
import HomeActions from '@/app/UI/HomeActions'
import CommonActions from '@/app/UI/CommonActions'
import Tabs from '@/app/UI/Tabs'
import DetailView from '@/app/UI/DetailView'
// import ListView from '@/app/UI/ListView' // použijeme později

export default function HomePage() {
  // Později tu bude stav: který modul, která záložka, atd.
  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* BLOK 2 – Sidebar */}
      <Sidebar />

      <div className="flex-1 flex flex-col">

        {/* BLOK 1 + 4 – HomeButton + HomeActions */}
        <div className="flex justify-between items-center px-4 h-12 bg-white border-b">
          <HomeButton />
          <HomeActions />
        </div>

        {/* BLOK 3 – Breadcrumbs */}
        <div className="px-4 py-2 border-b bg-white">
          <Breadcrumbs />
        </div>

        {/* BLOK 5 – CommonActions (zatím natvrdo pro test) */}
        <div className="px-4 py-2 border-b bg-white">
          <CommonActions />
        </div>

        {/* BLOK 6 – Tabs + Detail */}
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
