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
  showIcons?: boolean
}

const TopMenu: React.FC<TopMenuProps> = ({
  modules,
  activeModuleId,
  onSelectModule,
  showIcons = true,
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
-                  {/* Chevron */}
-                  {m.hasChildren && (
-                    <span className="topmenu__chevron" aria-hidden="true">
-                      ▾
-                    </span>
-                  )}
+                  {/* MVP: bez dropdownů → chevron schválně nezobrazujeme */}

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
  )
}

export default TopMenu
