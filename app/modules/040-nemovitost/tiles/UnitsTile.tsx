'use client'

// FILE: app/modules/040-nemovitost/tiles/UnitsTile.tsx
// PURPOSE: Seznam jednotek s filtry + detail

import React from 'react'

export default function UnitsTile() {
  return (
    <div style={{ padding: '20px' }}>
      <h2>🚪 Units Tile - v implementaci</h2>
      <p>List + detail frame pro jednotky</p>
      <ul>
        <li>✅ Services vrstva ready (units.ts)</li>
        <li>⏳ ListView + UnitDetailFrame</li>
        <li>⏳ Filtry: property, unitType, status</li>
        <li>⏳ Detail s tabs: základní info, nájemníci, vybavení</li>
        <li>⏳ Status colors: 🔴 obsazená, 🟢 volná, 🟡 rezervovaná, 🟤 v rekonstrukci</li>
      </ul>
    </div>
  )
}
