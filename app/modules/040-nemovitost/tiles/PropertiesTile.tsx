'use client'

// FILE: app/modules/040-nemovitost/tiles/PropertiesTile.tsx
// PURPOSE: Seznam nemovitostí s filtry + detail

import React from 'react'

export default function PropertiesTile() {
  return (
    <div style={{ padding: '20px' }}>
      <h2>🏗️ Properties Tile - v implementaci</h2>
      <p>List + detail frame pro nemovitosti</p>
      <ul>
        <li>✅ Services vrstva ready (properties.ts)</li>
        <li>⏳ ListView + PropertyDetailFrame</li>
        <li>⏳ Filtry: landlord, propertyType, region</li>
        <li>⏳ Detail s tabs: základní info, jednotky, vybavení</li>
      </ul>
    </div>
  )
}
