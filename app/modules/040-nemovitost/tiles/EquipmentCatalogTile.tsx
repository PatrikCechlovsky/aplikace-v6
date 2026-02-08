'use client'

// FILE: app/modules/040-nemovitost/tiles/EquipmentCatalogTile.tsx
// PURPOSE: List + detail katalogu vybavení - master seznam typů vybavení pro výběr do nemovitostí/jednotek
// URL state: t=equipment-catalog, id + vm (detail: view/edit/create)

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import ListView, { type ListViewRow, type ListViewSortState } from '@/app/UI/ListView'
import type { CommonActionId, ViewMode } from '@/app/UI/CommonActions'
import { 
  listEquipmentCatalog, 
  getEquipmentCatalogById,
  createEquipmentCatalog,
  updateEquipmentCatalog,
  type EquipmentCatalogRow 
} from '@/app/lib/services/equipment'
import EquipmentCatalogDetailFormComponent from '../forms/EquipmentCatalogDetailFormComponent'
import type { EquipmentCatalogFormValue } from '../forms/EquipmentCatalogDetailForm'
import { applyColumnPrefs, loadViewPrefs, saveViewPrefs, type ViewPrefs } from '@/app/lib/services/viewPrefs'
import { SkeletonTable } from '@/app/UI/SkeletonLoader'
import { useToast } from '@/app/UI/Toast'
import createLogger from '@/app/lib/logger'
import {
  EQUIPMENT_CATALOG_BASE_COLUMNS,
  EQUIPMENT_CATALOG_DEFAULT_SORT,
  EQUIPMENT_CATALOG_VIEW_KEY,
  buildEquipmentCatalogListRow,
  getEquipmentCatalogSortValue,
  type EquipmentCatalogListItem,
} from '../equipmentCatalogListConfig'
import ListViewColumnsDrawer from '@/app/UI/ListViewColumnsDrawer'
import { supabase } from '@/app/lib/supabaseClient'

import '@/app/styles/components/TileLayout.css'

const logger = createLogger('040 EquipmentCatalogTile')

type LocalViewMode = 'list' | 'view' | 'edit' | 'create'
type UiEquipmentCatalog = EquipmentCatalogListItem & {
  equipmentTypeId: string | null
  equipmentTypeIcon: string | null
  roomTypeId: string | null
  roomTypeIcon: string | null
  purchaseDate: string | null
  defaultRevisionInterval: number | null
  defaultDescription: string | null
}

function mapRowToUi(row: EquipmentCatalogRow): UiEquipmentCatalog {
  return {
    id: row.id,
    equipmentName: row.equipment_name || '—',
    equipmentTypeId: row.equipment_type_id || null,
    equipmentTypeName: row.equipment_type_name || '—',
    equipmentTypeIcon: row.equipment_type_icon || null,
    equipmentTypeColor: row.equipment_type_color || null,
    roomTypeId: row.room_type_id || null,
    roomTypeName: row.room_type_name || '—',
    roomTypeIcon: row.room_type_icon || null,
    roomTypeColor: row.room_type_color || null,
    purchasePrice: row.purchase_price,
    purchaseDate: row.purchase_date,
    defaultLifespanMonths: row.default_lifespan_months,
    defaultRevisionInterval: row.default_revision_interval,
    defaultState: row.default_state,
    defaultDescription: row.default_description,
    isArchived: !!row.is_archived,
  }
}

const toRow = (e: UiEquipmentCatalog): ListViewRow<UiEquipmentCatalog> => {
  const row = buildEquipmentCatalogListRow(e)
  return { ...row, raw: e } as ListViewRow<UiEquipmentCatalog>
}
const getSortValue = (e: UiEquipmentCatalog, key: string): string | number => getEquipmentCatalogSortValue(e, key)

type EquipmentCatalogTileProps = {
  equipmentTypeFilter?: string | null // Pro filtrování podle typu (použito v EquipmentTypeTile)
  onRegisterCommonActions?: (actions: CommonActionId[]) => void
  onRegisterCommonActionsState?: (state: { viewMode: ViewMode; hasSelection: boolean; isDirty: boolean }) => void
  onRegisterCommonActionHandler?: (fn: ((id: CommonActionId) => void) | null) => void
  onNavigate?: (tileId: string) => void
}

export default function EquipmentCatalogTile({
  equipmentTypeFilter: externalEquipmentTypeFilter,
  onRegisterCommonActions,
  onRegisterCommonActionsState,
  onRegisterCommonActionHandler,
  onNavigate: _onNavigate,
}: EquipmentCatalogTileProps) {
  const { showToast } = useToast()

  const [localViewMode, setLocalViewMode] = useState<LocalViewMode>('list')
  const [data, setData] = useState<UiEquipmentCatalog[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [currentEquipment, setCurrentEquipment] = useState<EquipmentCatalogFormValue | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Search
  const [searchText, setSearchText] = useState('')
  const [debouncedSearchText, setDebouncedSearchText] = useState('')

  // Filters - použít externí filter pokud je předán (code → bude převeden na ID)
  const [equipmentTypeFilter, _setEquipmentTypeFilter] = useState<string | null>(externalEquipmentTypeFilter || null)
  const [equipmentTypeId, setEquipmentTypeId] = useState<string | null>(null)
  const [isLoadingTypeId, setIsLoadingTypeId] = useState(false)
  const [showArchived, setShowArchived] = useState(false)

  // View prefs
  const [colPrefs, setColPrefs] = useState<Pick<ViewPrefs, 'colWidths' | 'colOrder' | 'colHidden'>>({
    colWidths: {},
    colOrder: [],
    colHidden: [],
  })
  const [sort, setSort] = useState<ListViewSortState>(EQUIPMENT_CATALOG_DEFAULT_SORT)
  const [showColumnsDrawer, setShowColumnsDrawer] = useState(false)

  // Sync external equipment type filter (from EquipmentTypeTile) and convert code to ID
  useEffect(() => {
    if (externalEquipmentTypeFilter !== undefined) {
      _setEquipmentTypeFilter(externalEquipmentTypeFilter)
    }
  }, [externalEquipmentTypeFilter])

  // Convert equipmentTypeFilter (code) to ID
  useEffect(() => {
    if (!equipmentTypeFilter) {
      setEquipmentTypeId(null)
      setIsLoadingTypeId(false)
      return
    }

    setIsLoadingTypeId(true)

    async function fetchTypeId() {
      logger.log('🔍 Hledám ID pro code:', equipmentTypeFilter)
      
      const { data, error } = await supabase
        .from('generic_types')
        .select('id')
        .eq('category', 'equipment_types')
        .eq('code', equipmentTypeFilter)
        .single()

      if (error || !data) {
        logger.error('❌ Nepodařilo se najít ID typu vybavení pro code:', equipmentTypeFilter, error)
        setEquipmentTypeId(null)
        setIsLoadingTypeId(false)
        return
      }

      logger.log('✅ Převod code → ID:', equipmentTypeFilter, '→', data.id)
      setEquipmentTypeId(data.id)
      setIsLoadingTypeId(false)
    }

    void fetchTypeId()
  }, [equipmentTypeFilter])

  // Data loading
  const loadData = useCallback(async () => {
    // If we're waiting for equipmentTypeId conversion, skip loading
    if (isLoadingTypeId) {
      logger.log('⏳ Čekám na převod code → ID před načtením dat')
      return
    }

    try {
      setLoading(true)
      setError(null)

      logger.log('📊 Načítám data:', { 
        equipmentTypeFilter,
        equipmentTypeId, 
        hasFilter: !!equipmentTypeId,
        isLoadingTypeId,
        showArchived
      })

      const rows = await listEquipmentCatalog({
        searchText: debouncedSearchText,
        equipmentTypeId: equipmentTypeId,
        includeArchived: showArchived,
      })

      logger.log('✅ Načteno řádků:', rows.length, 'filtr:', equipmentTypeId ? 'ANO' : 'NE')

      const filtered = rows.map(mapRowToUi)

      setData(filtered)
    } catch (err: any) {
      logger.error('Chyba při načítání katalogu vybavení:', err)
      setError(err.message || 'Nepodařilo se načíst katalog vybavení')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearchText, equipmentTypeId, showArchived, isLoadingTypeId])

  // Load data on mount and when filters change
  useEffect(() => {
    loadData()
  }, [loadData])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchText])

  // Load view prefs
  useEffect(() => {
    async function loadPrefs() {
      const prefs = await loadViewPrefs(EQUIPMENT_CATALOG_VIEW_KEY, {
        colWidths: {},
        colOrder: [],
        colHidden: [],
        sort: EQUIPMENT_CATALOG_DEFAULT_SORT,
      })
      if (prefs) {
        setColPrefs({
          colWidths: prefs.colWidths || {},
          colOrder: prefs.colOrder || [],
          colHidden: prefs.colHidden || [],
        })
        if (prefs.sort) {
          setSort(prefs.sort)
        }
      }
    }
    void loadPrefs()
  }, [])

  // Sorted data
  const sortedData = useMemo(() => {
    if (!sort) return data.map(toRow)
    const sorted = [...data].sort((a, b) => {
      const aVal = getSortValue(a, sort.key)
      const bVal = getSortValue(b, sort.key)
      return sort.dir === 'asc'
        ? aVal < bVal ? -1 : aVal > bVal ? 1 : 0
        : aVal > bVal ? -1 : aVal < bVal ? 1 : 0
    })
    return sorted.map(toRow)
  }, [data, sort])

  // Columns with prefs
  const columns = useMemo(() => {
    return applyColumnPrefs(EQUIPMENT_CATALOG_BASE_COLUMNS, colPrefs)
  }, [colPrefs])

  // Row click - pouze vybrat, nezobrazit detail
  const handleRowClick = useCallback((row: ListViewRow<UiEquipmentCatalog>) => {
    setSelectedId(String(row.id))
  }, [])

  // Row double click - otevřít detail v režimu view
  const handleRowDoubleClick = useCallback((row: ListViewRow<UiEquipmentCatalog>) => {
    setSelectedId(String(row.id))
    setLocalViewMode('view')
  }, [])

  // Sort change
  const handleSortChange = useCallback((newSort: ListViewSortState) => {
    setSort(newSort)
    void saveViewPrefs(EQUIPMENT_CATALOG_VIEW_KEY, {
      colWidths: colPrefs.colWidths ?? {},
      colOrder: colPrefs.colOrder ?? [],
      colHidden: colPrefs.colHidden ?? [],
      sort: newSort,
    })
  }, [colPrefs])

  // Column resize handler
  const handleColumnResize = useCallback((key: string, px: number) => {
    setColPrefs((p) => {
      const newWidths = { ...(p.colWidths ?? {}), [key]: px }
      // Save to preferences
      void saveViewPrefs(EQUIPMENT_CATALOG_VIEW_KEY, {
        colWidths: newWidths,
        colOrder: p.colOrder ?? [],
        colHidden: p.colHidden ?? [],
        sort: sort,
      })
      return { ...p, colWidths: newWidths }
    })
  }, [sort])

  // Detail handlers - must be defined before useEffect that uses them
  const closeToList = useCallback(() => {
    setLocalViewMode('list')
    setSelectedId(null)
    setCurrentEquipment(null)
  }, [])

  const handleSave = useCallback(async () => {
    if (!currentEquipment) return

    try {
      setDetailLoading(true)
      if (localViewMode === 'create') {
        await createEquipmentCatalog(currentEquipment)
        showToast('Vybavení vytvořeno', 'success')
      } else if (localViewMode === 'edit' && selectedId) {
        await updateEquipmentCatalog(selectedId, currentEquipment)
        showToast('Vybavení uloženo', 'success')
      }
      await loadData()
      setLocalViewMode('list')
      setSelectedId(null)
      setCurrentEquipment(null)
    } catch (err: any) {
      logger.error('Chyba při ukládání vybavení:', err)
      showToast(err.message || 'Nepodařilo se uložit vybavení', 'error')
    } finally {
      setDetailLoading(false)
    }
  }, [localViewMode, selectedId, currentEquipment, loadData, showToast])

  // Common actions
  useEffect(() => {
    if (!onRegisterCommonActions) return

    const actions: CommonActionId[] = []
    if (localViewMode === 'list') {
      actions.push('add')
      if (selectedId) {
        actions.push('view', 'edit')
      }
      actions.push('columnSettings', 'close')
    } else if (localViewMode === 'view') {
      actions.push('edit', 'close')
    } else if (localViewMode === 'edit' || localViewMode === 'create') {
      actions.push('save', 'close')
    }

    onRegisterCommonActions(actions)
  }, [localViewMode, onRegisterCommonActions])

  useEffect(() => {
    if (!onRegisterCommonActionsState) return

    const viewMode: ViewMode = localViewMode === 'list' ? 'list' : localViewMode as ViewMode
    onRegisterCommonActionsState({
      viewMode,
      hasSelection: !!selectedId,
      isDirty: false,
    })
  }, [localViewMode, selectedId, onRegisterCommonActionsState])

  useEffect(() => {
    if (!onRegisterCommonActionHandler) return

    const handler = (actionId: CommonActionId) => {
      if (actionId === 'add') {
        setSelectedId(null)
        setCurrentEquipment({
          equipment_name: '',
          equipment_type_id: '',
          is_archived: false,
        })
        setLocalViewMode('create')
      } else if (actionId === 'columnSettings') {
        setShowColumnsDrawer(true)
      } else if (actionId === 'view') {
        if (!selectedId) return
        setLocalViewMode('view')
      } else if (actionId === 'edit') {
        setLocalViewMode('edit')
      } else if (actionId === 'save') {
        handleSave()
      } else if (actionId === 'close') {
        closeToList()
      }
    }

    onRegisterCommonActionHandler(handler)

    return () => {
      onRegisterCommonActionHandler(null)
    }
  }, [onRegisterCommonActionHandler, localViewMode, selectedId, handleSave, closeToList])

  // Load detail when selectedId changes
  useEffect(() => {
    if (!selectedId || localViewMode === 'create') {
      setCurrentEquipment(null)
      return
    }

    async function loadDetail() {
      if (!selectedId) return
      try {
        setDetailLoading(true)
        const equipment = await getEquipmentCatalogById(selectedId)
        if (equipment) {
          setCurrentEquipment({
            equipment_name: equipment.equipment_name,
            equipment_type_id: equipment.equipment_type_id || '',
            room_type_id: equipment.room_type_id || undefined,
            purchase_price: equipment.purchase_price || undefined,
            purchase_date: equipment.purchase_date || undefined,
            default_lifespan_months: equipment.default_lifespan_months || undefined,
            default_revision_interval: equipment.default_revision_interval || undefined,
            default_state: equipment.default_state || 'working',
            default_description: equipment.default_description || undefined,
            is_archived: equipment.is_archived || false,
          })
        }
      } catch (err: any) {
        logger.error('Chyba při načítání detailu vybavení:', err)
        showToast(err.message || 'Nepodařilo se načíst detail', 'error')
        setLocalViewMode('list')
        setSelectedId(null)
      } finally {
        setDetailLoading(false)
      }
    }

    void loadDetail()
  }, [selectedId, localViewMode, showToast])

  // Loading state
  if (loading && data.length === 0) {
    return (
      <div className="tile-layout">
        <div className="tile-layout__header">
          <input
            type="text"
            className="tile-layout__search-input"
            placeholder="Hledat vybavení..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        <div className="tile-layout__content">
          <SkeletonTable rows={10} columns={7} />
        </div>
      </div>
    )
  }

  // Error state
  if (error && data.length === 0) {
    return (
      <div className="tile-layout">
        <div className="tile-layout__content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>Nepodařilo se načíst katalog vybavení</div>
          <div style={{ color: '#6b7280', marginBottom: '1.5rem' }}>{error}</div>
          <button onClick={loadData} className="btn btn--primary">
            Zkusit znovu
          </button>
        </div>
      </div>
    )
  }

  // Detail view
  if (localViewMode === 'view' || localViewMode === 'edit' || localViewMode === 'create') {
    const readOnly = localViewMode === 'view'
    const equipmentName = currentEquipment?.equipment_name || 'Detail'

    return (
      <div className="tile-layout">
        <div className="tile-layout__header">
          <h1 className="tile-layout__title">
            {localViewMode === 'create' ? '➕ Nové vybavení' : `📋 Katalog vybavení - ${equipmentName}`}
          </h1>
        </div>
        <div className="tile-layout__content">
          {detailLoading && !currentEquipment ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>Načítání...</div>
          ) : currentEquipment ? (
            <EquipmentCatalogDetailFormComponent
              equipment={currentEquipment}
              readOnly={readOnly}
              onValueChange={setCurrentEquipment}
            />
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              Nepodařilo se načíst detail vybavení
            </div>
          )}
        </div>
      </div>
    )
  }

  // List view
  return (
    <div className="tile-layout">
      <div className="tile-layout__header">
        <h1 className="tile-layout__title">📋 Katalog vybavení</h1>
      </div>
      <div className="tile-layout__content">
        <ListView
          columns={columns}
          rows={sortedData}
          filterValue={searchText}
          onFilterChange={setSearchText}
          showArchived={showArchived}
          onShowArchivedChange={setShowArchived}
          selectedId={selectedId}
          onRowClick={handleRowClick}
          onRowDoubleClick={handleRowDoubleClick}
          sort={sort}
          onSortChange={handleSortChange}
          onColumnResize={handleColumnResize}
        />
      </div>

      <ListViewColumnsDrawer
        open={showColumnsDrawer}
        onClose={() => setShowColumnsDrawer(false)}
        columns={EQUIPMENT_CATALOG_BASE_COLUMNS}
        fixedFirstKey="equipmentTypeName"
        requiredKeys={['equipmentName']}
        value={{
          order: colPrefs.colOrder ?? [],
          hidden: colPrefs.colHidden ?? [],
        }}
        sortBy={sort ?? undefined}
        onChange={(next) => {
          setColPrefs((p) => {
            const updated = {
              ...p,
              colOrder: next.order,
              colHidden: next.hidden,
            }
            // Save to DB
            void saveViewPrefs(EQUIPMENT_CATALOG_VIEW_KEY, {
              colWidths: updated.colWidths ?? {},
              colOrder: updated.colOrder ?? [],
              colHidden: updated.colHidden ?? [],
              sort: sort,
            })
            return updated
          })
        }}
        onSortChange={(newSort) => handleSortChange(newSort)}
        onReset={() => {
          const resetPrefs = {
            colWidths: {},
            colOrder: [],
            colHidden: [],
          }
          setColPrefs(resetPrefs)
          setSort(EQUIPMENT_CATALOG_DEFAULT_SORT)
          // Save reset to DB
          void saveViewPrefs(EQUIPMENT_CATALOG_VIEW_KEY, {
            ...resetPrefs,
            sort: EQUIPMENT_CATALOG_DEFAULT_SORT,
          })
        }}
      />
    </div>
  )
}
