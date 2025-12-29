// ============================================================================
// 1) IMPORTS
// ============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { ListView } from '../ListView'
import type { ListViewColumn, ListViewRow } from '../ListView'

import {
  getAttachmentSignedUrl,
  listEntityAttachmentsLatest,
} from '@/app/lib/attachments'

// ============================================================================
// 2) TYPES
// ============================================================================
type Props = {
  entityType: string
  entityId: string | null
  entityLabel?: string | null
  mode: 'create' | 'edit' | 'view'
}

// Data coming from your "latest attachments" view
type AttachmentLatestRow = {
  id: string
  title: string | null
  description: string | null
  file_path: string | null
  file_name: string | null
  version_number: number | null
  version_created_at: string | null
  version_created_by: string | null
  version_created_by_name: string | null
  is_archived: boolean
}

// ============================================================================
// 3) HELPERS
// ============================================================================
const safe = (v: any, fallback = '—') => (v === null || v === undefined || v === '' ? fallback : String(v))

const fmtVersion = (n: number | null) => {
  if (!n && n !== 0) return '—'
  return `v${String(n).padStart(3, '0')}`
}

const fmtDt = (iso: string | null) => {
  if (!iso) return '—'
  const d = new Date(iso)
  // CZ: datum + čas, bez dalších nesmyslů
  return d.toLocaleString('cs-CZ', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const resolveName = (name: string | null, fallbackId: string | null) => {
  const n = (name ?? '').trim()
  if (n) return n
  return safe(fallbackId, '—')
}

// ============================================================================
// 4) DATA LOAD
// ============================================================================
export default function DetailAttachmentsSection(props: Props) {
  const { entityType, entityId, entityLabel, mode } = props

  const [loading, setLoading] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)

  const [includeArchived, setIncludeArchived] = useState(false)
  const [filterText, setFilterText] = useState('')

  const [rows, setRows] = useState<AttachmentLatestRow[]>([])

  const canLoad = !!entityId && (mode === 'edit' || mode === 'view')

  const loadAttachments = useCallback(async () => {
    if (!canLoad || !entityId) return
    setLoading(true)
    setErrorText(null)
    try {
      const data = await listEntityAttachmentsLatest({
        entityType,
        entityId,
        includeArchived,
      })
      setRows((data ?? []) as AttachmentLatestRow[])
    } catch (e: any) {
      setErrorText(e?.message ?? 'Nepodařilo se načíst přílohy.')
    } finally {
      setLoading(false)
    }
  }, [canLoad, entityId, entityType, includeArchived])

  useEffect(() => {
    void loadAttachments()
  }, [loadAttachments])

// ============================================================================
// 5) ACTION HANDLERS
// ============================================================================
  const openFileByPath = useCallback(async (filePath: string) => {
    const url = await getAttachmentSignedUrl({ filePath, expiresInSeconds: 60 })
    window.open(url, '_blank', 'noopener,noreferrer')
  }, [])

  const handleOpenLatest = useCallback(
    async (filePath: string | null) => {
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

  const handleArchivedToggle = useCallback((next: boolean) => {
    setIncludeArchived(next)
  }, [])

  const handleFilterChange = useCallback((v: string) => {
    setFilterText(v)
  }, [])
// ============================================================================
// 6) RENDER
// ============================================================================
  const filteredRows = useMemo(() => {
    const q = filterText.trim().toLowerCase()
    const base = includeArchived ? rows : rows.filter((r) => !r.is_archived)
    if (!q) return base
    return base.filter((r) => {
      return (
        (r.title ?? '').toLowerCase().includes(q) ||
        (r.description ?? '').toLowerCase().includes(q) ||
        (r.file_name ?? '').toLowerCase().includes(q)
      )
    })
  }, [rows, includeArchived, filterText])

  const columns: ListViewColumn[] = useMemo(
    () => [
      { id: 'title', label: 'Název', width: 180 },
      { id: 'desc', label: 'Popis', width: 220 },
      { id: 'file', label: 'Soubor (latest)', width: 280 },
      { id: 'ver', label: 'Verze', width: 90 },
      { id: 'uploaded', label: 'Nahráno', width: 260 },
    ],
    []
  )

  const listRows: ListViewRow[] = useMemo(() => {
    return filteredRows.map((r) => {
      const uploadedName = resolveName(r.version_created_by_name ?? null, r.version_created_by ?? null)

      return {
        id: r.id,
        isArchived: r.is_archived,
        cells: {
          title: safe(r.title),
          desc: safe(r.description),
          file: (
            <button
              type="button"
              className="detail-attachments__link"
              onClick={() => void handleOpenLatest(r.file_path)}
              title="Otevřít soubor"
            >
              {safe(r.file_name)}
            </button>
          ),
          ver: fmtVersion(r.version_number ?? null),
          uploaded: `${fmtDt(r.version_created_at ?? null)} • kdo: ${uploadedName}`,
        },
      }
    })
  }, [filteredRows, handleOpenLatest])

  if (!canLoad) {
    return (
      <div className="detail-view__section">
        <div className="detail-view__placeholder">
          Přílohy budou dostupné po uložení záznamu.
          <br />
          Režim: <strong>{mode}</strong>
          {entityLabel ? <div style={{ marginTop: 6 }}>Entita: {entityLabel}</div> : null}
        </div>
      </div>
    )
  }

  return (
    <div className="detail-view__section">
      <div className="detail-form">
        <section className="detail-form__section">
          <h3 className="detail-form__section-title">Přílohy (read-only)</h3>

          {loading && <div className="detail-view__placeholder">Načítám přílohy…</div>}

          {!loading && errorText && (
            <div className="detail-view__placeholder">
              Chyba: <strong>{errorText}</strong>
            </div>
          )}

          {!loading && !errorText && (
            <div className="detail-attachments__list-wrap">
              <ListView
                columns={columns}
                rows={listRows}
                loading={false}
                error={null}
                filterText={filterText}
                onFilterTextChange={handleFilterChange}
                filterPlaceholder="Hledat podle názvu, popisu nebo souboru"
                showArchived={includeArchived}
                onShowArchivedChange={handleArchivedToggle}
              />
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
