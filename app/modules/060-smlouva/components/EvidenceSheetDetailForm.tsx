// FILE: app/modules/060-smlouva/components/EvidenceSheetDetailForm.tsx
// PURPOSE: Formulář detailu evidenčního listu smlouvy
// NOTES: Zobrazuje metadata listu a finanční souhrn

'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { EvidenceSheetRow } from '@/app/lib/services/contractEvidenceSheets'

export type EvidenceSheetFormValue = {
  sheetNumber: number
  validFrom: string
  validTo: string
  replacesSheetId: string
  rentAmount: number | null
  totalPersons: number
  servicesTotal: number
  totalAmount: number
  description: string
  notes: string
}

type SheetOption = { id: string; label: string }

type Props = {
  sheet: EvidenceSheetRow
  contractNumber: string | null
  contractSignedAt: string | null
  landlordName?: string | null
  propertyName?: string | null
  unitName?: string | null
  tenantLabel?: string | null
  readOnly?: boolean
  replaceOptions: SheetOption[]
  onValueChange?: (val: EvidenceSheetFormValue) => void
}

function safeString(value: any): string {
  return (value ?? '').toString()
}

function safeNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export default function EvidenceSheetDetailForm({
  sheet,
  contractNumber,
  contractSignedAt,
  landlordName,
  propertyName,
  unitName,
  tenantLabel,
  readOnly = false,
  replaceOptions,
  onValueChange,
}: Props) {
  const buildValue = useCallback(
    (row: EvidenceSheetRow): EvidenceSheetFormValue => ({
      sheetNumber: row.sheet_number,
      validFrom: safeString(row.valid_from),
      validTo: safeString(row.valid_to),
      replacesSheetId: safeString(row.replaces_sheet_id),
      rentAmount: safeNumber(row.rent_amount),
      totalPersons: row.total_persons ?? 1,
      servicesTotal: row.services_total ?? 0,
      totalAmount: row.total_amount ?? 0,
      description: safeString(row.description),
      notes: safeString(row.notes),
    }),
    []
  )

  const [formVal, setFormVal] = useState<EvidenceSheetFormValue>(() => buildValue(sheet))
  const sheetRef = useRef(sheet)

  useEffect(() => {
    sheetRef.current = sheet
    setFormVal(buildValue(sheet))
  }, [sheet, buildValue])

  const update = useCallback((patch: Partial<EvidenceSheetFormValue>) => {
    setFormVal((prev) => {
      const next = { ...prev, ...patch }
      onValueChange?.(next)
      return next
    })
  }, [onValueChange])

  const inputClass = readOnly ? 'detail-form__input detail-form__input--readonly' : 'detail-form__input'

  const contractLabel = useMemo(() => {
    if (!contractNumber) return '—'
    return contractSignedAt ? `${contractNumber} (ze dne ${contractSignedAt})` : contractNumber
  }, [contractNumber, contractSignedAt])

  return (
    <div className="detail-form">
      <div className="detail-form__section">
        <h3 className="detail-form__section-title">Evidenční list</h3>

        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">Ke smlouvě</label>
            <input className="detail-form__input detail-form__input--readonly" value={contractLabel} readOnly />
          </div>
          <div className="detail-form__field">
            <label className="detail-form__label">Číslo listu</label>
            <input className="detail-form__input detail-form__input--readonly" value={formVal.sheetNumber} readOnly />
          </div>
        </div>

        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">Platný od *</label>
            <input
              className={inputClass}
              type="date"
              value={formVal.validFrom}
              onChange={(e) => update({ validFrom: e.target.value })}
              readOnly={readOnly}
            />
          </div>
          <div className="detail-form__field">
            <label className="detail-form__label">Platný do</label>
            <input
              className={inputClass}
              type="date"
              value={formVal.validTo}
              onChange={(e) => update({ validTo: e.target.value })}
              readOnly={readOnly}
            />
          </div>
        </div>

        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">Nahrazuje list</label>
            <select
              className={inputClass}
              value={formVal.replacesSheetId}
              onChange={(e) => update({ replacesSheetId: e.target.value })}
              disabled={readOnly}
            >
              <option value="">— nevyplněno —</option>
              {replaceOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="detail-form__field">
            <label className="detail-form__label">Počet osob</label>
            <input className="detail-form__input detail-form__input--readonly" value={formVal.totalPersons} readOnly />
          </div>
        </div>
      </div>

      <div className="detail-form__section">
        <h3 className="detail-form__section-title">Základní údaje</h3>

        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">Pronajímatel</label>
            <input className="detail-form__input detail-form__input--readonly" value={landlordName || '—'} readOnly />
          </div>
          <div className="detail-form__field">
            <label className="detail-form__label">Nemovitost</label>
            <input className="detail-form__input detail-form__input--readonly" value={propertyName || '—'} readOnly />
          </div>
        </div>

        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">Jednotka</label>
            <input className="detail-form__input detail-form__input--readonly" value={unitName || '—'} readOnly />
          </div>
          <div className="detail-form__field">
            <label className="detail-form__label">Nájemník</label>
            <input className="detail-form__input detail-form__input--readonly" value={tenantLabel || '—'} readOnly />
          </div>
        </div>
      </div>

      <div className="detail-form__section">
        <h3 className="detail-form__section-title">Finance</h3>

        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">Nájemné (Kč)</label>
            <input
              className={inputClass}
              type="number"
              value={formVal.rentAmount ?? ''}
              onChange={(e) => update({ rentAmount: safeNumber(e.target.value) })}
              readOnly={readOnly}
            />
          </div>
          <div className="detail-form__field">
            <label className="detail-form__label">Služby celkem (Kč)</label>
            <input className="detail-form__input detail-form__input--readonly" value={formVal.servicesTotal} readOnly />
          </div>
        </div>

        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">Celkem k úhradě (Kč)</label>
            <input className="detail-form__input detail-form__input--readonly" value={formVal.totalAmount} readOnly />
          </div>
        </div>
      </div>

      <div className="detail-form__section">
        <h3 className="detail-form__section-title">Poznámky</h3>
        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field detail-form__field--span-2">
            <label className="detail-form__label">Popis</label>
            <input
              className={inputClass}
              value={formVal.description}
              onChange={(e) => update({ description: e.target.value })}
              readOnly={readOnly}
            />
          </div>
          <div className="detail-form__field detail-form__field--span-2">
            <label className="detail-form__label">Poznámky</label>
            <textarea
              className={inputClass}
              rows={3}
              value={formVal.notes}
              onChange={(e) => update({ notes: e.target.value })}
              readOnly={readOnly}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
