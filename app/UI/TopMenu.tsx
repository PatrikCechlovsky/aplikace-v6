// FILE: app/UI/TopMenu.tsx

'use client'

import React from 'react'
import type { AppModuleConfig } from '../modules.types' // použij tvůj typ modulů

interface TopMenuProps {
  modules: AppModuleConfig[]
  activeModuleId: string | null
  onSelectModule: (id: string | null) => void
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
          .map((module) => (
            <li
              key={module.id}
              className={
                module.id === activeModuleId
                  ? 'topmenu__item topmenu__item--active'
                  : 'topmenu__item'
              }
            >
              <button
                type="button"
                className="topmenu__button"
                onClick={() => onSelectModule(module.id)}
              >
                {/* můžeš přidat ikonu, když budeš chtít */}
                <span className="topmenu__label">{module.label}</span>
              </button>
            </li>
          ))}
      </ul>
    </nav>
  )
}

export default TopMenu
