// app/UI/Sidebar.tsx
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

type Props = {
  disabled?: boolean
}

export default function Sidebar({ disabled = false }: Props) {
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
    <nav className={`sidebar ${disabled ? 'is-disabled' : ''}`}>
      {loading && <p className="sidebar__empty">Načítání…</p>}

      {!loading && modules.length === 0 && (
        <p className="sidebar__empty">Není nic obsaženo</p>
      )}

      {!loading && modules.length > 0 && (
        <ul className="sidebar__list">
          {modules.map((m) => (
            <li key={m.id} className="sidebar__item">
              <span className="sidebar__icon">{m.icon}</span>
              <span className="sidebar__label">{m.label}</span>
            </li>
          ))}
        </ul>
      )}
    </nav>
  )
}
