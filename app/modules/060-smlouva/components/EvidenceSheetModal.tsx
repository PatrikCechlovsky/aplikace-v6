// FILE: app/modules/060-smlouva/components/EvidenceSheetModal.tsx
// PURPOSE: Full-screen modal pro editaci evidenčního listu se samostatnými CommonActions
// NOTES: Otevírá se jako nový content, registruje CommonActions, zavírá se callbackem

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
  updateEvidenceSheet,
  type EvidenceSheetRow,
} from '@/app/lib/services/contractEvidenceSheets'
import { getIcon, type IconKey } from '@/app/UI/icons'

const logger = createLogger('EvidenceSheetModal')

type Props = {
  sheetId: string
  contractId: string
  tenantId: string | null
  tenantLabel?: string | null
  contractNumber: string | null
  contractSignedAt: string | null
  readOnly?: boolean
  onClose: () => void
  onUpdated?: () => void
  onRegisterCommonActions?: (actions: string[]) => void
  onRegisterCommonActionsState?: (state: { viewMode: string; hasSelection: boolean; isDirty: boolean }) => void
}

export default function EvidenceSheetModal({
  sheetId,
  contractId,
  tenantId,
  tenantLabel,
  contractNumber,
  contractSignedAt,
  readOnly = false,
  onClose,
  onUpdated,
  onRegisterCommonActions,
  onRegisterCommonActionsState,
}: Props) {
  const toast = useToast()
  const [sheet, setSheet] = useState<EvidenceSheetRow | null>(null)
  const [replaceOptions, setReplaceOptions] = useState<{ id: string; label: string }[]>([])
  const [allSheets, setAllSheets] = useState<EvidenceSheetRow[]>([])
  const [attachmentsCount, setAttachmentsCount] = useState(0)
  const [totalPersons, setTotalPersons] = useState(1)
  const [pendingValue, setPendingValue] = useState<EvidenceSheetFormValue | null>(null)
  const [viewMode, setViewMode] = useState<'view' | 'edit'>('view')

  const buildValueFromSheet = useCallback(
    (row: EvidenceSheetRow): EvidenceSheetFormValue => ({
      sheetNumber: row.sheet_number,
      validFrom: row.valid_from ?? '',
      validTo: row.valid_to ?? '',
      replacesSheetId: row.replaces_sheet_id ?? '',
      rentAmount: row.rent_amount ?? null,
      totalPersons: row.total_persons ?? 1,
      servicesTotal: row.services_total ?? 0,
      totalAmount: row.total_amount ?? 0,
      description: row.description ?? '',
      notes: row.notes ?? '',
    }),
    []
  )

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        const [current, all] = await Promise.all([
          getEvidenceSheet(sheetId),
          listEvidenceSheets(contractId, true),
        ])

        if (!mounted) return

        setSheet(current)
        setAllSheets(all)
        setTotalPersons(current?.total_persons ?? 1)
        setPendingValue(null)

        setReplaceOptions(
          all
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

  // Register CommonActions
  useEffect(() => {
    const isLocked = readOnly || sheet?.status !== 'draft'
    const actions = ['new', 'read', 'edit', 'attachments', 'close']
    
    onRegisterCommonActions?.(actions)
    onRegisterCommonActionsState?.({
      viewMode: isLocked ? 'view' : 'edit',
      hasSelection: !!sheet?.id,
      isDirty: !!pendingValue,
    })
  }, [sheet, pendingValue, readOnly, onRegisterCommonActions, onRegisterCommonActionsState])

  const handleSave = useCallback(
    async (val: EvidenceSheetFormValue) => {
      if (!sheet) return

      try {
        const updated = await updateEvidenceSheet(sheet.id, {
          valid_from: val.validFrom || null,
          valid_to: val.validTo || null,
          replaces_sheet_id: val.replacesSheetId || null,
          rent_amount: val.rentAmount ?? null,
          description: val.description || null,
          notes: val.notes || null,
        })
        setSheet(updated)
        toast.showSuccess('Evidenční list uložen')
        onUpdated?.()
      } catch (err: any) {
        logger.error('save evidence sheet failed', err)
        toast.showError(err?.message ?? 'Nepodařilo se uložit evidenční list')
      }
    },
    [sheet, toast, onUpdated]
  )

  const handleActivate = useCallback(async () => {
    if (!sheet) return

    const sourceValue = pendingValue ?? buildValueFromSheet(sheet)

    if (!sourceValue.validFrom) {
      toast.showError('Vyplňte datum "Platný od"')
      return
    }

    if (sourceValue.validTo && sourceValue.validTo < sourceValue.validFrom) {
      toast.showError('Datum "Platný do" nesmí být dřívější než "Platný od"')
      return
    }

    const previousId = sourceValue.replacesSheetId || sheet.replaces_sheet_id
    const previous = allSheets.find((s) => s.id === previousId) ?? null

    if (previous?.id) {
      const prevEnd = new Date(sourceValue.validFrom)
      prevEnd.setDate(prevEnd.getDate() - 1)
      const prevEndDate = prevEnd.toISOString().split('T')[0]

      const shouldContinue = window.confirm(
        `Evidenční list č. ${previous.sheet_number} bude ukončen k ${prevEndDate}. Pokračovat?`
      )

      if (!shouldContinue) return
    }

    try {
      const updated = await updateEvidenceSheet(sheet.id, {
        valid_from: sourceValue.validFrom,
        valid_to: sourceValue.validTo || null,
        replaces_sheet_id: sourceValue.replacesSheetId || null,
        rent_amount: sourceValue.rentAmount ?? null,
        description: sourceValue.description || null,
        notes: sourceValue.notes || null,
        status: 'active',
      })

      if (previous?.id) {
        const prevEnd = new Date(sourceValue.validFrom)
        prevEnd.setDate(prevEnd.getDate() - 1)
        const prevEndDate = prevEnd.toISOString().split('T')[0]
        await updateEvidenceSheet(previous.id, { valid_to: prevEndDate, status: 'archived' })
      }

      setSheet(updated)
      setViewMode('view')
      setPendingValue(null)
      toast.showSuccess('Evidenční list potvrzen')
      onUpdated?.()
    } catch (err: any) {
      logger.error('activate evidence sheet failed', err)
      toast.showError(err?.message ?? 'Nepodařilo se potvrdit evidenční list')
    }
  }, [sheet, pendingValue, allSheets, toast, onUpdated, buildValueFromSheet])

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

  const isLocked = readOnly || sheet.status !== 'draft'
  const detailViewMode: DetailViewMode = viewMode === 'edit' && !isLocked ? 'edit' : 'view'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Modal Header */}
      <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Evidenční list č. {sheet.sheet_number}</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {!isLocked && (
            <button
              type="button"
              className="common-actions__btn"
              onClick={() => pendingValue && handleSave(pendingValue)}
              disabled={!pendingValue}
              title="Uložit změny"
            >
              <span className="common-actions__icon">{getIcon('save' as IconKey)}</span>
            </button>
          )}
          {!isLocked && (
            <button
              type="button"
              className="common-actions__btn"
              onClick={handleActivate}
              disabled={!pendingValue}
              title="Potvrdit list a ukončit předchozí"
            >
              <span className="common-actions__icon">{getIcon('check' as IconKey)}</span>
            </button>
          )}
          <button
            type="button"
            className="common-actions__btn"
            onClick={onClose}
            title="Zavřít"
          >
            <span className="common-actions__icon">{getIcon('close' as IconKey)}</span>
          </button>
        </div>
      </div>

      {/* Modal Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
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
              attachments: attachmentsCount,
            },
            detailContent: (
              <EvidenceSheetDetailForm
                sheet={sheet}
                contractNumber={contractNumber}
                contractSignedAt={contractSignedAt}
                readOnly={isLocked}
                replaceOptions={replaceOptions}
                onValueChange={(val) => setPendingValue(val)}
              />
            ),
            usersContent: (
              <EvidenceSheetUsersTab
                sheetId={sheet.id}
                tenantId={tenantId}
                tenantLabel={tenantLabel}
                readOnly={isLocked}
                onCountChange={(count) => setTotalPersons(count)}
              />
            ),
            servicesContent: (
              <EvidenceSheetServicesTab
                sheetId={sheet.id}
                totalPersons={totalPersons}
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
