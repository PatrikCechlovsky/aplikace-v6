// FILE: app/modules/040-nemovitost/forms/EquipmentCatalogDetailFormComponent.tsx
// PURPOSE: Form component pro equipment catalog detail/edit
// NOTES: Similar to PropertyDetailFormComponent - controlled component with validation

'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { EQUIPMENT_STATES } from '@/app/lib/constants/properties'
import { supabase } from '@/app/lib/supabaseClient'
import type { EquipmentCatalogFormValue } from './EquipmentCatalogDetailForm'

import '@/app/styles/components/DetailForm.css'

export type EquipmentCatalogDetailFormProps = {
  equipment: Partial<EquipmentCatalogFormValue>
  readOnly: boolean
  onDirtyChange?: (dirty: boolean) => void
  onValueChange?: (val: EquipmentCatalogFormValue) => void
}

type SelectOption = {
  id: string
  name: string
  icon?: string | null
  color?: string | null
}

export default function EquipmentCatalogDetailFormComponent({
  equipment,
  readOnly,
  onDirtyChange,
  onValueChange,
}: EquipmentCatalogDetailFormProps) {
  const [equipmentTypes, setEquipmentTypes] = useState<SelectOption[]>([])
  const [roomTypes, setRoomTypes] = useState<SelectOption[]>([])

  const [formVal, setFormVal] = useState<EquipmentCatalogFormValue>(() => ({
    equipment_name: equipment.equipment_name ?? '',
    equipment_type_id: equipment.equipment_type_id ?? '',
    room_type_id: equipment.room_type_id,
    purchase_price: equipment.purchase_price,
    purchase_date: equipment.purchase_date,
    default_lifespan_months: equipment.default_lifespan_months,
    default_revision_interval: equipment.default_revision_interval,
    default_state: equipment.default_state ?? 'working',
    default_description: equipment.default_description,
    active: equipment.active ?? true,
    is_archived: equipment.is_archived ?? false,
  }))

  const initialSnapshotRef = useRef<string>('')

  // Load equipment types
  useEffect(() => {
    async function loadEquipmentTypes() {
      const { data, error } = await supabase
        .from('generic_types')
        .select('id, name, icon, color')
        .eq('type_category', 'equipment_types')
        .eq('active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })

      if (error) {
        console.error('Failed to load equipment types:', error)
        return
      }

      setEquipmentTypes((data as SelectOption[]) || [])
    }

    void loadEquipmentTypes()
  }, [])

  // Load room types
  useEffect(() => {
    async function loadRoomTypes() {
      const { data, error } = await supabase
        .from('generic_types')
        .select('id, name, icon, color')
        .eq('type_category', 'room_types')
        .eq('active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })

      if (error) {
        console.error('Failed to load room types:', error)
        return
      }

      setRoomTypes((data as SelectOption[]) || [])
    }

    void loadRoomTypes()
  }, [])

  // Snapshot on initial mount
  useEffect(() => {
    initialSnapshotRef.current = JSON.stringify(formVal)
  }, [])

  // Notify parent of value changes
  useEffect(() => {
    onValueChange?.(formVal)
  }, [formVal, onValueChange])

  const update = useCallback(
    (partial: Partial<EquipmentCatalogFormValue>) => {
      setFormVal((prev) => {
        const next = { ...prev, ...partial }
        const currentSnap = JSON.stringify(next)
        const isDirty = currentSnap !== initialSnapshotRef.current
        onDirtyChange?.(isDirty)
        return next
      })
    },
    [onDirtyChange]
  )

  const inputClass = readOnly
    ? 'detail-form__input detail-form__input--readonly'
    : 'detail-form__input'

  return (
    <div className="detail-form">
      {/* === ZÁKLADNÍ ÚDAJE === */}
      <section className="detail-form__section">
        <h3 className="detail-form__section-title">Základní údaje</h3>

        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field detail-form__field--span-2">
            <label className="detail-form__label">Název vybavení</label>
            <input
              className={inputClass}
              type="text"
              value={formVal.equipment_name}
              onChange={(e) => update({ equipment_name: e.target.value })}
              placeholder="Např. Pračka Candy CS4"
              readOnly={readOnly}
            />
          </div>

          <div className="detail-form__field">
            <label className="detail-form__label">Typ vybavení</label>
            <select
              className={inputClass}
              value={formVal.equipment_type_id}
              onChange={(e) => update({ equipment_type_id: e.target.value })}
              disabled={readOnly}
            >
              <option value="">— vyberte typ —</option>
              {equipmentTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="detail-form__field">
            <label className="detail-form__label">Typ místnosti</label>
            <select
              className={inputClass}
              value={formVal.room_type_id || ''}
              onChange={(e) => update({ room_type_id: e.target.value || undefined })}
              disabled={readOnly}
            >
              <option value="">— nevyplněno —</option>
              {roomTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* === CENA === */}
      <section className="detail-form__section">
        <h3 className="detail-form__section-title">Cena</h3>

        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">Pořizovací cena (Kč)</label>
            <input
              className={inputClass}
              type="number"
              min="0"
              value={formVal.purchase_price ?? ''}
              onChange={(e) =>
                update({
                  purchase_price: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
              placeholder="15000"
              readOnly={readOnly}
            />
          </div>

          <div className="detail-form__field">
            <label className="detail-form__label">Datum nákupu</label>
            <input
              className={inputClass}
              type="date"
              value={formVal.purchase_date ?? ''}
              onChange={(e) => update({ purchase_date: e.target.value || undefined })}
              readOnly={readOnly}
            />
          </div>
        </div>
      </section>

      {/* === ŽIVOTNOST === */}
      <section className="detail-form__section">
        <h3 className="detail-form__section-title">Životnost a revize</h3>

        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">Životnost (měsíce)</label>
            <input
              className={inputClass}
              type="number"
              min="0"
              value={formVal.default_lifespan_months ?? ''}
              onChange={(e) =>
                update({
                  default_lifespan_months: e.target.value
                    ? parseInt(e.target.value, 10)
                    : undefined,
                })
              }
              placeholder="120"
              readOnly={readOnly}
            />
          </div>

          <div className="detail-form__field">
            <label className="detail-form__label">Interval revizí (měsíce)</label>
            <input
              className={inputClass}
              type="number"
              min="0"
              value={formVal.default_revision_interval ?? ''}
              onChange={(e) =>
                update({
                  default_revision_interval: e.target.value
                    ? parseInt(e.target.value, 10)
                    : undefined,
                })
              }
              placeholder="12"
              readOnly={readOnly}
            />
          </div>

          <div className="detail-form__field">
            <label className="detail-form__label">Výchozí stav</label>
            <select
              className={inputClass}
              value={formVal.default_state ?? 'working'}
              onChange={(e) => update({ default_state: e.target.value })}
              disabled={readOnly}
            >
              {EQUIPMENT_STATES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* === POPIS === */}
      <section className="detail-form__section">
        <h3 className="detail-form__section-title">Popis</h3>

        <div className="detail-form__field">
          <label className="detail-form__label">Poznámka</label>
          <textarea
            className={inputClass}
            value={formVal.default_description ?? ''}
            onChange={(e) => update({ default_description: e.target.value || undefined })}
            placeholder="Doplňující informace..."
            rows={4}
            readOnly={readOnly}
          />
        </div>
      </section>

      {/* === SYSTÉM === */}
      <section className="detail-form__section">
        <h3 className="detail-form__section-title">Systém</h3>

        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">Aktivní</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={formVal.active ?? true}
                onChange={(e) => update({ active: e.target.checked })}
                disabled={readOnly}
              />
              <span>{formVal.active ? 'Ano' : 'Ne'}</span>
            </div>
          </div>

          <div className="detail-form__field">
            <label className="detail-form__label">Archivováno</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={formVal.is_archived ?? false}
                onChange={(e) => update({ is_archived: e.target.checked })}
                disabled={readOnly}
              />
              <span>{formVal.is_archived ? 'Ano' : 'Ne'}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
