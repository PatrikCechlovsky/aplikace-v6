/*
 * FILE: app/modules/900-nastaveni/sections/IconSettingsSection.tsx
 * PURPOSE: Sekce pro nastavení ikon (konkrétně režimu zobrazení ikon v UI)
 */

'use client'

import IconDisplaySettingsTile from '../tiles/IconDisplaySettingsTile'

export default function IconSettingsSection() {
  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-xl font-semibold">Zobrazení ikon</h2>
        <p className="text-sm text-gray-600">
          Zvolte, zda chcete v aplikaci používat ikony + text, nebo jen textové
          popisky.
        </p>
      </header>

      <div className="border rounded-lg p-4 bg-white">
        <IconDisplaySettingsTile />
      </div>
    </section>
  )
}
