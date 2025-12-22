'use client'

/**
 * FILE: app/UI/detail-sections/DetailAttachmentsSection.tsx
 *
 * PURPOSE:
 * Detail tab "Přílohy" – jednotný UI toolbar (jako CommonActions) + list příloh + upload.
 * - Vlevo: filtr + zobrazit archivované
 * - Vpravo: grafická tlačítka (ikona/label se chová stejně jako CommonActions)
 * - Akce: Přidat přílohu, Uložit (bez zavření), Zavřít (bez uložení + kontrola rozpracovanosti)
 */

import React, { useEffect, useMemo, useState } from 'react'
import { getIcon } from '@/app/UI/icons'
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

type LocalActionId = 'addAttachment' | 'saveAttachment' | 'closePanel'

const LOCAL_ACTIONS: Record<
  LocalActionId,
  {
    icon: string
    label: string
    title: string
  }
> = {
  addAttachment: {
    icon: 'add',
    label: 'Přidat přílohu',
    title: 'Přidat přílohu',
  },
  saveAttachment: {
    icon: 'save',
    label: 'Uložit',
    title: 'Uložit (bez zavření)',
  },
  closePanel: {
    icon: 'close',
    label: 'Zavřít',
    title: 'Zavřít bez uložení',
  },
}

export default function DetailAttachmentsSection({ entityType, entityId, mode }: DetailAttachmentsSectionProps) {
  /* =========================
     STATE
     ========================= */

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

  const panelDirty = useMemo(() => !!newTitle.trim() || !!newDesc.trim() || !!newFile, [newTitle, newDesc, newFile])

  /* =========================
     LOADERS
     ========================= */

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

  /* =========================
     HELPERS
     ========================= */

  function resetPanel() {
    setNewTitle('')
    setNewDesc('')
    setNewFile(null)
  }

  const filteredRows = useMemo(() => {
    const t = filterText.trim().toLowerCase()
    if (!t) return rows
    return rows.filter((r) => {
      const a = (r.title ?? '').toLowerCase()
      const b = (r.file_name ?? '').toLowerCase()
      return a.includes(t) || b.includes(t)
    })
  }, [rows, filterText])

  async function openFileByPath(filePath: string) {
    const url = await getAttachmentSignedUrl({ filePath, expiresInSeconds: 60 })
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  /* =========================
     HANDLERS
     ========================= */

  async function handleOpenLatest(row: AttachmentRow) {
    setErrorText(null)
    try {
      await openFileByPath(row.file_path)
    } catch (e: any) {
      setErrorText(e?.message ?? 'Nepodařilo se otevřít přílohu.')
    }
  }

  async function handleOpenVersion(v: AttachmentVersionRow) {
    setErrorText(null)
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

    setErrorText(null)
    try {
      setVersionsLoadingId(documentId)
      const versions = await listAttachmentVersions({ documentId, includeArchived: true })
      setVersionsByDocId((prev) => ({ ...prev, [documentId]: versions }))
    } catch (e: any) {
      setErrorText(e?.message ?? 'Chyba načítání verzí.')
    } finally {
      setVersionsLoadingId(null)
    }
  }

  async function handleAddNewVersion(documentId: string, file: File) {
    setErrorText(null)
    try {
      await addAttachmentVersionWithUpload({ entityType, entityId, documentId, file })
      await loadAttachments()

      // invalidate cache versions
      setVersionsByDocId((prev) => {
        const next = { ...prev }
        delete next[documentId]
        return next
      })

      // re-open versions if it was expanded
      if (expandedDocId === documentId) {
        setExpandedDocId(null)
        setTimeout(() => void toggleVersions(documentId), 0)
      }
    } catch (e: any) {
      setErrorText(e?.message ?? 'Nepodařilo se přidat verzi.')
    }
  }

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

  function onActionClick(id: LocalActionId) {
    if (id === 'addAttachment') return handleActionAdd()
    if (id === 'saveAttachment') return void handleActionSave()
    if (id === 'closePanel') return handleActionClose()
  }

  const saveDisabled = !panelOpen || saving
  const closeDisabled = !panelOpen && !panelDirty

  /* =========================
     RENDER
     ========================= */

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
      {/* =========================================================
         TOOLBAR (vlevo filtr + archiv, vpravo akce jako CommonActions)
         ========================================================= */}
      <div className="detail-form__section">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          {/* LEFT */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div>
              <label className="detail-form__label" style={{ display: 'none' }}>Filtr</label>
              <input
                className="detail-form__input"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Hledat podle názvu nebo popisu"
                style={{ minWidth: 280 }}
              />
            </div>

            <div>
              <label className="detail-form__label">&nbsp;</label>
              <label className="detail-form__checkbox" style={{ marginTop: 6 }}>
                <input
                  type="checkbox"
                  checked={includeArchived}
                  onChange={(e) => setIncludeArchived(e.target.checked)}
                />
                <span> Zobrazit archivované</span>
              </label>
            </div>
          </div>

          {/* RIGHT (oranžová oblast) */}
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
                  onClick={() => !disabled && onActionClick(id)}
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

        {/* =========================================================
           ADD PANEL
           ========================================================= */}
        {panelOpen && (
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
                  <input type="file" onChange={(e) => setNewFile(e.target.files?.[0] ?? null)} />
                  
                </div>
              </div>

              <div className="detail-form__hint" style={{ marginTop: 8 }}>
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

            <div className="detail-form__grid">
              {filteredRows.map((r) => (
                <div key={r.id} className="detail-form__field detail-form__field--span-6">
                  <label className="detail-form__label">
                    {r.title}
                    {r.is_archived ? ' (archiv)' : ''}
                  </label>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input className="detail-form__input detail-form__input--readonly" value={r.file_name} readOnly />

                    <button type="button" className="detail-attachments__link" onClick={() => handleOpenLatest(r)}>
                      Otevřít
                    </button>

                    <button type="button" className="detail-attachments__link" onClick={() => toggleVersions(r.id)}>
                      Verze
                    </button>

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

                  {r.description ? <div className="detail-view__placeholder">{r.description}</div> : null}

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
                              style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}
                            >
                              <span>
                                v{String(v.version_number).padStart(3, '0')} — {v.file_name}
                                {v.is_archived ? ' (archiv)' : ''}
                              </span>

                              <button type="button" className="detail-attachments__link" onClick={() => handleOpenVersion(v)}>
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
