// app/UI/detail-sections/DetailAttachmentsSection.tsx

'use client'

/**
 * FILE: app/UI/detail-sections/DetailAttachmentsSection.tsx
 *
 * VARIANTY:
 * - variant="list"    => read-only seznam (tab u entity): filtr + archiv + otevřít soubor
 * - variant="manager" => plná správa (samostatný screen po 📎): upload, verze, historie, metadata
 *
 * EDGE-CASES:
 * - canManage=false => i v manager variantě bude UI pouze read-only (list režim)
 * - readOnlyReason  => zobrazí se uživateli jako důvod, proč nejde spravovat
 */

// ============================================================================
// 1) IMPORTS
// ============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getIcon } from '@/app/UI/icons'
import ListView, { type ListViewColumn, type ListViewRow } from '@/app/UI/ListView'
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

// ============================================================================
// 2) TYPES
// ============================================================================
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
}

type IconName = Parameters<typeof getIcon>[0]
type LocalActionId = 'addAttachment' | 'saveAttachment' | 'closePanel' | 'refresh'

type RowActionId = 'editMeta' | 'saveMeta' | 'cancelMeta' | 'history' | 'newVersion'

const LOCAL_ACTIONS: Record<LocalActionId, { icon: IconName; label: string; title: string }> = {
  refresh: { icon: 'refresh', label: 'Obnovit', title: 'Obnovit seznam' },
  addAttachment: { icon: 'add', label: 'Přidat přílohu', title: 'Přidat přílohu' },
  saveAttachment: { icon: 'save', label: 'Uložit', title: 'Uložit (bez zavření)' },
  closePanel: { icon: 'close', label: 'Zavřít', title: 'Zavřít bez uložení' },
}
// ============================================================================
// 3) HELPERS
// ============================================================================
function formatDt(s?: string | null) {
  if (!s) return '—'
  try {
    const d = new Date(s)
    if (Number.isNaN(d.getTime())) return s
    return d.toLocaleString('cs-CZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return s
  }
}

function mergeNameMaps(a: UserNameMap, b: UserNameMap): UserNameMap {
  return { ...a, ...b }
}

function normalizeAuthError(msg: string) {
  const m = (msg ?? '').toLowerCase()
  if (
    m.includes('jwt') ||
    m.includes('permission') ||
    m.includes('not allowed') ||
    m.includes('rls') ||
    m.includes('401') ||
    m.includes('403')
  ) {
    return 'Nemáš oprávnění zobrazit přílohy této entity.'
  }
  return msg
}

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
}: DetailAttachmentsSectionProps) {
  const isManagerRequested = variant === 'manager'
  const isManager = isManagerRequested && canManage !== false

  const canLoad = useMemo(() => !!entityType && !!entityId && entityId !== 'new', [entityType, entityId])

  const [includeArchived, setIncludeArchived] = useState(false)
  const [filterText, setFilterText] = useState('')

  const [loading, setLoading] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)
  const [rows, setRows] = useState<AttachmentRow[]>([])

  // fallback userId -> display_name
  const [nameById, setNameById] = useState<UserNameMap>({})

  // versions (manager only UI, but hooks must exist)
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null)
  const [versionsByDocId, setVersionsByDocId] = useState<Record<string, AttachmentVersionRow[]>>({})
  const [versionsLoadingId, setVersionsLoadingId] = useState<string | null>(null)

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

  // file inputs for "new version" (manager)
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
  }, [entityType, entityId, includeArchived, refreshNamesFromRows])

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

  const handleArchivedToggle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setIncludeArchived(e.target.checked)
  }, [])

  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterText(e.target.value)
  }, [])

  const handleOpenLatestByPath = useCallback(
    async (filePath: string | null | undefined) => {
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

  const handleOpenLatest = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      const filePath = e.currentTarget.dataset.path
      if (!filePath) return
      await handleOpenLatestByPath(filePath)
    },
    [handleOpenLatestByPath]
  )

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
    if (panelOpen && panelDirty) {
      const ok = confirm('Zavřít bez uložení? Rozpracovaná příloha bude ztracena.')
      if (!ok) return
    }
    setPanelOpen(false)
    resetPanel()
  }, [isManager, panelOpen, panelDirty, resetPanel])
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

  const handleToggleHistory = useCallback(
    async (documentId: string) => {
      if (!isManager) return
      setErrorText(null)

      // close
      if (expandedDocId === documentId) {
        setExpandedDocId(null)
        return
      }

      setExpandedDocId(documentId)

      // already loaded
      if (versionsByDocId[documentId]) return

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
    [isManager, expandedDocId, versionsByDocId, refreshNamesFromVersions]
  )

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

  const handleCancelEditMeta = useCallback(() => {
    setEditingDocId(null)
    setEditTitle('')
    setEditDesc('')
  }, [])

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

        // refresh versions if panel open
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

  const onRowActionClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const id = e.currentTarget.dataset.action as RowActionId | undefined
      const docId = e.currentTarget.dataset.docid
      if (!id || !docId) return

      const row = rows.find((x) => x.id === docId)

      if (id === 'history') return void handleToggleHistory(docId)
      if (id === 'newVersion') return handlePickNewVersion(docId)
      if (id === 'editMeta') {
        if (row) handleStartEditMeta(row)
        return
      }
      if (id === 'cancelMeta') return handleCancelEditMeta()
      if (id === 'saveMeta') return void handleSaveEditMeta()
    },
    [rows, handleToggleHistory, handlePickNewVersion, handleStartEditMeta, handleCancelEditMeta, handleSaveEditMeta]
  )
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

  const sectionTitle = isManager ? 'Přílohy' : 'Přílohy (read-only)'

  // ✅ ListView pro read-only (stejný styl jako Users/Types)
  const listColumns: ListViewColumn[] = useMemo(
    () => [
      { key: 'title', label: 'Název' },
      { key: 'description', label: 'Popis' },
      { key: 'file', label: 'Soubor (latest)' },
      { key: 'ver', label: 'Verze', width: '90px' },
      { key: 'uploaded', label: 'Nahráno' },
    ],
    []
  )

  const listRows: ListViewRow<AttachmentRow>[] = useMemo(() => {
    return filteredRows.map((r) => {
      const uploadedName = resolveName(r.version_created_by_name ?? null, r.version_created_by ?? null)
      return {
        id: r.id,
        raw: r,
        data: {
          title: (
            <span className="detail-attachments__cell-title">
              {r.title ?? '—'}
              {r.is_archived ? <span className="detail-attachments__archived-badge">archiv</span> : null}
            </span>
          ),
          description: <span className="detail-attachments__muted">{r.description ?? '—'}</span>,
          file: (
            <button
              type="button"
              className="detail-attachments__link"
              onClick={() => void handleOpenLatestByPath(r.file_path)}
              disabled={!r.file_path}
              title="Otevřít soubor"
            >
              {r.file_name ?? '—'}
            </button>
          ),
          ver: <span className="detail-attachments__muted">v{String(r.version_number ?? 0).padStart(3, '0')}</span>,
          uploaded: (
            <span className="detail-attachments__muted">
              {formatDt(r.version_created_at)} • kdo: {uploadedName}
            </span>
          ),
        },
      }
    })
  }, [filteredRows, resolveName, handleOpenLatestByPath])

  // READ-ONLY UI (nebo manager bez práv)
  if (!isManager) {
    return (
      <div className="detail-view__section">
        {isManagerRequested && (
          <div className="detail-view__placeholder" style={{ marginBottom: 8 }}>
            <strong>Správa příloh je pouze pro čtení.</strong>
            <div style={{ marginTop: 6 }}>{readOnlyReason ?? 'Nemáš oprávnění měnit přílohy nebo je entita archivovaná.'}</div>
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

            {!loading && !errorText && listRows.length > 0 && (
              <ListView
                columns={listColumns}
                rows={listRows}
                filterValue={filterText}
                onFilterChange={setFilterText}
                filterPlaceholder="Hledat podle názvu, popisu nebo souboru..."
                showArchived={includeArchived}
                onShowArchivedChange={setIncludeArchived}
                showArchivedLabel="Zobrazit archivované"
                onRowDoubleClick={(row) => void handleOpenLatestByPath(row.raw?.file_path)}
              />
            )}
          </section>
        </div>
      </div>
    )
  }
  // ==========================================================================
  // MANAGER (ListView + toolbar + panel + verze/historie)
  // ==========================================================================
  const managerColumns: ListViewColumn[] = useMemo(
    () => [
      { key: 'title', label: 'Název' },
      { key: 'description', label: 'Popis' },
      { key: 'file', label: 'Soubor (latest)' },
      { key: 'ver', label: 'Verze', width: '90px' },
      { key: 'uploaded', label: 'Nahráno' },
      { key: 'actions', label: 'Akce', width: '220px' },
    ],
    []
  )

  const managerRows: ListViewRow<AttachmentRow>[] = useMemo(() => {
    return filteredRows.map((r) => {
      const uploadedName = resolveName(r.version_created_by_name ?? null, r.version_created_by ?? null)
      const isExpanded = expandedDocId === r.id
      const isEditingThis = editingDocId === r.id

      return {
        id: r.id,
        raw: r,
        data: {
          title: (
            <span className="detail-attachments__cell-title">
              {r.title ?? '—'}
              {r.is_archived ? <span className="detail-attachments__archived-badge">archiv</span> : null}
            </span>
          ),
          description: <span className="detail-attachments__muted">{r.description ?? '—'}</span>,
          file: (
            <button
              type="button"
              className="detail-attachments__link"
              onClick={() => void handleOpenLatestByPath(r.file_path)}
              disabled={!r.file_path}
              title="Otevřít soubor"
            >
              {r.file_name ?? '—'}
            </button>
          ),
          ver: <span className="detail-attachments__muted">v{String(r.version_number ?? 0).padStart(3, '0')}</span>,
          uploaded: (
            <span className="detail-attachments__muted">
              {formatDt(r.version_created_at)} • kdo: {uploadedName}
            </span>
          ),
          actions: (
            <div className="detail-attachments__row-actions">
              <button
                type="button"
                className="detail-attachments__btn"
                data-action="editMeta"
                data-docid={r.id}
                onClick={onRowActionClick}
                disabled={isEditingThis}
                title="Upravit název / popis"
              >
                Upravit
              </button>

              <button
                type="button"
                className="detail-attachments__btn"
                data-action="newVersion"
                data-docid={r.id}
                onClick={onRowActionClick}
                title="Přidat novou verzi"
              >
                Nová verze
              </button>

              <button
                type="button"
                className="detail-attachments__btn"
                data-action="history"
                data-docid={r.id}
                onClick={onRowActionClick}
                title="Zobrazit historii verzí"
              >
                {isExpanded ? 'Skrýt historii' : 'Historie'}
              </button>

              <input
                ref={(el) => setVersionInputRef(r.id, el)}
                type="file"
                className="detail-attachments__file-input"
                onChange={(e) => void handleNewVersionSelected(r.id, e.target.files?.[0] ?? null)}
              />
            </div>
          ),
        },
      }
    })
  }, [filteredRows, resolveName, expandedDocId, editingDocId, handleOpenLatestByPath, onRowActionClick, setVersionInputRef, handleNewVersionSelected])

  const expandedVersions = expandedDocId ? versionsByDocId[expandedDocId] ?? [] : []

  const versionColumns: ListViewColumn[] = useMemo(
    () => [
      { key: 'ver', label: 'Verze', width: '90px' },
      { key: 'file', label: 'Soubor' },
      { key: 'created', label: 'Nahráno' },
    ],
    []
  )

  const versionRows: ListViewRow<AttachmentVersionRow>[] = useMemo(() => {
    if (!expandedDocId) return []
    return expandedVersions.map((v) => {
      const who = resolveName(null, v.created_by)
      return {
        id: v.id,
        raw: v,
        data: {
          ver: <span className="detail-attachments__muted">v{String(v.version_number ?? 0).padStart(3, '0')}</span>,
          file: (
            <button
              type="button"
              className="detail-attachments__link"
              onClick={() => void openFileByPath(v.file_path)}
              title="Otevřít verzi"
            >
              {v.file_name ?? '—'}
            </button>
          ),
          created: (
            <span className="detail-attachments__muted">
              {formatDt(v.created_at)} • kdo: {who}
            </span>
          ),
        },
      }
    })
  }, [expandedDocId, expandedVersions, resolveName, openFileByPath])
  const renderToolbarButton = (id: LocalActionId) => {
    const a = LOCAL_ACTIONS[id]
    return (
      <button
        key={id}
        type="button"
        className="detail-attachments__toolbar-btn"
        data-action={id}
        onClick={onToolbarActionClick}
        title={a.title}
      >
        {getIcon(a.icon, 'detail-attachments__toolbar-icon')}
        <span>{a.label}</span>
      </button>
    )
  }

  return (
    <div className="detail-view__section">
      <div className="detail-form">
        <section className="detail-form__section">
          <h3 className="detail-form__section-title">{sectionTitle}</h3>

          <div className="detail-attachments__toolbar">
            {renderToolbarButton('refresh')}
            {renderToolbarButton('addAttachment')}
            {panelOpen ? renderToolbarButton('saveAttachment') : null}
            {panelOpen ? renderToolbarButton('closePanel') : null}
          </div>

          {errorText && (
            <div className="detail-view__placeholder" style={{ marginTop: 8 }}>
              Chyba: <strong>{errorText}</strong>
            </div>
          )}

          {panelOpen && (
            <div className="detail-attachments__panel" style={{ marginTop: 10 }}>
              <div className="detail-attachments__panel-grid">
                <div className="detail-form__field detail-form__field--span-6">
                  <label className="detail-form__label">Název</label>
                  <input className="detail-form__input" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Název přílohy" />
                </div>

                <div className="detail-form__field detail-form__field--span-6">
                  <label className="detail-form__label">Popis</label>
                  <input className="detail-form__input" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="(volitelné)" />
                </div>

                <div className="detail-form__field detail-form__field--span-6">
                  <label className="detail-form__label">Soubor</label>
                  <input className="detail-form__input" type="file" onChange={(e) => setNewFile(e.target.files?.[0] ?? null)} />
                  {newFile && <div className="detail-form__hint">Vybráno: {newFile.name}</div>}
                </div>
              </div>

              {saving && <div className="detail-form__hint">Ukládám…</div>}
            </div>
          )}
          {editingDocId && (
            <div className="detail-attachments__panel" style={{ marginTop: 10 }}>
              <div className="detail-form__hint" style={{ marginBottom: 8 }}>
                Úprava metadat (název / popis)
              </div>

              <div className="detail-attachments__panel-grid">
                <div className="detail-form__field detail-form__field--span-6">
                  <label className="detail-form__label">Název</label>
                  <input className="detail-form__input" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                </div>

                <div className="detail-form__field detail-form__field--span-6">
                  <label className="detail-form__label">Popis</label>
                  <input className="detail-form__input" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
                </div>
              </div>

              <div className="detail-attachments__meta-actions">
                <button type="button" className="detail-attachments__btn" data-action="saveMeta" data-docid={editingDocId} onClick={onRowActionClick} disabled={editSaving}>
                  Uložit
                </button>
                <button type="button" className="detail-attachments__btn" data-action="cancelMeta" data-docid={editingDocId} onClick={onRowActionClick} disabled={editSaving}>
                  Zrušit
                </button>
              </div>

              {editSaving && <div className="detail-form__hint">Ukládám…</div>}
            </div>
          )}

          {loading && <div className="detail-view__placeholder">Načítám přílohy…</div>}

          {!loading && managerRows.length === 0 && <div className="detail-view__placeholder">Zatím žádné přílohy.</div>}

          {!loading && managerRows.length > 0 && (
            <ListView
              columns={managerColumns}
              rows={managerRows}
              filterValue={filterText}
              onFilterChange={setFilterText}
              filterPlaceholder="Hledat podle názvu, popisu nebo souboru..."
              showArchived={includeArchived}
              onShowArchivedChange={setIncludeArchived}
              showArchivedLabel="Zobrazit archivované"
              onRowDoubleClick={(row) => void handleOpenLatestByPath(row.raw?.file_path)}
            />
          )}

          {expandedDocId && (
            <div className="detail-attachments__history" style={{ marginTop: 12 }}>
              <div className="detail-form__hint" style={{ marginBottom: 8 }}>
                Historie verzí ({expandedDocId})
              </div>

              {versionsLoadingId === expandedDocId && <div className="detail-view__placeholder">Načítám historii…</div>}

              {versionsLoadingId !== expandedDocId && versionRows.length === 0 && <div className="detail-view__placeholder">Žádná historie.</div>}

              {versionsLoadingId !== expandedDocId && versionRows.length > 0 && (
                <ListView columns={versionColumns} rows={versionRows} filterValue="" onFilterChange={() => {}} />
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

