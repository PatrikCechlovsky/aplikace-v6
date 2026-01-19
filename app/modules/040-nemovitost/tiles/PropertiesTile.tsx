'use client'

// FILE: app/modules/040-nemovitost/tiles/PropertiesTile.tsx
// PURPOSE: Seznam nemovitostí s filtry + detail view - stejné chování jako LandlordsTile
// URL state: t=properties-list, id + vm (detail: read/edit/create)

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import ListView, { type ListViewColumn, type ListViewRow, type ListViewSortState } from '@/app/UI/ListView'
import type { CommonActionId, ViewMode } from '@/app/UI/CommonActions'
import { listProperties, type PropertiesListRow } from '@/app/lib/services/properties'
import { applyColumnPrefs, loadViewPrefs, saveViewPrefs, type ViewPrefs } from '@/app/lib/services/viewPrefs'
import ListViewColumnsDrawer from '@/app/UI/ListViewColumnsDrawer'
import { SkeletonTable } from '@/app/UI/SkeletonLoader'
import { useToast } from '@/app/UI/Toast'
import createLogger from '@/app/lib/logger'
import { supabase } from '@/app/lib/supabaseClient'
import { getContrastTextColor } from '@/app/lib/colorUtils'
import PropertyDetailFrame, { type UiProperty as PropertyForDetail } from '../components/PropertyDetailFrame'

import '@/app/styles/components/TileLayout.css'

const logger = createLogger('040 PropertiesTile')

const VIEW_KEY = '040.properties.list'

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

type PropertiesTileProps = {
  propertyTypeCode?: string | null
  onRegisterCommonActions?: (actions: CommonActionId[]) => void
  onRegisterCommonActionsState?: (state: { viewMode: ViewMode; hasSelection: boolean; isDirty: boolean }) => void
  onRegisterCommonActionHandler?: (fn: (id: CommonActionId) => void) => void
}

export default function PropertiesTile({
  propertyTypeCode,
  onRegisterCommonActions,
  onRegisterCommonActionsState,
  onRegisterCommonActionHandler,
}: PropertiesTileProps): JSX.Element {
  console.log('🔍 PropertiesTile: Renderuji s propertyTypeCode:', propertyTypeCode)
  const toast = useToast()

  const [properties, setProperties] = useState<UiProperty[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [filterInput, setFilterInput] = useState('')
  const [filterText, setFilterText] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [selectedId, setSelectedId] = useState<string | number | null>(null)
  const [propertyTypeId, setPropertyTypeId] = useState<string | null>(null)
  
  // Property types pro mapování code -> name
  const [propertyTypes, setPropertyTypes] = useState<Array<{ id: string; code: string; name: string; icon: string | null; color: string | null }>>([])
  const [_selectedTypeForCreate, setSelectedTypeForCreate] = useState<string | null>(null)

  // Detail state
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [isDirty, setIsDirty] = useState(false)
  const submitHandlerRef = React.useRef<(() => Promise<PropertyForDetail | null>) | null>(null)
  
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
    }
    loadTypes()
  }, [])
  
  // Column settings
  const [colsOpen, setColsOpen] = useState(false)
  const DEFAULT_SORT: ListViewSortState = useMemo(() => ({ key: 'propertyTypeName', dir: 'asc' }), [])
  const [sort, setSort] = useState<ListViewSortState>(DEFAULT_SORT)
  const [colPrefs, setColPrefs] = useState<Pick<ViewPrefs, 'colWidths' | 'colOrder' | 'colHidden'>>({
    colWidths: {},
    colOrder: [],
    colHidden: [],
  })

  const columns = useMemo(() => {
    return applyColumnPrefs(BASE_COLUMNS, colPrefs)
  }, [colPrefs])

  const fixedFirstKey = 'propertyTypeName'
  const requiredKeys = ['displayName']

  // Load view prefs
  useEffect(() => {
    async function load() {
      const prefs = await loadViewPrefs(VIEW_KEY, { v: 1, sort: null, colWidths: {}, colOrder: [], colHidden: [] })
      if (prefs) {
        setColPrefs({
          colWidths: prefs.colWidths ?? {},
          colOrder: prefs.colOrder ?? [],
          colHidden: prefs.colHidden ?? [],
        })
        const loadedSort = prefs.sort ? { key: prefs.sort.key, dir: prefs.sort.dir } : null
        setSort(loadedSort ? loadedSort : DEFAULT_SORT)
      }
    }
    load()
  }, [DEFAULT_SORT])

  // Save view prefs when changed
  const savePrefs = useCallback(() => {
    const prefs: ViewPrefs = {
      v: 1,
      colWidths: colPrefs.colWidths ?? {},
      colOrder: colPrefs.colOrder ?? [],
      colHidden: colPrefs.colHidden ?? [],
      // Save sort only if different from default
      sort: sort && (sort.key !== DEFAULT_SORT.key || sort.dir !== DEFAULT_SORT.dir) ? sort : null,
    }
    saveViewPrefs(VIEW_KEY, prefs)
  }, [colPrefs, sort, DEFAULT_SORT])

  useEffect(() => {
    savePrefs()
  }, [savePrefs])

  // Debounce filter
  useEffect(() => {
    const timer = setTimeout(() => setFilterText(filterInput), 500)
    return () => clearTimeout(timer)
  }, [filterInput])

  // Load property type UUID from code
  useEffect(() => {
    if (!propertyTypeCode) {
      setPropertyTypeId(null)
      return
    }

    async function loadPropertyTypeId() {
      try {
        const { data } = await supabase
          .from('generic_types')
          .select('id, name')
          .eq('category', 'property_types')
          .eq('code', propertyTypeCode)
          .single()
        
        setPropertyTypeId(data?.id || null)
      } catch (err) {
        logger.error('Failed to load property type ID', err)
        setPropertyTypeId(null)
      }
    }

    loadPropertyTypeId()
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
      actions.push('save', 'attachments', 'close')
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

  // Handle common actions
  useEffect(() => {
    if (!onRegisterCommonActionHandler) return
    
    onRegisterCommonActionHandler(async (id: CommonActionId) => {
      if (id === 'close') {
        if (isDirty && (viewMode === 'edit' || viewMode === 'create')) {
          const ok = confirm('Máš neuložené změny. Opravdu chceš zavřít?')
          if (!ok) return
        }
        if (viewMode !== 'list') {
          setViewMode('list')
          setSelectedId(null)
          setSelectedTypeForCreate(null)
          setIsDirty(false)
        } else {
          toast.showInfo('Zavřít modul - v implementaci')
        }
        return
      }

      if (id === 'columnSettings') {
        setColsOpen(true)
        return
      }

      if (id === 'add') {
        setSelectedTypeForCreate(null)
        setViewMode('create')
        setSelectedId(null)
        setIsDirty(false)
        return
      }

      if (id === 'view') {
        if (!selectedId) {
          toast.showWarning('Nejdřív vyber nemovitost v seznamu.')
          return
        }
        setViewMode('read')
        setIsDirty(false)
        return
      }

      if (id === 'edit') {
        if (viewMode === 'read') {
          setViewMode('edit')
          return
        }
        if (!selectedId) {
          toast.showWarning('Nejdřív vyber nemovitost v seznamu.')
          return
        }
        setViewMode('edit')
        setIsDirty(false)
        return
      }

      if (id === 'save') {
        if (submitHandlerRef.current) {
          const savedProperty = await submitHandlerRef.current()
          if (savedProperty) {
            setViewMode('read')
            setSelectedId(savedProperty.id)
            setIsDirty(false)
            await loadData()
          }
        } else {
          toast.showWarning('Save handler není nastaven')
        }
        return
      }

      if (id === 'attachments') {
        toast.showWarning('Přílohy zatím nejsou implementované')
        return
      }
    })
  }, [onRegisterCommonActionHandler, viewMode, selectedId, isDirty, toast])

  // Load data
  const loadData = useCallback(async () => {
    try {
      console.log('🔍 PropertiesTile: Načítám data, filterText:', filterText, 'propertyTypeId:', propertyTypeId)
      setLoading(true)
      setError(null)
      
      const data = await listProperties({
        searchText: filterText,
        propertyTypeId: propertyTypeId,
        includeArchived: showArchived,
      })
      
      console.log('🔍 PropertiesTile: Načteno', data.length, 'nemovitostí')
      const mapped = data.map(mapRowToUi)
      console.log('🔍 PropertiesTile: Mapované:', mapped.length, 'řádků')
      console.log('🔍 PropertiesTile: Volám setProperties s', mapped.length, 'items')
      setProperties(mapped)
      console.log('🔍 PropertiesTile: setProperties HOTOVO')
    } catch (err: any) {
      console.error('❌ PropertiesTile: Chyba při načítání:', err)
      logger.error('Failed to load properties', err)
      setError(err.message || 'Nepodařilo se načíst nemovitosti')
      toast.showError('Chyba při načítání nemovitostí')
    } finally {
      setLoading(false)
    }
  }, [filterText, propertyTypeId, showArchived, toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  //setSelectedId(property.id)
    setViewMode('read')
    setIsDirty(false)
  }, [(() => {
    console.log('🔍 PropertiesTile: properties state se změnil, nová délka:', properties.length)
  }, [properties])

  // Row handlers
  const handleRowClick = useCallback((row: ListViewRow<UiProperty>) => {
    setSelectedId(row.id)
  }, [])

  const handleRowDoubleClick = useCallback((row: ListViewRow<UiProperty>) => {
    const property = row.raw
    if (!property) return
    toast.showInfo(`Detail nemovitosti: ${property.displayName} - v implementaci`)
  }, [toast])

  // Sort handler
  const handleSortChange = useCallback((nextSort: ListViewSortState) => {
    setSort(nextSort ?? DEFAULT_SORT)
  }, [DEFAULT_SORT])

  // Column resize handler
  const handleColumnResize = useCallback((key: string, px: number) => {
    setColPrefs((p) => ({ ...p, colWidths: { ...(p.colWidths ?? {}), [key]: px } }))
  }, [])

  // Apply sorting to rows
  const rows = useMemo(() => {
    let sorted = [...properties]

    if (sort) {
      sorted.sort((a, b) => {
        // Special handling for propertyTypeName - use order_index
        if (sort.key === 'propertyTypeName') {
          const aOrder = a.propertyTypeOrderIndex ?? 999
          const bOrder = b.propertyTypeOrderIndex ?? 999
          
          if (aOrder !== bOrder) {
            return sort.dir === 'asc' ? aOrder - bOrder : bOrder - aOrder
          }
          // Same order_index -> fallback to name
          return sort.dir === 'asc'
            ? a.propertyTypeName.localeCompare(b.propertyTypeName, 'cs')
            : b.propertyTypeName.localeCompare(a.propertyTypeName, 'cs')
        }

        const aVal = (a as any)[sort.key]
        const bVal = (b as any)[sort.key]

        if (aVal == null && bVal == null) return 0
        if (aVal == null) return sort.dir === 'asc' ? 1 : -1
        if (bVal == null) return sort.dir === 'asc' ? -1 : 1

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sort.dir === 'asc'
            ? aVal.localeCompare(bVal, 'cs')
            : bVal.localeCompare(aVal, 'cs')
        }

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sort.dir === 'asc' ? aVal - bVal : bVal - aVal
        }

        return 0
      })
    }

    return sorted.map(toRow)
  }, [properties, sort])

  // Page title based on filter
  const pageTitle = useMemo(() => {
    if (!propertyTypeCode) return 'Přehled nemovitostí'
    
    // Najít typ z načtených typů
    const typeMeta = propertyTypes.find(t => t.code === propertyTypeCode)
    const typeName = typeMeta?.name || propertyTypeCode
    return `Přehled nemovitostí - ${typeName}`
  }, [propertyTypeCode, propertyTypes])

  console.log('🔍 PropertiesTile: State - loading:', loading, 'properties:', properties.length, 'error:', error, 'viewMode:', viewMode)

  // Detail/Edit/Create modes
  const selectedProperty = useMemo(() => {
    if (!selectedId) return null
    return properties.find(p => p.id === selectedId)
  }, [selectedId, properties])

  if (viewMode !== 'list') {
    // Build PropertyForDetail object
    let propertyForDetail: PropertyForDetail | null = null

    if (viewMode === 'create') {
      // New property - empty object with pre-filled type if selected
      propertyForDetail = {
        id: 'new',
        landlordId: null,
        propertyTypeId: _selectedTypeForCreate,
        displayName: null,
        internalCode: null,
        
        street: null,
        houseNumber: null,
        city: null,
        zip: null,
        country: 'CZ',
        region: null,
        
        landArea: null,
        builtUpArea: null,
        buildingArea: null,
        numberOfFloors: null,
        
        buildYear: null,
        reconstructionYear: null,
        
        cadastralArea: null,
        parcelNumber: null,
        lvNumber: null,
        
        note: null,
        originModule: '040-nemovitost',
        isArchived: false,
        createdAt: null,
        updatedAt: null,
      }
    } else if (selectedProperty) {
      // Existing property - map from UiProperty to PropertyForDetail
      propertyForDetail = {
        id: selectedProperty.id,
        landlordId: null, // will be loaded by PropertyDetailFrame
        propertyTypeId: null, // will be loaded by PropertyDetailFrame
        displayName: selectedProperty.displayName,
        internalCode: null,
        
        street: null,
        houseNumber: null,
        city: null,
        zip: null,
        country: null,
        region: null,
        
        landArea: selectedProperty.buildingArea,
        builtUpArea: null,
        buildingArea: selectedProperty.buildingArea,
        numberOfFloors: null,
        
        buildYear: null,
        reconstructionYear: null,
        
        cadastralArea: null,
        parcelNumber: null,
        lvNumber: null,
        
        note: null,
        originModule: '040-nemovitost',
        isArchived: selectedProperty.isArchived,
        createdAt: null,
        updatedAt: null,
      }
    }

    if (!propertyForDetail) {
      return (
        <div className="tile-layout">
          <p style={{ padding: '2rem' }}>Nemovitost nenalezena</p>
        </div>
      )
    }

    return (
      <PropertyDetailFrame
        property={propertyForDetail}
        viewMode={viewMode}
        onRegisterSubmit={(fn) => {
          submitHandlerRef.current = fn
        }}
        onDirtyChange={setIsDirty}
        onSaved={(saved) => {
          setSelectedId(saved.id)
          loadData()
        }}
      />
    )
  }

  // List mode
  return (
    <div className="tile-layout">
      <div className="tile-layout__header">
        <h1 className="tile-layout__title">{pageTitle}</h1>
        <p className="tile-layout__description">
          Seznam všech nemovitostí. Můžeš filtrovat, řadit a spravovat nemovitosti.
        </p>
      </div>
      {error && <div style={{ padding: '0 1.5rem 0.5rem', color: 'crimson' }}>{error}</div>}
      {loading ? (
        <div className="tile-layout__content">
          <SkeletonTable rows={8} columns={columns.length} />
        </div>
      ) : (
        <div className="tile-layout__content">
          <ListView
            columns={columns}
            rows={rows}
            filterValue={filterInput}
            onFilterChange={setFilterInput}
            showArchived={showArchived}
            onShowArchivedChange={setShowArchived}
            selectedId={selectedId ?? null}
            onRowClick={handleRowClick}
            onRowDoubleClick={handleRowDoubleClick}
            sort={sort}
            onSortChange={handleSortChange}
            onColumnResize={handleColumnResize}
          />
          
          {properties.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
              {filterInput ? 'Žádné nemovitosti nenalezeny' : 'Zatím nemáte žádné nemovitosti'}
            </div>
          )}
        </div>
      )}

      <ListViewColumnsDrawer
        open={colsOpen}
        onClose={() => setColsOpen(false)}
        columns={BASE_COLUMNS}
        fixedFirstKey={fixedFirstKey}
        requiredKeys={requiredKeys}
        value={{
          order: colPrefs.colOrder ?? [],
          hidden: colPrefs.colHidden ?? [],
        }}
        onChange={(next) => {
          setColPrefs((p) => ({
            ...p,
            colOrder: next.order,
            colHidden: next.hidden,
          }))
        }}
        onReset={() => {
          setColPrefs((p) => ({
            ...p,
            colOrder: [],
            colHidden: [],
          }))
        }}
      />
    </div>
  )
}
