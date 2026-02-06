// FILE: app/modules/040-nemovitost/unitsColumns.ts
// PURPOSE: Sdílená definice sloupců pro jednotky (seznamy i vazby).
// NOTES: Vytaženo kvůli odstranění cyklických závislostí.

import type { ListViewColumn } from '@/app/UI/ListView'

export const UNITS_BASE_COLUMNS: ListViewColumn[] = [
  { key: 'unitTypeName', label: 'Typ', width: 140, sortable: true },
  { key: 'displayName', label: 'Název', width: 200, sortable: true },
  { key: 'propertyName', label: 'Nemovitost', width: 200, sortable: true },
  { key: 'floor', label: 'Podlaží', width: 100, sortable: true },
  { key: 'area', label: 'Plocha (m²)', width: 120, sortable: true },
  { key: 'rooms', label: 'Pokoje', width: 100, sortable: true },
  { key: 'status', label: 'Status', width: 150, sortable: true },
]
