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
  icon: 'groups',
  enabled: true,

  tiles: [
    {
      id: 'tenants-list',
      label: 'Přehled',
      icon: 'list-alt',
      component: TenantsTile,
      order: 10,
    },
    // Dynamické tiles pro jednotlivé typy - budou zobrazeny jen pokud mají počet > 0
    // Počty se načtou v AppShell a labels se aktualizují
    {
      id: 'tenants-type-osoba',
      label: 'Osoba (0)', // Počet se aktualizuje dynamicky v AppShell
      icon: 'user',
      component: createTenantTypeTile('osoba'),
      order: 20,
      subjectType: 'osoba', // Metadata pro načítání počtů
      dynamicLabel: true, // Flag, že label má být aktualizován dynamicky
    },
    {
      id: 'tenants-type-osvc',
      label: 'OSVČ (0)',
      icon: 'briefcase',
      component: createTenantTypeTile('osvc'),
      order: 21,
      subjectType: 'osvc',
      dynamicLabel: true,
    },
    {
      id: 'tenants-type-firma',
      label: 'Firma (0)',
      icon: 'building',
      component: createTenantTypeTile('firma'),
      order: 22,
      subjectType: 'firma',
      dynamicLabel: true,
    },
    {
      id: 'tenants-type-spolek',
      label: 'Spolek (0)',
      icon: 'users',
      component: createTenantTypeTile('spolek'),
      order: 23,
      subjectType: 'spolek',
      dynamicLabel: true,
    },
    {
      id: 'tenants-type-statni',
      label: 'Státní (0)',
      icon: 'landmark',
      component: createTenantTypeTile('statni'),
      order: 24,
      subjectType: 'statni',
      dynamicLabel: true,
    },
    {
      id: 'tenants-type-zastupce',
      label: 'Zástupce (0)',
      icon: 'user-tie',
      component: createTenantTypeTile('zastupce'),
      order: 25,
      subjectType: 'zastupce',
      dynamicLabel: true,
    },
    {
      id: 'create-tenant',
      label: 'Přidat',
      icon: 'add',
      component: CreateTenantTile,
      order: 100,
    },
  ],

  actions: [],
}
