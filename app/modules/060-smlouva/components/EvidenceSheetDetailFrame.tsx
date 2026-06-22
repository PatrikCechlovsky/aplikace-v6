// FILE: app/modules/060-smlouva/components/EvidenceSheetDetailFrame.tsx
// PURPOSE: Detail evidenčního listu smlouvy (tabs: detail, osoby, služby, přílohy, systém)
// NOTES: Napojeno na contract_evidence_sheets a podřízené tabulky

'use client'

import React, { useCallback, useEffect, useState } from 'react'
import DetailView, { type DetailSectionId, type DetailViewMode } from '@/app/UI/DetailView'
import EvidenceSheetDetailForm, { type EvidenceSheetFormValue } from './EvidenceSheetDetailForm'
import EvidenceSheetUsersTab from './EvidenceSheetUsersTab'
import EvidenceSheetServicesTab from './EvidenceSheetServicesTab'
import { useToast } from '@/app/UI/Toast'
import createLogger from '@/app/lib/logger'
import { formatDateTime } from '@/app/lib/formatters/formatDateTime'
import {
  getEvidenceSheet,
  listEvidenceSheets,
  listEvidenceSheetServices,
  listEvidenceSheetUsers,
  updateEvidenceSheet,
  activateEvidenceSheet,
  type EvidenceSheetRow,
} from '@/app/lib/services/contractEvidenceSheets'

const logger = createLogger('EvidenceSheetDetailFrame')

type Props = {
  sheetId: string
  contractId: string
  tenantId: string | null
  tenantLabel?: string | null
  tenantSubjectType?: string | null
  tenantBirthDate?: string | null
  contractNumber: string | null
  contractSignedAt: string | null
  contractValidTo?: string | null
  landlordName?: string | null
  propertyName?: string | null
  unitName?: string | null
  readOnly?: boolean
  onSheetUpdated?: () => Promise<void> | void
}

export default function EvidenceSheetDetailFrame({
  sheetId,
  contractId,
  tenantId,
  tenantLabel,
  tenantSubjectType,
  tenantBirthDate,
  contractNumber,
  contractSignedAt,
  contractValidTo,
  landlordName,
  propertyName,
  unitName,
  readOnly = false,
  onSheetUpdated,
}: Props) {
  const toast = useToast()
  const [sheet, setSheet] = useState<EvidenceSheetRow | null>(null)
  const [replaceOptions, setReplaceOptions] = useState<{ id: string; label: string }[]>([])
  const [attachmentsCount, setAttachmentsCount] = useState(0)
  const [usersCount, setUsersCount] = useState(0)
  const [servicesCount, setServicesCount] = useState(0)
  const [pendingValue, setPendingValue] = useState<EvidenceSheetFormValue | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSave = useCallback(async () => {
    if (!sheet || !pendingValue) return

    setIsProcessing(true)
    try {
      const patch: Partial<EvidenceSheetRow> = {
        valid_from: pendingValue.validFrom || null,
        valid_to: pendingValue.validTo || null,
        replaces_sheet_id: pendingValue.replacesSheetId || null,
        rent_amount: pendingValue.rentAmount ?? null,
        description: pendingValue.description || null,
        notes: pendingValue.notes || null,
      }
      const updated = await updateEvidenceSheet(sheet.id, patch)
      setSheet(updated)
      setPendingValue(null)
      toast.showSuccess('Evidenční list uložen')
      await onSheetUpdated?.()
    } catch (err: any) {
      logger.error('save evidence sheet failed', err)
      toast.showError(err?.message ?? 'Nepodařilo se uložit evidenční list')
    } finally {
      setIsProcessing(false)
    }
  }, [sheet, pendingValue, toast, onSheetUpdated])

  const handleRelease = useCallback(async () => {
    if (!sheet || sheet.status !== 'draft') return

    setIsProcessing(true)
    try {
      const activated = await activateEvidenceSheet(sheet.id)
      setSheet(activated)
      setPendingValue(null)
      toast.showSuccess('Evidenční list aktivován')
      await onSheetUpdated?.()
    } catch (err: any) {
      logger.error('activate evidence sheet failed', err)
      toast.showError(err?.message ?? 'Nepodařilo se aktivovat evidenční list')
    } finally {
      setIsProcessing(false)
    }
  }, [sheet, toast, onSheetUpdated])

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        const [current, allSheets] = await Promise.all([
          getEvidenceSheet(sheetId),
          listEvidenceSheets(contractId, true),
        ])

        if (!mounted) return

        setSheet(current)
        setReplaceOptions(
          allSheets
            .filter((s) => s.id !== sheetId)
            .map((s) => ({
              id: s.id,
              label: `Evidenční list č. ${s.sheet_number}`,
            }))
        )
      } catch (err: any) {
        logger.error('load evidence sheet failed', err)
        toast.showError(err?.message ?? 'Nepodařilo se načíst evidenční list')
      }
    }

    void load()
    return () => {
      mounted = false
    }
  }, [sheetId, contractId, toast])

  // Load counts for services and attachments
  useEffect(() => {
    let mounted = true

    ;(async () => {
      try {
        const servicesRows = await listEvidenceSheetServices(sheetId)
        if (mounted) {
          setServicesCount(servicesRows.length)
        }
      } catch (err: any) {
        logger.error('Failed to load evidence sheet services count', err)
      }
    })()

    return () => {
      mounted = false
    }
  }, [sheetId])

  // Load count for users
  useEffect(() => {
    let mounted = true

    ;(async () => {
      try {
        const usersRows = await listEvidenceSheetUsers(sheetId)
        if (mounted) {
          const baseCount = tenantId ? 1 : 0
          const finalCount = baseCount + usersRows.length
          setUsersCount(finalCount)
        }
      } catch (err: any) {
        logger.error('Failed to load evidence sheet users count', err)
      }
    })()

    return () => {
      mounted = false
    }
  }, [sheetId, tenantId])

  if (!sheet) {
    return <div className="detail-form__hint">Načítám evidenční list…</div>
  }

  const systemBlocks = [
    {
      title: 'Metadata',
      visible: true,
      content: (
        <div className="detail-form">
          <div className="detail-form__grid detail-form__grid--narrow">
              <div className="detail-form__field">
                <label className="detail-form__label">Stav</label>
                <input className="detail-form__input detail-form__input--readonly" value={sheet.status} readOnly />
              </div>
            <div className="detail-form__field">
              <label className="detail-form__label">Vytvořeno</label>
              <input className="detail-form__input detail-form__input--readonly" value={formatDateTime(sheet.created_at)} readOnly />
            </div>
            <div className="detail-form__field">
              <label className="detail-form__label">Aktualizováno</label>
              <input className="detail-form__input detail-form__input--readonly" value={formatDateTime(sheet.updated_at)} readOnly />
            </div>
          </div>
        </div>
      ),
    },
  ]

  const isLocked = readOnly
  const detailViewMode: DetailViewMode = isLocked ? 'view' : 'edit'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {!isLocked && sheet.status === 'draft' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 12, flexShrink: 0 }}>
          <button
            type="button"
            className="common-actions__btn"
            onClick={handleSave}
            disabled={isProcessing || !pendingValue}
          >
            <span className="common-actions__label">Uložit</span>
          </button>
          <button
            type="button"
            className="common-actions__btn"
            onClick={handleRelease}
            disabled={isProcessing}
          >
            <span className="common-actions__label">Uvolnit</span>
          </button>
        </div>
      )}
      <div style={{ flex: '1 1 0', minHeight: 0, overflow: 'hidden' }}>
        <DetailView
        mode={detailViewMode}
        sectionIds={['detail', 'users', 'services', 'attachments', 'system'] as DetailSectionId[]}
        ctx={{
          entityType: 'contract_evidence_sheets',
          entityId: sheet.id,
          entityLabel: `Evidenční list č. ${sheet.sheet_number}`,
          mode: detailViewMode,
          onAttachmentsCountChange: setAttachmentsCount,
          sectionCounts: {
            users: usersCount,
            services: servicesCount,
            attachments: attachmentsCount,
          },
          detailContent: (
            <EvidenceSheetDetailForm
              sheet={sheet}
              contractNumber={contractNumber}
              contractSignedAt={contractSignedAt}
              contractValidTo={contractValidTo}
              landlordName={landlordName}
              propertyName={propertyName}
              unitName={unitName}
              tenantLabel={tenantLabel}
              readOnly={isLocked}
              replaceOptions={replaceOptions}
              onValueChange={setPendingValue}
            />
          ),
          usersContent: (
            <EvidenceSheetUsersTab
              sheetId={sheet.id}
              tenantId={tenantId}
              tenantLabel={tenantLabel}
              tenantSubjectType={tenantSubjectType}
              tenantBirthDate={tenantBirthDate}
              readOnly={isLocked}
              onCountChange={setUsersCount}
            />
          ),
          servicesContent: (
            <EvidenceSheetServicesTab
              sheetId={sheet.id}
              validFrom={sheet.valid_from}
              validTo={sheet.valid_to}
              onCountChange={setServicesCount}
              readOnly={isLocked}
            />
          ),
          systemBlocks,
        }}
      />
      </div>
    </div>
  )
}
