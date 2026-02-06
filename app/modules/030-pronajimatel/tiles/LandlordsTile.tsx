'use client'

// FILE: app/modules/030-pronajimatel/tiles/LandlordsTile.tsx
// PURPOSE: List + detail pronajímatelů (030) - stejné chování jako UsersTile
// URL state:
// - t=landlords-list (list + detail)
// - id + vm (detail: read/edit/create)

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import ListView, { type ListViewColumn, type ListViewRow, type ListViewSortState } from '@/app/UI/ListView'
import type { CommonActionId, ViewMode } from '@/app/UI/CommonActions'
import LandlordDetailFrame, { type UiLandlord as DetailUiLandlord } from '../forms/LandlordDetailFrame'
import LandlordRelationsHub from '../components/LandlordRelationsHub'
import AttachmentsManagerTile, {
  type AttachmentsManagerApi,
  type AttachmentsManagerUiState,
} from '@/app/UI/attachments/AttachmentsManagerTile'
import { listLandlords, getLandlordDetail, type LandlordsListRow } from '@/app/lib/services/landlords'
import { applyColumnPrefs, loadViewPrefs, saveViewPrefs, type ViewPrefs, type ViewPrefsSortState } from '@/app/lib/services/viewPrefs'
import ListViewColumnsDrawer from '@/app/UI/ListViewColumnsDrawer'
import { SkeletonTable } from '@/app/UI/SkeletonLoader'
import { useToast } from '@/app/UI/Toast'
import createLogger from '@/app/lib/logger'
import { fetchSubjectTypes, type SubjectType } from '@/app/modules/900-nastaveni/services/subjectTypes'
import { getIcon, type IconKey } from '@/app/UI/icons'
import { 
  getAttachmentsManagerActions, 
  mapAttachmentsViewMode, 
  getHasSelection, 
  getIsDirty,
  shouldCloseAttachmentsPanel 
} from '@/app/lib/attachments/attachmentsManagerUtils'

import '@/app/styles/components/TileLayout.css'
import '@/app/styles/components/PaletteCard.css'

const logger = createLogger('030 LandlordsTile')

type LandlordsTileProps = {
  subjectTypeFilter?: string | null // Přednastavený filtr podle typu subjektu
  onRegisterCommonActions?: (actions: CommonActionId[]) => void
  onRegisterCommonActionsState?: (state: { viewMode: ViewMode; hasSelection: boolean; isDirty: boolean }) => void
  onRegisterCommonActionHandler?: (fn: ((id: CommonActionId) => void) | null) => void
  onNavigate?: (tileId: string) => void // Callback pro navigaci na jiný tile
}

type LocalViewMode = ViewMode | 'list' | 'attachments-manager' | 'relations'

const VIEW_KEY = '030.landlords.list'

// Export pro znovupoužití v EntityHub a ContractWizard
export const LANDLORDS_BASE_COLUMNS: ListViewColumn[] = [
  { key: 'subjectTypeLabel', label: 'Typ pronajimatele', width: 160, sortable: true },
  { key: 'displayName', label: 'Zobrazované jméno', width: 220, sortable: true },
  { key: 'fullAddress', label: 'Adresa', width: 300, sortable: true },
  { key: 'email', label: 'E-mail', width: 260, sortable: true },
  { key: 'phone', label: 'Telefon', width: 180, sortable: true },
  { key: 'companyName', label: 'Název společnosti', width: 220, sortable: true },
  { key: 'ic', label: 'IČ', width: 120, sortable: true },
  { key: 'firstName', label: 'Jméno', width: 160, sortable: true },
  { key: 'lastName', label: 'Příjmení', width: 180, sortable: true },
  { key: 'isArchived', label: 'Archivován', width: 120, align: 'center', sortable: true },
]

const BASE_COLUMNS = LANDLORDS_BASE_COLUMNS

// Export pro znovupoužití v EntityHub a ContractWizard
export function mapLandlordRowToUi(row: LandlordsListRow, subjectTypeMap: Record<string, SubjectType>): UiLandlord {
  const subjectTypeMeta = subjectTypeMap[row.subject_type ?? '']
  
  // Složit adresu ve formátu: "Ulice ČísloPopisné, PSČ Město, Stát"
  const streetPart = [row.street, row.house_number].filter(Boolean).join(' ')
  const cityPart = [row.zip, row.city].filter(Boolean).join(' ')
  const countryName = row.country === 'CZ' ? 'Česká republika' : 
                     row.country === 'SK' ? 'Slovensko' :
                     row.country === 'PL' ? 'Polsko' :
                     row.country === 'DE' ? 'Německo' :
                     row.country === 'AT' ? 'Rakousko' :
                     row.country || ''
  const fullAddress = [streetPart, cityPart, countryName].filter(Boolean).join(', ')
  
  return {
    id: row.id,
    subjectType: row.subject_type ?? '',
    displayName: row.display_name ?? '',
    email: row.email ?? '',
    phone: row.phone ?? null,
    createdAt: row.created_at ?? '',
    isArchived: !!row.is_archived,

    titleBefore: row.title_before ?? null,
    firstName: row.first_name ?? null,
    lastName: row.last_name ?? null,

    companyName: row.company_name ?? null,
    ic: row.ic ?? null,
    dic: row.dic ?? null,
    
    // Adresa
    fullAddress: fullAddress || null,

    // Metadata z subject_types
    subjectTypeLabel: subjectTypeMeta?.name || row.subject_type_name || row.subject_type || '—',
    subjectTypeColor: subjectTypeMeta?.color || row.subject_type_color || null,
    subjectTypeOrderIndex: subjectTypeMeta?.sort_order ?? row.subject_type_sort_order ?? null,
  }
}

// Local alias for internal use
function mapRowToUi(row: LandlordsListRow, subjectTypeMap: Record<string, SubjectType>): UiLandlord {
  return mapLandlordRowToUi(row, subjectTypeMap)
}

function toRow(l: UiLandlord): ListViewRow<UiLandlord> {
  return {
    id: l.id,
    data: {
      subjectTypeLabel: l.subjectTypeColor ? (
        <span className="generic-type__name-badge" style={{ backgroundColor: l.subjectTypeColor }}>
          {l.subjectTypeLabel || '—'}
        </span>
      ) : (
        <span className="generic-type__name-main">{l.subjectTypeLabel || '—'}</span>
      ),
      displayName: l.displayName || '—',
      fullAddress: l.fullAddress ?? '—',
      email: l.email ?? '—',
      phone: l.phone ?? '—',
      companyName: l.companyName ?? '—',
      ic: l.ic ?? '—',
      firstName: l.firstName ?? '—',
      lastName: l.lastName ?? '—',
      isArchived: l.isArchived ? 'Ano' : 'Ne',
    },
    raw: l,
  }
}

function normalizeString(v: any): string {
  return String(v ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function numberOrZero(v: any): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

function getSortValue(l: UiLandlord, key: string): string | number {
  const norm = (v: any) => String(v ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  switch (key) {
    case 'subjectTypeLabel':
      return l.subjectTypeOrderIndex ?? 999999
    case 'displayName':
      return norm(l.displayName)
    case 'fullAddress':
      return norm(l.fullAddress)
    case 'email':
      return norm(l.email)
    case 'phone':
      return norm(l.phone)
    case 'companyName':
      return norm(l.companyName)
    case 'ic':
      return norm(l.ic)
    case 'firstName':
      return norm(l.firstName)
    case 'lastName':
      return norm(l.lastName)
    case 'isArchived':
      return l.isArchived ? 1 : 0
    default:
      return ''
  }
}

type UiLandlord = {
  id: string
  displayName: string
  email: string | null
  phone: string | null
  subjectType: string | null
  isArchived: boolean | null
  createdAt: string

  // Person fields
  titleBefore?: string | null
  firstName?: string | null
  lastName?: string | null

  // Company fields
  companyName?: string | null
  ic?: string | null
  dic?: string | null
  
  // Address
  fullAddress?: string | null

  // Metadata z subject_types
  subjectTypeLabel: string
  subjectTypeColor: string | null
  subjectTypeOrderIndex: number | null
}

export default function LandlordsTile({
  subjectTypeFilter: propSubjectTypeFilter,
  onRegisterCommonActions,
  onRegisterCommonActionsState,
  onRegisterCommonActionHandler,
  onNavigate,
}: LandlordsTileProps) {
  const toast = useToast()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchKey = searchParams?.toString() ?? ''

  const [landlords, setLandlords] = useState<UiLandlord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [filterInput, setFilterInput] = useState('') // Okamžitá hodnota z inputu
  const [filterText, setFilterText] = useState('') // Debounced hodnota pro vyhledávání
  
  // Debounce pro filterText (500ms zpoždění)
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilterText(filterInput)
    }, 500)
    
    return () => clearTimeout(timer)
  }, [filterInput])
  
  // Vypočítat subjectTypeFilter přímo z props/URL bez state (spolehlivější)
  const subjectTypeFilter = useMemo(() => {
    // 1. Priorita: propSubjectTypeFilter (když je použit přes LandlordTypeTile)
    if (propSubjectTypeFilter) return propSubjectTypeFilter
    
    // 2. Jinak extrahovat z URL parametru 't'
    const tileId = searchParams?.get('t') || null
    if (tileId?.startsWith('landlords-type-')) {
      return tileId.replace('landlords-type-', '')
    }
    
    return null
  }, [propSubjectTypeFilter, searchParams])
  
  const [showArchived, setShowArchived] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [viewMode, setViewMode] = useState<LocalViewMode>('list')
  const [detailLandlord, setDetailLandlord] = useState<DetailUiLandlord | null>(null)
  const [relationsLandlordId, setRelationsLandlordId] = useState<string | null>(null)

  const [detailInitialSectionId, setDetailInitialSectionId] = useState<any>('detail')

  const [isDirty, setIsDirty] = useState(false)

  const submitRef = useRef<null | (() => Promise<DetailUiLandlord | null>)>(null)

  // ✅ Attachments manager: API ref a UI state
  const [attachmentsManagerLandlordId, setAttachmentsManagerLandlordId] = useState<string | null>(null)
  const attachmentsManagerApiRef = useRef<AttachmentsManagerApi | null>(null)
  const [attachmentsManagerUi, setAttachmentsManagerUi] = useState<AttachmentsManagerUiState>({
    mode: 'list',
    hasSelection: false,
    isDirty: false,
  })

  const [subjectTypes, setSubjectTypes] = useState<SubjectType[]>([])
  
  const subjectTypeMap = useMemo(() => {
    const map: Record<string, SubjectType> = {}
    for (const type of subjectTypes) {
      map[type.code] = type
    }
    return map
  }, [subjectTypes])
  const subjectTypeMapRef = useRef<Record<string, SubjectType>>({})

  // State pro výběr typu subjektu při create režimu
  const [selectedSubjectTypeForCreate, setSelectedSubjectTypeForCreate] = useState<string | null>(null)

  const DEFAULT_SORT: ListViewSortState = useMemo(() => ({ key: 'subjectTypeLabel', dir: 'asc' }), [])
  const [sort, setSort] = useState<ListViewSortState>(DEFAULT_SORT)

  const [colPrefs, setColPrefs] = useState<Pick<ViewPrefs, 'colWidths' | 'colOrder' | 'colHidden'>>({
    colWidths: {},
    colOrder: [],
    colHidden: [],
  })

  const columns = useMemo(() => {
    return applyColumnPrefs(BASE_COLUMNS, colPrefs)
  }, [colPrefs])

  const [colsOpen, setColsOpen] = useState(false)

  const fixedFirstKey = 'subjectTypeLabel'
  const requiredKeys = ['email']

  const prefsLoadedRef = useRef(false)
  const saveTimerRef = useRef<any>(null)

  useEffect(() => {
    setColPrefs((prev) => {
      const order = Array.isArray(prev.colOrder) ? prev.colOrder : []
      const hidden = Array.isArray(prev.colHidden) ? prev.colHidden : []

      const nextOrder = [fixedFirstKey, ...order.filter((k) => k && k !== fixedFirstKey)]
      const nextHidden = hidden.filter((k) => k !== fixedFirstKey)

      const changed = nextOrder.join('|') !== order.join('|') || nextHidden.join('|') !== hidden.join('|')
      if (!changed) return prev

      return {
        ...prev,
        colOrder: nextOrder,
        colHidden: nextHidden,
      }
    })
  }, [])

  useEffect(() => {
    void (async () => {
      const prefs = await loadViewPrefs(VIEW_KEY, { v: 1, sort: null, colWidths: {}, colOrder: [], colHidden: [] })

      const loadedSort = (prefs.sort as ViewPrefsSortState) ?? null
      setSort(loadedSort ? loadedSort : DEFAULT_SORT)

      setColPrefs({
        colWidths: prefs.colWidths ?? {},
        colOrder: prefs.colOrder ?? [],
        colHidden: prefs.colHidden ?? [],
      })

      prefsLoadedRef.current = true
    })()
  }, [DEFAULT_SORT])

  useEffect(() => {
    if (!prefsLoadedRef.current) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    if (!sort) return

    const persistSort: ViewPrefsSortState =
      sort.key === DEFAULT_SORT.key && sort.dir === DEFAULT_SORT.dir ? null : (sort as ViewPrefsSortState)

    const payload: ViewPrefs = {
      v: 1,
      sort: persistSort,
      colWidths: colPrefs.colWidths ?? {},
      colOrder: colPrefs.colOrder ?? [],
      colHidden: colPrefs.colHidden ?? [],
    }

    saveTimerRef.current = setTimeout(() => {
      void saveViewPrefs(VIEW_KEY, payload)
    }, 500)
  }, [sort, DEFAULT_SORT, colPrefs])

  const setUrl = useCallback(
    (
      next: { t?: string | null; id?: string | null; vm?: string | null; type?: string | null; fromUserId?: string | null },
      mode: 'replace' | 'push' = 'replace'
    ) => {
      const sp = new URLSearchParams(searchKey)

      const setOrDelete = (key: string, val: string | null | undefined) => {
        const v = (val ?? '').toString().trim()
        if (v) sp.set(key, v)
        else sp.delete(key)
      }

      if (Object.prototype.hasOwnProperty.call(next, 't')) setOrDelete('t', next.t)
      if (Object.prototype.hasOwnProperty.call(next, 'id')) setOrDelete('id', next.id)
      if (Object.prototype.hasOwnProperty.call(next, 'vm')) setOrDelete('vm', next.vm)
      if (Object.prototype.hasOwnProperty.call(next, 'type')) setOrDelete('type', next.type)
      if (Object.prototype.hasOwnProperty.call(next, 'fromUserId')) setOrDelete('fromUserId', next.fromUserId)

      const qs = sp.toString()
      const nextUrl = qs ? `${pathname}?${qs}` : pathname
      const currentUrl = searchKey ? `${pathname}?${searchKey}` : pathname

      logger.debug('setUrl()', { mode, next, searchKey, currentUrl, nextUrl, willNavigate: nextUrl !== currentUrl })

      if (nextUrl === currentUrl) return

      if (mode === 'push') router.push(nextUrl)
      else router.replace(nextUrl)
    },
    [pathname, router, searchKey]
  )

  const loadInFlightRef = useRef<Promise<void> | null>(null)
  const lastLoadKeyRef = useRef<string>('')

  const load = useCallback(async () => {
    const key = `${(filterText ?? '').trim().toLowerCase()}|${subjectTypeFilter ?? ''}|${showArchived ? '1' : '0'}`

    if (loadInFlightRef.current && lastLoadKeyRef.current === key) return loadInFlightRef.current
    lastLoadKeyRef.current = key

    const p = (async () => {
      setLoading(true)
      setError(null)
      try {
        const rows = await listLandlords({ searchText: filterText, subjectType: subjectTypeFilter, includeArchived: showArchived })
        setLandlords(rows.map((r) => mapRowToUi(r, subjectTypeMapRef.current)))
      } catch (e: any) {
        logger.error('listLandlords failed', e)
        setError(e?.message ?? 'Chyba načtení pronajímatelů')
      } finally {
        setLoading(false)
      }
    })()

    loadInFlightRef.current = p
    try {
      await p
    } finally {
      if (loadInFlightRef.current === p) loadInFlightRef.current = null
    }
  }, [filterText, subjectTypeFilter, showArchived])

  const subjectTypesInFlightRef = useRef<Promise<void> | null>(null)
  const loadSubjectTypes = useCallback(async () => {
    if (subjectTypesInFlightRef.current) return subjectTypesInFlightRef.current
    const p = (async () => {
      try {
        const rows = await fetchSubjectTypes()
        setSubjectTypes(rows)
        const map: Record<string, SubjectType> = {}
        for (const type of rows) {
          map[type.code] = type
        }
        subjectTypeMapRef.current = map
      } catch (e) {
        logger.warn('fetchSubjectTypes failed', e)
      }
    })()
    subjectTypesInFlightRef.current = p
    try {
      await p
    } finally {
      if (subjectTypesInFlightRef.current === p) subjectTypesInFlightRef.current = null
    }
  }, [])

  useEffect(() => {
    void loadSubjectTypes()
  }, [loadSubjectTypes])

  useEffect(() => {
    void load()
  }, [load])

  // ✅ když se načtou subjectTypes (barvy + order), přepočítej již načtené landlords
  useEffect(() => {
    if (!subjectTypeMap || Object.keys(subjectTypeMap).length === 0) return

    setLandlords((prev) => {
      if (!prev?.length) return prev

      return prev.map((l) => {
        const meta = subjectTypeMap[l.subjectType ?? '']
        return {
          ...l,
          subjectTypeLabel: meta?.name || l.subjectType || '—',
          subjectTypeColor: meta?.color || null,
          subjectTypeOrderIndex: meta?.sort_order ?? null,
        }
      })
    })
  }, [subjectTypeMap])

  useEffect(() => {
    const id = searchParams?.get('id') ?? null
    const vm = (searchParams?.get('vm') ?? 'list') as LocalViewMode

    setSelectedId(id)
    setViewMode(id ? vm : 'list')
    if (vm === 'relations') {
      setRelationsLandlordId(id)
    }

    // Pokud je id a nejde o list mode, najdi pronajimatele v seznamu a otevři detail
    if (id && vm !== 'list') {
      const landlord = landlords.find((l) => l.id === id)
      if (landlord) {
        // Načíst detail z databáze - LandlordDetailFrame to udělá sám
        const detailUi: DetailUiLandlord = {
          id: landlord.id,
          displayName: landlord.displayName ?? '',
          email: landlord.email ?? null,
          phone: landlord.phone ?? null,
          subjectType: landlord.subjectType ?? null,
          isArchived: landlord.isArchived ?? false,
          createdAt: landlord.createdAt ?? '',
          titleBefore: landlord.titleBefore ?? null,
          firstName: landlord.firstName ?? null,
          lastName: landlord.lastName ?? null,
          note: null,
          birthDate: null,
          personalIdNumber: null,
          idDocType: null,
          idDocNumber: null,
          companyName: landlord.companyName ?? null,
          ic: landlord.ic ?? null,
          dic: landlord.dic ?? null,
          icValid: null,
          dicValid: null,
          delegateIds: [],
          street: null,
          city: null,
          zip: null,
          houseNumber: null,
          country: 'CZ',
        }
        setDetailLandlord(detailUi)
      } else if (id === 'new') {
        // Nový pronajímatel - zkontrolovat type z URL
        const typeFromUrl = searchParams?.get('type')?.trim() ?? null
        const newLandlord: DetailUiLandlord = {
          id: 'new',
          displayName: '',
          email: null,
          phone: null,
          subjectType: typeFromUrl, // Nastavit z URL parametru
          isArchived: false,
          createdAt: '',
          titleBefore: null,
          firstName: null,
          lastName: null,
          note: null,
          birthDate: null,
          personalIdNumber: null,
          idDocType: null,
          idDocNumber: null,
          companyName: null,
          ic: null,
          dic: null,
          icValid: null,
          dicValid: null,
          delegateIds: [],
          street: null,
          city: null,
          zip: null,
          houseNumber: null,
          country: 'CZ',
        }
        setDetailLandlord(newLandlord)
      } else {
        // Pronajímatel není v seznamu - načíst z DB
        void (async () => {
          try {
            const detail = await getLandlordDetail(id)
            const detailUi: DetailUiLandlord = {
              id: detail.id,
              displayName: detail.display_name ?? '',
              email: detail.email,
              phone: detail.phone,
              subjectType: detail.subject_type,
              isArchived: !!detail.is_archived,
              createdAt: detail.created_at ?? '',
              titleBefore: detail.title_before ?? null,
              firstName: detail.first_name ?? null,
              lastName: detail.last_name ?? null,
              note: detail.note ?? null,
              birthDate: detail.birth_date ?? null,
              personalIdNumber: detail.personal_id_number ?? null,
              idDocType: detail.id_doc_type ?? null,
              idDocNumber: detail.id_doc_number ?? null,
              companyName: detail.company_name ?? null,
              ic: detail.ic ?? null,
              dic: detail.dic ?? null,
              icValid: detail.ic_valid ?? null,
              dicValid: detail.dic_valid ?? null,
              delegateIds: (detail as any).delegateIds ?? [],
              street: detail.street ?? null,
              city: detail.city ?? null,
              zip: detail.zip ?? null,
              houseNumber: detail.house_number ?? null,
              country: detail.country ?? 'CZ',
            }
            setDetailLandlord(detailUi)
          } catch (e: any) {
            logger.error('getLandlordDetail failed', e)
            toast.showError(e?.message || 'Nepodařilo se načíst detail pronajimatele')
            setSelectedId(null)
            setViewMode('list')
            setUrl({ id: null, vm: null })
          }
        })()
      }
    } else {
      setDetailLandlord(null)
    }
  }, [searchParams, landlords, setUrl, toast, logger])

  const closeListToModule = useCallback(() => {
    setUrl({ t: null, id: null, vm: null, type: null }, 'replace')
    router.push('/')
  }, [router, setUrl])

  const closeToList = useCallback(() => {
    setDetailLandlord(null)
    setSelectedSubjectTypeForCreate(null)
    setDetailInitialSectionId('detail')
    submitRef.current = null
    setIsDirty(false)
    setViewMode('list')
    setSelectedId(null)
    setUrl({ t: 'landlords-list', id: null, vm: null }, 'replace')
  }, [setUrl])

  const openDetail = useCallback(
    (l: UiLandlord, vm: ViewMode, sectionId: any) => {
      const detail: DetailUiLandlord = {
        id: l.id,
        displayName: l.displayName,
        email: l.email,
        phone: l.phone,
        subjectType: l.subjectType,
        isArchived: l.isArchived,
        createdAt: l.createdAt,
        titleBefore: l.titleBefore,
        firstName: l.firstName,
        lastName: l.lastName,
        note: null,
        birthDate: null,
        personalIdNumber: null,
        idDocType: null,
        idDocNumber: null,
        companyName: l.companyName,
        ic: l.ic,
        dic: l.dic,
        icValid: null,
        dicValid: null,
        delegateIds: [],
        street: null,
        city: null,
        zip: null,
        houseNumber: null,
        country: 'CZ',
      }
      setDetailLandlord(detail)
      setSelectedSubjectTypeForCreate(null) // Reset pro create
      setDetailInitialSectionId(sectionId)
      setIsDirty(false)
      setViewMode(vm as any)
      setSelectedId(l.id)
      setUrl({ t: 'landlords-list', id: l.id, vm }, 'push')
    },
    [setUrl]
  )

  useEffect(() => {
    const actions: CommonActionId[] = []
    
    // ATTACHMENTS MANAGER MODE
    if (viewMode === 'attachments-manager') {
      const mode = attachmentsManagerUi.mode ?? 'list'
      actions.push(...getAttachmentsManagerActions(mode, !!attachmentsManagerUi.hasSelection))
    }
    // LIST MODE
    else if (viewMode === 'list') {
      // Pořadí: add, (view/edit/attachments když je vybrán řádek), columnSettings, close
      actions.push('add')
      if (selectedId) {
        actions.push('view', 'edit', 'relations', 'attachments') // Všechny akce najednou když je vybrán řádek
      }
      actions.push('columnSettings', 'close')
    }
    // EDIT / CREATE MODE
    else if (viewMode === 'edit' || viewMode === 'create') {
      if (viewMode === 'edit') {
        actions.push('save', 'relations', 'attachments', 'close') // V edit mode: "Uložit", "Vazby", "Přílohy", "Zavřít"
      } else {
        actions.push('save', 'close') // V create mode: "Uložit" a "Zavřít" (bez příloh)
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

    onRegisterCommonActions?.(actions)
    
    // Namapovat LocalViewMode na ViewMode pomocí utility funkce
    const mappedViewMode = viewMode === 'relations'
      ? 'read'
      : mapAttachmentsViewMode(viewMode as any, attachmentsManagerUi.mode ?? 'list')
    const mappedHasSelection = viewMode === 'relations'
      ? true
      : getHasSelection(viewMode as any, selectedId, attachmentsManagerUi)
    const mappedIsDirty = viewMode === 'relations'
      ? false
      : getIsDirty(viewMode as any, isDirty, attachmentsManagerUi)
    
    onRegisterCommonActionsState?.({
      viewMode: mappedViewMode,
      hasSelection: mappedHasSelection,
      isDirty: mappedIsDirty,
    })
  }, [viewMode, selectedId, isDirty, attachmentsManagerUi.mode, attachmentsManagerUi.hasSelection, attachmentsManagerUi.isDirty])
  // POZNÁMKA: onRegisterCommonActions a onRegisterCommonActionsState NEJSOU v dependencies!
  // Jsou stabilní funkce (useCallback v AppShell) a jejich přidání způsobuje problémy s registrací.

  useEffect(() => {
    if (!onRegisterCommonActionHandler) return
    // POZNÁMKA: onRegisterCommonActionHandler NENÍ v dependencies!
    // Je stabilní funkce (useCallback v AppShell).

    onRegisterCommonActionHandler(async (id: CommonActionId) => {
      // RELATIONS MODE
      if (viewMode === 'relations') {
        if (id === 'close') {
          const backId = relationsLandlordId ?? detailLandlord?.id ?? selectedId
          if (!backId) {
            closeToList()
            return
          }

          const backLandlord = landlords.find((l) => l.id === backId) ?? detailLandlord
          if (backLandlord) {
            openDetail(backLandlord, 'read', 'detail')
          } else {
            setViewMode('read')
            setSelectedId(backId)
            setUrl({ t: 'landlords-list', id: backId, vm: 'read' }, 'push')
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
          const backId = attachmentsManagerLandlordId ?? detailLandlord?.id ?? null
          if (!backId) {
            closeToList()
            return
          }
          
          setDetailInitialSectionId('attachments')
          
          const backLandlord = landlords.find((l) => l.id === backId)
          if (backLandlord) {
            openDetail(backLandlord, 'read', 'attachments')
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
        if (id === 'columnSettings') {
          api.columnSettings()
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
        const targetId = selectedId ?? detailLandlord?.id ?? null
        if (!targetId) return
        setRelationsLandlordId(targetId)
        setSelectedId(targetId)
        setViewMode('relations')
        setUrl({ t: 'landlords-list', id: targetId, vm: 'relations' }, 'push')
        return
      }

      // ATTACHMENTS open manager
      if (id === 'attachments') {
        if (viewMode === 'list') {
          if (!selectedId) {
            toast.showWarning('Nejdřív vyber pronajimatele v seznamu.')
            return
          }
          setAttachmentsManagerLandlordId(selectedId)
          setViewMode('attachments-manager')
          setIsDirty(false)
          setUrl({ t: 'landlords-list', id: selectedId, vm: 'attachments-manager' }, 'push')
          return
        }

        // READ / EDIT mode
        if (viewMode === 'read' || viewMode === 'edit') {
          if (isDirty) {
            toast.showWarning('Máš neuložené změny. Nejdřív ulož nebo zavři změny a pak otevři správu příloh.')
            return
          }
          if (!detailLandlord?.id || !detailLandlord.id.trim() || detailLandlord.id === 'new') {
            toast.showWarning('Nejdřív ulož záznam, aby šly spravovat přílohy.')
            return
          }

          setAttachmentsManagerLandlordId(detailLandlord.id)
          setViewMode('attachments-manager')
          setIsDirty(false)
          setUrl({ t: 'landlords-list', id: detailLandlord.id, vm: 'attachments-manager' }, 'push')
          return
        }
        return
      }

      // COLUMN SETTINGS
      if (id === 'columnSettings') {
        setColsOpen(true)
        return
      }

      // LIST ACTIONS
      if (viewMode === 'list') {
        if (id === 'add') {
          // Naviguj na tile create-landlord
          onNavigate?.('create-landlord')
          return
        }

        if (id === 'view' || id === 'edit') {
          if (!selectedId) {
            toast.showWarning('Nejdřív vyber pronajimatele v seznamu.')
            return
          }
          const l = landlords.find((x) => x.id === selectedId)
          if (!l) {
            toast.showWarning('Pronajímatel nenalezen.')
            return
          }
          openDetail(l, id === 'edit' ? 'edit' : 'read', 'detail')
          return
        }

        // TODO: Implementovat delete a archive
        if (id === 'delete' || id === 'archive') {
          toast.showWarning(`${id === 'delete' ? 'Smazání' : 'Archivace'} pronajimatele zatím není implementována.`)
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
              // Po uložení přepnout na detail (read mode)
              setDetailLandlord(saved)
              setViewMode('read')
              setSelectedId(saved.id)
              setUrl({ t: 'landlords-list', id: saved.id, vm: 'read' })
              setIsDirty(false)
              void load() // Obnovit seznam
            }
          }
          return
        }

        // Zavřít (close) v create/edit mode funguje stejně jako cancel - zavře bez uložení
        // (už je implementováno v CLOSE bloku výše)
        return
      }

      // READ ACTIONS
      if (viewMode === 'read') {
        if (id === 'edit') {
          setViewMode('edit')
          setUrl({ vm: 'edit' })
          return
        }

        // TODO: Implementovat delete a archive
        if (id === 'delete' || id === 'archive') {
          toast.showWarning(`${id === 'delete' ? 'Smazání' : 'Archivace'} pronajimatele zatím není implementována.`)
          return
        }
        return
      }
    })
  }, [viewMode, isDirty, selectedId])
  // POZNÁMKA: onRegisterCommonActionHandler, landlords, setUrl, load, toast, openDetail,
  // closeToList, closeListToModule, detailLandlord, attachmentsManagerLandlordId NEJSOU v dependencies!
  // Jsou stabilní funkce nebo způsobují nekonečnou smyčku re-renderů.

  // ✅ mapa původního pořadí (jak přišlo z backendu) – stabilita řazení
  const baseOrderIndex = useMemo(() => {
    const m = new Map<string, number>()
    landlords.forEach((l, i) => m.set(l.id, i))
    return m
  }, [landlords])

  // ✅ sortedLandlords (DEFAULT = subjectTypeOrderIndex ASC, email ASC) - stejně jako Users podle roleOrderIndex
  const sortedLandlords = useMemo(() => {
    if (!sort) {
      // Default sort when sort is null (stejně jako v Users)
      return [...landlords].sort((a, b) => {
        const ao = a.subjectTypeOrderIndex ?? 999999
        const bo = b.subjectTypeOrderIndex ?? 999999
        if (ao !== bo) return ao - bo
        return (a.email ?? '').localeCompare(b.email ?? '', 'cs')
      })
    }
    const key = String(sort.key ?? '').trim()
    const dir = sort.dir === 'desc' ? -1 : 1
    const arr = [...landlords]

    // DEFAULT (subjectTypeLabel asc) má vlastní pravidla: order_index + email - stejně jako roleLabel v Users
    if (key === 'subjectTypeLabel' && dir === 1) {
      arr.sort((a, b) => {
        const ao = a.subjectTypeOrderIndex ?? 999999
        const bo = b.subjectTypeOrderIndex ?? 999999
        if (ao < bo) return -1
        if (ao > bo) return 1

        // Sekundární řazení podle emailu (stejně jako v Users) - používá normalizeString
        const ae = normalizeString(a.email ?? '')
        const be = normalizeString(b.email ?? '')
        if (ae < be) return -1
        if (ae > be) return 1

        // Terciární řazení podle původního pořadí (stabilita)
        return numberOrZero(baseOrderIndex.get(a.id)) - numberOrZero(baseOrderIndex.get(b.id))
      })
      return arr
    }

    // Obecné řazení dle klíče
    arr.sort((a, b) => {
      const av = getSortValue(a, key)
      const bv = getSortValue(b, key)

      if (typeof av === 'number' && typeof bv === 'number') {
        if (av < bv) return -1 * dir
        if (av > bv) return 1 * dir
      } else {
        const as = String(av ?? '')
        const bs = String(bv ?? '')
        if (as < bs) return -1 * dir
        if (as > bs) return 1 * dir
      }

      // Sekundární řazení podle původního pořadí (stabilita)
      return numberOrZero(baseOrderIndex.get(a.id)) - numberOrZero(baseOrderIndex.get(b.id))
    })

    return arr
  }, [landlords, sort, baseOrderIndex])

  const rows = useMemo(() => sortedLandlords.map((l) => toRow(l)), [sortedLandlords])

  const handleSortChange = useCallback(
    (next: ListViewSortState) => {
      setSort(next ?? DEFAULT_SORT)
    },
    [DEFAULT_SORT]
  )

  const handleColumnResize = useCallback((key: string, px: number) => {
    setColPrefs((p) => ({ ...p, colWidths: { ...(p.colWidths ?? {}), [key]: px } }))
  }, [])

  // Dynamický nadpis podle filtru
  const pageTitle = useMemo(() => {
    if (!subjectTypeFilter) return 'Přehled pronajímatelů'
    
    // Najít typ z načtených typů
    const typeMeta = subjectTypes.find(t => t.code === subjectTypeFilter)
    const typeName = typeMeta?.name || subjectTypeFilter
    return `Přehled pronajímatelů - ${typeName}`
  }, [subjectTypeFilter, subjectTypes])

  if (viewMode === 'list') {
    return (
      <div className="tile-layout">
        <div className="tile-layout__header">
          <h1 className="tile-layout__title">{pageTitle}</h1>
          <p className="tile-layout__description">
            Seznam všech pronajímatelů. Můžeš filtrovat, řadit a spravovat pronajímatele.
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
              onRowClick={(row) => setSelectedId(String(row.id))}
              onRowDoubleClick={(row) => {
                const landlord = row.raw
                if (!landlord) return
                openDetail(landlord, 'read', 'detail')
              }}
              sort={sort}
              onSortChange={handleSortChange}
              onColumnResize={handleColumnResize}
              emptyText="Žádní pronajímatelé."
            />
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

  // ✅ ATTACHMENTS MANAGER MODE
  if (viewMode === 'attachments-manager') {
    const landlordId = attachmentsManagerLandlordId
    if (!landlordId) {
      return (
        <div className="tile-layout">
          <div className="tile-layout__header">
            <h1 className="tile-layout__title">Správa příloh</h1>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <p>Chyba: Není vybrán pronajímatel.</p>
          </div>
        </div>
      )
    }

    const landlord = landlords.find((l) => l.id === landlordId) ?? detailLandlord
    const landlordLabel = landlord?.displayName || 'pronajímatele'

    return (
      <AttachmentsManagerTile
        entityType="landlords"
        entityId={landlordId}
        entityLabel={landlordLabel}
        onRegisterManagerApi={(api) => {
          attachmentsManagerApiRef.current = api
        }}
        onManagerStateChange={(state) => {
          setAttachmentsManagerUi(state)
        }}
      />
    )
  }

  // RELATIONS MODE
  if (viewMode === 'relations') {
    const landlordId = relationsLandlordId ?? detailLandlord?.id ?? selectedId
    if (!landlordId) {
      return (
        <div className="tile-layout">
          <div className="tile-layout__header">
            <h1 className="tile-layout__title">Vazby</h1>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <p>Chyba: Není vybrán pronajímatel.</p>
          </div>
        </div>
      )
    }

    const landlord = landlords.find((l) => l.id === landlordId) ?? detailLandlord
    const landlordLabel = landlord?.displayName || 'Pronajímatel'

    return <LandlordRelationsHub landlordId={landlordId} landlordLabel={landlordLabel} />
  }

  // CREATE / EDIT / READ mode - zobrazit LandlordDetailFrame
  if (viewMode === 'create' || viewMode === 'edit' || viewMode === 'read') {
    // Pro create režim: pokud není vybrán typ subjektu, zobrazit výběr typu
    // Zobrazit výběr typu, pokud:
    // 1. Je create režim
    // 2. A není vybrán typ (ani v selectedSubjectTypeForCreate, ani v detailLandlord.subjectType)
    const needsTypeSelection = viewMode === 'create' && !selectedSubjectTypeForCreate && !detailLandlord?.subjectType

    if (needsTypeSelection) {
      const EXPECTED_SUBJECT_TYPES = ['osoba', 'osvc', 'firma', 'spolek', 'statni', 'zastupce']
      const availableTypes = subjectTypes.filter((t) => EXPECTED_SUBJECT_TYPES.includes(t.code) && (t.active ?? true))

      return (
        <div className="tile-layout">
          <div className="tile-layout__header">
            <h1 className="tile-layout__title">Nový pronajímatel</h1>
            <p className="tile-layout__description">Vyberte typ subjektu pro vytvoření nového pronajimatele</p>
          </div>
          <div className="tile-layout__content" style={{ padding: '1.5rem' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
              }}
            >
              {availableTypes.map((type) => {
                const isSelected = selectedSubjectTypeForCreate === type.code
                const iconKey = (type.icon?.trim() || 'home') as IconKey
                const icon = getIcon(iconKey)
                const color = type.color?.trim() || '#666666'

                return (
                  <button
                    key={type.code}
                    type="button"
                    className={`palette-card ${isSelected ? 'palette-card--active' : ''}`}
                    onClick={() => {
                      setSelectedSubjectTypeForCreate(type.code)
                      // Nastavit subjectType do detailLandlord
                      const updatedLandlord: DetailUiLandlord = detailLandlord
                        ? {
                            ...detailLandlord,
                            subjectType: type.code,
                          }
                        : {
                            id: 'new',
                            displayName: '',
                            email: null,
                            phone: null,
                            subjectType: type.code,
                            isArchived: false,
                            createdAt: '',
                            titleBefore: null,
                            firstName: null,
                            lastName: null,
                            note: null,
                            birthDate: null,
                            personalIdNumber: null,
                            idDocType: null,
                            idDocNumber: null,
                            companyName: null,
                            ic: null,
                            dic: null,
                            icValid: null,
                            dicValid: null,
                            delegateIds: [],
                            street: null,
                            city: null,
                            zip: null,
                            houseNumber: null,
                            country: 'CZ',
                          }
                      setDetailLandlord(updatedLandlord)
                      setIsDirty(false)
                    }}
                    style={{
                      backgroundColor: isSelected ? color : 'var(--color-surface-subtle)',
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
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <span style={{ fontSize: '2rem' }}>{icon}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{type.name}</div>
                        {type.description && (
                          <div style={{ fontSize: '0.875rem', opacity: 0.8, marginTop: '0.25rem' }}>
                            {type.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )
    }

    // Zobrazit LandlordDetailFrame když je vybrán typ (create) nebo pro edit/read
    if (!detailLandlord) return null
    
    // Pro create režim: pokud není vybrán typ subjektu, zobrazit výběr typu (nebo pokud je detailLandlord.subjectType, zobrazit formulář)
    // Pokud je create režim a není vybrán typ, zobrazit výběr (to jsme už zkontrolovali výše)
    // Pokud je create režim a je vybrán typ (nebo selectedSubjectTypeForCreate nebo detailLandlord.subjectType), zobrazit formulář

    return (
      <LandlordDetailFrame
        landlord={detailLandlord}
        viewMode={viewMode}
        initialSectionId={detailInitialSectionId}
        onActiveSectionChange={() => {}}
        onRegisterSubmit={(fn) => {
          submitRef.current = fn
        }}
        onDirtyChange={setIsDirty}
        onCreateDelegateFromUser={(userId) => {
          // Přesměrovat na formulář pro vytvoření zástupce s předvyplněnými daty uživatele
          setUrl({ t: 'landlords-list', id: 'new', vm: 'create', type: 'zastupce', fromUserId: userId }, 'push')
        }}
        onOpenNewDelegateForm={(type, fromUserId) => {
          // Otevřít formulář pro nového zástupce přímo v aktuálním kontextu
          const newLandlord: DetailUiLandlord = {
            id: 'new',
            displayName: '',
            email: null,
            phone: null,
            subjectType: type,
            isArchived: false,
            createdAt: '',
            titleBefore: null,
            firstName: null,
            lastName: null,
            note: null,
            birthDate: null,
            personalIdNumber: null,
            idDocType: null,
            idDocNumber: null,
            companyName: null,
            ic: null,
            dic: null,
            icValid: null,
            dicValid: null,
            delegateIds: [],
            street: null,
            city: null,
            zip: null,
            houseNumber: null,
            country: 'CZ',
          }
          setDetailLandlord(newLandlord)
          setSelectedSubjectTypeForCreate(null)
          setViewMode('create')
          setSelectedId('new')
          setIsDirty(false)
          setUrl({ t: 'landlords-list', id: 'new', vm: 'create', type, fromUserId }, 'push')
        }}
        onSaved={(saved) => {
          // Aktualizovat detail po uložení
          setDetailLandlord(saved)
          // Aktualizovat seznam (pokud je načten)
          const updatedListRow: LandlordsListRow = {
            id: saved.id,
            display_name: saved.displayName,
            email: saved.email,
            phone: saved.phone,
            subject_type: saved.subjectType,
            is_archived: saved.isArchived,
            created_at: saved.createdAt,
            title_before: saved.titleBefore ?? null,
            first_name: saved.firstName ?? null,
            last_name: saved.lastName ?? null,
            company_name: saved.companyName ?? null,
            ic: saved.ic ?? null,
            dic: saved.dic ?? null,
            subject_type_name: subjectTypes.find((t) => t.code === saved.subjectType)?.name || null,
            subject_type_color: subjectTypes.find((t) => t.code === saved.subjectType)?.color || null,
            subject_type_sort_order: subjectTypes.find((t) => t.code === saved.subjectType)?.sort_order ?? null,
          }
          const updated = landlords.map((l) => (l.id === saved.id ? mapRowToUi(updatedListRow, subjectTypeMapRef.current) : l))
          if (!landlords.find((l) => l.id === saved.id)) {
            // Přidat nový záznam do seznamu
            setLandlords([...landlords, mapRowToUi(updatedListRow, subjectTypeMapRef.current)])
          } else {
            setLandlords(updated)
          }
        }}
      />
    )
  }

  return null
}

