'use client'

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { getIcon } from './icons'

export type TopMenuSection = {
  id: string
  label: string
  icon?: string | null
}

export type TopMenuTile = {
  id: string
  label: string
  icon?: string | null
  sectionId?: string | null
}

export type TopMenuModule = {
  id: string
  label: string
  icon?: string | null
  enabled?: boolean
  hasChildren?: boolean
  sections?: TopMenuSection[]
  tiles?: TopMenuTile[]
}

type TopMenuProps = {
  modules: TopMenuModule[]
  activeModuleId?: string
  activeSectionId?: string | null
  activeTileId?: string | null
  onSelectModule: (moduleId: string) => void
  onSelectSection: (sectionId: string) => void
  onSelectTile: (tileId: string) => void
  showIcons?: boolean
}

type PopoverPos = { top: number; left: number; width: number }
type PopoverView =
  | { kind: 'root' } // sekce nebo (fallback) tiles
  | { kind: 'sectionTiles'; sectionId: string }

export function TopMenu({
  modules,
  activeModuleId,
  activeSectionId = null,
  activeTileId = null,
  onSelectModule,
  onSelectSection,
  onSelectTile,
  showIcons = true,
}: TopMenuProps) {
  const [openModuleId, setOpenModuleId] = useState<string | null>(null)
  const [pos, setPos] = useState<PopoverPos | null>(null)
  const [portalReady, setPortalReady] = useState(false)
  const [view, setView] = useState<PopoverView>({ kind: 'root' })

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

  const sections = activeModule?.sections ?? []
  const tiles = activeModule?.tiles ?? []
  const hasSections = sections.length > 0
  const hasTiles = tiles.length > 0

  const isPopoverOpen =
    !!openModuleId &&
    !!activeModuleId &&
    openModuleId === activeModuleId &&
    (hasSections || hasTiles)

  useEffect(() => setPortalReady(true), [])

  // když se aktivní modul změní (sidebar apod.), zavři + reset view
  useEffect(() => {
    setOpenModuleId(null)
    setView({ kind: 'root' })
  }, [activeModuleId])

  function recomputePos() {
    if (!activeModuleId) return
    const btn = buttonRefs.current[activeModuleId]
    if (!btn) return

    const r = btn.getBoundingClientRect()
    const margin = 8
    const minW = 240
    const maxW = 320

    const viewportMax = Math.max(0, window.innerWidth - margin * 2)
    const width = Math.min(maxW, Math.max(minW, viewportMax))

    const desiredLeft = r.left
    const maxLeft = window.innerWidth - margin - width
    const left = Math.max(margin, Math.min(desiredLeft, maxLeft))
    const top = r.bottom + 6

    setPos({ top: Math.round(top), left: Math.round(left), width: Math.round(width) })
  }

  useLayoutEffect(() => {
    if (!isPopoverOpen) return
    recomputePos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPopoverOpen, activeModuleId])

  useEffect(() => {
    if (!isPopoverOpen) return
    const on = () => recomputePos()
    window.addEventListener('resize', on)
    window.addEventListener('scroll', on, true)
    return () => {
      window.removeEventListener('resize', on)
      window.removeEventListener('scroll', on, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPopoverOpen, activeModuleId])

  // click-outside + ESC
  useEffect(() => {
    if (!isPopoverOpen) return

    function onDown(e: MouseEvent) {
      const t = e.target as Node
      if (popoverRef.current?.contains(t)) return
      const btn = activeModuleId ? buttonRefs.current[activeModuleId] : null
      if (btn && btn.contains(t)) return
      setOpenModuleId(null)
      setView({ kind: 'root' })
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpenModuleId(null)
        setView({ kind: 'root' })
      }
    }

    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [isPopoverOpen, activeModuleId])

  function handleModuleClick(moduleId: string, hasChildren: boolean) {
    onSelectModule(moduleId)

    if (!hasChildren) {
      setOpenModuleId(null)
      setView({ kind: 'root' })
      return
    }

    setOpenModuleId((prev) => (prev === moduleId ? null : moduleId))
    setView({ kind: 'root' })
  }

  function handleSectionClick(sectionId: string) {
    // sekce se jen rozbalí (tiles uvnitř popoveru), ale zároveň nastavíme activeSection pro breadcrumb
    onSelectSection(sectionId)
    setView({ kind: 'sectionTiles', sectionId })
  }

  function handleTileClick(tileId: string) {
    onSelectTile(tileId)
    setOpenModuleId(null)
    setView({ kind: 'root' })
  }

  const tilesForSection =
    view.kind === 'sectionTiles'
      ? tiles.filter((t) => (t.sectionId ?? null) === view.sectionId)
      : []

  const sectionTitle =
    view.kind === 'sectionTiles'
      ? sections.find((s) => s.id === view.sectionId)?.label ?? ''
      : ''

  return (
    <>
      <nav className="topmenu" aria-label="Hlavní moduly">
        <ul className="topmenu__list">
          {visibleModules.map((m) => {
            const mHasChildren = (m.sections?.length ?? 0) > 0 || (m.tiles?.length ?? 0) > 0
            const isActive = m.id === activeModuleId

            return (
              <li key={m.id} className={`topmenu__item ${isActive ? 'topmenu__item--active' : ''}`}>
                <button
                  ref={(el) => {
                    buttonRefs.current[m.id] = el
                  }}
                  type="button"
                  className="topmenu__button"
                  aria-haspopup={mHasChildren ? 'menu' : undefined}
                  aria-expanded={isActive && isPopoverOpen ? true : undefined}
                  onClick={() => handleModuleClick(m.id, mHasChildren)}
                >
                  <span
                    className={'topmenu__chevron' + (mHasChildren ? '' : ' topmenu__chevron--placeholder')}
                    aria-hidden="true"
                  >
                    ▸
                  </span>

                  {showIcons && m.icon && <span className="topmenu__icon">{getIcon(m.icon as any)}</span>}
                  <span className="topmenu__label">{m.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

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
              width: pos.width,
              zIndex: 2000,
            }}
          >
            {view.kind === 'sectionTiles' ? (
              <>
                <button
                  type="button"
                  className="topmenu__popover-button"
                  onClick={() => setView({ kind: 'root' })}
                >
                  <span className="topmenu__chevron" aria-hidden="true">◂</span>
                  <span className="topmenu__label">Zpět</span>
                </button>

                <div style={{ padding: '4px 10px 8px', fontWeight: 600 }}>{sectionTitle}</div>

                <ul className="topmenu__popover-list">
                  {tilesForSection.map((t) => {
                    const isActive = t.id === activeTileId
                    return (
                      <li key={t.id} className="topmenu__popover-item">
                        <button
                          type="button"
                          role="menuitem"
                          className={'topmenu__popover-button' + (isActive ? ' topmenu__popover-button--active' : '')}
                          onClick={() => handleTileClick(t.id)}
                        >
                          <span className="topmenu__chevron topmenu__chevron--placeholder" aria-hidden="true">▸</span>
                          {showIcons && t.icon && <span className="topmenu__icon">{getIcon(t.icon as any)}</span>}
                          <span className="topmenu__label">{t.label}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </>
            ) : (
              <ul className="topmenu__popover-list">
                {hasSections
                  ? sections.map((s) => {
                      const isActive = s.id === activeSectionId
                      const hasSectionTiles = tiles.some((t) => (t.sectionId ?? null) === s.id)

                      return (
                        <li key={s.id} className="topmenu__popover-item">
                          <button
                            type="button"
                            role="menuitem"
                            className={'topmenu__popover-button' + (isActive ? ' topmenu__popover-button--active' : '')}
                            onClick={() => handleSectionClick(s.id)}
                          >
                            <span
                              className={'topmenu__chevron' + (hasSectionTiles ? '' : ' topmenu__chevron--placeholder')}
                              aria-hidden="true"
                            >
                              ▸
                            </span>

                            {showIcons && s.icon && <span className="topmenu__icon">{getIcon(s.icon as any)}</span>}
                            <span className="topmenu__label">{s.label}</span>
                          </button>
                        </li>
                      )
                    })
                  : tiles.map((t) => {
                      // fallback pro 010 (modul bez sekcí)
                      const isActive = t.id === activeTileId
                      return (
                        <li key={t.id} className="topmenu__popover-item">
                          <button
                            type="button"
                            role="menuitem"
                            className={'topmenu__popover-button' + (isActive ? ' topmenu__popover-button--active' : '')}
                            onClick={() => handleTileClick(t.id)}
                          >
                            <span className="topmenu__chevron topmenu__chevron--placeholder" aria-hidden="true">▸</span>
                            {showIcons && t.icon && <span className="topmenu__icon">{getIcon(t.icon as any)}</span>}
                            <span className="topmenu__label">{t.label}</span>
                          </button>
                        </li>
                      )
                    })}
              </ul>
            )}
          </div>,
          document.body
        )}
    </>
  )
}
