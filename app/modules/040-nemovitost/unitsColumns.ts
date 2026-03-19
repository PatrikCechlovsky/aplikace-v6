// FILE: app/modules/040-nemovitost/unitsColumns.ts
// PURPOSE: Sdílená definice sloupců pro jednotky (seznamy i vazby).
// NOTES: Vytaženo kvůli odstranění cyklických závislostí.

import type { ListViewColumn } from '@/app/UI/ListView'

export const UNITS_BASE_COLUMNS: ListViewColumn[] = [
  { key: 'unitTypeName', label: 'Typ', width: 140, sortable: true },
  { key: 'unitTypeCode', label: 'Typ (kód)', width: 140, sortable: true },
  { key: 'displayName', label: 'Název', width: 200, sortable: true },
  { key: 'internalCode', label: 'Interní kód', width: 140, sortable: true },
  { key: 'propertyName', label: 'Nemovitost', width: 200, sortable: true },
  { key: 'propertyId', label: 'ID nemovitosti', width: 200, sortable: true },
  { key: 'landlordId', label: 'ID pronajímatele', width: 200, sortable: true },
  { key: 'street', label: 'Ulice', width: 180, sortable: true },
  { key: 'houseNumber', label: 'Číslo domu', width: 120, sortable: true },
  { key: 'city', label: 'Město', width: 160, sortable: true },
  { key: 'zip', label: 'PSČ', width: 100, sortable: true },
  { key: 'country', label: 'Země', width: 120, sortable: true },
  { key: 'region', label: 'Region', width: 160, sortable: true },
  { key: 'floor', label: 'Podlaží', width: 100, sortable: true },
  { key: 'doorNumber', label: 'Číslo bytu', width: 120, sortable: true },
  { key: 'area', label: 'Plocha (m²)', width: 120, sortable: true },
  { key: 'rooms', label: 'Pokoje', width: 100, sortable: true },
  { key: 'disposition', label: 'Dispozice', width: 140, sortable: true },
  { key: 'orientationNumber', label: 'Orientační číslo', width: 160, sortable: true },
  { key: 'yearRenovated', label: 'Rok rekonstrukce', width: 160, sortable: true },
  { key: 'status', label: 'Status', width: 150, sortable: true },
  { key: 'tenantId', label: 'ID nájemníka', width: 200, sortable: true },
  { key: 'managerName', label: 'Správce', width: 180, sortable: true },
  { key: 'cadastralArea', label: 'Katastrální území', width: 200, sortable: true },
  { key: 'parcelNumber', label: 'Parcela', width: 140, sortable: true },
  { key: 'lvNumber', label: 'LV', width: 120, sortable: true },
  { key: 'note', label: 'Poznámka', width: 220, sortable: true },
  { key: 'originModule', label: 'Zdroj', width: 160, sortable: true },
  { key: 'createdAt', label: 'Vytvořeno', width: 180, sortable: true },
  { key: 'updatedAt', label: 'Upraveno', width: 180, sortable: true },
  { key: 'isArchived', label: 'Archivováno', width: 130, sortable: true },
]
