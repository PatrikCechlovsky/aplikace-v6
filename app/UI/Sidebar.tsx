'use client'

/*
 * FILE: app/UI/Sidebar.tsx
 * PURPOSE: Boční menu modulů – načítá module.config.js a neprovádí žádnou URL navigaci.
 */

import React, { useEffect, useState } from 'react'
import { MODULE_SOURCES } from '@/app/modules.index'
import { getIcon, IconKey } from '@/app/UI/icons'

export type ModuleConfig = {
  id: string
  label: string
  icon?: IconKey
  order?: number
  enabled?: boolean
}

type SidebarProps = {
  /** externě řízené aktivní id modulu (volitelné) */
  activeModuleId?: string | null
  /** callback – informuje parent, že uživatel klikl na modul */
  onModuleSelect?: (moduleId: string) => void
  /** když je true, tlačítka se neklikají */
  disabled?: boolean
}

export default function Sidebar(props: SidebarProps) {
  const { activeModuleId, onModuleSelect, disabled } = props

  const [modules, setModules] = useState<ModuleConfig[]>([])
  const [internalActiveId, setInternalActiveId] = useState<string | null>(
    activeModuleId ?? null,
  )

  // když se zvenku změní activeModuleId, zarovnáme interní stav
  useEffect(() => {
    if (activeModuleId !== undefined) {
      setInternalActiveId(activeModuleId)
    }
  }, [activeModuleId])

  // načtení modulů z MODULE_SOURCES
  useEffect(() => {
    let isMounted = true

    async function loadModules() {
      const loaded: ModuleConfig[] = []

      for (const loader of MODULE_SOURCES) {
        try {
          const mod = await loader()
          const cfg = mod.default as any

          if (!cfg) continue
          if (cfg.enabled === false) continue

          loaded.push({
            id: cfg.id,
            label: cfg.label,
            icon: (cfg.icon ?? undefined) as IconKey | undefined,
            order: cfg.order ?? 0,
            enabled: cfg.enabled ?? true,
          })
        } catch (error) {
          console.error('Sidebar – chyba při načítání modulu', error)
        }
      }

      if (!isMounted) return

      loaded.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      setModules(loaded)

      // pokud není nastavený aktivní modul, vezmeme první
      if (!internalActiveId && loaded.length > 0) {
        const firstId = loaded[0].id
        setInternalActiveId(firstId)
        onModuleSelect?.(firstId)
      }
    }

    loadModules()

    return () => {
      isMounted = false
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleClickModule(moduleId: string) {
    if (disabled) return
    setInternalActiveId(moduleId)
    onModuleSelect?.(moduleId)
  }

  return (
    <aside className="layout__sidebar sidebar">
      {modules.map((mod) => {
        const isActive = mod.id === internalActiveId

        const className = [
          'sidebar__item',
          isActive ? 'sidebar__item--active' : '',
          disabled ? 'sidebar__item--disabled' : '',
        ]
          .filter(Boolean)
          .join(' ')

        return (
          <button
            key={mod.id}
            type="button"
            className={className}
            onClick={() => handleClickModule(mod.id)}
          >
            <span className="sidebar__icon">
              {getIcon(mod.icon)}
            </span>
            <span className="sidebar__label">{mod.label}</span>
          </button>
        )
      })}
    </aside>
  )
}
