'use client'

// FILE: app/UI/TopMenu.tsx
// PURPOSE:
// TopMenu = jiný pohled na stejný navigační stav jako Sidebar
// ŘÁDEK 1: Moduly
// ŘÁDEK 2: Sekce aktivního modulu
// (tiles až později)

import React from 'react'
import { getIcon } from './icons'

/* =======================
   TYPY – STEJNÉ JAKO SIDEBAR
   ======================= */

export type TopMenuSection = {
  id: string
  label: string
  icon?: string | null
  /** má sekce tiles? → zobrazíme šipku */
  hasChildren?: boolean
}

export type TopMenuModule = {
  id: string
  label: string
  icon?: string | null
  enabled?: boolean

  /** má modul sekce nebo tiles? → zobrazíme šipku */
  hasChildren?: boolean

  /** sekce modulu (level 2) */
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

/* =======================
   KOMPONENTA
   ======================= */

export function TopMenu({
  modules,
  activeModuleId,
  activeSectionId = null,
  onSelectModule,
  onSelectSection,
  showIcons = true,
}: TopMenuProps) {
  const visibleModules = (modules ?? []).filter((m) => m.enabled !== false)

  const activeModule =
    activeModuleId != null
      ? visibleModules.find((m) => m.id === activeModuleId) ?? null
      : null

  const sections = activeModule?.sections ?? []

  return (
    <>
      {/* =======================
          ŘÁDEK 1 – MODULY
         ======================= */}
      <nav className="topmenu" aria-label="Hlavní moduly">
        <ul className="topmenu__list">
          {visibleModules.map((m) => {
            const isActive = m.id === activeModuleId

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
                  onClick={() => onSelectModule(m.id)}
                >
                  {/* Šipka / placeholder – STEJNĚ JAKO SIDEBAR */}
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
              </li>
            )
          })}
        </ul>
      </nav>

      {/* =======================
          ŘÁDEK 2 – SEKCE
         ======================= */}
      {activeModule && sections.length > 0 && (
        <nav className="topmenu topmenu--sections" aria-label="Sekce modulu">
          <ul className="topmenu__list topmenu__list--sections">
            {sections.map((s) => {
              const isActive = s.id === activeSectionId

              return (
                <li
                  key={s.id}
                  className={`topmenu__item ${
                    isActive ? 'topmenu__item--active' : ''
                  }`}
                >
                  <button
                    type="button"
                    className="topmenu__button"
                    onClick={() => onSelectSection(s.id)}
                  >
                    {/* Šipka / placeholder – STEJNĚ JAKO SIDEBAR */}
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
        </nav>
      )}
    </>
  )
}
