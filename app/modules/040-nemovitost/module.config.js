// FILE: app/modules/040-nemovitost/module.config.js
// PURPOSE: Konfigurace modulu 040 – Nemovitosti (properties + units + equipment)
// NOTE: Dynamické tiles podle property_types z databáze

import PropertiesTile from './tiles/PropertiesTile'
import PropertyTypeTile from './tiles/PropertyTypeTile'
import UnitsTile from './tiles/UnitsTile'
import UnitTypeTile from './tiles/UnitTypeTile'
import EquipmentTile from './tiles/EquipmentTile'

// Factory funkce pro vytvoření PropertyTypeTile s přednastaveným typem
function createPropertyTypeTile(propertyTypeCode) {
  const WrappedComponent = function PropertyTypeTileWrapper(props) {
    return PropertyTypeTile({ ...props, propertyTypeCode })
  }
  WrappedComponent.displayName = `PropertyTypeTile_${propertyTypeCode}`
  return WrappedComponent
}

// Factory funkce pro vytvoření UnitTypeTile s přednastaveným typem
function createUnitTypeTile(unitTypeCode) {
  const WrappedComponent = function UnitTypeTileWrapper(props) {
    return UnitTypeTile({ ...props, unitTypeCode })
  }
  WrappedComponent.displayName = `UnitTypeTile_${unitTypeCode}`
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

// Očekávané typy jednotek (podle CSV a migration 002)
const EXPECTED_UNIT_TYPES = [
  'byt',
  'puda',
  'garaz',
]

export default {
  id: '040-nemovitost',
  label: 'Nemovitosti',
  icon: 'building',
  order: 40,
  enabled: true,

  // 2. ÚROVEŇ – TILES (flat seznam s možností children pro 3. úroveň)
  tiles: [
    // === PŘEHLED NEMOVITOSTÍ (s filtry jako children) ===
    {
      id: 'properties-list',
      label: 'Přehled nemovitostí',
      icon: 'list-alt',
      component: PropertiesTile,
      order: 10,
      children: [
        // 3. ÚROVEŇ – Filtry podle typu nemovitosti
        {
          id: 'properties-type-rodinny_dum',
          label: 'Rodinný dům (0)',
          icon: 'home',
          component: createPropertyTypeTile('rodinny_dum'),
          propertyTypeCode: 'rodinny_dum',
          dynamicLabel: true,
        },
        {
          id: 'properties-type-bytovy_dum',
          label: 'Bytový dům (0)',
          icon: 'building',
          component: createPropertyTypeTile('bytovy_dum'),
          propertyTypeCode: 'bytovy_dum',
          dynamicLabel: true,
        },
        {
          id: 'properties-type-admin_budova',
          label: 'Admin. budova (0)',
          icon: 'briefcase',
          component: createPropertyTypeTile('admin_budova'),
          propertyTypeCode: 'admin_budova',
          dynamicLabel: true,
        },
        {
          id: 'properties-type-jiny_objekt',
          label: 'Jiný objekt (0)',
          icon: 'cube',
          component: createPropertyTypeTile('jiny_objekt'),
          propertyTypeCode: 'jiny_objekt',
          dynamicLabel: true,
        },
        {
          id: 'properties-type-pozemek',
          label: 'Pozemek (0)',
          icon: 'map',
          component: createPropertyTypeTile('pozemek'),
          propertyTypeCode: 'pozemek',
          dynamicLabel: true,
        },
        {
          id: 'properties-type-prumyslovy_objekt',
          label: 'Průmysl. objekt (0)',
          icon: 'industry',
          component: createPropertyTypeTile('prumyslovy_objekt'),
          propertyTypeCode: 'prumyslovy_objekt',
          dynamicLabel: true,
        },
      ],
    },

    // === PŘIDAT NEMOVITOST ===
    {
      id: 'properties-add',
      label: 'Přidat nemovitost',
      icon: 'plus',
      component: null, // TODO: Add mode
      order: 15,
    },

    // === PŘEHLED JEDNOTEK (s filtry jako children) ===
    {
      id: 'units-list',
      label: 'Přehled jednotek',
      icon: 'list-alt',
      component: UnitsTile,
      order: 20,
      children: [
        // 3. ÚROVEŇ – Filtry podle typu jednotky
        {
          id: 'units-type-byt',
          label: 'Byt',
          icon: 'door-open',
          component: createUnitTypeTile('byt'),
          unitTypeCode: 'byt',
          dynamicLabel: true,
        },
        {
          id: 'units-type-puda',
          label: 'Půda',
          icon: 'home',
          component: createUnitTypeTile('puda'),
          unitTypeCode: 'puda',
          dynamicLabel: true,
        },
        {
          id: 'units-type-garaz',
          label: 'Garáž',
          icon: 'car',
          component: createUnitTypeTile('garaz'),
          unitTypeCode: 'garaz',
          dynamicLabel: true,
        },
      ],
    },

    // === PŘIDAT JEDNOTKU ===
    {
      id: 'units-add',
      label: 'Přidat jednotku',
      icon: 'plus',
      component: null, // TODO: Add mode
      order: 25,
    },

    // === KATALOG VYBAVENÍ ===
    {
      id: 'equipment-catalog',
      label: 'Přehled vybavení',
      icon: 'toolbox',
      component: EquipmentTile,
      order: 30,
    },
  ],
}
