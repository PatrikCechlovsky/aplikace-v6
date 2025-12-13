// FILE: app/UI/TopMenu.tsx
// PURPOSE: Horní menu – řádek 1 (moduly) + řádek 2 (sekce aktivního modulu)
// MVP: žádné dropdowny, žádné tiles – jen render + klik = aktivace

'use client'

import React from 'react'
import { getIcon } from './icons'

export type TopMenuSection = {
  id: string
  label: string
  icon?: string | null
  enabled?: boolean
  /** true = existuje další úroveň (tiles) → zobrazíme ▸, jinak placeholder */
  hasChildren?: boolean
}

export type TopMenuModule = {
  id: string
  label: string
  icon?: string | null
  enabled?: boolean
  /** true = existuje další úroveň (sekce) → zobrazíme ▸, jinak placeholder */
  hasChildren?: boolean
  /** Sekce modulu (level 2) */
  sections?: TopMenuSection[]
}

type TopMenuProps = {
  modules: TopMenuModule[]

  activeModuleId?: string
  activeSectionId?: string | null

  onSelectModule: (id: string) => void
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
  const visibleModules = (modules ?? []).filter((m) => m.enabled !== false)

  const activeModule =
    activeModuleId != null
      ? visibleModules.find((m) => m.id === activeModuleId) ?? null
      : null

  const visibleSections = (activeModule?.sections ?? []).filter(
    (s) => s.enabled !== false
  )

  return (
    <>
      {/* ŘÁDEK 1 – MODULY */}
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
                  {/* Šipka / placeholder – stejné zarovnání jako v Sidebaru */}
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

      {/* ŘÁDEK 2 – SEKCE aktivního modulu (jen pokud existují) */}
      {activeModule && visibleSections.length > 0 && (
        <nav className="topmenu topmenu--sections" aria-label="Sekce modulu">
          <ul className="topmenu__list topmenu__list--sections">
            {visibleSections.map((s) => {
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
                    {/* Šipka / placeholder – stejné zarovnání jako v Sidebaru */}
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
