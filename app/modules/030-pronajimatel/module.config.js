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
      label: 'Přehled',
      icon: 'list-alt',
      component: LandlordsTile,
      order: 10,
    },
    // Dynamické tiles pro jednotlivé typy - budou zobrazeny jen pokud mají počet > 0
    // Počty se načtou v AppShell a labels se aktualizují
    {
      id: 'landlords-type-osoba',
      label: 'Osoba (0)', // Počet se aktualizuje dynamicky v AppShell
      icon: 'user',
      component: createLandlordTypeTile('osoba'),
      order: 20,
      subjectType: 'osoba', // Metadata pro načítání počtů
      dynamicLabel: true, // Flag, že label má být aktualizován dynamicky
    },
    {
      id: 'landlords-type-osvc',
      label: 'OSVČ (0)',
      icon: 'briefcase',
      component: createLandlordTypeTile('osvc'),
      order: 21,
      subjectType: 'osvc',
      dynamicLabel: true,
    },
    {
      id: 'landlords-type-firma',
      label: 'Firma (0)',
      icon: 'building',
      component: createLandlordTypeTile('firma'),
      order: 22,
      subjectType: 'firma',
      dynamicLabel: true,
    },
    {
      id: 'landlords-type-spolek',
      label: 'Spolek (0)',
      icon: 'users',
      component: createLandlordTypeTile('spolek'),
      order: 23,
      subjectType: 'spolek',
      dynamicLabel: true,
    },
    {
      id: 'landlords-type-statni',
      label: 'Státní (0)',
      icon: 'landmark',
      component: createLandlordTypeTile('statni'),
      order: 24,
      subjectType: 'statni',
      dynamicLabel: true,
    },
    {
      id: 'landlords-type-zastupce',
      label: 'Zástupce (0)',
      icon: 'user-tie',
      component: createLandlordTypeTile('zastupce'),
      order: 25,
      subjectType: 'zastupce',
      dynamicLabel: true,
    },
    {
      id: 'create-landlord',
      label: 'Přidat',
      icon: 'add',
      component: CreateLandlordTile,
      order: 100,
    },
  ],

  actions: [],
}
