/*
 * FILE: app/modules/900-nastaveni/sections/TypesSettingsSection.tsx
 * PURPOSE: Sekce "Nastavení typů" – obsahuje všechny typové číselníky
 */

'use client'

import SubjectTypesTile from '../tiles/SubjectTypesTile'
// později přibude:
// import UnitTypesTile from '../tiles/UnitTypesTile'
// import ServiceTypesTile from '../tiles/ServiceTypesTile'

export default function TypesSettingsSection() {
  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-xl font-semibold">Nastavení typů</h2>
        <p className="text-sm text-gray-600">
          Číselníky pro typy subjektů, nemovitostí, jednotek, služeb…
        </p>
      </header>

      <div className="space-y-6">
        {/* 1️⃣ první typ – už existuje */}
        <SubjectTypesTile />

        {/* 2️⃣ další typy přidáš jen jako další řádky: */}
        {/* <UnitTypesTile /> */}
        {/* <ServiceTypesTile /> */}
      </div>
    </section>
  )
}
