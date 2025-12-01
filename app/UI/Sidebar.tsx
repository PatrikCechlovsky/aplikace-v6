/*
 * FILE: app/UI/Sidebar.tsx
 * PURPOSE: Boční menu modulů – dynamické načítání module.config.js, bez navigace na /nastaveni
 */

'use client'

import React, { useEffect, useState } from 'react'
import { MODULE_SOURCES } from '@/app/modules.index'
import { getIcon, IconKey } from '@/app/UI/icons'

type ModuleConfig = {
  id: string
  label: string
  icon?: IconKey
  order?: number
  enabled?: boolean
}

type Props = {
  disabled?: boolean
}

export default function Sidebar({ disabled }: Props) {
  const [modules, setModules] = useState<ModuleConfig[]>([])
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null)

  useEffect(() => {
    async function loadModules() {
      const loaded: ModuleConfig[] = []

      for (const loader of MODULE_SOURCES) {
        try {
          const mod = await loader()
          const cfg = mod.default as ModuleConfig

          // skryjeme moduly s enabled === false
          if (cfg?.enabled === false) continue

          loaded.push({
            id: cfg.id,
            label: cfg.label,
            icon: cfg.icon,
            order: cfg.order ?? 0,
            enabled: cfg.enabled ?? true,
          })
        } catch (error) {
          console.error('Sidebar – chyba při načítání modulu', error)
        }
      }

      loaded.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      setModules(loaded)

      // pokud ještě není nic aktivní, nastavíme první modul
      if (!activeModuleId && loaded.length > 0) {
        setActiveModuleId(loaded[0].id)
      }
    }

    loadModules()
  }, [activeModuleId])

  return (
    <aside className="layout__sidebar sidebar">
      {modules.map((mod) => {
        const isActive = mod.id === activeModuleId

        const className = [
          'sidebar__item',
          isActive ? 'sidebar__item--active' : '',
          disabled ? 'sidebar__item--disabled' : '',
        ]
          .filter(Boolean)
          .join(' ')

        return (
          <button
            key={mod.id}
            type="button"
            className={className}
            onClick={() => {
              if (disabled) return
              setActiveModuleId(mod.id)
              // ❗ TADY ZATÍM NENAVIGUJEME NA ŽÁDNOU URL
              // později sem můžeme přidat callback, který řekne Contentu, jaký modul má vykreslit
            }}
          >
            <span className="sidebar__icon">
              {getIcon(mod.icon)}
            </span>
            <span className="sidebar__label">{mod.label}</span>
          </button>
        )
      })}
    </aside>
  )
}
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
