// FILE: app/modules/040-nemovitost/module.config.js
// PURPOSE: Konfigurace modulu 040 – Nemovitosti (properties + units + equipment)
// NOTE: Dynamické tiles podle property_types z databáze

import PropertiesTile from './tiles/PropertiesTile'
import PropertyTypeTile from './tiles/PropertyTypeTile'
import UnitsTile from './tiles/UnitsTile'
import EquipmentTile from './tiles/EquipmentTile'

// Factory funkce pro vytvoření PropertyTypeTile s přednastaveným typem
function createPropertyTypeTile(propertyTypeCode) {
  const WrappedComponent = function PropertyTypeTileWrapper(props) {
    return PropertyTypeTile({ ...props, propertyTypeCode })
  }
  WrappedComponent.displayName = `PropertyTypeTile_${propertyTypeCode}`
  return WrappedComponent
}

// Očekávané typy nemovitostí (podle CSV a migration 002)
const EXPECTED_PROPERTY_TYPES = [
  'rodinny_dum',
  'bytovy_dum',
  'admin_budova',
  'jiny_objekt',
  'pozemek',
  'prumyslovy_objekt',
]

export default {
  id: '040-nemovitost',
  label: 'Nemovitosti',
  icon: 'building',
  order: 40,
  enabled: true,

  tiles: [
    {
      id: 'properties-list',
      label: 'Přehled nemovitostí',
      icon: 'list-alt',
      component: PropertiesTile,
      order: 10,
    },
    // Dynamické tiles pro jednotlivé typy nemovitostí
    {
      id: 'properties-type-rodinny_dum',
      label: 'Rodinný dům (0)',
      icon: 'home',
      component: createPropertyTypeTile('rodinny_dum'),
      order: 20,
      propertyTypeCode: 'rodinny_dum',
      dynamicLabel: true,
    },
    {
      id: 'properties-type-bytovy_dum',
      label: 'Bytový dům (0)',
      icon: 'building',
      component: createPropertyTypeTile('bytovy_dum'),
      order: 21,
      propertyTypeCode: 'bytovy_dum',
      dynamicLabel: true,
    },
    {
      id: 'properties-type-admin_budova',
      label: 'Admin. budova (0)',
      icon: 'briefcase',
      component: createPropertyTypeTile('admin_budova'),
      order: 22,
      propertyTypeCode: 'admin_budova',
      dynamicLabel: true,
    },
    {
      id: 'properties-type-jiny_objekt',
      label: 'Jiný objekt (0)',
      icon: 'cube',
      component: createPropertyTypeTile('jiny_objekt'),
      order: 23,
      propertyTypeCode: 'jiny_objekt',
      dynamicLabel: true,
    },
    {
      id: 'properties-type-pozemek',
      label: 'Pozemek (0)',
      icon: 'map',
      component: createPropertyTypeTile('pozemek'),
      order: 24,
      propertyTypeCode: 'pozemek',
      dynamicLabel: true,
    },
    {
      id: 'properties-type-prumyslovy_objekt',
      label: 'Průmysl. objekt (0)',
      icon: 'industry',
      component: createPropertyTypeTile('prumyslovy_objekt'),
      order: 25,
      propertyTypeCode: 'prumyslovy_objekt',
      dynamicLabel: true,
    },
    {
      id: 'units-list',
      label: 'Jednotky',
      icon: 'door-open',
      component: UnitsTile,
      order: 30,
    },
    {
      id: 'equipment-catalog',
      label: 'Katalog vybavení',
      icon: 'toolbox',
      component: EquipmentTile,
      order: 40,
    },
  ],
}
