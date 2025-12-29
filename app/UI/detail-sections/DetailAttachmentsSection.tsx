// ============================================================================
// 1) IMPORTS
// ============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { ListViewColumn, ListViewRow } from '@/app/UI/ListView'
import { ListView } from '@/app/UI/ListView'

import {
  addAttachmentVersionWithUpload,
  createAttachmentWithUpload,
  getAttachmentSignedUrl,
  listAttachmentLatest,
  listAttachmentVersions,
  updateAttachmentMetadata,
} from '@/app/supabase/attachments'

import { getIcon } from '@/app/UI/icons'
import { normalizeAuthError } from '@/app/utils/normalizeAuthError'

// Styles
import '@/app/styles/components/DetailAttachments.css'

// ============================================================================
// 2) TYPES
// ============================================================================
type DetailMode = 'view' | 'edit' | 'create'
type Variant = 'list' | 'manager'

type LocalActionId = 'refresh' | 'addAttachment' | 'saveAttachment' | 'closePanel'

type Props = {
  mode: DetailMode
  variant?: Variant

  entityType: string
  entityId: string | null
  entityLabel: string

  canManage?: boolean
  isEntityArchived?: boolean
}

// ============================================================================
// 3) HELPERS
// ============================================================================
function formatDt(dt: string | null | undefined): string {
  if (!dt) return '—'
  const d = new Date(dt)
  if (Number.isNaN(d.getTime())) return String(dt)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function resolveName(preResolved: string | null, fallback: string | null): string {
  if (preResolved?.trim()) return preResolved.trim()
  if (fallback?.trim()) return fallback.trim()
  return '—'
}
// ============================================================================
// 4) DATA LOAD
// ============================================================================
export function DetailAttachmentsSection(props: Props) {
  const {
    mode,
    variant = 'list',
    entityType,
    entityId,
    entityLabel,
    canManage = false,
    isEntityArchived = false,
  } = props

  const isManagerRequested = variant === 'manager'
  const isManager = isManagerRequested && canManage && !isEntityArchived && mode !== 'view'

  const canLoad = Boolean(entityId)

  const [loading, setLoading] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)

  const [includeArchived, setIncludeArchived] = useState(false)
  const [filterText, setFilterText] = useState('')

  // rows from v_document_latest_version
  const [rows, setRows] = useState<any[]>([])

  // names cache (optional; in your view it is already version_created_by_name)
  const [namesById, setNamesById] = useState<Record<string, string>>({})

  // manager panel state
  const [panelOpen, setPanelOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newFile, setNewFile] = useState<File | null>(null)

  // manager edit metadata
  const [editingDocId, setEditingDocId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  // manager versions expand
  const versionInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null)
  const [versionsLoadingId, setVersionsLoadingId] = useState<string | null>(null)
  const [versionsByDocId, setVersionsByDocId] = useState<Record<string, any[]>>({})

  const LOCAL_ACTIONS: Record<LocalActionId, { icon: string; label: string; title: string }> = useMemo(
    () => ({
      refresh: { icon: 'refresh', label: 'Obnovit', title: 'Načíst znovu' },
      addAttachment: { icon: 'add', label: 'Nová', title: 'Přidat přílohu' },
      saveAttachment: { icon: 'save', label: 'Uložit', title: 'Uložit přílohu' },
      closePanel: { icon: 'close', label: 'Zavřít', title: 'Zavřít panel' },
    }),
    []
  )

  const loadAttachments = useCallback(async () => {
    if (!entityId) return
    setLoading(true)
    setErrorText(null)
    try {
      const items = await listAttachmentLatest({
        entityType,
        entityId,
        includeArchived,
      })
      setRows(items ?? [])
    } catch (e: any) {
      setErrorText(normalizeAuthError(e?.message ?? 'Nepodařilo se načíst přílohy.'))
    } finally {
      setLoading(false)
    }
  }, [entityId, entityType, includeArchived])

  useEffect(() => {
    if (!canLoad) return
    void loadAttachments()
  }, [canLoad, loadAttachments])
// ============================================================================
// 5) ACTION HANDLERS
// ============================================================================
  const openFileByPath = useCallback(async (filePath: string) => {
    const url = await getAttachmentSignedUrl({ filePath, expiresInSeconds: 60 })
    window.open(url, '_blank', 'noopener,noreferrer')
  }, [])

  const handleArchivedToggle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setIncludeArchived(e.target.checked)
  }, [])

  const handleFilterChange = useCallback((v: string) => {
    setFilterText(v)
  }, [])

  const handleOpenLatest = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      const filePath = e.currentTarget.dataset.path
      if (!filePath) return
      setErrorText(null)
      try {
        await openFileByPath(filePath)
      } catch (err: any) {
        setErrorText(err?.message ?? 'Nepodařilo se otevřít přílohu.')
      }
    },
    [openFileByPath]
  )

  const setVersionInputRef = useCallback((docId: string, el: HTMLInputElement | null) => {
    versionInputRefs.current[docId] = el
  }, [])

  const resetPanel = useCallback(() => {
    setNewTitle('')
    setNewDesc('')
    setNewFile(null)
  }, [])

  const handleActionAdd = useCallback(() => {
    if (!isManager) return
    setErrorText(null)
    setPanelOpen(true)
  }, [isManager])

  const handleActionClose = useCallback(() => {
    if (!isManager) return
    setErrorText(null)
    setPanelOpen(false)
    resetPanel()
  }, [isManager, resetPanel])

  const handleActionSave = useCallback(async () => {
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
        entityId: entityId ?? '',
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

  const onToolbarActionClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const id = e.currentTarget.dataset.action as LocalActionId | undefined
      if (!id) return
      if (id === 'refresh') return void loadAttachments()
      if (id === 'addAttachment') return handleActionAdd()
      if (id === 'saveAttachment') return void handleActionSave()
      if (id === 'closePanel') return handleActionClose()
    },
    [loadAttachments, handleActionAdd, handleActionSave, handleActionClose]
  )

  const handleToggleVersions = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!isManager) return
      const documentId = e.currentTarget.dataset.docid
      if (!documentId) return

      if (expandedDocId === documentId) {
        setExpandedDocId(null)
        return
      }

      setExpandedDocId(documentId)
      if (versionsByDocId[documentId]) return

      setVersionsLoadingId(documentId)
      try {
        const items = await listAttachmentVersions({ documentId, includeArchived: true })
        setVersionsByDocId((prev) => ({ ...prev, [documentId]: items }))
      } catch (err: any) {
        setErrorText(normalizeAuthError(err?.message ?? 'Nepodařilo se načíst verze.'))
      } finally {
        setVersionsLoadingId(null)
      }
    },
    [isManager, expandedDocId, versionsByDocId]
  )

  const handleAddVersionRequest = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!isManager) return
      const docId = e.currentTarget.dataset.docid
      if (!docId) return
      const ok = confirm('Vytvořit novou verzi souboru?')
      if (!ok) return
      versionInputRefs.current[docId]?.click()
    },
    [isManager]
  )

  const handleAddVersionPick = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isManager) return
      const docId = e.currentTarget.dataset.docid
      if (!docId) return
      const file = e.target.files?.[0]
      if (!file) return

      setErrorText(null)
      setSaving(true)
      try {
        await addAttachmentVersionWithUpload({
          documentId: docId,
          entityType,
          entityId: entityId ?? '',
          entityLabel,
          file,
        })
        e.target.value = ''
        await loadAttachments()
        setExpandedDocId(docId)
        setVersionsByDocId((prev) => {
          const next = { ...prev }
          delete next[docId]
          return next
        })
      } catch (err: any) {
        setErrorText(normalizeAuthError(err?.message ?? 'Nepodařilo se přidat verzi.'))
      } finally {
        setSaving(false)
      }
    },
    [isManager, entityType, entityId, entityLabel, loadAttachments]
  )

  const handleEditMetadataStart = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!isManager) return
      const docId = e.currentTarget.dataset.docid
      const title = e.currentTarget.dataset.title ?? ''
      const desc = e.currentTarget.dataset.desc ?? ''
      if (!docId) return
      setEditingDocId(docId)
      setEditTitle(title)
      setEditDesc(desc === 'null' ? '' : desc)
    },
    [isManager]
  )

  const handleEditMetadataCancel = useCallback(() => {
    setEditingDocId(null)
    setEditTitle('')
    setEditDesc('')
  }, [])

  const handleEditMetadataSave = useCallback(async () => {
    if (!isManager) return
    if (!editingDocId) return

    const title = editTitle.trim()
    if (!title) return setErrorText('Chybí název přílohy.')

    setEditSaving(true)
    setErrorText(null)
    try {
      await updateAttachmentMetadata({
        documentId: editingDocId,
        title,
        description: editDesc.trim() ? editDesc.trim() : null,
      })
      setEditingDocId(null)
      setEditTitle('')
      setEditDesc('')
      await loadAttachments()
    } catch (err: any) {
      setErrorText(normalizeAuthError(err?.message ?? 'Nepodařilo se uložit metadata.'))
    } finally {
      setEditSaving(false)
    }
  }, [isManager, editingDocId, editTitle, editDesc, loadAttachments])
// ============================================================================
// 6) RENDER
// ============================================================================
  if (!canLoad) {
    return (
      <div className="detail-view__section">
        <div className="detail-view__placeholder">
          Přílohy budou dostupné po uložení záznamu.
          <br />
          Režim: <strong>{mode}</strong>
        </div>
      </div>
    )
  }

  const sectionTitle = isManagerRequested ? 'Přílohy' : 'Přílohy (read-only)'

  const filteredRows = useMemo(() => {
    const q = filterText.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => {
      const a = String(r.title ?? '').toLowerCase()
      const b = String(r.description ?? '').toLowerCase()
      const c = String(r.file_name ?? '').toLowerCase()
      return a.includes(q) || b.includes(q) || c.includes(q)
    })
  }, [rows, filterText])

  // READ-ONLY ListView (stejný styl jako Users list)
  const listColumns: ListViewColumn[] = useMemo(
    () => [
      { id: 'title', label: 'Název', width: 180 },
      { id: 'desc', label: 'Popis', width: 200 },
      { id: 'file', label: 'Soubor (latest)', width: 280 },
      { id: 'ver', label: 'Verze', width: 90 },
      { id: 'uploaded', label: 'Nahráno', width: 240 },
    ],
    []
  )

  const listRows: ListViewRow[] = useMemo(() => {
    return filteredRows.map((r) => {
      const uploadedName = resolveName(r.version_created_by_name ?? null, r.version_created_by ?? null)
      const ver = `v${String(r.version_number ?? 0).padStart(3, '0')}`

      return {
        id: String(r.id),
        cells: {
          title: (
            <span className="detail-attachments__title">
              {r.title ?? '—'}
              {r.is_archived ? <span className="detail-attachments__archived-badge">archiv</span> : null}
            </span>
          ),
          desc: <span className="detail-attachments__muted">{r.description ?? '—'}</span>,
          file: (
            <button
              type="button"
              className="detail-attachments__link"
              data-path={r.file_path}
              onClick={handleOpenLatest}
              title="Otevřít soubor"
            >
              {r.file_name ?? '—'}
            </button>
          ),
          ver: <span className="detail-attachments__muted">{ver}</span>,
          uploaded: (
            <span className="detail-attachments__muted">
              {formatDt(r.version_created_at)} • kdo: {uploadedName}
            </span>
          ),
        },
      }
    })
  }, [filteredRows, handleOpenLatest])

  return (
    <div className="detail-view__section">
      {isManagerRequested && !isManager && (
        <div className="detail-view__placeholder" style={{ marginBottom: 8 }}>
          <strong>Správa příloh je pouze pro čtení.</strong>
          <div style={{ marginTop: 6 }}>Nemáš oprávnění měnit přílohy nebo je entita archivovaná.</div>
        </div>
      )}

      <div className="detail-form">
        <section className="detail-form__section">
          <h3 className="detail-form__section-title">{sectionTitle}</h3>

          {loading && <div className="detail-view__placeholder">Načítám přílohy…</div>}

          {!loading && errorText && (
            <div className="detail-view__placeholder">
              Chyba: <strong>{errorText}</strong>
            </div>
          )}

          {!loading && !errorText && listRows.length === 0 && <div className="detail-view__placeholder">Zatím žádné přílohy.</div>}

          {!loading && !errorText && !isManagerRequested && listRows.length > 0 && (
            <div className="detail-attachments__listview-wrap" role="region" aria-label="Přílohy">
              <ListView
                columns={listColumns}
                rows={listRows}
                loading={false}
                error={null}
                filterText={filterText}
                onFilterTextChange={setFilterText}
                showArchivedToggle
                archivedChecked={includeArchived}
                onArchivedToggleChange={(v) => setIncludeArchived(v)}
              />
            </div>
          )}

          {/* Manager UI necháme na další krok (teď sjednocujeme read-only) */}
          {isManagerRequested && (
            <div className="detail-view__placeholder" style={{ marginTop: 8 }}>
              Manager režim budeme řešit hned jako další krok (formuláře + ListView s akcemi).
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
