// FILE: app/modules/040-nemovitost/propertiesColumns.ts
// PURPOSE: Sdílená definice sloupců pro nemovitosti (seznamy i vazby).
// NOTES: Vytaženo kvůli odstranění cyklických závislostí.

import type { ListViewColumn } from '@/app/UI/ListView'

export const PROPERTIES_BASE_COLUMNS: ListViewColumn[] = [
  { key: 'propertyTypeName', label: 'Typ', width: 160, sortable: true },
  { key: 'displayName', label: 'Název', width: 250, sortable: true },
  { key: 'internalCode', label: 'Interní kód', width: 140, sortable: true },
  { key: 'fullAddress', label: 'Adresa', width: 300, sortable: true },
  { key: 'street', label: 'Ulice', width: 180, sortable: true },
  { key: 'houseNumber', label: 'Číslo domu', width: 120, sortable: true },
  { key: 'city', label: 'Město', width: 160, sortable: true },
  { key: 'zip', label: 'PSČ', width: 100, sortable: true },
  { key: 'country', label: 'Země', width: 100, sortable: true },
  { key: 'region', label: 'Region', width: 160, sortable: true },
  { key: 'landlordName', label: 'Pronajímatel', width: 200, sortable: true },
  { key: 'landArea', label: 'Plocha pozemku (m²)', width: 160, sortable: true },
  { key: 'builtUpArea', label: 'Zastavěná plocha (m²)', width: 170, sortable: true },
  { key: 'buildingArea', label: 'Plocha (m²)', width: 120, sortable: true },
  { key: 'numberOfFloors', label: 'Počet podlaží', width: 140, sortable: true },
  { key: 'floorsAboveGround', label: 'NP nad terénem', width: 160, sortable: true },
  { key: 'floorsBelowGround', label: 'NP pod terénem', width: 160, sortable: true },
  { key: 'buildYear', label: 'Rok výstavby', width: 140, sortable: true },
  { key: 'reconstructionYear', label: 'Rok rekonstrukce', width: 160, sortable: true },
  { key: 'cadastralArea', label: 'Katastrální území', width: 200, sortable: true },
  { key: 'parcelNumber', label: 'Parcela', width: 140, sortable: true },
  { key: 'lvNumber', label: 'LV', width: 120, sortable: true },
  { key: 'unitsCount', label: 'Jednotky', width: 100, sortable: true },
  { key: 'createdAt', label: 'Vytvořeno', width: 180, sortable: true },
  { key: 'isArchived', label: 'Archivováno', width: 130, sortable: true },
]
