// FILE: app/modules/060-smlouva/contractsColumns.ts
// PURPOSE: Sdílená definice sloupců pro smlouvy (seznamy i vazby).
// NOTES: Vytaženo kvůli odstranění cyklických závislostí.

import type { ListViewColumn } from '@/app/UI/ListView'

export const CONTRACTS_BASE_COLUMNS: ListViewColumn[] = [
  { key: 'contractNumber', label: 'Číslo smlouvy', width: 160, sortable: true },
  { key: 'status', label: 'Stav', width: 140, sortable: true },
  { key: 'tenantName', label: 'Nájemník', width: 220, sortable: true },
  { key: 'unitName', label: 'Jednotka', width: 180, sortable: true },
  { key: 'propertyName', label: 'Nemovitost', width: 220, sortable: true },
  { key: 'validFrom', label: 'Začátek', width: 120, sortable: true },
  { key: 'validTo', label: 'Konec', width: 120, sortable: true },
  { key: 'paymentState', label: 'Stav plateb', width: 160, sortable: true },
]
