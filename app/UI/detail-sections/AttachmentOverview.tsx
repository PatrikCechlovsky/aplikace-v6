'use client'

/**
 * FILE: app/UI/detail-sections/AttachmentOverview.tsx
 *
 * PURPOSE:
 * Read-only přehled příloh pro detail entity:
 * - zobrazuje jen latest verze (listAttachments → v_document_latest_version)
 * - defaultně jen nearchivní (includeArchived = false)
 * - klik na název souboru otevře signed URL
 *
 * FÁZE 1:
 * - bez editace, bez uploadu, bez historie, bez row akcí
 * - volitelně filtr + toggle „zobrazit archivované“ (read-only UX)
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getAttachmentSignedUrl,
  listAttachments,
  loadUserDisplayNames,
  type AttachmentRow,
  type UserNameMap,
} from '@/app/lib/attachments'
import { formatDateTime } from '@/app/lib/formatters/formatDateTime'

export type AttachmentOverviewProps = {
  entityType: string
  entityId: string
  /** režim detailu – jen kvůli hlášce „až po uložení“ */
  mode?: 'view' | 'edit' | 'create'
  /** zobrazit filtr (default true) */
  showFilter?: boolean
  /** zobrazit toggle archivovaných (default true) */
  showArchivedToggle?: boolean
}

function mergeNameMaps(a: UserNameMap, b: UserNameMap): UserNameMap {
  return { ...a, ...b }
}

export default function AttachmentOverview({
  entityType,
  entityId,
  mode = 'view',
  showFilter = true,
  showArchivedToggle = true,
}: AttachmentOverviewProps) {
  const canLoad = useMemo(() => !!entityType && !!entityId && entityId !== 'new', [entityType, entityId])

  const [includeArchived, setIncludeArchived] = useState(false)
  const [filterText, setFilterText] = useState('')

  const [loading, setLoading] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)
  const [rows, setRows] = useState<AttachmentRow[]>([])

  // fallback mapování userId -> display_name (když *_name je null)
  const [nameById, setNameById] = useState<UserNameMap>({})

  const refreshNamesFromRows = useCallback(async (items: AttachmentRow[]) => {
    const ids: (string | null | undefined)[] = []
    for (const r of items) {
      ids.push(r.version_created_by ?? null)
      ids.push(r.updated_by ?? null)
      ids.push(r.created_by ?? null)
    }
    const map = await loadUserDisplayNames(ids)
    setNameById((prev) => mergeNameMaps(prev, map))
  }, [])

  const load = useCallback(async () => {
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
  }, [entityType, entityId, includeArchived, refreshNamesFromRows])

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

  const handleArchivedToggle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setIncludeArchived(e.target.checked)
  }, [])

  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterText(e.target.value)
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
      {(showFilter || showArchivedToggle) && (
        <div className="detail-form__section" style={{ marginBottom: 8 }}>
          <div className="detail-attachments__toolbar">
            <div className="detail-attachments__toolbar-left">
              {showFilter && (
                <div className="detail-attachments__filter">
                  <label className="detail-form__label detail-attachments__label-hidden">Filtr</label>
                  <input
                    className="detail-form__input"
                    value={filterText}
                    onChange={handleFilterChange}
                    placeholder="Hledat podle názvu, popisu nebo souboru"
                  />
                </div>
              )}

              {showArchivedToggle && (
                <div className="detail-attachments__archived">
                  <label className="detail-form__label">&nbsp;</label>
                  <label className="detail-form__checkbox detail-attachments__checkbox">
                    <input type="checkbox" checked={includeArchived} onChange={handleArchivedToggle} />
                    <span> Zobrazit archivované</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
            <h3 className="detail-form__section-title">Přílohy</h3>

            <div className="detail-attachments__table" role="table" aria-label="Přílohy (přehled)">
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
              </div>

              {filteredRows.map((r) => {
                const uploadedName = resolveName(r.version_created_by_name ?? null, r.version_created_by ?? null)

                return (
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
                          onClick={handleOpenLatest}
                          title="Otevřít soubor"
                        >
                          {r.file_name}
                        </button>
                      </div>
                    </div>

                    <div className="detail-attachments__cell" role="cell">
                      <span className="detail-attachments__mono">v{String(r.version_number).padStart(3, '0')}</span>
                    </div>

                    <div className="detail-attachments__cell" role="cell">
                      <div className="detail-attachments__meta">
                        <div>{formatDateTime(r.version_created_at ?? r.created_at)}</div>
                        <div className="detail-attachments__muted">{uploadedName}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* FÁZE 1: žádné akce. Sem později dáme třeba link "Spravovat přílohy…" */}
          </section>
        </div>
      )}
    </div>
  )
}
