// FILE: app/modules/070-sluzby/forms/ServiceCatalogDetailForm.ts
// PURPOSE: Form definition pro katalog služeb (service_catalog)
// NOTES: Používá generic_types: service_types, service_billing_types, vat_rates, service_units

export type ServiceCatalogFormValue = {
  code: string
  name: string
  category_id?: string
  billing_type_id?: string
  unit_id?: string
  vat_rate_id?: string
  base_price?: number
  description?: string
  note?: string
  active?: boolean
  is_archived?: boolean
}

export const serviceCatalogDetailForm = {
  sections: [
    {
      id: 'basic',
      label: 'Základní údaje',
      icon: 'info-circle',
      fields: [
        {
          name: 'code',
          label: 'Kód služby',
          type: 'text',
          required: true,
          placeholder: 'např. teplo, voda, odpad',
          help: 'Unikátní kód (slug) služby',
        },
        {
          name: 'name',
          label: 'Název služby',
          type: 'text',
          required: true,
          placeholder: 'Např. Teplo',
        },
        {
          name: 'category_id',
          label: 'Kategorie',
          type: 'select',
          required: false,
          source: 'generic_type:service_types',
          placeholder: 'Vyberte kategorii',
        },
      ],
    },
    {
      id: 'billing',
      label: 'Účtování',
      icon: 'calculator',
      fields: [
        {
          name: 'billing_type_id',
          label: 'Typ účtování',
          type: 'select',
          required: false,
          source: 'generic_type:service_billing_types',
          placeholder: 'Vyberte typ účtování',
        },
        {
          name: 'unit_id',
          label: 'Jednotka',
          type: 'select',
          required: false,
          source: 'generic_type:service_units',
          placeholder: 'Vyberte jednotku',
        },
      ],
    },
    {
      id: 'pricing',
      label: 'Cena a DPH',
      icon: 'dollar-sign',
      fields: [
        {
          name: 'base_price',
          label: 'Základní cena',
          type: 'number',
          required: false,
          min: 0,
          step: 0.01,
          suffix: 'Kč',
        },
        {
          name: 'vat_rate_id',
          label: 'DPH sazba',
          type: 'select',
          required: false,
          source: 'generic_type:vat_rates',
          placeholder: 'Vyberte DPH',
        },
      ],
    },
    {
      id: 'notes',
      label: 'Popis a poznámky',
      icon: 'file-text',
      fields: [
        {
          name: 'description',
          label: 'Popis',
          type: 'textarea',
          required: false,
          rows: 3,
          placeholder: 'Stručný popis služby',
        },
        {
          name: 'note',
          label: 'Poznámka',
          type: 'textarea',
          required: false,
          rows: 3,
          placeholder: 'Interní poznámky',
        },
      ],
    },
  ],
}
