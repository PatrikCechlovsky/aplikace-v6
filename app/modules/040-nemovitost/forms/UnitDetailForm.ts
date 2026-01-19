// FILE: app/modules/040-nemovitost/forms/UnitDetailForm.ts
// PURPOSE: Definice formuláře pro detail jednotky
// NOTES: 6 sekcí - Základní údaje, Adresa, Prostor, Status, Metadata, Poznámka

import { DetailFormSection } from '@/app/UI/DetailView'

export const UnitDetailFormSections: DetailFormSection[] = [
  {
    id: 'basic',
    label: 'Základní údaje',
    fields: [
      {
        name: 'display_name',
        label: 'Název jednotky',
        type: 'text',
        required: true,
        placeholder: 'např. Byt 2+kk, 1.NP',
        validation: {
          required: 'Název jednotky je povinný',
          minLength: { value: 2, message: 'Název musí mít alespoň 2 znaky' },
        },
      },
      {
        name: 'internal_code',
        label: 'Interní kód',
        type: 'text',
        placeholder: 'např. U-001, A-12',
        helpText: 'Interní označení jednotky pro evidenci',
      },
      {
        name: 'property_id',
        label: 'Nemovitost',
        type: 'select',
        required: true,
        source: 'properties', // Load from properties service
        validation: {
          required: 'Nemovitost je povinná',
        },
        helpText: 'Vyberte nemovitost, ke které jednotka patří',
      },
      {
        name: 'unit_type_id',
        label: 'Typ jednotky',
        type: 'select',
        required: true,
        source: 'generic_type:unit_types',
        validation: {
          required: 'Typ jednotky je povinný',
        },
      },
    ],
  },
  {
    id: 'address',
    label: 'Adresa',
    helpText: 'Adresa je defaultně zděděná z nemovitosti, můžete ji však přepsat',
    fields: [
      {
        name: 'street',
        label: 'Ulice',
        type: 'text',
        placeholder: 'Dědí se z nemovitosti',
      },
      {
        name: 'house_number',
        label: 'Číslo popisné/orientační',
        type: 'text',
        placeholder: 'např. 123/45',
      },
      {
        name: 'city',
        label: 'Město',
        type: 'text',
        placeholder: 'Dědí se z nemovitosti',
      },
      {
        name: 'zip',
        label: 'PSČ',
        type: 'text',
        placeholder: 'např. 12000',
        validation: {
          pattern: {
            value: /^\d{5}$/,
            message: 'PSČ musí mít 5 číslic',
          },
        },
      },
      {
        name: 'region',
        label: 'Kraj',
        type: 'select',
        source: 'regions',
      },
      {
        name: 'country',
        label: 'Země',
        type: 'select',
        source: 'countries',
        defaultValue: 'CZ',
      },
    ],
  },
  {
    id: 'space',
    label: 'Prostor',
    fields: [
      {
        name: 'floor',
        label: 'Podlaží',
        type: 'number',
        placeholder: 'např. 1, 2, -1 (suterén)',
        helpText: 'Číslo podlaží (0 = přízemí, -1 = suterén)',
      },
      {
        name: 'door_number',
        label: 'Číslo dveří',
        type: 'text',
        placeholder: 'např. 12, A3, 2.NP-vpravo',
      },
      {
        name: 'area',
        label: 'Plocha (m²)',
        type: 'number',
        step: 0.01,
        min: 0,
        placeholder: 'např. 65.50',
        validation: {
          min: { value: 0, message: 'Plocha musí být kladné číslo' },
        },
      },
      {
        name: 'rooms',
        label: 'Počet pokojů',
        type: 'number',
        step: 0.5,
        min: 0,
        placeholder: 'např. 2, 2.5, 3',
        helpText: '1+kk = 1.5, 2+1 = 2',
        validation: {
          min: { value: 0, message: 'Počet pokojů musí být kladné číslo' },
        },
      },
    ],
  },
  {
    id: 'status',
    label: 'Stav jednotky',
    fields: [
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        source: [
          { value: 'available', label: '🟢 Volná', color: '#22c55e' },
          { value: 'occupied', label: '🔴 Obsazená', color: '#ef4444' },
          { value: 'reserved', label: '🟡 Rezervovaná', color: '#eab308' },
          { value: 'renovation', label: '🟤 V rekonstrukci', color: '#a16207' },
        ],
        defaultValue: 'available',
        validation: {
          required: 'Status je povinný',
        },
      },
    ],
  },
  {
    id: 'metadata',
    label: 'Metadata',
    fields: [
      {
        name: 'origin_module',
        label: 'Zdrojový modul',
        type: 'text',
        readonly: true,
        defaultValue: '040-nemovitost',
      },
      {
        name: 'created_at',
        label: 'Vytvořeno',
        type: 'datetime-local',
        readonly: true,
      },
      {
        name: 'updated_at',
        label: 'Aktualizováno',
        type: 'datetime-local',
        readonly: true,
      },
      {
        name: 'is_archived',
        label: 'Archivováno',
        type: 'checkbox',
        helpText: 'Archivované jednotky se nezobrazují v přehledech',
      },
    ],
  },
  {
    id: 'note',
    label: 'Poznámka',
    fields: [
      {
        name: 'note',
        label: 'Interní poznámka',
        type: 'textarea',
        rows: 5,
        placeholder: 'Libovolná poznámka k jednotce...',
      },
    ],
  },
]
