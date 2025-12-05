/*
 * FILE: app/UI/Sidebar.tsx
 * PURPOSE: Stromový sidebar modulů + SECTIONS + tiles s ikonami,
 *          ochranou proti ztrátě dat a 3 úrovněmi (modul → sekce → tile).
 */

'use client'

import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MODULE_SOURCES } from '@/app/modules.index.js'
import { getIcon } from './icons'
import { uiConfig } from '../lib/uiConfig'

/**
 * 3. úroveň – konkrétní položky (např. „Typy subjektů“).
 * sectionId říká, do které sekce (2. úroveň) tile patří.
 */
interface SidebarTile {
  id: string
  label: string
  sectionId?: string | null
}

/**
 * 2. úroveň – sekce uvnitř modulu (např. „Nastavení typů“, „Nastavení vzhledu“…)
 */
interface ModuleSection {
  id: string
  label: string
}

/**
 * 1. úroveň – modul (Nastavení, Nájemníci, Nemovitosti…)
 */
interface ModuleConfig {
  id: string
  label: string
  icon?: string
  order?: number
  enabled?: boolean
  sections?: ModuleSection[]
  tiles?: SidebarTile[]
}

/**
 * Výběr v sidebaru – používá se v AppShellu.
 * Přidali jsme sectionId pro 2. úroveň.
 */
export type SidebarSelection = {
  moduleId: string
  sectionId?: string | null
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
   * Callback při výběru modulu / sekce / tile.
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
  const [activeSectionId, setActiveSectionId] = useState<string | null>(
    null,
  )
  const [activeTileId, setActiveTileId] = useState<string | null>(null)

  const pathname = usePathname() ?? ''

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
            sections: Array.isArray(conf.sections)
              ? conf.sections.map((s: any) => ({
                  id: s.id,
                  label: s.label ?? s.id,
                }))
              : undefined,
            tiles: Array.isArray(conf.tiles)
              ? conf.tiles.map((t: any) => ({
                  id: t.id,
                  label: t.label ?? t.id,
                  sectionId: t.sectionId ?? null,
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
  function confirmNavigation(
    e: MouseEvent,
    selection?: SidebarSelection,
  ) {
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
              const hasSections = !!m.sections && m.sections.length > 0
              const hasTiles = !!m.tiles && m.tiles.length > 0
              const isExpanded = expandedIds.includes(m.id)
              const moduleHref = `/modules/${m.id}`

              return (
                <li key={m.id} className="sidebar__item">
                  {/* 1. úroveň – modul */}
                  <div
                    className={
                      'sidebar__row' +
                      (isModuleActive(m) ? ' sidebar__row--active' : '') +
                      (disabled ? ' sidebar__row--disabled' : '')
                    }
                  >
                    {(hasSections || hasTiles) && (
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
                      onClick={(e) => {
                        const ok = confirmNavigation(e, {
                          moduleId: m.id,
                        })
                        if (ok) {
                          setActiveSectionId(null)
                          setActiveTileId(null)
                        }
                      }}
                    >
                      {showIcons && (
                        <span className="sidebar__icon">
                          {getIcon(m.icon as any)}
                        </span>
                      )}
                      <span className="sidebar__label">{m.label}</span>
                    </Link>
                  </div>

                  {/* 2. + 3. úroveň – sekce + tiles */}
                  {isExpanded && (hasSections || hasTiles) && (
                    <div className="sidebar__nested">
                      {hasSections ? (
                        // Modul má SECTIONS → 3-level strom
                        <ul className="sidebar__sectionlist">
                          {m.sections!.map((section) => {
                            const sectionTiles =
                              m.tiles?.filter(
                                (t) => t.sectionId === section.id,
                              ) ?? []

                            const isSectionActive =
                              isModuleActive(m) &&
                              section.id === activeSectionId

                            return (
                              <li
                                key={section.id}
                                className={
                                  'sidebar__section-item' +
                                  (isSectionActive
                                    ? ' sidebar__section-item--active'
                                    : '')
                                }
                              >
                                {/* 2. úroveň – sekce */}
                                <div
                                  className="sidebar__section-row"
                                  onClick={() => {
                                    setActiveSectionId(section.id)
                                  }}
                                >
                                  <span className="sidebar__section-label">
                                    {section.label}
                                  </span>
                                </div>

                                {/* 3. úroveň – tiles v sekci */}
                                {sectionTiles.length > 0 && (
                                  <ul className="sidebar__sublist">
                                    {sectionTiles.map((t) => {
                                      const tileHref = `/modules/${m.id}` // zatím bez ?tile
                                      const isActiveSub =
                                        isModuleActive(m) &&
                                        activeTileId === t.id

                                      return (
                                        <li
                                          key={t.id}
                                          className={
                                            'sidebar__subitem' +
                                            (isActiveSub
                                              ? ' sidebar__subitem--active'
                                              : '')
                                          }
                                        >
                                          <Link
                                            href={tileHref}
                                            className="sidebar__sublink"
                                            onClick={(e) => {
                                              const ok = confirmNavigation(
                                                e,
                                                {
                                                  moduleId: m.id,
                                                  sectionId: section.id,
                                                  tileId: t.id,
                                                },
                                              )
                                              if (ok) {
                                                setActiveSectionId(
                                                  section.id,
                                                )
                                                setActiveTileId(t.id)
                                              }
                                            }}
                                          >
                                            {showIcons && (
                                              <span className="sidebar__subicon">
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
                      ) : (
                        // Modul NEMÁ sections → fallback na 2-level (modul → tiles)
                        <ul className="sidebar__sublist">
                          {m.tiles!.map((t) => {
                            const tileHref = `/modules/${m.id}`
                            const isActiveSub =
                              isModuleActive(m) && activeTileId === t.id

                            return (
                              <li
                                key={t.id}
                                className={
                                  'sidebar__subitem' +
                                  (isActiveSub
                                    ? ' sidebar__subitem--active'
                                    : '')
                                }
                              >
                                <Link
                                  href={tileHref}
                                  className="sidebar__sublink"
                                  onClick={(e) => {
                                    const ok = confirmNavigation(e, {
                                      moduleId: m.id,
                                      tileId: t.id,
                                    })
                                    if (ok) {
                                      setActiveSectionId(null)
                                      setActiveTileId(t.id)
                                    }
                                  }}
                                >
                                  {showIcons && (
                                    <span className="sidebar__subicon">
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
                    </div>
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
