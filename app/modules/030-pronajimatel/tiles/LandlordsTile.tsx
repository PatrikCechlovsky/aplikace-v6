'use client'

// FILE: app/modules/030-pronajimatel/tiles/LandlordsTile.tsx
// PURPOSE: List + detail pronajímatelů (030)
// Základní verze - bude postupně rozšířena o plnou funkcionalitu

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import ListView, { type ListViewColumn, type ListViewRow, type ListViewSortState } from '@/app/UI/ListView'
import type { CommonActionId, ViewMode } from '@/app/UI/CommonActions'
import { listLandlords, type LandlordsListRow, getLandlordDetail } from '@/app/lib/services/landlords'
import { useToast } from '@/app/UI/Toast'
import createLogger from '@/app/lib/logger'
import TileLayout from '@/app/UI/TileLayout'
import LandlordDetailFrame, { type UiLandlord as DetailUiLandlord } from '../forms/LandlordDetailFrame'
import '@/app/styles/components/TileLayout.css'

const logger = createLogger('LandlordsTile')

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
}

type LandlordsTileProps = {
  subjectTypeFilter?: string | null // Přednastavený filtr podle typu subjektu
  onRegisterCommonActions?: (actions: CommonActionId[]) => void
  onRegisterCommonActionsState?: (state: { viewMode: ViewMode; hasSelection: boolean; isDirty: boolean }) => void
  onRegisterCommonActionHandler?: (fn: (id: CommonActionId) => void) => void
}

const BASE_COLUMNS: ListViewColumn[] = [
  { key: 'subjectType', label: 'Typ', width: 120, sortable: true },
  { key: 'displayName', label: 'Název / Jméno', width: 250, sortable: true },
  { key: 'companyName', label: 'Název firmy', width: 220, sortable: true },
  { key: 'lastName', label: 'Příjmení', width: 180, sortable: true },
  { key: 'firstName', label: 'Jméno', width: 160, sortable: true },
  { key: 'ic', label: 'IČ', width: 120, sortable: true },
  { key: 'email', label: 'E-mail', width: 260, sortable: true },
  { key: 'phone', label: 'Telefon', width: 160, sortable: true },
  { key: 'isArchived', label: 'Archivován', width: 120, align: 'center', sortable: true },
]

function mapRowToUi(row: LandlordsListRow): UiLandlord {
  return {
    id: row.id,
    displayName: row.display_name ?? '',
    email: row.email,
    phone: row.phone,
    subjectType: row.subject_type,
    isArchived: row.is_archived,
    createdAt: row.created_at ?? '',

    titleBefore: row.title_before ?? null,
    firstName: row.first_name ?? null,
    lastName: row.last_name ?? null,

    companyName: row.company_name ?? null,
    ic: row.ic ?? null,
    dic: row.dic ?? null,
  }
}

function toRow(u: UiLandlord): ListViewRow<UiLandlord> {
  return {
    id: u.id,
    data: {
      subjectType: u.subjectType ?? '—',
      displayName: u.displayName || '—',
      companyName: u.companyName ?? '—',
      lastName: u.lastName ?? '—',
      firstName: u.firstName ?? '—',
      ic: u.ic ?? '—',
      email: u.email ?? '—',
      phone: u.phone ?? '—',
      isArchived: u.isArchived ? 'Ano' : 'Ne',
    },
    raw: u,
  }
}

const DEFAULT_SORT: ListViewSortState = { key: 'displayName', dir: 'asc' }

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
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [sort, setSort] = useState<ListViewSortState>(DEFAULT_SORT)
  const [isDirty, setIsDirty] = useState(false)
  const [detailLandlord, setDetailLandlord] = useState<DetailUiLandlord | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const submitRef = useRef<null | (() => Promise<DetailUiLandlord | null>)>(null)
  const fromListViewRef = useRef(true) // true = přišlo ze seznamu, false = z detailu

  // Load detail landlord
  const loadDetailLandlord = useCallback(async (id: string) => {
    if (detailLoading) return
    setDetailLoading(true)
    try {
      const detail = await getLandlordDetail(id)
      const s: any = detail?.subject ?? {}

      const uiLandlord: DetailUiLandlord = {
        id: String(s.id ?? id),
        displayName: String(s.display_name ?? ''),
        email: s.email ?? null,
        phone: s.phone ?? null,
        subjectType: s.subject_type ?? null,
        isArchived: !!s.is_archived,
        createdAt: String(s.created_at ?? ''),

        titleBefore: s.title_before ?? null,
        firstName: s.first_name ?? null,
        lastName: s.last_name ?? null,
        note: s.note ?? null,

        birthDate: s.birth_date ?? null,
        personalIdNumber: s.personal_id_number ?? null,
        idDocType: s.id_doc_type ?? null,
        idDocNumber: s.id_doc_number ?? null,

        companyName: s.company_name ?? null,
        ic: s.ic ?? null,
        dic: s.dic ?? null,
        icValid: s.ic_valid ?? null,
        dicValid: s.dic_valid ?? null,
        delegateId: s.delegate_id ?? null,

        street: s.street ?? null,
        city: s.city ?? null,
        zip: s.zip ?? null,
        houseNumber: s.house_number ?? null,
        country: s.country ?? 'CZ',
      }

      setDetailLandlord(uiLandlord)
    } catch (err: any) {
      logger.error('loadDetailLandlord failed', err)
      toast.showError('Nepodařilo se načíst detail pronajimatele')
    } finally {
      setDetailLoading(false)
    }
  }, [detailLoading, toast, logger])

  // Sync propSubjectTypeFilter to state
  useEffect(() => {
    if (propSubjectTypeFilter !== undefined) {
      setSubjectTypeFilter(propSubjectTypeFilter)
    }
  }, [propSubjectTypeFilter])

  // URL state management
  useEffect(() => {
    const id = searchParams?.get('id') || null
    const vm = (searchParams?.get('vm') || 'list') as ViewMode
    const type = searchParams?.get('type') || null

    // Pokud je propSubjectTypeFilter předán, použijeme ho a ignorujeme URL type
    // Jinak použijeme URL type (pokud existuje)
    if (!propSubjectTypeFilter && type) {
      setSubjectTypeFilter(type)
    } else if (propSubjectTypeFilter) {
      setSubjectTypeFilter(propSubjectTypeFilter)
    }

    // Načíst detail pronajimatele, pokud je vybrán
    if (id && (vm === 'read' || vm === 'edit')) {
      setSelectedId(id)
      setViewMode(vm || 'read')
      loadDetailLandlord(id)
    } else {
      setSelectedId(null)
      setViewMode('list')
      setDetailLandlord(null)
    }
  }, [searchParams, loadDetailLandlord, propSubjectTypeFilter])

  const setUrl = useCallback(
    (next: { t?: string | null; id?: string | null; vm?: string | null; type?: string | null }, mode: 'replace' | 'push' = 'replace') => {
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

      if (nextUrl === currentUrl) return

      if (mode === 'push') router.push(nextUrl)
      else router.replace(nextUrl)
    },
    [pathname, router, searchKey]
  )

  // Load data
  const loadInFlightRef = useRef<Promise<void> | null>(null)
  const lastLoadKeyRef = useRef<string>('')

  const load = useCallback(async () => {
    const key = `${(filterText ?? '').trim().toLowerCase()}|${showArchived ? '1' : '0'}|${subjectTypeFilter ?? ''}`

    if (loadInFlightRef.current && lastLoadKeyRef.current === key) return loadInFlightRef.current
    lastLoadKeyRef.current = key

    const p = (async () => {
      setLoading(true)
      setError(null)
      try {
        const rows = await listLandlords({
          searchText: filterText,
          subjectType: subjectTypeFilter,
          includeArchived: showArchived,
        })
        setLandlords(rows.map(mapRowToUi))
      } catch (e: any) {
        logger.error('listLandlords failed', e)
        setError(e?.message ?? 'Chyba načtení pronajímatelů')
        toast.showError('Nepodařilo se načíst pronajimatele')
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
  }, [filterText, showArchived, subjectTypeFilter, toast])

  useEffect(() => {
    load()
  }, [load])

  // CommonActions registration
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
    onRegisterCommonActionHandler?.(async (id: CommonActionId) => {
      if (id === 'save' && submitRef.current) {
        const saved = await submitRef.current()
        if (saved) {
          // Aktualizovat detail
          setDetailLandlord(saved)
          // Přesměrovat podle odkud přišel: ze seznamu zpět do seznamu, z detailu zpět do detailu
          if (fromListViewRef.current) {
            // Ze seznamu → zpět do seznamu
            setViewMode('list')
            setSelectedId(null)
            setUrl({ t: 'landlords-list', id: null, vm: null })
            // Obnovit seznam
            load()
          } else {
            // Z detailu → zpět do detailu (read mode)
            setViewMode('read')
            setUrl({ t: 'landlords-list', id: saved.id, vm: 'read' })
          }
          setIsDirty(false)
        }
      }
      if (id === 'cancel') {
        if (fromListViewRef.current) {
          // Ze seznamu → zpět do seznamu
          setViewMode('list')
          setSelectedId(null)
          setUrl({ t: 'landlords-list', id: null, vm: null })
        } else {
          // Z detailu → zpět do detailu (read mode)
          setViewMode('read')
          if (selectedId) {
            setUrl({ t: 'landlords-list', id: selectedId, vm: 'read' })
          }
        }
        setIsDirty(false)
      }
      if (id === 'edit' && selectedId) {
        fromListViewRef.current = false // Z detailu
        setViewMode('edit')
        setUrl({ t: 'landlords-list', id: selectedId, vm: 'edit' })
      }
      // TODO: Implementovat delete a archive
    })
  }, [selectedId, onRegisterCommonActionHandler, setUrl, load])

  const handleRowClick = useCallback(
    (row: ListViewRow<UiLandlord>) => {
      const id = row?.id ? String(row.id) : null
      setSelectedId(id)
      if (id) {
        fromListViewRef.current = true // Ze seznamu
        setViewMode('read')
        setUrl({ t: 'landlords-list', id, vm: 'read' }, 'push')
        // Načíst detail
        loadDetailLandlord(id)
      } else {
        setViewMode('list')
        setUrl({ t: 'landlords-list', id: null, vm: null })
        setDetailLandlord(null)
      }
    },
    [setUrl, loadDetailLandlord]
  )

  const rows = useMemo(() => landlords.map(toRow), [landlords])

  const handleSortChange = useCallback((next: ListViewSortState) => {
    setSort(next ?? DEFAULT_SORT)
  }, [])

  return (
    <TileLayout title="Přehled pronajímatelů" description="Seznam všech pronajímatelů">
      <div style={{ padding: '1.5rem' }}>
        {error && (
          <div style={{ padding: '1rem', backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error)', borderRadius: '4px', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {viewMode === 'list' && (
          <>
            {/* Filtry */}
            <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Hledat podle názvu, emailu, telefonu..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                style={{ flex: 1, padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px' }}
              />
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
                  <option value="osoba">Osoba</option>
                  <option value="osvc">OSVČ</option>
                  <option value="firma">Firma</option>
                  <option value="spolek">Spolek</option>
                  <option value="statni">Státní</option>
                  <option value="zastupce">Zástupce</option>
                </select>
              )}
              {propSubjectTypeFilter && (
                <div style={{ padding: '0.5rem', color: 'var(--color-text-muted)' }}>
                  Filtr: {propSubjectTypeFilter}
                </div>
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
                Zobrazit archivované
              </label>
            </div>

            {/* ListView */}
            {loading ? (
              <div>Načítání...</div>
            ) : (
              <ListView
                columns={BASE_COLUMNS}
                rows={rows}
                filterValue={filterText}
                onFilterChange={setFilterText}
                showArchived={showArchived}
                onShowArchivedChange={setShowArchived}
                selectedId={selectedId}
                onRowClick={handleRowClick}
                sort={sort}
                onSortChange={handleSortChange}
                emptyText="Žádní pronajímatelé."
              />
            )}
          </>
        )}

        {(viewMode === 'read' || viewMode === 'edit') && selectedId && detailLandlord && (
          <div>
            {detailLoading ? (
              <div>Načítání detailu...</div>
            ) : (
              <LandlordDetailFrame
                landlord={detailLandlord}
                viewMode={viewMode}
                onRegisterSubmit={(fn) => {
                  submitRef.current = fn
                }}
                onDirtyChange={setIsDirty}
                onSaved={(saved) => {
                  // Aktualizovat detail po uložení
                  setDetailLandlord(saved)
                  // Aktualizovat seznam (pokud je načten) - mapování na UiLandlord
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
                  }
                  const updated = landlords.map((l) => (l.id === saved.id ? mapRowToUi(updatedListRow) : l))
                  setLandlords(updated)
                }}
              />
            )}
          </div>
        )}
      </div>
    </TileLayout>
  )
}

