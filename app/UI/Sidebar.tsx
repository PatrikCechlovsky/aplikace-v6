// FILE: src/app/UI/Sidebar.tsx

'use client'

// @ts-nocheck  ← klidně tam nech, ať tě TS tady netrápí

import { useEffect, useState } from 'react'
import { MODULE_SOURCES } from '@/app/modules.index.js'

export default function Sidebar() {
  const [modules, setModules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadModules() {
      const loaded: any[] = []

      for (const load of MODULE_SOURCES) {
        try {
          const mod: any = await load()
          const conf: any = mod.default || mod
          if (!conf) continue
          // enabled === false => skryjeme
          if (conf.enabled === false) continue
          loaded.push(conf)
        } catch (err) {
          console.warn('Nepodařilo se načíst modul:', err)
        }
      }

      loaded.sort((a, b) => (a.order || 0) - (b.order || 0))
      setModules(loaded)
      setLoading(false)
    }

    loadModules()
  }, [])

  return (
    <aside className="w-64 bg-white border-r p-4 hidden md:block">
      <h2 className="font-bold mb-4 text-sm">Moduly</h2>

      {loading && <p className="text-gray-500">Načítání…</p>}

      {!loading && modules.length === 0 &&
