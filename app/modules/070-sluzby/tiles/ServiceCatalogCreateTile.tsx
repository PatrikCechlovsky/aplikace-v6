// FILE: app/modules/070-sluzby/tiles/ServiceCatalogCreateTile.tsx
// PURPOSE: Rychlé vytvoření nové služby v katalogu
// NOTES: Otevírá katalog služeb rovnou v režimu vytvoření

'use client'

import ServiceCatalogTile from './ServiceCatalogTile'

export default function ServiceCatalogCreateTile() {
  return <ServiceCatalogTile initialMode="create" />
}
