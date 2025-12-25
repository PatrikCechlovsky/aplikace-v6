'use client'

/**
 * FILE: app/UI/detail-sections/DetailAttachmentsSection.tsx
 *
 * VARIANTY:
 * - variant="list"    => read-only seznam (tab u entity): filtr + archiv + otevřít soubor
 * - variant="manager" => plná správa (samostatný screen po 📎): upload, verze, historie, metadata
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getIcon, type IconName } from '@/app/UI/icons'
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

export type DetailAttachmentsSectionProps = {
  entityType: string
  entityId: string
  entityLabel?: string | null
  mode: 'view' | 'edit' | 'create'
  variant?: 'list' | 'manager'
}

type LocalActionId = 'addAttachment' | 'saveAttachment' | 'closePanel' | 'refresh'

const LOCAL_ACTIONS: Record<LocalActionId, { icon: IconName; label: string; title: string }> = {
  refresh: { icon: 'refresh', label: 'Obnovit', title: 'Obnovit seznam' },
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
  const isManager = variant === 'manager'
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

  const resolveName = useCallback(
    (nameFromView: string | null | undefined, userId: string | null | undefined) => {
      if (nameFromView && nameFromView.trim()) return nameFromView
      if (userId && nameById[userId]) return nameById[userId]
      return '—'
    },
    [nameById]
  )

  const openFileByPath = useCallback(async (filePath: string) => {
    const url = await getAttachmentSignedUrl({ filePath, expiresInSeconds: 60 })
    window.open(url, '_blank', 'noopener,noreferrer')
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
      setErrorText(e?.message ?? 'Nepodařilo se přidat přílohu.')
    } finally {
      setSaving(false)
    }
  }, [
    isManager,
    panelOpen,
    newTitle,
    newDesc,
    newFile,
    entityType,
    entityId,
    entityLabel,
    resetPanel,
    loadAttachments,
  ])

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
        await refreshNamesFromVersions(items)
      } catch (err: any) {
        setErrorText(err?.message ?? 'Nepodařilo se načíst verze.')
      } finally {
        setVersionsLoadingId(null)
      }
    },
    [isManager, expandedDocId, versionsByDocId, refreshNamesFromVersions]
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
          entityId,
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
        setErrorText(err?.message ?? 'Nepodařilo se přidat verzi.')
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
    if (!title) {
      setErrorText('Chybí název přílohy.')
      return
    }
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
      setErrorText(err?.message ?? 'Nepodařilo se uložit metadata.')
    } finally {
      setEditSaving(false)
    }
  }, [isManager, editingDocId, editTitle, editDesc, loadAttachments])

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
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Hledat podle názvu, popisu nebo souboru"
              />
            </div>

            <div className="detail-attachments__archived">
              <label className="detail-form__label">&nbsp;</label>
              <label className="detail-form__checkbox detail-attachments__checkbox">
                <input type="checkbox" checked={includeArchived} onChange={(e) => setIncludeArchived(e.target.checked)} />
                <span> Zobrazit archivované</span>
              </label>
            </div>
          </div>

          <div className="detail-attachments__toolbar-right">
            {Object.entries(LOCAL_ACTIONS)
              .filter(([id]) => (isManager ? true : id === 'refresh'))
              .map(([id, def]) => (
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
      </div>

      {loading && <div className="detail-view__placeholder">Načítám přílohy…</div>}

      {!loading && errorText && (
        <div className="detail-view__placeholder">
          Chyba: <strong>{errorText}</strong>
        </div>
      )}

      {isManager && panelOpen && (
        <div className="detail-form">
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

      {isManager && editingDocId && (
        <div className="detail-form">
          <section className="detail-form__section">
            <h3 className="detail-form__section-title">Upravit metadata</h3>

            <div className="detail-form__grid detail-form__grid--narrow">
              <div className="detail-form__field detail-form__field--span-4">
                <label className="detail-form__label">Název</label>
                <input className="detail-form__input" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              </div>

              <div className="detail-form__field detail-form__field--span-4">
                <label className="detail-form__label">Popis</label>
                <input className="detail-form__input" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
              </div>

              <div className="detail-form__field detail-form__field--span-4">
                <label className="detail-form__label">&nbsp;</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="common-actions__button" onClick={() => void handleEditMetadataSave()} disabled={editSaving}>
                    <span className="common-actions__icon" aria-hidden>
                      {getIcon('save')}
                    </span>
                    <span className="common-actions__label">Uložit</span>
                  </button>
                  <button type="button" className="common-actions__button" onClick={handleEditMetadataCancel} disabled={editSaving}>
                    <span className="common-actions__icon" aria-hidden>
                      {getIcon('close')}
                    </span>
                    <span className="common-actions__label">Zrušit</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {!loading && !errorText && filteredRows.length === 0 && <div className="detail-view__placeholder">Zatím žádné přílohy.</div>}

      {!loading && !errorText && filteredRows.length > 0 && (
        <div className="detail-form">
          <section className="detail-form__section">
            <h3 className="detail-form__section-title">{isManager ? 'Přílohy' : 'Přílohy (read-only)'}</h3>

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

                const isExpanded = isManager && expandedDocId === r.id
                const versions = versionsByDocId[r.id] ?? []

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
                        <div className="detail-attachments__muted">{r.description ?? '—'}</div>
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
                        </div>
                      </div>

                      <div className="detail-attachments__cell" role="cell">
                        {isManager ? (
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="detail-attachments__small"
                              data-docid={r.id}
                              onClick={handleToggleVersions}
                              disabled={versionsLoadingId === r.id || saving}
                              title="Zobrazit/skrýt verze"
                            >
                              {isExpanded ? 'Skrýt verze' : 'Verze'}
                            </button>

                            <button
                              type="button"
                              className="detail-attachments__small"
                              data-docid={r.id}
                              data-title={r.title ?? ''}
                              data-desc={r.description ?? ''}
                              onClick={handleEditMetadataStart}
                              disabled={saving || editSaving}
                              title="Upravit metadata"
                            >
                              Upravit
                            </button>

                            <button
                              type="button"
                              className="detail-attachments__small"
                              data-docid={r.id}
                              onClick={handleAddVersionRequest}
                              disabled={saving}
                              title="Přidat novou verzi"
                            >
                              Nová verze
                            </button>

                            <input
                              ref={(el) => setVersionInputRef(r.id, el)}
                              data-docid={r.id}
                              type="file"
                              style={{ display: 'none' }}
                              onChange={handleAddVersionPick}
                            />
                          </div>
                        ) : (
                          <span className="detail-attachments__muted">—</span>
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="detail-attachments__row detail-attachments__row--sub" role="row">
                        <div className="detail-attachments__cell" role="cell" style={{ gridColumn: '1 / -1' }}>
                          {versionsLoadingId === r.id && <div className="detail-attachments__muted">Načítám verze…</div>}

                          {!versionsLoadingId && versions.length === 0 && <div className="detail-attachments__muted">Žádné verze.</div>}

                          {!versionsLoadingId && versions.length > 0 && (
                            <div style={{ display: 'grid', gap: 6 }}>
                              {versions.map((v) => {
                                const createdName = resolveName(null, v.created_by ?? null)
                                return (
                                  <div key={v.id} className="detail-attachments__version">
                                    <div>
                                      <strong>v{String(v.version_number).padStart(3, '0')}</strong> – {v.file_name}
                                    </div>
                                    <div className="detail-attachments__muted">
                                      {formatDt(v.created_at)} • kdo: {createdName}
                                    </div>
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
