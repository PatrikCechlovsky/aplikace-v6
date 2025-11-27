/*
 * FILE: app/modules/010-sprava-uzivatelu/RolesConfigPanel.tsx
 * PURPOSE: Příklad použití ConfigListWithForm pro "Typ role"
 * Zatím jen lokální state – Supabase přidáme později.
 */

'use client'

import { useState } from 'react'
import ConfigListWithForm, {
  ConfigItemBase,
} from '@/app/UI/ConfigListWithForm'

type RoleTypeItem = ConfigItemBase

const INITIAL_ROLES: RoleTypeItem[] = [
  { id: 1, code: 'admin', name: 'Administrátor', color: '#f4d35e', icon: 'admin', order: 1 },
  { id: 2, code: 'manager', name: 'Manager', color: '#e05570', icon: 'manager', order: 2 },
  { id: 3, code: 'najemnik', name: 'Nájemník', color: '#1e6fff', icon: 'tenant', order: 3 },
  { id: 4, code: 'pronajimatel', name: 'Pronajímatel', color: '#1fb086', icon: 'landlord', order: 4 },
]

export default function RolesConfigPanel() {
  const [items, setItems] = useState<RoleTypeItem[]>(INITIAL_ROLES)
  const [selectedId, setSelectedId] = useState<string | number | null>(
    INITIAL_ROLES[0]?.id ?? null,
  )

  const updateSelected = (patch: Partial<RoleTypeItem>) => {
    setItems((prev) =>
      prev.map((x) =>
        x.id === selectedId ? { ...x, ...patch } : x,
      ),
    )
  }

  return (
    <ConfigListWithForm<RoleTypeItem>
      title="Role & barvy"
      items={items}
      selectedId={selectedId}
      onSelect={setSelectedId}
      onChangeField={(field, value) => {
        updateSelected({ [field]: value } as Partial<RoleTypeItem>)
      }}
      onSave={() => {
        // TODO: sem později Supabase upsert
        console.log('SAVE', items.find((x) => x.id === selectedId))
      }}
      onNew={() => {
        const newId = Date.now()
        const newItem: RoleTypeItem = {
          id: newId,
          code: '',
          name: '',
          color: '#e05570',
          icon: 'user',
          order:
            (items.reduce(
              (max, x) => Math.max(max, x.order ?? 0),
              0,
            ) || 0) + 1,
        }
        setItems((prev) => [...prev, newItem])
        setSelectedId(newId)
      }}
      onDelete={() => {
        if (!selectedId) return
        setItems((prev) => prev.filter((x) => x.id !== selectedId))
        setSelectedId(null)
      }}
    />
  )
}
