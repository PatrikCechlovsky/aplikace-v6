'use client'

// FILE: app/modules/040-nemovitost/tiles/UnitsTile.tsx
// PURPOSE: Seznam jednotek s filtry + detail - podobné chování jako PropertiesTile
// URL state: t=units-list, id + vm (detail: read/edit/create), am=1 (attachments manager)

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { getContrastTextColor } from '@/app/lib/colorUtils'
import AttachmentsManagerFrame from '@/app/UI/attachments/AttachmentsManagerFrame'
import type { AttachmentsManagerUiState, AttachmentsManagerApi } from '@/app/UI/detail-sections/DetailAttachmentsSection'

import '@/app/styles/components/TileLayout.css'
import '@/app/styles/components/PaletteCard.css'

const logger = createLogger('040 UnitsTile')

type LocalViewMode = ViewMode | 'list' | 'attachments-manager'

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
  onNavigate?: (tileId: string) => void
}

export default function UnitsTile({
  propertyId,
  unitTypeCode,
  status,
  onRegisterCommonActions,
  onRegisterCommonActionsState,
  onRegisterCommonActionHandler,
  onNavigate,
}: UnitsTileProps) {
  console.log('🔍 UnitsTile: Renderuji s filtry:', { propertyId, unitTypeCode, status })
  const toast = useToast()
  const router = useRouter()

  const [units, setUnits] = useState<UiUnitRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [filterInput, setFilterInput] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [selectedId, setSelectedId] = useState<string | number | null>(null)
  const [unitTypeId, setUnitTypeId] = useState<string | null>(null)
  
  // Unit types for create mode type selector
  const [unitTypes, setUnitTypes] = useState<Array<{ id: string; code: string; name: string; icon: string | null; color: string | null }>>([])
  const [selectedTypeForCreate, setSelectedTypeForCreate] = useState<string | null>(null)
  
  // Detail state
  const [viewMode, setViewMode] = useState<LocalViewMode>('list')
  const [detailUnit, setDetailUnit] = useState<UiUnit | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [activeSectionId, setActiveSectionId] = useState<DetailSectionId>('detail')
  const submitDetailFnRef = React.useRef<(() => Promise<UiUnit | null>) | null>(null)
  
  // Attachments manager state
  const [attachmentsManagerUnitId, setAttachmentsManagerUnitId] = useState<string | null>(null)
  const [attachmentsManagerUi, setAttachmentsManagerUi] = useState<AttachmentsManagerUiState>({
    hasSelection: false,
    isDirty: false,
    mode: 'list',
  })
  const attachmentsManagerApiRef = useRef<AttachmentsManagerApi | null>(null)
  
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
      sort: sort && (sort.key !== DEFAULT_SORT.key || sort.dir !== DEFAULT_SORT.dir) ? sort : null,
    }
    saveViewPrefs(VIEW_KEY, prefs)
  }, [colPrefs, sort, DEFAULT_SORT])

  useEffect(() => {
    savePrefs()
  }, [savePrefs])

  // Close handlers
  const closeListToModule = useCallback(() => {
    router.push('/')
  }, [router])

  const closeToList = useCallback(() => {
    setDetailUnit(null)
    setViewMode('list')
    setSelectedId(null)
    setSelectedTypeForCreate(null)
    setIsDirty(false)
  }, [])

  // Load unit types for create mode type selector
  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await supabase
          .from('generic_types')
          .select('id, code, name, icon, color')
          .eq('category', 'unit_types')
          .eq('active', true)
          .order('order_index')
        
        setUnitTypes(data || [])
      } catch (err) {
        logger.error('Failed to load unit types', err)
      }
    })()
  }, [])

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
      actions.push('add')
      if (selectedId) {
        actions.push('view', 'edit', 'attachments')
      }
      actions.push('columnSettings', 'close')
    } else if (viewMode === 'edit' || viewMode === 'create') {
      if (viewMode === 'edit') {
        actions.push('save', 'attachments', 'close')
      } else {
        actions.push('save', 'close')
      }
    } else if (viewMode === 'read') {
      actions.push('edit', 'attachments', 'close')
    } else if (viewMode === 'attachments-manager') {
      // Attachments manager má vlastní actions - registruje je AttachmentsManagerFrame
      const mode = attachmentsManagerUi.mode ?? 'list'
      if (mode === 'new') {
        actions.push('save', 'close')
      } else if (mode === 'edit') {
        actions.push('save', 'attachmentsNewVersion', 'close')
      } else if (mode === 'read') {
        actions.push('edit', 'close')
      } else {
        // mode === 'list'
        actions.push('add', 'view', 'edit', 'attachmentsNewVersion', 'columnSettings', 'close')
      }
    }

    onRegisterCommonActions?.(actions)
    
    // Namapovat LocalViewMode na ViewMode
    let mappedViewMode: ViewMode
    if ((viewMode as string) === 'list') {
      mappedViewMode = 'list'
    } else if (viewMode === 'edit') {
      mappedViewMode = 'edit'
    } else if (viewMode === 'create') {
      mappedViewMode = 'create'
    } else if (viewMode === 'attachments-manager') {
      // Podle mode z AttachmentsManagerFrame určit správný ViewMode
      const mode = attachmentsManagerUi.mode ?? 'list'
      if (mode === 'list') mappedViewMode = 'list'
      else if (mode === 'edit') mappedViewMode = 'edit'
      else if (mode === 'new') mappedViewMode = 'create'
      else mappedViewMode = 'read' // mode === 'read'
    } else {
      mappedViewMode = 'read'
    }
    
    onRegisterCommonActionsState?.({
      viewMode: mappedViewMode,
      hasSelection: viewMode === 'attachments-manager' ? !!attachmentsManagerUi.hasSelection : !!selectedId,
      isDirty: viewMode === 'attachments-manager' ? !!attachmentsManagerUi.isDirty : isDirty,
    })
  }, [viewMode, selectedId, isDirty, attachmentsManagerUi.mode, attachmentsManagerUi.hasSelection, attachmentsManagerUi.isDirty, onRegisterCommonActions, onRegisterCommonActionsState])

  // Handle common actions
  useEffect(() => {
    if (!onRegisterCommonActionHandler) return
    
    onRegisterCommonActionHandler(async (id: CommonActionId) => {
      logger.log(`[common action] ${id}`)
      
      switch (id) {
        case 'add':
          // ✅ Naviguj na create-unit tile pomocí onNavigate callback
          onNavigate?.('create-unit')
          return
        
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
              setDetailUnit(saved)
              setSelectedId(saved.id)
              setIsDirty(false)
              await fetchUnits()
            }
          }
          break
        
        case 'close':
          if (viewMode === 'attachments-manager') {
            const dirtyNow = !!attachmentsManagerUi.isDirty
            if (dirtyNow) {
              const ok = confirm('Máš neuložené změny. Opravdu chceš zavřít?')
              if (!ok) return
            }

            const mode = attachmentsManagerUi.mode ?? 'list'
            
            // Pokud jsme v read/edit/new mode, zavřít tento panel a vrátit se do list mode
            if (mode === 'read' || mode === 'edit' || mode === 'new') {
              const api = attachmentsManagerApiRef.current
              if (api?.close) {
                api.close()
              }
            } else {
              // Jsme v list mode, zavřít celý attachments manager
              setViewMode('read')
              setActiveSectionId('attachments')
              setAttachmentsManagerUnitId(null)
            }
            break
          }

          if (isDirty && (viewMode === 'edit' || viewMode === 'create')) {
            const ok = confirm('Máš neuložené změny. Opravdu chceš zavřít?')
            if (!ok) return
          }
          if (viewMode === 'read' || viewMode === 'edit' || viewMode === 'create') {
            closeToList()
          } else {
            closeListToModule()
          }
          break
        
        case 'attachments':
          if (viewMode === 'list') {
            if (!selectedId) {
              toast.showWarning('Nejdřív vyber jednotku v seznamu.')
              return
            }
            setAttachmentsManagerUnitId(String(selectedId))
            setViewMode('attachments-manager')
            setIsDirty(false)
            break
          }

          if (viewMode === 'read') {
            if (isDirty) {
              toast.showWarning('Máš neuložené změny. Nejdřív ulož nebo zavři změny a pak otevři správu příloh.')
              return
            }
            if (!detailUnit?.id || detailUnit.id === 'new') {
              toast.showWarning('Nejdřív ulož záznam, aby šly spravovat přílohy.')
              return
            }
            setAttachmentsManagerUnitId(detailUnit.id)
            setViewMode('attachments-manager')
            setIsDirty(false)
            break
          }
          break
        
        case 'add':
          if (viewMode === 'attachments-manager') {
            const api = attachmentsManagerApiRef.current
            if (api) api.add()
            break
          }
          // Pro list mode - přidat novou jednotku (implementováno později)
          break
        
        case 'view':
        case 'detail':
          if (viewMode === 'attachments-manager') {
            const api = attachmentsManagerApiRef.current
            if (api) api.view()
            break
          }
          break
        
        case 'edit':
          if (viewMode === 'attachments-manager') {
            const api = attachmentsManagerApiRef.current
            if (api) api.edit()
            break
          }
          break
        
        case 'attachmentsNewVersion':
          if (viewMode === 'attachments-manager') {
            const api = attachmentsManagerApiRef.current
            if (api) api.newVersion()
          }
          break
        
        case 'columnSettings':
          setColsOpen(true)
          break
        
        default:
          logger.warn(`Unknown action: ${id}`)
      }
    })
  }, [selectedId, units, detailUnit, viewMode, propertyId, unitTypeId, isDirty, onRegisterCommonActionHandler, toast, closeListToModule, closeToList, attachmentsManagerApiRef])

  // Fetch units
  const fetchUnits = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const rows = await listUnits({
        propertyId: propertyId || undefined,
        unitTypeId: unitTypeId || undefined,
        status: status || undefined,
      })
      
      const mapped = rows.map(mapRowToUi)
      setUnits(mapped)
      logger.log(`Loaded ${mapped.length} units`)
    } catch (err) {
      logger.error('Failed to fetch units', err)
      setError(err instanceof Error ? err.message : 'Neznámá chyba')
      toast.showError('Chyba při načítání jednotek')
    } finally {
      setLoading(false)
    }
  }, [propertyId, unitTypeId, status, toast])

  useEffect(() => {
    fetchUnits()
  }, [fetchUnits])

  // Row click handler
  const handleRowClick = useCallback((row: ListViewRow<UiUnitRow>) => {
    setSelectedId(row.id)
    logger.log(`Selected unit: ${row.id}`)
  }, [])

  // Type selector handler for create mode
  const handleTypeSelect = useCallback((typeId: string) => {
    setSelectedTypeForCreate(typeId)
    // Create new unit with selected type
    setDetailUnit({
      id: 'new',
      propertyId: propertyId || null,
      unitTypeId: typeId,
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
  }, [propertyId])

  // Sort handler
  const handleSortChange = useCallback((newSort: ListViewSortState) => {
    setSort(newSort)
    logger.log(`Sort changed: ${newSort?.key} ${newSort?.dir}`)
  }, [])
  
  // Column resize handler
  const handleColumnResize = useCallback((key: string, px: number) => {
    setColPrefs((p) => ({ ...p, colWidths: { ...(p.colWidths ?? {}), [key]: px } }))
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
  
  // Page title
  const pageTitle = useMemo(() => {
    if (!unitTypeCode) return 'Přehled jednotek'
    return `Přehled jednotek - ${unitTypeCode}`
  }, [unitTypeCode])

  // Detail callbacks
  const handleDetailSaved = useCallback((saved: UiUnit) => {
    setDetailUnit(saved)
    setSelectedId(saved.id)
    fetchUnits()
  }, [fetchUnits])
  
  console.log('🔍 UnitsTile: State - loading:', loading, 'units:', units.length, 'error:', error, 'viewMode:', viewMode)

  if (viewMode === 'list') {
    return (
      <div className="tile-layout">
        <div className="tile-layout__header">
          <h1 className="tile-layout__title">{pageTitle}</h1>
          <p className="tile-layout__description">
            Seznam všech jednotek. Můžeš filtrovat, řadit a spravovat jednotky.
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
              rows={viewRows}
              filterValue={filterInput}
              onFilterChange={setFilterInput}
              showArchived={showArchived}
              onShowArchivedChange={setShowArchived}
              selectedId={selectedId ?? null}
              onRowClick={handleRowClick}
              onRowDoubleClick={(row) => {
                const unit = row.raw
                if (!unit) return
                setDetailUnit({
                  id: unit.id,
                  propertyId: unit.propertyId,
                  unitTypeId: unit.unitTypeId,
                  displayName: unit.displayName,
                  internalCode: null,
                  street: null,
                  houseNumber: null,
                  city: null,
                  zip: null,
                  country: 'CZ',
                  region: null,
                  floor: unit.floor,
                  doorNumber: null,
                  area: unit.area,
                  rooms: unit.rooms,
                  status: unit.status,
                  note: null,
                  originModule: '040-nemovitost',
                  isArchived: unit.isArchived,
                  createdAt: null,
                  updatedAt: null,
                })
                setViewMode('read')
                setIsDirty(false)
              }}
              sort={sort}
              onSortChange={handleSortChange}
              onColumnResize={handleColumnResize}
            />
            
            {units.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                {filterInput ? 'Žádné jednotky nenalezeny' : 'Zatím nemáte žádné jednotky'}
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
            setColPrefs({
              colWidths: {},
              colOrder: [],
              colHidden: [],
            })
          }}
        />
      </div>
    )
  }

  // Create mode: show type selector if no type selected yet
  if (viewMode === 'create' && !selectedTypeForCreate) {
    return (
      <div className="tile-layout">
        <div className="tile-layout__header">
          <h1 className="tile-layout__title">Nová jednotka</h1>
          <p className="tile-layout__description">Vyberte typ jednotky</p>
        </div>
        <div className="tile-layout__content" style={{ padding: '1.5rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
            }}
          >
            {unitTypes.map((type) => {
              const color = type.color || '#666666'
              
              return (
                <button
                  key={type.id}
                  type="button"
                  className="palette-card"
                  onClick={() => handleTypeSelect(type.id)}
                  style={{
                    backgroundColor: 'var(--color-surface-subtle)',
                    borderColor: color,
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                    {type.icon || '📦'}
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                    {type.name}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ATTACHMENTS MANAGER VIEW
  if (viewMode === 'attachments-manager' && attachmentsManagerUnitId) {
    const unit = units.find((u) => u.id === attachmentsManagerUnitId) ?? detailUnit
    const label = unit?.displayName || 'Jednotka'
    
    return (
      <AttachmentsManagerFrame
        entityType="units"
        entityId={attachmentsManagerUnitId}
        entityLabel={label}
        canManage={true}
        onRegisterManagerApi={(api) => {
          attachmentsManagerApiRef.current = api
        }}
        onManagerStateChange={(state) => {
          setAttachmentsManagerUi(state)
        }}
      />
    )
  }

  return (
    <div className="tile-layout">
      {detailUnit && (
        <UnitDetailFrame
          unit={detailUnit}
          viewMode={((viewMode as string) === 'list' || (viewMode as string) === 'attachments-manager') ? 'read' : viewMode as ViewMode}
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
