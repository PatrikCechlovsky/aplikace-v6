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
import { getLandlordCountsByType } from '@/app/lib/services/landlords'
import { getSubjectCountsByType } from '@/app/lib/services/subjects'
import { getTenantCountsByType } from '@/app/lib/services/tenants'
import { getPropertyCountsByType } from '@/app/lib/services/properties'
import { getUnitCountsByType } from '@/app/lib/services/units'
import { getServiceCatalogCountsByType } from '@/app/lib/services/serviceCatalog'
import { getEquipmentCatalogCountsByType } from '@/app/lib/services/equipment'
import { listActiveByCategory } from '@/app/modules/900-nastaveni/services/genericTypes'

/**
 * 3. úroveň – konkrétní položky (např. „Typy subjektů“).
 * sectionId říká, do které sekce (2. úroveň) tile patří.
 * children umožňuje vnořené sub-tiles (např. filtry pod "Přehled nemovitostí")
 */
interface SidebarTile {
  id: string
  label: string
  sectionId?: string | null
  icon?: string | null
  color?: string | null
  children?: SidebarTile[]
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

  // ACCORDION: pouze jeden modul/sekce/tile otevřený najednou
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null)
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null)
  const [expandedTileId, setExpandedTileId] = useState<string | null>(null)

  // Načtení modulů z module.config.js
  useEffect(() => {
    async function loadModules() {
      const loaded: ModuleConfig[] = []

      for (const loader of MODULE_SOURCES) {
        try {
          const mod: any = await loader()
          const conf = (mod.default ?? mod) as any

          if (conf.enabled === false) continue

          let tiles = Array.isArray(conf.tiles)
            ? conf.tiles.map((t: any) => ({
                id: t.id,
                label: t.label ?? t.id,
                sectionId: t.sectionId ?? null,
                icon: t.icon ?? null,
                children: Array.isArray(t.children)
                  ? t.children.map((c: any) => ({
                      id: c.id,
                      label: c.label ?? c.id,
                      icon: c.icon ?? null,
                    }))
                  : undefined,
              }))
            : []

          // Pro modul 030 (Pronajímatelé) načteme počty podle typů a aktualizujeme children labels + ikony
          if (conf.id === '030-pronajimatel' && Array.isArray(tiles)) {
            try {
              // Načíst počty podle typů
              const counts = await getLandlordCountsByType(false)
              const countsMap = new Map(counts.map((c) => [c.subject_type, c.count]))

              // Načíst typy subjektů z generic_types
              const subjectTypes = await listActiveByCategory('subject_types')
              const typesMap = new Map(subjectTypes.map((t) => [t.code, t]))

              // Aktualizovat children v "Přehled pronajímatelů" tile
              tiles = tiles.map((tile) => {
                if (tile.id === 'landlords-list' && tile.children) {
                  return {
                    ...tile,
                    children: tile.children.reduce((acc: any[], child: any) => {
                      const originalChild = conf.tiles
                        .find((t: any) => t.id === 'landlords-list')
                        ?.children?.find((c: any) => c.id === child.id)

                      if (originalChild?.dynamicLabel && originalChild?.subjectType) {
                        const count = countsMap.get(originalChild.subjectType) ?? 0
                        const typeDef = typesMap.get(originalChild.subjectType)
                        const typeLabel = typeDef?.name || child.label
                        const icon = typeDef?.icon || child.icon || 'user'

                        if (count > 0) {
                          acc.push({
                            ...child,
                            label: `${typeLabel} (${count})`,
                            icon: icon,
                          })
                        }
                        return acc
                      }

                      acc.push(child)
                      return acc
                    }, []),
                  }
                }
                return tile
              })
            } catch (countErr) {
              console.error('Sidebar: Chyba při načítání počtů pronajímatelů:', countErr)
            }
          }

          // Pro modul 800 (Subjekty) načteme počty podle typů a aktualizujeme children labels + ikony
          if (conf.id === '800-subjekty' && Array.isArray(tiles)) {
            try {
              const counts = await getSubjectCountsByType(false)
              const countsMap = new Map(counts.map((c) => [c.subject_type, c.count]))

              const subjectTypes = await listActiveByCategory('subject_types')
              const typesMap = new Map(subjectTypes.map((t) => [t.code, t]))

              tiles = tiles.map((tile) => {
                if (tile.id === 'subjects-list' && tile.children) {
                  return {
                    ...tile,
                    children: tile.children.reduce((acc: any[], child: any) => {
                      const originalChild = conf.tiles
                        .find((t: any) => t.id === 'subjects-list')
                        ?.children?.find((c: any) => c.id === child.id)

                      if (originalChild?.dynamicLabel && originalChild?.subjectType) {
                        const count = countsMap.get(originalChild.subjectType) ?? 0
                        const typeDef = typesMap.get(originalChild.subjectType)
                        const typeLabel = typeDef?.name || child.label
                        const icon = typeDef?.icon || child.icon || 'user'

                        if (count > 0) {
                          acc.push({
                            ...child,
                            label: `${typeLabel} (${count})`,
                            icon: icon,
                          })
                        }
                        return acc
                      }

                      acc.push(child)
                      return acc
                    }, []),
                  }
                }
                return tile
              })
            } catch (countErr) {
              console.error('Sidebar: Chyba při načítání počtů subjektů:', countErr)
            }
          }

          // Pro modul 040 (Nemovitosti) načteme počty podle typů a aktualizujeme children labels
          if (conf.id === '040-nemovitost' && Array.isArray(tiles)) {
            try {
              // Načíst počty podle property_type_id
              const counts = await getPropertyCountsByType(false)
              const countsMap = new Map(counts.map((c) => [c.property_type_id, c.count]))

              // Načíst property types z generic_types
              const propertyTypes = await listActiveByCategory('property_types')

              // Aktualizovat children v "Přehled nemovitostí" tile
              tiles = tiles.map((tile) => {
                if (tile.id === 'properties-list' && tile.children) {
                  return {
                    ...tile,
                    children: tile.children.reduce((acc: any[], child: any) => {
                      const originalChild = conf.tiles
                        .find((t: any) => t.id === 'properties-list')
                        ?.children?.find((c: any) => c.id === child.id)

                      if (originalChild?.dynamicLabel && originalChild?.propertyTypeCode) {
                        const propertyType = propertyTypes.find((t) => t.code === originalChild.propertyTypeCode)
                        const count = propertyType ? (countsMap.get(propertyType.id) ?? 0) : 0
                        const typeLabel = propertyType?.name || child.label
                        const icon = propertyType?.icon || child.icon || 'building'
                        const color = propertyType?.color || null

                        if (count > 0) {
                          acc.push({
                            ...child,
                            label: `${typeLabel} (${count})`,
                            icon: icon,
                            color: color,
                          })
                        }
                        return acc
                      }

                      acc.push(child)
                      return acc
                    }, []),
                  }
                }

                return tile
              })
            } catch (countErr) {
              console.error('Sidebar: Chyba při načítání počtů nemovitostí:', countErr)
            }

            // Samostatně zpracovat jednotky
            try {
              const unitCounts = await getUnitCountsByType(false)
              const unitCountsMap = new Map(unitCounts.map((c) => [c.unit_type_id, c.count]))
              const unitTypes = await listActiveByCategory('unit_types')

              tiles = tiles.map((tile: any) => {
                if (tile.id === 'units-list' && tile.children) {
                  return {
                    ...tile,
                    children: tile.children.reduce((acc: any[], child: any) => {
                      const originalChild = conf.tiles
                        .find((t: any) => t.id === 'units-list')
                        ?.children?.find((c: any) => c.id === child.id)

                      if (originalChild?.dynamicLabel && originalChild?.unitTypeCode) {
                        const unitType = unitTypes.find((t) => t.code === originalChild.unitTypeCode)
                        const count = unitType ? (unitCountsMap.get(unitType.id) ?? 0) : 0
                        const typeLabel = unitType?.name || child.label
                        const icon = unitType?.icon || child.icon || 'building'
                        const color = unitType?.color || null

                        if (count > 0) {
                          acc.push({
                            ...child,
                            label: `${typeLabel} (${count})`,
                            icon: icon,
                            color: color,
                          })
                        }
                        return acc
                      }

                      acc.push(child)
                      return acc
                    }, []),
                  }
                }
                return tile
              })
            } catch (countErr) {
              console.error('Sidebar: Chyba při načítání počtů jednotek:', countErr)
            }

            // Samostatně zpracovat katalog vybavení
            try {
              const equipmentCounts = await getEquipmentCatalogCountsByType(false)
              const equipmentCountsMap = new Map(equipmentCounts.map((c) => [c.equipment_type_id, c.count]))
              const equipmentTypes = await listActiveByCategory('equipment_types')

              tiles = tiles.map((tile: any) => {
                if (tile.id === 'equipment-catalog' && tile.children) {
                  return {
                    ...tile,
                    children: tile.children.reduce((acc: any[], child: any) => {
                      const originalChild = conf.tiles
                        .find((t: any) => t.id === 'equipment-catalog')
                        ?.children?.find((c: any) => c.id === child.id)

                      if (originalChild?.dynamicLabel && originalChild?.equipmentTypeCode) {
                        const equipmentType = equipmentTypes.find((t) => t.code === originalChild.equipmentTypeCode)
                        const count = equipmentType ? (equipmentCountsMap.get(equipmentType.id) ?? 0) : 0
                        const typeLabel = equipmentType?.name || child.label
                        const icon = equipmentType?.icon || child.icon || 'wrench'
                        const color = equipmentType?.color || null

                        if (count > 0) {
                          acc.push({
                            ...child,
                            label: `${typeLabel} (${count})`,
                            icon: icon,
                            color: color,
                          })
                        }
                        return acc
                      }

                      acc.push(child)
                      return acc
                    }, []),
                  }
                }
                return tile
              })
            } catch (countErr) {
              console.error('Sidebar: Chyba při načítání počtů vybavení:', countErr)
            }
          }

          // Pro modul 050 (Nájemníci) načteme počty podle typů a aktualizujeme children labels + ikony
          if (conf.id === '050-najemnik' && Array.isArray(tiles)) {
            try {
              // Načíst počty podle typů
              const counts = await getTenantCountsByType(false)
              const countsMap = new Map(counts.map((c) => [c.subject_type, c.count]))

              // Načíst typy subjektů z generic_types
              const subjectTypes = await listActiveByCategory('subject_types')
              const typesMap = new Map(subjectTypes.map((t) => [t.code, t]))

              // Aktualizovat children v "Přehled nájemníků" tile
              tiles = tiles.map((tile) => {
                if (tile.id === 'tenants-list' && tile.children) {
                  return {
                    ...tile,
                    children: tile.children.reduce((acc: any[], child: any) => {
                      const originalChild = conf.tiles
                        .find((t: any) => t.id === 'tenants-list')
                        ?.children?.find((c: any) => c.id === child.id)

                      if (originalChild?.dynamicLabel && originalChild?.subjectType) {
                        const count = countsMap.get(originalChild.subjectType) ?? 0
                        const typeDef = typesMap.get(originalChild.subjectType)
                        const typeLabel = typeDef?.name || child.label
                        const icon = typeDef?.icon || child.icon || 'user'

                        if (count > 0) {
                          acc.push({
                            ...child,
                            label: `${typeLabel} (${count})`,
                            icon: icon,
                          })
                        }
                        return acc
                      }

                      acc.push(child)
                      return acc
                    }, []),
                  }
                }
                return tile
              })
            } catch (countErr) {
              console.error('Sidebar: Chyba při načítání počtů nájemníků:', countErr)
            }
          }

          // Pro modul 070 (Služby) načteme počty podle typu služby a aktualizujeme children labels + ikony
          if (conf.id === '070-sluzby' && Array.isArray(tiles)) {
            try {
              const counts = await getServiceCatalogCountsByType(false)
              const countsMap = new Map(counts.map((c) => [c.category_id, c.count]))

              const serviceTypes = await listActiveByCategory('service_types')

              tiles = tiles.map((tile) => {
                if (tile.id === 'service-catalog' && tile.children) {
                  return {
                    ...tile,
                    children: tile.children.reduce((acc: any[], child: any) => {
                      const originalChild = conf.tiles
                        .find((t: any) => t.id === 'service-catalog')
                        ?.children?.find((c: any) => c.id === child.id)

                      if (originalChild?.dynamicLabel && originalChild?.serviceTypeCode) {
                        const typeDef = serviceTypes.find((t) => t.code === originalChild.serviceTypeCode)
                        const count = typeDef ? (countsMap.get(typeDef.id) ?? 0) : 0
                        const typeLabel = typeDef?.name || child.label
                        const icon = typeDef?.icon || child.icon || 'list'

                        if (count > 0) {
                          acc.push({
                            ...child,
                            label: `${typeLabel} (${count})`,
                            icon: icon,
                          })
                        }
                        return acc
                      }

                      acc.push(child)
                      return acc
                    }, []),
                  }
                }
                return tile
              })
            } catch (countErr) {
              console.error('Sidebar: Chyba při načítání počtů katalogu služeb:', countErr)
            }
          }

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
            tiles,
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
  // zajistíme, že jeho menu bude rozbalené a ostatní zavřené.
  useEffect(() => {
    if (!activeModuleId) {
      // Pokud není aktivní modul, zavřeme všechna menu
      setExpandedModuleId(null)
      setExpandedSectionId(null)
      setExpandedTileId(null)
      return
    }

    // ACCORDION: Otevřeme aktivní modul (pouze jeden)
    setExpandedModuleId(activeModuleId)
    
    // Pokud má aktivní modul sekci, otevřeme ji (pouze jednu)
    if (activeSelection?.sectionId) {
      setExpandedSectionId(activeSelection.sectionId)
    } else {
      setExpandedSectionId(null)
    }
    
    // ✅ Správa expandedTileId (3. úroveň - children filtry)
    if (activeSelection?.tileId) {
      const activeModule = modules.find(m => m.id === activeModuleId)
      
      // 1. Zjisti, jestli aktivní tile JE child nějakého parent tile
      const parentTile = activeModule?.tiles?.find(t => 
        t.children?.some(c => c.id === activeSelection.tileId)
      )
      
      if (parentTile) {
        // Aktivní tile JE child → nech parent otevřený (expandedTileId = parentTileId)
        setExpandedTileId(parentTile.id)
      } else {
        // Aktivní tile NENÍ child → je to root tile
        const activeTile = activeModule?.tiles?.find(t => t.id === activeSelection.tileId)
        
        // Pokud má vlastní children → otevři je
        if (activeTile?.children && activeTile.children.length > 0) {
          setExpandedTileId(activeSelection.tileId)
        } else {
          // Nemá children ani není child → zavři všechno
          setExpandedTileId(null)
        }
      }
    } else {
      // Žádný aktivní tile → zavři children
      setExpandedTileId(null)
    }
  }, [activeModuleId, activeSelection?.sectionId, activeSelection?.tileId, modules])

  const showIcons = uiConfig.showSidebarIcons

  // ACCORDION: Otevře/zavře modul (pouze jeden může být otevřený)
  function toggleModule(moduleId: string) {
    setExpandedModuleId((prev) => (prev === moduleId ? null : moduleId))
    // Zavřít podsekce když zavíráme modul
    if (expandedModuleId === moduleId) {
      setExpandedSectionId(null)
      setExpandedTileId(null)
    }
  }

  // ACCORDION: Otevře/zavře sekci (pouze jedna může být otevřená)
  function toggleSection(sectionId: string) {
    setExpandedSectionId((prev) => (prev === sectionId ? null : sectionId))
  }

  // ACCORDION: Otevře/zavře tile (pouze jeden může být otevřený)
  function toggleTile(tileId: string) {
    setExpandedTileId((prev) => (prev === tileId ? null : tileId))
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
              const isExpanded = expandedModuleId === m.id

              return (
                <li key={m.id} className="sidebar__item">
                  {/* 1. úroveň – modul */}
                  <div
                    className={
                      'sidebar__row' +
                      (isModuleActive(m) ? ' sidebar__row--active' : '') +
                      (disabled ? ' sidebar__row--disabled' : '')
                    }
                    onClick={(e) => {
                      // Kliknutí kdekoli na řádek = navigate + auto-expand (pokud má children)
                      handleSelect({ moduleId: m.id }, e)
                      if (hasSections || hasTiles) {
                        toggleModule(m.id)
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {(hasSections || hasTiles) && (
                      <button
                        type="button"
                        className={
                          'sidebar__toggle' +
                          (isExpanded ? ' sidebar__toggle--open' : '')
                        }
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSelect({ moduleId: m.id }, e)
                          toggleModule(m.id)
                        }}
                        aria-label={
                          isExpanded ? 'Skrýt podmenu' : 'Zobrazit podmenu'
                        }
                      >
                        ▸
                      </button>
                    )}

                    <div className="sidebar__link" style={{ flex: 1 }}>
                      {showIcons && m.icon && (
                        <span className="sidebar__icon">
                          {getIcon(m.icon as any)}
                        </span>
                      )}
                      <span className="sidebar__label">{m.label}</span>
                    </div>
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

                            const isSectionOpen = expandedSectionId === section.id

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
                                    // Auto-expand pokud má tiles
                                    if (sectionTiles.length > 0) {
                                      toggleSection(section.id)
                                    }
                                  }}
                                  style={{ cursor: 'pointer' }}
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
                                        handleSelect({
                                          moduleId: m.id,
                                          sectionId: section.id,
                                        })
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
                        // Modul NEMÁ sections → 2-level (modul → tiles s možnými children)
                        <ul className="sidebar__sublist">
                          {m.tiles!.map((t) => {
                            const isActiveTile = isTileActive(m, t)
                            const hasChildren = t.children && t.children.length > 0
                            const isTileOpen = expandedTileId === t.id

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
                                {/* 2. úroveň – tile row (stejná struktura jako section-row) */}
                                <div
                                  className="sidebar__sublink"
                                  onClick={() => {
                                    // Klik na tile naviguje + pokud má children, automaticky je otevře
                                    handleSelect({ moduleId: m.id, tileId: t.id })
                                    if (hasChildren) {
                                      toggleTile(t.id)
                                    }
                                  }}
                                  style={{ cursor: 'pointer' }}
                                >
                                  {hasChildren && (
                                    <button
                                      type="button"
                                      className={
                                        'sidebar__toggle' +
                                        (isTileOpen
                                          ? ' sidebar__toggle--open'
                                          : '')
                                      }
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleSelect({ moduleId: m.id, tileId: t.id })
                                        toggleTile(t.id)
                                      }}
                                      aria-label={
                                        isTileOpen
                                          ? 'Skrýt filtry'
                                          : 'Zobrazit filtry'
                                      }
                                    >
                                      ▸
                                    </button>
                                  )}

                                  {showIcons && t.icon && (
                                    <span className="sidebar__subicon">
                                      {getIcon(t.icon as any)}
                                    </span>
                                  )}

                                  <span className="sidebar__sublabel">
                                    {t.label}
                                  </span>
                                </div>

                                {/* 3. úroveň – children (filtry) pod tile */}
                                {isTileOpen && hasChildren && (
                                  <ul className="sidebar__subsublist">
                                    {t.children!.map((child) => {
                                      const isActiveChild =
                                        activeSelection?.moduleId === m.id &&
                                        activeSelection?.tileId === child.id

                                      return (
                                        <li
                                          key={child.id}
                                          className={
                                            'sidebar__subsubitem' +
                                            (isActiveChild
                                              ? ' sidebar__subsubitem--active'
                                              : '')
                                          }
                                        >
                                          <div
                                            className="sidebar__subsublink"
                                            onClick={() => {
                                              handleSelect({
                                                moduleId: m.id,
                                                tileId: child.id,
                                              })
                                            }}
                                            style={{ cursor: 'pointer' }}
                                          >
                                            {showIcons && child.icon && (
                                              <span 
                                                className="sidebar__subsubicon"
                                                style={child.color ? { color: child.color } : undefined}
                                              >
                                                {/* Pokud je icon emoji (1-2 znaky, např. 🏠), zobraz přímo, jinak použij getIcon() */}
                                                {child.icon.length <= 2 ? child.icon : getIcon(child.icon as any)}
                                              </span>
                                            )}
                                            <span className="sidebar__subsublabel">
                                              {child.label}
                                            </span>
                                          </div>
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
