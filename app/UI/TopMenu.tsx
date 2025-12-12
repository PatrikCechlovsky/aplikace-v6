// app/UI/TopMenu.tsx

'use client'

import React from 'react'
import { getIcon } from './icons'
import type { IconKey } from './icons'

interface TopMenuModule {
  id: string
  label: string
  enabled?: boolean
  hasChildren?: boolean
  icon?: string // ✅ NOVĚ (např. '⚙️' nebo '🏠')
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
    <nav className="topmenu" aria-label="Hlavní moduly">
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
                  {/* Chevron */}
                  {m.hasChildren && (
                    <span className="topmenu__chevron" aria-hidden="true">
                      ▾
                    </span>
                  )}

                  {/* ✅ Ikona */}
                  {m.icon && <span className="topmenu__icon">{m.icon}</span>}

                  {/* Label */}
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
