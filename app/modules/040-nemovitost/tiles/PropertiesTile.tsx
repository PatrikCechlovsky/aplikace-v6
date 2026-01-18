'use client'

// FILE: app/modules/040-nemovitost/tiles/PropertiesTile.tsx
// PURPOSE: Seznam nemovitostí s filtry + detail view - stejné chování jako LandlordsTile
// URL state: t=properties-list, id + vm (detail: read/edit/create)

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import ListView, { type ListViewColumn, type ListViewRow, type ListViewSortState } from '@/app/UI/ListView'
import type { CommonActionId, ViewMode } from '@/app/UI/CommonActions'
import { listProperties, type PropertiesListRow } from '@/app/lib/services/properties'
import { applyColumnPrefs, loadViewPrefs, saveViewPrefs, type ViewPrefs, type ViewPrefsSortState } from '@/app/lib/services/viewPrefs'
import ListViewColumnsDrawer from '@/app/UI/ListViewColumnsDrawer'
import { SkeletonTable } from '@/app/UI/SkeletonLoader'
import { useToast } from '@/app/UI/Toast'
import createLogger from '@/app/lib/logger'
import { supabase } from '@/app/lib/supabaseClient'

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
    propertyTypeColor: row.property_type_color || null,
    propertyTypeOrderIndex: null, // TODO: pokud bude v property_types sort_order
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
        <span style={{ 
          backgroundColor: p.propertyTypeColor,
          color: '#fff',
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '0.875rem',
        }}>
          {p.propertyTypeName}
        </span>
      ) : p.propertyTypeName,
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
}: PropertiesTileProps) {
  const toast = useToast()

  const [properties, setProperties] = useState<UiProperty[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [filterInput, setFilterInput] = useState('')
  const [filterText, setFilterText] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [selectedId, setSelectedId] = useState<string | number | null>(null)
  const [propertyTypeId, setPropertyTypeId] = useState<string | null>(null)
  
  // Column settings
  const [colsOpen, setColsOpen] = useState(false)
  const [sort, setSort] = useState<ListViewSortState>(null)
  const [columns, setColumns] = useState<ListViewColumn[]>(BASE_COLUMNS)

  // View mode (list only for now, later add read/edit/create)
  const viewMode: ViewMode = 'list'
  const isDirty = false

  // Load view prefs
  useEffect(() => {
    const prefs = loadViewPrefs(VIEW_KEY)
    if (prefs) {
      if (prefs.columns) {
        setColumns(applyColumnPrefs(BASE_COLUMNS, prefs.columns))
      }
      if (prefs.sort) {
        const s: ViewPrefsSortState = prefs.sort as any
        setSort({ key: s.key, dir: s.dir })
      }
    }
  }, [])

  // Save view prefs when changed
  const savePrefs = useCallback(() => {
    const prefs: ViewPrefs = {
      columns: columns.map((c) => ({ key: c.key, width: c.width, visible: true })),
      sort: sort ? { key: sort.key, dir: sort.dir } : undefined,
    }
    saveViewPrefs(VIEW_KEY, prefs)
  }, [columns, sort])

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
          .from('property_types')
          .select('id, name')
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
        // TODO: Close tile or go back to module
        toast.showInfo('Zavřít - v implementaci')
        return
      }

      if (id === 'columnSettings') {
        setColsOpen(true)
        return
      }

      if (id === 'add') {
        toast.showInfo('Vytvoření nemovitosti - v implementaci')
        return
      }

      if (id === 'view' || id === 'edit') {
        toast.showInfo(`${id === 'view' ? 'Detail' : 'Úprava'} nemovitosti - v implementaci`)
        return
      }
    })
  }, [onRegisterCommonActionHandler, toast])

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await listProperties({
        searchText: filterText,
        propertyTypeId: propertyTypeId,
        includeArchived: showArchived,
      })
      
      setProperties(data.map(mapRowToUi))
    } catch (err: any) {
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
    setSort(nextSort)
  }, [])

  // Column resize handler
  const handleColumnResize = useCallback((columnKey: string, widthPx: number) => {
    setColumns((prev) =>
      prev.map((c) => (c.key === columnKey ? { ...c, width: widthPx } : c))
    )
  }, [])

  // Apply sorting to rows
  const rows = useMemo(() => {
    let sorted = [...properties]

    if (sort) {
      sorted.sort((a, b) => {
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
    if (propertyTypeCode) {
      // TODO: Get property type name from loaded data
      return `Přehled nemovitostí - ${propertyTypeCode}`
    }
    return 'Přehled nemovitostí'
  }, [propertyTypeCode])

  if (viewMode === 'list') {
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

        {colsOpen && (
          <ListViewColumnsDrawer
            columns={columns}
            onClose={() => setColsOpen(false)}
            onApply={(newCols) => {
              setColumns(newCols)
              setColsOpen(false)
            }}
          />
        )}
      </div>
    )
  }

  // TODO: Add read/edit/create modes here
  return <div>Mode {viewMode} - v implementaci</div>
}
