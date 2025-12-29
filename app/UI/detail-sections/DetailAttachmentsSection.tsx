// app/UI/detail-sections/DetailAttachmentsSection.tsx

// ============================================================================
// 1) IMPORTS
// ============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import ListView, { ListViewColumn, ListViewRow } from '@/app/UI/ListView'
import {
  addAttachmentVersionWithUpload,
  createAttachmentWithUpload,
  getAttachmentSignedUrl,
  listAttachmentVersions,
  listAttachments,
  updateAttachmentMetadata,
} from '@/app/lib/attachments'
import { normalizeAuthError } from '@/app/lib/normalizeAuthError'
import { getIcon } from '@/app/lib/icons'
import { formatDt } from '@/app/lib/formatters'

import './DetailAttachments.css'

// ============================================================================
// 2) TYPES
// ============================================================================
type Mode = 'view' | 'edit' | 'create'
type Variant = 'list' | 'manager'

type LocalActionId = 'refresh' | 'addAttachment' | 'saveAttachment' | 'closePanel'

type AttachmentRow = {
  id: string
  title: string | null
  description: string | null
  is_archived: boolean
  file_path: string | null
  file_name: string | null
  version_number: number | null
  version_created_at: string | null
  version_created_by: string | null
  version_created_by_name?: string | null
}

type AttachmentVersionRow = {
  id: string
  document_id: string
  version_number: number
  file_name: string
  file_path: string
  created_at: string
  created_by: string | null
}

export type DetailAttachmentsSectionProps = {
  entityType: string
  entityId: string | null
  entityLabel?: string | null
  mode: Mode

  /** ✅ kvůli tvému build erroru: AttachmentsManagerFrame ti to už posílá */
  variant?: Variant

  /** pro manager variantu */
  canManage?: boolean
  readOnlyReason?: string | null
}

// ============================================================================
// 3) HELPERS
// ============================================================================
const LOCAL_ACTIONS: Record<LocalActionId, { icon: string; label: string; title: string }> = {
  refresh: { icon: 'refresh', label: 'Obnovit', title: 'Obnovit seznam' },
  addAttachment: { icon: 'plus', label: 'Přidat', title: 'Přidat novou přílohu' },
  saveAttachment: { icon: 'save', label: 'Uložit', title: 'Uložit novou přílohu' },
  closePanel: { icon: 'close', label: 'Zavřít', title: 'Zavřít panel' },
}

function resolveName(displayName: string | null, fallbackId: string | null) {
  const n = (displayName ?? '').trim()
  if (n) return n
  const id = (fallbackId ?? '').trim()
  return id ? id : '—'
}
// ============================================================================
// 4) DATA LOAD
// ============================================================================
export default function DetailAttachmentsSection({
  entityType,
  entityId,
  entityLabel,
  mode,
  variant = 'list',
  canManage = false,
  readOnlyReason,
}: DetailAttachmentsSectionProps) {
  const isManagerRequested = variant === 'manager'
  const isManager = isManagerRequested && canManage

  const canLoad = Boolean(entityId && (mode === 'view' || mode === 'edit'))

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)

  const [includeArchived, setIncludeArchived] = useState(false)
  const [filterText, setFilterText] = useState('')

  const [rows, setRows] = useState<AttachmentRow[]>([])

  // manager-only state (necháváme na později, ale ať to nic nerozbije)
  const [panelOpen, setPanelOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newFile, setNewFile] = useState<File | null>(null)

  const [editingDocId, setEditingDocId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')

  const [expandedDocId, setExpandedDocId] = useState<string | null>(null)
  const [versionsByDocId, setVersionsByDocId] = useState<Record<string, AttachmentVersionRow[]>>({})
  const [versionsLoadingId, setVersionsLoadingId] = useState<string | null>(null)

  const versionInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const loadAttachments = useCallback(async () => {
    if (!entityId) return
    setLoading(true)
    setErrorText(null)
    try {
      const items = await listAttachments({
        entityType,
        entityId,
        includeArchived,
      })
      setRows(items as any)
    } catch (e: any) {
      setErrorText(normalizeAuthError(e?.message ?? 'Nepodařilo se načíst přílohy.'))
    } finally {
      setLoading(false)
    }
  }, [entityType, entityId, includeArchived])

  useEffect(() => {
    if (!canLoad) return
    void loadAttachments()
  }, [canLoad, loadAttachments])

  const filteredRows = useMemo(() => {
    const q = filterText.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => {
      const t = (r.title ?? '').toLowerCase()
      const d = (r.description ?? '').toLowerCase()
      const f = (r.file_name ?? '').toLowerCase()
      return t.includes(q) || d.includes(q) || f.includes(q)
    })
  }, [rows, filterText])

  const sectionTitle = isManager ? 'Přílohy' : 'Přílohy (read-only)'

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

  const handleOpenLatest = useCallback(
    async (rowId: string) => {
      const r = rows.find((x) => x.id === rowId)
      const filePath = r?.file_path ?? null
      if (!filePath) return
      setErrorText(null)
      try {
        await openFileByPath(filePath)
      } catch (err: any) {
        setErrorText(err?.message ?? 'Nepodařilo se otevřít přílohu.')
      }
    },
    [rows, openFileByPath]
  )

  const setVersionInputRef = useCallback((docId: string, el: HTMLInputElement | null) => {
    versionInputRefs.current[docId] = el
  }, [])
  // manager helpers (ponecháme – zatím se řeší hlavně read-only list)
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
    if (!entityId) return
    setErrorText(null)

    const title = newTitle.trim()
    if (!title) return setErrorText('Chybí název přílohy.')
    if (!newFile) return setErrorText('Vyber soubor.')

    setSaving(true)
    try {
      await createAttachmentWithUpload({
        entityType,
        entityId,
        entityLabel: entityLabel ?? null,
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
  }, [isManager, entityType, entityId, entityLabel, newTitle, newDesc, newFile, resetPanel, loadAttachments])

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

  // ✅ ListView columns = stejný styl jako Users/Types
  const columns: ListViewColumn[] = useMemo(() => {
    const base: ListViewColumn[] = [
      { id: 'title', label: 'Název', minWidth: 140 },
      { id: 'desc', label: 'Popis', minWidth: 140 },
      { id: 'file', label: 'Soubor (latest)', minWidth: 220 },
      { id: 'ver', label: 'Verze', width: 80 },
      { id: 'uploaded', label: 'Nahráno', minWidth: 200 },
    ]
    return base
  }, [])

  const listRows: ListViewRow[] = useMemo(() => {
    return filteredRows.map((r) => {
      const uploadedName = resolveName(r.version_created_by_name ?? null, r.version_created_by ?? null)
      const ver = r.version_number != null ? `v${String(r.version_number).padStart(3, '0')}` : '—'

      return {
        id: r.id,
        cells: {
          title: (
            <span className="detail-attachments__cell-title">
              {r.title ?? '—'}
              {r.is_archived ? <span className="detail-attachments__archived-badge">archiv</span> : null}
            </span>
          ),
          desc: <span className="detail-attachments__muted">{r.description ?? '—'}</span>,
          file: (
            <button
              type="button"
              className="detail-attachments__link"
              title="Otevřít soubor"
              onClick={() => void handleOpenLatest(r.id)}
              disabled={!r.file_path}
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
          <div style={{ marginTop: 6 }}>
            {readOnlyReason ?? 'Nemáš oprávnění měnit přílohy nebo je entita archivovaná.'}
          </div>
        </div>
      )}

      <div className="detail-form">
        <section className="detail-form__section">
          {/* Title */}
          <h3 className="detail-form__section-title">{sectionTitle}</h3>

          {/* ✅ Read-only + manager toolbar sjednocený s ListView stylem */}
          <div className="generic-type__list-toolbar" style={{ marginBottom: 10 }}>
            <div className="generic-type__list-toolbar-left">
              <input
                className="generic-type__filter-input"
                placeholder="Hledat podle názvu, popisu nebo souboru"
                value={filterText}
                onChange={handleFilterChange}
              />
            </div>

            <div className="generic-type__list-toolbar-right">
              <label className="generic-type__checkbox-label">
                <input type="checkbox" checked={includeArchived} onChange={handleArchivedToggle} />
                <span>Zobrazit archivované</span>
              </label>

              {isManager &&
                Object.entries(LOCAL_ACTIONS).map(([id, def]) => (
                  <button
                    key={id}
                    type="button"
                    className="common-actions__button"
                    data-action={id}
                    onClick={onToolbarActionClick}
                    title={def.title}
                    disabled={saving || editSaving}
                  >
                    <span className="common-actions__icon" aria-hidden>
                      {getIcon(def.icon)}
                    </span>
                    <span className="common-actions__label">{def.label}</span>
                  </button>
                ))}
            </div>
          </div>

          {loading && <div className="detail-view__placeholder">Načítám přílohy…</div>}

          {!loading && errorText && (
            <div className="detail-view__placeholder">
              Chyba: <strong>{errorText}</strong>
            </div>
          )}

          {!loading && !errorText && listRows.length === 0 && <div className="detail-view__placeholder">Zatím žádné přílohy.</div>}

          {!loading && !errorText && listRows.length > 0 && (
            <div className="detail-attachments__listwrap">
              <ListView
                columns={columns}
                rows={listRows}
                loading={false}
                error={null}
                filterText={filterText}
                onFilterTextChange={setFilterText}
                includeArchived={includeArchived}
                onIncludeArchivedChange={setIncludeArchived}
                onRowDoubleClick={(row) => void handleOpenLatest(String(row.id))}
              />
            </div>
          )}

          {/* NOTE: manager formuláře dořešíme hned potom (nepřepisoval jsem je teď, ať se nezacyklíme) */}
          {isManager && panelOpen && (
            <div className="detail-form" style={{ marginTop: 10 }}>
              <section className="detail-form__section">
                <h3 className="detail-form__section-title">Nová příloha</h3>
                <div className="detail-form__grid detail-form__grid--narrow">
                  <div className="detail-form__field detail-form__field--span-4">
                    <label className="detail-form__label">Název</label>
                    <input className="detail-form__input" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
                  </div>

                  <div className="detail-form__field detail-form__field--span-4">
                    <label className="detail-form__label">Popis</label>
                    <input className="detail-form__input" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
                  </div>

                  <div className="detail-form__field detail-form__field--span-4">
                    <label className="detail-form__label">Soubor</label>
                    <input className="detail-form__input" type="file" onChange={(e) => setNewFile(e.target.files?.[0] ?? null)} />
                    <div className="detail-form__hint">Vytvoří dokument + verzi v001 a nahraje soubor do storage.</div>
                  </div>
                </div>
              </section>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
