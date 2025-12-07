/*
 * FILE: app/modules/900-nastaveni/sections/ThemeSettingsSection.tsx
 * PURPOSE: Sekce pro nastavení vzhledu aplikace (theme)
 */

'use client'

import ThemeSettingsTile from '../tiles/ThemeSettingsTile'
import { useAuth } from '@/app/auth/useAuth' // PŘÍKLAD – nahraď vlastním hookem

export default function ThemeSettingsSection() {
  const { user } = useAuth() // nebo odkud bereš přihlášeného uživatele

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-xl font-semibold">Vzhled a téma</h2>
        <p className="text-sm text-gray-600">
          Nastavení barevného zobrazení, motivu a režimu aplikace.
        </p>
      </header>

      <div className="border rounded-lg p-4 bg-white">
        <ThemeSettingsTile userId={user?.id} />
      </div>
    </section>
  )
}
