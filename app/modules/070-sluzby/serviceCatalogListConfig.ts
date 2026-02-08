// FILE: app/modules/070-sluzby/serviceCatalogListConfig.ts
// PURPOSE: Sdílená konfigurace ListView pro katalog služeb a jeho zobrazení v dalších seznamech
// NOTES: Udržuje stejné sloupce, pořadí, šířky a řazení napříč UI

import React from 'react'
import type { ListViewColumn, ListViewRow } from '@/app/UI/ListView'
import { getContrastTextColor } from '@/app/lib/colorUtils'

export const SERVICE_CATALOG_VIEW_KEY = '070.service-catalog.list'

export const SERVICE_CATALOG_BASE_COLUMNS: ListViewColumn[] = [
  { key: 'category', label: 'Kategorie', width: 200, sortable: true },
  { key: 'name', label: 'Název', width: 240, sortable: true },
  { key: 'billingType', label: 'Typ účtování', width: 180, sortable: true },
  { key: 'unit', label: 'Jednotka', width: 140, sortable: true },
  { key: 'basePrice', label: 'Základní cena', width: 140, sortable: true, align: 'right' },
  { key: 'vatRate', label: 'DPH', width: 100, sortable: true },
  { key: 'active', label: 'Aktivní', width: 90, sortable: true },
]

export const SERVICE_CATALOG_DEFAULT_SORT = { key: 'category', dir: 'asc' as const }

export type ServiceCatalogListItem = {
  id: string
  name: string
  categoryName: string
  categoryColor: string | null
  billingTypeName: string
  billingTypeColor: string | null
  unitName: string
  basePrice: number | null
  vatRateName: string
  active: boolean
  isArchived?: boolean
}

export function buildServiceCatalogListRow(item: ServiceCatalogListItem): ListViewRow<ServiceCatalogListItem> {
  const categoryNode = item.categoryColor
    ? React.createElement(
        'span',
        {
          className: 'generic-type__name-badge',
          style: { backgroundColor: item.categoryColor, color: getContrastTextColor(item.categoryColor) },
        },
        item.categoryName
      )
    : React.createElement('span', null, item.categoryName)

  const billingTypeNode = item.billingTypeColor
    ? React.createElement(
        'span',
        {
          className: 'generic-type__name-badge',
          style: { backgroundColor: item.billingTypeColor, color: getContrastTextColor(item.billingTypeColor) },
        },
        item.billingTypeName
      )
    : React.createElement('span', null, item.billingTypeName)

  return {
    id: item.id,
    data: {
      category: categoryNode,
      name: item.name,
      billingType: billingTypeNode,
      unit: item.unitName,
      basePrice: item.basePrice != null ? `${item.basePrice.toFixed(2)} Kč` : '—',
      vatRate: item.vatRateName,
      active: item.active ? 'Ano' : 'Ne',
    },
    className: item.isArchived ? 'row--archived' : undefined,
    raw: item,
  }
}

export function getServiceCatalogSortValue(item: ServiceCatalogListItem | undefined, key: string): string | number {
  if (!item) return ''
  const norm = (v: any) => String(v ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  switch (key) {
    case 'name':
      return norm(item.name)
    case 'category':
      return norm(item.categoryName)
    case 'billingType':
      return norm(item.billingTypeName)
    case 'unit':
      return norm(item.unitName)
    case 'vatRate':
      return norm(item.vatRateName)
    case 'basePrice':
      return item.basePrice ?? 0
    case 'active':
      return item.active ? 1 : 0
    default:
      return ''
  }
}
