'use client'

// FILE: app/modules/040-nemovitost/tiles/PropertiesTile.tsx
// PURPOSE: List + detail nemovitostí - stejné chování jako LandlordsTile
// URL state: t=properties-list, id + vm (detail: read/edit/create)

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import ListView, { type ListViewColumn, type ListViewRow, type ListViewSortState } from '@/app/UI/ListView'
import type { CommonActionId, ViewMode } from '@/app/UI/CommonActions'
import { listProperties, getPropertyDetail, type PropertiesListRow } from '@/app/lib/services/properties'
import PropertyDetailFrame, { type UiProperty as DetailUiProperty } from '../components/PropertyDetailFrame'
import { SkeletonTable } from '@/app/UI/SkeletonLoader'
import { useToast } from '@/app/UI/Toast'
import createLogger from '@/app/lib/logger'
import { supabase } from '@/app/lib/supabaseClient'
import { getContrastTextColor } from '@/app/lib/colorUtils'
import type { DetailSectionId } from '@/app/UI/DetailView'

import '@/app/styles/components/TileLayout.css'

const logger = createLogger('040 PropertiesTile')

const BASE_COLUMNS: ListViewColumn[] = [
  { key: 'propertyTypeName', label: 'Typ', width: 160, sortable: true },
  { key: 'displayName', label: 'Název', width: 250, sortable: true },
  { key: 'fullAddress', label: 'Adresa', width: 300, sortable: true },
  { key: 'landlordName', label: 'Pronajímatel', width: 200, sortable: true },
  { key: 'buildingArea', label: 'Plocha (m²)', width: 120, sortable: true },
  { key: 'unitsCount', label: 'Jednotky', width: 100, sortable: true },
]

type UiProperty = {
  id: string
  displayName: string
  propertyTypeId: string | null
  propertyTypeName: string
  propertyTypeIcon: string | null
  propertyTypeColor: string | null
  propertyTypeOrderIndex: number | null
  landlordName: string | null
  fullAddress: string
  buildingArea: number | null
  unitsCount: number
  isArchived: boolean
}

function mapRowToUi(row: PropertiesListRow): UiProperty {
  const addressParts = [
    [row.street, row.house_number].filter(Boolean).join(' '),
    row.city,
    row.zip,
  ].filter(Boolean)
  
  return {
    id: row.id,
    displayName: row.display_name || '—',
    propertyTypeId: row.property_type_id || null,
    propertyTypeName: row.property_type_name || '—',
    propertyTypeIcon: row.property_type_icon || null,
    propertyTypeColor: row.property_type_color || null,
    propertyTypeOrderIndex: row.property_type_order_index ?? null,
    landlordName: row.landlord_name || '—',
    fullAddress: addressParts.join(', ') || '—',
    buildingArea: row.building_area,
    unitsCount: row.units_count || 0,
    isArchived: !!row.is_archived,
  }
}

function toRow(p: UiProperty): ListViewRow<UiProperty> {
  return {
    id: p.id,
    data: {
      propertyTypeName: p.propertyTypeColor ? (
        <span className="generic-type__name-badge" style={{ backgroundColor: p.propertyTypeColor, color: getContrastTextColor(p.propertyTypeColor) }}>
          {p.propertyTypeName}
        </span>
      ) : (
        <span>{p.propertyTypeName}</span>
      ),
      displayName: p.displayName,
      fullAddress: p.fullAddress,
      landlordName: p.landlordName,
      buildingArea: p.buildingArea ? `${p.buildingArea.toFixed(2)} m²` : '—',
      unitsCount: p.unitsCount.toString(),
    },
    className: p.isArchived ? 'row--archived' : undefined,
    raw: p,
  }
}

function getSortValue(p: UiProperty, key: string): string | number {
  const norm = (v: any) => String(v ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  switch (key) {
    case 'propertyTypeName':
      return p.propertyTypeOrderIndex ?? 999999
    case 'displayName':
      return norm(p.displayName)
    case 'fullAddress':
      return norm(p.fullAddress)
    case 'landlordName':
      return norm(p.landlordName)
    case 'buildingArea':
      return p.buildingArea ?? 0
    case 'unitsCount':
      return p.unitsCount
    default:
      return ''
  }
}

type PropertiesTileProps = {
  propertyTypeCode?: string | null
  onRegisterCommonActions?: (actions: CommonActionId[]) => void
  onRegisterCommonActionsState?: (state: { viewMode: ViewMode; hasSelection: boolean; isDirty: boolean }) => void
  onRegisterCommonActionHandler?: (fn: (id: CommonActionId) => void) => void
  onNavigate?: (tileId: string) => void
}

type LocalViewMode = ViewMode | 'list'

export default function PropertiesTile({
  propertyTypeCode,
  onRegisterCommonActions,
  onRegisterCommonActionsState,
  onRegisterCommonActionHandler,
  onNavigate,
}: PropertiesTileProps): JSX.Element {
  const toast = useToast()
  const router = useRouter()

  const [properties, setProperties] = useState<UiProperty[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [showArchived, setShowArchived] = useState(false)
  const [propertyTypeId, setPropertyTypeId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  
  // Property types pro mapování code -> name
  const [propertyTypes, setPropertyTypes] = useState<Array<{ id: string; code: string; name: string; icon: string | null; color: string | null }>>([])

  // Detail state
  const [viewMode, setViewMode] = useState<LocalViewMode>('list')
  const [detailProperty, setDetailProperty] = useState<DetailUiProperty | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [detailInitialSectionId, setDetailInitialSectionId] = useState<DetailSectionId>('detail')
  const submitRef = useRef<(() => Promise<DetailUiProperty | null>) | null>(null)

  // Load property types
  useEffect(() => {
    async function loadTypes() {
      const { data, error } = await supabase
        .from('generic_types')
        .select('id, code, name, icon, color')
        .eq('category', 'property_types')
        .eq('active', true)
        .order('order_index')
      
      if (error) {
        console.error('Chyba při načítání property_types:', error)
        return
      }
      
      setPropertyTypes(data || [])
      
      // Pokud máme propertyTypeCode, najdi odpovídající ID
      if (propertyTypeCode && data) {
        const type = data.find(t => t.code === propertyTypeCode)
        if (type) {
          setPropertyTypeId(type.id)
        }
      }
    }
    
    void loadTypes()
  }, [propertyTypeCode])

  // Register common actions
  useEffect(() => {
    const actions: CommonActionId[] = []
    if (viewMode === 'list') {
      actions.push('add')
      if (selectedId) {
        actions.push('view', 'edit')
      }
      actions.push('columnSettings', 'close')
    } else if (viewMode === 'edit' || viewMode === 'create') {
      actions.push('save', 'close')
    } else if (viewMode === 'read') {
      actions.push('edit', 'close')
    }

    onRegisterCommonActions?.(actions)
    onRegisterCommonActionsState?.({
      viewMode,
      hasSelection: !!selectedId,
      isDirty,
    })
  }, [viewMode, selectedId, isDirty, onRegisterCommonActions, onRegisterCommonActionsState])

  // Close handlers
  const closeListToModule = useCallback(() => {
    router.push('/')
  }, [router])

  const closeToList = useCallback(() => {
    setDetailProperty(null)
    setDetailInitialSectionId('detail')
    submitRef.current = null
    setIsDirty(false)
    setViewMode('list')
    setSelectedId(null)
  }, [])

  // Open detail
  const openDetail = useCallback(
    async (p: UiProperty, vm: 'read' | 'edit', sectionId: DetailSectionId = 'detail') => {
      logger.log(`Opening property detail: ${p.id} in ${vm} mode`)
      
      try {
        const detail = await getPropertyDetail(p.id)
        
        const resolved: DetailUiProperty = {
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
        
        setDetailProperty(resolved)
        setDetailInitialSectionId(sectionId)
        setIsDirty(false)
        setViewMode(vm)
        setSelectedId(p.id)
      } catch (err) {
        logger.error('Failed to load property detail', err)
        toast.showError('Chyba při načítání detailu nemovitosti')
      }
    },
    [toast]
  )

  // Load data
  const loadData = useCallback(async () => {
    try {
      logger.log('🔍 loadData: Starting...', { propertyTypeId, showArchived })
      setLoading(true)
      setError(null)
      
      const data = await listProperties({
        searchText: '',
        propertyTypeId: propertyTypeId,
        includeArchived: showArchived,
      })
      
      logger.log('🔍 loadData: Loaded', data.length, 'properties')
      setProperties(data.map(mapRowToUi))
    } catch (err: any) {
      logger.error('Failed to load properties', err)
      setError(err?.message || 'Chyba při načítání')
      toast.showError('Chyba při načítání nemovitostí')
    } finally {
      logger.log('🔍 loadData: Done')
      setLoading(false)
    }
  }, [propertyTypeId, showArchived, toast])

  // Handle common actions
  useEffect(() => {
    if (!onRegisterCommonActionHandler) return
    
    onRegisterCommonActionHandler(async (id: CommonActionId) => {
      // CLOSE
      if (id === 'close') {
        if (isDirty && (viewMode === 'edit' || viewMode === 'create')) {
          const ok = confirm('Máš neuložené změny. Opravdu chceš zavřít?')
          if (!ok) return
        }

        if (viewMode === 'read' || viewMode === 'edit' || viewMode === 'create') {
          closeToList()
        } else {
          closeListToModule()
        }
        return
      }

      // COLUMN SETTINGS
      if (id === 'columnSettings') {
        toast.showInfo('Nastavení sloupců zatím není implementováno')
        return
      }

      // LIST ACTIONS
      if (viewMode === 'list') {
        if (id === 'add') {
          onNavigate?.('create-property')
          return
        }

        if (id === 'view' || id === 'edit') {
          if (!selectedId) {
            toast.showWarning('Nejdřív vyber nemovitost v seznamu.')
            return
          }
          const p = properties.find((x) => x.id === selectedId)
          if (!p) {
            toast.showWarning('Nemovitost nenalezena.')
            return
          }
          void openDetail(p, id === 'edit' ? 'edit' : 'read', 'detail')
          return
        }
        return
      }

      // CREATE / EDIT ACTIONS
      if (viewMode === 'create' || viewMode === 'edit') {
        if (id === 'save') {
          if (submitRef.current) {
            const saved = await submitRef.current()
            if (saved) {
              setDetailProperty(saved)
              setViewMode('read')
              setSelectedId(saved.id)
              setIsDirty(false)
              void loadData()
            }
          }
          return
        }
        return
      }

      // READ ACTIONS
      if (viewMode === 'read') {
        if (id === 'edit') {
          setViewMode('edit')
          return
        }
        return
      }
    })
  }, [viewMode, selectedId, isDirty, properties, onRegisterCommonActionHandler, onNavigate, openDetail, toast, loadData, closeListToModule, closeToList])

  // Load data on mount and filter change
  useEffect(() => {
    void loadData()
  }, [loadData])

  // Row click handler
  const handleRowClick = useCallback((row: ListViewRow<UiProperty>) => {
    setSelectedId(String(row.id))
    logger.log(`Selected property: ${row.id}`)
  }, [])

  // Row double-click handler
  const handleRowDoubleClick = useCallback((row: ListViewRow<UiProperty>) => {
    const property = row.raw
    if (!property) return
    void openDetail(property, 'read', 'detail')
  }, [openDetail])

  // Sort handler
  const handleSortChange = useCallback((nextSort: ListViewSortState) => {
    setSort(nextSort)
  }, [])

  // Columns
  const [columns] = useState<ListViewColumn[]>(BASE_COLUMNS)
  const [sort, setSort] = useState<ListViewSortState>(null)

  // Filter, sort, map rows
  const rows = useMemo(() => {
    let filtered = properties.slice()

    // Sort
    if (sort) {
      const { key, dir } = sort
      filtered.sort((a, b) => {
        const aVal = getSortValue(a, key)
        const bVal = getSortValue(b, key)
        if (aVal < bVal) return dir === 'asc' ? -1 : 1
        if (aVal > bVal) return dir === 'asc' ? 1 : -1
        return 0
      })
    }

    return filtered.map(toRow)
  }, [properties, sort])

  const pageTitle = useMemo(() => {
    if (!propertyTypeCode) return 'Přehled nemovitostí'
    
    const typeMeta = propertyTypes.find(t => t.code === propertyTypeCode)
    const typeName = typeMeta?.name || propertyTypeCode
    return `Přehled nemovitostí - ${typeName}`
  }, [propertyTypeCode, propertyTypes])

  // LIST MODE
  if (viewMode === 'list') {
    return (
      <div className="tile-layout">
        <div className="tile-layout__header">
          <h1 className="tile-layout__title">{pageTitle}</h1>
          <p className="tile-layout__description">
            Seznam všech nemovitostí. Klikni na řádek pro výběr, dvojklik pro detail.
          </p>
        </div>

        <div className="tile-layout__content">
          {loading && <SkeletonTable columns={columns.length} rows={10} />}

          {!loading && error && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-error)' }}>
              <p>{error}</p>
              <button onClick={() => loadData()} style={{ marginTop: '1rem' }}>
                Zkusit znovu
              </button>
            </div>
          )}

          {!loading && !error && (
            <ListView
              columns={columns}
              rows={rows}
              filterValue=""
              onFilterChange={() => {}}
              showArchived={showArchived}
              onShowArchivedChange={setShowArchived}
              selectedId={selectedId ?? null}
              onRowClick={handleRowClick}
              onRowDoubleClick={handleRowDoubleClick}
              sort={sort}
              onSortChange={handleSortChange}
            />
          )}
        </div>
      </div>
    )
  }

  // DETAIL MODE (read/edit/create)
  return (
    <div className="tile-layout">
      {detailProperty && (
        <PropertyDetailFrame
          property={detailProperty}
          viewMode={viewMode as ViewMode}
          initialSectionId={detailInitialSectionId}
          onActiveSectionChange={setDetailInitialSectionId}
          onRegisterSubmit={(fn) => { submitRef.current = fn }}
          onDirtyChange={setIsDirty}
          onSaved={(saved) => {
            setDetailProperty(saved)
            setSelectedId(saved.id)
            void loadData()
          }}
        />
      )}
    </div>
  )
}
