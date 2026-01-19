// FILE: app/modules/040-nemovitost/forms/UnitDetailForm.tsx
// PURPOSE: Formulář pro detail jednotky (jako React komponenta)
// NOTES: Similar structure to LandlordDetailForm - controlled component with validation

'use client'

import React, { useCallback, useEffect, useRef } from 'react'
import InputWithHistory from '@/app/UI/InputWithHistory'
import { useToast } from '@/app/UI/Toast'

// =====================
// TYPES
// =====================

export type UnitFormValue = {
  displayName: string
  internalCode: string
  propertyId: string
  unitTypeId: string
  
  street: string
  houseNumber: string
  city: string
  zip: string
  country: string
  region: string
  
  floor: number | null
  doorNumber: string
  area: number | null
  rooms: number | null
  status: string
  
  note: string
  originModule: string
  isArchived: boolean
}

export type UnitDetailFormProps = {
  unit: Partial<UnitFormValue>
  readOnly: boolean
  onDirtyChange?: (dirty: boolean) => void
  onValueChange?: (val: UnitFormValue) => void
}

// =====================
// HELPERS
// =====================

function safe(v: any): string {
  return (v ?? '').toString()
}

function safeNumber(v: any): number | null {
  if (v === null || v === undefined || v === '') return null
  const num = Number(v)
  return isNaN(num) ? null : num
}

// Validace PSČ
function validateZip(value: string): string | null {
  if (!value) return null
  const cleaned = value.replace(/\s+/g, '')
  if (!/^\d{5}$/.test(cleaned)) {
    return 'PSČ musí mít 5 číslic'
  }
  return null
}

// =====================
// COMPONENT
// =====================

export default function UnitDetailForm({
  unit,
  readOnly,
  onDirtyChange,
  onValueChange,
}: UnitDetailFormProps) {
  const toast = useToast()
  const initialSnapshotRef = useRef<string>('')
  const firstRenderRef = useRef(true)
  
  // Build current form value
  const formValue: UnitFormValue = {
    displayName: safe(unit.displayName),
    internalCode: safe(unit.internalCode),
    propertyId: safe(unit.propertyId),
    unitTypeId: safe(unit.unitTypeId),
    
    street: safe(unit.street),
    houseNumber: safe(unit.houseNumber),
    city: safe(unit.city),
    zip: safe(unit.zip),
    country: safe(unit.country || 'CZ'),
    region: safe(unit.region),
    
    floor: safeNumber(unit.floor),
    doorNumber: safe(unit.doorNumber),
    area: safeNumber(unit.area),
    rooms: safeNumber(unit.rooms),
    status: safe(unit.status || 'available'),
    
    note: safe(unit.note),
    originModule: safe(unit.originModule || '040-nemovitost'),
    isArchived: !!unit.isArchived,
  }
  
  // Initialize snapshot
  useEffect(() => {
    if (firstRenderRef.current) {
      initialSnapshotRef.current = JSON.stringify(formValue)
      firstRenderRef.current = false
    }
  }, [])
  
  // Dirty tracking
  useEffect(() => {
    if (firstRenderRef.current) return
    const currentSnap = JSON.stringify(formValue)
    const isDirty = currentSnap !== initialSnapshotRef.current
    onDirtyChange?.(isDirty)
  }, [formValue, onDirtyChange])
  
  // Handle field change
  const handleChange = useCallback((field: keyof UnitFormValue, value: any) => {
    const updated = { ...formValue, [field]: value }
    onValueChange?.(updated)
  }, [formValue, onValueChange])
  
  const inputClass = readOnly ? 'detail-form__input detail-form__input--readonly' : 'detail-form__input'
  
  return (
    <div className="detail-form">
      {/* Základní údaje */}
      <div className="detail-form__section">
        <h3 className="detail-form__section-title">Základní údaje</h3>
        
        <div className="detail-form__field">
          <label className="detail-form__label">Název jednotky *</label>
          <InputWithHistory
            className={inputClass}
            value={formValue.displayName}
            onChange={(e) => handleChange('displayName', e.target.value)}
            readOnly={readOnly}
            placeholder="např. Byt 2+kk, 1.NP"
          />
        </div>
        
        <div className="detail-form__field">
          <label className="detail-form__label">Interní kód</label>
          <InputWithHistory
            className={inputClass}
            value={formValue.internalCode}
            onChange={(e) => handleChange('internalCode', e.target.value)}
            readOnly={readOnly}
            placeholder="např. U-001"
          />
        </div>
      </div>
      
      {/* Prostor */}
      <div className="detail-form__section">
        <h3 className="detail-form__section-title">Prostor</h3>
        
        <div className="detail-form__field">
          <label className="detail-form__label">Podlaží</label>
          <input
            type="number"
            className={inputClass}
            value={formValue.floor ?? ''}
            onChange={(e) => handleChange('floor', e.target.value ? Number(e.target.value) : null)}
            readOnly={readOnly}
            placeholder="např. 1, -1 (suterén)"
          />
        </div>
        
        <div className="detail-form__field">
          <label className="detail-form__label">Číslo dveří</label>
          <InputWithHistory
            className={inputClass}
            value={formValue.doorNumber}
            onChange={(e) => handleChange('doorNumber', e.target.value)}
            readOnly={readOnly}
            placeholder="např. 12, A3"
          />
        </div>
        
        <div className="detail-form__field">
          <label className="detail-form__label">Plocha (m²)</label>
          <input
            type="number"
            step="0.01"
            className={inputClass}
            value={formValue.area ?? ''}
            onChange={(e) => handleChange('area', e.target.value ? Number(e.target.value) : null)}
            readOnly={readOnly}
            placeholder="např. 65.50"
          />
        </div>
        
        <div className="detail-form__field">
          <label className="detail-form__label">Počet pokojů</label>
          <input
            type="number"
            step="0.5"
            className={inputClass}
            value={formValue.rooms ?? ''}
            onChange={(e) => handleChange('rooms', e.target.value ? Number(e.target.value) : null)}
            readOnly={readOnly}
            placeholder="např. 2, 2.5"
          />
        </div>
      </div>
      
      {/* Status */}
      <div className="detail-form__section">
        <h3 className="detail-form__section-title">Status</h3>
        
        <div className="detail-form__field">
          <label className="detail-form__label">Stav jednotky *</label>
          <select
            className={inputClass}
            value={formValue.status}
            onChange={(e) => handleChange('status', e.target.value)}
            disabled={readOnly}
          >
            <option value="available">🟢 Volná</option>
            <option value="occupied">🔴 Obsazená</option>
            <option value="reserved">🟡 Rezervovaná</option>
            <option value="renovation">🟤 V rekonstrukci</option>
          </select>
        </div>
      </div>
      
      {/* Poznámka */}
      <div className="detail-form__section">
        <h3 className="detail-form__section-title">Poznámka</h3>
        
        <div className="detail-form__field">
          <label className="detail-form__label">Interní poznámka</label>
          <textarea
            className={inputClass}
            value={formValue.note}
            onChange={(e) => handleChange('note', e.target.value)}
            readOnly={readOnly}
            rows={5}
            placeholder="Libovolná poznámka k jednotce..."
          />
        </div>
      </div>
    </div>
  )
}

