/*
 * FILE: app/UI/Sidebar.tsx
 * PURPOSE: Stromový sidebar (3 úrovně):
 * 1) modul
 * 2) sekce
 * 3) tile
 */

'use client'

import { useEffect, useState, type MouseEvent } from 'react'
import Link from 'next/link'
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
  icon?: string | null
}

/**
 * 2. úroveň – sekce uvnitř modulu (např. „Nastavení typů“, „Nastavení vzhledu“…)
 */
interface ModuleSection {
  id: string
  label: string
  icon?: string | null
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
 */
export type SidebarSelection = {
  moduleId: string
  sectionId?: string | null
  tileId?: string | null
}

type SidebarProps = {
  disabled?: boolean
  hasUnsavedChanges?: boolean
  activeModuleId?: string | null
  activeSelection?: SidebarSelection | null
  onModuleSelect?: (selection: SidebarSelection) => void
}

export default function Sidebar({
  disabled = false,
  hasUnsavedChanges = false,
  activeModuleId = null,
  activeSelection = null,
  onModuleSelect,
}: SidebarProps) {
  const [modules, setModules] = useState<ModuleConfig[]>([])
  const [loading, setLoading] = useState(true)

  // rozbalené moduly (1. úroveň)
  const [expandedModuleIds, setExpandedModuleIds] = useState<string[]>([])
  // rozbalené sekce (2. úroveň)
  const [expandedSectionIds, setExpandedSectionIds] = useState<string[]>([])

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
                  icon: s.icon ?? null,
                }))
              : undefined,
            tiles: Array.isArray(conf.tiles)
              ? conf.tiles.map((t: any) => ({
                  id: t.id,
                  label: t.label ?? t.id,
                  sectionId: t.sectionId ?? null,
                  icon: t.icon ?? null,
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

  // Když se změní aktivní modul (např. po kliknutí v sidebaru),
  // zajistíme, že jeho menu bude rozbalené.
  useEffect(() => {
    if (!activeModuleId) return

    setExpandedModuleIds((prev) =>
      prev.includes(activeModuleId) ? prev : [...prev, activeModuleId],
    )
  }, [activeModuleId])

  const showIcons = uiConfig.showSidebarIcons

  function toggleModule(moduleId: string) {
    setExpandedModuleIds((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId],
    )
  }

  function toggleSection(sectionId: string) {
    setExpandedSectionIds((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId],
    )
  }

  /**
   * Společné zpracování kliknutí – hlídá disabled + hasUnsavedChanges.
   */
  function handleSelect(selection: SidebarSelection, e?: MouseEvent) {
    if (disabled) {
      e?.preventDefault()
      return
    }

    if (hasUnsavedChanges) {
      const ok = window.confirm(
        'Máte neuložené změny. Opravdu chcete odejít a zahodit je?',
      )
      if (!ok) {
        e?.preventDefault()
        return
      }
    }

    e?.preventDefault()
    onModuleSelect?.(selection)
  }

  // 🔦 Aktivní stav – jen jedna „nejhlubší“ položka
  function isModuleActive(m: ModuleConfig): boolean {
    return (
      activeSelection?.moduleId === m.id &&
      !activeSelection.sectionId &&
      !activeSelection.tileId
    )
  }

  function isSectionActive(m: ModuleConfig, s: ModuleSection): boolean {
    return (
      activeSelection?.moduleId === m.id &&
      activeSelection.sectionId === s.id &&
      !activeSelection.tileId
    )
  }

  function isTileActive(m: ModuleConfig, t: SidebarTile): boolean {
    return (
      activeSelection?.moduleId === m.id &&
      activeSelection.tileId === t.id
    )
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
              const isExpanded = expandedModuleIds.includes(m.id)
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
                        onClick={() => toggleModule(m.id)}
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
                        handleSelect({ moduleId: m.id }, e)
                        // po kliknutí na modul ho i rozbalíme
                        if (!isExpanded) {
                          toggleModule(m.id)
                        }
                      }}
                    >
                      {showIcons && m.icon && (
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

                            const isSectionOpen =
                              expandedSectionIds.includes(section.id)

                            return (
                              <li
                                key={section.id}
                                className={
                                  'sidebar__section-item' +
                                  (isSectionActive(m, section)
                                    ? ' sidebar__section-item--active'
                                    : '')
                                }
                              >
                                {/* 2. úroveň – sekce */}
                                <div
                                  className="sidebar__section-row"
                                  onClick={() => {
                                    handleSelect({
                                      moduleId: m.id,
                                      sectionId: section.id,
                                    })
                                    toggleSection(section.id)
                                  }}
                                >
                                  {sectionTiles.length > 0 && (
                                    <button
                                      type="button"
                                      className={
                                        'sidebar__section-toggle' +
                                        (isSectionOpen
                                          ? ' sidebar__section-toggle--open'
                                          : '')
                                      }
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        toggleSection(section.id)
                                      }}
                                    >
                                      ▸
                                    </button>
                                  )}

                                  {showIcons && section.icon && (
                                    <span className="sidebar__section-icon">
                                      {getIcon(section.icon as any)}
                                    </span>
                                  )}

                                  <span className="sidebar__section-label">
                                    {section.label}
                                  </span>
                                </div>

                                {/* 3. úroveň – tiles v sekci (jen když je sekce rozbalená) */}
                                {isSectionOpen && sectionTiles.length > 0 && (
                                  <ul className="sidebar__sublist">
                                    {sectionTiles.map((t) => {
                                      const tileHref = `/modules/${m.id}`
                                      const isActiveTile = isTileActive(m, t)

                                      return (
                                        <li
                                          key={t.id}
                                          className={
                                            'sidebar__subitem' +
                                            (isActiveTile
                                              ? ' sidebar__subitem--active'
                                              : '')
                                          }
                                        >
                                          <Link
                                            href={tileHref}
                                            className="sidebar__sublink"
                                            onClick={(e) => {
                                              handleSelect(
                                                {
                                                  moduleId: m.id,
                                                  sectionId: section.id,
                                                  tileId: t.id,
                                                },
                                                e,
                                              )
                                            }}
                                          >
                                            {showIcons && t.icon && (
                                              <span className="sidebar__subicon">
                                                {getIcon(t.icon as any)}
                                              </span>
                                            )}
                                            <span className="sidebar__sublabel">
                                              {t.label}</span>
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
                            const isActiveTile = isTileActive(m, t)

                            return (
                              <li
                                key={t.id}
                                className={
                                  'sidebar__subitem' +
                                  (isActiveTile
                                    ? ' sidebar__subitem--active'
                                    : '')
                                }
                              >
                                <Link
                                  href={tileHref}
                                  className="sidebar__sublink"
                                  onClick={(e) => {
                                    handleSelect(
                                      { moduleId: m.id, tileId: t.id },
                                      e,
                                    )
                                  }}
                                >
                                  {showIcons && t.icon && (
                                    <span className="sidebar__subicon">
                                      {getIcon(t.icon as any)}
                                    </span>
                                  )}
                                  <span className="sidebar__sublabel">
                                    {t.label}</span>
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
