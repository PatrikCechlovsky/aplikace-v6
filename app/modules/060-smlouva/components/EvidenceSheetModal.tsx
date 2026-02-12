// FILE: app/modules/060-smlouva/components/EvidenceSheetModal.tsx
// PURPOSE: Full-screen modal pro editaci evidenčního listu se samostatnými CommonActions
// NOTES: Otevírá se jako nový content, registruje CommonActions, zavírá se callbackem

'use client'

import React, { useEffect, useState } from 'react'
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
  type EvidenceSheetRow,
} from '@/app/lib/services/contractEvidenceSheets'

const logger = createLogger('EvidenceSheetModal')

type Props = {
  sheetId: string
  contractId: string
  tenantId: string | null
  tenantLabel?: string | null
  contractNumber: string | null
  contractSignedAt: string | null
  landlordName?: string | null
  propertyName?: string | null
  unitName?: string | null
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
  landlordName,
  propertyName,
  unitName,
  readOnly = false,
  onRegisterCommonActions,
  onRegisterCommonActionsState,
}: Props) {
  const toast = useToast()
  const [sheet, setSheet] = useState<EvidenceSheetRow | null>(null)
  const [replaceOptions, setReplaceOptions] = useState<{ id: string; label: string }[]>([])
  const [attachmentsCount, setAttachmentsCount] = useState(0)
  const [totalPersons, setTotalPersons] = useState(1)
  const [pendingValue, setPendingValue] = useState<EvidenceSheetFormValue | null>(null)

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

  useEffect(() => {
    if (!onRegisterCommonActions || !onRegisterCommonActionsState) return

    const isLocked = readOnly || sheet?.status !== 'draft'
    const actions = ['close']

    onRegisterCommonActions(actions)
    onRegisterCommonActionsState({
      viewMode: isLocked ? 'view' : 'edit',
      hasSelection: !!sheet?.id,
      isDirty: !!pendingValue,
    })
  }, [sheet, pendingValue, readOnly, onRegisterCommonActions, onRegisterCommonActionsState])

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
  const detailViewMode: DetailViewMode = isLocked ? 'view' : 'edit'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Modal Header */}
      <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>
        <h2 style={{ margin: 0 }}>Evidenční list č. {sheet.sheet_number}</h2>
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
                landlordName={landlordName}
                propertyName={propertyName}
                unitName={unitName}
                tenantLabel={tenantLabel}
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
