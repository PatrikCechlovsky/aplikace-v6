/*
 * FILE: app/UI/detail-sections/DetailAttachmentsSection.tsx
 * PURPOSE:
 *   UI sekce „Přílohy“ pro DetailView (sekce id: 'attachments').
 *
 * CURRENT STATE:
 *   - KROK 3: načtení seznamu příloh pro entitu (READ)
 *   - KROK 4a: otevření souboru přes signed URL (Storage bucket `documents`)
 *   - KROK 4b: rozbalení a zobrazení verzí (document_versions) + otevření verze
 *
 * NOTES:
 *   - Žádné lokální „+ Přidat“ akce (to bude později přes CommonActions / dialog)
 *   - Styling používá existující třídy detail-form / detail-view
 */

'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
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
  const [versionsByDocId, setVersionsByDocId] = useState<
    Record<string, AttachmentVersionRow[]>
  >({})
  const [versionsLoadingId, setVersionsLoadingId] = useState<string | null>(null)

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
    // zavřít
    if (expandedDocId === documentId) {
      setExpandedDocId(null)
      return
    }

    // otevřít
    setExpandedDocId(documentId)

    // pokud už máme načteno, dál nic
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
      {/* Přepínač zobrazení – bez vlastních akcí */}
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
        </div>
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
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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
