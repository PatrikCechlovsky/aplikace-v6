'use client'

// FILE: app/modules/040-nemovitost/tiles/PropertiesTile.tsx
// PURPOSE: POUZE SEZNAM nemovitostí - žádný detail, žádný create (to bude separátní tile)
// NUCLEAR FIX: Založeno na fungujícím LandlordsTile pattern, ale zjednodušeno na list-only

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import ListView, { type ListViewColumn, type ListViewRow, type ListViewSortState } from '@/app/UI/ListView'
import type { CommonActionId } from '@/app/UI/CommonActions'
import { listProperties, type PropertiesListRow } from '@/app/lib/services/properties'
import { SkeletonTable } from '@/app/UI/SkeletonLoader'
import { useToast } from '@/app/UI/Toast'
import createLogger from '@/app/lib/logger'
import { supabase } from '@/app/lib/supabaseClient'
import { getContrastTextColor } from '@/app/lib/colorUtils'

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
  onRegisterCommonActionsState?: (state: { viewMode: 'list'; hasSelection: boolean; isDirty: boolean }) => void
  onRegisterCommonActionHandler?: (fn: (id: CommonActionId) => void) => void
  onNavigate?: (tileId: string) => void
}

export default function PropertiesTile({
  propertyTypeCode,
  onRegisterCommonActions,
  onRegisterCommonActionsState,
  onRegisterCommonActionHandler,
  onNavigate,
}: PropertiesTileProps): JSX.Element {
  const toast = useToast()

  const [properties, setProperties] = useState<UiProperty[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [showArchived, setShowArchived] = useState(false)
  const [propertyTypeId, setPropertyTypeId] = useState<string | null>(null)
  
  // Property types pro mapování code -> name
  const [propertyTypes, setPropertyTypes] = useState<Array<{ id: string; code: string; name: string; icon: string | null; color: string | null }>>([])

  // NUCLEAR FIX: Žádný viewMode, selectedId, detailProperty - POUZE LIST!
  const viewMode = 'list' as const
  const hasSelection = false
  const isDirty = false

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
    if (!onRegisterCommonActions) return
    onRegisterCommonActions(['add', 'columnSettings'])
  }, [onRegisterCommonActions])

  // Register state
  useEffect(() => {
    if (!onRegisterCommonActionsState) return
    onRegisterCommonActionsState({
      viewMode,
      hasSelection,
      isDirty,
    })
  }, [viewMode, hasSelection, isDirty, onRegisterCommonActionsState])

  // Handle common actions
  useEffect(() => {
    if (!onRegisterCommonActionHandler) return
    
    onRegisterCommonActionHandler(async (id: CommonActionId) => {
      if (id === 'add') {
        onNavigate?.('create-property')
        return
      }

      if (id === 'columnSettings') {
        toast.showInfo('Nastavení sloupců - implementace v další verzi')
        return
      }

      toast.showInfo(`Akce "${id}" není dostupná v režimu pouze seznamu`)
    })
  }, [onRegisterCommonActionHandler, toast])

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await listProperties({
        searchText: '',
        propertyTypeId: propertyTypeId,
        includeArchived: showArchived,
      })
      
      setProperties(data.map(mapRowToUi))
    } catch (err: any) {
      logger.error('Failed to load properties', err)
      setError(err?.message || 'Chyba při načítání')
      toast.showError('Chyba při načítání nemovitostí')
    } finally {
      setLoading(false)
    }
  }, [propertyTypeId, showArchived, toast])

  // Load data on mount and filter change
  useEffect(() => {
    void loadData()
  }, [loadData])

  // Handle row click - NIC, jen seznam
  const handleRowClick = useCallback((_row: ListViewRow<UiProperty>) => {
    // Žádná akce - detail bude na separátní tile
  }, [])

  const handleRowDoubleClick = useCallback((row: ListViewRow<UiProperty>) => {
    const property = row.raw
    if (!property) return
    toast.showInfo(`Detail nemovitosti: ${property.displayName} - implementace v další verzi`)
  }, [toast])

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

  // POUZE LIST MODE - žádné dlaždice, žádný detail
  return (
    <div className="tile-layout">
      <div className="tile-layout__header">
        <h1 className="tile-layout__title">{pageTitle}</h1>
        <p className="tile-layout__description">
          Seznam všech nemovitostí. Můžeš filtrovat, řadit a spravovat nemovitosti.
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
            selectedId={null}
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
