// FILE: app/modules/030-pronajimatel/module.config.js
// PURPOSE: Konfigurace modulu 030 – Pronajímatelé (seznam + přidání)
// NOTE: Počty podle typů se načítají dynamicky v AppShell a labels se aktualizují

import LandlordsTile from './tiles/LandlordsTile'
import LandlordTypeTile from './tiles/LandlordTypeTile'
import CreateLandlordTile from './tiles/CreateLandlordTile'

// Factory funkce pro vytvoření LandlordTypeTile s přednastaveným typem
// Vrací React komponentu (Higher Order Component)
function createLandlordTypeTile(subjectType) {
  const WrappedComponent = function LandlordTypeTileWrapper(props) {
    return LandlordTypeTile({ ...props, subjectType })
  }
  WrappedComponent.displayName = `LandlordTypeTile_${subjectType}`
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

// Očekávané typy subjektů pro pronajimatele
const EXPECTED_SUBJECT_TYPES = ['osoba', 'osvc', 'firma', 'spolek', 'statni', 'zastupce']

export default {
  id: '030-pronajimatel',
  order: 30,
  label: 'Pronajímatelé',
  icon: 'home',
  enabled: true,

  tiles: [
    {
      id: 'landlords-list',
      label: 'Přehled pronajímatelů',
      icon: 'list-alt',
      component: LandlordsTile,
      href: '/modules/030-pronajimatel',
      order: 10,
      // Dynamické children - typy pronajímatelů jako filtry
      children: [
        {
          id: 'landlords-type-osoba',
          label: 'Fyzická osoba (0)',
          icon: 'user',
          component: createLandlordTypeTile('osoba'),
          subjectType: 'osoba',
          dynamicLabel: true,
        },
        {
          id: 'landlords-type-osvc',
          label: 'OSVČ (0)',
          icon: 'briefcase',
          component: createLandlordTypeTile('osvc'),
          subjectType: 'osvc',
          dynamicLabel: true,
        },
        {
          id: 'landlords-type-firma',
          label: 'Firma (0)',
          icon: 'building',
          component: createLandlordTypeTile('firma'),
          subjectType: 'firma',
          dynamicLabel: true,
        },
        {
          id: 'landlords-type-spolek',
          label: 'Spolek / SVJ (0)',
          icon: 'users',
          component: createLandlordTypeTile('spolek'),
          subjectType: 'spolek',
          dynamicLabel: true,
        },
        {
          id: 'landlords-type-zastupce',
          label: 'Zástupce jiného subjektu (0)',
          icon: 'user-tie',
          component: createLandlordTypeTile('zastupce'),
          subjectType: 'zastupce',
          dynamicLabel: true,
        },
        {
          id: 'landlords-type-statni',
          label: 'Státní instituce (0)',
          icon: 'landmark',
          component: createLandlordTypeTile('statni'),
          subjectType: 'statni',
          dynamicLabel: true,
        },
      ],
    },
    {
      id: 'create-landlord',
      label: 'Přidat pronajimatele',
      icon: 'plus',
      component: CreateLandlordTile,
      order: 20,
    },
  ],

  actions: [],
}
