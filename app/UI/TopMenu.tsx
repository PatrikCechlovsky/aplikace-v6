// FILE: app/UI/TopMenu.tsx

import React from 'react'

export type TopMenuModule = {
  id: string
  label: string
  icon?: React.ReactNode
  enabled?: boolean
}

type TopMenuProps = {
  modules: TopMenuModule[]
  activeModuleId?: string
  onSelectModule: (id: string) => void
  showIcons?: boolean
}

export function TopMenu({
  modules,
  activeModuleId,
  onSelectModule,
  showIcons = true,
}: TopMenuProps) {
  return (
    <nav className="topmenu" aria-label="Hlavní moduly">
      <ul className="topmenu__list">
        {modules
          .filter((m) => m.enabled !== false)
          .map((m) => {
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
                  {showIcons && m.icon && (
                    <span className="topmenu__icon">{m.icon}</span>
                  )}
                  <span className="topmenu__label">{m.label}</span>
                </button>
              </li>
            )
          })}
      </ul>
    </nav>
  )
}
