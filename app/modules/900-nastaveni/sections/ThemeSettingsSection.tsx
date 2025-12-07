/*
 * FILE: app/modules/900-nastaveni/sections/ThemeSettingsSection.tsx
 * PURPOSE: Sekce pro nastavení vzhledu aplikace (theme)
 */

'use client'

import { useModuleContext } from '@/app/modules/ModuleContext'

export default function ThemeSettingsSection() {
  const { tiles } = useModuleContext()

  // vybereme jen dlaždice, které patří do této sekce
  const sectionTiles = tiles.filter((tile) => tile.sectionId === 'theme-settings')

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-xl font-semibold">Vzhled a téma</h2>
        <p className="text-sm text-gray-600">
          Nastavení barevného zobrazení, motivu a režimu aplikace.
        </p>
      </header>

      <div className="space-y-4">
        {sectionTiles.length === 0 && (
          <p className="text-sm text-gray-500">
            Zatím zde nejsou žádné položky k nastavení.
          </p>
        )}

        {/* vykreslíme všechny tiles, které patří do této sekce */}
        {sectionTiles.map((tile) => {
          const Component = tile.component
          return (
            <div key={tile.id} className="border rounded-lg p-4 bg-white">
              <Component />
            </div>
          )
        })}
      </div>
    </section>
  )
}
