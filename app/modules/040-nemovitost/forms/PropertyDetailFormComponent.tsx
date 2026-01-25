// FILE: app/modules/040-nemovitost/forms/PropertyDetailFormComponent.tsx
// PURPOSE: Formulář pro detail nemovitosti (jako React komponenta)
// NOTES: Similar to UnitDetailForm - controlled component with validation

'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import InputWithHistory from '@/app/UI/InputWithHistory'
import AddressAutocomplete from '@/app/UI/AddressAutocomplete'
import { REGIONS, COUNTRIES } from '@/app/lib/constants/properties'
import { supabase } from '@/app/lib/supabaseClient'

// =====================
// TYPES
// =====================

export type PropertyFormValue = {
  landlord_id: string
  property_type_id: string
  display_name: string
  internal_code: string
  
  street: string
  house_number: string
  city: string
  zip: string
  country: string
  region: string
  
  land_area: number | null
  built_up_area: number | null
  building_area: number | null
  number_of_floors: number | null
  
  build_year: number | null
  reconstruction_year: number | null
  
  cadastral_area: string
  parcel_number: string
  lv_number: string
  
  note: string
  is_archived: boolean
}

export type PropertyDetailFormProps = {
  property: Partial<PropertyFormValue>
  readOnly: boolean
  onDirtyChange?: (dirty: boolean) => void
  onValueChange?: (val: PropertyFormValue) => void
}

// =====================
// HELPERS
// =====================

function safeNum(v: any): number | null {
  const n = Number(v)
  return isNaN(n) ? null : n
}

// =====================
// COMPONENT
// =====================

export default function PropertyDetailFormComponent({
  property,
  readOnly,
  onDirtyChange,
  onValueChange,
}: PropertyDetailFormProps) {
  const [landlords, setLandlords] = useState<Array<{ id: string; display_name: string }>>([])
  
  const [formVal, setFormVal] = useState<PropertyFormValue>(() => ({
    landlord_id: property.landlord_id ?? '',
    property_type_id: property.property_type_id ?? '',
    display_name: property.display_name ?? '',
    internal_code: property.internal_code ?? '',
    
    street: property.street ?? '',
    house_number: property.house_number ?? '',
    city: property.city ?? '',
    zip: property.zip ?? '',
    country: property.country ?? 'CZ',
    region: property.region ?? '',
    
    land_area: property.land_area ?? null,
    built_up_area: property.built_up_area ?? null,
    building_area: property.building_area ?? null,
    number_of_floors: property.number_of_floors ?? null,
    
    build_year: property.build_year ?? null,
    reconstruction_year: property.reconstruction_year ?? null,
    
    cadastral_area: property.cadastral_area ?? '',
    parcel_number: property.parcel_number ?? '',
    lv_number: property.lv_number ?? '',
    
    note: property.note ?? '',
    is_archived: property.is_archived ?? false,
  }))
  
  const initialSnapshotRef = useRef<string>('')
  
  // Load landlords
  useEffect(() => {
    async function loadLandlords() {
      const { data } = await supabase
        .from('subjects')
        .select('id, display_name')
        .eq('is_landlord', true)
        .order('display_name')
      
      setLandlords(data || [])
    }
    loadLandlords()
  }, [])
  
  // Snapshot on initial mount
  useEffect(() => {
    initialSnapshotRef.current = JSON.stringify(formVal)
  }, []) // run only once
  
  // Notify parent of value changes
  useEffect(() => {
    onValueChange?.(formVal)
  }, [formVal, onValueChange])
  
  const update = useCallback((partial: Partial<PropertyFormValue>) => {
    setFormVal((prev) => {
      const next = { ...prev, ...partial }
      const currentSnap = JSON.stringify(next)
      const isDirty = currentSnap !== initialSnapshotRef.current
      onDirtyChange?.(isDirty)
      return next
    })
  }, [onDirtyChange])
  
  return (
    <div className="detail-form">
      {/* === ZÁKLADNÍ ÚDAJE === */}
      <section className="detail-form__section">
        <h3 className="detail-form__section-title">Základní údaje</h3>
        
        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field detail-form__field--span-2">
            <label className="detail-form__label">Pronajímatel *</label>
            <select
              className={`detail-form__input ${readOnly ? 'detail-form__input--readonly' : ''}`}
              value={formVal.landlord_id}
              onChange={(e) => update({ landlord_id: e.target.value })}
              disabled={readOnly}
              required
            >
              <option value="">— vyberte pronajímatele —</option>
              {landlords.map((l) => (
                <option key={l.id} value={l.id}>{l.display_name}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">Název *</label>
            <InputWithHistory
              historyId="property_display_name"
              value={formVal.display_name}
              onChange={(e) => update({ display_name: e.target.value })}
              placeholder="Např. Rodinný dům Praha 9"
              readOnly={readOnly}
              required
            />
          </div>
          
          <div className="detail-form__field">
            <label className="detail-form__label">Interní kód</label>
            <InputWithHistory
              historyId="property_internal_code"
              value={formVal.internal_code}
              onChange={(e) => update({ internal_code: e.target.value })}
              placeholder="Např. RD-001"
              readOnly={readOnly}
            />
          </div>
        </div>
      </section>
      
      {/* === ADRESA === */}
      <section className="detail-form__section">
        <h3 className="detail-form__section-title">Adresa</h3>
        
        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field detail-form__field--span-2">
            <label className="detail-form__label">Vyhledat adresu</label>
            <AddressAutocomplete
              street={formVal.street}
              houseNumber={formVal.house_number}
              city={formVal.city}
              zip={formVal.zip}
              country={formVal.country}
              onAddressChange={(address) => {
                update({
                  street: address.street || '',
                  house_number: address.houseNumber || '',
                  city: address.city || '',
                  zip: address.zip || '',
                })
              }}
              disabled={readOnly}
            />
          </div>
        </div>
        
        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">Ulice *</label>
            <input
              className={`detail-form__input ${readOnly ? 'detail-form__input--readonly' : ''}`}
              value={formVal.street}
              onChange={(e) => update({ street: e.target.value })}
              placeholder="Václavská"
              readOnly={readOnly}
              required
            />
          </div>
          
          <div className="detail-form__field">
            <label className="detail-form__label">Číslo popisné *</label>
            <input
              className={`detail-form__input ${readOnly ? 'detail-form__input--readonly' : ''}`}
              value={formVal.house_number}
              onChange={(e) => update({ house_number: e.target.value })}
              placeholder="15"
              readOnly={readOnly}
              required
            />
          </div>
        </div>
        
        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">Město *</label>
            <input
              className={`detail-form__input ${readOnly ? 'detail-form__input--readonly' : ''}`}
              value={formVal.city}
              onChange={(e) => update({ city: e.target.value })}
              placeholder="Praha"
              readOnly={readOnly}
              required
            />
          </div>
          
          <div className="detail-form__field">
            <label className="detail-form__label">PSČ *</label>
            <input
              className={`detail-form__input ${readOnly ? 'detail-form__input--readonly' : ''}`}
              value={formVal.zip}
              onChange={(e) => update({ zip: e.target.value })}
              placeholder="19000"
              pattern="^[0-9]{5}$"
              readOnly={readOnly}
              required
            />
          </div>
        </div>
        
        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">Kraj</label>
            <select
              className={`detail-form__input ${readOnly ? 'detail-form__input--readonly' : ''}`}
              value={formVal.region}
              onChange={(e) => update({ region: e.target.value })}
              disabled={readOnly}
            >
              <option value="">— vyberte kraj —</option>
              {REGIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          
          <div className="detail-form__field">
            <label className="detail-form__label">Stát</label>
            <select
              className={`detail-form__input ${readOnly ? 'detail-form__input--readonly' : ''}`}
              value={formVal.country}
              onChange={(e) => update({ country: e.target.value })}
              disabled={readOnly}
            >
              {COUNTRIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>
      </section>
      
      {/* === PLOCHY === */}
      <section className="detail-form__section">
        <h3 className="detail-form__section-title">Plochy a podlaží</h3>
        
        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">Výměra pozemku (m²)</label>
            <input
              className={`detail-form__input ${readOnly ? 'detail-form__input--readonly' : ''}`}
              type="number"
              step="0.01"
              min="0"
              value={formVal.land_area ?? ''}
              onChange={(e) => update({ land_area: safeNum(e.target.value) })}
              placeholder="850.00"
              readOnly={readOnly}
            />
          </div>
          
          <div className="detail-form__field">
            <label className="detail-form__label">Zastavěná plocha (m²)</label>
            <input
              className={`detail-form__input ${readOnly ? 'detail-form__input--readonly' : ''}`}
              type="number"
              step="0.01"
              min="0"
              value={formVal.built_up_area ?? ''}
              onChange={(e) => update({ built_up_area: safeNum(e.target.value) })}
              placeholder="120.00"
              readOnly={readOnly}
            />
          </div>
        </div>
        
        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">Užitná plocha (m²)</label>
            <input
              className={`detail-form__input ${readOnly ? 'detail-form__input--readonly' : ''}`}
              type="number"
              step="0.01"
              min="0"
              value={formVal.building_area ?? ''}
              onChange={(e) => update({ building_area: safeNum(e.target.value) })}
              placeholder="180.00"
              readOnly={readOnly}
            />
          </div>
          
          <div className="detail-form__field">
            <label className="detail-form__label">Počet podlaží</label>
            <input
              className={`detail-form__input ${readOnly ? 'detail-form__input--readonly' : ''}`}
              type="number"
              min="0"
              max="50"
              value={formVal.number_of_floors ?? ''}
              onChange={(e) => update({ number_of_floors: safeNum(e.target.value) })}
              placeholder="2"
              readOnly={readOnly}
            />
          </div>
        </div>
      </section>
      
      {/* === DATA === */}
      <section className="detail-form__section">
        <h3 className="detail-form__section-title">Data</h3>
        
        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">Rok výstavby</label>
            <input
              className={`detail-form__input ${readOnly ? 'detail-form__input--readonly' : ''}`}
              type="number"
              min="1800"
              max={new Date().getFullYear() + 5}
              value={formVal.build_year ?? ''}
              onChange={(e) => update({ build_year: safeNum(e.target.value) })}
              placeholder="1998"
              readOnly={readOnly}
            />
          </div>
          
          <div className="detail-form__field">
            <label className="detail-form__label">Rok rekonstrukce</label>
            <input
              className={`detail-form__input ${readOnly ? 'detail-form__input--readonly' : ''}`}
              type="number"
              min="1800"
              max={new Date().getFullYear() + 5}
              value={formVal.reconstruction_year ?? ''}
              onChange={(e) => update({ reconstruction_year: safeNum(e.target.value) })}
              placeholder="2018"
              readOnly={readOnly}
            />
          </div>
        </div>
      </section>
      
      {/* === POZNÁMKA === */}
      <section className="detail-form__section">
        <h3 className="detail-form__section-title">Poznámka</h3>
        
        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field detail-form__field--span-2">
            <label className="detail-form__label">Poznámka</label>
            <textarea
              className={`detail-form__input ${readOnly ? 'detail-form__input--readonly' : ''}`}
              rows={4}
              value={formVal.note}
              onChange={(e) => update({ note: e.target.value })}
              placeholder="Doplňující informace..."
              readOnly={readOnly}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
