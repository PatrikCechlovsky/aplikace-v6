'use client'

/**
 * FILE: app/UI/detail-sections/DetailAttachmentsSection.tsx
 *
 * VARIANTY:
 * - variant="list"    => read-only seznam (tab u entity): filtr + archiv + otevřít soubor
 * - variant="manager" => plná správa (samostatný screen po 📎): upload, verze, historie, metadata
 *
 * PRAVIDLO:
 * - V manager variantě nejsou žádné lokální toolbary / tlačítkové panely.
 * - Všechny akce se volají přes CommonActions (nahoře) a jdou sem přes API.
 */

// ============================================================================
// 1) IMPORTS
// ============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ListView, { type ListViewRow, type ListViewSortState } from '@/app/UI/ListView'
import ListViewColumnsDrawer from '@/app/UI/ListViewColumnsDrawer'

import {
  addAttachmentVersionWithUpload,
  createAttachmentWithUpload,
  getAttachmentSignedUrl,
  listAttachments,
  listAttachmentVersions,
  loadUserDisplayNames,
  updateAttachmentMetadata,
  type AttachmentRow,
  type AttachmentVersionRow,
  type UserNameMap,
} from '@/app/lib/attachments'

import { applyColumnPrefs, loadViewPrefs, saveViewPrefs, type ViewPrefs, type ViewPrefsSortState } from '@/app/lib/services/viewPrefs'
import { ATTACHMENTS_VIEW_KEY, getAttachmentsColumns } from '@/app/UI/attachments/attachmentsColumns'
import { formatDateTime } from '@/app/lib/formatters/formatDateTime'

// ============================================================================
// 2) TYPES
// ============================================================================
export type AttachmentsManagerUiState = {
  hasSelection: boolean
  isDirty: boolean
  mode: 'list' | 'read' | 'edit' | 'new'
}

export type AttachmentsManagerApi = {
  // state
  hasSelection: () => boolean
  isDirty: () => boolean

  // actions
  add: () => void
  view: () => void
  edit: () => void
  save: () => Promise<void>
  newVersion: () => void
  columnSettings: () => void
  close: () => void
}

export type DetailAttachmentsSectionProps = {
  entityType: string
  entityId: string
  entityLabel?: string | null
  mode: 'view' | 'edit' | 'create'
  variant?: 'list' | 'manager'

  /** Pokud false => i manager je pouze read-only */
  canManage?: boolean

  /** Volitelný text, proč je správa jen read-only */
  readOnlyReason?: string | null

  /** Manager: API pro rodiče (UsersTile/CommonActions) */
  onRegisterManagerApi?: (api: AttachmentsManagerApi | null) => void

  /** Manager: hlášení state změn (aby se přepínal Save apod.) */
  onManagerStateChange?: (s: AttachmentsManagerUiState) => void
}

// ============================================================================
// 3) HELPERS
// ============================================================================
function mergeNameMaps(a: UserNameMap, b: UserNameMap): UserNameMap {
  return { ...a, ...b }
}

function normalizeAuthError(msg: string) {
  const m = (msg ?? '').toLowerCase()
  if (m.includes('jwt') || m.includes('permission') || m.includes('not allowed') || m.includes('rls') || m.includes('401') || m.includes('403')) {
    return 'Nemáš oprávnění zobrazit přílohy této entity.'
  }
  return msg
}
// ============================================================================
// SORT HELPERS (ListView)
// ============================================================================

function normalizeString(v: any): string {
  return String(v ?? '')
    .trim()
    .toLowerCase()
}

function numberOrZero(v: any): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function dateToTs(v: any): number {
  const t = new Date(v ?? 0).getTime()
  return Number.isFinite(t) ? t : 0
}

function getAttachmentSortValue(row: any, key: string): string | number {
  // klíče: title, description, file, ver, uploaded (odpovídá sharedColumns)
  if (key === 'title') return normalizeString(row?.title)
  if (key === 'description') return normalizeString(row?.description)
  if (key === 'file') return normalizeString(row?.file_name)
  if (key === 'ver') return numberOrZero(row?.version_number)
  if (key === 'uploaded') return dateToTs(row?.version_created_at)
  return normalizeString(row?.[key])
}

// Removed unused function getHistorySortValue

// ============================================================================
// 4) DATA LOAD
// ============================================================================

export default function DetailAttachmentsSection({
  entityType,
  entityId,
  entityLabel = null,
  mode,
  variant = 'list',
  canManage = true,
  readOnlyReason = null,
  onRegisterManagerApi,
  onManagerStateChange,
}: DetailAttachmentsSectionProps) {
  const isManagerRequested = variant === 'manager'
  const isManager = isManagerRequested && canManage !== false

  // ✅ viewKey per-variant (list vs manager)
  const VIEW_KEY = ATTACHMENTS_VIEW_KEY
  

  const canLoad = useMemo(() => !!entityType && !!entityId && entityId !== 'new', [entityType, entityId])

  const [includeArchived, setIncludeArchived] = useState(false)
  const [filterText, setFilterText] = useState('')

  const [loading, setLoading] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)
  const [rows, setRows] = useState<AttachmentRow[]>([])
  

  // ============================================================================
  // SORT (Attachments – společný pro list + manager + history)
  // ============================================================================
  const DEFAULT_SORT: NonNullable<ListViewSortState> = useMemo(() => ({ key: 'uploaded', dir: 'desc' }), [])
  const [sort, setSort] = useState<NonNullable<ListViewSortState>>(DEFAULT_SORT)

  // ✅ Column prefs
  const [colPrefs, setColPrefs] = useState<Pick<ViewPrefs, 'colWidths' | 'colOrder' | 'colHidden'>>({
    colWidths: {},
    colOrder: [],
    colHidden: [],
  })

  // ✅ Columns drawer (Sloupce)
  const [colsOpen, setColsOpen] = useState(false)

  const handleColumnResize = useCallback((key: string, px: number) => {
    setColPrefs((p) => ({ ...p, colWidths: { ...(p.colWidths ?? {}), [key]: px } }))
  }, [])
  
  // ✅ prefs load/save
  const prefsLoadedRef = useRef(false)
  const saveTimerRef = useRef<any>(null)

  useEffect(() => {
    void (async () => {
      const prefs = await loadViewPrefs(VIEW_KEY, { v: 1, sort: null, colWidths: {}, colOrder: [], colHidden: [] })

      const loadedSort = (prefs.sort as ViewPrefsSortState) ?? null
      setSort((loadedSort ? loadedSort : DEFAULT_SORT) as NonNullable<ListViewSortState>)

      setColPrefs({
        colWidths: prefs.colWidths ?? {},
        colOrder: prefs.colOrder ?? [],
        colHidden: prefs.colHidden ?? [],
      })

      prefsLoadedRef.current = true
    })()
  }, [VIEW_KEY, DEFAULT_SORT])

  useEffect(() => {
    if (!prefsLoadedRef.current) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)

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
  }, [VIEW_KEY, sort, DEFAULT_SORT, colPrefs])

  // ✅ Sort handler (plus tvoje special-case logika pro uploaded reset může zůstat – tady držím Users pattern)
  const handleSortChange = useCallback(
    (next: ListViewSortState) => {
      setSort((prev) => {
        if (next) return next

        const isDefault = prev.key === DEFAULT_SORT.key && prev.dir === DEFAULT_SORT.dir

        // aby se to nezamklo na uploaded DESC (reset == default)
        if (isDefault && DEFAULT_SORT.key === 'uploaded' && DEFAULT_SORT.dir === 'desc') {
          return { key: 'uploaded', dir: 'asc' }
        }

        return DEFAULT_SORT
      })
    },
    [DEFAULT_SORT]
  )

  // selection (manager)
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [readModeOpen, setReadModeOpen] = useState(false) // Rozlišuje mezi zvýrazněním a otevřeným read mode
  const doubleClickRef = useRef(false) // Flag pro detekci dvojkliku
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const selectedRow = useMemo(() => {
    if (!selectedDocId) return null
    return rows.find((x) => x.id === selectedDocId) ?? null
  }, [rows, selectedDocId])

  // versions (musí být před useEffect, který to používá)
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null)
  const [versionsByDocId, setVersionsByDocId] = useState<Record<string, AttachmentVersionRow[]>>({})
  const [versionsLoadingId, setVersionsLoadingId] = useState<string | null>(null)

  // fallback userId -> display_name
  const [nameById, setNameById] = useState<UserNameMap>({})

  // anti-storm load guards
  const loadInFlightRef = useRef<Promise<void> | null>(null)
  const lastLoadKeyRef = useRef<string>('')

  // new attachment panel (manager)
  const [panelOpen, setPanelOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newFile, setNewFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const panelDirty = useMemo(() => !!newTitle.trim() || !!newDesc.trim() || !!newFile, [newTitle, newDesc, newFile])

  // edit metadata (manager)
  const [editingDocId, setEditingDocId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  const metaDirty = useMemo(() => {
    if (!editingDocId) return false
    const current = rows.find((x) => x.id === editingDocId)
    if (!current) return true
    const t1 = (editTitle ?? '').trim()
    const d1 = (editDesc ?? '').trim()
    const t0 = (current.title ?? '').trim()
    const d0 = (current.description ?? '').trim()
    return t1 !== t0 || d1 !== d0
  }, [editingDocId, editTitle, editDesc, rows])

  // file inputs for "new version"
  const versionInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const setVersionInputRef = useCallback((documentId: string, el: HTMLInputElement | null) => {
    versionInputRefs.current[documentId] = el
  }, [])

  const refreshNamesFromRows = useCallback(async (items: AttachmentRow[]) => {
    const ids: (string | null | undefined)[] = []
    for (const r of items) {
      ids.push(r.updated_by ?? null)
      ids.push(r.version_created_by ?? null)
      ids.push(r.created_by ?? null)
    }
    const map = await loadUserDisplayNames(ids)
    setNameById((prev) => mergeNameMaps(prev, map))
  }, [])

  const refreshNamesFromVersions = useCallback(async (items: AttachmentVersionRow[]) => {
    const ids = items.map((v) => v.created_by)
    const map = await loadUserDisplayNames(ids)
    setNameById((prev) => mergeNameMaps(prev, map))
  }, [])

  const loadAttachments = useCallback(async () => {
    const key = `${entityType}:${entityId}:${includeArchived ? '1' : '0'}`

    if (loadInFlightRef.current && lastLoadKeyRef.current === key) return loadInFlightRef.current
    lastLoadKeyRef.current = key

    const p = (async () => {
      setLoading(true)
      setErrorText(null)
      try {
        const data = await listAttachments({ entityType, entityId, includeArchived })
        setRows(data)

        // zachovat výběr, pokud existuje
        if (selectedDocId && !data.some((x) => x.id === selectedDocId)) {
          setSelectedDocId(null)
        }

        await refreshNamesFromRows(data)
      } catch (e: any) {
        setErrorText(normalizeAuthError(e?.message ?? 'Chyba načítání příloh.'))
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
  }, [entityType, entityId, includeArchived, refreshNamesFromRows, selectedDocId])

  useEffect(() => {
    if (!canLoad) return
    void loadAttachments()
  }, [canLoad, loadAttachments])

  const filteredRows = useMemo(() => {
    const t = filterText.trim().toLowerCase()
    if (!t) return rows
  
    return rows.filter((r) => {
      const a = (r.title ?? '').toLowerCase()
      const b = (r.description ?? '').toLowerCase()
      const c = (r.file_name ?? '').toLowerCase()
      return a.includes(t) || b.includes(t) || c.includes(t)
    })
  }, [rows, filterText])

  // ============================================================================
  // SORTED ROWS (Attachments)
  // ============================================================================
  const viewRows = useMemo(() => {
    const key = String(sort.key ?? '').trim()
    const dir = sort.dir === 'asc' ? 1 : -1
    const arr = [...filteredRows]
  
    arr.sort((a, b) => {
      const av = getAttachmentSortValue(a, key)
      const bv = getAttachmentSortValue(b, key)
  
      if (typeof av === 'number' && typeof bv === 'number') {
        if (av < bv) return -1 * dir
        if (av > bv) return 1 * dir
        return 0
      }
  
      const as = String(av ?? '')
      const bs = String(bv ?? '')
      if (as < bs) return -1 * dir
      if (as > bs) return 1 * dir
      return 0
    })
  
    return arr
  }, [filteredRows, sort])


  const resolveName = useCallback(
    (nameFromView: string | null | undefined, userId: string | null | undefined) => {
      if (nameFromView && nameFromView.trim()) return nameFromView
      if (userId && nameById[userId]) return nameById[userId]
      return '—'
    },
    [nameById]
  )

// ============================================================================
// 5) ACTION HANDLERS
// ============================================================================
  const openFileByPath = useCallback(async (filePath: string) => {
    const url = await getAttachmentSignedUrl({ filePath, expiresInSeconds: 60 })
    window.open(url, '_blank', 'noopener,noreferrer')
  }, [])

  const handleOpenLatestByPath = useCallback(async (filePath: string | null | undefined) => {
    if (!filePath) return
    setErrorText(null)
    try {
      const url = await getAttachmentSignedUrl({ filePath, expiresInSeconds: 60 })
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err: any) {
      setErrorText(err?.message ?? 'Nepodařilo se otevřít přílohu.')
    }
  }, [])

  const resetPanel = useCallback(() => {
    setNewTitle('')
    setNewDesc('')
    setNewFile(null)
  }, [])

  const managerUiState: AttachmentsManagerUiState = useMemo(() => {
    let mode: 'list' | 'read' | 'edit' | 'new' = 'list'
    if (panelOpen) {
      mode = 'new'
    } else if (editingDocId) {
      mode = 'edit'
    } else if (readModeOpen && selectedDocId) {
      mode = 'read'
    }

    return {
      hasSelection: !!selectedDocId || !!editingDocId, // V edit módu je editingDocId místo selectedDocId
      isDirty: !!panelDirty || !!metaDirty,
      mode,
    }
  }, [selectedDocId, editingDocId, panelDirty, metaDirty, panelOpen, readModeOpen])

  // ✅ hlášení stavu nahoru (kvůli Save/disabled v CommonActions)
  useEffect(() => {
    if (!isManager) return
    onManagerStateChange?.(managerUiState)
  }, [isManager, managerUiState, onManagerStateChange])

  const ensureSelected = useCallback(() => {
    if (!isManager) return null
    if (!selectedDocId) {
      setErrorText('Nejdřív vyber řádek přílohy v seznamu.')
      return null
    }
    const r = rows.find((x) => x.id === selectedDocId) ?? null
    if (!r) {
      setErrorText('Vybraný řádek už neexistuje.')
      return null
    }
    return r
  }, [isManager, rows, selectedDocId])

  const handleActionAdd = useCallback(() => {
    if (!isManager) return
    setErrorText(null)
    setPanelOpen(true)
  }, [isManager])

  const handleActionSaveNew = useCallback(async () => {
    if (!isManager) return
    setErrorText(null)
    if (!panelOpen) return

    const title = newTitle.trim()
    if (!title) return setErrorText('Chybí název přílohy.')
    if (!newFile) return setErrorText('Vyber soubor.')

    setSaving(true)
    try {
      await createAttachmentWithUpload({
        entityType,
        entityId,
        entityLabel,
        title,
        description: newDesc.trim() ? newDesc.trim() : null,
        file: newFile,
      })
      setPanelOpen(false)
      resetPanel()
      await loadAttachments()
    } catch (e: any) {
      setErrorText(normalizeAuthError(e?.message ?? 'Nepodařilo se přidat přílohu.'))
    } finally {
      setSaving(false)
    }
  }, [isManager, panelOpen, newTitle, newDesc, newFile, entityType, entityId, entityLabel, resetPanel, loadAttachments])

  const handleStartEditMeta = useCallback(
    (r: AttachmentRow) => {
      if (!isManager) return
      setErrorText(null)
      setEditingDocId(r.id)
      setEditTitle(r.title ?? '')
      setEditDesc(r.description ?? '')
    },
    [isManager]
  )

  const handleSaveEditMeta = useCallback(async () => {
    if (!isManager) return
    if (!editingDocId) return
    setErrorText(null)

    const title = editTitle.trim()
    if (!title) return setErrorText('Chybí název přílohy.')

    setEditSaving(true)
    try {
      await updateAttachmentMetadata({
        documentId: editingDocId,
        title,
        description: editDesc.trim() ? editDesc.trim() : null,
      })
      setEditingDocId(null)
      await loadAttachments()
    } catch (e: any) {
      setErrorText(normalizeAuthError(e?.message ?? 'Nepodařilo se uložit metadata.'))
    } finally {
      setEditSaving(false)
    }
  }, [isManager, editingDocId, editTitle, editDesc, loadAttachments])

  const handlePickNewVersion = useCallback(
    (documentId: string) => {
      if (!isManager) return
      const el = versionInputRefs.current[documentId]
      if (!el) return
      el.click()
    },
    [isManager]
  )

  const handleNewVersionSelected = useCallback(
    async (documentId: string, file: File | null) => {
      if (!isManager) return
      if (!file) return
      setErrorText(null)

      try {
        await addAttachmentVersionWithUpload({
          documentId,
          entityType,
          entityId,
          entityLabel,
          file,
        })

        // reset input (kvůli opětovnému výběru stejného souboru)
        const el = versionInputRefs.current[documentId]
        if (el) el.value = ''

        await loadAttachments()

        // refresh versions if history open
        if (expandedDocId === documentId) {
          const versions = await listAttachmentVersions({ documentId, includeArchived: true })
          setVersionsByDocId((prev) => ({ ...prev, [documentId]: versions }))
          await refreshNamesFromVersions(versions)
        }
      } catch (e: any) {
        setErrorText(normalizeAuthError(e?.message ?? 'Nepodařilo se přidat novou verzi.'))
      }
    },
    [isManager, entityType, entityId, entityLabel, loadAttachments, expandedDocId, refreshNamesFromVersions]
  )

  const handleToggleHistory = useCallback(
    async (documentId: string) => {
      if (!isManager) return
      setErrorText(null)
  
      // close
      if (expandedDocId === documentId) {
        setExpandedDocId(null)
        return
      }
  
      // open
      setExpandedDocId(documentId)
  
      // ✅ vždy reload (ať se neukazuje stará zkrácená cache)
      setVersionsLoadingId(documentId)
      try {
        const versions = await listAttachmentVersions({ documentId, includeArchived: true })
        setVersionsByDocId((prev) => ({ ...prev, [documentId]: versions }))
        await refreshNamesFromVersions(versions)
      } catch (e: any) {
        setErrorText(normalizeAuthError(e?.message ?? 'Nepodařilo se načíst historii.'))
      } finally {
        setVersionsLoadingId(null)
      }
    },
    [isManager, expandedDocId, refreshNamesFromVersions]
  )

  // Automaticky otevřít historii při výběru přílohy
  useEffect(() => {
    if (!isManager) return
    if (!selectedDocId) {
      setExpandedDocId(null)
      return
    }
    // Pokud je vybraná jiná příloha než ta, která má otevřenou historii, otevřít historii
    if (expandedDocId !== selectedDocId) {
      void handleToggleHistory(selectedDocId)
    }
  }, [isManager, selectedDocId, expandedDocId, handleToggleHistory])

  // ✅ API pro CommonActions (přes rodiče)
  useEffect(() => {
    if (!onRegisterManagerApi) return
    if (!isManager) {
      onRegisterManagerApi(null)
      return
    }

    const api: AttachmentsManagerApi = {
      hasSelection: () => !!selectedDocId,
      isDirty: () => !!panelDirty || !!metaDirty,

      add: () => {
        // Zavřít předchozí režimy
        if (readModeOpen) {
          setReadModeOpen(false)
        }
        if (editingDocId) {
          setEditingDocId(null)
          setEditTitle('')
          setEditDesc('')
        }
        if (selectedDocId) {
          setSelectedDocId(null)
          setExpandedDocId(null)
        }
        handleActionAdd()
      },

      view: () => {
        // Dvojklik nebo tlačítko Read → read režim
        const r = ensureSelected()
        if (!r) return
        // Zavřít předchozí režimy
        if (panelOpen) {
          setPanelOpen(false)
          resetPanel()
        }
        if (editingDocId) {
          setEditingDocId(null)
          setEditTitle('')
          setEditDesc('')
        }
        setReadModeOpen(true)
        // Automaticky otevřít historii při přechodu do read režimu
        if (expandedDocId !== r.id) {
          void handleToggleHistory(r.id)
        }
      },

      edit: () => {
        const r = ensureSelected()
        if (!r) return
        // Zavřít předchozí režimy
        if (panelOpen) {
          setPanelOpen(false)
          resetPanel()
        }
        if (readModeOpen) {
          setReadModeOpen(false)
        }
        handleStartEditMeta(r)
      },

      save: async () => {
        if (panelOpen) {
          await handleActionSaveNew()
          return
        }
        if (editingDocId) {
          await handleSaveEditMeta()
          return
        }
      },

      newVersion: () => {
        // V edit módu používáme editingDocId místo selectedDocId
        const docId = editingDocId || selectedDocId
        if (!docId) {
          setErrorText('Nejdřív vyber nebo otevři přílohu.')
          return
        }
        handlePickNewVersion(docId)
      },

      columnSettings: () => {
        setColsOpen(true)
      },

      close: () => {
        // Zavřít read/edit mode a vrátit se do list mode
        if (readModeOpen) {
          setReadModeOpen(false)
        }
        if (editingDocId) {
          setEditingDocId(null)
          setEditTitle('')
          setEditDesc('')
        }
        if (panelOpen) {
          setPanelOpen(false)
          resetPanel()
        }
        // Necháme selectedDocId, aby zůstal zvýrazněný řádek
      },
    }

    onRegisterManagerApi(api)
    return () => onRegisterManagerApi(null)
  }, [
    onRegisterManagerApi,
    isManager,
    selectedDocId,
    panelDirty,
    metaDirty,
    panelOpen,
    editingDocId,
    ensureSelected,
    handleActionAdd,
    handleStartEditMeta,
    handlePickNewVersion,
    handleToggleHistory,
    handleActionSaveNew,
    handleSaveEditMeta,
  ])

// ============================================================================
// 6) RENDER
// ============================================================================
  if (!canLoad) {
    return (
      <div className="detail-view__section">
        <div className="detail-form__hint">
          Přílohy budou dostupné po uložení záznamu.
          <br />
          Režim: <strong>{mode}</strong>
        </div>
      </div>
    )
  }

  // V manager variantě nechceme zobrazovat nadpis "Přílohy" - je to v TileLayout
  const sectionTitle = isManager ? null : 'Přílohy (read-only)'


  const sharedColumnsBase = useMemo(() => {
    return getAttachmentsColumns({ variant: isManager ? 'manager' : 'list' })
  }, [isManager])

  const sharedColumns = useMemo(() => {
    return applyColumnPrefs(sharedColumnsBase, colPrefs)
  }, [sharedColumnsBase, colPrefs])

  // ✅ Drawer rules (bezpečně – nic nevymýšlíme mimo columns)
  const fixedFirstKey = sharedColumnsBase?.[0]?.key ?? ''
  const requiredKeys = fixedFirstKey ? [fixedFirstKey] : []


  const listRows: ListViewRow<AttachmentRow>[] = useMemo(() => {
    return viewRows.map((r) => {
      const uploadedName = resolveName(
        r.version_created_by_name ?? null,
        r.version_created_by ?? null
      )
  
      return {
        id: r.id,
        raw: r,
        data: {
          title: (
            <span className="detail-attachments__cell-title">
              {r.title ?? '—'}
              {r.is_archived ? (
                <span className="detail-attachments__archived-badge">archiv</span>
              ) : null}
            </span>
          ),
          description: <span className="detail-attachments__muted">{r.description ?? '—'}</span>,
          file: (
            <button
              type="button"
              className="detail-attachments__link"
              onClick={(e) => {
                e.stopPropagation() // Zabraň propagaci kliknutí na řádek
                // Kliknutí na odkaz → otevře read mode
                setSelectedDocId(String(r.id))
                setReadModeOpen(true)
                // Automaticky otevřít historii
                if (expandedDocId !== String(r.id)) {
                  void handleToggleHistory(String(r.id))
                }
              }}
              disabled={!r.file_path}
            >
              {r.file_name ?? '—'}
            </button>
          ),
          ver: <span className="detail-attachments__muted">v{String(r.version_number ?? 0).padStart(3, '0')}</span>,
          uploaded: (
            <span className="detail-attachments__muted">
              {formatDateTime(r.version_created_at)} • kdo: {uploadedName}
            </span>
          ),
        },
      }
    })
  }, [viewRows, resolveName, handleOpenLatestByPath])


  // READ-ONLY UI (nebo manager bez práv)
  if (!isManager) {
    return (
      <div className="detail-view__section">
        {isManagerRequested && (
          <div className="detail-form__hint">
            <strong>Správa příloh je pouze pro čtení.</strong>
            <div className="detail-form__hint-sub">
              {readOnlyReason ?? 'Nemáš oprávnění měnit přílohy nebo je entita archivovaná.'}
            </div>
          </div>
        )}

        <div className="detail-form">
          <section className="detail-form__section">
            <h3 className="detail-form__section-title">{sectionTitle}</h3>

            {loading && <div className="detail-form__hint">Načítám přílohy…</div>}

            {!loading && errorText && (
              <div className="detail-form__hint">
                Chyba: <strong>{errorText}</strong>
              </div>
            )}

            {!loading && !errorText && listRows.length === 0 && <div className="detail-form__hint">Zatím žádné přílohy.</div>}

            {!loading && !errorText && listRows.length > 0 && (
              <ListView
                columns={sharedColumns}
                rows={listRows}
                sort={sort}
                onSortChange={handleSortChange}
                filterValue={filterText}
                onFilterChange={setFilterText}
                filterPlaceholder="Hledat podle názvu, popisu nebo souboru..."
                showArchived={includeArchived}
                onShowArchivedChange={setIncludeArchived}
                showArchivedLabel="Zobrazit archivované"
                onRowDoubleClick={(row) => void handleOpenLatestByPath(row.raw?.file_path)}
                onColumnResize={handleColumnResize}
              />
            )}

            {/* ✅ Sloupce (Drawer) */}
            <ListViewColumnsDrawer
              open={colsOpen}
              columns={sharedColumnsBase as any}
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
              onClose={() => setColsOpen(false)}
            />
          </section>
        </div>
      </div>
    )
  }
  // ==========================================================================
  // MANAGER (ListView + panel + verze/historie) – bez lokálních tlačítek
  // ==========================================================================
  const managerRows: ListViewRow<AttachmentRow>[] = listRows
  const expandedVersions = expandedDocId ? versionsByDocId[expandedDocId] ?? [] : []

  // history rows (sloupce stejné jako nahoře)
  // Filtr z historie byl odstraněn podle požadavku uživatele
  const historyRows: ListViewRow<AttachmentVersionRow>[] = useMemo(() => {
    if (!expandedDocId) return []
    return expandedVersions.map((v) => {
      const who = resolveName(null, v.created_by)

      // ✅ snapshot metadat pro konkrétní verzi (fallback pro staré řádky)
      const vTitle = (v.title ?? selectedRow?.title) ?? '—'
      const vDesc = (v.description ?? selectedRow?.description) ?? '—'

      return {
        id: v.id,
        raw: v,
        data: {
          title: (
            <span className="detail-attachments__cell-title">
              {vTitle}
              {v.is_archived ? <span className="detail-attachments__archived-badge">archiv</span> : null}
            </span>
          ),
          description: <span className="detail-attachments__muted">{vDesc}</span>,
          file: (
            <button
              type="button"
              className="detail-attachments__link"
              onClick={() => void openFileByPath(v.file_path)}
              disabled={!v.file_path}
              title={v.file_name ?? ''}
              aria-label={v.file_name ?? 'Otevřít verzi'}
            >
              {v.file_name ?? '—'}
            </button>
          ),
          ver: <span className="detail-attachments__muted">v{String(v.version_number ?? 0).padStart(3, '0')}</span>,
          uploaded: (
            <span className="detail-attachments__muted">
              {formatDateTime(v.created_at)} • kdo: {who}
            </span>
          ),
        },
      }
    })
  }, [expandedDocId, expandedVersions, resolveName, openFileByPath, selectedRow])

  const selectedTitle = selectedRow?.title?.trim() ? selectedRow.title : '—'

  return (
    <div className={`detail-view__section ${isManager ? 'detail-attachments__manager-wrapper' : ''}`}>
      <div className="detail-form">
        <section className={`detail-form__section ${isManager ? 'detail-attachments__manager-section' : ''}`}>
          {sectionTitle && <h3 className="detail-form__section-title">{sectionTitle}</h3>}

          {errorText && (
            <div className="detail-view__placeholder">
              Chyba: <strong>{errorText}</strong>
            </div>
          )}

          {/* PANEL: NOVÁ PŘÍLOHA (otevírá CommonActions → attachmentsAdd) */}
          {panelOpen && (
            <div className="detail-attachments__panel" style={{ marginTop: 10 }}>
              <div className="detail-attachments__panel-grid">
                <div className="detail-form__field">
                  <label className="detail-form__label">Název</label>
                  <input
                    className="detail-form__input"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Název přílohy"
                  />
                </div>

                <div className="detail-form__field">
                  <label className="detail-form__label">Popis</label>
                  <input
                    className="detail-form__input"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="(volitelné)"
                  />
                </div>

                <div className="detail-form__field detail-form__field--span-6">
                  <label className="detail-form__label">Soubor</label>
                  <input className="detail-form__input" type="file" onChange={(e) => setNewFile(e.target.files?.[0] ?? null)} />
                  {newFile && <div className="detail-form__hint">Vybráno: {newFile.name}</div>}
                </div>
              </div>

              {saving && <div className="detail-form__hint" style={{ marginTop: 10 }}>Ukládám…</div>}
              <div className="detail-form__hint" style={{ marginTop: 6 }}>
                Uložení se provádí přes CommonActions tlačítko <strong>Uložit</strong>.
              </div>
            </div>
          )}

          {/* PANEL: READ MODE (zobrazí se při dvojkliku) */}
          {readModeOpen && selectedDocId && !editingDocId && !panelOpen && (
            <div className="detail-attachments__panel" style={{ marginTop: 10 }}>
              <div className="detail-form__hint" style={{ marginBottom: 8 }}>Metadata přílohy</div>

              <div className="detail-attachments__panel-grid">
                <div className="detail-form__field">
                  <label className="detail-form__label">Název</label>
                  <input
                    className="detail-form__input detail-form__input--readonly"
                    value={selectedRow?.title ?? '—'}
                    readOnly
                  />
                </div>

                <div className="detail-form__field">
                  <label className="detail-form__label">Popis</label>
                  <input
                    className="detail-form__input detail-form__input--readonly"
                    value={selectedRow?.description ?? '—'}
                    readOnly
                  />
                </div>
              </div>
            </div>
          )}

          {/* PANEL: EDIT METADATA (otevírá CommonActions → attachmentsEdit) */}
          {editingDocId && (
            <div className="detail-attachments__panel" style={{ marginTop: 10 }}>
              <div className="detail-form__hint" style={{ marginBottom: 8 }}>Úprava metadat (název / popis)</div>

              <div className="detail-attachments__panel-grid">
                <div className="detail-form__field">
                  <label className="detail-form__label">Název</label>
                  <input className="detail-form__input" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                </div>

                <div className="detail-form__field">
                  <label className="detail-form__label">Popis</label>
                  <input className="detail-form__input" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
                </div>
              </div>

              {editSaving && <div className="detail-form__hint">Ukládám…</div>}
              <div className="detail-form__hint" style={{ marginTop: 6 }}>
                Uložení se provádí přes CommonActions tlačítko <strong>Uložit</strong>.
              </div>

              {/* Hidden file input pro tlačítko "Nová verze" v edit módu */}
              <input
                type="file"
                style={{ display: 'none' }}
                ref={(el) => setVersionInputRef(editingDocId, el)}
                onChange={(e) => void handleNewVersionSelected(editingDocId, e.target.files?.[0] ?? null)}
              />
            </div>
          )}

          {/* ========================= */}
          {/* MANAGER LAYOUT */}
          {/* ========================= */}
          {/* LIST MODE: zobrazit hlavní seznam */}
          {managerUiState.mode === 'list' && (
            <>
              {loading && <div className="detail-form__hint">Načítám přílohy…</div>}
              {!loading && managerRows.length === 0 && <div className="detail-form__hint">Zatím žádné přílohy.</div>}

              <div className="detail-attachments__manager-layout">
                {/* Hlavní tabulka: flex 1 + scroll uvnitř ListView */}
                <div className="detail-attachments__list-scroll">
                  {!loading && managerRows.length > 0 && (
                <div className="detail-attachments__lv-shell">
                  <ListView
                    columns={sharedColumns}
                    rows={managerRows}
                    sort={sort}
                    onSortChange={handleSortChange}
                    filterValue={filterText}
                    onFilterChange={setFilterText}
                    filterPlaceholder="Hledat podle názvu, popisu nebo souboru."
                    showArchived={includeArchived}
                    onShowArchivedChange={setIncludeArchived}
                    showArchivedLabel="Zobrazit archivované"
                    selectedId={selectedDocId}
                    onRowClick={(row) => {
                      // Zrušit timeout z předchozího kliknutí (pokud existuje)
                      if (clickTimeoutRef.current) {
                        clearTimeout(clickTimeoutRef.current)
                        clickTimeoutRef.current = null
                      }
                      
                      // Pokud byl právě dvojklik, ignorovat jednoduché kliknutí
                      if (doubleClickRef.current) {
                        doubleClickRef.current = false
                        return
                      }
                      
                      // Nastavit timeout - pokud mezitím přijde dvojklik, timeout se zruší
                      clickTimeoutRef.current = setTimeout(() => {
                        clickTimeoutRef.current = null
                        // Jednoduché kliknutí → pouze zvýrazní řádek (zůstane v list mode)
                        // Zavřít předchozí režimy při kliknutí na jiný řádek
                        if (panelOpen) {
                          setPanelOpen(false)
                          resetPanel()
                        }
                        if (editingDocId) {
                          setEditingDocId(null)
                          setEditTitle('')
                          setEditDesc('')
                        }
                        // Zavřít read mode při kliknutí na jiný řádek
                        if (readModeOpen) {
                          setReadModeOpen(false)
                          setExpandedDocId(null)
                        }
                        // Pouze zvýraznit řádek, neotevírat read mode
                        setSelectedDocId(String(row.id))
                      }, 200) // 200ms timeout pro detekci dvojkliku
                    }}
                    onRowDoubleClick={(row) => {
                      // Zrušit timeout z onClick (aby se neprovedl)
                      if (clickTimeoutRef.current) {
                        clearTimeout(clickTimeoutRef.current)
                        clickTimeoutRef.current = null
                      }
                      
                      // Nastavit flag, aby se onClick ignoroval
                      doubleClickRef.current = true
                      
                      // Dvojklik → rovnou otevře read režim (jako v seznamu users)
                      if (panelOpen) {
                        setPanelOpen(false)
                        resetPanel()
                      }
                      if (editingDocId) {
                        setEditingDocId(null)
                        setEditTitle('')
                        setEditDesc('')
                      }
                      // Nastavit selectedDocId a rovnou otevřít read mode
                      setSelectedDocId(String(row.id))
                      setReadModeOpen(true)
                      // Automaticky otevřít historii při dvojkliku
                      if (expandedDocId !== String(row.id)) {
                        void handleToggleHistory(String(row.id))
                      }
                      
                      // Resetovat flag po krátké době
                      setTimeout(() => {
                        doubleClickRef.current = false
                      }, 300)
                    }}
                    onColumnResize={handleColumnResize}
                  />
                </div>
              )}

              {/* hidden inputs pro newVersion */}
              <div style={{ display: 'none' }}>
                {filteredRows.map((r) => (
                  <input
                    key={r.id}
                    ref={(el) => setVersionInputRef(r.id, el)}
                    type="file"
                    className="detail-attachments__file-input"
                    onChange={(e) => void handleNewVersionSelected(r.id, e.target.files?.[0] ?? null)}
                  />
                ))}
              </div>
            </div>
          </div>
            </>
          )}

          {/* READ/EDIT MODE: zobrazit formulář a historii, skrýt hlavní seznam */}
          {(managerUiState.mode === 'read' || managerUiState.mode === 'edit') && (
            <div className="detail-attachments__manager-layout">
              {/* Historie: sticky karta dole, scroll jen uvnitř ListView */}
              <div className="detail-attachments__history-sticky">
                <div className="detail-attachments__history-head">
                  <h3 className="detail-form__section-title detail-attachments__history-titleline">
                    Historie verzí přílohy: <span className="detail-attachments__history-filename">{selectedTitle}</span>
                  </h3>
                </div>

                <div className="detail-attachments__history-body">
                  {!expandedDocId && (
                    <div className="detail-form__hint detail-form__hint--single">
                      Historie verzí se automaticky zobrazí.
                    </div>
                  )}

                  {expandedDocId && versionsLoadingId === expandedDocId && <div className="detail-form__hint">Načítám historii…</div>}

                  {expandedDocId && versionsLoadingId !== expandedDocId && historyRows.length === 0 && <div className="detail-form__hint">Žádná historie.</div>}

                  {expandedDocId && versionsLoadingId !== expandedDocId && historyRows.length > 0 && (
                    <div className="detail-attachments__lv-shell detail-attachments__history-compact">
                      <ListView
                        columns={sharedColumns}
                        rows={historyRows}
                        sort={sort}
                        onSortChange={handleSortChange}
                        filterValue=""
                        onFilterChange={() => {}} // Filtr z historie byl odstraněn
                        onRowDoubleClick={(row) => void handleOpenLatestByPath(row.raw?.file_path)}
                        onColumnResize={handleColumnResize}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ✅ Sloupce (Drawer) */}
          <ListViewColumnsDrawer
            open={colsOpen}
            columns={sharedColumnsBase as any}
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
            onClose={() => setColsOpen(false)}
          />
        </section>
      </div>
    </div>
  )
}
