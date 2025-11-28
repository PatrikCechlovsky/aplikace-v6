/*
 * FILE: src/app/UI/Sidebar.tsx
 * PURPOSE: Dynamický sidebar modulů s ikonami + odkazy na stránky
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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

function moduleIdToHref(id: string): string {
  switch (id) {
    case '900-nastaveni':
      return '/nastaveni'
    default:
      // zatím všechny ostatní moduly vedou na hlavní dashboard (/)
      // později můžeš pro každý id udělat vlastní route
      return '/'
  }
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

  const showIcons = uiConfig.showSidebarIcons

  return (
    <nav className={`sidebar ${disabled ? 'is-disabled' : ''}`}>
      {loading && <p className="sidebar__empty">Načítání…</p>}

      {!loading && modules.length === 0 && (
        <p className="sidebar__empty">Není nic obsaženo</p>
      )}

      {!loading && modules.length > 0 && (
        <ul className="sidebar__list">
          {modules.map((m) => {
            const href = moduleIdToHref(m.id)

            return (
              <li key={m.id} className="sidebar__item">
                <Link href={href} className="sidebar__link">
                  {showIcons && (
                    <span className="sidebar__icon">
                      {getIcon(m.icon as any)}
                    </span>
                  )}
                  <span className="sidebar__label">{m.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </nav>
  )
}
