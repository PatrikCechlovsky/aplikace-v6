// FILE: app/modules/070-sluzby/forms/ServiceCatalogDetailFormComponent.tsx
// PURPOSE: Form component pro service catalog detail/edit
// NOTES: Načítá selecty z generic_types

'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/app/lib/supabaseClient'
import type { ServiceCatalogFormValue } from './ServiceCatalogDetailForm'

import '@/app/styles/components/DetailForm.css'

export type ServiceCatalogDetailFormProps = {
  service: Partial<ServiceCatalogFormValue>
  readOnly: boolean
  onDirtyChange?: (dirty: boolean) => void
  onValueChange?: (val: ServiceCatalogFormValue) => void
}

type SelectOption = {
  id: string
  name: string
}

export default function ServiceCatalogDetailFormComponent({
  service,
  readOnly,
  onDirtyChange,
  onValueChange,
}: ServiceCatalogDetailFormProps) {
  const [categories, setCategories] = useState<SelectOption[]>([])
  const [billingTypes, setBillingTypes] = useState<SelectOption[]>([])
  const [units, setUnits] = useState<SelectOption[]>([])
  const [vatRates, setVatRates] = useState<SelectOption[]>([])

  const [formVal, setFormVal] = useState<ServiceCatalogFormValue>(() => ({
    code: service.code ?? '',
    name: service.name ?? '',
    category_id: service.category_id,
    billing_type_id: service.billing_type_id,
    unit_id: service.unit_id,
    vat_rate_id: service.vat_rate_id,
    base_price: service.base_price,
    description: service.description,
    note: service.note,
    active: service.active ?? true,
    is_archived: service.is_archived ?? false,
  }))

  const initialSnapshotRef = useRef<string>('')

  useEffect(() => {
    initialSnapshotRef.current = JSON.stringify(formVal)
  }, [])

  useEffect(() => {
    onValueChange?.(formVal)
  }, [formVal, onValueChange])

  useEffect(() => {
    async function loadOptions(category: string, setter: (rows: SelectOption[]) => void) {
      const { data, error } = await supabase
        .from('generic_types')
        .select('id, name')
        .eq('category', category)
        .eq('active', true)
        .order('order_index', { ascending: true })
        .order('name', { ascending: true })

      if (error) {
        console.error(`Failed to load ${category}:`, error)
        return
      }
      setter((data as SelectOption[]) || [])
    }

    void loadOptions('service_types', setCategories)
    void loadOptions('service_billing_types', setBillingTypes)
    void loadOptions('service_units', setUnits)
    void loadOptions('vat_rates', setVatRates)
  }, [])

  const update = useCallback(
    (partial: Partial<ServiceCatalogFormValue>) => {
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
      <section className="detail-form__section">
        <h3 className="detail-form__section-title">Základní údaje</h3>
        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">Kód služby</label>
            <input
              className={inputClass}
              type="text"
              value={formVal.code}
              onChange={(e) => update({ code: e.target.value })}
              placeholder="např. teplo"
              readOnly={readOnly}
            />
          </div>

          <div className="detail-form__field detail-form__field--span-2">
            <label className="detail-form__label">Název služby</label>
            <input
              className={inputClass}
              type="text"
              value={formVal.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="Např. Teplo"
              readOnly={readOnly}
            />
          </div>

          <div className="detail-form__field">
            <label className="detail-form__label">Kategorie</label>
            <select
              className={inputClass}
              value={formVal.category_id || ''}
              onChange={(e) => update({ category_id: e.target.value || undefined })}
              disabled={readOnly}
            >
              <option value="">— vyberte kategorii —</option>
              {categories.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="detail-form__section">
        <h3 className="detail-form__section-title">Účtování</h3>
        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">Typ účtování</label>
            <select
              className={inputClass}
              value={formVal.billing_type_id || ''}
              onChange={(e) => update({ billing_type_id: e.target.value || undefined })}
              disabled={readOnly}
            >
              <option value="">— vyberte typ —</option>
              {billingTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="detail-form__field">
            <label className="detail-form__label">Jednotka</label>
            <select
              className={inputClass}
              value={formVal.unit_id || ''}
              onChange={(e) => update({ unit_id: e.target.value || undefined })}
              disabled={readOnly}
            >
              <option value="">— vyberte jednotku —</option>
              {units.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="detail-form__section">
        <h3 className="detail-form__section-title">Cena a DPH</h3>
        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">Základní cena (Kč)</label>
            <input
              className={inputClass}
              type="number"
              min="0"
              value={formVal.base_price ?? ''}
              onChange={(e) => update({ base_price: e.target.value ? parseFloat(e.target.value) : undefined })}
              placeholder="0"
              readOnly={readOnly}
            />
          </div>

          <div className="detail-form__field">
            <label className="detail-form__label">DPH sazba</label>
            <select
              className={inputClass}
              value={formVal.vat_rate_id || ''}
              onChange={(e) => update({ vat_rate_id: e.target.value || undefined })}
              disabled={readOnly}
            >
              <option value="">— vyberte DPH —</option>
              {vatRates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="detail-form__section">
        <h3 className="detail-form__section-title">Popis a poznámky</h3>
        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field detail-form__field--span-2">
            <label className="detail-form__label">Popis</label>
            <textarea
              className={inputClass}
              rows={3}
              value={formVal.description ?? ''}
              onChange={(e) => update({ description: e.target.value || undefined })}
              placeholder="Stručný popis služby"
              readOnly={readOnly}
            />
          </div>

          <div className="detail-form__field detail-form__field--span-2">
            <label className="detail-form__label">Poznámka</label>
            <textarea
              className={inputClass}
              rows={3}
              value={formVal.note ?? ''}
              onChange={(e) => update({ note: e.target.value || undefined })}
              placeholder="Interní poznámky"
              readOnly={readOnly}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
