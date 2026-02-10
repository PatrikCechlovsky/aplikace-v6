// FILE: app/modules/060-smlouva/forms/ContractDetailFrame.tsx
// PURPOSE: Detail view pro smlouvu (read/edit) s DetailView a vazbami
// NOTES: Využívá service layer pro data a číselníky

'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import DetailView, { type DetailSectionId, type DetailViewMode } from '@/app/UI/DetailView'
import type { ViewMode } from '@/app/UI/CommonActions'
import { useToast } from '@/app/UI/Toast'
import createLogger from '@/app/lib/logger'
import { formatDateTime } from '@/app/lib/formatters/formatDateTime'
import { listAttachments } from '@/app/lib/attachments'
import { listUnits } from '@/app/lib/services/units'
import { listProperties } from '@/app/lib/services/properties'
import { listLandlords } from '@/app/lib/services/landlords'
import { listTenants } from '@/app/lib/services/tenants'
import { listUnitServices } from '@/app/lib/services/unitServices'
import { listContractUsers } from '@/app/lib/services/contractUsers'
import { listSubjects } from '@/app/lib/services/subjects'
import { listActiveByCategory } from '@/app/modules/900-nastaveni/services/genericTypes'
import { saveContract, type SaveContractInput } from '@/app/lib/services/contracts'
import ContractDetailForm, {
  type ContractFormValue,
  type LookupOption,
  type UnitLookupOption,
  type PropertyLookupOption,
} from './ContractDetailForm'
import UnitServicesTab from '@/app/modules/040-nemovitost/components/UnitServicesTab'
import ContractUsersTab from '../components/ContractUsersTab'
import ContractDelegatesTab from '../components/ContractDelegatesTab'
import ContractAccountsTab from '../components/ContractAccountsTab'

import '@/app/styles/components/TileLayout.css'
import '@/app/styles/components/DetailForm.css'

const logger = createLogger('ContractDetailFrame')

export type UiContract = {
  id: string
  cisloSmlouvy: string | null
  stav: string | null
  landlordId: string | null
  tenantId: string | null
  landlordAccountId: string | null
  tenantAccountId: string | null
  landlordDelegateId: string | null
  tenantDelegateId: string | null
  pocetUzivatelu: number | null
  propertyId: string | null
  unitId: string | null
  pomerPlochyKNemovitosti: string | null
  datumPodpisu: string | null
  datumZacatek: string | null
  datumKonec: string | null
  dobaNeurcita: boolean | null
  najemVyse: number | null
  periodicitaNajmu: string | null
  denPlatby: string | null
  kaucePotreba: boolean | null
  kauceCastka: number | null
  pozadovanyDatumKauce: string | null
  stavKauce: string | null
  stavNajmu: string | null
  stavPlatebSmlouvy: string | null
  poznamky: string | null
  isArchived: boolean | null
  createdAt: string | null
  createdBy: string | null
  updatedAt: string | null
  updatedBy: string | null
}

type Props = {
  contract: UiContract
  viewMode: ViewMode
  embedded?: boolean
  initialSectionId?: DetailSectionId
  onActiveSectionChange?: (id: DetailSectionId) => void
  onRegisterSubmit?: (fn: () => Promise<UiContract | null>) => void
  onDirtyChange?: (dirty: boolean) => void
  onSaved?: (contract: UiContract) => void
}

function buildInitialFormValue(c: UiContract): ContractFormValue {
  return {
    cisloSmlouvy: c.cisloSmlouvy || '',
    stav: c.stav || '',
    landlordId: c.landlordId || '',
    tenantId: c.tenantId || '',
    landlordAccountId: c.landlordAccountId || '',
    tenantAccountId: c.tenantAccountId || '',
    landlordDelegateId: c.landlordDelegateId || '',
    tenantDelegateId: c.tenantDelegateId || '',
    pocetUzivatelu: c.pocetUzivatelu ?? null,
    propertyId: c.propertyId || '',
    unitId: c.unitId || '',
    pomerPlochyKNemovitosti: c.pomerPlochyKNemovitosti || '',
    datumPodpisu: c.datumPodpisu || '',
    datumZacatek: c.datumZacatek || '',
    datumKonec: c.datumKonec || '',
    dobaNeurcita: !!c.dobaNeurcita,
    najemVyse: c.najemVyse ?? null,
    periodicitaNajmu: c.periodicitaNajmu || '',
    denPlatby: c.denPlatby || '',
    kaucePotreba: !!c.kaucePotreba,
    kauceCastka: c.kauceCastka ?? null,
    pozadovanyDatumKauce: c.pozadovanyDatumKauce || '',
    stavKauce: c.stavKauce || '',
    stavNajmu: c.stavNajmu || '',
    stavPlatebSmlouvy: c.stavPlatebSmlouvy || '',
    poznamky: c.poznamky || '',
    isArchived: !!c.isArchived,
  }
}

function isNewId(id: string | null | undefined) {
  const s = String(id ?? '').trim()
  return !s || s === 'new'
}

export default function ContractDetailFrame({
  contract,
  viewMode,
  embedded = false,
  initialSectionId,
  onActiveSectionChange,
  onRegisterSubmit,
  onDirtyChange,
  onSaved,
}: Props) {
  const [resolvedContract, setResolvedContract] = useState<UiContract>(contract)
  const [formValue, setFormValue] = useState<ContractFormValue>(() => buildInitialFormValue(contract))
  const formValueRef = useRef<ContractFormValue>(formValue)
  const initialSnapshotRef = useRef<string>('')
  const firstRenderRef = useRef(true)
  const toast = useToast()

  const [attachmentsCount, setAttachmentsCount] = useState(0)
  const [formResetToken, setFormResetToken] = useState(0)
  const [servicesCount, setServicesCount] = useState(0)
  const [servicesTotal, setServicesTotal] = useState<number | null>(null)
  const [contractUsersCount, setContractUsersCount] = useState<number | null>(null)

  const [units, setUnits] = useState<UnitLookupOption[]>([])
  const [properties, setProperties] = useState<PropertyLookupOption[]>([])
  const [landlords, setLandlords] = useState<LookupOption[]>([])
  const [tenants, setTenants] = useState<LookupOption[]>([])
  const [tenantFallbackActive, setTenantFallbackActive] = useState(false)
  const [statusOptions, setStatusOptions] = useState<LookupOption[]>([])
  const [rentPeriodOptions, setRentPeriodOptions] = useState<LookupOption[]>([])

  const paymentDayOptions = useMemo<LookupOption[]>(() => {
    return Array.from({ length: 28 }, (_, i) => ({ id: String(i + 1), label: String(i + 1) })).concat([
      { id: 'last_day', label: 'Poslední den v měsíci' },
    ])
  }, [])

  useEffect(() => {
    formValueRef.current = formValue
  }, [formValue])

  useEffect(() => {
    if (firstRenderRef.current) {
      initialSnapshotRef.current = JSON.stringify(formValue)
      firstRenderRef.current = false
    }
  }, [formValue])

  const markDirtyIfChanged = useCallback(
    (next: ContractFormValue) => {
      const isDirty = JSON.stringify(next) !== initialSnapshotRef.current
      onDirtyChange?.(isDirty)
    },
    [onDirtyChange]
  )

  const handleFormDirtyChange = useCallback(
    (dirty: boolean) => {
      onDirtyChange?.(dirty)
    },
    [onDirtyChange]
  )

  const handleFormValueChange = useCallback(
    (val: ContractFormValue) => {
      setFormValue(val)
      formValueRef.current = val
      markDirtyIfChanged(val)
    },
    [markDirtyIfChanged]
  )

  const refreshAttachmentsCount = useCallback(async () => {
    if (isNewId(resolvedContract.id)) {
      setAttachmentsCount(0)
      return
    }

    try {
      const rows = await listAttachments({ entityType: 'contracts', entityId: resolvedContract.id, includeArchived: false })
      setAttachmentsCount(rows.length)
    } catch (err) {
      logger.error('Failed to load contract attachments count', err)
    }
  }, [resolvedContract.id])

  useEffect(() => {
    void refreshAttachmentsCount()
  }, [refreshAttachmentsCount])

  useEffect(() => {
    let mounted = true

    async function loadServicesCount() {
      const unitId = formValueRef.current.unitId
      if (!unitId || unitId === 'new') {
        if (mounted) setServicesCount(0)
        return
      }

      try {
        const rows = await listUnitServices(unitId)
        if (!mounted) return
        setServicesCount(rows.length)
      } catch (err) {
        logger.error('Failed to load unit services count', err)
      }
    }

    void loadServicesCount()
    return () => {
      mounted = false
    }
  }, [formValue.unitId])

  useEffect(() => {
    let mounted = true

    async function loadContractUsersCount() {
      const tenantId = formValueRef.current.tenantId
      const contractId = resolvedContract.id

      if (!tenantId || tenantId === 'new') {
        if (mounted) setContractUsersCount(null)
        return
      }

      if (!contractId || contractId === 'new') {
        if (mounted) setContractUsersCount(1)
        return
      }

      try {
        const rows = await listContractUsers(contractId, false)
        if (!mounted) return
        setContractUsersCount(rows.length + 1)
      } catch (err) {
        logger.error('Failed to load contract users count', err)
      }
    }

    void loadContractUsersCount()
    return () => {
      mounted = false
    }
  }, [formValue.tenantId, resolvedContract.id])

  useEffect(() => {
    let mounted = true

    async function loadServicesTotal() {
      const unitId = formValueRef.current.unitId
      if (!unitId || unitId === 'new') {
        if (mounted) setServicesTotal(null)
        return
      }

      try {
        const rows = await listUnitServices(unitId)
        if (!mounted) return
        const total = rows.reduce((sum, row) => sum + (row.amount ?? 0), 0)
        setServicesTotal(total)
      } catch (err) {
        logger.error('Failed to load unit services total', err)
      }
    }

    void loadServicesTotal()
    return () => {
      mounted = false
    }
  }, [formValue.unitId, servicesCount])

  useEffect(() => {
    let mounted = true

    async function loadLookups() {
      try {
        const [unitsRows, propertyRows, landlordRows, tenantRows] = await Promise.all([
          listUnits({ includeArchived: false, limit: 1000 }),
          listProperties({ includeArchived: false, limit: 1000 }),
          listLandlords({ includeArchived: false, limit: 1000 }),
          listTenants({ includeArchived: false, limit: 1000 }),
        ])

        if (!mounted) return

        setUnits(
          unitsRows.map((u) => ({
            id: u.id,
            label: u.display_name || '—',
            propertyId: u.property_id ?? null,
            landlordId: u.landlord_id ?? null,
            tenantId: u.tenant_id ?? null,
            area: u.area ?? null,
          }))
        )

        setProperties(
          propertyRows.map((p) => ({
            id: p.id,
            label: p.display_name || '—',
            buildingArea: p.building_area ?? null,
          }))
        )

        setLandlords(landlordRows.map((l) => ({ id: l.id, label: l.display_name || '—', subjectType: l.subject_type ?? null })))

        let resolvedTenants = tenantRows
        let fallbackUsed = false

        if (!tenantRows.length) {
          try {
            resolvedTenants = await listSubjects({ includeArchived: false, limit: 1000 })
            fallbackUsed = true
          } catch (fallbackErr) {
            logger.error('Failed to load tenant fallback subjects', fallbackErr)
          }
        }

        if (!mounted) return

        setTenantFallbackActive(fallbackUsed)
        setTenants(resolvedTenants.map((t) => ({ id: t.id, label: t.display_name || '—', subjectType: (t as any).subject_type ?? null })))
      } catch (err) {
        logger.error('Failed to load contract lookups', err)
      }
    }

    void loadLookups()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let mounted = true

    async function loadGenericOptions() {
      try {
        const [statusRows, rentPeriodRows] = await Promise.all([
          listActiveByCategory('contract_statuses'),
          listActiveByCategory('service_periodicities'),
        ])

        if (!mounted) return

        setStatusOptions(statusRows.map((r) => ({ id: r.code, label: r.name })))
        setRentPeriodOptions(rentPeriodRows.map((r) => ({ id: r.code, label: r.name })))
      } catch (err) {
        logger.error('Failed to load contract generic types', err)
      }
    }

    void loadGenericOptions()
    return () => {
      mounted = false
    }
  }, [])

  const tenantSubjectType = useMemo(
    () => tenants.find((t) => t.id === formValue.tenantId)?.subjectType ?? null,
    [tenants, formValue.tenantId]
  )
  const landlordSubjectType = useMemo(
    () => landlords.find((l) => l.id === formValue.landlordId)?.subjectType ?? null,
    [landlords, formValue.landlordId]
  )

  const handleSubmit = useCallback(async (): Promise<UiContract | null> => {
    const current = formValueRef.current

    if (!current.cisloSmlouvy?.trim()) {
      toast.showWarning('Číslo smlouvy je povinné.')
      return null
    }

    if (!current.stav?.trim()) {
      toast.showWarning('Stav smlouvy je povinný.')
      return null
    }

    if (!current.unitId?.trim()) {
      toast.showWarning('Jednotka je povinná.')
      return null
    }

    if (!current.propertyId?.trim()) {
      toast.showWarning('Nemovitost je povinná.')
      return null
    }

    if (!current.landlordId?.trim()) {
      toast.showWarning('Pronajímatel je povinný.')
      return null
    }

    if (!current.tenantId?.trim()) {
      toast.showWarning('Nájemník je povinný.')
      return null
    }

    if (!current.tenantAccountId?.trim()) {
      toast.showWarning('Účet nájemníka je povinný.')
      return null
    }

    if (!current.landlordAccountId?.trim()) {
      toast.showWarning('Účet pronajímatele je povinný.')
      return null
    }

    if (current.stav === 'aktivni') {
      const tenantRequiresDelegate = ['firma', 'spolek'].includes(String(tenantSubjectType || ''))
      const landlordRequiresDelegate = ['firma', 'spolek'].includes(String(landlordSubjectType || ''))

      if (tenantRequiresDelegate && !current.tenantDelegateId?.trim()) {
        toast.showWarning('Zástupce nájemníka je povinný pro aktivní smlouvu.')
        return null
      }

      if (landlordRequiresDelegate && !current.landlordDelegateId?.trim()) {
        toast.showWarning('Zástupce pronajímatele je povinný pro aktivní smlouvu.')
        return null
      }
    }

    if (!current.datumZacatek?.trim()) {
      toast.showWarning('Datum začátku je povinné.')
      return null
    }

    if (!current.periodicitaNajmu?.trim()) {
      toast.showWarning('Periodicita nájmu je povinná.')
      return null
    }

    if (!current.denPlatby?.trim()) {
      toast.showWarning('Den platby je povinný.')
      return null
    }

    try {
      const input: SaveContractInput = {
        id: isNewId(resolvedContract.id) ? null : resolvedContract.id,
        cislo_smlouvy: current.cisloSmlouvy,
        stav: current.stav,
        landlord_id: current.landlordId || null,
        tenant_id: current.tenantId || null,
        landlord_account_id: current.landlordAccountId || null,
        tenant_account_id: current.tenantAccountId || null,
        landlord_delegate_id: current.landlordDelegateId || null,
        tenant_delegate_id: current.tenantDelegateId || null,
        pocet_uzivatelu: contractUsersCount ?? current.pocetUzivatelu ?? null,
        property_id: current.propertyId || null,
        unit_id: current.unitId || null,
        pomer_plochy_k_nemovitosti: current.pomerPlochyKNemovitosti || null,
        datum_podpisu: current.datumPodpisu || null,
        datum_zacatek: current.datumZacatek,
        datum_konec: current.dobaNeurcita ? null : current.datumKonec || null,
        doba_neurcita: current.dobaNeurcita,
        najem_vyse: servicesTotal ?? current.najemVyse ?? null,
        periodicita_najmu: current.periodicitaNajmu,
        den_platby: current.denPlatby,
        kauce_potreba: current.kaucePotreba,
        kauce_castka: current.kauceCastka ?? null,
        pozadovany_datum_kauce: current.kaucePotreba ? current.pozadovanyDatumKauce || null : null,
        stav_kauce: current.stavKauce || null,
        stav_najmu: current.stavNajmu || null,
        stav_plateb_smlouvy: current.stavPlatebSmlouvy || null,
        poznamky: current.poznamky || null,
        is_archived: current.isArchived,
      }

      const savedRow = await saveContract(input)

      const saved: UiContract = {
        id: savedRow.id,
        cisloSmlouvy: savedRow.cislo_smlouvy,
        stav: savedRow.stav,
        landlordId: savedRow.landlord_id,
        tenantId: savedRow.tenant_id,
        landlordAccountId: (savedRow as any).landlord_account_id,
        tenantAccountId: (savedRow as any).tenant_account_id,
        landlordDelegateId: (savedRow as any).landlord_delegate_id,
        tenantDelegateId: (savedRow as any).tenant_delegate_id,
        pocetUzivatelu: savedRow.pocet_uzivatelu,
        propertyId: savedRow.property_id,
        unitId: savedRow.unit_id,
        pomerPlochyKNemovitosti: savedRow.pomer_plochy_k_nemovitosti,
        datumPodpisu: savedRow.datum_podpisu,
        datumZacatek: savedRow.datum_zacatek,
        datumKonec: savedRow.datum_konec,
        dobaNeurcita: savedRow.doba_neurcita,
        najemVyse: savedRow.najem_vyse,
        periodicitaNajmu: savedRow.periodicita_najmu,
        denPlatby: savedRow.den_platby,
        kaucePotreba: savedRow.kauce_potreba,
        kauceCastka: savedRow.kauce_castka,
        pozadovanyDatumKauce: savedRow.pozadovany_datum_kauce,
        stavKauce: savedRow.stav_kauce,
        stavNajmu: savedRow.stav_najmu,
        stavPlatebSmlouvy: savedRow.stav_plateb_smlouvy,
        poznamky: savedRow.poznamky,
        isArchived: savedRow.is_archived,
        createdAt: savedRow.created_at,
        createdBy: savedRow.created_by,
        updatedAt: savedRow.updated_at,
        updatedBy: savedRow.updated_by,
      }

      setResolvedContract(saved)
      const newInitial = buildInitialFormValue(saved)
      setFormValue(newInitial)
      initialSnapshotRef.current = JSON.stringify(newInitial)
      onDirtyChange?.(false)
      setFormResetToken((prev) => prev + 1)

      toast.showSuccess(isNewId(contract.id) ? 'Smlouva vytvořena' : 'Smlouva uložena')
      onSaved?.(saved)

      return saved
    } catch (err) {
      logger.error('Failed to save contract', err)
      toast.showError(err instanceof Error ? err.message : 'Chyba při ukládání smlouvy')
      return null
    }
  }, [contract.id, resolvedContract.id, toast, onDirtyChange, onSaved, tenantSubjectType, landlordSubjectType, contractUsersCount, servicesTotal])

  useEffect(() => {
    onRegisterSubmit?.(handleSubmit)
  }, [handleSubmit, onRegisterSubmit])

  const detailViewMode: DetailViewMode = useMemo(() => {
    if (viewMode === 'create') return 'create'
    if (viewMode === 'edit') return 'edit'
    return 'view'
  }, [viewMode])

  const readOnly = detailViewMode === 'view'
  const title = useMemo(() => {
    if (detailViewMode === 'create') return 'Nová smlouva'
    if (detailViewMode === 'edit') return `Editace: ${formValue.cisloSmlouvy || 'smlouva'}`
    return formValue.cisloSmlouvy || 'Smlouva'
  }, [detailViewMode, formValue.cisloSmlouvy])
  const systemBlocks = useMemo(() => {
    return [
      {
        title: 'Metadata',
        visible: true,
        content: (
          <div className="detail-form">
            <div className="detail-form__grid detail-form__grid--narrow">
              <div className="detail-form__field">
                <label className="detail-form__label">Vytvořeno</label>
                <input
                  className="detail-form__input detail-form__input--readonly"
                  value={resolvedContract.createdAt ? formatDateTime(resolvedContract.createdAt) : '—'}
                  readOnly
                />
              </div>
              <div className="detail-form__field">
                <label className="detail-form__label">Aktualizováno</label>
                <input
                  className="detail-form__input detail-form__input--readonly"
                  value={resolvedContract.updatedAt ? formatDateTime(resolvedContract.updatedAt) : '—'}
                  readOnly
                />
              </div>
            </div>
          </div>
        ),
      },
    ]
  }, [resolvedContract.createdAt, resolvedContract.updatedAt])

  const content = (
    <DetailView
      mode={detailViewMode}
      sectionIds={['detail', 'users', 'delegates', 'accounts', 'services', 'attachments', 'system']}
      initialActiveId={initialSectionId ?? 'detail'}
      onActiveSectionChange={onActiveSectionChange}
      ctx={{
        entityType: 'contracts',
        entityId: resolvedContract.id === 'new' ? 'new' : resolvedContract.id || undefined,
        entityLabel: formValue.cisloSmlouvy || null,
        showSystemEntityHeader: false,
        mode: detailViewMode,
        onAttachmentsCountChange: setAttachmentsCount,
        sectionCounts: {
          attachments: attachmentsCount,
          services: servicesCount,
          users: typeof contractUsersCount === 'number' ? contractUsersCount : undefined,
        },
        detailContent: (
          <ContractDetailForm
            contract={formValue}
            readOnly={readOnly}
            units={units}
            properties={properties}
            landlords={landlords}
            tenants={tenants}
            tenantFallbackActive={tenantFallbackActive}
            statusOptions={statusOptions}
            rentPeriodOptions={rentPeriodOptions}
            paymentDayOptions={paymentDayOptions}
            resetToken={formResetToken}
            rentAmountOverride={servicesTotal}
            userCountOverride={contractUsersCount}
            onDirtyChange={handleFormDirtyChange}
            onValueChange={handleFormValueChange}
          />
        ),
        usersContent: (
          <ContractUsersTab
            contractId={resolvedContract.id}
            tenantId={formValue.tenantId || null}
            tenantLabel={tenants.find((t) => t.id === formValue.tenantId)?.label ?? null}
            readOnly={readOnly}
            onSelectionCountChange={(count) => setContractUsersCount(count)}
          />
        ),
        delegatesContent: (
          <ContractDelegatesTab
            tenantId={formValue.tenantId || null}
            landlordId={formValue.landlordId || null}
            tenantSubjectType={tenantSubjectType}
            landlordSubjectType={landlordSubjectType}
            tenantDelegateId={formValue.tenantDelegateId || null}
            landlordDelegateId={formValue.landlordDelegateId || null}
            readOnly={readOnly}
            onChangeTenantDelegate={(id) => {
              setFormValue((prev) => ({ ...prev, tenantDelegateId: id || '' }))
              formValueRef.current = { ...formValueRef.current, tenantDelegateId: id || '' }
              markDirtyIfChanged(formValueRef.current)
            }}
            onChangeLandlordDelegate={(id) => {
              setFormValue((prev) => ({ ...prev, landlordDelegateId: id || '' }))
              formValueRef.current = { ...formValueRef.current, landlordDelegateId: id || '' }
              markDirtyIfChanged(formValueRef.current)
            }}
          />
        ),
        accountsContent: (
          <ContractAccountsTab
            tenantId={formValue.tenantId || null}
            landlordId={formValue.landlordId || null}
            tenantAccountId={formValue.tenantAccountId || null}
            landlordAccountId={formValue.landlordAccountId || null}
            readOnly={readOnly}
            onChangeTenantAccount={(id) => {
              setFormValue((prev) => ({ ...prev, tenantAccountId: id || '' }))
              formValueRef.current = { ...formValueRef.current, tenantAccountId: id || '' }
              markDirtyIfChanged(formValueRef.current)
            }}
            onChangeLandlordAccount={(id) => {
              setFormValue((prev) => ({ ...prev, landlordAccountId: id || '' }))
              formValueRef.current = { ...formValueRef.current, landlordAccountId: id || '' }
              markDirtyIfChanged(formValueRef.current)
            }}
          />
        ),
        servicesContent: (
          <UnitServicesTab
            unitId={formValue.unitId || 'new'}
            readOnly={readOnly}
            onCountChange={(count) => setServicesCount(count)}
          />
        ),
        systemBlocks,
      }}
    />
  )

  if (embedded) {
    return <div className="tile-layout__content">{content}</div>
  }

  return (
    <div className="tile-layout">
      <div className="tile-layout__header">
        <h1 className="tile-layout__title">{title}</h1>
      </div>
      <div className="tile-layout__content">{content}</div>
    </div>
  )
}
