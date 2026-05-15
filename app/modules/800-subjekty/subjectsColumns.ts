// FILE: app/modules/800-subjekty/subjectsColumns.ts
// PURPOSE: Sdílená definice sloupců pro subjekty (seznamy i vazby).
// NOTES: Vytaženo kvůli odstranění cyklických závislostí.

import type { ListViewColumn } from '@/app/UI/ListView'

export const SUBJECTS_BASE_COLUMNS: ListViewColumn[] = [
  { key: 'subjectTypeLabel', label: 'Typ subjektu', width: 160, sortable: true },
  { key: 'subjectTypeCode', label: 'Typ (kód)', width: 140, sortable: true },
  { key: 'displayName', label: 'Zobrazované jméno', width: 220, sortable: true },
  { key: 'titleBefore', label: 'Titul', width: 120, sortable: true },
  { key: 'fullAddress', label: 'Adresa', width: 300, sortable: true },
  { key: 'street', label: 'Ulice', width: 180, sortable: true },
  { key: 'houseNumber', label: 'Číslo domu', width: 120, sortable: true },
  { key: 'city', label: 'Město', width: 160, sortable: true },
  { key: 'zip', label: 'PSČ', width: 100, sortable: true },
  { key: 'country', label: 'Země', width: 120, sortable: true },
  { key: 'email', label: 'E-mail', width: 260, sortable: true },
  { key: 'phone', label: 'Telefon', width: 180, sortable: true },
  { key: 'companyName', label: 'Název společnosti', width: 220, sortable: true },
  { key: 'ic', label: 'IČ', width: 120, sortable: true },
  { key: 'dic', label: 'DIČ', width: 140, sortable: true },
  { key: 'firstName', label: 'Jméno', width: 160, sortable: true },
  { key: 'lastName', label: 'Příjmení', width: 180, sortable: true },
  { key: 'birthDate', label: 'Datum narození', width: 160, sortable: true },
  { key: 'personalIdNumber', label: 'Rodné číslo', width: 160, sortable: true },
  { key: 'idDocType', label: 'Typ dokladu', width: 160, sortable: true },
  { key: 'idDocNumber', label: 'Číslo dokladu', width: 180, sortable: true },
  { key: 'landlordSeq', label: 'Poř. číslo', width: 120, sortable: true },
  { key: 'isUser', label: 'Uživatel', width: 120, sortable: true },
  { key: 'isLandlord', label: 'Pronajímatel', width: 140, sortable: true },
  { key: 'isTenant', label: 'Nájemník', width: 120, sortable: true },
  { key: 'isLandlordDelegate', label: 'Zástupce pronajímatel', width: 200, sortable: true },
  { key: 'isTenantDelegate', label: 'Zástupce nájemník', width: 200, sortable: true },
  { key: 'isMaintenance', label: 'Údržba', width: 140, sortable: true },
  { key: 'isMaintenanceDelegate', label: 'Zástupce údržba', width: 200, sortable: true },
  { key: 'createdAt', label: 'Vytvořeno', width: 180, sortable: true },
  { key: 'isArchived', label: 'Archivován', width: 120, align: 'center', sortable: true },
]
