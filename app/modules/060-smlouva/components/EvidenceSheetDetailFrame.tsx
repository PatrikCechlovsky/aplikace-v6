// FILE: app/modules/060-smlouva/components/EvidenceSheetDetailFrame.tsx
// PURPOSE: Detail evidenčního listu smlouvy (tabs: detail, osoby, služby, přílohy, systém)
// NOTES: Napojeno na contract_evidence_sheets a podřízené tabulky

'use client'

import React, { useEffect, useState } from 'react'
import DetailView, { type DetailSectionId, type DetailViewMode } from '@/app/UI/DetailView'
import EvidenceSheetDetailForm from './EvidenceSheetDetailForm'
import EvidenceSheetUsersTab from './EvidenceSheetUsersTab'
import EvidenceSheetServicesTab from './EvidenceSheetServicesTab'
import { useToast } from '@/app/UI/Toast'
import createLogger from '@/app/lib/logger'
import { formatDateTime } from '@/app/lib/formatters/formatDateTime'
import {
  getEvidenceSheet,
  listEvidenceSheetServices,
  listEvidenceSheetUsers,
  type EvidenceSheetRow,
} from '@/app/lib/services/contractEvidenceSheets'

const logger = createLogger('EvidenceSheetDetailFrame')

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
}

export default function EvidenceSheetDetailFrame({
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
}: Props) {
  const toast = useToast()
  const [sheet, setSheet] = useState<EvidenceSheetRow | null>(null)
  const [replaceOptions, setReplaceOptions] = useState<{ id: string; label: string }[]>([])
  const [attachmentsCount, setAttachmentsCount] = useState(0)
  const [usersCount, setUsersCount] = useState(0)
  const [servicesCount, setServicesCount] = useState(0)

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        const current = await getEvidenceSheet(sheetId)

        if (!mounted) return

        setSheet(current)

        setReplaceOptions([])
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
          setUsersCount(usersRows.length)
        }
      } catch (err: any) {
        logger.error('Failed to load evidence sheet users count', err)
      }
    })()

    return () => {
      mounted = false
    }
  }, [sheetId])

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
            landlordName={landlordName}
            propertyName={propertyName}
            unitName={unitName}
            tenantLabel={tenantLabel}
            readOnly={isLocked}
            replaceOptions={replaceOptions}
          />
        ),
        usersContent: (
          <EvidenceSheetUsersTab
            sheetId={sheet.id}
            tenantId={tenantId}
            tenantLabel={tenantLabel}
            readOnly={isLocked}
            onCountChange={setUsersCount}
          />
        ),
        servicesContent: (
          <EvidenceSheetServicesTab
            sheetId={sheet.id}
            onCountChange={setServicesCount}
            readOnly={isLocked}
          />
        ),
        systemBlocks,
      }}
    />
  )
}
