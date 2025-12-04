/*
 * FILE: app/UI/Sidebar.tsx
 * PURPOSE: Stromový sidebar modulů + tiles s ikonami, ochranou proti ztrátě dat
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

/**
 * Výběr v sidebaru – používá se v page.tsx jako SidebarSelection.
 */
export type SidebarSelection = {
  moduleId: string
  tileId?: string | null
}

type SidebarProps = {
  disabled?: boolean
  /**
   * true = uživatel má rozdělanou práci, klik může být zablokován
   */
  hasUnsavedChanges?: boolean
  /**
   * Volitelné – pokud se posílá, bere se jako aktivní modul (má prioritu před URL).
   */
  activeModuleId?: string | null
  /**
   * Callback při výběru modulu / tile.
   */
  onModuleSelect?: (selection: SidebarSelection) => void
}

export default function Sidebar({
  disabled = false,
  hasUnsavedChanges = false,
  activeModuleId: activeModuleIdProp = null,
  onModuleSelect,
}: SidebarProps) {
  const [modules, setModules] = useState<ModuleConfig[]>([])
  const [expandedIds, setExpandedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const pathname = usePathname() ?? ''
  const searchParams = useSearchParams()

  // Aktivní modul z URL (/modules/<id>)
  const activeModuleIdFromUrl = useMemo(() => {
    if (!pathname) return null
    const parts = pathname.split('/')
    const idx = parts.indexOf('modules')
    if (idx !== -1 && parts.length > idx + 1) {
      return parts[idx + 1]
    }
    return null
  }, [pathname])

  // Konečný aktivní modul – pokud přichází z props, má přednost
  const effectiveActiveModuleId =
    activeModuleIdProp ?? activeModuleIdFromUrl

  // Aktivní tile z query (?tile=<id>) – do budoucna i pro breadcrumbs
  const activeTileId = searchParams?.get('tile') ?? null

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

  // Rozbalit aktivní modul při změně
  useEffect(() => {
    if (!effectiveActiveModuleId) return
    setExpandedIds((prev) =>
      prev.includes(effectiveActiveModuleId)
        ? prev
        : [...prev, effectiveActiveModuleId],
    )
  }, [effectiveActiveModuleId])

  const showIcons = uiConfig.showSidebarIcons

  function toggleExpand(moduleId: string) {
    setExpandedIds((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId],
    )
  }

  /**
   * Společná kontrola pro kliknutí – řeší disabled + hasUnsavedChanges.
   * Vrací true = můžeš pokračovat, false = zruš navigaci.
   */
  function confirmNavigation(e: MouseEvent, selection?: SidebarSelection) {
    if (disabled) {
      e.preventDefault()
      return false
    }

    if (hasUnsavedChanges) {
      const ok = window.confirm(
        'Máte neuložené změny. Opravdu chcete odejít a zahodit je?',
      )
      if (!ok) {
        e.preventDefault()
        return false
      }
    }

    // Informujeme parent o výběru
    if (selection && onModuleSelect) {
      onModuleSelect(selection)
    }

    return true
  }

  function isModuleActive(m: ModuleConfig): boolean {
    return effectiveActiveModuleId === m.id
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
                      onClick={(e) =>
                        confirmNavigation(e, { moduleId: m.id })
                      }
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
                              onClick={(e) =>
                                confirmNavigation(e, {
                                  moduleId: m.id,
                                  tileId: t.id,
                                })
                              }
                            >
                              {showIcons && (
                                <span className="sidebar__subicon">
                                  {/* tady můžeš v budoucnu dát vlastní ikonu pro tile */}
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
