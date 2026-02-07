// FILE: app/modules/050-najemnik/module.config.js
// PURPOSE: Konfigurace modulu 050 – Nájemníci (seznam + přidání)
// NOTE: Počty podle typů se načítají dynamicky v AppShell a labels se aktualizují

import TenantsTile from './tiles/TenantsTile'
import TenantTypeTile from './tiles/TenantTypeTile'
import CreateTenantTile from './tiles/CreateTenantTile'

// Factory funkce pro vytvoření TenantTypeTile s přednastaveným typem
// Vrací React komponentu (Higher Order Component)
function createTenantTypeTile(subjectType) {
  const WrappedComponent = function TenantTypeTileWrapper(props) {
    return TenantTypeTile({ ...props, subjectType })
  }
  WrappedComponent.displayName = `TenantTypeTile_${subjectType}`
  return WrappedComponent
}

// Mapování typů subjektů na názvy (použije se v menu)
const SUBJECT_TYPE_LABELS = {
  osoba: 'Osoba',
  osvc: 'OSVČ',
  firma: 'Firma',
  spolek: 'Spolek',
  statni: 'Státní',
  zastupce: 'Zástupce',
}

// Očekávané typy subjektů pro nájemníky
const EXPECTED_SUBJECT_TYPES = ['osoba', 'osvc', 'firma', 'spolek', 'statni', 'zastupce']

export default {
  id: '050-najemnik',
  order: 50,
  label: 'Nájemníci',
  icon: 'users',
  enabled: true,

  tiles: [
    {
      id: 'tenants-list',
      label: 'Přehled nájemníků',
      icon: 'list-alt',
      component: TenantsTile,
      order: 10,
      // Dynamické children - typy nájemníků jako filtry
      children: [
        {
          id: 'tenants-type-osoba',
          label: 'Fyzická osoba (0)',
          icon: 'user',
          component: createTenantTypeTile('osoba'),
          subjectType: 'osoba',
          dynamicLabel: true,
        },
        {
          id: 'tenants-type-osvc',
          label: 'OSVČ (0)',
          icon: 'briefcase',
          component: createTenantTypeTile('osvc'),
          subjectType: 'osvc',
          dynamicLabel: true,
        },
        {
          id: 'tenants-type-firma',
          label: 'Firma (0)',
          icon: 'building',
          component: createTenantTypeTile('firma'),
          subjectType: 'firma',
          dynamicLabel: true,
        },
        {
          id: 'tenants-type-spolek',
          label: 'Spolek / SVJ (0)',
          icon: 'users',
          component: createTenantTypeTile('spolek'),
          subjectType: 'spolek',
          dynamicLabel: true,
        },
        {
          id: 'tenants-type-zastupce',
          label: 'Zástupce jiného subjektu (0)',
          icon: 'user-tie',
          component: createTenantTypeTile('zastupce'),
          subjectType: 'zastupce',
          dynamicLabel: true,
        },
        {
          id: 'tenants-type-statni',
          label: 'Státní instituce (0)',
          icon: 'landmark',
          component: createTenantTypeTile('statni'),
          subjectType: 'statni',
          dynamicLabel: true,
        },
      ],
    },
    {
      id: 'create-tenant',
      label: 'Přidat nájemníka',
      icon: 'plus',
      component: CreateTenantTile,
      order: 20,
    },
  ],

  actions: [],
}
