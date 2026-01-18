'use client'

// FILE: app/modules/040-nemovitost/tiles/PropertiesTile.tsx
// PURPOSE: Seznam nemovitostí s filtry + detail view
// URL state: t=properties-list, id + vm (detail: read/edit/create)

import React, { useCallback, useEffect, useState } from 'react'
import ListView, { type ListViewColumn, type ListViewRow } from '@/app/UI/ListView'
import type { CommonActionId, ViewMode } from '@/app/UI/CommonActions'
import { listProperties, type PropertiesListRow } from '@/app/lib/services/properties'
import { SkeletonTable } from '@/app/UI/SkeletonLoader'
import { useToast } from '@/app/UI/Toast'
import createLogger from '@/app/lib/logger'
import { supabase } from '@/app/lib/supabaseClient'

import '@/app/styles/components/TileLayout.css'

const logger = createLogger('040 PropertiesTile')

const BASE_COLUMNS: ListViewColumn[] = [
  { key: 'propertyTypeName', label: 'Typ', width: 160 },
  { key: 'displayName', label: 'Název', width: 250 },
  { key: 'fullAddress', label: 'Adresa', width: 300 },
  { key: 'landlordName', label: 'Pronajímatel', width: 200 },
  { key: 'buildingArea', label: 'Plocha (m²)', width: 120 },
  { key: 'unitsCount', label: 'Jednotky', width: 100 },
]

type UiProperty = {
  id: string
  displayName: string
  propertyTypeName: string
  propertyTypeColor: string | null
  landlordName: string | null
  fullAddress: string
  buildingArea: number | null
  unitsCount: number
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
    landlordName: row.landlord_name || '—',
    fullAddress: addressParts.join(', ') || '—',
    buildingArea: row.building_area,
    unitsCount: row.units_count || 0,
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
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [propertyTypeId, setPropertyTypeId] = useState<string | null>(null)

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
          .select('id')
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
    if (onRegisterCommonActions) {
      onRegisterCommonActions(['add'])
    }
  }, [onRegisterCommonActions])

  useEffect(() => {
    if (onRegisterCommonActionsState) {
      onRegisterCommonActionsState({
        viewMode: 'list',
        hasSelection: !!selectedId,
        isDirty: false,
      })
    }
  }, [selectedId, onRegisterCommonActionsState])

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await listProperties({
        searchText: filterText,
        propertyTypeId: propertyTypeId,
        includeArchived: false,
      })
      
      setProperties(data.map(mapRowToUi))
    } catch (err: any) {
      logger.error('Failed to load properties', err)
      setError(err.message || 'Nepodařilo se načíst nemovitosti')
      toast.showError('Chyba při načítání nemovitostí')
    } finally {
      setLoading(false)
    }
  }, [filterText, propertyTypeId, toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Handle common actions
  useEffect(() => {
    if (!onRegisterCommonActionHandler) return
    
    const handler = (actionId: CommonActionId) => {
      if (actionId === 'add') {
        toast.showInfo('Vytvoření nemovitosti - v implementaci')
      }
    }
    
    onRegisterCommonActionHandler(handler)
  }, [onRegisterCommonActionHandler, toast])

  const handleRowClick = useCallback((row: ListViewRow<UiProperty>) => {
    setSelectedId(row.id)
    toast.showInfo(`Detail nemovitosti: ${row.raw.displayName} - v implementaci`)
  }, [toast])

  if (loading && properties.length === 0) {
    return <SkeletonTable rows={10} columns={BASE_COLUMNS.length} />
  }

  if (error && properties.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p style={{ color: '#ef4444' }}>❌ {error}</p>
        <button onClick={loadData} style={{ marginTop: '10px' }}>
          Zkusit znovu
        </button>
      </div>
    )
  }

  return (
    <div className="tile-layout">
      <div className="tile-layout__filters">
        <input
          type="text"
          placeholder="Hledat nemovitost..."
          value={filterInput}
          onChange={(e) => setFilterInput(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            width: '300px',
          }}
        />
      </div>
      
      <ListView
        columns={BASE_COLUMNS}
        rows={properties.map(toRow)}
        onRowClick={handleRowClick}
        selectedRowId={selectedId}
        loading={loading}
      />
      
      {properties.length === 0 && !loading && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
          {filterText ? 'Žádné nemovitosti nenalezeny' : 'Zatím nemáte žádné nemovitosti'}
        </div>
      )}
    </div>
  )
}
