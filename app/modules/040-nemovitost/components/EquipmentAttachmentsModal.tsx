// FILE: app/modules/040-nemovitost/components/EquipmentAttachmentsModal.tsx
// PURPOSE: Modal pro správu příloh na vazbách vybavení (unit_equipment, property_equipment)
// NOTES: Používá existující attachments systém s entity_type='equipment_binding' či 'property_equipment_binding'

'use client'

import React, { useEffect, useState } from 'react'
import {
  listAttachments,
  updateAttachmentMetadata,
  getAttachmentSignedUrl,
  createAttachmentWithUpload,
  getUploadSizeError,
  MAX_UPLOAD_SIZE_LABEL,
  type AttachmentRow,
} from '@/app/lib/attachments'
import { useToast } from '@/app/UI/Toast'
import { getIcon, type IconKey } from '@/app/UI/icons'
import createLogger from '@/app/lib/logger'
import '@/app/styles/components/DetailForm.css'

const logger = createLogger('EquipmentAttachmentsModal')

type Props = {
  isOpen: boolean
  onClose: () => void
  equipmentBindingId: string // ID unit_equipment nebo property_equipment
  bindingType: 'unit_equipment' | 'property_equipment' // typ vazby
  equipmentName: string // název vybavení pro display
}

export default function EquipmentAttachmentsModal({
  isOpen,
  onClose,
  equipmentBindingId,
  bindingType,
  equipmentName,
}: Props) {
  const toast = useToast()
  const [attachments, setAttachments] = useState<AttachmentRow[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDescription, setUploadDescription] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  // Entity type pro attachments
  const entityType = bindingType === 'unit_equipment' ? 'equipment_binding' : 'property_equipment_binding'

  // Načíst přílohy
  useEffect(() => {
    if (!isOpen) return

    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        const data = await listAttachments({
          entityType,
          entityId: equipmentBindingId,
          includeArchived: false,
        })
        if (!cancelled) {
          setAttachments(data)
        }
      } catch (e: any) {
        if (!cancelled) {
          logger.error('listAttachments failed', e)
          toast.showError(e?.message ?? 'Chyba při načítání příloh')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [isOpen, entityType, equipmentBindingId, toast])

  // Upload
  const handleUpload = async () => {
    try {
      if (!uploadTitle.trim()) {
        toast.showWarning('Zadejte název přílohy.')
        return
      }

      if (!uploadFile) {
        toast.showWarning('Vyberte soubor.')
        return
      }

      const sizeError = getUploadSizeError(uploadFile)
      if (sizeError) {
        toast.showWarning(sizeError)
        return
      }

      setUploading(true)
      await createAttachmentWithUpload({
        entityType,
        entityId: equipmentBindingId,
        entityLabel: `Vybavení: ${equipmentName}`,
        title: uploadTitle,
        description: uploadDescription || undefined,
        file: uploadFile,
      })

      // Obnovit seznam
      const updated = await listAttachments({
        entityType,
        entityId: equipmentBindingId,
        includeArchived: false,
      })
      setAttachments(updated)

      // Reset formulář
      setUploadTitle('')
      setUploadDescription('')
      setUploadFile(null)
      setShowUploadForm(false)
      toast.showSuccess('Příloha nahrána')
    } catch (e: any) {
      logger.error('createAttachmentWithUpload failed', e)
      toast.showError(e?.message ?? 'Chyba při nahrávání')
    } finally {
      setUploading(false)
    }
  }

  // Delete
  const handleDelete = async (attachmentId: string) => {
    if (!window.confirm('Smazat tuto přílohu?')) return

    try {
      await updateAttachmentMetadata({
        documentId: attachmentId,
        title: 'archivní',
      })
      // Trvale archivujeme, stačí obnovit seznam (bez archivovaných)
      const updated = await listAttachments({
        entityType,
        entityId: equipmentBindingId,
        includeArchived: false,
      })
      setAttachments(updated)
      toast.showSuccess('Příloha smazána')
    } catch (e: any) {
      logger.error('deleteAttachment failed', e)
      toast.showError(e?.message ?? 'Chyba při mazání')
    }
  }

  // Download
  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const url = await getAttachmentSignedUrl({ filePath })
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (e: any) {
      logger.error('getAttachmentSignedUrl failed', e)
      toast.showError(e?.message ?? 'Chyba při stahování')
    }
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--color-bg-primary)',
          borderRadius: 'var(--border-radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          padding: '20px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>📎 Přílohy - {equipmentName}</h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '20px',
              padding: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Loading */}
        {loading && <div style={{ padding: '20px', textAlign: 'center' }}>Načítám přílohy…</div>}

        {/* List */}
        {!loading && attachments.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            Zatím žádné přílohy.
          </div>
        )}

        {!loading && attachments.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ marginTop: 0, marginBottom: 12 }}>Existující přílohy:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {attachments.map((att) => (
                <div
                  key={att.id}
                  style={{
                    padding: '12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--border-radius-sm)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>{att.title}</div>
                    {att.file_name && (
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                        {att.file_name} ({att.file_size ? `${(att.file_size / 1024).toFixed(1)} KB` : '?'})
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginLeft: 12 }}>
                    <button
                      type="button"
                      onClick={() => handleDownload(att.file_path, att.file_name)}
                      className="common-actions__btn"
                      title="Stáhnout"
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                    >
                      ⬇️
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(att.id)}
                      className="common-actions__btn"
                      title="Smazat"
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Form */}
        {!showUploadForm && (
          <button
            type="button"
            onClick={() => setShowUploadForm(true)}
            className="common-actions__btn"
            style={{ width: '100%', marginTop: 12 }}
          >
            <span className="common-actions__icon">{getIcon('add' as IconKey)}</span>
            <span className="common-actions__label">Přidat přílohu</span>
          </button>
        )}

        {showUploadForm && (
          <div style={{ padding: '12px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius-sm)' }}>
            <h4 style={{ marginTop: 0, marginBottom: 12 }}>Nahrát soubor:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: '13px', fontWeight: 500 }}>
                  Název přílohy <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="detail-form__input"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="např. Fotografie vybavení"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: '13px', fontWeight: 500 }}>
                  Popis
                </label>
                <textarea
                  className="detail-form__input"
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  rows={3}
                  placeholder="Volitelný popis…"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: '13px', fontWeight: 500 }}>
                  Soubor <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    const sizeError = file ? getUploadSizeError(file) : null
                    if (sizeError) {
                      toast.showWarning(sizeError)
                      setUploadFile(null)
                      e.currentTarget.value = ''
                      return
                    }
                    setUploadFile(file)
                  }}
                  style={{
                    display: 'block',
                    padding: '8px',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--border-radius-sm)',
                    width: '100%',
                  }}
                />
                <div style={{ marginTop: 6, fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  Max velikost: {MAX_UPLOAD_SIZE_LABEL}.
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadForm(false)
                    setUploadTitle('')
                    setUploadDescription('')
                    setUploadFile(null)
                  }}
                  className="common-actions__btn"
                  style={{ background: 'var(--color-bg-tertiary)' }}
                >
                  Zrušit
                </button>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading || !uploadTitle.trim() || !uploadFile}
                  className="common-actions__btn"
                  style={{ background: uploading ? 'var(--color-disabled)' : 'var(--color-primary)' }}
                >
                  {uploading ? 'Nahrávám…' : 'Nahrát'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
