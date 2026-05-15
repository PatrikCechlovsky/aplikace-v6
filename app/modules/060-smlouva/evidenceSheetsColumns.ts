// FILE: app/modules/060-smlouva/evidenceSheetsColumns.ts
// PURPOSE: Sloupce a nastavení ListView pro evidenční listy smlouvy
// NOTES: Používá se v ContractEvidenceSheetsTab pro úpravu sloupců

import type { ListViewColumn, ListViewSortState } from '@/app/UI/ListView'

export const EVIDENCE_SHEETS_VIEW_KEY = '060.contract-evidence-sheets.list'

export const EVIDENCE_SHEETS_DEFAULT_SORT: ListViewSortState = {
  key: 'sheetNumber',
  dir: 'desc',
}

export const EVIDENCE_SHEETS_BASE_COLUMNS: ListViewColumn[] = [
  { key: 'sheetNumber', label: 'Číslo', width: 110, sortable: true },
  { key: 'status', label: 'Stav', width: 150, sortable: true },
  { key: 'validFrom', label: 'Platný od', width: 140, sortable: true },
  { key: 'validTo', label: 'Platný do', width: 140, sortable: true },
  { key: 'totalPersons', label: 'Osob', width: 90, sortable: true, align: 'center' },
  { key: 'servicesTotal', label: 'Služby (Kč)', width: 140, sortable: true, align: 'right' },
  { key: 'totalAmount', label: 'Celkem (Kč)', width: 140, sortable: true, align: 'right' },
]
