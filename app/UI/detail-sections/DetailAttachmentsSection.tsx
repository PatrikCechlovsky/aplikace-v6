/*
 * FILE: app/UI/detail-sections/DetailAttachmentsSection.tsx
 * PURPOSE: Sekce „Přílohy“ v DetailView (READ + otevření souboru přes signed URL).
 */

'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  getAttachmentSignedUrl,
  listAttachments,
  type AttachmentRow,
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
  const canLoad = useMemo(
    () => !!entityType && !!entityId && entityId !== 'new',
    [entityType, entityId]
  )

  const [includeArchived, setIncludeArchived] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)
  const [rows, setRows] = useState<AttachmentRow[]>([])

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

  async function handleOpen(row: AttachmentRow) {
    try {
      const url = await getAttachmentSignedUrl({ filePath: row.file_path, expiresInSeconds: 60 })
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (e: any) {
      setErrorText(e?.message ?? 'Nepodařilo se otevřít přílohu.')
    }
  }

  if (!canLoad) {
    return (
      <div className="detail-view__section">
        <div className="detail-view__placeholder">
          Přílohy budou dostupné po uložení záznamu.<br />
          Režim: <strong>{mode}</strong>
        </div>
      </div>
    )
  }

  return (
    <div className="detail-view__section">
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

                  <div className="detail-attachments__row">
                    <input
                      className="detail-form__input detail-form__input--readonly"
                      value={r.file_name}
                      readOnly
                    />

                    <button
                      type="button"
                      className="detail-attachments__link"
                      onClick={() => handleOpen(r)}
                    >
                      Otevřít
                    </button>
                  </div>

                  {r.description ? (
                    <div className="detail-view__placeholder">{r.description}</div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
