'use client'

// FILE: app/UI/detail-sections/DetailAttachmentsListSection.tsx
// Read-only attachments list for any entity (tab inside DetailView)

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getIcon } from '@/app/UI/icons'
import { listAttachments, getAttachmentSignedUrl, type AttachmentRow } from '@/app/lib/attachments'

export type DetailAttachmentsListSectionProps = {
  entityType: string
  entityId: string
  mode: 'view' | 'edit' | 'create'
}

function formatDt(s?: string | null) {
  if (!s) return '—'
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  return d.toLocaleString('cs-CZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function DetailAttachmentsListSection({ entityType, entityId, mode }: DetailAttachmentsListSectionProps) {
  const canLoad = useMemo(() => !!entityType && !!entityId && entityId !== 'new', [entityType, entityId])

  const [includeArchived, setIncludeArchived] = useState(false)
  const [filterText, setFilterText] = useState('')

  const [loading, setLoading] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)
  const [rows, setRows] = useState<AttachmentRow[]>([])

  // anti-storm
  const loadInFlightRef = useRef<Promise<void> | null>(null)
  const lastLoadKeyRef = useRef<string>('')

  const load = useCallback(async () => {
    const key = `${entityType}:${entityId}:${includeArchived ? '1' : '0'}`
    if (loadInFlightRef.current && lastLoadKeyRef.current === key) return loadInFlightRef.current
    lastLoadKeyRef.current = key

    const p = (async () => {
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
    })()

    loadInFlightRef.current = p
    try {
      await p
    } finally {
      if (loadInFlightRef.current === p) loadInFlightRef.current = null
    }
  }, [entityType, entityId, includeArchived])

  useEffect(() => {
    if (!canLoad) return
    void load()
  }, [canLoad, load])

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

  const openFile = useCallback(async (filePath: string) => {
    const url = await getAttachmentSignedUrl({ filePath, expiresInSeconds: 60 })
    window.open(url, '_blank', 'noopener,noreferrer')
  }, [])

  const onOpen = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      const path = e.currentTarget.dataset.path
      if (!path) return
      setErrorText(null)
      try {
        await openFile(path)
      } catch (err: any) {
        setErrorText(err?.message ?? 'Nepodařilo se otevřít soubor.')
      }
    },
    [openFile]
  )

  if (!canLoad) {
    return (
      <div className="detail-view__section">
        <div className="detail-view__placeholder">
          Přílohy budou dostupné po uložení záznamu. <br />
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
                <input
                  type="checkbox"
                  checked={includeArchived}
                  onChange={(e) => setIncludeArchived(e.target.checked)}
                />
                <span> Zobrazit archivované</span>
              </label>
            </div>
          </div>

          <div className="detail-attachments__toolbar-right">
            <button type="button" className="common-actions__button" onClick={() => void load()} title="Obnovit">
              <span className="common-actions__icon" aria-hidden>
                {getIcon('refresh')}
              </span>
              <span className="common-actions__label">Obnovit</span>
            </button>
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

      {!loading && !errorText && filteredRows.length > 0 && (
        <div className="detail-form">
          <section className="detail-form__section">
            <h3 className="detail-form__section-title">Přílohy (read-only)</h3>

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

              {filteredRows.map((r) => (
                <div key={r.id} className="detail-attachments__row" role="row">
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
                        onClick={onOpen}
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
                    <div className="detail-attachments__muted">{formatDt(r.version_created_at)}</div>
                  </div>

                  <div className="detail-attachments__cell" role="cell">
                    <button
                      type="button"
                      className="detail-attachments__small"
                      data-path={r.file_path}
                      onClick={onOpen}
                      title="Otevřít"
                    >
                      Otevřít
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
