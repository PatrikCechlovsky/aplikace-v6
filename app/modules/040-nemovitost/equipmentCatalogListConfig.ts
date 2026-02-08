// FILE: app/modules/040-nemovitost/equipmentCatalogListConfig.ts
// PURPOSE: Sdílená konfigurace ListView pro katalog vybavení a jeho zobrazení v dalších seznamech
// NOTES: Udržuje stejné sloupce, pořadí, šířky a řazení napříč UI

import React from 'react'
import type { ListViewColumn, ListViewRow } from '@/app/UI/ListView'
import { getContrastTextColor } from '@/app/lib/colorUtils'
import { EQUIPMENT_STATES } from '@/app/lib/constants/properties'

export const EQUIPMENT_CATALOG_VIEW_KEY = '040.equipment-catalog.list'

export const EQUIPMENT_CATALOG_BASE_COLUMNS: ListViewColumn[] = [
  { key: 'equipmentTypeName', label: 'Typ', width: 180, sortable: true },
  { key: 'equipmentName', label: 'Název', width: 250, sortable: true },
  { key: 'roomTypeName', label: 'Místnost', width: 150, sortable: true },
  { key: 'purchasePrice', label: 'Cena', width: 120, sortable: true },
  { key: 'defaultLifespanMonths', label: 'Životnost', width: 120, sortable: true },
  { key: 'defaultState', label: 'Stav', width: 120, sortable: true },
]

export const EQUIPMENT_CATALOG_DEFAULT_SORT = { key: 'equipmentTypeName', dir: 'asc' as const }

export type EquipmentCatalogListItem = {
  id: string
  equipmentName: string
  equipmentTypeName: string
  equipmentTypeColor: string | null
  roomTypeName: string
  roomTypeColor: string | null
  purchasePrice: number | null
  defaultLifespanMonths: number | null
  defaultState: string | null
  isArchived?: boolean
}

export function buildEquipmentCatalogListRow(item: EquipmentCatalogListItem): ListViewRow<EquipmentCatalogListItem> {
  const stateInfo = item.defaultState ? EQUIPMENT_STATES.find((s) => s.value === item.defaultState) : null

  const equipmentTypeNode = item.equipmentTypeColor
    ? React.createElement(
        'span',
        {
          className: 'generic-type__name-badge',
          style: { backgroundColor: item.equipmentTypeColor, color: getContrastTextColor(item.equipmentTypeColor) },
        },
        item.equipmentTypeName
      )
    : React.createElement('span', null, item.equipmentTypeName)

  const roomTypeNode = item.roomTypeColor
    ? React.createElement(
        'span',
        {
          className: 'generic-type__name-badge',
          style: { backgroundColor: item.roomTypeColor, color: getContrastTextColor(item.roomTypeColor) },
        },
        item.roomTypeName
      )
    : React.createElement('span', null, item.roomTypeName)

  const stateNode = stateInfo
    ? React.createElement(
        'span',
        { style: { color: stateInfo.color } },
        `${stateInfo.icon} ${stateInfo.label}`
      )
    : '—'

  return {
    id: item.id,
    data: {
      equipmentTypeName: equipmentTypeNode,
      equipmentName: item.equipmentName,
      roomTypeName: roomTypeNode,
      purchasePrice: item.purchasePrice != null ? `${item.purchasePrice.toFixed(2)} Kč` : '—',
      defaultLifespanMonths: item.defaultLifespanMonths != null ? `${item.defaultLifespanMonths} měs.` : '—',
      defaultState: stateNode,
    },
    className: item.isArchived ? 'row--archived' : undefined,
    raw: item,
  }
}

export function getEquipmentCatalogSortValue(item: EquipmentCatalogListItem | undefined, key: string): string | number {
  if (!item) return ''
  const norm = (v: any) => String(v ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  switch (key) {
    case 'equipmentTypeName':
      return norm(item.equipmentTypeName)
    case 'equipmentName':
      return norm(item.equipmentName)
    case 'roomTypeName':
      return norm(item.roomTypeName)
    case 'purchasePrice':
      return item.purchasePrice ?? 0
    case 'defaultLifespanMonths':
      return item.defaultLifespanMonths ?? 0
    case 'defaultState':
      return norm(item.defaultState || '')
    default:
      return ''
  }
}
