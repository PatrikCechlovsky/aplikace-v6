/*
 * FILE: app/modules/900-nastaveni/sections/ThemeSettingsSection.tsx
 * PURPOSE: Sekce pro nastavení vzhledu aplikace (theme)
 */

'use client'

import ThemeSettingsTile from '../tiles/ThemeSettingsTile'

export default function ThemeSettingsSection() {
  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-xl font-semibold">Vzhled a téma</h2>
        <p className="text-sm text-gray-600">
          Nastavení barevného zobrazení, motivu a režimu aplikace.
        </p>
      </header>

      {/* Tady prostě přímo vykreslíme náš tile */}
      <div className="border rounded-lg p-4 bg-white">
        <ThemeSettingsTile />
      </div>
    </section>
  )
}
