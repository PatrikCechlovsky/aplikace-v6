// FILE: app/modules/040-nemovitost/components/UnitDetailFrame.tsx
// PURPOSE: Detail view pro jednotku (read/edit mode) s tabs
// NOTES: Podobné jako LandlordDetailFrame - používá DetailView s ctx

'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import DetailView, { type DetailSectionId, type DetailViewMode } from '@/app/UI/DetailView'
import type { ViewMode } from '@/app/UI/CommonActions'
import UnitDetailForm, { type UnitFormValue } from '../forms/UnitDetailForm'
import { getUnitDetail, saveUnit, type SaveUnitInput } from '@/app/lib/services/units'
import { formatDateTime } from '@/app/lib/formatters/formatDateTime'
import createLogger from '@/app/lib/logger'
import { useToast } from '@/app/UI/Toast'
import { supabase } from '@/app/lib/supabaseClient'

import '@/app/styles/components/TileLayout.css'
import '@/app/styles/components/DetailForm.css'

const logger = createLogger('UnitDetailFrame')

// =====================
// TYPES
// =====================

export type UiUnit = {
  id: string
  propertyId: string | null
  unitTypeId: string | null
  displayName: string | null
  internalCode: string | null
  
  // Address (inherited or override)
  street: string | null
  houseNumber: string | null
  city: string | null
  zip: string | null
  country: string | null
  region: string | null
  
  // Unit info
  floor: number | null
  doorNumber: string | null
  area: number | null
  rooms: number | null
  status: string | null
  
  // Metadata
  note: string | null
  originModule: string | null
  isArchived: boolean | null
  createdAt: string | null
  updatedAt: string | null
}

type Props = {
  unit: UiUnit
  viewMode: ViewMode
  initialSectionId?: DetailSectionId
  onActiveSectionChange?: (id: DetailSectionId) => void
  onRegisterSubmit?: (fn: () => Promise<UiUnit | null>) => void
  onDirtyChange?: (dirty: boolean) => void
  onSaved?: (unit: UiUnit) => void
}

// =====================
// HELPERS
// =====================

function buildInitialFormValue(u: UiUnit): UnitFormValue {
  return {
    displayName: u.displayName || '',
    internalCode: u.internalCode || '',
    propertyId: u.propertyId || '',
    unitTypeId: u.unitTypeId || '',
    
    street: u.street || '',
    houseNumber: u.houseNumber || '',
    city: u.city || '',
    zip: u.zip || '',
    country: u.country || 'CZ',
    region: u.region || '',
    
    floor: u.floor,
    doorNumber: u.doorNumber || '',
    area: u.area,
    rooms: u.rooms,
    status: u.status || 'available',
    
    note: u.note || '',
    originModule: u.originModule || '040-nemovitost',
    isArchived: u.isArchived || false,
  }
}

function isNewId(id: string | null | undefined) {
  const s = String(id ?? '').trim()
  return !s || s === 'new'
}

// =====================
// COMPONENT
// =====================

export default function UnitDetailFrame({
  unit,
  viewMode,
  initialSectionId,
  onActiveSectionChange,
  onRegisterSubmit,
  onDirtyChange,
  onSaved,
}: Props) {
  const [resolvedUnit, setResolvedUnit] = useState<UiUnit>(unit)
  const resolveSeqRef = useRef(0)
  
  const toast = useToast()
  const initialSnapshotRef = useRef<string>('')
  const firstRenderRef = useRef(true)
  
  const [formValue, setFormValue] = useState<UnitFormValue>(() => buildInitialFormValue(unit))
  const formValueRef = useRef<UnitFormValue>(formValue)
  
  const [unitTypes, setUnitTypes] = useState<Array<{ id: string; code: string; name: string; icon: string | null }>>([])
  const [selectedUnitTypeId, setSelectedUnitTypeId] = useState<string | null>(unit.unitTypeId)
  
  // Load unit types from generic_types
  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await supabase
          .from('generic_types')
          .select('id, code, name, icon')
          .eq('category', 'unit_types')
          .eq('active', true)
          .order('order_index')
        
        setUnitTypes(data || [])
      } catch (err) {
        logger.error('Failed to load unit types', err)
      }
    })()
  }, [])
  
  useEffect(() => {
    formValueRef.current = formValue
  }, [formValue])
  
  // Load unit detail (pokud není new)
  useEffect(() => {
    if (isNewId(unit.id)) {
      const initialValue = buildInitialFormValue(unit)
      setFormValue(initialValue)
      setResolvedUnit(unit)
      initialSnapshotRef.current = JSON.stringify(initialValue)
      firstRenderRef.current = false
      return
    }

    const seq = ++resolveSeqRef.current
    ;(async () => {
      try {
        const detail = await getUnitDetail(unit.id)
        
        if (seq !== resolveSeqRef.current) return
        
        const resolved: UiUnit = {
          id: detail.unit.id,
          propertyId: detail.unit.property_id,
          unitTypeId: detail.unit.unit_type_id,
          displayName: detail.unit.display_name,
          internalCode: detail.unit.internal_code,
          
          street: detail.unit.street,
          houseNumber: detail.unit.house_number,
          city: detail.unit.city,
          zip: detail.unit.zip,
          country: detail.unit.country,
          region: detail.unit.region,
          
          floor: detail.unit.floor,
          doorNumber: detail.unit.door_number,
          area: detail.unit.area,
          rooms: detail.unit.rooms,
          status: detail.unit.status,
          
          note: detail.unit.note,
          originModule: detail.unit.origin_module,
          isArchived: detail.unit.is_archived,
          createdAt: detail.unit.created_at,
          updatedAt: detail.unit.updated_at,
        }
        
        setResolvedUnit(resolved)
        const initialValue = buildInitialFormValue(resolved)
        setFormValue(initialValue)
        initialSnapshotRef.current = JSON.stringify(initialValue)
        firstRenderRef.current = false
      } catch (err) {
        logger.error('Failed to load unit detail', err)
        toast.showError('Chyba při načítání detailu jednotky')
      }
    })()
  }, [unit.id, toast])
  
  // Dirty tracking
  const markDirtyIfChanged = useCallback((val: UnitFormValue) => {
    const currentSnap = JSON.stringify(val)
    const isDirty = currentSnap !== initialSnapshotRef.current
    onDirtyChange?.(isDirty)
  }, [onDirtyChange])
  
  // Update formValue when unitTypeId changes
  useEffect(() => {
    if (selectedUnitTypeId !== formValue.unitTypeId) {
      const updated = { ...formValue, unitTypeId: selectedUnitTypeId || '' }
      setFormValue(updated)
      markDirtyIfChanged(updated)
    }
  }, [selectedUnitTypeId, formValue, markDirtyIfChanged])
  
  // Submit handler
  const handleSubmit = useCallback(async (): Promise<UiUnit | null> => {
    const isNew = isNewId(resolvedUnit.id)
    
    const input: SaveUnitInput = {
      id: isNew ? undefined : resolvedUnit.id,
      property_id: formValue.propertyId || null,
      unit_type_id: formValue.unitTypeId || null,
      display_name: formValue.displayName || null,
      internal_code: formValue.internalCode || null,
      
      street: formValue.street || null,
      house_number: formValue.houseNumber || null,
      city: formValue.city || null,
      zip: formValue.zip || null,
      country: formValue.country || 'CZ',
      region: formValue.region || null,
      
      floor: formValue.floor,
      door_number: formValue.doorNumber || null,
      area: formValue.area,
      rooms: formValue.rooms,
      status: formValue.status || 'available',
      
      note: formValue.note || null,
      origin_module: formValue.originModule || '040-nemovitost',
      is_archived: formValue.isArchived || false,
    }
    
    try {
      const savedRow = await saveUnit(input)
      
      const saved: UiUnit = {
        id: savedRow.id,
        propertyId: savedRow.property_id,
        unitTypeId: savedRow.unit_type_id,
        displayName: savedRow.display_name,
        internalCode: savedRow.internal_code,
        
        street: savedRow.street,
        houseNumber: savedRow.house_number,
        city: savedRow.city,
        zip: savedRow.zip,
        country: savedRow.country,
        region: savedRow.region,
        
        floor: savedRow.floor,
        doorNumber: savedRow.door_number,
        area: savedRow.area,
        rooms: savedRow.rooms,
        status: savedRow.status,
        
        note: savedRow.note,
        originModule: savedRow.origin_module,
        isArchived: savedRow.is_archived,
        createdAt: savedRow.created_at,
        updatedAt: savedRow.updated_at,
      }
      
      setResolvedUnit(saved)
      const newInitial = buildInitialFormValue(saved)
      setFormValue(newInitial)
      initialSnapshotRef.current = JSON.stringify(newInitial)
      onDirtyChange?.(false)
      
      toast.showSuccess(isNew ? 'Jednotka vytvořena' : 'Jednotka uložena')
      onSaved?.(saved)
      
      return saved
    } catch (err) {
      logger.error('Failed to save unit', err)
      toast.showError(err instanceof Error ? err.message : 'Chyba při ukládání jednotky')
      return null
    }
  }, [resolvedUnit, formValue, toast, onDirtyChange, onSaved])
  
  // Register submit
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
  const unitName = formValue.displayName || 'Nová jednotka'
  
  // System blocks for metadata
  const systemBlocks = useMemo(() => {
    const currentUnitType = unitTypes.find((t) => t.id === selectedUnitTypeId)
    
    return [
      {
        title: 'Metadata',
        visible: true,
        content: (
          <div className="detail-form">
            <div className="detail-form__field">              <label className="detail-form__label">Typ jednotky</label>
              {readOnly ? (
                <input
                  className="detail-form__input detail-form__input--readonly"
                  value={currentUnitType?.name || '—'}
                  readOnly
                />
              ) : (
                <select
                  className="detail-form__input"
                  value={selectedUnitTypeId || ''}
                  onChange={(e) => setSelectedUnitTypeId(e.target.value || null)}
                >
                  <option value="">— vyberte typ jednotky —</option>
                  {unitTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.icon ? `${type.icon} ` : ''}{type.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="detail-form__field">              <label className="detail-form__label">Typ jednotky</label>
              {readOnly ? (
                <input
                  className="detail-form__input detail-form__input--readonly"
                  value={currentUnitType?.name || '—'}
                  readOnly
                />
              ) : (
                <select
                  className="detail-form__input"
                  value={selectedUnitTypeId || ''}
                  onChange={(e) => setSelectedUnitTypeId(e.target.value || null)}
                >
                  <option value="">— vyberte typ jednotky —</option>
                  {unitTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.icon ? `${type.icon} ` : ''}{type.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="detail-form__field">
              <label className="detail-form__label">Vytvořeno</label>
              <input
                className="detail-form__input detail-form__input--readonly"
                value={resolvedUnit.createdAt ? formatDateTime(resolvedUnit.createdAt) : '—'}
                readOnly
              />
            </div>
            <div className="detail-form__field">
              <label className="detail-form__label">Aktualizováno</label>
              <input
                className="detail-form__input detail-form__input--readonly"
                value={resolvedUnit.updatedAt ? formatDateTime(resolvedUnit.updatedAt) : '—'}
                readOnly
              />
            </div>
            <div className="detail-form__field">
              <label className="detail-form__label">Archivováno</label>
              <input
                type="checkbox"
                checked={formValue.isArchived}
                onChange={(e) => {
                  const updated = { ...formValue, isArchived: e.target.checked }
                  setFormValue(updated)
                  markDirtyIfChanged(updated)
                }}
                disabled={readOnly}
              />
            </div>
          </div>
        ),
      },
    ]
  }, [resolvedUnit, formValue, readOnly, markDirtyIfChanged, unitTypes, selectedUnitTypeId])
  
  const sectionIds: DetailSectionId[] = ['detail', 'attachments', 'system']
  
  return (
    <div className="tile-layout">
      <div className="tile-layout__header">
        <h1 className="tile-layout__title">
          {detailViewMode === 'create' ? 'Nová jednotka' : 
           detailViewMode === 'edit' ? `Editace: ${unitName}` : 
           unitName}
        </h1>
      </div>
      <div className="tile-layout__content">
        <DetailView
          mode={detailViewMode}
          sectionIds={sectionIds}
          initialActiveId={initialSectionId ?? 'detail'}
          onActiveSectionChange={onActiveSectionChange}
          ctx={{
            entityType: 'units',
            entityId: resolvedUnit.id === 'new' ? 'new' : resolvedUnit.id || undefined,
            entityLabel: resolvedUnit.displayName ?? null,
            showSystemEntityHeader: false,
            mode: detailViewMode,
            
            detailContent: (
              <UnitDetailForm
                key={`form-${resolvedUnit.id}`}
                unit={formValue}
                readOnly={readOnly}
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
            
            systemBlocks,
          } as any}
        />
      </div>
    </div>
  )
}
