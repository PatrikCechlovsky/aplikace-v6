'use see client'

// FILE: app/UI/TopMenu.tsx
// DESKTOP POPOVER (PORTAL):
// - modul → otevře popover
// - pokud má sections → zobrazí sections
// - jinak → zobrazí tiles
// - klik → navigace + zavření

import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { getIcon } from './icons'

/* ===== TYPY ===== */

export type TopMenuSection = {
  id: string
  label: string
  icon?: string | null
}

export type TopMenuTile = {
  id: string
  label: string
  icon?: string | null
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
}

/* ===== KOMPONENTA ===== */

export function TopMenu({
  modules,
  activeModuleId,
  activeSectionId = null,
  activeTileId = null,
  onSelectModule,
  onSelectSection,
  onSelectTile,
}: TopMenuProps) {
  const [openModuleId, setOpenModuleId] = useState<string | null>(null)
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null)
  const [portalReady, setPortalReady] = useState(false)

  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const popoverRef = useRef<HTMLDivElement | null>(null)

  const visibleModules = useMemo(
    () => (modules ?? []).filter((m) => m.enabled !== false),
    [modules]
  )

  const activeModule = useMemo(
    () => visibleModules.find((m) => m.id === activeModuleId) ?? null,
    [visibleModules, activeModuleId]
  )

  const sections = activeModule?.sections ?? []
  const tiles = activeModule?.tiles ?? []

  const hasSections = sections.length > 0
  const hasTiles = tiles.length > 0

  const isPopoverOpen =
    !!openModuleId &&
    openModuleId === activeModuleId &&
    (hasSections || hasTiles)

  /* ===== PORTAL READY ===== */
  useEffect(() => setPortalReady(true), [])

  /* ===== POZICE ===== */
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

    setPos({ top, left, width })
  }

  useLayoutEffect(() => {
    if (isPopoverOpen) recomputePos()
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
  }, [isPopoverOpen, activeModuleId])

  /* ===== CLOSE ===== */
  useEffect(() => {
    if (!isPopoverOpen) return

    function onDown(e: MouseEvent) {
      const t = e.target as Node
      if (popoverRef.current?.contains(t)) return
      if (
        activeModuleId &&
        buttonRefs.current[activeModuleId]?.contains(t)
      )
        return
      setOpenModuleId(null)
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpenModuleId(null)
    }

    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [isPopoverOpen, activeModuleId])

  /* ===== HANDLERY ===== */
  function handleModuleClick(id: string, hasChildren: boolean) {
    onSelectModule(id)
    if (!hasChildren) {
      setOpenModuleId(null)
      return
    }
    setOpenModuleId((prev) => (prev === id ? null : id))
  }

  function handleSectionClick(id: string) {
    onSelectSection(id)
    setOpenModuleId(null)
  }

  function handleTileClick(id: string) {
    onSelectTile(id)
    setOpenModuleId(null)
  }

  /* ===== RENDER ===== */
  return (
    <>
      <nav className="topmenu">
        <ul className="topmenu__list">
          {visibleModules.map((m) => {
            const hasChildren =
              (m.sections?.length ?? 0) > 0 || (m.tiles?.length ?? 0) > 0
            return (
              <li key={m.id} className="topmenu__item">
                <button
                  ref={(el) => (buttonRefs.current[m.id] = el)}
                  className="topmenu__button"
                  onClick={() => handleModuleClick(m.id, hasChildren)}
                >
                  <span className="topmenu__chevron">▸</span>
                  {m.icon && <span>{getIcon(m.icon as any)}</span>}
                  {m.label}
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
            style={{
              position: 'fixed',
              top: pos.top,
              left: pos.left,
              width: pos.width,
              zIndex: 2000,
            }}
          >
            <ul>
              {hasSections &&
                sections.map((s) => (
                  <li key={s.id}>
                    <button onClick={() => handleSectionClick(s.id)}>
                      {s.icon && getIcon(s.icon as any)} {s.label}
                    </button>
                  </li>
                ))}

              {!hasSections &&
                tiles.map((t) => (
                  <li key={t.id}>
                    <button onClick={() => handleTileClick(t.id)}>
                      {t.icon && getIcon(t.icon as any)} {t.label}
                    </button>
                  </li>
                ))}
            </ul>
          </div>,
          document.body
        )}
    </>
  )
}
