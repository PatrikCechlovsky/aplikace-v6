// FILE: app/modules/040-nemovitost/forms/EquipmentCatalogDetailForm.ts
// PURPOSE: Form definition pro katalog vybavení (equipment_catalog) - master seznam typů vybavení
// NOTES: Používá EQUIPMENT_STATES konstanty, equipment_types a room_types z generic_types

import { EQUIPMENT_STATES } from '@/app/lib/constants/properties'

export type EquipmentCatalogFormValue = {
  // Basic info
  equipment_name: string
  equipment_type_id: string
  room_type_id?: string
  
  // Pricing
  purchase_price?: number
  purchase_date?: string
  
  // Defaults
  default_lifespan_months?: number
  default_revision_interval?: number
  default_state?: string
  default_description?: string
  
  // Status
  is_archived?: boolean
}

export const equipmentCatalogDetailForm = {
  sections: [
    {
      id: 'basic',
      label: 'Základní údaje',
      icon: 'info-circle',
      fields: [
        {
          name: 'equipment_name',
          label: 'Název vybavení',
          type: 'text',
          required: true,
          placeholder: 'Např. Pračka Candy CS4',
          help: 'Konkrétní název/model vybavení',
        },
        {
          name: 'equipment_type_id',
          label: 'Typ vybavení',
          type: 'select',
          required: true,
          source: 'generic_type:equipment_types',
          placeholder: 'Vyberte typ',
          help: 'Kategorie vybavení (např. Kuchyňské spotřebiče)',
        },
        {
          name: 'room_type_id',
          label: 'Typ místnosti',
          type: 'select',
          required: false,
          source: 'generic_type:room_types',
          placeholder: 'Volitelně vyberte místnost',
          help: 'Místnost kde se vybavení typicky nachází',
        },
      ],
    },
    {
      id: 'pricing',
      label: 'Ceny a datum',
      icon: 'dollar-sign',
      fields: [
        {
          name: 'purchase_price',
          label: 'Výchozí pořizovací cena',
          type: 'number',
          required: false,
          placeholder: '0',
          min: 0,
          step: 0.01,
          suffix: 'Kč',
          help: 'Typická cena za kus',
        },
        {
          name: 'purchase_date',
          label: 'Datum pořízení',
          type: 'date',
          required: false,
          help: 'Volitelné - pro evidenci kdy byl typ pořízen',
        },
      ],
    },
    {
      id: 'lifecycle',
      label: 'Životnost a revize',
      icon: 'clock',
      fields: [
        {
          name: 'default_lifespan_months',
          label: 'Výchozí životnost',
          type: 'number',
          required: false,
          placeholder: '0',
          min: 1,
          suffix: 'měsíců',
          help: 'Očekávaná životnost v měsících (např. 120 = 10 let)',
        },
        {
          name: 'default_revision_interval',
          label: 'Interval revize',
          type: 'number',
          required: false,
          placeholder: '0',
          min: 1,
          suffix: 'měsíců',
          help: 'Pro elektro, kotle, měřiče - interval povinných revizí',
        },
        {
          name: 'default_state',
          label: 'Výchozí stav',
          type: 'select',
          required: false,
          source: {
            type: 'static',
            options: Object.entries(EQUIPMENT_STATES).map(([key, state]) => ({
              value: key,
              label: state.label,
              icon: state.icon,
              color: state.color,
            })),
          },
          placeholder: 'Vyberte výchozí stav',
          help: 'Stav vybavení při prvním přidání',
        },
      ],
    },
    {
      id: 'description',
      label: 'Popis a stav',
      icon: 'file-text',
      fields: [
        {
          name: 'default_description',
          label: 'Obecný popis',
          type: 'textarea',
          required: false,
          placeholder: 'Popis typu vybavení, technické specifikace...',
          rows: 4,
          help: 'Společný popis pro všechny instance tohoto typu',
        },
      ],
    },
    // Note: is_archived se zobrazuje na záložce "Systém" v DetailView
  ],
}
