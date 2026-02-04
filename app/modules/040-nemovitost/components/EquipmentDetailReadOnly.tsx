// FILE: app/modules/040-nemovitost/components/EquipmentDetailReadOnly.tsx
// PURPOSE: Read-only zobrazení detailu vybavení s přílohy
// NOTES: Otevírá se v sidepanelu/modalu při kliknutí na řádek v seznamu

'use client'

import React, { useState } from 'react'
import type { UnitEquipmentRow, PropertyEquipmentRow } from '@/app/lib/services/equipment'
import { EQUIPMENT_STATES } from '@/app/lib/constants/properties'
import { getIcon, type IconKey } from '@/app/UI/icons'
import EquipmentAttachmentsModal from './EquipmentAttachmentsModal'
import '@/app/styles/components/DetailForm.css'

type EquipmentRow = UnitEquipmentRow | PropertyEquipmentRow

type Props = {
  equipment: EquipmentRow
  entityType: 'property' | 'unit'
  onClose: () => void
}

export default function EquipmentDetailReadOnly({ equipment, entityType, onClose }: Props) {
  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false)

  const equipmentType = EQUIPMENT_STATES.find((s) => s.value === equipment.state)?.label || equipment.state

  return (
    <div style={{ padding: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ margin: 0 }}>{equipment.catalog_equipment_name || 'Vybavení'}</h3>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '20px',
            padding: 0,
          }}
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--color-border)' }}>
        <button
          type="button"
          style={{
            padding: '8px 12px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            borderBottom: '2px solid var(--color-primary)',
            color: 'var(--color-primary)',
          }}
        >
          Detail
        </button>
      </div>

      {/* Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: 4 }}>
            Typ vybavení (katalog)
          </label>
          <div style={{ fontSize: '14px', padding: '8px' }}>
            {equipment.equipment_type_name || '—'}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: 4 }}>
            Typ (konkrétní)
          </label>
          <div style={{ fontSize: '14px', padding: '8px' }}>
            {(equipment as any).equipment_type_id ? '✓' : '—'}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: 4 }}>
            Místnost
          </label>
          <div style={{ fontSize: '14px', padding: '8px' }}>
            {(equipment as any).room_type_name || '—'}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: 4 }}>
            Množství
          </label>
          <div style={{ fontSize: '14px', padding: '8px' }}>
            {equipment.quantity || 1}×
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: 4 }}>
            Stav
          </label>
          <div style={{ fontSize: '14px', padding: '8px' }}>
            {equipmentType}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: 4 }}>
            Jednotková cena
          </label>
          <div style={{ fontSize: '14px', padding: '8px' }}>
            {equipment.catalog_purchase_price
              ? `${equipment.catalog_purchase_price.toLocaleString('cs-CZ')} Kč`
              : '—'}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: 4 }}>
            Celková cena
          </label>
          <div style={{ fontSize: '14px', padding: '8px' }}>
            {equipment.total_price ? `${equipment.total_price.toLocaleString('cs-CZ')} Kč` : '—'}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: 4 }}>
            Instalováno
          </label>
          <div style={{ fontSize: '14px', padding: '8px' }}>
            {equipment.installed_at || '—'}
          </div>
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: 4 }}>
            Popis
          </label>
          <div style={{ fontSize: '14px', padding: '8px', whiteSpace: 'pre-wrap' }}>
            {equipment.description || '—'}
          </div>
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: 4 }}>
            Poznámka
          </label>
          <div style={{ fontSize: '14px', padding: '8px', whiteSpace: 'pre-wrap' }}>
            {equipment.note || '—'}
          </div>
        </div>
      </div>

      {/* Attachments Button */}
      <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--color-border)' }}>
        <button
          type="button"
          onClick={() => setAttachmentsModalOpen(true)}
          className="common-actions__btn"
          style={{ width: '100%' }}
        >
          <span className="common-actions__icon">{getIcon('attachment' as IconKey)}</span>
          <span className="common-actions__label">📎 Přílohy ({0})</span>
        </button>
      </div>

      {/* Attachments Modal */}
      <EquipmentAttachmentsModal
        isOpen={attachmentsModalOpen}
        onClose={() => setAttachmentsModalOpen(false)}
        equipmentBindingId={equipment.id}
        bindingType={entityType === 'property' ? 'property_equipment' : 'unit_equipment'}
        equipmentName={equipment.catalog_equipment_name || 'Vybavení'}
      />
    </div>
  )
}
