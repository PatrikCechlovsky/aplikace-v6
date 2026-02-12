// FILE: app/modules/060-smlouva/components/ContractEvidenceSheetsTab.tsx
// PURPOSE: Záložka evidenčních listů smlouvy (list + detail)
// NOTES: Umožňuje vytvořit pokračující list a ukončit předchozí

'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import RelationListWithDetail from '@/app/UI/RelationListWithDetail'
import { useToast } from '@/app/UI/Toast'
import createLogger from '@/app/lib/logger'
import {
  listEvidenceSheets,
  createEvidenceSheet,
  type EvidenceSheetRow,
} from '@/app/lib/services/contractEvidenceSheets'
import EvidenceSheetDetailFrame from './EvidenceSheetDetailFrame'

const logger = createLogger('ContractEvidenceSheetsTab')

type Props = {
  contractId: string
  contractNumber: string | null
  contractSignedAt: string | null
  tenantId: string | null
  tenantLabel?: string | null
  rentAmount: number | null
  readOnly?: boolean
  onCountChange?: (count: number) => void
}

function isActiveSheet(row: EvidenceSheetRow): boolean {
  const today = new Date().toISOString().split('T')[0]
  const validFrom = row.valid_from
  const validTo = row.valid_to
  return validFrom <= today && (!validTo || validTo >= today)
}

export default function ContractEvidenceSheetsTab({
  contractId,
  contractNumber,
  contractSignedAt,
  tenantId,
  tenantLabel,
  rentAmount,
  readOnly = false,
  onCountChange,
}: Props) {
  const toast = useToast()
  const [rows, setRows] = useState<EvidenceSheetRow[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newValidFrom, setNewValidFrom] = useState<string>(() => new Date().toISOString().split('T')[0])

  if (!contractId || contractId === 'new') {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        Evidenční listy budou dostupné po uložení smlouvy.
      </div>
    )
  }

  const load = useCallback(async () => {
    try {
      const data = await listEvidenceSheets(contractId, false)
      setRows(data)
      onCountChange?.(data.length)
      if (data.length && !selectedId) setSelectedId(data[0].id)
    } catch (err: any) {
      logger.error('load evidence sheets failed', err)
      toast.showError(err?.message ?? 'Nepodařilo se načíst evidenční listy')
    }
  }, [contractId, toast, selectedId, onCountChange])

  useEffect(() => {
    void load()
  }, [load])

  const handleCreate = useCallback(async () => {
    try {
      const created = await createEvidenceSheet({
        contractId,
        validFrom: newValidFrom,
        rentAmount,
        copyFromLatest: true,
      })
      await load()
      setSelectedId(created.id)
      toast.showSuccess('Evidenční list vytvořen')
    } catch (err: any) {
      logger.error('create evidence sheet failed', err)
      toast.showError(err?.message ?? 'Nepodařilo se vytvořit evidenční list')
    }
  }, [contractId, newValidFrom, rentAmount, load, toast])

  const items = useMemo(
    () =>
      rows.map((row) => ({
        id: row.id,
        primary: `Evidenční list č. ${row.sheet_number}`,
        secondary: `Platný od ${row.valid_from}${row.valid_to ? ` do ${row.valid_to}` : ''}`,
        badge: isActiveSheet(row) ? 'AKTIVNÍ' : undefined,
      })),
    [rows]
  )

  return (
    <div>
      {!readOnly && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
          <label className="detail-form__label" style={{ marginBottom: 0 }}>
            Platný od
          </label>
          <input
            className="detail-form__input"
            type="date"
            value={newValidFrom}
            onChange={(e) => setNewValidFrom(e.target.value)}
          />
          <button type="button" className="common-actions__btn" onClick={handleCreate}>
            Nový evidenční list
          </button>
        </div>
      )}

      <RelationListWithDetail
        title="Evidenční listy"
        items={items}
        selectedId={selectedId}
        onSelect={(id) => setSelectedId(String(id))}
        emptyText="Smlouva zatím nemá žádné evidenční listy."
      >
        {selectedId && (
          <EvidenceSheetDetailFrame
            sheetId={selectedId}
            contractId={contractId}
            tenantId={tenantId}
            tenantLabel={tenantLabel}
            contractNumber={contractNumber}
            contractSignedAt={contractSignedAt}
            readOnly={readOnly}
            onUpdated={load}
          />
        )}
      </RelationListWithDetail>
    </div>
  )
}
