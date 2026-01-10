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
import { listLandlords, getLandlordDetail, type LandlordsListRow } from '@/app/lib/services/landlords'
import { applyColumnPrefs, loadViewPrefs, saveViewPrefs, type ViewPrefs, type ViewPrefsSortState } from '@/app/lib/services/viewPrefs'
import ListViewColumnsDrawer from '@/app/UI/ListViewColumnsDrawer'
import { SkeletonTable } from '@/app/UI/SkeletonLoader'
import { useToast } from '@/app/UI/Toast'
import createLogger from '@/app/lib/logger'
import { fetchSubjectTypes, type SubjectType } from '@/app/modules/900-nastaveni/services/subjectTypes'

import '@/app/styles/components/TileLayout.css'

const logger = createLogger('030 LandlordsTile')

type LandlordsTileProps = {
  subjectTypeFilter?: string | null // Přednastavený filtr podle typu subjektu
  onRegisterCommonActions?: (actions: CommonActionId[]) => void
  onRegisterCommonActionsState?: (state: { viewMode: ViewMode; hasSelection: boolean; isDirty: boolean }) => void
  onRegisterCommonActionHandler?: (fn: (id: CommonActionId) => void) => void
}

type LocalViewMode = ViewMode | 'list'

const VIEW_KEY = '030.landlords.list'

const BASE_COLUMNS: ListViewColumn[] = [
  { key: 'subjectTypeLabel', label: 'Typ pronajimatele', width: 160, sortable: true },
  { key: 'displayName', label: 'Zobrazované jméno', width: 220, sortable: true },
  { key: 'email', label: 'E-mail', width: 260, sortable: true },
  { key: 'phone', label: 'Telefon', width: 180, sortable: true },
  { key: 'companyName', label: 'Název společnosti', width: 220, sortable: true },
  { key: 'ic', label: 'IČ', width: 120, sortable: true },
  { key: 'firstName', label: 'Jméno', width: 160, sortable: true },
  { key: 'lastName', label: 'Příjmení', width: 180, sortable: true },
  { key: 'isArchived', label: 'Archivován', width: 120, align: 'center', sortable: true },
]

function mapRowToUi(row: LandlordsListRow, subjectTypeMap: Record<string, SubjectType>): UiLandlord {
  const subjectTypeMeta = subjectTypeMap[row.subject_type ?? '']
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

    // Metadata z subject_types
    subjectTypeLabel: subjectTypeMeta?.name || row.subject_type_name || row.subject_type || '—',
    subjectTypeColor: subjectTypeMeta?.color || row.subject_type_color || null,
    subjectTypeOrderIndex: subjectTypeMeta?.sort_order ?? row.subject_type_sort_order ?? null,
  }
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
}: LandlordsTileProps) {
  const toast = useToast()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchKey = searchParams?.toString() ?? ''

  const [landlords, setLandlords] = useState<UiLandlord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [filterText, setFilterText] = useState('')
  const [subjectTypeFilter, setSubjectTypeFilter] = useState<string | null>(propSubjectTypeFilter || null)
  const [showArchived, setShowArchived] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [viewMode, setViewMode] = useState<LocalViewMode>('list')
  const [detailLandlord, setDetailLandlord] = useState<DetailUiLandlord | null>(null)

  const [detailInitialSectionId, setDetailInitialSectionId] = useState<any>('detail')

  const [isDirty, setIsDirty] = useState(false)

  const submitRef = useRef<null | (() => Promise<DetailUiLandlord | null>)>(null)

  const [subjectTypes, setSubjectTypes] = useState<SubjectType[]>([])
  const subjectTypeMap = useMemo(() => {
    const map: Record<string, SubjectType> = {}
    for (const type of subjectTypes) {
      map[type.code] = type
    }
    return map
  }, [subjectTypes])
  const subjectTypeMapRef = useRef<Record<string, SubjectType>>({})

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
      next: { t?: string | null; id?: string | null; vm?: string | null; type?: string | null },
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
    const type = searchParams?.get('type') ?? null

    setSelectedId(id)
    setViewMode(id ? vm : 'list')
    setSubjectTypeFilter(type)

    if (id && vm !== 'list') {
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
            delegateId: detail.delegate_id ?? null,
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
    } else {
      setDetailLandlord(null)
    }
  }, [searchParams, setUrl, toast])

  useEffect(() => {
    const actions: CommonActionId[] = []
    if (viewMode === 'list') {
      if (selectedId) actions.push('delete', 'archive')
    } else if (viewMode === 'edit' || viewMode === 'create') {
      actions.push('save', 'cancel')
    } else if (viewMode === 'read') {
      actions.push('edit', 'delete', 'archive')
    }

    onRegisterCommonActions?.(actions)
    onRegisterCommonActionsState?.({
      viewMode,
      hasSelection: !!selectedId,
      isDirty,
    })
  }, [viewMode, selectedId, isDirty, onRegisterCommonActions, onRegisterCommonActionsState])

  useEffect(() => {
    if (!onRegisterCommonActionHandler) return

    onRegisterCommonActionHandler(async (id: CommonActionId) => {
      if (id === 'cancel') {
        if (viewMode === 'create') {
          router.push(`/modules/030-pronajimatel?t=landlords-list`)
        } else {
          setViewMode('read')
          setUrl({ vm: 'read' })
        }
        setIsDirty(false)
      } else if (id === 'edit') {
        setViewMode('edit')
        setUrl({ vm: 'edit' })
      } else if (id === 'save') {
        if (submitRef.current) {
          const saved = await submitRef.current()
          if (saved) {
            setViewMode('read')
            setUrl({ vm: 'read' })
            void load()
          }
        }
      }
      // TODO: Implementovat delete a archive
    })
  }, [onRegisterCommonActionHandler, setUrl, viewMode, router, load])

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
        companyName: l.companyName,
        ic: l.ic,
        dic: l.dic,
        street: null,
        city: null,
        zip: null,
        houseNumber: null,
        country: 'CZ',
        note: null,
      }
      setDetailLandlord(detail)
      setDetailInitialSectionId(sectionId)
      setIsDirty(false)
      setViewMode(vm as any)
      setSelectedId(l.id)
      setUrl({ t: 'landlords-list', id: l.id, vm }, 'push')
    },
    [setUrl]
  )

  // ✅ mapa původního pořadí (jak přišlo z backendu) – stabilita řazení
  const baseOrderIndex = useMemo(() => {
    const m = new Map<string, number>()
    landlords.forEach((l, i) => m.set(l.id, i))
    return m
  }, [landlords])

  // ✅ sortedLandlords (DEFAULT = subjectTypeOrderIndex ASC, email ASC)
  const sortedLandlords = useMemo(() => {
    if (!sort) {
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

    // DEFAULT (subjectTypeLabel asc) má vlastní pravidla: order_index + email
    if (key === 'subjectTypeLabel' && dir === 1) {
      arr.sort((a, b) => {
        const ao = a.subjectTypeOrderIndex ?? 999999
        const bo = b.subjectTypeOrderIndex ?? 999999
        if (ao < bo) return -1
        if (ao > bo) return 1

        const ae = normalizeString(a.email)
        const be = normalizeString(b.email)
        if (ae < be) return -1
        if (ae > be) return 1

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

  if (viewMode === 'list') {
    return (
      <div className="tile-layout">
        <div className="tile-layout__header">
          <h1 className="tile-layout__title">Přehled pronajímatelů</h1>
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
              filterValue={filterText}
              onFilterChange={setFilterText}
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
              toolbarRight={
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {!propSubjectTypeFilter && (
                    <select
                      value={subjectTypeFilter || ''}
                      onChange={(e) => {
                        const val = e.target.value || null
                        setSubjectTypeFilter(val)
                        setUrl({ t: 'landlords-list', type: val })
                      }}
                      style={{ padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                    >
                      <option value="">Všechny typy</option>
                      {subjectTypes.map((type) => (
                        <option key={type.code} value={type.code}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    type="button"
                    onClick={() => setColsOpen(true)}
                    style={{ padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Sloupce
                  </button>
                </div>
              }
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
          onChange={(next) => {
            setColPrefs((p) => ({
              ...p,
              colOrder: next.order,
              colHidden: next.hidden,
            }))
          }}
          onReset={() => {
            setColPrefs((p) => ({
              ...p,
              colOrder: [],
              colHidden: [],
            }))
          }}
        />
      </div>
    )
  }

  if (viewMode === 'read' || viewMode === 'edit') {
    if (!detailLandlord) return null

    return (
      <LandlordDetailFrame
        landlord={detailLandlord}
        viewMode={viewMode}
        initialSectionId={detailInitialSectionId}
        onActiveSectionChange={() => {}}
        onRegisterSubmit={submitRef.current ? undefined : (fn) => (submitRef.current = fn)}
        onDirtyChange={setIsDirty}
      />
    )
  }

  return null
}

