'use client'

// FILE: app/UI/TopMenu.tsx
// PHASE 2 (DESKTOP): Popover se sekcemi pod aktivním modulem
// - klik na modul: aktivuje modul + otevře popover (toggle)
// - klik na sekci: navigace + zavření
// - klik mimo: zavření
// Bez tiles, bez animací, bez dalších úrovní

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { getIcon } from './icons'

export type TopMenuSection = {
  id: string
  label: string
  icon?: string | null
  hasChildren?: boolean // zatím jen pro šipku/placeholder
}

export type TopMenuModule = {
  id: string
  label: string
  icon?: string | null
  enabled?: boolean
  hasChildren?: boolean
  sections?: TopMenuSection[]
}

type TopMenuProps = {
  modules: TopMenuModule[]

  activeModuleId?: string
  activeSectionId?: string | null

  onSelectModule: (moduleId: string) => void
  onSelectSection: (sectionId: string) => void

  showIcons?: boolean
}

export function TopMenu({
  modules,
  activeModuleId,
  activeSectionId = null,
  onSelectModule,
  onSelectSection,
  showIcons = true,
}: TopMenuProps) {
  // UI-only stav popoveru (ne navigace)
  const [openModuleId, setOpenModuleId] = useState<string | null>(null)

  // wrapper pro click-outside
  const rootRef = useRef<HTMLDivElement | null>(null)

  const visibleModules = useMemo(
    () => (modules ?? []).filter((m) => m.enabled !== false),
    [modules]
  )

  const activeModule = useMemo(() => {
    if (!activeModuleId) return null
    return visibleModules.find((m) => m.id === activeModuleId) ?? null
  }, [activeModuleId, visibleModules])

  const activeSections = activeModule?.sections ?? []
  const hasActiveSections = activeSections.length > 0

  // Když se aktivní modul změní externě (např. Sidebar), zavřeme popover
  useEffect(() => {
    setOpenModuleId(null)
  }, [activeModuleId])
  ``` :contentReference[oaicite:1]{index=1}
  
  ## Oprava
  Chceme zavírat popover **jen když se modul změní “externě”** (např. ze Sidebaru), ale **ne když klikneš v TopMenu**.
  
  Nejjednodušší: přidat “flag”, že změna pochází z TopMenu, a efekt ji pak ignoruje.
  
  ---
  
  # ✅ Patch – zkopíruj přesně tyto změny do `TopMenu.tsx`
  
  ### 1) Přidej `useRef` flag (hned pod `rootRef`)
  ```ts
  const lastChangeFromTopMenuRef = useRef(false)
  // click-outside → zavřít
  useEffect(() => {
    function onDocPointerDown(e: MouseEvent) {
      if (!openModuleId) return
      const root = rootRef.current
      if (!root) return
      const target = e.target as Node
      if (!root.contains(target)) {
        setOpenModuleId(null)
      }
    }
    document.addEventListener('mousedown', onDocPointerDown)
    return () => document.removeEventListener('mousedown', onDocPointerDown)
  }, [openModuleId])

  function handleModuleClick(moduleId: string, hasSections: boolean) {
    // 1) navigace (aktivní modul)
    onSelectModule(moduleId)

    // 2) UI: popover jen pokud modul má sekce
    if (!hasSections) {
      setOpenModuleId(null)
      return
    }

    // toggle pro stejný modul
    setOpenModuleId((prev) => (prev === moduleId ? null : moduleId))
  }

  function handleSectionClick(sectionId: string) {
    onSelectSection(sectionId)
    setOpenModuleId(null)
  }

  const isPopoverOpen =
    !!openModuleId && !!activeModuleId && openModuleId === activeModuleId

  return (
    <div ref={rootRef} className="topmenu-root">
      {/* ŘÁDEK 1 – MODULY */}
      <nav className="topmenu" aria-label="Hlavní moduly">
        <ul className="topmenu__list">
          {visibleModules.map((m) => {
            const isActive = m.id === activeModuleId
            const sections = m.sections ?? []
            const hasSections = sections.length > 0

            return (
              <li
                key={m.id}
                className={`topmenu__item ${
                  isActive ? 'topmenu__item--active' : ''
                }`}
              >
                <button
                  type="button"
                  className="topmenu__button"
                  aria-haspopup={hasSections ? 'menu' : undefined}
                  aria-expanded={isActive && isPopoverOpen ? true : undefined}
                  onClick={() => handleModuleClick(m.id, hasSections)}
                >
                  {/* Šipka / placeholder – drží zarovnání */}
                  <span
                    className={
                      'topmenu__chevron' +
                      (m.hasChildren ? '' : ' topmenu__chevron--placeholder')
                    }
                    aria-hidden="true"
                  >
                    ▸
                  </span>

                  {showIcons && m.icon && (
                    <span className="topmenu__icon">
                      {getIcon(m.icon as any)}
                    </span>
                  )}

                  <span className="topmenu__label">{m.label}</span>
                </button>

                {/* POPOVER – jen pro aktivní modul a jen když má sekce */}
                {isActive && isPopoverOpen && hasActiveSections && (
                  <div className="topmenu__popover" role="menu">
                    <ul className="topmenu__popover-list">
                      {activeSections.map((s) => {
                        const isSectionActive = s.id === activeSectionId

                        return (
                          <li key={s.id} className="topmenu__popover-item">
                            <button
                              type="button"
                              className={
                                'topmenu__popover-button' +
                                (isSectionActive
                                  ? ' topmenu__popover-button--active'
                                  : '')
                              }
                              role="menuitem"
                              onClick={() => handleSectionClick(s.id)}
                            >
                              <span
                                className={
                                  'topmenu__chevron' +
                                  (s.hasChildren
                                    ? ''
                                    : ' topmenu__chevron--placeholder')
                                }
                                aria-hidden="true"
                              >
                                ▸
                              </span>

                              {showIcons && s.icon && (
                                <span className="topmenu__icon">
                                  {getIcon(s.icon as any)}
                                </span>
                              )}

                              <span className="topmenu__label">{s.label}</span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
