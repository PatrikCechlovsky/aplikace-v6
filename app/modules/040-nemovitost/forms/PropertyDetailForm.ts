// FILE: app/modules/040-nemovitost/forms/PropertyDetailForm.ts
// PURPOSE: Form definition pro nemovitost (property) - základní info, adresa, plochy, katastr
// NOTES: Používá AddressAutocomplete pro adresu, property_types select z DB

import { REGIONS, COUNTRIES } from '@/app/lib/constants/properties'

export type PropertyFormValue = {
  // Basic info
  landlord_id: string
  property_type_id: string
  display_name: string
  internal_code?: string
  
  // Address
  street?: string
  house_number?: string
  city?: string
  zip?: string
  country?: string
  region?: string
  
  // Areas
  land_area?: number
  built_up_area?: number
  building_area?: number
  number_of_floors?: number
  floors_above_ground?: number
  floors_below_ground?: number
  units_count?: number
  
  // Dates
  build_year?: number
  reconstruction_year?: number
  
  // Cadastre
  cadastral_area?: string
  parcel_number?: string
  lv_number?: string
  
  // Note
  note?: string
  
  // Metadata
  is_archived?: boolean
}

export const propertyDetailForm = {
  sections: [
    {
      id: 'basic',
      label: 'Základní údaje',
      icon: 'info-circle',
      fields: [
        {
          name: 'landlord_id',
          label: 'Pronajímatel',
          type: 'select',
          required: true,
          source: 'subjects_landlords', // Načte subjects kde is_landlord = true
          placeholder: 'Vyberte pronajímatele',
        },
        {
          name: 'property_type_id',
          label: 'Typ nemovitosti',
          type: 'select',
          required: true,
          source: 'property_types', // Načte z property_types table
          placeholder: 'Vyberte typ',
        },
        {
          name: 'display_name',
          label: 'Název',
          type: 'text',
          required: true,
          placeholder: 'Např. Rodinný dům Praha 9',
        },
        {
          name: 'internal_code',
          label: 'Interní kód',
          type: 'text',
          placeholder: 'Např. RD-001',
        },
      ],
    },
    {
      id: 'address',
      label: 'Adresa',
      icon: 'map-marker-alt',
      fields: [
        {
          name: 'street',
          label: 'Ulice',
          type: 'text',
          autocomplete: 'address', // Použije AddressAutocomplete
          placeholder: 'Začněte psát adresu...',
        },
        {
          name: 'house_number',
          label: 'Číslo popisné',
          type: 'text',
          placeholder: '15',
        },
        {
          name: 'city',
          label: 'Město',
          type: 'text',
          required: true,
          placeholder: 'Praha',
        },
        {
          name: 'zip',
          label: 'PSČ',
          type: 'text',
          pattern: '^[0-9]{5}$',
          placeholder: '19000',
        },
        {
          name: 'region',
          label: 'Kraj',
          type: 'select',
          options: REGIONS,
          placeholder: 'Vyberte kraj',
        },
        {
          name: 'country',
          label: 'Stát',
          type: 'select',
          options: COUNTRIES,
          defaultValue: 'CZ',
        },
      ],
    },
    {
      id: 'areas',
      label: 'Plochy a podlaží',
      icon: 'ruler-combined',
      fields: [
        {
          name: 'land_area',
          label: 'Výměra pozemku (m²)',
          type: 'number',
          min: 0,
          step: 0.01,
          placeholder: '850.00',
        },
        {
          name: 'built_up_area',
          label: 'Zastavěná plocha (m²)',
          type: 'number',
          min: 0,
          step: 0.01,
          placeholder: '120.00',
        },
        {
          name: 'building_area',
          label: 'Užitná plocha (m²)',
          type: 'number',
          min: 0,
          step: 0.01,
          placeholder: '180.00',
        },
        {
          name: 'number_of_floors',
          label: 'Počet podlaží celkem',
          type: 'number',
          min: 0,
          max: 50,
          placeholder: '2',
        },
        {
          name: 'floors_above_ground',
          label: 'Nadzemní podlaží',
          type: 'number',
          min: 0,
          max: 50,
          placeholder: '2',
        },
        {
          name: 'floors_below_ground',
          label: 'Podzemní podlaží',
          type: 'number',
          min: 0,
          max: 10,
          placeholder: '1',
        },
        {
          name: 'units_count',
          label: 'Počet jednotek',
          type: 'number',
          min: 0,
          placeholder: '4',
          readOnly: true,
          helpText: 'Automaticky počítáno z počtu založených jednotek',
        },
      ],
    },
    {
      id: 'dates',
      label: 'Data',
      icon: 'calendar',
      fields: [
        {
          name: 'build_year',
          label: 'Rok výstavby',
          type: 'number',
          min: 1800,
          max: new Date().getFullYear() + 5,
          placeholder: '1998',
        },
        {
          name: 'reconstruction_year',
          label: 'Rok rekonstrukce',
          type: 'number',
          min: 1800,
          max: new Date().getFullYear() + 5,
          placeholder: '2018',
        },
      ],
    },
    {
      id: 'cadastre',
      label: 'Katastr',
      icon: 'file-contract',
      fields: [
        {
          name: 'cadastral_area',
          label: 'Katastrální území',
          type: 'text',
          placeholder: 'Horní Počernice',
        },
        {
          name: 'parcel_number',
          label: 'Číslo parcely',
          type: 'text',
          placeholder: '123/45',
        },
        {
          name: 'lv_number',
          label: 'List vlastnictví',
          type: 'text',
          placeholder: 'LV-1234',
        },
      ],
    },
    {
      id: 'note',
      label: 'Poznámka',
      icon: 'sticky-note',
      fields: [
        {
          name: 'note',
          label: 'Poznámka',
          type: 'textarea',
          rows: 4,
          placeholder: 'Doplňující informace...',
        },
      ],
    },
  ],
}

export default propertyDetailForm
