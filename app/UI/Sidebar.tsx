/*
 * FILE: app/UI/Sidebar.tsx
 * PURPOSE: Stromový sidebar modulů + tiles s ikonami a ochranou proti ztrátě dat
 */

'use client'

import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { MODULE_SOURCES } from '@/app/modules.index.js'
import { getIcon } from './icons'
import { uiConfig } from '../lib/uiConfig'

interface SidebarTile {
  id: string
  label: string
}

interface ModuleConfig {
  id: string
  label: string
  icon?: string
  order?: number
  enabled?: boolean
  tiles?: SidebarTile[]
}

type SidebarProps = {
  disabled?: boolean
  /**
   * Když je true, klik na jinou položku vyvolá confirm dialog.
   * Zatím se nepropaguje z formulářů – to dopojíme později.
   */
  hasUnsavedChanges?: boolean
}

export default function Sidebar({
  disabled = false,
  hasUnsavedChanges = false,
}: SidebarProps) {
  const [modules, setModules] = useState<ModuleConfig[]>([])
  const [expandedIds, setExpandedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const pathname = usePathname() ?? ''
  const searchParams = useSearchParams()

  // Načtení modulů z module.config.js
  useEffect(() => {
    async function loadModules() {
      const loaded: ModuleConfig[] = []

      for (const loader of MODULE_SOURCES) {
        try {
          const mod: any = await loader()
          const conf = (mod.default ?? mod) as any

          if (conf.enabled === false) continue

          const normalized: ModuleConfig = {
            id: conf.id,
            label: conf.label,
            icon: conf.icon,
            order: conf.order ?? 999,
            tiles: Array.isArray(conf.tiles)
              ? conf.tiles.map((t: any) => ({
                  id: t.id,
                  label: t.label ?? t.id,
                }))
              : [],
          }

          loaded.push(normalized)
        } catch (err) {
          console.error('Sidebar: Nelze načíst modul', err)
        }
      }

      loaded.sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
      setModules(loaded)
      setLoading(false)
    }

    loadModules()
  }, [])

  // Aktivní modul z URL (/modules/<id>)
  const activeModuleId = useMemo(() => {
    if (!pathname) return null
    const parts = pathname.split('/')
    const idx = parts.indexOf('modules')
    if (idx !== -1 && parts.length > idx + 1) {
      return parts[idx + 1]
    }
    return null
  }, [pathname])

  // Aktivní tile z query (?tile=<id>) – používáme do budoucna
  const activeTileId = searchParams?.get('tile') ?? null

  // Rozbalit aktivní modul při změně
  useEffect(() => {
    if (!activeModuleId) return
    setExpandedIds((prev) =>
      prev.includes(activeModuleId) ? prev : [...prev, activeModuleId],
    )
  }, [activeModuleId])

  const showIcons = uiConfig.showSidebarIcons

  function toggleExpand(moduleId: string) {
    setExpandedIds((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId],
    )
  }

  function handleNavigationClick(
    e: MouseEvent<HTMLAnchorElement>,
  ) {
    if (disabled) {
      e.preventDefault()
      return
    }

    if (hasUnsavedChanges) {
      const ok = window.confirm(
        'Máte neuložené změny. Opravdu chcete odejít a zahodit je?',
      )
      if (!ok) {
        e.preventDefault()
      }
    }
  }

  function isModuleActive(m: ModuleConfig): boolean {
    return activeModuleId === m.id
  }

  return (
    <nav className="sidebar">
      <div className="sidebar__inner">
        {loading ? (
          <div className="sidebar__loading">Načítám moduly…</div>
        ) : (
          <ul className="sidebar__list">
            {modules.map((m) => {
              const hasChildren = !!m.tiles && m.tiles.length > 0
              const isExpanded = expandedIds.includes(m.id)
              const moduleHref = `/modules/${m.id}`

              return (
                <li key={m.id} className="sidebar__item">
                  <div
                    className={
                      'sidebar__row' +
                      (isModuleActive(m) ? ' sidebar__row--active' : '') +
                      (disabled ? ' sidebar__row--disabled' : '')
                    }
                  >
                    {hasChildren && (
                      <button
                        type="button"
                        className={
                          'sidebar__toggle' +
                          (isExpanded ? ' sidebar__toggle--open' : '')
                        }
                        onClick={() => toggleExpand(m.id)}
                        aria-label={
                          isExpanded ? 'Skrýt podmenu' : 'Zobrazit podmenu'
                        }
                      >
                        ▸
                      </button>
                    )}

                    <Link
                      href={moduleHref}
                      className="sidebar__link"
                      onClick={handleNavigationClick}
                    >
                      {showIcons && (
                        <span className="sidebar__icon">
                          {getIcon(m.icon as any)}
                        </span>
                      )}
                      <span className="sidebar__label">{m.label}</span>
                    </Link>
                  </div>

                  {hasChildren && isExpanded && (
                    <ul className="sidebar__sublist">
                      {m.tiles!.map((t) => {
                        const tileHref = `/modules/${m.id}?tile=${t.id}`
                        const isActiveSub =
                          isModuleActive(m) && activeTileId === t.id

                        return (
                          <li
                            key={t.id}
                            className={
                              'sidebar__subitem' +
                              (isActiveSub ? ' sidebar__subitem--active' : '')
                            }
                          >
                            <Link
                              href={tileHref}
                              className="sidebar__sublink"
                              onClick={handleNavigationClick}
                            >
                              {showIcons && (
                                <span className="sidebar__subicon">
                                  {/* tady klidně můžeš dát specifickou ikonu pro tile */}
                                  {getIcon('dot' as any)}
                                </span>
                              )}
                              <span className="sidebar__sublabel">
                                {t.label}
                              </span>
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </nav>
  )
}
