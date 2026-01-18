'use client'

// FILE: app/modules/040-nemovitost/tiles/EquipmentTile.tsx
// PURPOSE: Katalog vybavení + vazby na properties a units

import React from 'react'

export default function EquipmentTile() {
  return (
    <div style={{ padding: '20px' }}>
      <h2>🛠️ Equipment Tile - v implementaci</h2>
      <p>Katalog vybavení + správa vazeb</p>
      <ul>
        <li>✅ Services vrstva ready (equipment.ts)</li>
        <li>⏳ ListView + EquipmentDetailFrame</li>
        <li>⏳ Filtry: equipmentType</li>
        <li>⏳ Detail s tabs: základní info, umístění (properties/units), cena</li>
        <li>⏳ Views: v_unit_equipment_list, v_property_equipment_list</li>
      </ul>
    </div>
  )
}
