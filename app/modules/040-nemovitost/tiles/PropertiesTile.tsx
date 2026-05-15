'use client'

// FILE: app/modules/040-nemovitost/tiles/PropertiesTile.tsx
// PURPOSE: List + detail nemovitostí - stejné chování jako LandlordsTile
// URL state: t=properties-list, id + vm (detail: read/edit/create), am=1 (attachments manager)

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import ListView, { type ListViewRow, type ListViewSortState } from '@/app/UI/ListView'
import type { CommonActionId, ViewMode } from '@/app/UI/CommonActions'
import { listProperties, getPropertyDetail, type PropertiesListRow } from '@/app/lib/services/properties'
import { applyColumnPrefs, loadViewPrefs, saveViewPrefs, type ViewPrefs, type ViewPrefsSortState } from '@/app/lib/services/viewPrefs'
import PropertyDetailFrame, { type UiProperty as DetailUiProperty } from '../components/PropertyDetailFrame'
import PropertyRelationsHub from '../components/PropertyRelationsHub'
import ListViewColumnsDrawer from '@/app/UI/ListViewColumnsDrawer'
import { SkeletonTable } from '@/app/UI/SkeletonLoader'
import { useToast } from '@/app/UI/Toast'
import createLogger from '@/app/lib/logger'
import { supabase } from '@/app/lib/supabaseClient'
import { getContrastTextColor } from '@/app/lib/colorUtils'
import { formatDateTime } from '@/app/lib/formatters/formatDateTime'
import type { DetailSectionId } from '@/app/UI/DetailView'
import AttachmentsManagerTile, {
  type AttachmentsManagerApi,
  type AttachmentsManagerUiState,
} from '@/app/UI/attachments/AttachmentsManagerTile'
import { 
  getAttachmentsManagerActions, 
  mapAttachmentsViewMode, 
  getHasSelection, 
  getIsDirty,
  shouldCloseAttachmentsPanel 
} from '@/app/lib/attachments/attachmentsManagerUtils'
import { PROPERTIES_BASE_COLUMNS } from '../propertiesColumns'

import '@/app/styles/components/TileLayout.css'

const logger = createLogger('040 PropertiesTile')

const VIEW_KEY = '040.properties.list'

type LocalViewMode = ViewMode | 'list' | 'attachments-manager' | 'relations'

// Export pro znovupoužití v EntityHub a ContractWizard
const BASE_COLUMNS = PROPERTIES_BASE_COLUMNS

type UiProperty = {
  id: string
  displayName: string
  internalCode: string | null
  propertyTypeId: string | null
  propertyTypeName: string
  propertyTypeIcon: string | null
  propertyTypeColor: string | null
  propertyTypeOrderIndex: number | null
  landlordName: string | null
  fullAddress: string
  street: string | null
  houseNumber: string | null
  city: string | null
  zip: string | null
  country: string | null
  region: string | null
  landArea: number | null
  builtUpArea: number | null
  buildingArea: number | null
  numberOfFloors: number | null
  floorsAboveGround: number | null
  floorsBelowGround: number | null
  buildYear: number | null
  reconstructionYear: number | null
  cadastralArea: string | null
  parcelNumber: string | null
  lvNumber: string | null
  unitsCount: number
  isArchived: boolean
  createdAt: string | null
}

// Export pro znovupoužití v EntityHub a ContractWizard
export function mapPropertyRowToUi(row: PropertiesListRow): UiProperty {
  const addressParts = [
    [row.street, row.house_number].filter(Boolean).join(' '),
    row.city,
    row.zip,
  ].filter(Boolean)
  
  return {
    id: row.id,
    displayName: row.display_name || '—',
    internalCode: row.internal_code || null,
    propertyTypeId: row.property_type_id || null,
    propertyTypeName: row.property_type_name || '—',
    propertyTypeIcon: row.property_type_icon || null,
    propertyTypeColor: row.property_type_color || null,
    propertyTypeOrderIndex: row.property_type_order_index ?? null,
    landlordName: row.landlord_name || '—',
    fullAddress: addressParts.join(', ') || '—',
    street: row.street || null,
    houseNumber: row.house_number || null,
    city: row.city || null,
    zip: row.zip || null,
    country: row.country || null,
    region: row.region || null,
    landArea: row.land_area ?? null,
    builtUpArea: row.built_up_area ?? null,
    buildingArea: row.building_area,
    numberOfFloors: row.number_of_floors ?? null,
    floorsAboveGround: row.floors_above_ground ?? null,
    floorsBelowGround: row.floors_below_ground ?? null,
    buildYear: row.build_year ?? null,
    reconstructionYear: row.reconstruction_year ?? null,
    cadastralArea: row.cadastral_area ?? null,
    parcelNumber: row.parcel_number ?? null,
    lvNumber: row.lv_number ?? null,
    unitsCount: row.units_count || 0,
    isArchived: !!row.is_archived,
    createdAt: row.created_at ?? null,
  }
}

// Local alias for internal use
const mapRowToUi = mapPropertyRowToUi

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
      internalCode: p.internalCode || '—',
      fullAddress: p.fullAddress,
      street: p.street || '—',
      houseNumber: p.houseNumber || '—',
      city: p.city || '—',
      zip: p.zip || '—',
      country: p.country || '—',
      region: p.region || '—',
      landlordName: p.landlordName,
      landArea: p.landArea !== null && p.landArea !== undefined ? `${p.landArea}` : '—',
      builtUpArea: p.builtUpArea !== null && p.builtUpArea !== undefined ? `${p.builtUpArea}` : '—',
      buildingArea: p.buildingArea ? `${p.buildingArea.toFixed(2)} m²` : '—',
      numberOfFloors: p.numberOfFloors !== null && p.numberOfFloors !== undefined ? `${p.numberOfFloors}` : '—',
      floorsAboveGround: p.floorsAboveGround !== null && p.floorsAboveGround !== undefined ? `${p.floorsAboveGround}` : '—',
      floorsBelowGround: p.floorsBelowGround !== null && p.floorsBelowGround !== undefined ? `${p.floorsBelowGround}` : '—',
      buildYear: p.buildYear !== null && p.buildYear !== undefined ? `${p.buildYear}` : '—',
      reconstructionYear: p.reconstructionYear !== null && p.reconstructionYear !== undefined ? `${p.reconstructionYear}` : '—',
      cadastralArea: p.cadastralArea || '—',
      parcelNumber: p.parcelNumber || '—',
      lvNumber: p.lvNumber || '—',
      unitsCount: p.unitsCount.toString(),
      createdAt: p.createdAt ? formatDateTime(p.createdAt) : '—',
      isArchived: p.isArchived ? 'Ano' : 'Ne',
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
    case 'internalCode':
      return norm(p.internalCode)
    case 'fullAddress':
      return norm(p.fullAddress)
    case 'street':
      return norm(p.street)
    case 'houseNumber':
      return norm(p.houseNumber)
    case 'city':
      return norm(p.city)
    case 'zip':
      return norm(p.zip)
    case 'country':
      return norm(p.country)
    case 'region':
      return norm(p.region)
    case 'landlordName':
      return norm(p.landlordName)
    case 'landArea':
      return p.landArea ?? 0
    case 'builtUpArea':
      return p.builtUpArea ?? 0
    case 'buildingArea':
      return p.buildingArea ?? 0
    case 'numberOfFloors':
      return p.numberOfFloors ?? 0
    case 'floorsAboveGround':
      return p.floorsAboveGround ?? 0
    case 'floorsBelowGround':
      return p.floorsBelowGround ?? 0
    case 'buildYear':
      return p.buildYear ?? 0
    case 'reconstructionYear':
      return p.reconstructionYear ?? 0
    case 'cadastralArea':
      return norm(p.cadastralArea)
    case 'parcelNumber':
      return norm(p.parcelNumber)
    case 'lvNumber':
      return norm(p.lvNumber)
    case 'unitsCount':
      return p.unitsCount
    case 'createdAt':
      return p.createdAt ? new Date(p.createdAt).getTime() : 0
    case 'isArchived':
      return p.isArchived ? 1 : 0
    default:
      return ''
  }
}

type PropertiesTileProps = {
  propertyTypeCode?: string | null
  onRegisterCommonActions?: (actions: CommonActionId[]) => void
  onRegisterCommonActionsState?: (state: { viewMode: ViewMode; hasSelection: boolean; isDirty: boolean }) => void
  onRegisterCommonActionHandler?: (fn: ((id: CommonActionId) => void) | null) => void
  onNavigate?: (tileId: string) => void
}

export default function PropertiesTile({
  propertyTypeCode,
  onRegisterCommonActions,
  onRegisterCommonActionsState,
  onRegisterCommonActionHandler,
  onNavigate,
}: PropertiesTileProps): JSX.Element {
  console.log('🎨 PropertiesTile: Rendering with propertyTypeCode:', propertyTypeCode)
  const toast = useToast()
  const router = useRouter()

  const [properties, setProperties] = useState<UiProperty[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')
  
  const [showArchived, setShowArchived] = useState(false)
  const [propertyTypeId, setPropertyTypeId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  
  // Property types pro mapování code -> name
  const [propertyTypes, setPropertyTypes] = useState<Array<{ id: string; code: string; name: string; icon: string | null; color: string | null }>>([])

  // Column preferences (order, hidden, widths)
  const [colPrefs, setColPrefs] = useState<Pick<ViewPrefs, 'colWidths' | 'colOrder' | 'colHidden'>>({
    colWidths: {},
    colOrder: [],
    colHidden: [],
  })
  const columns = useMemo(() => {
    return applyColumnPrefs(BASE_COLUMNS, colPrefs)
  }, [colPrefs])

  const [colsOpen, setColsOpen] = useState(false)

  // Sort state with default
  const DEFAULT_SORT: ViewPrefsSortState = { key: 'propertyTypeName', dir: 'asc' }
  const [sort, setSort] = useState<ViewPrefsSortState>(DEFAULT_SORT)

  // Detail state
  const [viewMode, setViewMode] = useState<LocalViewMode>('list')
  const [detailProperty, setDetailProperty] = useState<DetailUiProperty | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [detailInitialSectionId, setDetailInitialSectionId] = useState<DetailSectionId>('detail')
  const submitRef = useRef<(() => Promise<DetailUiProperty | null>) | null>(null)

  const [relationsPropertyId, setRelationsPropertyId] = useState<string | null>(null)

  // ✅ Attachments manager: API ref a UI state
  const [attachmentsManagerPropertyId, setAttachmentsManagerPropertyId] = useState<string | null>(null)
  const attachmentsManagerApiRef = useRef<AttachmentsManagerApi | null>(null)
  const [attachmentsManagerUi, setAttachmentsManagerUi] = useState<AttachmentsManagerUiState>({
    mode: 'list',
    hasSelection: false,
    isDirty: false,
  })

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

  // ✅ Načíst column preferences a sort z DB při mountu
  useEffect(() => {
    async function loadPrefs() {
      const prefs = await loadViewPrefs(VIEW_KEY, {
        colWidths: {},
        colOrder: [],
        colHidden: [],
        sort: DEFAULT_SORT,
      })
      if (prefs) {
        setColPrefs((prev) => {
          const p: ViewPrefs = {
            ...prev,
            colWidths: prefs.colWidths || {},
            colOrder: prefs.colOrder || [],
            colHidden: prefs.colHidden || [],
          }
          return p
        })
        if (prefs.sort) {
          setSort(prefs.sort)
        }
      }
    }
    void loadPrefs()
  }, [])

  // ✅ Uložit column preferences + sort do DB při změně
  useEffect(() => {
    async function persist() {
      await saveViewPrefs(VIEW_KEY, {
        colWidths: colPrefs.colWidths ?? {},
        colOrder: colPrefs.colOrder ?? [],
        colHidden: colPrefs.colHidden ?? [],
        sort,
      })
    }
    void persist()
  }, [sort, DEFAULT_SORT, colPrefs])

  // Register common actions
  useEffect(() => {
    if (!onRegisterCommonActions || !onRegisterCommonActionsState) return
    
    const actions: CommonActionId[] = []
    
    // ATTACHMENTS MANAGER MODE
    if (viewMode === 'attachments-manager') {
      const mode = attachmentsManagerUi.mode ?? 'list'
      actions.push(...getAttachmentsManagerActions(mode, !!attachmentsManagerUi.hasSelection))
    }
    // LIST MODE
    else if (viewMode === 'list') {
      actions.push('add')
      if (selectedId) {
        actions.push('view', 'edit', 'relations', 'attachments')
      }
      actions.push('close')
    }
    // EDIT / CREATE MODE
    else if (viewMode === 'edit' || viewMode === 'create') {
      if (viewMode === 'edit') {
        actions.push('save', 'relations', 'attachments', 'close')
      } else {
        actions.push('save', 'close')
      }
    }
    // READ MODE
    else if (viewMode === 'read') {
      actions.push('edit', 'relations', 'attachments', 'close')
    }
    // RELATIONS MODE
    else if (viewMode === 'relations') {
      actions.push('close')
    }

    onRegisterCommonActions(actions)
    
    // Namapovat LocalViewMode na ViewMode pomocí utility funkce
    const mappedViewMode = mapAttachmentsViewMode(viewMode as any, attachmentsManagerUi.mode ?? 'list')
    const mappedHasSelection = getHasSelection(viewMode as any, selectedId, attachmentsManagerUi)
    const mappedIsDirty = getIsDirty(viewMode as any, isDirty, attachmentsManagerUi)
    
    const relationsView = viewMode === 'relations'

    onRegisterCommonActionsState({
      viewMode: relationsView ? 'read' : mappedViewMode,
      hasSelection: relationsView ? true : mappedHasSelection,
      isDirty: relationsView ? false : mappedIsDirty,
    })
  }, [viewMode, selectedId, isDirty, attachmentsManagerUi.mode, attachmentsManagerUi.hasSelection, attachmentsManagerUi.isDirty])
  // POZNÁMKA: onRegisterCommonActions a onRegisterCommonActionsState NEJSOU v dependencies!
  // Jsou stabilní (useCallback v AppShell), ale jejich přidání do dependencies způsobuje problémy.

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
      // RELATIONS MODE
      if (viewMode === 'relations') {
        if (id === 'close') {
          const backId = relationsPropertyId ?? detailProperty?.id ?? selectedId
          if (!backId) {
            closeToList()
            return
          }

          const listBackProperty = properties.find((p) => p.id === backId)
          if (listBackProperty) {
            void openDetail(listBackProperty, 'read', 'detail')
          } else {
            closeToList()
          }
          return
        }
      }

      // ATTACHMENTS MANAGER ACTIONS
      if (viewMode === 'attachments-manager') {
        // Close v attachments-manager má speciální chování
        if (id === 'close') {
          const mode = attachmentsManagerUi.mode ?? 'list'
          const dirtyNow = !!attachmentsManagerUi.isDirty
          
          if (dirtyNow) {
            const ok = confirm('Máš neuložené změny. Opravdu chceš zavřít?')
            if (!ok) return
          }
          
          // Použij utility funkci pro zjištění, jestli zavřít jen panel nebo celý manager
          if (shouldCloseAttachmentsPanel(mode)) {
            const api = attachmentsManagerApiRef.current
            if (api?.close) {
              api.close()
            }
            return
          }
          
          // Pokud jsme v list mode, vrátit se zpět do detailu entity
          const backId = attachmentsManagerPropertyId ?? detailProperty?.id ?? null
          if (!backId) {
            closeToList()
            return
          }
          
          setDetailInitialSectionId('attachments')
          
          const backProperty = properties.find((p) => p.id === backId)
          if (backProperty) {
            void openDetail(backProperty, 'read', 'attachments')
          } else {
            closeToList()
          }
          return
        }
        
        // Ostatní akce přes API
        const api = attachmentsManagerApiRef.current
        if (!api) return
        
        if (id === 'add') {
          api.add()
          return
        }
        if (id === 'view') {
          api.view()
          return
        }
        if (id === 'edit') {
          api.edit()
          return
        }
        if (id === 'save') {
          await api.save()
          return
        }
        if (id === 'attachmentsNewVersion') {
          api.newVersion()
          return
        }
      }

      // CLOSE (pro ostatní režimy)
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

      // RELATIONS open
      if (id === 'relations') {
        if (viewMode === 'edit' && isDirty) {
          toast.showWarning('Máš neuložené změny. Nejdřív ulož nebo zavři změny a pak otevři vazby.')
          return
        }
        const targetId = selectedId ?? detailProperty?.id ?? null
        if (!targetId) return
        setRelationsPropertyId(targetId)
        setSelectedId(targetId)
        setViewMode('relations')
        return
      }

      // COLUMN SETTINGS

      // ATTACHMENTS open manager
      if (id === 'attachments') {
        if (viewMode === 'list') {
          if (!selectedId) {
            toast.showWarning('Nejdřív vyber nemovitost v seznamu.')
            return
          }
          setAttachmentsManagerPropertyId(selectedId)
          setViewMode('attachments-manager')
          setIsDirty(false)
          return
        }

        // READ / EDIT mode
        if (viewMode === 'read' || viewMode === 'edit') {
          if (isDirty) {
            toast.showWarning('Máš neuložené změny. Nejdřív ulož nebo zavři změny a pak otevři správu příloh.')
            return
          }
          if (!detailProperty?.id || !detailProperty.id.trim() || detailProperty.id === 'new') {
            toast.showWarning('Nejdřív ulož záznam, aby šly spravovat přílohy.')
            return
          }

          setAttachmentsManagerPropertyId(detailProperty.id)
          setViewMode('attachments-manager')
          setIsDirty(false)
          return
        }
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

        // attachments v create/edit režimu
        // NOTE: Type assertion needed due to Vercel cache issue with CommonActionId type
        if ((id as string) === 'attachments') {
          if (isDirty) {
            toast.showWarning('Máš neuložené změny. Nejdřív ulož nebo zavři změny a pak otevři správu příloh.')
            return
          }
          if (!detailProperty?.id || !detailProperty.id.trim() || detailProperty.id === 'new') {
            toast.showWarning('Nejdřív ulož záznam, aby šly spravovat přílohy.')
            return
          }

          setAttachmentsManagerPropertyId(detailProperty.id)
          setViewMode('attachments-manager')
          setIsDirty(false)
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

        // attachments už je zpracován výše v ATTACHMENTS open manager bloku
        return
      }
    })
  }, [viewMode, selectedId, isDirty])
  // POZNÁMKA: onRegisterCommonActionHandler, properties, openDetail, loadData, closeListToModule,
  // closeToList, detailProperty, toast NEJSOU v dependencies!
  // Jsou stabilní funkce nebo způsobují nekonečnou smyčku re-renderů.

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

  // Column resize handler
  const handleColumnResize = useCallback((key: string, px: number) => {
    setColPrefs((p) => ({ ...p, colWidths: { ...(p.colWidths ?? {}), [key]: px } }))
  }, [])

  // Filter, sort, map rows
  const rows = useMemo(() => {
    const norm = (v: any) => String(v ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const q = norm(searchText)

    let filtered = properties.slice()

    if (q) {
      filtered = filtered.filter((p) => {
        return (
          norm(p.displayName).includes(q) ||
          norm(p.fullAddress).includes(q) ||
          norm(p.landlordName).includes(q) ||
          norm(p.propertyTypeName).includes(q)
        )
      })
    }

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
  }, [properties, sort, searchText])

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
              filterValue={searchText}
              onFilterChange={setSearchText}
              showArchived={showArchived}
              onShowArchivedChange={setShowArchived}
              onColumnSettings={() => setColsOpen(true)}
              selectedId={selectedId ?? null}
              onRowClick={handleRowClick}
              onRowDoubleClick={handleRowDoubleClick}
              sort={sort}
              onSortChange={handleSortChange}
              onColumnResize={handleColumnResize}
            />
          )}
        </div>

        <ListViewColumnsDrawer
          open={colsOpen}
          onClose={() => setColsOpen(false)}
          columns={BASE_COLUMNS}
          fixedFirstKey="propertyTypeName"
          requiredKeys={['displayName']}
          value={{
            order: colPrefs.colOrder ?? [],
            hidden: colPrefs.colHidden ?? [],
          }}
          sortBy={sort ?? undefined}
          onChange={(next) => {
            setColPrefs((p) => ({
              ...p,
              colOrder: next.order,
              colHidden: next.hidden,
            }))
          }}
          onSortChange={(newSort) => setSort(newSort)}
          onReset={() => {
            setColPrefs((p) => ({
              ...p,
              colOrder: [],
              colHidden: [],
            }))
            setSort(DEFAULT_SORT)
          }}
        />
      </div>
    )
  }

  // RELATIONS VIEW
  if (viewMode === 'relations' && relationsPropertyId) {
    const property = properties.find((p) => p.id === relationsPropertyId) ?? detailProperty
    const label = property?.displayName || 'Nemovitost'

    return <PropertyRelationsHub propertyId={relationsPropertyId} propertyLabel={label} />
  }

  // ATTACHMENTS MANAGER VIEW
  if (viewMode === 'attachments-manager' && attachmentsManagerPropertyId) {
    const property = properties.find((p) => p.id === attachmentsManagerPropertyId) ?? detailProperty
    const label = property?.displayName || 'Nemovitost'
    
    return (
      <AttachmentsManagerTile
        entityType="properties"
        entityId={attachmentsManagerPropertyId}
        entityLabel={label}
        onRegisterManagerApi={(api) => {
          attachmentsManagerApiRef.current = api
        }}
        onManagerStateChange={(state) => {
          setAttachmentsManagerUi(state)
        }}
      />
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
