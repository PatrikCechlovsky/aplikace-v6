// FILE: app/UI/TopMenu.tsx

import React from 'react'
import { getIcon } from './icons'

export type TopMenuModule = {
  id: string
  label: string
  icon?: string | null
  enabled?: boolean
  hasChildren?: boolean
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
  )
}
