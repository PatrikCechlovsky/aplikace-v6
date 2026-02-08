// FILE: app/modules/070-sluzby/module.config.js
// PURPOSE: Konfigurace modulu Služby + registrace tiles

import ServiceCatalogTile from './tiles/ServiceCatalogTile'

export default {
  id: '070-sluzby',
  order: 70,
  label: 'Služby',
  icon: 'maintenance',
  enabled: true,
  tiles: [
    {
      id: 'service-catalog',
      label: 'Katalog služeb',
      icon: 'list',
      component: ServiceCatalogTile,
      order: 10,
    },
  ],
}
