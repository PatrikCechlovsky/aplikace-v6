'use client'

/*
 * FILE: app/UI/Sidebar.tsx
 * PURPOSE: Boční stromová navigace modulů – načítá module.config.js a zobrazuje 2 úrovně
 *          (1. modul, 2. overview + tiles). Žádná URL navigace, vše řeší parent (page.tsx).
 */

import React, { useEffect, useState } from 'react'
import { MODULE_SOURCES } from '@/app/modules.index'
import { getIcon, IconKey } from '@/app/UI/icons'

export type ModuleChildKind = 'overview' | 'tile'

export type ModuleChildConfig = {
  id: string
  label: string
  kind: ModuleChildKind
}

export type ModuleConfig = {
  id: string
  label: string
  icon?: IconKey
  order?: number
  enabled?: boolean
  children?: ModuleChildConfig[]
}

export type SidebarSelection =
  | { type: 'module'; moduleId: string; label?: string }
  | {
      type: ModuleChildKind
      moduleId: string
      itemId: string
      label?: string
    }


type SidebarProps = {
  /** externě řízené aktivní id modulu (volitelné) */
  activeModuleId?: string | null
  /** callback – starší API: informuje parent, že se změnil aktivní modul */
  onModuleSelect?: (moduleId: string) => void
  /** nové API: detailnější výběr (modul / overview / tile) */
  onSelectItem?: (selection: SidebarSelection) => void
  /** když je true, tlačítka se neklikají */
  disabled?: boolean
  /** má uživatel neuložené změny v aktuálním formuláři? */
  hasUnsavedChanges?: boolean
  /** volitelné – parent může vyčistit stav při potvrzeném odchodu */
  onDiscardChanges?: () => void
}

export default function Sidebar(props: SidebarProps) {
  const {
    activeModuleId,
    onModuleSelect,
    onSelectItem,
    disabled,
    hasUnsavedChanges = false,
    onDiscardChanges,
  } = props

  const [modules, setModules] = useState<ModuleConfig[]>([])
  const [internalActiveId, setInternalActiveId] = useState<string | null>(
    activeModuleId ?? null,
  )
  const [activeChild, setActiveChild] = useState<{
    moduleId: string
    kind: ModuleChildKind
    itemId: string
  } | null>(null)

  // když se zvenku změní activeModuleId, zarovnáme interní stav
  useEffect(() => {
    if (activeModuleId !== undefined) {
      setInternalActiveId(activeModuleId)
    }
  }, [activeModuleId])

  // načtení modulů z MODULE_SOURCES + overview/tiles
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

          const children: ModuleChildConfig[] = []

          // overview → typicky hlavní přehledy
          if (Array.isArray(cfg.overview)) {
            cfg.overview.forEach((item: any) => {
              if (!item?.id || !item?.label) return
              children.push({
                id: item.id,
                label: item.label,
                kind: 'overview',
              })
            })
          }

          // tiles → třeba číselníky, dashboardy...
          if (Array.isArray(cfg.tiles)) {
            cfg.tiles.forEach((item: any) => {
              if (!item?.id || !item?.label) return
              children.push({
                id: item.id,
                label: item.label,
                kind: 'tile',
              })
            })
          }

          loaded.push({
            id: cfg.id,
            label: cfg.label,
            icon: (cfg.icon ?? undefined) as IconKey | undefined,
            order: cfg.order ?? 0,
            enabled: cfg.enabled ?? true,
            children,
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
        onSelectItem?.({ type: 'module', moduleId: firstId })
      }
    }

    loadModules()

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function confirmNavigation(): boolean {
    if (!hasUnsavedChanges) return true
    const ok = window.confirm(
      'Máš neuložené změny. Opravdu chceš pokračovat bez uložení?',
    )
    if (ok) {
      onDiscardChanges?.()
    }
    return ok
  }

  function handleClickModule(moduleId: string) {
    if (disabled) return
    if (!confirmNavigation()) return

    setInternalActiveId(moduleId)
    setActiveChild(null)

    onModuleSelect?.(moduleId)
    onSelectItem?.({
      type: 'module',
      moduleId,
      label: modules.find((m) => m.id === moduleId)?.label,
    })
  }

  function handleClickChild(
    moduleId: string,
    kind: ModuleChildKind,
    itemId: string,
  ) {
    if (disabled) return
    if (!confirmNavigation()) return

    setInternalActiveId(moduleId)
    setActiveChild({ moduleId, kind, itemId })

    onModuleSelect?.(moduleId) // kvůli zpětné kompatibilitě
    onSelectItem?.({ type: kind, moduleId, itemId })
  }

  return (
    <aside className="layout__sidebar sidebar">
      {modules.map((mod) => {
        const isActiveModule = mod.id === internalActiveId

        return (
          <div key={mod.id} className="sidebar__module">
            {/* 1. úroveň – modul */}
            <button
              type="button"
              className={[
                'sidebar__item',
                'sidebar__item--module',
                isActiveModule ? 'sidebar__item--active' : '',
                disabled ? 'sidebar__item--disabled' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => handleClickModule(mod.id)}
            >
              <span className="sidebar__icon">
                {getIcon(mod.icon)}
              </span>
              <span className="sidebar__label">{mod.label}</span>
            </button>

            {/* 2. úroveň – overview + tiles vybraného modulu */}
            {isActiveModule && mod.children && mod.children.length > 0 && (
              <div className="sidebar__children">
                {mod.children.map((child) => {
                  const isActiveChild =
                    activeChild &&
                    activeChild.moduleId === mod.id &&
                    activeChild.itemId === child.id &&
                    activeChild.kind === child.kind

                  return (
                    <button
                      key={`${mod.id}__${child.kind}__${child.id}`}
                      type="button"
                      className={[
                        'sidebar__item',
                        'sidebar__item--child',
                        `sidebar__item--child-${child.kind}`,
                        isActiveChild ? 'sidebar__item--child-active' : '',
                        disabled ? 'sidebar__item--disabled' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() =>
                        handleClickChild(mod.id, child.kind, child.id)
                      }
                    >
                      <span className="sidebar__label sidebar__label--child">
                        {child.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </aside>
  )
}
