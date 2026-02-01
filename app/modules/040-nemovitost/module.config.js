// FILE: app/modules/040-nemovitost/module.config.js
// PURPOSE: Konfigurace modulu 040 – Nemovitosti (properties + units + equipment)
// NOTE: Dynamické tiles podle property_types z databáze

import PropertiesTile from './tiles/PropertiesTile'
import PropertyTypeTile from './tiles/PropertyTypeTile'
import CreatePropertyTile from './tiles/CreatePropertyTile'
import UnitsTile from './tiles/UnitsTile'
import UnitTypeTile from './tiles/UnitTypeTile'
import CreateUnitTile from './tiles/CreateUnitTile'
import EquipmentTile from './tiles/EquipmentTile'
import EquipmentCatalogTile from './tiles/EquipmentCatalogTile'
import EquipmentTypeTile from './tiles/EquipmentTypeTile'
import CreateEquipmentTile from './tiles/CreateEquipmentTile'

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

// Factory funkce pro vytvoření EquipmentTypeTile s přednastaveným typem
function createEquipmentTypeTile(equipmentTypeCode) {
  const WrappedComponent = function EquipmentTypeTileWrapper(props) {
    return EquipmentTypeTile({ ...props, equipmentTypeCode })
  }
  WrappedComponent.displayName = `EquipmentTypeTile_${equipmentTypeCode}`
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
  'kancelar',
  'obchod',
  'puda',
  'sklep',
  'garaz',
  'sklad',
  'zahrada',
  'jina_jednotka',
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
      id: 'create-property',
      label: 'Přidat nemovitost',
      icon: 'plus',
      component: CreatePropertyTile,
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
          icon: 'home',
          component: createUnitTypeTile('byt'),
          unitTypeCode: 'byt',
          dynamicLabel: true,
        },
        {
          id: 'units-type-kancelar',
          label: 'Kancelář',
          icon: 'briefcase',
          component: createUnitTypeTile('kancelar'),
          unitTypeCode: 'kancelar',
          dynamicLabel: true,
        },
        {
          id: 'units-type-obchod',
          label: 'Obchodní prostor',
          icon: 'shopping-cart',
          component: createUnitTypeTile('obchod'),
          unitTypeCode: 'obchod',
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
          id: 'units-type-sklep',
          label: 'Sklep',
          icon: 'archive',
          component: createUnitTypeTile('sklep'),
          unitTypeCode: 'sklep',
          dynamicLabel: true,
        },
        {
          id: 'units-type-garaz',
          label: 'Garáž - Parking',
          icon: 'car',
          component: createUnitTypeTile('garaz'),
          unitTypeCode: 'garaz',
          dynamicLabel: true,
        },
        {
          id: 'units-type-sklad',
          label: 'Sklad',
          icon: 'warehouse',
          component: createUnitTypeTile('sklad'),
          unitTypeCode: 'sklad',
          dynamicLabel: true,
        },
        {
          id: 'units-type-zahrada',
          label: 'Zahrada',
          icon: 'tree',
          component: createUnitTypeTile('zahrada'),
          unitTypeCode: 'zahrada',
          dynamicLabel: true,
        },
        {
          id: 'units-type-jina',
          label: 'Jiná jednotka',
          icon: 'grid',
          component: createUnitTypeTile('jina_jednotka'),
          unitTypeCode: 'jina_jednotka',
          dynamicLabel: true,
        },
      ],
    },

    // === PŘIDAT JEDNOTKU ===
    {
      id: 'create-unit',
      label: 'Přidat jednotku',
      icon: 'plus',
      component: CreateUnitTile,
      order: 25,
    },

    // === KATALOG VYBAVENÍ ===
    {
      id: 'equipment-catalog',
      label: 'Katalog vybavení',
      icon: 'toolbox',
      component: EquipmentCatalogTile,
      order: 30,
      children: [
        // 3. ÚROVEŇ – Filtry podle typu vybavení
        {
          id: 'equipment-type-kuchyne',
          label: 'Kuchyňské spotřebiče',
          icon: 'kitchen',
          component: createEquipmentTypeTile('kuchyne'),
          equipmentTypeCode: 'kuchyne',
          dynamicLabel: true,
        },
        {
          id: 'equipment-type-koupelna',
          label: 'Koupelna a sanitace',
          icon: 'shower',
          component: createEquipmentTypeTile('koupelna'),
          equipmentTypeCode: 'koupelna',
          dynamicLabel: true,
        },
        {
          id: 'equipment-type-vytapeni',
          label: 'Vytápění',
          icon: 'fire',
          component: createEquipmentTypeTile('vytapeni'),
          equipmentTypeCode: 'vytapeni',
          dynamicLabel: true,
        },
        {
          id: 'equipment-type-technika',
          label: 'Technika',
          icon: 'bolt',
          component: createEquipmentTypeTile('technika'),
          equipmentTypeCode: 'technika',
          dynamicLabel: true,
        },
        {
          id: 'equipment-type-nabytek',
          label: 'Nábytek',
          icon: 'couch',
          component: createEquipmentTypeTile('nabytek'),
          equipmentTypeCode: 'nabytek',
          dynamicLabel: true,
        },
        {
          id: 'equipment-type-osviceni',
          label: 'Osvětlení',
          icon: 'sparkles',
          component: createEquipmentTypeTile('osviceni'),
          equipmentTypeCode: 'osviceni',
          dynamicLabel: true,
        },
        {
          id: 'equipment-type-zabezpeceni',
          label: 'Zabezpečení',
          icon: 'lock',
          component: createEquipmentTypeTile('zabezpeceni'),
          equipmentTypeCode: 'zabezpeceni',
          dynamicLabel: true,
        },
        {
          id: 'equipment-type-energie',
          label: 'Energie a měření',
          icon: 'bolt',
          component: createEquipmentTypeTile('energie_mereni'),
          equipmentTypeCode: 'energie_mereni',
          dynamicLabel: true,
        },
        {
          id: 'equipment-type-chlazeni',
          label: 'Chlazení a vzduchotechnika',
          icon: 'snow',
          component: createEquipmentTypeTile('chlazeni_vzduchotechnika'),
          equipmentTypeCode: 'chlazeni_vzduchotechnika',
          dynamicLabel: true,
        },
        {
          id: 'equipment-type-stavebni',
          label: 'Stavební prvky',
          icon: 'hammer',
          component: createEquipmentTypeTile('stavebni_prvky'),
          equipmentTypeCode: 'stavebni_prvky',
          dynamicLabel: true,
        },
        {
          id: 'equipment-type-bezpecnost',
          label: 'Bezpečnost a požár',
          icon: 'fire',
          component: createEquipmentTypeTile('bezpecnost_pozar'),
          equipmentTypeCode: 'bezpecnost_pozar',
          dynamicLabel: true,
        },
        {
          id: 'equipment-type-pristupy',
          label: 'Přístupy a zabezpečení',
          icon: 'lock',
          component: createEquipmentTypeTile('pristupy_zabezpeceni'),
          equipmentTypeCode: 'pristupy_zabezpeceni',
          dynamicLabel: true,
        },
        {
          id: 'equipment-type-spolecne',
          label: 'Společné prostory',
          icon: 'building',
          component: createEquipmentTypeTile('spolecne_prostory'),
          equipmentTypeCode: 'spolecne_prostory',
          dynamicLabel: true,
        },
        {
          id: 'equipment-type-exterier',
          label: 'Exteriér',
          icon: 'leaf',
          component: createEquipmentTypeTile('exterier'),
          equipmentTypeCode: 'exterier',
          dynamicLabel: true,
        },
        {
          id: 'equipment-type-sport',
          label: 'Sport a zábava',
          icon: 'toy',
          component: createEquipmentTypeTile('sport_zabava'),
          equipmentTypeCode: 'sport_zabava',
          dynamicLabel: true,
        },
        {
          id: 'equipment-type-ostatni',
          label: 'Ostatní',
          icon: 'question',
          component: createEquipmentTypeTile('ostatni'),
          equipmentTypeCode: 'ostatni',
          dynamicLabel: true,
        },
      ],
    },

    // === PŘIDAT VYBAVENÍ ===
    {
      id: 'create-equipment',
      label: 'Přidat vybavení',
      icon: 'plus',
      component: CreateEquipmentTile,
      order: 35,
    },
  ],
}
