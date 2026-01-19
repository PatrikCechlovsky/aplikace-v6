'use client'

// FILE: app/modules/040-nemovitost/tiles/UnitsTile.tsx
// PURPOSE: Seznam jednotek s filtry + detail - podobné chování jako PropertiesTile
// URL state: t=units-list, id + vm (detail: read/edit/create)

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import ListView, { type ListViewColumn, type ListViewRow, type ListViewSortState } from '@/app/UI/ListView'
import type { CommonActionId, ViewMode } from '@/app/UI/CommonActions'
import { listUnits, type UnitsListRow } from '@/app/lib/services/units'
import { applyColumnPrefs, loadViewPrefs, saveViewPrefs, type ViewPrefs } from '@/app/lib/services/viewPrefs'
import ListViewColumnsDrawer from '@/app/UI/ListViewColumnsDrawer'
import { SkeletonTable } from '@/app/UI/SkeletonLoader'
import { useToast } from '@/app/UI/Toast'
import createLogger from '@/app/lib/logger'
import { supabase } from '@/app/lib/supabaseClient'
import UnitDetailFrame, { type UiUnit } from '../components/UnitDetailFrame'
import type { DetailSectionId } from '@/app/UI/DetailView'

import '@/app/styles/components/TileLayout.css'

const logger = createLogger('040 UnitsTile')

const VIEW_KEY = '040.units.list'

const BASE_COLUMNS: ListViewColumn[] = [
  { key: 'unitTypeName', label: 'Typ', width: 140, sortable: true },
  { key: 'displayName', label: 'Název', width: 200, sortable: true },
  { key: 'propertyName', label: 'Nemovitost', width: 200, sortable: true },
  { key: 'floor', label: 'Podlaží', width: 100, sortable: true },
  { key: 'area', label: 'Plocha (m²)', width: 120, sortable: true },
  { key: 'rooms', label: 'Pokoje', width: 100, sortable: true },
  { key: 'status', label: 'Status', width: 150, sortable: true },
]

// Status color mapping
const STATUS_COLORS: Record<string, { label: string; color: string; icon: string }> = {
  available: { label: 'Volná', color: '#22c55e', icon: '🟢' },
  occupied: { label: 'Obsazená', color: '#ef4444', icon: '🔴' },
  reserved: { label: 'Rezervovaná', color: '#eab308', icon: '🟡' },
  renovation: { label: 'V rekonstrukci', color: '#a16207', icon: '🟤' },
}

type UiUnitRow = {
  id: string
  displayName: string
  propertyId: string | null
  propertyName: string | null
  unitTypeId: string | null
  unitTypeName: string | null
  unitTypeIcon: string | null
  unitTypeColor: string | null
  floor: number | null
  area: number | null
  rooms: number | null
  status: string | null
  isArchived: boolean
}

function mapRowToUi(row: UnitsListRow): UiUnitRow {
  return {
    id: row.id,
    displayName: row.display_name || '—',
    propertyId: row.property_id,
    propertyName: row.property_name || '—',
    unitTypeId: row.unit_type_id,
    unitTypeName: row.unit_type_name || '—',
    unitTypeIcon: row.unit_type_icon || null,
    unitTypeColor: row.unit_type_color || null,
    floor: row.floor,
    area: row.area,
    rooms: row.rooms,
    status: row.status,
    isArchived: !!row.is_archived,
  }
}

function toRow(u: UiUnitRow): ListViewRow<UiUnitRow> {
  const statusInfo = u.status ? STATUS_COLORS[u.status] : null
  
  return {
    id: u.id,
    data: {
      unitTypeName: u.unitTypeColor ? (
        <span className="generic-type__name-badge" style={{ backgroundColor: u.unitTypeColor }}>
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
      status: statusInfo ? (
        <span className="status-badge" style={{ color: statusInfo.color }}>
          {statusInfo.icon} {statusInfo.label}
        </span>
      ) : (
        <span>—</span>
      ),
    },
    className: u.isArchived ? 'row--archived' : undefined,
    raw: u,
  }
}

type UnitsTileProps = {
  propertyId?: string | null
  unitTypeCode?: string | null
  status?: string | null
  onRegisterCommonActions?: (actions: CommonActionId[]) => void
  onRegisterCommonActionsState?: (state: { viewMode: ViewMode; hasSelection: boolean; isDirty: boolean }) => void
  onRegisterCommonActionHandler?: (fn: (id: CommonActionId) => void) => void
}

export default function UnitsTile({
  propertyId,
  unitTypeCode,
  status,
  onRegisterCommonActions,
  onRegisterCommonActionsState,
  onRegisterCommonActionHandler,
}: UnitsTileProps) {
  console.log('🔍 UnitsTile: Renderuji s filtry:', { propertyId, unitTypeCode, status })
  const toast = useToast()

  const [units, setUnits] = useState<UiUnitRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [filterInput, setFilterInput] = useState('')
  const [filterText, setFilterText] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [selectedId, setSelectedId] = useState<string | number | null>(null)
  const [unitTypeId, setUnitTypeId] = useState<string | null>(null)
  
  // Detail state
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [detailUnit, setDetailUnit] = useState<UiUnit | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [activeSectionId, setActiveSectionId] = useState<DetailSectionId>('basic')
  const submitDetailFnRef = React.useRef<(() => Promise<UiUnit | null>) | null>(null)
  
  // Column settings
  const [colsOpen, setColsOpen] = useState(false)
  const DEFAULT_SORT: ListViewSortState = useMemo(() => ({ key: 'displayName', dir: 'asc' }), [])
  const [sort, setSort] = useState<ListViewSortState>(DEFAULT_SORT)
  const [colPrefs, setColPrefs] = useState<Pick<ViewPrefs, 'colWidths' | 'colOrder' | 'colHidden'>>({
    colWidths: {},
    colOrder: [],
    colHidden: [],
  })

  const columns = useMemo(() => {
    return applyColumnPrefs(BASE_COLUMNS, colPrefs)
  }, [colPrefs])

  const fixedFirstKey = 'unitTypeName'
  const requiredKeys = ['displayName']

  // Load view prefs
  useEffect(() => {
    async function load() {
      const prefs = await loadViewPrefs(VIEW_KEY, { v: 1, sort: null, colWidths: {}, colOrder: [], colHidden: [] })
      if (prefs) {
        setColPrefs({
          colWidths: prefs.colWidths ?? {},
          colOrder: prefs.colOrder ?? [],
          colHidden: prefs.colHidden ?? {},
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

  // Load unit type UUID from code
  useEffect(() => {
    if (!unitTypeCode) {
      setUnitTypeId(null)
      return
    }

    async function loadUnitTypeId() {
      try {
        const { data } = await supabase
          .from('generic_types')
          .select('id')
          .eq('category', 'unit_types')
          .eq('code', unitTypeCode)
          .single()
        
        setUnitTypeId(data?.id || null)
      } catch (err) {
        logger.error('Failed to load unit type ID', err)
        setUnitTypeId(null)
      }
    }

    loadUnitTypeId()
  }, [unitTypeCode])

  // Register common actions
  useEffect(() => {
    const actions: CommonActionId[] = []
    if (viewMode === 'list') {
      actions.push('add', 'refresh', 'filter')
      if (selectedId) {
        actions.push('view', 'edit')
      }
      actions.push('columnSettings')
    } else {
      // Detail mode
      actions.push('close')
      if (viewMode === 'edit' || viewMode === 'create') {
        actions.push('save', 'cancel')
      } else if (viewMode === 'read') {
        actions.push('edit')
      }
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
      logger.log(`[common action] ${id}`)
      
      switch (id) {
        case 'add':
          setDetailUnit({
            id: 'new',
            propertyId: propertyId || null,
            unitTypeId: unitTypeId || null,
            displayName: null,
            internalCode: null,
            street: null,
            houseNumber: null,
            city: null,
            zip: null,
            country: 'CZ',
            region: null,
            floor: null,
            doorNumber: null,
            area: null,
            rooms: null,
            status: 'available',
            note: null,
            originModule: '040-nemovitost',
            isArchived: false,
            createdAt: null,
            updatedAt: null,
          })
          setViewMode('create')
          setSelectedId(null)
          setIsDirty(false)
          break
        
        case 'view':
          if (selectedId) {
            const found = units.find((u) => u.id === selectedId)
            if (found) {
              setDetailUnit({
                id: found.id,
                propertyId: found.propertyId,
                unitTypeId: found.unitTypeId,
                displayName: found.displayName,
                internalCode: null, // Load full detail in DetailFrame
                street: null,
                houseNumber: null,
                city: null,
                zip: null,
                country: 'CZ',
                region: null,
                floor: found.floor,
                doorNumber: null,
                area: found.area,
                rooms: found.rooms,
                status: found.status,
                note: null,
                originModule: '040-nemovitost',
                isArchived: found.isArchived,
                createdAt: null,
                updatedAt: null,
              })
              setViewMode('read')
              setIsDirty(false)
            }
          }
          break
        
        case 'edit':
          if (viewMode === 'read' && detailUnit) {
            setViewMode('edit')
          } else if (selectedId) {
            const found = units.find((u) => u.id === selectedId)
            if (found) {
              setDetailUnit({
                id: found.id,
                propertyId: found.propertyId,
                unitTypeId: found.unitTypeId,
                displayName: found.displayName,
                internalCode: null,
                street: null,
                houseNumber: null,
                city: null,
                zip: null,
                country: 'CZ',
                region: null,
                floor: found.floor,
                doorNumber: null,
                area: found.area,
                rooms: found.rooms,
                status: found.status,
                note: null,
                originModule: '040-nemovitost',
                isArchived: found.isArchived,
                createdAt: null,
                updatedAt: null,
              })
              setViewMode('edit')
              setIsDirty(false)
            }
          }
          break
        
        case 'save':
          if (submitDetailFnRef.current) {
            const saved = await submitDetailFnRef.current()
            if (saved) {
              setViewMode('read')
              setSelectedId(saved.id)
              await fetchUnits()
            }
          }
          break
        
        case 'cancel':
          if (viewMode === 'create') {
            setViewMode('list')
            setDetailUnit(null)
          } else {
            setViewMode('read')
            setIsDirty(false)
          }
          break
        
        case 'close':
          setViewMode('list')
          setDetailUnit(null)
          setSelectedId(null)
          setIsDirty(false)
          break
        
        case 'refresh':
          await fetchUnits()
          toast.success('Seznam jednotek obnoven')
          break
        
        case 'filter':
          setFilterInput('')
          setFilterText('')
          setShowArchived(false)
          toast.info('Filtry resetovány')
          break
        
        case 'columnSettings':
          setColsOpen(true)
          break
        
        default:
          logger.warn(`Unknown action: ${id}`)
      }
    })
  }, [selectedId, units, detailUnit, viewMode, propertyId, unitTypeId, onRegisterCommonActionHandler, toast])

  // Fetch units
  const fetchUnits = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const rows = await listUnits({
        searchText: filterText,
        propertyId: propertyId || undefined,
        unitTypeId: unitTypeId || undefined,
        status: status || undefined,
        includeArchived: showArchived,
      })
      
      const mapped = rows.map(mapRowToUi)
      setUnits(mapped)
      logger.log(`Loaded ${mapped.length} units`)
    } catch (err) {
      logger.error('Failed to fetch units', err)
      setError(err instanceof Error ? err.message : 'Neznámá chyba')
      toast.error('Chyba při načítání jednotek')
    } finally {
      setLoading(false)
    }
  }, [filterText, propertyId, unitTypeId, status, showArchived, toast])

  useEffect(() => {
    fetchUnits()
  }, [fetchUnits])

  // Row click handler
  const handleRowClick = useCallback((row: ListViewRow<UiUnitRow>) => {
    setSelectedId(row.id)
    logger.log(`Selected unit: ${row.id}`)
  }, [])

  // Sort handler
  const handleSortChange = useCallback((newSort: ListViewSortState) => {
    setSort(newSort)
    logger.log(`Sort changed: ${newSort.key} ${newSort.dir}`)
  }, [])

  // Sorted rows
  const sortedRows = useMemo(() => {
    if (!sort) return units

    return [...units].sort((a, b) => {
      const aVal = a[sort.key as keyof UiUnitRow]
      const bVal = b[sort.key as keyof UiUnitRow]
      
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return sort.dir === 'asc' ? 1 : -1
      if (bVal == null) return sort.dir === 'asc' ? -1 : 1
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sort.dir === 'asc' ? aVal - bVal : bVal - aVal
      }
      
      const aStr = String(aVal).toLowerCase()
      const bStr = String(bVal).toLowerCase()
      return sort.dir === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr)
    })
  }, [units, sort])

  const viewRows = sortedRows.map(toRow)

  // Detail callbacks
  const handleDetailSaved = useCallback((saved: UiUnit) => {
    setDetailUnit(saved)
    setSelectedId(saved.id)
    fetchUnits()
  }, [fetchUnits])

  return (
    <div className="tile-layout">
      {viewMode === 'list' && (
        <>
          {loading && <SkeletonTable rows={5} cols={7} />}
          
          {error && (
            <div className="error-message" style={{ padding: '20px', color: '#ef4444' }}>
              ❌ {error}
            </div>
          )}
          
          {!loading && !error && (
            <>
              <ListView
                rows={viewRows}
                columns={columns}
                sort={sort}
                onSortChange={handleSortChange}
                onRowClick={handleRowClick}
                selectedId={selectedId}
                fixedFirstKey={fixedFirstKey}
              />
              
              <ListViewColumnsDrawer
                open={colsOpen}
                onClose={() => setColsOpen(false)}
                columns={BASE_COLUMNS}
                fixedFirstKey={fixedFirstKey}
                requiredKeys={requiredKeys}
                currentWidths={colPrefs.colWidths ?? {}}
                currentOrder={colPrefs.colOrder ?? []}
                currentHidden={colPrefs.colHidden ?? []}
                onApply={(widths, order, hidden) => {
                  setColPrefs({ colWidths: widths, colOrder: order, colHidden: hidden })
                  setColsOpen(false)
                  toast.success('Nastavení sloupců uloženo')
                }}
              />
            </>
          )}
        </>
      )}
      
      {viewMode !== 'list' && detailUnit && (
        <UnitDetailFrame
          unit={detailUnit}
          viewMode={viewMode}
          initialSectionId={activeSectionId}
          onActiveSectionChange={setActiveSectionId}
          onRegisterSubmit={(fn) => { submitDetailFnRef.current = fn }}
          onDirtyChange={setIsDirty}
          onSaved={handleDetailSaved}
        />
      )}
    </div>
  )
}
