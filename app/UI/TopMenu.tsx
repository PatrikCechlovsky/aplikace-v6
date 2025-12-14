'use client'

// FILE: app/UI/TopMenu.tsx
// PHASE 2 (DESKTOP): Popover se sekcemi přes PORTAL do document.body
// - klik na modul: aktivuje modul + otevře popover (toggle)
// - klik na sekci: navigace + zavření
// - klik mimo / ESC: zavření
// Bez tiles, bez animací

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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

type PopoverPos = {
  top: number
  left: number
  width: number
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
  const [pos, setPos] = useState<PopoverPos | null>(null)
  const [portalReady, setPortalReady] = useState(false)

  // refs pro ukotvení a pro click-outside
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const popoverRef = useRef<HTMLDivElement | null>(null)

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

  // portal readiness (Next/SSR safe)
  useEffect(() => {
    setPortalReady(true)
  }, [])

  const isPopoverOpen =
    !!openModuleId && !!activeModuleId && openModuleId === activeModuleId && hasActiveSections

  // spočítat pozici popoveru podle tlačítka aktivního modulu
  function recomputePos() {
    if (!activeModuleId) return
    const btn = buttonRefs.current[activeModuleId]
    if (!btn) return
  
    const r = btn.getBoundingClientRect()
  
    const margin = 8
    const minW = 240
    const maxW = 320
  
    // šířku panelu volíme rozumně + nesmí být širší než viewport - okraje
    const viewportMax = Math.max(0, window.innerWidth - margin * 2)
    const width = Math.min(maxW, Math.max(minW, Math.min(viewportMax, r.width)))
  
    // preferujeme zarovnání na tlačítko, ale "clamp" do viewportu
    const desiredLeft = r.left
    const maxLeft = window.innerWidth - margin - width
    const left = Math.max(margin, Math.min(desiredLeft, maxLeft))
  
    const top = Math.round(r.bottom + 6)
  
    setPos({ top: Math.round(top), left: Math.round(left), width: Math.round(width) })
   }

  // při otevření / změně aktivního modulu dopočítat pozici
  useLayoutEffect(() => {
    if (!isPopoverOpen) return
    recomputePos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPopoverOpen, activeModuleId])

  // když se scrolluje/resize, držet popover na správném místě
  useEffect(() => {
    if (!isPopoverOpen) return

    const on = () => recomputePos()
    window.addEventListener('resize', on)
    // scroll může probíhat i v nestandardních containerech → zachytíme v capture
    window.addEventListener('scroll', on, true)

    return () => {
      window.removeEventListener('resize', on)
      window.removeEventListener('scroll', on, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPopoverOpen, activeModuleId])

  // click-outside + ESC → zavřít
  useEffect(() => {
    if (!isPopoverOpen) return

    function onDocMouseDown(e: MouseEvent) {
      const target = e.target as Node
      const pop = popoverRef.current
      if (pop && pop.contains(target)) return

      // klik na tlačítko aktivního modulu je "toggle", to řeší handler tlačítka
      const btn = activeModuleId ? buttonRefs.current[activeModuleId] : null
      if (btn && btn.contains(target)) return

      setOpenModuleId(null)
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpenModuleId(null)
    }

    document.addEventListener('mousedown', onDocMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isPopoverOpen, activeModuleId])

  function handleModuleClick(moduleId: string, hasSections: boolean) {
    // navigace (aktivní modul)
    onSelectModule(moduleId)

    // popover jen když modul má sekce
    if (!hasSections) {
      setOpenModuleId(null)
      return
    }

    // toggle
    setOpenModuleId((prev) => (prev === moduleId ? null : moduleId))
  }

  function handleSectionClick(sectionId: string) {
    onSelectSection(sectionId)
    setOpenModuleId(null)
  }

  return (
    <>
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
                className={`topmenu__item ${isActive ? 'topmenu__item--active' : ''}`}
              >
                <button
                  ref={(el) => {
                    buttonRefs.current[m.id] = el
                  }}
                  type="button"
                  className="topmenu__button"
                  aria-haspopup={hasSections ? 'menu' : undefined}
                  aria-expanded={isActive && isPopoverOpen ? true : undefined}
                  onClick={() => handleModuleClick(m.id, hasSections)}
                >
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
                    <span className="topmenu__icon">{getIcon(m.icon as any)}</span>
                  )}

                  <span className="topmenu__label">{m.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* PORTAL POPOVER */}
      {portalReady && isPopoverOpen && pos &&
        createPortal(
          <div
            ref={popoverRef}
            className="topmenu__popover"
            role="menu"
            style={{
              position: 'fixed',
              top: pos.top,
              left: pos.left,
              minWidth: 240,
              maxWidth: 320,
              width: pos.width,
              zIndex: 2000,
            }}
          >
            <ul className="topmenu__popover-list">
              {activeSections.map((s) => {
                const isSectionActive = s.id === activeSectionId
                return (
                  <li key={s.id} className="topmenu__popover-item">
                    <button
                      type="button"
                      className={
                        'topmenu__popover-button' +
                        (isSectionActive ? ' topmenu__popover-button--active' : '')
                      }
                      role="menuitem"
                      onClick={() => handleSectionClick(s.id)}
                    >
                      <span
                        className={
                          'topmenu__chevron' +
                          (s.hasChildren ? '' : ' topmenu__chevron--placeholder')
                        }
                        aria-hidden="true"
                      >
                        ▸
                      </span>

                      {showIcons && s.icon && (
                        <span className="topmenu__icon">{getIcon(s.icon as any)}</span>
                      )}

                      <span className="topmenu__label">{s.label}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>,
          document.body
        )}
    </>
  )
}

