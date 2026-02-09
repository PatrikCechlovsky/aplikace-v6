'use client'

// FILE: app/modules/800-subjekty/tiles/SubjectsTile.tsx
// PURPOSE: List + detail subjektů (800) - stejné chování jako pronajímatelé
// URL state:
// - t=subjects-list (list + detail)
// - id + vm (detail: read/edit/create)

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import ListView, { type ListViewRow, type ListViewSortState } from '@/app/UI/ListView'
import type { CommonActionId, ViewMode } from '@/app/UI/CommonActions'
import SubjectDetailFrame, { type UiSubject as DetailUiSubject } from '../forms/SubjectDetailFrame'
import LandlordRelationsHub from '@/app/modules/030-pronajimatel/components/LandlordRelationsHub'
import AttachmentsManagerTile, {
  type AttachmentsManagerApi,
  type AttachmentsManagerUiState,
} from '@/app/UI/attachments/AttachmentsManagerTile'
import { listSubjects, getSubjectDetail, type SubjectsListRow } from '@/app/lib/services/subjects'
import { applyColumnPrefs, loadViewPrefs, saveViewPrefs, type ViewPrefs, type ViewPrefsSortState } from '@/app/lib/services/viewPrefs'
import ListViewColumnsDrawer from '@/app/UI/ListViewColumnsDrawer'
import { SkeletonTable } from '@/app/UI/SkeletonLoader'
import { useToast } from '@/app/UI/Toast'
import createLogger from '@/app/lib/logger'
import { fetchSubjectTypes, type SubjectType } from '@/app/modules/900-nastaveni/services/subjectTypes'
import { getIcon, type IconKey } from '@/app/UI/icons'
import { SUBJECTS_BASE_COLUMNS } from '../subjectsColumns'
import {
  getAttachmentsManagerActions,
  mapAttachmentsViewMode,
  getHasSelection,
  getIsDirty,
  shouldCloseAttachmentsPanel,
} from '@/app/lib/attachments/attachmentsManagerUtils'

import '@/app/styles/components/TileLayout.css'
import '@/app/styles/components/PaletteCard.css'

const logger = createLogger('800 SubjectsTile')

type SubjectsTileProps = {
  subjectTypeFilter?: string | null // Přednastavený filtr podle typu subjektu
  onRegisterCommonActions?: (actions: CommonActionId[]) => void
  onRegisterCommonActionsState?: (state: { viewMode: ViewMode; hasSelection: boolean; isDirty: boolean }) => void
  onRegisterCommonActionHandler?: (fn: ((id: CommonActionId) => void) | null) => void
}

type LocalViewMode = ViewMode | 'list' | 'attachments-manager' | 'relations'

const VIEW_KEY = '800.subjects.list'

const BASE_COLUMNS = SUBJECTS_BASE_COLUMNS

export function mapSubjectRowToUi(row: SubjectsListRow, subjectTypeMap: Record<string, SubjectType>): UiSubject {
  const subjectTypeMeta = subjectTypeMap[row.subject_type ?? '']

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

    fullAddress: fullAddress || null,

    subjectTypeLabel: subjectTypeMeta?.name || row.subject_type_name || row.subject_type || '—',
    subjectTypeColor: subjectTypeMeta?.color || row.subject_type_color || null,
    subjectTypeOrderIndex: subjectTypeMeta?.sort_order ?? row.subject_type_sort_order ?? null,

    isUser: row.is_user ?? null,
    isLandlord: row.is_landlord ?? null,
    isTenant: row.is_tenant ?? null,
    isLandlordDelegate: row.is_landlord_delegate ?? null,
    isTenantDelegate: row.is_tenant_delegate ?? null,
    isMaintenance: row.is_maintenance ?? null,
    isMaintenanceDelegate: row.is_maintenance_delegate ?? null,
  }
}

function mapRowToUi(row: SubjectsListRow, subjectTypeMap: Record<string, SubjectType>): UiSubject {
  return mapSubjectRowToUi(row, subjectTypeMap)
}

function mapDetailSubjectToUi(detail: DetailUiSubject, subjectTypeMap: Record<string, SubjectType>): UiSubject {
  const subjectTypeMeta = subjectTypeMap[detail.subjectType ?? '']

  const streetPart = [detail.street, detail.houseNumber].filter(Boolean).join(' ')
  const cityPart = [detail.zip, detail.city].filter(Boolean).join(' ')
  const countryName = detail.country === 'CZ' ? 'Česká republika' :
                     detail.country === 'SK' ? 'Slovensko' :
                     detail.country === 'PL' ? 'Polsko' :
                     detail.country === 'DE' ? 'Německo' :
                     detail.country === 'AT' ? 'Rakousko' :
                     detail.country || ''
  const fullAddress = [streetPart, cityPart, countryName].filter(Boolean).join(', ')

  return {
    id: detail.id,
    displayName: detail.displayName ?? '',
    email: detail.email ?? null,
    phone: detail.phone ?? null,
    subjectType: detail.subjectType ?? null,
    isArchived: detail.isArchived ?? null,
    createdAt: detail.createdAt ?? '',

    titleBefore: detail.titleBefore ?? null,
    firstName: detail.firstName ?? null,
    lastName: detail.lastName ?? null,

    companyName: detail.companyName ?? null,
    ic: detail.ic ?? null,
    dic: detail.dic ?? null,

    fullAddress: fullAddress || null,

    subjectTypeLabel: subjectTypeMeta?.name || detail.subjectType || '—',
    subjectTypeColor: subjectTypeMeta?.color ?? null,
    subjectTypeOrderIndex: subjectTypeMeta?.sort_order ?? null,

    isUser: detail.isUser ?? null,
    isLandlord: detail.isLandlord ?? null,
    isTenant: detail.isTenant ?? null,
    isLandlordDelegate: detail.isLandlordDelegate ?? null,
    isTenantDelegate: detail.isTenantDelegate ?? null,
    isMaintenance: detail.isMaintenance ?? null,
    isMaintenanceDelegate: detail.isMaintenanceDelegate ?? null,
  }
}

function toRow(l: UiSubject): ListViewRow<UiSubject> {
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

function getSortValue(l: UiSubject, key: string): string | number {
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

type UiSubject = {
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

  note?: string | null

  // Role flags
  isUser?: boolean | null
  isLandlord?: boolean | null
  isLandlordDelegate?: boolean | null
  isTenant?: boolean | null
  isTenantDelegate?: boolean | null
  isMaintenance?: boolean | null
  isMaintenanceDelegate?: boolean | null
}

export default function SubjectsTile({
  subjectTypeFilter: propSubjectTypeFilter,
  onRegisterCommonActions,
  onRegisterCommonActionsState,
  onRegisterCommonActionHandler,
}: SubjectsTileProps) {
  const toast = useToast()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchKey = searchParams?.toString() ?? ''

  const [subjects, setSubjects] = useState<UiSubject[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [filterInput, setFilterInput] = useState('')
  const [filterText, setFilterText] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilterText(filterInput)
    }, 500)

    return () => clearTimeout(timer)
  }, [filterInput])

  const subjectTypeFilter = useMemo(() => {
    if (propSubjectTypeFilter) return propSubjectTypeFilter

    const tileId = searchParams?.get('t') || null
    if (tileId?.startsWith('subjects-type-')) {
      return tileId.replace('subjects-type-', '')
    }

    return null
  }, [propSubjectTypeFilter, searchParams])

  const [showArchived, setShowArchived] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [viewMode, setViewMode] = useState<LocalViewMode>('list')
  const [detailSubject, setDetailSubject] = useState<DetailUiSubject | null>(null)
  const [relationsSubjectId, setRelationsSubjectId] = useState<string | null>(null)

  const [detailInitialSectionId, setDetailInitialSectionId] = useState<any>('detail')

  const [isDirty, setIsDirty] = useState(false)

  const submitRef = useRef<null | (() => Promise<DetailUiSubject | null>)>(null)

  // ✅ Attachments manager: API ref a UI state
  const [attachmentsManagerSubjectId, setAttachmentsManagerSubjectId] = useState<string | null>(null)
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
        const rows = await listSubjects({ searchText: filterText, subjectType: subjectTypeFilter, includeArchived: showArchived })
        setSubjects(rows.map((r) => mapRowToUi(r, subjectTypeMapRef.current)))
      } catch (e: any) {
        logger.error('listSubjects failed', e)
        setError(e?.message ?? 'Chyba načtení subjektů')
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

  useEffect(() => {
    if (!subjectTypeMap || Object.keys(subjectTypeMap).length === 0) return

    setSubjects((prev) => {
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
      setRelationsSubjectId(id)
    }

    if (id && vm !== 'list') {
      const subject = subjects.find((l) => l.id === id)
      if (subject) {
        setDetailSubject(mapDetailSubjectToUi(subject as any, subjectTypeMapRef.current))
      }
    }
  }, [searchParams, subjects])

  const openDetail = useCallback(
    async (subject: UiSubject, mode: ViewMode, initialSectionId: any = 'detail') => {
      try {
        setDetailInitialSectionId(initialSectionId)
        setViewMode(mode)
        setSelectedId(subject.id)

        const detail = await getSubjectDetail(subject.id)
        const s: any = (detail as any)?.subject ?? {}

        const detailSubject: DetailUiSubject = {
          ...subject,
          id: String(s.id ?? subject.id),
          displayName: s.display_name ?? subject.displayName ?? '',
          email: s.email ?? subject.email ?? null,
          phone: s.phone ?? subject.phone ?? null,
          subjectType: s.subject_type ?? subject.subjectType ?? null,
          isArchived: s.is_archived ?? subject.isArchived ?? false,
          createdAt: s.created_at ?? subject.createdAt ?? '',

          titleBefore: s.title_before ?? subject.titleBefore ?? null,
          firstName: s.first_name ?? subject.firstName ?? null,
          lastName: s.last_name ?? subject.lastName ?? null,
          note: s.note ?? subject.note ?? null,

          birthDate: s.birth_date ?? (subject as any).birthDate ?? null,
          personalIdNumber: s.personal_id_number ?? (subject as any).personalIdNumber ?? null,
          idDocType: s.id_doc_type ?? (subject as any).idDocType ?? null,
          idDocNumber: s.id_doc_number ?? (subject as any).idDocNumber ?? null,

          companyName: s.company_name ?? subject.companyName ?? null,
          ic: s.ic ?? subject.ic ?? null,
          dic: s.dic ?? subject.dic ?? null,
          icValid: s.ic_valid ?? (subject as any).icValid ?? null,
          dicValid: s.dic_valid ?? (subject as any).dicValid ?? null,
          delegateIds: (s as any).delegateIds ?? (subject as any).delegateIds ?? [],

          street: s.street ?? (subject as any).street ?? null,
          city: s.city ?? (subject as any).city ?? null,
          zip: s.zip ?? (subject as any).zip ?? null,
          houseNumber: s.house_number ?? (subject as any).houseNumber ?? null,
          country: s.country ?? (subject as any).country ?? 'CZ',

          isUser: s.is_user ?? subject.isUser ?? null,
          isLandlord: s.is_landlord ?? subject.isLandlord ?? null,
          isLandlordDelegate: s.is_landlord_delegate ?? subject.isLandlordDelegate ?? null,
          isTenant: s.is_tenant ?? subject.isTenant ?? null,
          isTenantDelegate: s.is_tenant_delegate ?? subject.isTenantDelegate ?? null,
          isMaintenance: s.is_maintenance ?? subject.isMaintenance ?? null,
          isMaintenanceDelegate: s.is_maintenance_delegate ?? subject.isMaintenanceDelegate ?? null,
        }

        setDetailSubject(detailSubject)

        setUrl({ t: 'subjects-list', id: subject.id, vm: mode }, 'replace')
      } catch (err: any) {
        logger.error('openDetail failed', err)
        toast.showError(err?.message ?? 'Nepodařilo se načíst detail subjektu')
      }
    },
    [setUrl, toast]
  )

  const resetSelection = useCallback(() => {
    setSelectedId(null)
    setDetailSubject(null)
    setViewMode('list')
    setDetailInitialSectionId('detail')
    setUrl({ t: 'subjects-list', id: null, vm: null }, 'replace')
  }, [setUrl])

  const handleCreate = useCallback(() => {
    setSelectedSubjectTypeForCreate(null)
    setDetailSubject({
      id: 'new',
      displayName: '',
      email: null,
      phone: null,
      subjectType: null,
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
      isUser: false,
      isLandlord: false,
      isLandlordDelegate: false,
      isTenant: false,
      isTenantDelegate: false,
      isMaintenance: false,
      isMaintenanceDelegate: false,
    })
    setViewMode('create')
    setDetailInitialSectionId('detail')
    setSelectedId('new')
    setUrl({ t: 'subjects-list', id: 'new', vm: 'create' }, 'push')
  }, [setUrl])

  // ===== CommonActions registration =====
  useEffect(() => {
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

    onRegisterCommonActions?.(actions)

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
      viewMode: mappedViewMode as ViewMode,
      hasSelection: mappedHasSelection,
      isDirty: mappedIsDirty,
    })
  }, [viewMode, selectedId, isDirty, attachmentsManagerUi.mode, attachmentsManagerUi.hasSelection, attachmentsManagerUi.isDirty])

  useEffect(() => {
    if (!onRegisterCommonActionHandler) return

    onRegisterCommonActionHandler(async (id: CommonActionId) => {
      // RELATIONS MODE
      if (viewMode === 'relations') {
        if (id === 'close') {
          const backId = relationsSubjectId ?? detailSubject?.id ?? selectedId
          if (backId) {
            setViewMode('read')
            setUrl({ t: 'subjects-list', id: backId, vm: 'read' }, 'replace')
          } else {
            resetSelection()
          }
        }
        return
      }

      // ATTACHMENTS MANAGER MODE
      if (viewMode === 'attachments-manager') {
        if (id === 'close') {
          const mode = attachmentsManagerUi.mode ?? 'list'
          const dirtyNow = !!attachmentsManagerUi.isDirty

          if (dirtyNow) {
            const ok = confirm('Máš neuložené změny. Opravdu chceš zavřít?')
            if (!ok) return
          }

          if (shouldCloseAttachmentsPanel(mode)) {
            const api = attachmentsManagerApiRef.current
            if (api?.close) {
              api.close()
            }
            return
          }

          const backId = attachmentsManagerSubjectId ?? detailSubject?.id ?? null
          if (!backId) {
            resetSelection()
            return
          }

          setDetailInitialSectionId('attachments')

          const backSubject = subjects.find((l) => l.id === backId)
          if (backSubject) {
            openDetail(backSubject, 'read', 'attachments')
          } else {
            resetSelection()
          }
          return
        }

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

      // LIST MODE
      if (viewMode === 'list') {
        if (id === 'add') {
          handleCreate()
        }

        if (id === 'view') {
          const targetId = selectedId
          if (!targetId) return
          const subject = subjects.find((l) => l.id === targetId)
          if (!subject) return
          await openDetail(subject, 'read')
        }

        if (id === 'edit') {
          const targetId = selectedId
          if (!targetId) return
          const subject = subjects.find((l) => l.id === targetId)
          if (!subject) return
          await openDetail(subject, 'edit')
        }

        if (id === 'relations') {
          const targetId = selectedId
          if (!targetId) return
          setRelationsSubjectId(targetId)
          setViewMode('relations')
          setUrl({ t: 'subjects-list', id: targetId, vm: 'relations' }, 'push')
        }

        if (id === 'attachments') {
          const targetId = selectedId
          if (!targetId) return
          setAttachmentsManagerSubjectId(targetId)
          setViewMode('attachments-manager')
          setUrl({ t: 'subjects-list', id: targetId, vm: 'attachments-manager' }, 'push')
        }

        return
      }

      // CREATE MODE
      if (viewMode === 'create') {
        if (id === 'close') {
          if (isDirty) {
            const ok = confirm('Máš neuložené změny. Opravdu chceš zavřít?')
            if (!ok) return
          }
          resetSelection()
          return
        }

        if (id === 'save') {
          if (submitRef.current) {
            const saved = await submitRef.current()
            if (saved) {
              setIsDirty(false)
              setViewMode('read')
              setSelectedId(saved.id)
              setDetailSubject(saved)
              setUrl({ t: 'subjects-list', id: saved.id, vm: 'read' }, 'replace')
              toast.showSuccess('Subjekt byl úspěšně vytvořen')
              void load()
            }
          }
          return
        }

        return
      }

      // READ MODE
      if (viewMode === 'read') {
        if (id === 'close') {
          resetSelection()
          return
        }

        if (id === 'edit') {
          if (!detailSubject) return
          setViewMode('edit')
          setUrl({ t: 'subjects-list', id: detailSubject.id, vm: 'edit' }, 'replace')
          return
        }

        if (id === 'relations') {
          const targetId = detailSubject?.id ?? selectedId
          if (!targetId) return
          setRelationsSubjectId(targetId)
          setViewMode('relations')
          setUrl({ t: 'subjects-list', id: targetId, vm: 'relations' }, 'push')
          return
        }

        if (id === 'attachments') {
          const targetId = detailSubject?.id ?? selectedId
          if (!targetId) return
          setAttachmentsManagerSubjectId(targetId)
          setViewMode('attachments-manager')
          setUrl({ t: 'subjects-list', id: targetId, vm: 'attachments-manager' }, 'push')
          return
        }

        return
      }

      // EDIT MODE
      if (viewMode === 'edit') {
        if (id === 'close') {
          if (isDirty) {
            const ok = confirm('Máš neuložené změny. Opravdu chceš zavřít?')
            if (!ok) return
          }
          if (detailSubject?.id) {
            setViewMode('read')
            setUrl({ t: 'subjects-list', id: detailSubject.id, vm: 'read' }, 'replace')
          } else {
            resetSelection()
          }
          return
        }

        if (id === 'save') {
          if (submitRef.current) {
            const saved = await submitRef.current()
            if (saved) {
              setIsDirty(false)
              setViewMode('read')
              setSelectedId(saved.id)
              setDetailSubject(saved)
              setUrl({ t: 'subjects-list', id: saved.id, vm: 'read' }, 'replace')
              toast.showSuccess('Subjekt byl úspěšně uložen')
              void load()
            }
          }
          return
        }

        if (id === 'relations') {
          const targetId = detailSubject?.id ?? selectedId
          if (!targetId) return
          setRelationsSubjectId(targetId)
          setViewMode('relations')
          setUrl({ t: 'subjects-list', id: targetId, vm: 'relations' }, 'push')
          return
        }

        if (id === 'attachments') {
          const targetId = detailSubject?.id ?? selectedId
          if (!targetId) return
          setAttachmentsManagerSubjectId(targetId)
          setViewMode('attachments-manager')
          setUrl({ t: 'subjects-list', id: targetId, vm: 'attachments-manager' }, 'push')
          return
        }

        return
      }
    })
  }, [
    onRegisterCommonActionHandler,
    viewMode,
    selectedId,
    detailSubject,
    isDirty,
    subjects,
    openDetail,
    setUrl,
    resetSelection,
    attachmentsManagerUi,
    attachmentsManagerSubjectId,
    relationsSubjectId,
    toast,
    load,
    handleCreate,
  ])

  // =====================================
  // Rendering
  // =====================================

  const rows = useMemo(() => {
    const filtered = (subjects ?? []).filter((l) => {
      if (!filterInput) return true
      const text = normalizeString(filterInput)
      return (
        normalizeString(l.displayName).includes(text) ||
        normalizeString(l.email).includes(text) ||
        normalizeString(l.phone).includes(text) ||
        normalizeString(l.companyName).includes(text) ||
        normalizeString(l.ic).includes(text) ||
        normalizeString(l.firstName).includes(text) ||
        normalizeString(l.lastName).includes(text)
      )
    })

    const sorted = sortItems(filtered, sort, (item, key) => getSortValue(item, key))

    return sorted.map((l) => toRow(l))
  }, [subjects, filterInput, sort])

  const pageTitle = useMemo(() => {
    if (!subjectTypeFilter) return 'Subjekty'
    const type = subjectTypes.find((t) => t.code === subjectTypeFilter)
    return type ? `${type.name}` : 'Subjekty'
  }, [subjectTypeFilter, subjectTypes])

  const showCreateSelector = viewMode === 'create' && !selectedSubjectTypeForCreate

  if (showCreateSelector) {
    return (
      <div className="tile-layout">
        <div className="tile-layout__header">
          <h1 className="tile-layout__title">Nový subjekt</h1>
          <p className="tile-layout__description">Vyberte typ subjektu pro vytvoření nového subjektu</p>
        </div>
        <div className="tile-layout__content" style={{ padding: '1.5rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
            }}
          >
            {subjectTypes.map((type) => {
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
                    setDetailSubject((prev) => ({
                      ...(prev ?? ({} as any)),
                      subjectType: type.code,
                    }))
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

  if (viewMode === 'list') {
    return (
      <div className="tile-layout">
        <div className="tile-layout__header">
          <h1 className="tile-layout__title">{pageTitle}</h1>
          <p className="tile-layout__description">
            Seznam všech subjektů. Můžeš filtrovat, řadit a spravovat subjekty.
          </p>
        </div>
        {error && <div style={{ padding: '0 1.5rem 0.5rem', color: 'crimson' }}>{error}</div>}
        {loading ? (
          <div className="tile-layout__content">
            <SkeletonTable rows={8} columns={columns.length} />
          </div>
        ) : (
          <>
            <ListView
              columns={columns}
              rows={rows}
              filterValue={filterInput}
              onFilterChange={setFilterInput}
              showArchived={showArchived}
              onShowArchivedChange={setShowArchived}
              onColumnSettings={() => setColsOpen(true)}
              selectedId={selectedId ?? null}
              onRowClick={(row) => setSelectedId(String(row.id))}
              onRowDoubleClick={(row) => {
                const subject = row.raw
                if (!subject) return
                openDetail(subject, 'read', 'detail')
              }}
              sort={sort}
              onSortChange={(next) => setSort(next)}
              onColumnResize={(key, width) =>
                setColPrefs((p) => ({
                  ...p,
                  colWidths: {
                    ...p.colWidths,
                    [key]: width,
                  },
                }))
              }
              emptyText="Žádné subjekty."
            />

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
          </>
        )}
      </div>
    )
  }

  if (viewMode === 'attachments-manager') {
    const subjectId = attachmentsManagerSubjectId
    if (!subjectId) {
      return (
        <div className="tile-layout">
          <div className="tile-layout__header">
            <h1 className="tile-layout__title">Správa příloh</h1>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <p>Chyba: Není vybrán subjekt.</p>
          </div>
        </div>
      )
    }

    const subject = subjects.find((l) => l.id === subjectId) ?? detailSubject
    const subjectLabel = subject?.displayName || 'subjekt'

    return (
      <AttachmentsManagerTile
        entityType="subjects"
        entityId={subjectId}
        entityLabel={subjectLabel}
        onRegisterManagerApi={(api) => {
          attachmentsManagerApiRef.current = api
        }}
        onManagerStateChange={(state) => {
          setAttachmentsManagerUi(state)
        }}
      />
    )
  }

  if (viewMode === 'relations') {
    const subjectId = relationsSubjectId ?? detailSubject?.id ?? selectedId
    if (!subjectId) return null
    const subjectLabel = detailSubject?.displayName || 'Subjekt'

    return <LandlordRelationsHub landlordId={subjectId} landlordLabel={subjectLabel} />
  }

  if (!detailSubject) return null

  return (
    <SubjectDetailFrame
      subject={detailSubject}
      viewMode={viewMode}
      initialSectionId={detailInitialSectionId}
      onActiveSectionChange={(id) => setDetailInitialSectionId(id)}
      onRegisterSubmit={(fn) => {
        submitRef.current = fn
      }}
      onDirtyChange={setIsDirty}
      onSaved={(saved) => {
        setDetailSubject(saved)
        setSubjects((prev) => {
          const next = prev.map((l) => (l.id === saved.id ? mapDetailSubjectToUi(saved, subjectTypeMapRef.current) : l))
          return next
        })
      }}
      onCreateDelegateFromUser={(userId) => {
        setSelectedSubjectTypeForCreate('zastupce')
        setDetailSubject((prev) => ({
          ...(prev ?? ({} as any)),
          id: 'new',
          subjectType: 'zastupce',
        }))
        setViewMode('create')
        setUrl({ t: 'subjects-list', id: 'new', vm: 'create', type: 'zastupce', fromUserId: userId }, 'push')
      }}
      onOpenNewDelegateForm={(type, fromUserId) => {
        setSelectedSubjectTypeForCreate(type)
        setDetailSubject((prev) => ({
          ...(prev ?? ({} as any)),
          id: 'new',
          subjectType: type,
        }))
        setViewMode('create')
        setUrl({ t: 'subjects-list', id: 'new', vm: 'create', type, fromUserId: fromUserId ?? null }, 'push')
      }}
    />
  )
}

function sortItems<T>(items: T[], sort: ListViewSortState, getValue: (item: T, key: string) => any): T[] {
  if (!sort) return items
  const dir = sort.dir === 'asc' ? 1 : -1
  return [...items].sort((a, b) => {
    const aVal = getValue(a, sort.key)
    const bVal = getValue(b, sort.key)

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return (aVal - bVal) * dir
    }
    return String(aVal ?? '').localeCompare(String(bVal ?? ''), 'cs', { sensitivity: 'base' }) * dir
  })
}
