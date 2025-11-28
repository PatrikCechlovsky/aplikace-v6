// FILE: src/app/nastaveni/page.tsx
// PURPOSE: Stránka Nastavení – zatím jen číselník Typy subjektů

'use client'

import SubjectTypesTile from '../modules/900-nastaveni/tiles/SubjectTypesTile'

export default function NastaveniPage() {
  return (
    <div className="p-4 space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Nastavení</h1>
        <p className="text-sm text-gray-600">
          Správa číselníků a dalších systémových nastavení.
        </p>
      </header>

      <SubjectTypesTile />
    </div>
  )
}

