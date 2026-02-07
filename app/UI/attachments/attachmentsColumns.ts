// FILE: app/UI/attachments/attachmentsColumns.ts

import type { ListViewColumn } from '@/app/UI/ListView'

export type AttachmentsColumnsVariant = 'list' | 'manager' | 'history'

export const ATTACHMENTS_VIEW_KEY = 'attachments'

export function getAttachmentsColumns(opts: { 
  variant: AttachmentsColumnsVariant
  entityType?: string 
}): ListViewColumn[] {
  // Equipment sloupec jen pro nemovitosti a jednotky
  const showEquipment = opts.entityType === 'property' || opts.entityType === 'properties' || 
                        opts.entityType === 'unit' || opts.entityType === 'units'

  const base: ListViewColumn[] = [
    { key: 'title', label: 'Název', width: '220px', sortable: true },
    { key: 'description', label: 'Popis', width: '260px' },
    ...(showEquipment ? [{ key: 'equipment', label: 'Vybavení', width: '180px', sortable: false }] : []),
    { key: 'file', label: 'Soubor (latest)', sortable: true },
    { key: 'ver', label: 'Verze', width: '90px', sortable: true },
    { key: 'uploaded', label: 'Nahráno', width: '220px', sortable: true },
  ]

  if (opts.variant === 'history') {
    // history často nepotřebuje "file latest", ale spíš "file version"
    return [
      { key: 'file', label: 'Soubor (verze)', sortable: true },
      { key: 'uploaded', label: 'Nahráno', width: '220px', sortable: true },
      { key: 'ver', label: 'Verze', width: '90px', sortable: true },
      { key: 'title', label: 'Název', width: '220px', sortable: true },
      { key: 'description', label: 'Popis', width: '260px' },
      ...(showEquipment ? [{ key: 'equipment', label: 'Vybavení', width: '180px', sortable: false }] : []),
    ]
  }

  return base
}
