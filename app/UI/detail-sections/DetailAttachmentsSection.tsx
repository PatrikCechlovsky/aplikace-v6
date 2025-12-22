'use client'

/**
 * FILE: app/UI/detail-sections/DetailAttachmentsSection.tsx
 *
 * PURPOSE:
 * Detail tab "Přílohy" – jednotný UI toolbar (jako CommonActions) + vícesloupcový list (latest) + edit metadat + verzování.
 *
 * UI/UX:
 * - Toolbar vlevo: filtr + zobrazit archivované
 * - Toolbar vpravo: akce (ikona + label) ve stylu CommonActions
 * - List: pouze poslední verze (latest). Historie verzí je on-demand (rozbalení).
 * - Nová verze: potvrzení (confirm) → teprve poté file picker.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getIcon } from '@/app/UI/icons'
import {
  addAttachmentVersionWithUpload,
  createAttachmentWithUpload,
  getAttachmentSignedUrl,
  listAttachments,
  listAttachmentVersions,
  updateAttachmentMetadata,
  type AttachmentRow,
  type AttachmentVersionRow,
} from '@/app/lib/attachments'

export type DetailAttachmentsSectionProps = {
  entityType: string
  entityId: string
  mode: 'view' | 'edit' | 'create'
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

export default function DetailAttachmentsSection({ entityType, entityId, mode }: DetailAttachmentsSectionProps) {
  const canLoad = useMemo(() => !!entityType && !!entityId && entityId !== 'new', [entityType, entityId])

  const [includeArchived, setIncludeArchived] = useState(false)
  const [filterText, setFilterText] = useState('')

  const [loading, setLoading] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)
  const [rows, setRows] = useState<AttachmentRow[]>([])

  // Verze – rozbalování (on-demand) + cache
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null)
  const [versionsByDocId, setVersionsByDocId] = useState<Record<string, AttachmentVersionRow[]>>({})
  const [versionsLoadingId, setVersionsLoadingId] = useState<string | null>(null)

  // Přidání přílohy – panel
  const [panelOpen, setPanelOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newFile, setNewFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  // Edit metadat dokumentu (title/description)
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

  const loadAttachments = useCallback(async () => {
    setLoading(true)
    setErrorText(null)
    try {
      const data = await listAttachments({ entityType, entityId, includeArchived })
      setRows(data)
    } catch (e: any) {
      setErrorText(e?.message ?? 'Chyba načítání příloh.')
    } finally {
      setLoading(false)
    }
  }, [entityType, entityId, includeArchived])

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
    setErrorText(null)
    setPanelOpen(true)
  }

  function handleActionClose() {
    setErrorText(null)
    if (panelOpen && panelDirty) {
      const ok = confirm('Zavřít bez uložení? Rozpracovaná příloha bude ztracena.')
      if (!ok) return
    }
    setPanelOpen(false)
    resetPanel()
  }

  async function handleActionSave() {
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
      const documentId = e.currentTarget.dataset.docid
      if (!documentId) return

      if (expandedDocId === documentId) {
        setExpandedDocId(null)
        return
      }

      setExpandedDocId(documentId)
      if (versionsByDocId[documentId]) return

      setErrorText(null)
      try {
        setVersionsLoadingId(documentId)
        const versions = await listAttachmentVersions({ documentId, includeArchived: true })
        setVersionsByDocId((prev) => ({ ...prev, [documentId]: versions }))
      } catch (err: any) {
        setErrorText(err?.message ?? 'Chyba načítání verzí.')
      } finally {
        setVersionsLoadingId(null)
      }
    },
    [expandedDocId, versionsByDocId]
  )

  const handleRequestNewVersion = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const documentId = e.currentTarget.dataset.docid
    if (!documentId) return

    const ok = confirm('Vytvořit novou verzi dokumentu?')
    if (!ok) return

    const input = versionInputRefs.current[documentId]
    input?.click()
  }, [])

  const handleVersionFileSelected = useCallback(
    async (documentId: string, file: File) => {
      setErrorText(null)
      try {
        await addAttachmentVersionWithUpload({ entityType, entityId, documentId, file })
        await loadAttachments()

        setVersionsByDocId((prev) => {
          const next = { ...prev }
          delete next[documentId]
          return next
        })
      } catch (err: any) {
        setErrorText(err?.message ?? 'Nepodařilo se přidat verzi.')
      }
    },
    [entityType, entityId, loadAttachments]
  )

  const handleVersionInputChange = useCallback(
    (documentId: string) => async (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0]
      e.currentTarget.value = ''
      if (!f) return
      await handleVersionFileSelected(documentId, f)
    },
    [handleVersionFileSelected]
  )

  const handleOpenVersion = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      const filePath = e.currentTarget.dataset.path
      if (!filePath) return
      setErrorText(null)
      try {
        await openFileByPath(filePath)
      } catch (err: any) {
        setErrorText(err?.message ?? 'Nepodařilo se otevřít verzi.')
      }
    },
    [openFileByPath]
  )

  const handleStartEdit = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const documentId = e.currentTarget.dataset.docid
    const title = e.currentTarget.dataset.title ?? ''
    const desc = e.currentTarget.dataset.desc ?? ''
    if (!documentId) return

    setEditingDocId(documentId)
    setEditTitle(title)
    setEditDesc(desc)
  }, [])

  const handleCancelEdit = useCallback(() => {
    setEditingDocId(null)
    setEditTitle('')
    setEditDesc('')
  }, [])

  const handleSaveEdit = useCallback(async () => {
    if (!editingDocId) return
    const title = editTitle.trim()
    if (!title) return setErrorText('Chybí název dokumentu.')

    setEditSaving(true)
    setErrorText(null)
    try {
      await updateAttachmentMetadata({
        documentId: editingDocId,
        title,
        description: editDesc.trim() ? editDesc.trim() : null,
      })
      setEditingDocId(null)
      await loadAttachments()
    } catch (err: any) {
      setErrorText(err?.message ?? 'Nepodařilo se uložit změny dokumentu.')
    } finally {
      setEditSaving(false)
    }
  }, [editingDocId, editTitle, editDesc, loadAttachments])

  const saveDisabled = !panelOpen || saving
  const closeDisabled = !panelOpen && !panelDirty

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
      <div className="detail-form__section">
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

          <div className="common-actions" aria-label="Akce příloh">
            {(['addAttachment', 'saveAttachment', 'closePanel'] as LocalActionId[]).map((id) => {
              const def = LOCAL_ACTIONS[id]
              const disabled =
                (id === 'saveAttachment' && saveDisabled) || (id === 'closePanel' && closeDisabled) || false

              return (
                <button
                  key={id}
                  type="button"
                  className="common-actions__btn"
                  disabled={disabled}
                  title={def.title}
                  data-action={id}
                  onClick={onToolbarActionClick}
                >
                  <span className="common-actions__icon" aria-hidden="true">
                    {getIcon(def.icon as any)}
                  </span>
                  <span className="common-actions__label">{def.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {panelOpen && (
          <div className="detail-form detail-attachments__panel">
            <section className="detail-form__section">
              <h3 className="detail-form__section-title">Nová příloha</h3>

              <div className="detail-form__grid detail-form__grid--narrow">
                <div className="detail-form__field detail-form__field--span-4">
                  <label className="detail-form__label">Název</label>
                  <input
                    className="detail-form__input"
                    value={newTitle}
                    onChange={handleNewTitleChange}
                    placeholder="např. Nájemní smlouva"
                  />
                </div>

                <div className="detail-form__field detail-form__field--span-4">
                  <label className="detail-form__label">Popis</label>
                  <input
                    className="detail-form__input"
                    value={newDesc}
                    onChange={handleNewDescChange}
                    placeholder="volitelné"
                  />
                </div>

                <div className="detail-form__field detail-form__field--span-4">
                  <label className="detail-form__label">Soubor</label>
                  <input type="file" onChange={handleNewFileChange} />
                </div>
              </div>

              <div className="detail-form__hint">
                Uložit můžeš tlačítkem <strong>Uložit</strong> (vpravo nahoře). Zavřít bez uložení tlačítkem{' '}
                <strong>Zavřít</strong>.
              </div>
            </section>
          </div>
        )}
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

      {!loading && !errorText && filteredRows.length > 0 && (
        <div className="detail-form">
          <section className="detail-form__section">
            <h3 className="detail-form__section-title">Seznam příloh</h3>

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
                  Změněno
                </div>
                <div className="detail-attachments__cell" role="columnheader">
                  Akce
                </div>
              </div>

              {filteredRows.map((r) => {
                const isEditing = editingDocId === r.id
                const docUpdatedAt = (r.updated_at ?? null) as any
                const docUpdatedBy = (r.updated_by ?? null) as any

                return (
                  <React.Fragment key={r.id}>
                    <div className="detail-attachments__row" role="row">
                      <div className="detail-attachments__cell" role="cell">
                        {isEditing ? (
                          <input className="detail-form__input" value={editTitle} onChange={handleEditTitleChange} />
                        ) : (
                          <div className="detail-attachments__title">
                            {r.title}
                            {r.is_archived ? <span className="detail-attachments__archived-badge">archiv</span> : null}
                          </div>
                        )}
                      </div>

                      <div className="detail-attachments__cell" role="cell">
                        {isEditing ? (
                          <input className="detail-form__input" value={editDesc} onChange={handleEditDescChange} />
                        ) : (
                          <div className="detail-attachments__muted">{r.description ?? '—'}</div>
                        )}
                      </div>

                      <div className="detail-attachments__cell" role="cell">
                        <div className="detail-attachments__file">
                          <span className="detail-attachments__file-name">{r.file_name}</span>
                          <button
                            type="button"
                            className="detail-attachments__link"
                            data-path={r.file_path}
                            onClick={handleOpenLatest}
                          >
                            Otevřít
                          </button>
                        </div>
                      </div>

                      <div className="detail-attachments__cell" role="cell">
                        <span className="detail-attachments__mono">v{String(r.version_number).padStart(3, '0')}</span>
                      </div>

                      <div className="detail-attachments__cell" role="cell">
                        <div className="detail-attachments__meta">
                          <div>{formatDt(r.version_created_at ?? r.created_at)}</div>
                          <div className="detail-attachments__muted">{r.created_by ?? '—'}</div>
                        </div>
                      </div>

                      <div className="detail-attachments__cell" role="cell">
                        <div className="detail-attachments__meta">
                          <div>{formatDt(docUpdatedAt)}</div>
                          <div className="detail-attachments__muted">{docUpdatedBy ?? '—'}</div>
                        </div>
                      </div>

                      <div className="detail-attachments__cell" role="cell">
                        <div className="detail-attachments__actions">
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

                          {isEditing ? (
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
                        </div>
                      </div>
                    </div>

                    {expandedDocId === r.id && (
                      <div className="detail-attachments__row detail-attachments__row--versions" role="row">
                        <div className="detail-attachments__versions" role="cell">
                          {versionsLoadingId === r.id ? (
                            <>Načítám verze…</>
                          ) : (versionsByDocId[r.id] ?? []).length === 0 ? (
                            <>Žádné verze.</>
                          ) : (
                            <div className="detail-attachments__versions-list">
                              {(versionsByDocId[r.id] ?? []).map((v) => (
                                <div key={v.id} className="detail-attachments__version-item">
                                  <span className="detail-attachments__mono">
                                    v{String(v.version_number).padStart(3, '0')}
                                  </span>
                                  <span>{v.file_name}</span>
                                  <span className="detail-attachments__muted">{formatDt(v.created_at)}</span>
                                  <button
                                    type="button"
                                    className="detail-attachments__link"
                                    data-path={v.file_path}
                                    onClick={handleOpenVersion}
                                  >
                                    Otevřít
                                  </button>
                                </div>
                              ))}
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
