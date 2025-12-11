/**
 * FILE: TopMenu.tsx
 * PATH: /app/UI/TopMenu.tsx
 * PURPOSE: Horní horizontální lišta modulů (Excel styl).
 */

'use client'

import React from 'react'

interface TopMenuModule {
  id: string
  label: string
  enabled?: boolean
}

interface TopMenuProps {
  modules: TopMenuModule[]
  activeModuleId?: string
  onSelectModule: (id: string) => void
}

const TopMenu: React.FC<TopMenuProps> = ({
  modules,
  activeModuleId,
  onSelectModule,
}) => {
  return (
    <nav className="topmenu">
      <ul className="topmenu__list">
        {modules
          .filter((m) => m.enabled !== false)
          .map((m) => {
            const isActive = m.id === activeModuleId

            return (
              <li
                key={m.id}
                className={
                  isActive
                    ? 'topmenu__item topmenu__item--active'
                    : 'topmenu__item'
                }
              >
                <button
                  type="button"
                  className="topmenu__button"
                  onClick={() => onSelectModule(m.id)}
                >
                  <span className="topmenu__label">{m.label}</span>
                </button>
              </li>
            )
          })}
      </ul>
    </nav>
  )
}

export default TopMenu
