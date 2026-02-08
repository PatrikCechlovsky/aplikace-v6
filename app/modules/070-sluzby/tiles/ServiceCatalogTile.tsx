// FILE: app/modules/070-sluzby/tiles/ServiceCatalogTile.tsx
// PURPOSE: Katalog služeb – list + detail
// URL state: t=service-catalog

'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import ListView, { type ListViewRow, type ListViewSortState } from '@/app/UI/ListView'
import type { CommonActionId, ViewMode } from '@/app/UI/CommonActions'
import {
  listServiceCatalog,
  getServiceCatalogById,
  createServiceCatalog,
  updateServiceCatalog,
  type ServiceCatalogRow,
} from '@/app/lib/services/serviceCatalog'
import ServiceCatalogDetailFormComponent from '../forms/ServiceCatalogDetailFormComponent'
import type { ServiceCatalogFormValue } from '../forms/ServiceCatalogDetailForm'
import { applyColumnPrefs, loadViewPrefs, saveViewPrefs, type ViewPrefs } from '@/app/lib/services/viewPrefs'
import { useToast } from '@/app/UI/Toast'
import createLogger from '@/app/lib/logger'
import {
  SERVICE_CATALOG_BASE_COLUMNS,
  SERVICE_CATALOG_DEFAULT_SORT,
  SERVICE_CATALOG_VIEW_KEY,
  buildServiceCatalogListRow,
  getServiceCatalogSortValue,
  type ServiceCatalogListItem,
} from '../serviceCatalogListConfig'
import ListViewColumnsDrawer from '@/app/UI/ListViewColumnsDrawer'
import '@/app/styles/components/TileLayout.css'

const logger = createLogger('070 ServiceCatalogTile')

type LocalViewMode = 'list' | 'view' | 'edit' | 'create'
type UiServiceCatalog = ServiceCatalogListItem & {
  code: string
  categoryId: string | null
  billingTypeId: string | null
  unitId: string | null
  vatRateId: string | null
}

function mapRowToUi(row: ServiceCatalogRow): UiServiceCatalog {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    categoryId: row.category_id || null,
    categoryName: row.category_name || '—',
    categoryColor: row.category_color || null,
    billingTypeId: row.billing_type_id || null,
    billingTypeName: row.billing_type_name || '—',
    billingTypeColor: row.billing_type_color || null,
    unitId: row.unit_id || null,
    unitName: row.unit_name || '—',
    vatRateId: row.vat_rate_id || null,
    vatRateName: row.vat_rate_name || '—',
    basePrice: row.base_price ?? null,
    active: row.active ?? true,
    isArchived: !!row.is_archived,
  }
}

const toRow = (e: UiServiceCatalog): ListViewRow<UiServiceCatalog> => {
  const row = buildServiceCatalogListRow(e)
  return { ...row, raw: e } as ListViewRow<UiServiceCatalog>
}
const getSortValue = (e: UiServiceCatalog | undefined, key: string): string | number => getServiceCatalogSortValue(e, key)

type ServiceCatalogTileProps = {
  onRegisterCommonActions?: (actions: CommonActionId[]) => void
  onRegisterCommonActionsState?: (state: { viewMode: ViewMode; hasSelection: boolean; isDirty: boolean }) => void
  onRegisterCommonActionHandler?: (fn: ((id: CommonActionId) => void) | null) => void
}

export default function ServiceCatalogTile({
  onRegisterCommonActions,
  onRegisterCommonActionsState,
  onRegisterCommonActionHandler,
}: ServiceCatalogTileProps) {
  const { showToast } = useToast()

  const [localViewMode, setLocalViewMode] = useState<LocalViewMode>('list')
  const [data, setData] = useState<UiServiceCatalog[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [currentService, setCurrentService] = useState<ServiceCatalogFormValue | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchText, setSearchText] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  const [colPrefs, setColPrefs] = useState<Pick<ViewPrefs, 'colWidths' | 'colOrder' | 'colHidden'>>({
    colWidths: {},
    colOrder: [],
    colHidden: [],
  })
  const [sort, setSort] = useState<ListViewSortState>(SERVICE_CATALOG_DEFAULT_SORT)
  const [showColumnsDrawer, setShowColumnsDrawer] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const rows = await listServiceCatalog({
        searchText: searchText || undefined,
        includeArchived: showArchived,
      })
      setData(rows.map(mapRowToUi))
    } catch (err: any) {
      logger.error('Chyba při načítání katalogu služeb:', err)
      setError(err.message || 'Nepodařilo se načíst katalog služeb')
    } finally {
      setLoading(false)
    }
  }, [searchText, showArchived])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    async function loadPrefs() {
      const prefs = await loadViewPrefs(SERVICE_CATALOG_VIEW_KEY, {
        v: 1,
        sort: null,
        colWidths: {},
        colOrder: [],
        colHidden: [],
      })
      if (prefs) {
        setColPrefs({
          colWidths: prefs.colWidths ?? {},
          colOrder: prefs.colOrder ?? [],
          colHidden: prefs.colHidden ?? [],
        })
        if (prefs.sort?.key) {
          setSort(prefs.sort)
        }
      }
    }
    void loadPrefs()
  }, [])

  const columns = useMemo(() => applyColumnPrefs(SERVICE_CATALOG_BASE_COLUMNS, colPrefs), [colPrefs])

  const sortedData = useMemo(() => {
    const rows = data.map(toRow)
    if (!sort?.key) return rows
    const dir = sort.dir === 'desc' ? -1 : 1
    return [...rows].sort((a, b) => {
      const aVal = getSortValue(a.raw, sort.key)
      const bVal = getSortValue(b.raw, sort.key)
      if (aVal < bVal) return -1 * dir
      if (aVal > bVal) return 1 * dir
      return 0
    })
  }, [data, sort])

  const handleSortChange = useCallback((newSort: ListViewSortState) => {
    setSort(newSort)
    void saveViewPrefs(SERVICE_CATALOG_VIEW_KEY, {
      colWidths: colPrefs.colWidths ?? {},
      colOrder: colPrefs.colOrder ?? [],
      colHidden: colPrefs.colHidden ?? [],
      sort: newSort,
    })
  }, [colPrefs])

  const handleColumnResize = useCallback((key: string, px: number) => {
    setColPrefs((p) => {
      const newWidths = { ...(p.colWidths ?? {}), [key]: px }
      void saveViewPrefs(SERVICE_CATALOG_VIEW_KEY, {
        colWidths: newWidths,
        colOrder: p.colOrder ?? [],
        colHidden: p.colHidden ?? [],
        sort: sort,
      })
      return { ...p, colWidths: newWidths }
    })
  }, [sort])

  const handleRowClick = useCallback((row: ListViewRow<UiServiceCatalog>) => {
    setSelectedId(String(row.id))
  }, [])

  const handleRowDoubleClick = useCallback((row: ListViewRow<UiServiceCatalog>) => {
    setSelectedId(String(row.id))
    setLocalViewMode('view')
  }, [])

  const closeToList = useCallback(() => {
    setLocalViewMode('list')
    setSelectedId(null)
    setCurrentService(null)
  }, [])

  const handleSave = useCallback(async () => {
    if (!currentService) return

    try {
      setDetailLoading(true)
      if (localViewMode === 'create') {
        await createServiceCatalog(currentService)
        showToast('Služba vytvořena', 'success')
      } else if (localViewMode === 'edit' && selectedId) {
        await updateServiceCatalog(selectedId, currentService)
        showToast('Služba uložena', 'success')
      }
      await loadData()
      setLocalViewMode('list')
      setSelectedId(null)
      setCurrentService(null)
    } catch (err: any) {
      logger.error('Chyba při ukládání služby:', err)
      showToast(err.message || 'Nepodařilo se uložit službu', 'error')
    } finally {
      setDetailLoading(false)
    }
  }, [localViewMode, selectedId, currentService, loadData, showToast])

  useEffect(() => {
    if (!onRegisterCommonActions) return

    const actions: CommonActionId[] = []
    if (localViewMode === 'list') {
      actions.push('add')
      if (selectedId) actions.push('view', 'edit')
      actions.push('columnSettings', 'close')
    } else if (localViewMode === 'view') {
      actions.push('edit', 'close')
    } else if (localViewMode === 'edit' || localViewMode === 'create') {
      actions.push('save', 'close')
    }

    onRegisterCommonActions(actions)
  }, [localViewMode, onRegisterCommonActions, selectedId])

  useEffect(() => {
    if (!onRegisterCommonActionsState) return

    const viewMode: ViewMode = localViewMode === 'list' ? 'list' : (localViewMode as ViewMode)
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
        setCurrentService({
          code: '',
          name: '',
          active: true,
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
    return () => onRegisterCommonActionHandler(null)
  }, [onRegisterCommonActionHandler, selectedId, handleSave, closeToList])

  useEffect(() => {
    if (!selectedId || localViewMode === 'create') {
      setCurrentService(null)
      return
    }

    async function loadDetail() {
      try {
        setDetailLoading(true)
        if (!selectedId) return
        const detail = await getServiceCatalogById(selectedId)
        if (!detail) {
          setCurrentService(null)
          return
        }
        setCurrentService({
          code: detail.code ?? '',
          name: detail.name ?? '',
          category_id: detail.category_id ?? undefined,
          billing_type_id: detail.billing_type_id ?? undefined,
          unit_id: detail.unit_id ?? undefined,
          vat_rate_id: detail.vat_rate_id ?? undefined,
          base_price: detail.base_price ?? undefined,
          description: detail.description ?? undefined,
          note: detail.note ?? undefined,
          active: detail.active ?? true,
          is_archived: detail.is_archived ?? false,
        })
      } catch (err: any) {
        logger.error('Chyba při načítání detailu služby:', err)
        showToast(err.message || 'Nepodařilo se načíst detail služby', 'error')
      } finally {
        setDetailLoading(false)
      }
    }

    void loadDetail()
  }, [selectedId, localViewMode, showToast])

  if (loading) {
    return (
      <div className="tile-layout">
        <div className="tile-layout__header">
          <h1 className="tile-layout__title">📋 Katalog služeb</h1>
        </div>
        <div className="tile-layout__content">Načítání…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="tile-layout">
        <div className="tile-layout__header">
          <h1 className="tile-layout__title">📋 Katalog služeb</h1>
        </div>
        <div className="tile-layout__content">
          <div style={{ color: '#6b7280', marginBottom: '1.5rem' }}>{error}</div>
          <button onClick={loadData} className="btn btn--primary">Zkusit znovu</button>
        </div>
      </div>
    )
  }

  if (localViewMode === 'view' || localViewMode === 'edit' || localViewMode === 'create') {
    const readOnly = localViewMode === 'view'
    const serviceName = currentService?.name || 'Detail'

    return (
      <div className="tile-layout">
        <div className="tile-layout__header">
          <h1 className="tile-layout__title">
            {localViewMode === 'create' ? '➕ Nová služba' : `📋 Katalog služeb - ${serviceName}`}
          </h1>
        </div>
        <div className="tile-layout__content">
          {detailLoading && !currentService ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>Načítání...</div>
          ) : currentService ? (
            <ServiceCatalogDetailFormComponent
              service={currentService}
              readOnly={readOnly}
              onValueChange={setCurrentService}
            />
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              Nepodařilo se načíst detail služby
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="tile-layout">
      <div className="tile-layout__header">
        <h1 className="tile-layout__title">📋 Katalog služeb</h1>
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
        columns={SERVICE_CATALOG_BASE_COLUMNS}
        fixedFirstKey="category"
        requiredKeys={['name']}
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
            void saveViewPrefs(SERVICE_CATALOG_VIEW_KEY, {
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
          setSort(SERVICE_CATALOG_DEFAULT_SORT)
          void saveViewPrefs(SERVICE_CATALOG_VIEW_KEY, {
            ...resetPrefs,
            sort: SERVICE_CATALOG_DEFAULT_SORT,
          })
        }}
      />
    </div>
  )
}
