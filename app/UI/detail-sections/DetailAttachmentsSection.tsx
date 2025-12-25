'use client'

/**
 * FILE: app/UI/detail-sections/DetailAttachmentsSection.tsx
 *
 * PURPOSE:
 * Detail tab "Přílohy" – jednotný UI toolbar (jako CommonActions) + vícesloupcový list (latest) + edit metadat + verzování.
 *
 * UI/UX:
 * - Toolbar vlevo: filtr + zobrazit archivované
 * - Toolbar vpravo: akce (ikona + label) ve stylu CommonActions (jen v manager režimu)
 * - List: pouze poslední verze (latest). Historie verzí je on-demand (rozbalení) (jen v manager režimu)
 * - Nová verze: potvrzení (confirm) → teprve poté file picker. (jen v manager režimu)
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getIcon } from '@/app/UI/icons'
import {
  addAttachmentVersionWithUpload,
  createAttachmentWithUpload,
  getAttachmentSignedUrl,
  listAttachments,
  listAttachmentVersions,
  loadUserDisplayNames,
  type AttachmentRow,
  type AttachmentVersionRow,
  type UserNameMap,
  updateAttachmentMetadata,
} from '@/app/lib/attachments'

export type DetailAttachmentsSectionProps = {
  entityType: string
  entityId: string
  entityLabel?: string | null
  mode: 'view' | 'edit' | 'create'
  /**
   * list    = read-only list for entity tab
   * manager = full manager (versions, upload, edit metadata)
   */
  variant?: 'list' | 'manager'
}

type LocalActionId = 'addAttachment' | 'saveAttachment' | 'closePanel'

const LOCAL_ACTIONS: Record<LocalActionId, { icon: string; label: string; title: string }> = {
  addAttachment: { icon: 'add', label: 'Přidat přílohu', title: 'Přidat přílohu' },
  saveAttachment: { icon: 'save', label: 'Uložit', title: 'Uložit (bez zavření)' },
  closePanel: { icon: 'close', label: 'Zavřít', title: 'Zavřít bez uložení' },
}

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

export default function DetailAttachmentsSection({
  entityType,
  entityId,
  entityLabel = null,
  mode,
  variant = 'list',
}: DetailAttachmentsSectionProps) {
  const canLoad = useMemo(() => !!entityType && !!entityId && entityId !== 'new', [entityType, entityId])

  const isManager = variant === 'manager'

  const [includeArchived, setIncludeArchived] = useState(false)
  const [filterText, setFilterText] = useState('')

  const [loading, setLoading] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)
  const [rows, setRows] = useState<AttachmentRow[]>([])

  // ✅ mapování userId -> display_name (fallback, když view nemá *_name nebo je null)
  const [nameById, setNameById] = useState<UserNameMap>({})

  // Verze – rozbalování (on-demand) + cache (jen manager)
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null)
  const [versionsByDocId, setVersionsByDocId] = useState<Record<string, AttachmentVersionRow[]>>({})
  const [versionsLoadingId, setVersionsLoadingId] = useState<string | null>(null)

  // Load guards (anti-storm)
  const loadInFlightRef = useRef<Promise<void> | null>(null)
  const lastLoadKeyRef = useRef<string>('')

  // Přidání přílohy – panel (jen manager)
  const [panelOpen, setPanelOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newFile, setNewFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  // Edit metadat dokumentu (title/description) (jen manager)
  const [editingDocId, setEditingDocId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  const panelDirty = useMemo(() => !!newTitle.trim() || !!newDesc.trim() || !!newFile, [newTitle, newDesc, newFile])

  // Hidden file inputs pro „přidat verzi“ (po potvrzení)
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

    if (loadInFlightRef.current && lastLoadKeyRef.current === key) {
      return loadInFlightRef.current
    }

    lastLoadKeyRef.current = key

    const p = (async () => {
      setLoading(true)
      setErrorText(null)
      try {
        const data = await listAttachments({ entityType, entityId, includeArchived })
        setRows(data)
        // ✅ dotáhneme jména jako fallback (bez závislosti na view)
        await refreshNamesFromRows(data)
      } catch (e: any) {
        setErrorText(e?.message ?? 'Chyba načítání příloh.')
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

  const resetPanel = useCallback(() => {
    setNewTitle('')
    setNewDesc('')
    setNewFile(null)
  }, [])

  const openFileByPath = useCallback(async (filePath: string) => {
    const url = await getAttachmentSignedUrl({ filePath, expiresInSeconds: 60 })
    window.open(url, '_blank', 'noopener,noreferrer')
  }, [])

  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setFilterText(e.target.value), [])
  const handleNewTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setNewTitle(e.target.value), [])
  const handleNewDescChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setNewDesc(e.target.value), [])
  const handleNewFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewFile(e.target.files?.[0] ?? null)
  }, [])
  const handleEditTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setEditTitle(e.target.value), [])
  const handleEditDescChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setEditDesc(e.target.value), [])
  const handleArchivedToggle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setIncludeArchived(e.target.checked)
  }, [])

  function handleActionAdd() {
    if (!isManager) return
    setErrorText(null)
    setPanelOpen(true)
  }

  function handleActionClose() {
    if (!isManager) return
    setErrorText(null)
    if (panelOpen && panelDirty) {
      const ok = confirm('Zavřít bez uložení? Rozpracovaná příloha bude ztracena.')
      if (!ok) return
    }
    setPanelOpen(false)
    resetPanel()
  }

  async function handleActionSave() {
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
      setErrorText(e?.message ?? 'Nepodařilo se přidat přílohu.')
    } finally {
      setSaving(false)
    }
  }

  const onToolbarActionClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const id = e.currentTarget.dataset.action as LocalActionId | undefined
      if (!id) return
      if (id === 'addAttachment') return handleActionAdd()
      if (id === 'saveAttachment') return void handleActionSave()
      if (id === 'closePanel') return handleActionClose()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [panelDirty, panelOpen, newTitle, newDesc, newFile, saving, loadAttachments, resetPanel]
  )

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

      // cache hit
      if (versionsByDocId[documentId]) return

      setVersionsLoadingId(documentId)
      try {
        const items = await listAttachmentVersions({ documentId, includeArchived: true })
        setVersionsByDocId((prev) => ({ ...prev, [documentId]: items }))
        await refreshNamesFromVersions(items)
      } catch (err: any) {
        setErrorText(err?.message ?? 'Nepodařilo se načíst verze.')
      } finally {
        setVersionsLoadingId(null)
      }
    },
    [expandedDocId, versionsByDocId, refreshNamesFromVersions, isManager]
  )

  const handleRequestNewVersion = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!isManager) return
      const docId = e.currentTarget.dataset.docid
      if (!docId) return
      const ok = confirm('Vytvořit novou verzi souboru?')
      if (!ok) return
      const el = versionInputRefs.current[docId]
      el?.click()
    },
    [isManager]
  )

  const handleVersionInputChange = useCallback(
    (documentId: string) => async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isManager) return
      const file = e.target.files?.[0]
      if (!file) return

      setErrorText(null)
      setSaving(true)
      try {
        await addAttachmentVersionWithUpload({
          documentId,
          entityType,
          entityId,
          entityLabel,
          file,
        })
        // reset input
        e.target.value = ''
        await loadAttachments()
        setExpandedDocId(documentId)
        // invalidate cache for doc (reload on next expand)
        setVersionsByDocId((prev) => {
          const next = { ...prev }
          delete next[documentId]
          return next
        })
      } catch (err: any) {
        setErrorText(err?.message ?? 'Nepodařilo se přidat verzi.')
      } finally {
        setSaving(false)
      }
    },
    [entityType, entityId, entityLabel, loadAttachments, isManager]
  )

  const resolveName = useCallback(
    (nameFromView: string | null | undefined, userId: string | null | undefined) => {
      if (nameFromView && nameFromView.trim()) return nameFromView
      if (userId && nameById[userId]) return nameById[userId]
      return '—'
    },
    [nameById]
  )

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [editingDesc, setEditingDesc] = useState('')

  const isEditing = useCallback((id: string) => editingId === id, [editingId])

  const handleStartEdit = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isManager) return
    const docId = e.currentTarget.dataset.docid
    const title = e.currentTarget.dataset.title ?? ''
    const desc = e.currentTarget.dataset.desc ?? ''
    if (!docId) return
    setEditingId(docId)
    setEditingTitle(title)
    setEditingDesc(desc === 'null' ? '' : desc)
  }, [isManager])

  const handleCancelEdit = useCallback(() => {
    setEditingId(null)
    setEditingTitle('')
    setEditingDesc('')
  }, [])

  const handleSaveEdit = useCallback(async () => {
    if (!isManager) return
    if (!editingId) return
    const title = editingTitle.trim()
    if (!title) {
      setErrorText('Chybí název přílohy.')
      return
    }
    setEditSaving(true)
    setErrorText(null)
    try {
      await updateAttachmentMetadata({
        documentId: editingId,
        title,
        description: editingDesc.trim() ? editingDesc.trim() : null,
      })
      setEditingId(null)
      setEditingTitle('')
      setEditingDesc('')
      await loadAttachments()
    } catch (err: any) {
      setErrorText(err?.message ?? 'Nepodařilo se uložit metadata.')
    } finally {
      setEditSaving(false)
    }
  }, [editingId, editingTitle, editingDesc, loadAttachments, isManager])

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

  return (
    <div className="detail-view__section">
      <div className="detail-form__section" style={{ marginBottom: 8 }}>
        <div className="detail-attachments__toolbar">
          <div className="detail-attachments__toolbar-left">
            <div className="detail-attachments__filter">
              <label className="detail-form__label detail-attachments__label-hidden">Filtr</label>
              <input
                className="detail-form__input"
                value={filterText}
                onChange={handleFilterChange}
                placeholder="Hledat podle názvu, popisu nebo souboru"
              />
            </div>

            <div className="detail-attachments__archived">
              <label className="detail-form__label">&nbsp;</label>
              <label className="detail-form__checkbox detail-attachments__checkbox">
                <input type="checkbox" checked={includeArchived} onChange={handleArchivedToggle} />
                <span> Zobrazit archivované</span>
              </label>
            </div>
          </div>

          <div className="detail-attachments__toolbar-right">
            {isManager && (
              {Object.entries(LOCAL_ACTIONS).map(([id, def]) => (
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
            )}
          </div>
        </div>
      </div>

      {loading && <div className="detail-view__placeholder">Načítám přílohy…</div>}

      {!loading && errorText && (
        <div className="detail-view__placeholder">
          Chyba: <strong>{errorText}</strong>
        </div>
      )}

      {!loading && !errorText && filteredRows.length === 0 && (
        <div className="detail-view__placeholder">Zatím žádné přílohy.</div>
      )}

      {/* Panel přidání přílohy (jen manager) */}
      {isManager && panelOpen && (
        <div className="detail-form">
          <section className="detail-form__section">
            <h3 className="detail-form__section-title">Nová příloha</h3>

            <div className="detail-form__grid detail-form__grid--narrow">
              <div className="detail-form__field detail-form__field--span-4">
                <label className="detail-form__label">Název</label>
                <input className="detail-form__input" value={newTitle} onChange={handleNewTitleChange} />
              </div>

              <div className="detail-form__field detail-form__field--span-4">
                <label className="detail-form__label">Popis</label>
                <input className="detail-form__input" value={newDesc} onChange={handleNewDescChange} />
              </div>

              <div className="detail-form__field detail-form__field--span-4">
                <label className="detail-form__label">Soubor</label>
                <input className="detail-form__input" type="file" onChange={handleNewFileChange} />
                <div className="detail-form__hint">Vytvoří dokument + verzi v001 a nahraje soubor do storage.</div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* List příloh */}
      {!loading && !errorText && filteredRows.length > 0 && (
        <div className="detail-form">
          <section className="detail-form__section">
            <h3 className="detail-form__section-title">
              {isManager ? 'Přílohy' : 'Přílohy (read-only)'}
            </h3>

            <div className="detail-attachments__table" role="table" aria-label="Přílohy">
              <div className="detail-attachments__row detail-attachments__row--head" role="row">
                <div className="detail-attachments__cell" role="columnheader">
                  Název
                </div>
                <div className="detail-attachments__cell" role="columnheader">
                  Popis
                </div>
                <div className="detail-attachments__cell" role="columnheader">
                  Soubor (latest)
                </div>
                <div className="detail-attachments__cell" role="columnheader">
                  Verze
                </div>
                <div className="detail-attachments__cell" role="columnheader">
                  Nahráno
                </div>
                <div className="detail-attachments__cell" role="columnheader">
                  Akce
                </div>
              </div>

              {filteredRows.map((r) => {
                const uploadedName = resolveName(r.version_created_by_name ?? null, r.version_created_by ?? null)
                const updatedName = resolveName(r.updated_by_name ?? null, r.updated_by ?? null)

                return (
                  <React.Fragment key={r.id}>
                    <div className="detail-attachments__row" role="row">
                      <div className="detail-attachments__cell" role="cell">
                        <div className="detail-attachments__title">
                          {r.title}
                          {r.is_archived ? <span className="detail-attachments__archived-badge">archiv</span> : null}
                        </div>
                      </div>

                      <div className="detail-attachments__cell" role="cell">
                        {isManager && editingId === r.id ? (
                          <input
                            className="detail-form__input"
                            value={editingDesc}
                            onChange={(e) => setEditingDesc(e.target.value)}
                          />
                        ) : (
                          <div className="detail-attachments__muted">{r.description ?? '—'}</div>
                        )}
                      </div>

                      <div className="detail-attachments__cell" role="cell">
                        <div className="detail-attachments__file">
                          <button
                            type="button"
                            className="detail-attachments__link"
                            data-path={r.file_path}
                            onClick={handleOpenLatest}
                            title="Otevřít soubor"
                          >
                            {r.file_name}
                          </button>
                        </div>
                      </div>

                      <div className="detail-attachments__cell" role="cell">
                        <div className="detail-attachments__muted">v{String(r.version_number).padStart(3, '0')}</div>
                      </div>

                      <div className="detail-attachments__cell" role="cell">
                        <div>
                          <div className="detail-attachments__muted">{formatDt(r.version_created_at)}</div>
                          <div className="detail-attachments__muted">kdo: {uploadedName}</div>
                          <div className="detail-attachments__muted">upravil: {updatedName}</div>
                        </div>
                      </div>

                      <div className="detail-attachments__cell" role="cell">
                        <div className="detail-attachments__actions">
                          {isManager ? (
                            <>
                              <button
                                type="button"
                                className="detail-attachments__link"
                                data-docid={r.id}
                                onClick={handleToggleVersions}
                              >
                                Historie
                              </button>

                              <button
                                type="button"
                                className="detail-attachments__link"
                                data-docid={r.id}
                                onClick={handleRequestNewVersion}
                              >
                                Přidat verzi
                              </button>

                              <input
                                ref={(el) => setVersionInputRef(r.id, el)}
                                type="file"
                                className="detail-attachments__file-input"
                                onChange={handleVersionInputChange(r.id)}
                              />

                              {editingId === r.id ? (
                                <>
                                  <button
                                    type="button"
                                    className="detail-attachments__link"
                                    disabled={editSaving}
                                    onClick={handleSaveEdit}
                                  >
                                    Uložit
                                  </button>
                                  <button type="button" className="detail-attachments__link" onClick={handleCancelEdit}>
                                    Zrušit
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  className="detail-attachments__link"
                                  data-docid={r.id}
                                  data-title={r.title}
                                  data-desc={r.description ?? ''}
                                  onClick={handleStartEdit}
                                >
                                  Upravit
                                </button>
                              )}
                            </>
                          ) : (
                            <span className="detail-attachments__muted">—</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isManager && expandedDocId === r.id && (
                      <div className="detail-attachments__row detail-attachments__row--versions" role="row">
                        <div className="detail-attachments__versions" role="cell">
                          {versionsLoadingId === r.id ? (
                            <>Načítám verze…</>
                          ) : (versionsByDocId[r.id] ?? []).length === 0 ? (
                            <>Žádné verze.</>
                          ) : (
                            <div className="detail-attachments__versions-list">
                              {(versionsByDocId[r.id] ?? []).map((v) => {
                                const vName = resolveName(null, v.created_by ?? null)
                                return (
                                  <div key={v.id} className="detail-attachments__version-item">
                                    <span className="detail-attachments__mono">
                                      v{String(v.version_number).padStart(3, '0')}
                                    </span>
                                    <span className="detail-attachments__version-file">{v.file_name}</span>
                                    <span className="detail-attachments__muted">
                                      {formatDt(v.created_at)} • {vName}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                )
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
