// FILE: app/modules/070-sluzby/module.config.js
// PURPOSE: Konfigurace modulu Služby + registrace tiles

import ServiceCatalogTile from './tiles/ServiceCatalogTile'
import ServiceCatalogCreateTile from './tiles/ServiceCatalogCreateTile'
import ServiceCatalogTypeTile from './tiles/ServiceCatalogTypeTile'

// Factory funkce pro vytvoření ServiceCatalogTypeTile s přednastaveným typem
function createServiceCatalogTypeTile(serviceTypeCode) {
  const WrappedComponent = function ServiceCatalogTypeTileWrapper(props) {
    return ServiceCatalogTypeTile({ ...props, serviceTypeCode })
  }
  WrappedComponent.displayName = `ServiceCatalogTypeTile_${serviceTypeCode}`
  return WrappedComponent
}

// Očekávané typy služeb (service_types)
const EXPECTED_SERVICE_TYPES = [
  'energie',
  'voda',
  'spravni_poplatky',
  'doplnkove_sluzby',
  'najemne',
  'jine_sluzby',
]

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
      children: [
        {
          id: 'service-catalog-type-energie',
          label: 'Energie (0)',
          icon: 'bolt',
          component: createServiceCatalogTypeTile('energie'),
          serviceTypeCode: 'energie',
          dynamicLabel: true,
        },
        {
          id: 'service-catalog-type-voda',
          label: 'Voda (0)',
          icon: 'rain',
          component: createServiceCatalogTypeTile('voda'),
          serviceTypeCode: 'voda',
          dynamicLabel: true,
        },
        {
          id: 'service-catalog-type-spravni',
          label: 'Správní poplatky (0)',
          icon: 'invoice',
          component: createServiceCatalogTypeTile('spravni_poplatky'),
          serviceTypeCode: 'spravni_poplatky',
          dynamicLabel: true,
        },
        {
          id: 'service-catalog-type-doplnkove',
          label: 'Doplňkové služby (0)',
          icon: 'plus',
          component: createServiceCatalogTypeTile('doplnkove_sluzby'),
          serviceTypeCode: 'doplnkove_sluzby',
          dynamicLabel: true,
        },
        {
          id: 'service-catalog-type-najemne',
          label: 'Nájemné (0)',
          icon: 'cash',
          component: createServiceCatalogTypeTile('najemne'),
          serviceTypeCode: 'najemne',
          dynamicLabel: true,
        },
        {
          id: 'service-catalog-type-jine',
          label: 'Jiné služby (0)',
          icon: 'info',
          component: createServiceCatalogTypeTile('jine_sluzby'),
          serviceTypeCode: 'jine_sluzby',
          dynamicLabel: true,
        },
      ].filter((child) => EXPECTED_SERVICE_TYPES.includes(child.serviceTypeCode)),
    },
    {
      id: 'service-catalog-create',
      label: 'Nová služba',
      icon: 'plus',
      component: ServiceCatalogCreateTile,
      order: 15,
    },
  ],
}
