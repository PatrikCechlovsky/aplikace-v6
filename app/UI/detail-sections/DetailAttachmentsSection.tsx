/*
 * FILE: app/UI/detail-sections/DetailAttachmentsSection.tsx
 * PURPOSE:
 *   UI sekce „Přílohy“ pro DetailView (sekce id: 'attachments').
 *
 * FEATURES:
 *   - READ: list příloh (v_document_latest_version)
 *   - READ: list verzí (document_versions)
 *   - OPEN: signed URL ze Storage (bucket documents)
 *   - CREATE: přidat přílohu (upload + insert documents + document_versions)
 */

'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  addAttachmentVersionWithUpload,
  createAttachmentWithUpload,
  getAttachmentSignedUrl,
  listAttachments,
  listAttachmentVersions,
  type AttachmentRow,
  type AttachmentVersionRow,
} from '@/app/lib/attachments'

export type DetailAttachmentsSectionProps = {
  entityType: string
  entityId: string
  mode: 'view' | 'edit' | 'create'
}

export default function DetailAttachmentsSection({
  entityType,
  entityId,
  mode,
}: DetailAttachmentsSectionProps) {
  const canLoad = useMemo(() => {
    return !!entityType && !!entityId && entityId !== 'new'
  }, [entityType, entityId])

  const [includeArchived, setIncludeArchived] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)
  const [rows, setRows] = useState<AttachmentRow[]>([])

  // Verze – rozbalování (on-demand) + jednoduchá cache
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null)
  const [versionsByDocId, setVersionsByDocId] = useState<Record<string, AttachmentVersionRow[]>>({})
  const [versionsLoadingId, setVersionsLoadingId] = useState<string | null>(null)

  // ✅ Přidání přílohy (simple panel)
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newFile, setNewFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  async function loadAttachments() {
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
  }

  useEffect(() => {
    if (!canLoad) return
    void loadAttachments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canLoad, entityType, entityId, includeArchived])

  async function openFileByPath(filePath: string) {
    const url = await getAttachmentSignedUrl({
      filePath,
      expiresInSeconds: 60,
    })
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  async function handleOpenLatest(row: AttachmentRow) {
    try {
      await openFileByPath(row.file_path)
    } catch (e: any) {
      setErrorText(e?.message ?? 'Nepodařilo se otevřít přílohu.')
    }
  }

  async function handleOpenVersion(v: AttachmentVersionRow) {
    try {
      await openFileByPath(v.file_path)
    } catch (e: any) {
      setErrorText(e?.message ?? 'Nepodařilo se otevřít verzi.')
    }
  }

  async function toggleVersions(documentId: string) {
    if (expandedDocId === documentId) {
      setExpandedDocId(null)
      return
    }

    setExpandedDocId(documentId)

    if (versionsByDocId[documentId]) return

    try {
      setVersionsLoadingId(documentId)
      const versions = await listAttachmentVersions({
        documentId,
        includeArchived: true,
      })
      setVersionsByDocId((prev) => ({ ...prev, [documentId]: versions }))
    } catch (e: any) {
      setErrorText(e?.message ?? 'Chyba načítání verzí.')
    } finally {
      setVersionsLoadingId(null)
    }
  }

  async function handleAddNewAttachment() {
    setErrorText(null)

    const title = newTitle.trim()
    if (!title) {
      setErrorText('Chybí název přílohy.')
      return
    }
    if (!newFile) {
      setErrorText('Vyber soubor.')
      return
    }

    setSaving(true)
    try {
      await createAttachmentWithUpload({
        entityType,
        entityId,
        title,
        description: newDesc.trim() ? newDesc.trim() : null,
        file: newFile,
      })

      // reset UI
      setNewTitle('')
      setNewDesc('')
      setNewFile(null)
      setShowAdd(false)

      // refresh list
      await loadAttachments()
    } catch (e: any) {
      setErrorText(e?.message ?? 'Nepodařilo se přidat přílohu.')
    } finally {
      setSaving(false)
    }
  }

  async function handleAddNewVersion(documentId: string, file: File) {
    setErrorText(null)
    try {
      await addAttachmentVersionWithUpload({
        entityType,
        entityId,
        documentId,
        file,
      })

      // refresh list + versions cache
      await loadAttachments()
      setVersionsByDocId((prev) => {
        const next = { ...prev }
        delete next[documentId]
        return next
      })

      // pokud byl rozbalený, znovu načti
      if (expandedDocId === documentId) {
        setExpandedDocId(null)
        setTimeout(() => void toggleVersions(documentId), 0)
      }
    } catch (e: any) {
      setErrorText(e?.message ?? 'Nepodařilo se přidat verzi.')
    }
  }

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
      {/* Horní panel */}
      <div className="detail-form__section">
        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field detail-form__field--span-4">
            <label className="detail-form__label">Zobrazení</label>

            <label className="detail-form__checkbox">
              <input
                type="checkbox"
                checked={includeArchived}
                onChange={(e) => setIncludeArchived(e.target.checked)}
              />
              <span> Zobrazit archivované</span>
            </label>
          </div>

          <div className="detail-form__field detail-form__field--span-4">
            <label className="detail-form__label">Akce</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                type="button"
                className="detail-attachments__link"
                onClick={() => setShowAdd((v) => !v)}
              >
                {showAdd ? 'Zavřít přidání' : 'Přidat přílohu'}
              </button>
            </div>
          </div>
        </div>

        {showAdd && (
          <div className="detail-form" style={{ marginTop: 10 }}>
            <section className="detail-form__section">
              <h3 className="detail-form__section-title">Nová příloha</h3>

              <div className="detail-form__grid detail-form__grid--narrow">
                <div className="detail-form__field detail-form__field--span-4">
                  <label className="detail-form__label">Název</label>
                  <input
                    className="detail-form__input"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="např. Nájemní smlouva"
                  />
                </div>

                <div className="detail-form__field detail-form__field--span-4">
                  <label className="detail-form__label">Poznámka</label>
                  <input
                    className="detail-form__input"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="volitelné"
                  />
                </div>

                <div className="detail-form__field detail-form__field--span-4">
                  <label className="detail-form__label">Soubor</label>
                  <input
                    type="file"
                    onChange={(e) => setNewFile(e.target.files?.[0] ?? null)}
                  />
                  {newFile ? (
                    <div className="detail-form__hint" style={{ marginTop: 6 }}>
                      Vybráno: <strong>{newFile.name}</strong>
                    </div>
                  ) : null}
                </div>
              </div>

              <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="detail-attachments__link"
                  disabled={saving}
                  onClick={handleAddNewAttachment}
                >
                  {saving ? 'Ukládám…' : 'Uložit přílohu'}
                </button>
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

      {!loading && !errorText && rows.length === 0 && (
        <div className="detail-view__placeholder">Zatím žádné přílohy.</div>
      )}

      {!loading && !errorText && rows.length > 0 && (
        <div className="detail-form">
          <section className="detail-form__section">
            <h3 className="detail-form__section-title">Seznam příloh</h3>

            <div className="detail-form__grid">
              {rows.map((r) => (
                <div key={r.id} className="detail-form__field detail-form__field--span-6">
                  <label className="detail-form__label">
                    {r.title}
                    {r.is_archived ? ' (archiv)' : ''}
                  </label>

                  {/* řádek: název souboru + akce */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      className="detail-form__input detail-form__input--readonly"
                      value={r.file_name}
                      readOnly
                    />

                    <button
                      type="button"
                      className="detail-attachments__link"
                      onClick={() => handleOpenLatest(r)}
                    >
                      Otevřít
                    </button>

                    <button
                      type="button"
                      className="detail-attachments__link"
                      onClick={() => toggleVersions(r.id)}
                    >
                      Verze
                    </button>

                    {/* ✅ přidat verzi (rychle) */}
                    <label className="detail-attachments__link" style={{ cursor: 'pointer' }}>
                      Přidat verzi
                      <input
                        type="file"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          e.currentTarget.value = ''
                          if (!f) return
                          void handleAddNewVersion(r.id, f)
                        }}
                      />
                    </label>
                  </div>

                  {r.description ? (
                    <div className="detail-view__placeholder">{r.description}</div>
                  ) : null}

                  {/* rozbalené verze */}
                  {expandedDocId === r.id && (
                    <div className="detail-view__placeholder">
                      {versionsLoadingId === r.id ? (
                        <>Načítám verze…</>
                      ) : (versionsByDocId[r.id] ?? []).length === 0 ? (
                        <>Žádné verze.</>
                      ) : (
                        <div>
                          {(versionsByDocId[r.id] ?? []).map((v) => (
                            <div
                              key={v.id}
                              style={{
                                display: 'flex',
                                gap: 8,
                                alignItems: 'center',
                                marginTop: 6,
                                flexWrap: 'wrap',
                              }}
                            >
                              <span>
                                v{String(v.version_number).padStart(3, '0')} — {v.file_name}
                                {v.is_archived ? ' (archiv)' : ''}
                              </span>

                              <button
                                type="button"
                                className="detail-attachments__link"
                                onClick={() => handleOpenVersion(v)}
                              >
                                Otevřít
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
