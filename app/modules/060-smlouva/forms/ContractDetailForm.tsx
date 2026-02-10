// FILE: app/modules/060-smlouva/forms/ContractDetailForm.tsx
// PURPOSE: Formulář pro detail smlouvy (read/edit) s vazbami na jednotku, nájemníka a pronajímatele
// NOTES: Používá lookup listy z service layer, bez přímého volání Supabase

'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export type ContractFormValue = {
  cisloSmlouvy: string
  stav: string
  landlordId: string
  tenantId: string
  landlordAccountId: string
  tenantAccountId: string
  landlordDelegateId: string
  tenantDelegateId: string
  pocetUzivatelu: number | null
  propertyId: string
  unitId: string
  pomerPlochyKNemovitosti: string
  datumPodpisu: string
  datumZacatek: string
  datumKonec: string
  dobaNeurcita: boolean
  najemVyse: number | null
  periodicitaNajmu: string
  denPlatby: string
  kaucePotreba: boolean
  kauceCastka: number | null
  pozadovanyDatumKauce: string
  stavKauce: string
  stavNajmu: string
  stavPlatebSmlouvy: string
  poznamky: string
  isArchived: boolean
}

export type LookupOption = { id: string; label: string; subjectType?: string | null }

export type UnitLookupOption = {
  id: string
  label: string
  propertyId: string | null
  landlordId: string | null
  tenantId: string | null
  area: number | null
}

export type PropertyLookupOption = {
  id: string
  label: string
  buildingArea: number | null
}

export type ContractDetailFormProps = {
  contract: Partial<ContractFormValue>
  readOnly: boolean
  units: UnitLookupOption[]
  properties: PropertyLookupOption[]
  landlords: LookupOption[]
  tenants: LookupOption[]
  tenantFallbackActive?: boolean
  statusOptions: LookupOption[]
  rentPeriodOptions: LookupOption[]
  paymentDayOptions: LookupOption[]
  resetToken?: number
  rentAmountOverride?: number | null
  userCountOverride?: number | null
  onDirtyChange?: (dirty: boolean) => void
  onValueChange?: (val: ContractFormValue) => void
}

function safeString(v: any): string {
  return (v ?? '').toString()
}

function safeNumber(v: any): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export default function ContractDetailForm({
  contract,
  readOnly,
  units,
  properties,
  landlords,
  tenants,
  tenantFallbackActive = false,
  statusOptions,
  rentPeriodOptions,
  paymentDayOptions,
  resetToken = 0,
  rentAmountOverride = null,
  userCountOverride = null,
  onDirtyChange,
  onValueChange,
}: ContractDetailFormProps) {
  const buildFormValue = (input: Partial<ContractFormValue>) => ({
    cisloSmlouvy: safeString(input.cisloSmlouvy),
    stav: safeString(input.stav),
    landlordId: safeString(input.landlordId),
    tenantId: safeString(input.tenantId),
    landlordAccountId: safeString(input.landlordAccountId),
    tenantAccountId: safeString(input.tenantAccountId),
    landlordDelegateId: safeString(input.landlordDelegateId),
    tenantDelegateId: safeString(input.tenantDelegateId),
    pocetUzivatelu: safeNumber(input.pocetUzivatelu),
    propertyId: safeString(input.propertyId),
    unitId: safeString(input.unitId),
    pomerPlochyKNemovitosti: safeString(input.pomerPlochyKNemovitosti),
    datumPodpisu: safeString(input.datumPodpisu),
    datumZacatek: safeString(input.datumZacatek),
    datumKonec: safeString(input.datumKonec),
    dobaNeurcita: !!input.dobaNeurcita,
    najemVyse: safeNumber(input.najemVyse),
    periodicitaNajmu: safeString(input.periodicitaNajmu),
    denPlatby: safeString(input.denPlatby),
    kaucePotreba: !!input.kaucePotreba,
    kauceCastka: safeNumber(input.kauceCastka),
    pozadovanyDatumKauce: safeString(input.pozadovanyDatumKauce),
    stavKauce: safeString(input.stavKauce),
    stavNajmu: safeString(input.stavNajmu),
    stavPlatebSmlouvy: safeString(input.stavPlatebSmlouvy),
    poznamky: safeString(input.poznamky),
    isArchived: !!input.isArchived,
  })

  const [formVal, setFormVal] = useState<ContractFormValue>(() => buildFormValue(contract))
  const contractRef = useRef(contract)

  const initialSnapshotRef = useRef<string>('')

  useEffect(() => {
    contractRef.current = contract
  }, [contract])

  useEffect(() => {
    const next = buildFormValue(contractRef.current)
    setFormVal(next)
    initialSnapshotRef.current = JSON.stringify(next)
    onDirtyChange?.(false)
  }, [resetToken, onDirtyChange])

  const update = useCallback(
    (patch: Partial<ContractFormValue>) => {
      setFormVal((prev) => {
        const next = { ...prev, ...patch }
        const isDirty = JSON.stringify(next) !== initialSnapshotRef.current
        onDirtyChange?.(isDirty)
        onValueChange?.(next)
        return next
      })
    },
    [onDirtyChange, onValueChange]
  )

  const selectedUnit = useMemo(
    () => units.find((u) => u.id === formVal.unitId) || null,
    [units, formVal.unitId]
  )

  const selectedProperty = useMemo(
    () => properties.find((p) => p.id === formVal.propertyId) || null,
    [properties, formVal.propertyId]
  )

  useEffect(() => {
    if (!selectedUnit) return

    const patch: Partial<ContractFormValue> = {}

    if (!formVal.propertyId) {
      patch.propertyId = selectedUnit.propertyId ?? ''
    }

    if (!formVal.landlordId) {
      patch.landlordId = selectedUnit.landlordId ?? ''
    }

    if (Object.keys(patch).length) {
      update(patch)
    }
  }, [selectedUnit, formVal.propertyId, formVal.landlordId, update])

  useEffect(() => {
    if (!selectedUnit || !selectedProperty) {
      update({ pomerPlochyKNemovitosti: '' })
      return
    }

    const area = selectedUnit.area
    const buildingArea = selectedProperty.buildingArea
    if (!area || !buildingArea) {
      update({ pomerPlochyKNemovitosti: '' })
      return
    }

    update({ pomerPlochyKNemovitosti: `${buildingArea}/${area}` })
  }, [selectedUnit, selectedProperty, update])

  const inputClass = readOnly ? 'detail-form__input detail-form__input--readonly' : 'detail-form__input'

  return (
    <div className="detail-form">
      <div className="detail-form__section">
        <h3 className="detail-form__section-title">Základní údaje</h3>

        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">Číslo smlouvy *</label>
            <input
              className={inputClass}
              type="text"
              value={formVal.cisloSmlouvy}
              onChange={(e) => update({ cisloSmlouvy: e.target.value })}
              readOnly={readOnly}
              maxLength={50}
            />
          </div>

          <div className="detail-form__field">
            <label className="detail-form__label">Stav smlouvy *</label>
            <select
              className={inputClass}
              value={formVal.stav}
              onChange={(e) => update({ stav: e.target.value })}
              disabled={readOnly}
            >
              <option value="">— vyberte stav —</option>
              {statusOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">Datum podpisu</label>
            <input
              className={inputClass}
              type="date"
              value={formVal.datumPodpisu}
              onChange={(e) => update({ datumPodpisu: e.target.value })}
              readOnly={readOnly}
            />
          </div>

          <div className="detail-form__field">
            <label className="detail-form__label">Datum začátku *</label>
            <input
              className={inputClass}
              type="date"
              value={formVal.datumZacatek}
              onChange={(e) => update({ datumZacatek: e.target.value })}
              readOnly={readOnly}
            />
          </div>
        </div>

        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">Doba neurčitá</label>
            <input
              type="checkbox"
              checked={formVal.dobaNeurcita}
              onChange={(e) => update({ dobaNeurcita: e.target.checked })}
              disabled={readOnly}
            />
          </div>

          {!formVal.dobaNeurcita && (
            <div className="detail-form__field">
              <label className="detail-form__label">Datum konce</label>
              <input
                className={inputClass}
                type="date"
                value={formVal.datumKonec}
                onChange={(e) => update({ datumKonec: e.target.value })}
                readOnly={readOnly}
              />
            </div>
          )}
        </div>

        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">Periodicita nájmu *</label>
            <select
              className={inputClass}
              value={formVal.periodicitaNajmu}
              onChange={(e) => update({ periodicitaNajmu: e.target.value })}
              disabled={readOnly}
            >
              <option value="">— vyberte periodicitu —</option>
              {rentPeriodOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="detail-form__field">
            <label className="detail-form__label">Den platby *</label>
            <select
              className={inputClass}
              value={formVal.denPlatby}
              onChange={(e) => update({ denPlatby: e.target.value })}
              disabled={readOnly}
            >
              <option value="">— vyberte den —</option>
              {paymentDayOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="detail-form__section">
        <h3 className="detail-form__section-title">Vazby</h3>

        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field detail-form__field--span-2">
            <label className="detail-form__label">Jednotka *</label>
            <select
              className={inputClass}
              value={formVal.unitId}
              onChange={(e) => update({ unitId: e.target.value })}
              disabled={readOnly}
            >
              <option value="">— vyberte jednotku —</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.label}
                </option>
              ))}
            </select>
            <div className="detail-form__hint">Výběr jednotky automaticky doplní vazby na nemovitost a pronajímatele. Nájemníka vybírej ručně.</div>
          </div>
        </div>

        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">Nemovitost *</label>
            <select
              className={inputClass}
              value={formVal.propertyId}
              onChange={(e) => update({ propertyId: e.target.value })}
              disabled={readOnly}
            >
              <option value="">— vyberte nemovitost —</option>
              {properties.map((prop) => (
                <option key={prop.id} value={prop.id}>
                  {prop.label}
                </option>
              ))}
            </select>
          </div>

          <div className="detail-form__field">
            <label className="detail-form__label">Pronajímatel *</label>
            <select
              className={inputClass}
              value={formVal.landlordId}
              onChange={(e) => update({ landlordId: e.target.value })}
              disabled={readOnly}
            >
              <option value="">— vyberte pronajímatele —</option>
              {landlords.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">Nájemník *</label>
            <select
              className={inputClass}
              value={formVal.tenantId}
              onChange={(e) => update({ tenantId: e.target.value })}
              disabled={readOnly}
            >
              <option value="">— vyberte nájemníka —</option>
              {tenants.length === 0 && <option value="" disabled>— žádní nájemníci —</option>}
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            {tenants.length === 0 && (
              <div className="detail-form__hint">Nejsou dostupní žádní nájemníci. Zkontroluj, že má subjekt nastaveno „Je nájemník“.</div>
            )}
              {tenantFallbackActive && tenants.length > 0 && (
                <div className="detail-form__hint">Pozor: nejsou označení nájemníci, proto jsou nabídnuté všechny subjekty.</div>
              )}
          </div>

          <div className="detail-form__field">
            <label className="detail-form__label">Počet uživatelů</label>
            <input
              className="detail-form__input detail-form__input--readonly"
              value={userCountOverride ?? formVal.pocetUzivatelu ?? ''}
              readOnly
            />
          </div>
        </div>

        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">Poměr plochy k nemovitosti</label>
            <input
              className="detail-form__input detail-form__input--readonly"
              value={formVal.pomerPlochyKNemovitosti}
              readOnly
            />
          </div>
        </div>
      </div>

      <div className="detail-form__section">
        <h3 className="detail-form__section-title">Finance</h3>

        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">Výše nájmu (Kč)</label>
            <input
              className="detail-form__input detail-form__input--readonly"
              value={rentAmountOverride ?? formVal.najemVyse ?? ''}
              readOnly
            />
          </div>
        </div>

        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">Kauce požadována</label>
            <input
              type="checkbox"
              checked={formVal.kaucePotreba}
              onChange={(e) => update({ kaucePotreba: e.target.checked })}
              disabled={readOnly}
            />
          </div>
        </div>

        {formVal.kaucePotreba && (
          <div className="detail-form__grid detail-form__grid--narrow">
            <div className="detail-form__field">
              <label className="detail-form__label">Výše kauce (Kč)</label>
              <input
                className={inputClass}
                type="number"
                value={formVal.kauceCastka ?? ''}
                onChange={(e) => update({ kauceCastka: safeNumber(e.target.value) })}
                readOnly={readOnly}
              />
            </div>

            <div className="detail-form__field">
              <label className="detail-form__label">Požadovaný datum kauce</label>
              <input
                className={inputClass}
                type="date"
                value={formVal.pozadovanyDatumKauce}
                onChange={(e) => update({ pozadovanyDatumKauce: e.target.value })}
                readOnly={readOnly}
              />
            </div>
          </div>
        )}

        <div className="detail-form__hint">Stavy plateb budou doplněny z modulu Plateb.</div>
      </div>

      <div className="detail-form__section">
        <h3 className="detail-form__section-title">Poznámky</h3>

        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field detail-form__field--span-2">
            <label className="detail-form__label">Poznámky</label>
            <textarea
              className={inputClass}
              rows={4}
              maxLength={2000}
              value={formVal.poznamky}
              onChange={(e) => update({ poznamky: e.target.value })}
              readOnly={readOnly}
            />
          </div>
        </div>
      </div>

      <div className="detail-form__section">
        <h3 className="detail-form__section-title">Archivace</h3>
        <div className="detail-form__grid detail-form__grid--narrow">
          <div className="detail-form__field">
            <label className="detail-form__label">Archivováno</label>
            <input
              type="checkbox"
              checked={formVal.isArchived}
              onChange={(e) => update({ isArchived: e.target.checked })}
              disabled={readOnly}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
