/*
 * FILE: app/UI/Sidebar.tsx
 * PURPOSE: Dynamický sidebar modulů včetně optional ikonek + debug výstup
 */

'use client'

import { useEffect, useState } from 'react'
import { MODULE_SOURCES } from '@/app/modules.index.js'
import { getIcon } from './icons'
import { uiConfig } from '../lib/uiConfig'

interface ModuleConfig {
  id: string
  label: string
  icon?: string
  order?: number
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

      // 🔍 DEBUG: vyhoď načtené moduly na window, ať je vidíme v konzoli
      if (typeof window !== 'undefined') {
        ;(window as any).__PRONAJ_SIDEBAR_MODULES__ = loaded
      }
    }

    loadModules()
  }, [])

  const showIcons = uiConfig.showSidebarIcons

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
              {showIcons && (
                <span className="sidebar__icon">
                  {getIcon(m.icon as any)}
                </span>
              )}
              <span className="sidebar__label">{m.label}</span>
            </li>
          ))}
        </ul>
      )}
    </nav>
  )
}
