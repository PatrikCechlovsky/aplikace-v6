/*
 * FILE: app/UI/detail-sections/DetailAttachmentsSection.tsx
 * PURPOSE:
 *   UI sekce „Přílohy“ pro DetailView (sekce id: 'attachments')
 *
 * CURRENT STATE:
 *   - KROK 3: načítá seznam příloh pro entitu (READ)
 *   - bez uploadu / bez archivace / bez práce s verzemi v UI
 */

'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { listAttachments, type AttachmentRow } from '@/app/lib/attachments'

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
  // v create režimu často bývá entityId = 'new' → ještě není kam vázat přílohy
  const canLoad = useMemo(() => {
    return !!entityType && !!entityId && entityId !== 'new'
  }, [entityType, entityId])

  const [includeArchived, setIncludeArchived] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)
  const [rows, setRows] = useState<AttachmentRow[]>([])

  useEffect(() => {
    if (!canLoad) return

    let cancelled = false
    setLoading(true)
    setErrorText(null)

    listAttachments({ entityType, entityId, includeArchived })
      .then((data) => {
        if (cancelled) return
        setRows(data)
      })
      .catch((e) => {
        if (cancelled) return
        setErrorText(e?.message ?? 'Chyba načítání příloh.')
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [canLoad, entityType, entityId, includeArchived])

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
      {/* jen přepínač zobrazení, žádné “+ Přidat” (to bude přes CommonActions později) */}
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

                  <input
                    className="detail-form__input detail-form__input--readonly"
                    value={r.file_name}
                    readOnly
                  />

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
