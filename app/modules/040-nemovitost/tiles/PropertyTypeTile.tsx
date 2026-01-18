'use client'

// FILE: app/modules/040-nemovitost/tiles/PropertyTypeTile.tsx
// PURPOSE: Filtrovaný seznam nemovitostí podle typu

import React from 'react'
import PropertiesTile from './PropertiesTile'

type PropertyTypeTileProps = {
  propertyTypeCode?: string | null
  onRegisterCommonActions?: any
  onRegisterCommonActionsState?: any
  onRegisterCommonActionHandler?: any
}

export default function PropertyTypeTile(props: PropertyTypeTileProps) {
  return <PropertiesTile {...props} />
}
