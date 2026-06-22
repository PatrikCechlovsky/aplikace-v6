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
import type { CommonActionId, ViewMode } from '@/app/UI/CommonActions'
import { getIcon, type IconKey } from '@/app/UI/icons'
import createLogger from '@/app/lib/logger'
import { formatDateTime } from '@/app/lib/formatters/formatDateTime'
import {
  getEvidenceSheet,
  listEvidenceSheets,
  listEvidenceSheetServices,
  listEvidenceSheetUsers,
  createEvidenceSheetDraft,
  activateEvidenceSheet,
  updateEvidenceSheet,
  type EvidenceSheetRow,
} from '@/app/lib/services/contractEvidenceSheets'

const logger = createLogger('EvidenceSheetModal')

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
  onClose: () => void
  onUpdated?: () => void
  onSheetCreated?: (newSheetId: string) => void
  onRegisterCommonActions?: (actions: CommonActionId[]) => void
  onRegisterCommonActionsState?: (state: { viewMode: ViewMode; hasSelection: boolean; isDirty: boolean }) => void
  onRegisterCommonActionHandler?: (fn: ((id: CommonActionId) => void) | null) => void
}

export default function EvidenceSheetModal({
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
  onRegisterCommonActions,
  onRegisterCommonActionsState,
  onRegisterCommonActionHandler,
  onClose,
  onSheetCreated,
}: Props) {
  const toast = useToast()
  const [sheet, setSheet] = useState<EvidenceSheetRow | null>(null)
  const [replaceOptions, setReplaceOptions] = useState<{ id: string; label: string }[]>([])
  const [attachmentsCount, setAttachmentsCount] = useState(0)
  const [usersCount, setUsersCount] = useState(0)
  const [servicesCount, setServicesCount] = useState(0)
  const [pendingValue, setPendingValue] = useState<EvidenceSheetFormValue | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

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

  // Load counts for services
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

  const handleCopySheet = async () => {
    if (!sheet) return

    if (contractValidTo && sheet.valid_to && sheet.valid_to > contractValidTo) {
      toast.showWarning(`Platný do nesmí být později než konec smlouvy ${contractValidTo}.`)
      return
    }

    try {
      setIsProcessing(true)
      const newSheet = await createEvidenceSheetDraft({
        contractId,
        rentAmount: sheet.rent_amount,
        copyFromLatest: true,
        validFrom: sheet.valid_from,
        validTo: sheet.valid_to,
        contractValidTo: contractValidTo ?? null,
      })
      toast.showSuccess('Evidenční list kopírován. Otevírám novou verzi…')
      if (onSheetCreated) {
        onSheetCreated(newSheet.id)
      }
    } catch (err: any) {
      logger.error('handleCopySheet failed', err)
      toast.showError(err?.message ?? 'Nepodařilo se kopírovat evidenční list')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleActivateSheet = async () => {
    if (!sheet || sheet.status !== 'draft') return
    try {
      setIsProcessing(true)
      const activated = await activateEvidenceSheet(sheet.id)
      setSheet(activated)
      toast.showSuccess('Evidenční list aktivován. Staří verze byla archivována.')
      if (onSheetCreated) {
        onSheetCreated(activated.id)
      }
    } catch (err: any) {
      logger.error('handleActivateSheet failed', err)
      toast.showError(err?.message ?? 'Nepodařilo se aktivovat evidenční list')
    } finally {
      setIsProcessing(false)
    }
  }

  useEffect(() => {
    if (!onRegisterCommonActions || !onRegisterCommonActionsState) return

    const isLocked = readOnly
    const actions: CommonActionId[] = ['close']
    if (!isLocked) actions.unshift('save')
    if (sheet?.status === 'draft' && !isLocked) actions.unshift('release')

    onRegisterCommonActions(actions)
    onRegisterCommonActionsState({
      viewMode: isLocked ? 'read' : 'edit',
      hasSelection: !!sheet?.id,
      isDirty: !!pendingValue,
    })

    // Register global handler for common actions (save, close, release)
    if (onRegisterCommonActionHandler) {
      onRegisterCommonActionHandler(async (id: string) => {
        try {
          if (id === 'save') {
            if (!pendingValue || !sheet) return
            // prepare patch
            const patch: any = {
              valid_from: pendingValue.validFrom || null,
              valid_to: pendingValue.validTo || null,
              replaces_sheet_id: pendingValue.replacesSheetId || null,
              rent_amount: pendingValue.rentAmount ?? null,
              description: pendingValue.description || null,
              notes: pendingValue.notes || null,
            }
            await updateEvidenceSheet(sheet.id, patch)
            toast.showSuccess('Evidenční list uložen')
            void (async () => {
              const refreshed = await getEvidenceSheet(sheet.id)
              setSheet(refreshed)
            })()
            return
          }

          if (id === 'release') {
            if (!sheet || sheet.status !== 'draft') return
            await handleActivateSheet()
            return
          }

          if (id === 'close') {
            onClose()
            return
          }
        } catch (err: any) {
          logger.error('common action handler failed', err)
          toast.showError(err?.message ?? 'Akce selhala')
        }
      })
    }
  }, [sheet, pendingValue, readOnly, onClose, onRegisterCommonActions, onRegisterCommonActionsState, onRegisterCommonActionHandler])

  useEffect(() => {
    return () => {
      if (onRegisterCommonActionHandler) onRegisterCommonActionHandler(null)
    }
  }, [onRegisterCommonActionHandler])

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Modal Header */}
      <div style={{ 
        padding: '1rem', 
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h2 style={{ margin: 0 }}>Evidenční list č. {sheet.sheet_number}</h2>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
            Stav: <strong>{sheet.status === 'draft' ? 'Rozpracovaná' : sheet.status === 'active' ? 'Aktivní' : 'Archivovaná'}</strong>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {sheet.status === 'active' && (
            <button
              onClick={handleCopySheet}
              disabled={isProcessing}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                opacity: isProcessing ? 0.6 : 1,
              }}
              title="Vytvoří kopii aktivního listu s novou verzí"
            >
              {isProcessing ? 'Zpracovávám…' : '📋 Kopírovat'}
            </button>
          )}
          {sheet.status === 'draft' && (
            <button
              onClick={handleActivateSheet}
              disabled={isProcessing}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--color-success)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                opacity: isProcessing ? 0.6 : 1,
              }}
              title="Aktivuje tuto verzi a archivuje předchozí"
            >
              {isProcessing ? 'Zpracovávám…' : '✅ Uvolnit'}
            </button>
          )}
          <button
            type="button"
            className="common-actions__btn common-actions__btn--icon-only common-actions__btn--close"
            onClick={onClose}
            title="Zavřít"
          >
            <span className="common-actions__icon">{getIcon('close' as IconKey)}</span>
            <span className="common-actions__label">Zavřít</span>
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
                onValueChange={(val) => setPendingValue(val)}
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
                readOnly={isLocked}
                onCountChange={setServicesCount}
              />
            ),
            systemBlocks,
          }}
        />
      </div>
    </div>
  )
}
