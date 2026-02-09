// FILE: app/modules/800-subjekty/subjectsColumns.ts
// PURPOSE: Sdílená definice sloupců pro subjekty (seznamy i vazby).
// NOTES: Vytaženo kvůli odstranění cyklických závislostí.

import type { ListViewColumn } from '@/app/UI/ListView'

export const SUBJECTS_BASE_COLUMNS: ListViewColumn[] = [
  { key: 'subjectTypeLabel', label: 'Typ subjektu', width: 160, sortable: true },
  { key: 'displayName', label: 'Zobrazované jméno', width: 220, sortable: true },
  { key: 'fullAddress', label: 'Adresa', width: 300, sortable: true },
  { key: 'email', label: 'E-mail', width: 260, sortable: true },
  { key: 'phone', label: 'Telefon', width: 180, sortable: true },
  { key: 'companyName', label: 'Název společnosti', width: 220, sortable: true },
  { key: 'ic', label: 'IČ', width: 120, sortable: true },
  { key: 'firstName', label: 'Jméno', width: 160, sortable: true },
  { key: 'lastName', label: 'Příjmení', width: 180, sortable: true },
  { key: 'isArchived', label: 'Archivován', width: 120, align: 'center', sortable: true },
]
