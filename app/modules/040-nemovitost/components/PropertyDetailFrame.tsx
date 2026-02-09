// FILE: app/modules/040-nemovitost/components/PropertyDetailFrame.tsx
// PURPOSE: Detail view pro nemovitost (read/edit mode) s tabs
// NOTES: Analogie k UnitDetailFrame - používá DetailView s PropertyDetailFormComponent

'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import DetailView, { type DetailSectionId, type DetailViewMode } from '@/app/UI/DetailView'
import type { ViewMode } from '@/app/UI/CommonActions'
import ListView, { type ListViewRow, type ListViewSortState } from '@/app/UI/ListView'
import ListViewColumnsDrawer from '@/app/UI/ListViewColumnsDrawer'
import PropertyDetailFormComponent, { type PropertyFormValue } from '../forms/PropertyDetailFormComponent'
import UnitDetailForm, { type UnitFormValue, type PropertyAddress } from '../forms/UnitDetailForm'
import { getPropertyDetail, saveProperty, type SavePropertyInput } from '@/app/lib/services/properties'
import { formatDateTime } from '@/app/lib/formatters/formatDateTime'
import createLogger from '@/app/lib/logger'
import { useToast } from '@/app/UI/Toast'
import { supabase } from '@/app/lib/supabaseClient'
import { applyColumnPrefs, loadViewPrefs, saveViewPrefs, type ViewPrefs, type ViewPrefsSortState } from '@/app/lib/services/viewPrefs'
import EquipmentTab from './EquipmentTab'
import PropertyServicesTab from './PropertyServicesTab'
import { type UiUnit } from './UnitDetailFrame'
import { listPropertyEquipment } from '@/app/lib/services/equipment'
import { listPropertyServices } from '@/app/lib/services/propertyServices'
import { listAttachments } from '@/app/lib/attachments'
import { getUnitDetail, listUnits, type UnitDetailRow, type UnitsListRow } from '@/app/lib/services/units'
import { UNITS_BASE_COLUMNS } from '@/app/modules/040-nemovitost/unitsColumns'
import { getContrastTextColor } from '@/app/lib/colorUtils'
import { renderUnitStatus } from '@/app/modules/040-nemovitost/unitsStatus'
import { getIcon, type IconKey } from '@/app/UI/icons'

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

type UnitsListUiRow = {
  id: string
  displayName: string
  internalCode: string | null
  propertyId: string | null
  propertyName: string | null
  unitTypeId: string | null
  unitTypeName: string | null
  unitTypeColor: string | null
  floor: number | null
  area: number | null
  rooms: number | null
  status: string | null
  isArchived: boolean
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

function mapUnitDetailToUi(row: UnitDetailRow): UiUnit {
  return {
    id: row.id,
    propertyId: row.property_id ?? null,
    unitTypeId: row.unit_type_id ?? null,
    landlordId: row.landlord_id ?? null,
    displayName: row.display_name ?? null,
    internalCode: row.internal_code ?? null,

    street: row.street ?? null,
    houseNumber: row.house_number ?? null,
    city: row.city ?? null,
    zip: row.zip ?? null,
    country: row.country ?? null,
    region: row.region ?? null,

    floor: row.floor ?? null,
    doorNumber: row.door_number ?? null,
    area: row.area ?? null,
    rooms: row.rooms ?? null,
    disposition: row.disposition ?? null,
    status: row.status ?? null,
    tenantId: row.tenant_id ?? null,
    orientationNumber: row.orientation_number ?? null,
    yearRenovated: row.year_renovated ?? null,
    managerName: row.manager_name ?? null,

    cadastralArea: row.cadastral_area ?? null,
    parcelNumber: row.parcel_number ?? null,
    lvNumber: row.lv_number ?? null,

    note: row.note ?? null,
    originModule: row.origin_module ?? null,
    isArchived: row.is_archived ?? null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  }
}

function mapUnitRowToUi(row: UnitsListRow): UnitsListUiRow {
  return {
    id: row.id,
    displayName: row.display_name || '—',
    internalCode: row.internal_code ?? null,
    propertyId: row.property_id ?? null,
    propertyName: row.property_name ?? '—',
    unitTypeId: row.unit_type_id ?? null,
    unitTypeName: row.unit_type_name ?? '—',
    unitTypeColor: row.unit_type_color ?? null,
    floor: row.floor ?? null,
    area: row.area ?? null,
    rooms: row.rooms ?? null,
    status: row.status ?? null,
    isArchived: !!row.is_archived,
  }
}

function buildUnitFormValue(u: UiUnit): UnitFormValue {
  return {
    displayName: u.displayName || '',
    internalCode: u.internalCode || '',
    propertyId: u.propertyId || '',
    unitTypeId: u.unitTypeId || '',
    landlordId: u.landlordId || '',

    street: u.street || '',
    houseNumber: u.houseNumber || '',
    city: u.city || '',
    zip: u.zip || '',
    country: u.country || 'CZ',
    region: u.region || '',

    floor: u.floor ?? null,
    doorNumber: u.doorNumber || '',
    area: u.area ?? null,
    rooms: u.rooms ?? null,
    disposition: u.disposition || '',
    status: u.status || 'available',
    tenantId: u.tenantId || '',
    orientationNumber: u.orientationNumber || '',
    yearRenovated: u.yearRenovated ?? null,
    managerName: u.managerName || '',

    cadastralArea: u.cadastralArea || '',
    parcelNumber: u.parcelNumber || '',
    lvNumber: u.lvNumber || '',

    note: u.note || '',
    originModule: u.originModule || '040-nemovitost',
    isArchived: !!u.isArchived,
  }
}

function normalizeText(value: string) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
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

  const router = useRouter()
  const toast = useToast()
  const initialSnapshotRef = useRef<string>('')
  const firstRenderRef = useRef(true)

  const [formValue, setFormValue] = useState<PropertyFormValue>(() => buildInitialFormValue(property))
  const formValueRef = useRef<PropertyFormValue>(formValue)

  const [propertyTypes, setPropertyTypes] = useState<Array<{ id: string; name: string; icon?: string | null }>>([])
  const [selectedPropertyTypeId, setSelectedPropertyTypeId] = useState<string | null>(property.propertyTypeId ?? null)
  const [units, setUnits] = useState<UnitsListUiRow[]>([])
  const [unitsLoading, setUnitsLoading] = useState(false)
  const [unitsFilter, setUnitsFilter] = useState('')
  const [unitsShowArchived, setUnitsShowArchived] = useState(false)
  const DEFAULT_UNITS_SORT: ListViewSortState = useMemo(() => ({ key: 'unitTypeName', dir: 'asc' }), [])
  const [unitsSort, setUnitsSort] = useState<ListViewSortState>(DEFAULT_UNITS_SORT)
  const [unitsColPrefs, setUnitsColPrefs] = useState<Pick<ViewPrefs, 'colWidths' | 'colOrder' | 'colHidden'>>({
    colWidths: {},
    colOrder: [],
    colHidden: [],
  })
  const [unitsColsOpen, setUnitsColsOpen] = useState(false)
  const [unitsViewMode, setUnitsViewMode] = useState<'list' | 'detail'>('list')
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null)
  const [selectedUnitDetail, setSelectedUnitDetail] = useState<UiUnit | null>(null)
  const [selectedUnitLoading, setSelectedUnitLoading] = useState(false)
  const [equipmentCount, setEquipmentCount] = useState(0)
  const [servicesCount, setServicesCount] = useState(0)
  const [attachmentsCount, setAttachmentsCount] = useState(0)

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

  const reloadUnits = useCallback(async () => {
    if (isNewId(property.id)) {
      setUnits([])
      setSelectedUnitId(null)
      return
    }

    try {
      setUnitsLoading(true)
      const rows = await listUnits({
        propertyId: property.id ?? undefined,
        includeArchived: unitsShowArchived,
      })
      const mapped = rows.map(mapUnitRowToUi)
      setUnits(mapped)
      if (mapped.length === 0) {
        setSelectedUnitId(null)
      } else if (!selectedUnitId || !mapped.some((u) => u.id === selectedUnitId)) {
        setSelectedUnitId(String(mapped[0].id))
      }
    } catch (err) {
      logger.error('Failed to load property units', err)
    } finally {
      setUnitsLoading(false)
    }
  }, [property.id, selectedUnitId, unitsShowArchived])

  useEffect(() => {
    void reloadUnits()
  }, [reloadUnits])

  useEffect(() => {
    void (async () => {
      const prefs = await loadViewPrefs('040.units.list', { v: 1, sort: null, colWidths: {}, colOrder: [], colHidden: [] })
      setUnitsColPrefs({
        colWidths: prefs.colWidths ?? {},
        colOrder: prefs.colOrder ?? [],
        colHidden: prefs.colHidden ?? [],
      })
      const loadedSort = prefs.sort ? { key: prefs.sort.key, dir: prefs.sort.dir } : null
      setUnitsSort(loadedSort ?? DEFAULT_UNITS_SORT)
    })()
  }, [DEFAULT_UNITS_SORT])

  useEffect(() => {
    const prefs: ViewPrefs = {
      v: 1,
      colWidths: unitsColPrefs.colWidths ?? {},
      colOrder: unitsColPrefs.colOrder ?? [],
      colHidden: unitsColPrefs.colHidden ?? [],
      sort: unitsSort && (unitsSort.key !== DEFAULT_UNITS_SORT.key || unitsSort.dir !== DEFAULT_UNITS_SORT.dir) ? (unitsSort as ViewPrefsSortState) : null,
    }
    void saveViewPrefs('040.units.list', prefs)
  }, [DEFAULT_UNITS_SORT, unitsColPrefs, unitsSort])

  useEffect(() => {
    let active = true
    const unitId = selectedUnitId?.trim()

    if (!unitId) {
      setSelectedUnitDetail(null)
      return () => {
        active = false
      }
    }

    setSelectedUnitLoading(true)

    ;(async () => {
      try {
        const detail = await getUnitDetail(unitId)
        if (!active) return
        setSelectedUnitDetail(mapUnitDetailToUi(detail.unit))
      } catch (err) {
        if (active) {
          logger.error('Failed to load selected unit detail', err)
          setSelectedUnitDetail(null)
        }
      } finally {
        if (active) {
          setSelectedUnitLoading(false)
        }
      }
    })()

    return () => {
      active = false
    }
  }, [selectedUnitId])

  const unitsColumns = useMemo(() => applyColumnPrefs(UNITS_BASE_COLUMNS, unitsColPrefs), [unitsColPrefs])

  const unitsFiltered = useMemo(() => {
    const f = normalizeText(unitsFilter)
    if (!f) return units
    return units.filter((u) => {
      const hay = normalizeText(
        [u.unitTypeName, u.displayName, u.internalCode, u.propertyName, u.status, u.floor, u.rooms, u.area]
          .filter(Boolean)
          .join(' ')
      )
      return hay.includes(f)
    })
  }, [units, unitsFilter])

  const unitsSorted = useMemo(() => {
    if (!unitsSort?.key) return unitsFiltered
    const dir = unitsSort.dir === 'desc' ? -1 : 1
    return [...unitsFiltered].sort((a, b) => {
      const aVal = (a as any)[unitsSort.key]
      const bVal = (b as any)[unitsSort.key]
      if (typeof aVal === 'number' && typeof bVal === 'number') return (aVal - bVal) * dir
      return String(aVal ?? '').localeCompare(String(bVal ?? ''), 'cs', { sensitivity: 'base' }) * dir
    })
  }, [unitsFiltered, unitsSort])

  const unitsRows = useMemo<ListViewRow<UnitsListUiRow>[]>(() => {
    return unitsSorted.map((u) => ({
      id: u.id,
      data: {
        unitTypeName: u.unitTypeColor ? (
          <span className="generic-type__name-badge" style={{ backgroundColor: u.unitTypeColor, color: getContrastTextColor(u.unitTypeColor) }}>
            {u.unitTypeName}
          </span>
        ) : (
          <span>{u.unitTypeName}</span>
        ),
        displayName: u.displayName,
        propertyName: u.propertyName || '—',
        floor: u.floor !== null ? u.floor.toString() : '—',
        area: u.area ? `${u.area.toFixed(2)} m²` : '—',
        rooms: u.rooms ? u.rooms.toString() : '—',
        status: renderUnitStatus(u.status),
      },
      className: u.isArchived ? 'row--archived' : undefined,
      raw: u,
    }))
  }, [unitsSorted])

  const selectedUnitIndex = useMemo(() => (selectedUnitId ? unitsSorted.findIndex((u) => u.id === selectedUnitId) : -1), [selectedUnitId, unitsSorted])
  const canGoPrevUnit = selectedUnitIndex > 0
  const canGoNextUnit = selectedUnitIndex >= 0 && selectedUnitIndex < unitsSorted.length - 1

  const selectedUnitForm = useMemo(() => (selectedUnitDetail ? buildUnitFormValue(selectedUnitDetail) : null), [selectedUnitDetail])

  const openUnitInModule = useCallback((mode: 'read' | 'edit' = 'read') => {
    if (!selectedUnitId) return
    router.push(`/modules/040-nemovitost?t=units-list&id=${selectedUnitId}&vm=${mode}`)
  }, [router, selectedUnitId])

  useEffect(() => {
    if (isNewId(resolvedProperty.id)) {
      setEquipmentCount(0)
      setServicesCount(0)
      setAttachmentsCount(0)
      return
    }

    let cancelled = false

    ;(async () => {
      try {
        const [equipmentRows, servicesRows, attachmentRows] = await Promise.all([
          listPropertyEquipment(resolvedProperty.id),
          listPropertyServices(resolvedProperty.id),
          listAttachments({ entityType: 'properties', entityId: resolvedProperty.id, includeArchived: false }),
        ])

        if (cancelled) return
        setEquipmentCount(equipmentRows.length)
        setServicesCount(servicesRows.length)
        setAttachmentsCount(attachmentRows.length)
      } catch (err) {
        logger.error('Failed to load property counts', err)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [resolvedProperty.id])

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
    : ['detail', 'units', 'equipment', 'services', 'attachments', 'system']
  
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

  const handleSectionChange = useCallback((id: DetailSectionId) => {
    if (id !== 'units') {
      setUnitsViewMode('list')
    }
    onActiveSectionChange?.(id)
  }, [onActiveSectionChange])

  const content = (
    <DetailView
      mode={detailViewMode}
      sectionIds={sectionIds}
      initialActiveId={initialSectionId ?? 'detail'}
      onActiveSectionChange={handleSectionChange}
      ctx={{
        entityType: 'properties',
        entityId: resolvedProperty.id === 'new' ? 'new' : resolvedProperty.id || undefined,
        entityLabel: resolvedProperty.displayName ?? null,
        showSystemEntityHeader: false,
        mode: detailViewMode,
        sectionCounts: {
          units: units.length,
          equipment: equipmentCount,
          services: servicesCount,
          attachments: attachmentsCount,
        },

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
            {unitsViewMode === 'list' && (
              <section className="detail-form__section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 className="detail-form__section-title">Přiřazené jednotky</h3>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (!selectedUnitId) return
                        setUnitsViewMode('detail')
                      }}
                      disabled={!selectedUnitId}
                      className="common-actions__btn"
                      title="Číst vybranou jednotku"
                    >
                      <span className="common-actions__icon">{getIcon('view' as IconKey)}</span>
                      <span className="common-actions__label">Číst</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openUnitInModule('edit')}
                      disabled={!selectedUnitId}
                      className="common-actions__btn"
                      title="Upravit v přehledu jednotek"
                    >
                      <span className="common-actions__icon">{getIcon('edit' as IconKey)}</span>
                      <span className="common-actions__label">Upravit</span>
                    </button>
                  </div>
                </div>

                {unitsLoading && <div className="detail-form__hint">Načítám jednotky…</div>}

                {!unitsLoading && unitsRows.length === 0 && (
                  <p style={{ color: 'var(--color-text-muted)', padding: '1rem 0' }}>
                    Zatím nejsou přiřazeny žádné jednotky.
                  </p>
                )}

                {!unitsLoading && unitsRows.length > 0 && (
                  <>
                    <ListView
                      columns={unitsColumns}
                      rows={unitsRows}
                      filterValue={unitsFilter}
                      onFilterChange={setUnitsFilter}
                      showArchived={unitsShowArchived}
                      onShowArchivedChange={setUnitsShowArchived}
                      selectedId={selectedUnitId}
                      onRowClick={(row: ListViewRow<UnitsListUiRow>) => setSelectedUnitId(String(row.id))}
                      onRowDoubleClick={(row: ListViewRow<UnitsListUiRow>) => {
                        setSelectedUnitId(String(row.id))
                        setUnitsViewMode('detail')
                      }}
                      sort={unitsSort}
                      onSortChange={setUnitsSort}
                      onColumnResize={(key, px) => {
                        setUnitsColPrefs((p) => ({ ...p, colWidths: { ...(p.colWidths ?? {}), [key]: px } }))
                      }}
                      onColumnSettings={() => setUnitsColsOpen(true)}
                      emptyText="Nemovitost nemá žádné jednotky."
                    />

                    <ListViewColumnsDrawer
                      open={unitsColsOpen}
                      onClose={() => setUnitsColsOpen(false)}
                      columns={UNITS_BASE_COLUMNS}
                      fixedFirstKey="unitTypeName"
                      requiredKeys={['displayName']}
                      value={{
                        order: unitsColPrefs.colOrder ?? [],
                        hidden: unitsColPrefs.colHidden ?? [],
                      }}
                      sortBy={unitsSort ?? undefined}
                      onChange={(next) => {
                        setUnitsColPrefs((p) => ({
                          ...p,
                          colOrder: next.order,
                          colHidden: next.hidden,
                        }))
                      }}
                      onSortChange={(nextSort) => setUnitsSort(nextSort)}
                      onReset={() => {
                        setUnitsColPrefs({ colWidths: {}, colOrder: [], colHidden: [] })
                        setUnitsSort(DEFAULT_UNITS_SORT)
                      }}
                    />
                  </>
                )}
              </section>
            )}

            {unitsViewMode === 'detail' && (
              <section className="detail-form__section">
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                  <h3 className="detail-form__section-title" style={{ marginRight: 12 }}>Detail jednotky</h3>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {selectedUnitIndex >= 0 && <span className="common-actions__counter">{`${selectedUnitIndex + 1}/${unitsSorted.length}`}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (!canGoPrevUnit) return
                        const prev = unitsSorted[selectedUnitIndex - 1]
                        if (prev) setSelectedUnitId(prev.id)
                      }}
                      disabled={!canGoPrevUnit}
                      className="common-actions__btn"
                      title="Předchozí jednotka"
                    >
                      <span className="common-actions__icon">{getIcon('chevron-left' as IconKey)}</span>
                      <span className="common-actions__label">Předchozí</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!canGoNextUnit) return
                        const next = unitsSorted[selectedUnitIndex + 1]
                        if (next) setSelectedUnitId(next.id)
                      }}
                      disabled={!canGoNextUnit}
                      className="common-actions__btn"
                      title="Další jednotka"
                    >
                      <span className="common-actions__icon">{getIcon('chevron-right' as IconKey)}</span>
                      <span className="common-actions__label">Další</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openUnitInModule('edit')}
                      disabled={!selectedUnitId}
                      className="common-actions__btn"
                      title="Upravit v přehledu jednotek"
                    >
                      <span className="common-actions__icon">{getIcon('edit' as IconKey)}</span>
                      <span className="common-actions__label">Upravit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUnitsViewMode('list')}
                      className="common-actions__btn"
                      title="Zpět na seznam"
                    >
                      <span className="common-actions__icon">{getIcon('close' as IconKey)}</span>
                      <span className="common-actions__label">Zpět</span>
                    </button>
                  </div>
                </div>

                {selectedUnitLoading && <p style={{ color: 'var(--color-text-muted)', padding: '0.5rem 0' }}>Načítám detail…</p>}
                {!selectedUnitLoading && selectedUnitForm && (
                  <UnitDetailForm
                    unit={selectedUnitForm}
                    readOnly={true}
                    propertyAddress={{
                      street: formValue.street || null,
                      house_number: formValue.house_number || null,
                      city: formValue.city || null,
                      zip: formValue.zip || null,
                    } as PropertyAddress}
                    propertyLandlordId={formValue.landlord_id || null}
                  />
                )}
                {!selectedUnitLoading && !selectedUnitForm && (
                  <p style={{ color: 'var(--color-danger)', padding: '0.5rem 0' }}>
                    Detail jednotky se nepodařilo načíst.
                  </p>
                )}
              </section>
            )}
          </div>
        ),

        equipmentContent: (
          <EquipmentTab
            entityType="property"
            entityId={resolvedProperty.id}
            readOnly={readOnly}
            onCountChange={setEquipmentCount}
          />
        ),

        servicesContent: (
          <PropertyServicesTab
            propertyId={resolvedProperty.id}
            readOnly={readOnly}
            onCountChange={setServicesCount}
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
