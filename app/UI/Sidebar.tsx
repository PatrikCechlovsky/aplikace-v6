// FILE: app/UI/Sidebar.tsx
'use client'

import { useEffect, useState } from 'react'
import { MODULE_SOURCES } from '@/app/modules.index.js'

interface ModuleConfig {
  id: string
  order?: number
  label: string
  icon?: string
  enabled?: boolean
}

export default function Sidebar() {
  const [modules, setModules] = useState<ModuleConfig[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadModules() {
      const loaded: ModuleConfig[] = []

      for (const loader of MODULE_SOURCES) {
        try {
          const mod: any = await loader()
          const conf = (mod.default ?? mod) as ModuleConfig

          if (!conf) continue
          if (conf.enabled === false) continue

          loaded.push(conf)
        } catch (err) {
          console.warn('Nepodařilo se načíst modul:', err)
        }
      }

      loaded.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      setModules(loaded)
      setLoading(false)
    }

    loadModules()
  }, [])

  return (
    <aside className="w-64 bg-white border-r p-4 hidden md:block">
      <h2 className="font-bold mb-4 text-sm">Moduly</h2>

      {loading && <p className="text-gray-500">Načítání…</p>}

      {!loading && modules.length === 0 && (
        <p className="text-gray-500 italic">Není nic obsaženo</p>
      )}

      {!loading && modules.length > 0 && (
        <ul className="space-y-2 text-sm">
          {modules.map((m) => (
            <li
              key={m.id}
              className="cursor-pointer hover:underline flex items-center gap-2"
            >
              <span>{m.icon}</span>
              <span>{m.label}</span>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
