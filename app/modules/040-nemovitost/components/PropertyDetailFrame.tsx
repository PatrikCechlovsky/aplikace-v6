// FILE: app/modules/040-nemovitost/components/PropertyDetailFrame.tsx
// PURPOSE: Detail view pro nemovitost (read/edit mode) s tabs
// NOTES: Analogie k UnitDetailFrame - používá DetailView s PropertyDetailFormComponent

'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import DetailView, { type DetailSectionId, type DetailViewMode } from '@/app/UI/DetailView'
import type { ViewMode } from '@/app/UI/CommonActions'
import PropertyDetailFormComponent, { type PropertyFormValue } from '../forms/PropertyDetailFormComponent'
import { getPropertyDetail, saveProperty, type SavePropertyInput } from '@/app/lib/services/properties'
import { formatDateTime } from '@/app/lib/formatters/formatDateTime'
import createLogger from '@/app/lib/logger'
import { useToast } from '@/app/UI/Toast'
import { supabase } from '@/app/lib/supabaseClient'
import EquipmentTab from './EquipmentTab'

import '@/app/styles/components/TileLayout.css'
import '@/app/styles/components/DetailForm.css'

const logger = createLogger('PropertyDetailFrame')

// =====================
// TYPES
// =====================

export type UiProperty = {
  id: string
  landlordId: string | null
  propertyTypeId: string | null
  displayName: string | null
  internalCode: string | null
  
  // Address
  street: string | null
  houseNumber: string | null
  city: string | null
  zip: string | null
  country: string | null
  region: string | null
  
  // Areas
  landArea: number | null
  builtUpArea: number | null
  buildingArea: number | null
  numberOfFloors: number | null
  floorsAboveGround: number | null
  floorsBelowGround: number | null
  unitsCount: number | null
  
  // Dates
  buildYear: number | null
  reconstructionYear: number | null
  
  // Cadastre
  cadastralArea: string | null
  parcelNumber: string | null
  lvNumber: string | null
  
  // Metadata
  note: string | null
  originModule: string | null
  isArchived: boolean | null
  createdAt: string | null
  updatedAt: string | null
}

type Props = {
  property: UiProperty
  viewMode: ViewMode
  initialSectionId?: DetailSectionId
  onActiveSectionChange?: (id: DetailSectionId) => void
  onRegisterSubmit?: (fn: () => Promise<UiProperty | null>) => void
  onDirtyChange?: (dirty: boolean) => void
  onSaved?: (property: UiProperty) => void
  embedded?: boolean
}

// =====================
// HELPERS
// =====================

function buildInitialFormValue(p: UiProperty): PropertyFormValue {
  return {
    landlord_id: p.landlordId || '',
    property_type_id: p.propertyTypeId || '',
    display_name: p.displayName || '',
    internal_code: p.internalCode || '',
    
    street: p.street || '',
    house_number: p.houseNumber || '',
    city: p.city || '',
    zip: p.zip || '',
    country: p.country || 'CZ',
    region: p.region || '',
    
    land_area: p.landArea ?? null,
    built_up_area: p.builtUpArea ?? null,
    building_area: p.buildingArea ?? null,
    number_of_floors: p.numberOfFloors ?? null,
    floors_above_ground: p.floorsAboveGround ?? null,
    floors_below_ground: p.floorsBelowGround ?? null,
    units_count: p.unitsCount ?? null,
    
    build_year: p.buildYear ?? null,
    reconstruction_year: p.reconstructionYear ?? null,
    
    cadastral_area: p.cadastralArea || '',
    parcel_number: p.parcelNumber || '',
    lv_number: p.lvNumber || '',
    
    note: p.note || '',
    is_archived: p.isArchived || false,
  }
}

function isNewId(id: string | null | undefined) {
  const s = String(id ?? '').trim()
  return !s || s === 'new'
}

// =====================
// COMPONENT
// =====================

export default function PropertyDetailFrame({
  property,
  viewMode,
  initialSectionId,
  onActiveSectionChange,
  onRegisterSubmit,
  onDirtyChange,
  onSaved,
  embedded = false,
}: Props) {
  const [resolvedProperty, setResolvedProperty] = useState<UiProperty>(property)
  const resolveSeqRef = useRef(0)

  const toast = useToast()
  const initialSnapshotRef = useRef<string>('')
  const firstRenderRef = useRef(true)

  const [formValue, setFormValue] = useState<PropertyFormValue>(() => buildInitialFormValue(property))
  const formValueRef = useRef<PropertyFormValue>(formValue)

  const [propertyTypes, setPropertyTypes] = useState<Array<{ id: string; name: string; icon?: string | null }>>([])
  const [selectedPropertyTypeId, setSelectedPropertyTypeId] = useState<string | null>(property.propertyTypeId ?? null)
  const [units, setUnits] = useState<Array<{ id: string; display_name: string | null; internal_code: string | null; status: string | null }>>([])

  useEffect(() => {
    formValueRef.current = formValue
  }, [formValue])

  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await supabase
          .from('generic_types')
          .select('id, name, icon')
          .eq('category', 'property_types')
          .eq('active', true)
          .order('order_index')

        setPropertyTypes(data || [])
      } catch (err) {
        logger.error('Failed to load property types', err)
      }
    })()
  }, [])

  useEffect(() => {
    if (isNewId(property.id)) {
      setUnits([])
      return
    }

    ;(async () => {
      try {
        const { data } = await supabase
          .from('units')
          .select('id, display_name, internal_code, status')
          .eq('property_id', property.id)
          .order('display_name', { ascending: true, nullsFirst: false })

        setUnits((data ?? []) as any)
      } catch (err) {
        logger.error('Failed to load property units', err)
      }
    })()
  }, [property.id])

  useEffect(() => {
    if (isNewId(property.id)) {
      const initialValue = buildInitialFormValue(property)
      setFormValue(initialValue)
      setResolvedProperty(property)
      initialSnapshotRef.current = JSON.stringify(initialValue)
      firstRenderRef.current = false
      return
    }

    const seq = ++resolveSeqRef.current
    ;(async () => {
      try {
        const detail = await getPropertyDetail(property.id)

        if (seq !== resolveSeqRef.current) return

        const resolved: UiProperty = {
          id: detail.property.id,
          landlordId: detail.property.landlord_id,
          propertyTypeId: detail.property.property_type_id,
          displayName: detail.property.display_name,
          internalCode: detail.property.internal_code,

          street: detail.property.street,
          houseNumber: detail.property.house_number,
          city: detail.property.city,
          zip: detail.property.zip,
          country: detail.property.country,
          region: detail.property.region,

          landArea: detail.property.land_area,
          builtUpArea: detail.property.built_up_area,
          buildingArea: detail.property.building_area,
          numberOfFloors: detail.property.number_of_floors,
          floorsAboveGround: detail.property.floors_above_ground,
          floorsBelowGround: detail.property.floors_below_ground,
          unitsCount: detail.property.units_count,

          buildYear: detail.property.build_year,
          reconstructionYear: detail.property.reconstruction_year,

          cadastralArea: detail.property.cadastral_area,
          parcelNumber: detail.property.parcel_number,
          lvNumber: detail.property.lv_number,

          note: detail.property.note,
          originModule: detail.property.origin_module,
          isArchived: detail.property.is_archived,
          createdAt: detail.property.created_at,
          updatedAt: detail.property.updated_at,
        }

        setResolvedProperty(resolved)
        const initialValue = buildInitialFormValue(resolved)
        setFormValue(initialValue)
        initialSnapshotRef.current = JSON.stringify(initialValue)
        firstRenderRef.current = false
      } catch (err) {
        logger.error('Failed to load property detail', err)
        toast.showError('Chyba při načítání detailu nemovitosti')
      }
    })()
  }, [property.id, toast])
  
  // Dirty tracking
  const markDirtyIfChanged = useCallback((val: PropertyFormValue) => {
    const currentSnap = JSON.stringify(val)
    const isDirty = currentSnap !== initialSnapshotRef.current
    onDirtyChange?.(isDirty)
  }, [onDirtyChange])
  
  // Update formValue when propertyTypeId changes
  useEffect(() => {
    if (selectedPropertyTypeId !== formValue.property_type_id) {
      const updated = { ...formValue, property_type_id: selectedPropertyTypeId || '' }
      setFormValue(updated)
      markDirtyIfChanged(updated)
    }
  }, [selectedPropertyTypeId, formValue, markDirtyIfChanged])
  
  // Submit handler
  const handleSubmit = useCallback(async (): Promise<UiProperty | null> => {
    const isNew = isNewId(resolvedProperty.id)
    
    const input: SavePropertyInput = {
      id: isNew ? undefined : resolvedProperty.id,
      landlord_id: formValue.landlord_id,
      property_type_id: formValue.property_type_id,
      display_name: formValue.display_name,
      internal_code: formValue.internal_code || null,
      
      street: formValue.street || null,
      house_number: formValue.house_number || null,
      city: formValue.city || null,
      zip: formValue.zip || null,
      country: formValue.country || 'CZ',
      region: formValue.region || null,
      
      land_area: formValue.land_area || null,
      built_up_area: formValue.built_up_area || null,
      building_area: formValue.building_area || null,
      number_of_floors: formValue.number_of_floors || null,
      floors_above_ground: formValue.floors_above_ground || null,
      floors_below_ground: formValue.floors_below_ground || null,
      units_count: formValue.units_count || null,
      
      build_year: formValue.build_year || null,
      reconstruction_year: formValue.reconstruction_year || null,
      
      cadastral_area: formValue.cadastral_area || null,
      parcel_number: formValue.parcel_number || null,
      lv_number: formValue.lv_number || null,
      
      note: formValue.note || null,
      is_archived: formValue.is_archived || false,
    }
    
    try {
      const savedRow = await saveProperty(input)
      
      const saved: UiProperty = {
        id: savedRow.id,
        landlordId: savedRow.landlord_id,
        propertyTypeId: savedRow.property_type_id,
        displayName: savedRow.display_name,
        internalCode: savedRow.internal_code,
        
        street: savedRow.street,
        houseNumber: savedRow.house_number,
        city: savedRow.city,
        zip: savedRow.zip,
        country: savedRow.country,
        region: savedRow.region,
        
        landArea: savedRow.land_area,
        builtUpArea: savedRow.built_up_area,
        buildingArea: savedRow.building_area,
        numberOfFloors: savedRow.number_of_floors,
        floorsAboveGround: savedRow.floors_above_ground,
        floorsBelowGround: savedRow.floors_below_ground,
        unitsCount: savedRow.units_count,
        
        buildYear: savedRow.build_year,
        reconstructionYear: savedRow.reconstruction_year,
        
        cadastralArea: savedRow.cadastral_area,
        parcelNumber: savedRow.parcel_number,
        lvNumber: savedRow.lv_number,
        
        note: savedRow.note,
        originModule: savedRow.origin_module,
        isArchived: savedRow.is_archived,
        createdAt: savedRow.created_at,
        updatedAt: savedRow.updated_at,
      }
      
      setResolvedProperty(saved)
      const newFormValue = buildInitialFormValue(saved)
      setFormValue(newFormValue)
      initialSnapshotRef.current = JSON.stringify(newFormValue)
      
      onSaved?.(saved)
      toast.showSuccess(isNew ? 'Nemovitost vytvořena' : 'Nemovitost uložena')
      return saved
    } catch (err) {
      logger.error('Failed to save property', err)
      toast.showError('Chyba při ukládání nemovitosti')
      return null
    }
  }, [resolvedProperty.id, formValue, onSaved, toast])
  
  // Register submit handler
  useEffect(() => {
    onRegisterSubmit?.(handleSubmit)
  }, [handleSubmit, onRegisterSubmit])
  
  // Convert ViewMode to DetailViewMode
  const detailViewMode: DetailViewMode = useMemo(() => {
    if (viewMode === 'create') return 'create'
    if (viewMode === 'edit') return 'edit'
    return 'view'
  }, [viewMode])
  
  const readOnly = detailViewMode === 'view'
  const propertyName = formValue.display_name || 'Nová nemovitost'
  
  // System blocks (zobrazí se na System tabu)
  const systemBlocks = useMemo(() => {
    const currentPropertyType = propertyTypes.find((t) => t.id === selectedPropertyTypeId)
    
    return [
      {
        title: 'Metadata',
        visible: true,
        content: (
          <div className="detail-form">
            <div className="detail-form__grid detail-form__grid--narrow">
              <div className="detail-form__field detail-form__field--span-2">
                <label className="detail-form__label">Typ nemovitosti</label>
                {detailViewMode === 'view' ? (
                  <input
                    className="detail-form__input detail-form__input--readonly"
                    value={currentPropertyType?.name || '—'}
                    readOnly
                  />
                ) : (
                  <select
                    className="detail-form__input"
                    value={selectedPropertyTypeId || ''}
                    onChange={(e) => setSelectedPropertyTypeId(e.target.value || null)}
                  >
                    <option value="">— vyberte typ nemovitosti —</option>
                    {propertyTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            
            <div className="detail-form__grid detail-form__grid--narrow">
              <div className="detail-form__field">
                <label className="detail-form__label">Vytvořeno</label>
                <input
                  className="detail-form__input detail-form__input--readonly"
                  value={resolvedProperty.createdAt ? formatDateTime(resolvedProperty.createdAt) : '—'}
                  readOnly
                />
              </div>
              
              <div className="detail-form__field">
                <label className="detail-form__label">Aktualizováno</label>
                <input
                  className="detail-form__input detail-form__input--readonly"
                  value={resolvedProperty.updatedAt ? formatDateTime(resolvedProperty.updatedAt) : '—'}
                  readOnly
                />
              </div>
            </div>
            
            <div className="detail-form__grid detail-form__grid--narrow">
              <div className="detail-form__field detail-form__field--span-2">
                <label className="detail-form__label">Archivováno</label>
                <input
                  type="checkbox"
                  checked={formValue.is_archived}
                  onChange={(e) => {
                    const updated = { ...formValue, is_archived: e.target.checked }
                    setFormValue(updated)
                    markDirtyIfChanged(updated)
                  }}
                  disabled={detailViewMode === 'view'}
                />
              </div>
            </div>
          </div>
        ),
      },
    ]
  }, [resolvedProperty, formValue, detailViewMode, markDirtyIfChanged, propertyTypes, selectedPropertyTypeId])
  
  const sectionIds: DetailSectionId[] = isNewId(resolvedProperty.id) 
    ? ['detail', 'attachments', 'system'] 
    : ['detail', 'units', 'equipment', 'attachments', 'system']
  
  // Dynamický title podle typu nemovitosti
  const propertyTypeName = useMemo(() => {
    if (!formValue.property_type_id) return null
    const type = propertyTypes.find(t => t.id === formValue.property_type_id)
    return type?.name || null
  }, [formValue.property_type_id, propertyTypes])
  
  const titleText = useMemo(() => {
    if (detailViewMode === 'create') {
      return propertyTypeName ? `Nová nemovitost - ${propertyTypeName}` : 'Nová nemovitost'
    }
    if (detailViewMode === 'edit') {
      return `Editace: ${propertyName}`
    }
    return propertyName
  }, [detailViewMode, propertyName, propertyTypeName])

  const content = (
    <DetailView
      mode={detailViewMode}
      sectionIds={sectionIds}
      initialActiveId={initialSectionId ?? 'detail'}
      onActiveSectionChange={onActiveSectionChange}
      ctx={{
        entityType: 'properties',
        entityId: resolvedProperty.id === 'new' ? 'new' : resolvedProperty.id || undefined,
        entityLabel: resolvedProperty.displayName ?? null,
        showSystemEntityHeader: false,
        mode: detailViewMode,

        detailContent: (
          <PropertyDetailFormComponent
            key={`form-${resolvedProperty.id}`}
            property={formValue}
            readOnly={readOnly}
            assignedUnitsCount={units.length}
            onDirtyChange={(dirty) => {
              if (dirty) {
                markDirtyIfChanged(formValue)
              }
            }}
            onValueChange={(val) => {
              setFormValue(val)
              formValueRef.current = val
              markDirtyIfChanged(val)
            }}
          />
        ),

        unitsContent: (
          <div className="detail-form">
            <section className="detail-form__section">
              <h3 className="detail-form__section-title">Přiřazené jednotky</h3>
              {units.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', padding: '1rem 0' }}>
                  Zatím nejsou přiřazeny žádné jednotky.
                </p>
              ) : (
                <table className="data-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Název</th>
                      <th>Interní kód</th>
                      <th>Stav</th>
                    </tr>
                  </thead>
                  <tbody>
                    {units.map((unit) => (
                      <tr key={unit.id}>
                        <td>{unit.display_name}</td>
                        <td>{unit.internal_code || '—'}</td>
                        <td>
                          {unit.status === 'available' && '🟢 Volná'}
                          {unit.status === 'occupied' && '🔴 Obsazená'}
                          {unit.status === 'reserved' && '🟡 Rezervovaná'}
                          {unit.status === 'renovation' && '🟤 V rekonstrukci'}
                          {!unit.status && '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </div>
        ),

        equipmentContent: (
          <EquipmentTab
            entityType="property"
            entityId={resolvedProperty.id}
            readOnly={readOnly}
          />
        ),

        systemBlocks,
      } as any}
    />
  )

  if (embedded) {
    return <div className="tile-layout__content">{content}</div>
  }

  return (
    <div className="tile-layout">
      <div className="tile-layout__header">
        <h1 className="tile-layout__title">{titleText}</h1>
      </div>
      <div className="tile-layout__content">{content}</div>
    </div>
  )
}
