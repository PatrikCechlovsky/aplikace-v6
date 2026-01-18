'use client'

// FILE: app/modules/030-pronajimatel/forms/TenantDetailFrame.tsx
// PURPOSE: Detail view pro pronajimatele (read/edit mode) - bez role/permissions

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import DetailView, { type DetailSectionId, type DetailViewMode } from '@/app/UI/DetailView'
import type { ViewMode } from '@/app/UI/CommonActions'

import TenantDetailForm, { type TenantFormValue } from './TenantDetailForm'
import { getTenantDetail, saveTenant, type SaveTenantInput } from '@/app/lib/services/tenants'
import { getUserDetail } from '@/app/lib/services/users'
import { formatDateTime } from '@/app/lib/formatters/formatDateTime'
import createLogger from '@/app/lib/logger'
import { useToast } from '@/app/UI/Toast'
import { fetchSubjectTypes, type SubjectType } from '@/app/modules/900-nastaveni/services/subjectTypes'
import '@/app/styles/components/TileLayout.css'
import '@/app/styles/components/DetailForm.css'

const logger = createLogger('TenantDetailFrame')

// =====================
// 1) TYPES
// =====================

export type UiTenant = {
  id: string
  displayName: string
  email: string | null
  phone: string | null
  subjectType: string | null
  isArchived: boolean | null
  createdAt: string

  // Person fields
  titleBefore?: string | null
  firstName?: string | null
  lastName?: string | null
  note?: string | null

  // Personal identification
  birthDate?: string | null
  personalIdNumber?: string | null
  idDocType?: string | null
  idDocNumber?: string | null

  // Company fields
  companyName?: string | null
  ic?: string | null
  dic?: string | null
  icValid?: boolean | null
  dicValid?: boolean | null
  delegateIds?: string[] // Pole ID zástupců (N:N vztah přes subject_delegates)

  // Address
  street?: string | null
  city?: string | null
  zip?: string | null
  houseNumber?: string | null
  country?: string | null

  // Role flags
  isUser?: boolean | null
  isLandlord?: boolean | null
  isLandlordDelegate?: boolean | null
  isTenant?: boolean | null
  isTenantDelegate?: boolean | null
  isMaintenance?: boolean | null
  isMaintenanceDelegate?: boolean | null
}

type Props = {
  tenant: UiTenant
  viewMode: ViewMode
  initialSectionId?: DetailSectionId
  onActiveSectionChange?: (id: DetailSectionId) => void
  onRegisterSubmit?: (fn: () => Promise<UiTenant | null>) => void
  onDirtyChange?: (dirty: boolean) => void
  onSaved?: (tenant: UiTenant) => void // Callback po uložení
  onCreateDelegateFromUser?: (userId: string) => void // Callback pro vytvoření zástupce z uživatele
  onOpenNewDelegateForm?: (type: string, fromUserId?: string) => void // Callback pro otevření formuláře nového zástupce
}

// Očekávané typy subjektů pro pronajimatele
const EXPECTED_SUBJECT_TYPES = ['osoba', 'osvc', 'firma', 'spolek', 'statni', 'zastupce']

// =====================
// 2) HELPERS
// =====================

function buildInitialFormValue(l: UiTenant): TenantFormValue {
  return {
    displayName: (l.displayName ?? '').toString(),
    email: (l.email ?? '').toString(),
    phone: (l.phone ?? '').toString(),
    note: (l.note ?? '').toString(),

    titleBefore: (l.titleBefore ?? '').toString(),
    firstName: (l.firstName ?? '').toString(),
    lastName: (l.lastName ?? '').toString(),

    birthDate: (l.birthDate ?? '').toString(),
    personalIdNumber: (l.personalIdNumber ?? '').toString(),
    idDocType: (l.idDocType ?? '').toString(),
    idDocNumber: (l.idDocNumber ?? '').toString(),

    companyName: (l.companyName ?? '').toString(),
    ic: (l.ic ?? '').toString(),
    dic: (l.dic ?? '').toString(),
    icValid: !!l.icValid,
    dicValid: !!l.dicValid,
    delegateIds: Array.isArray(l.delegateIds) ? l.delegateIds : [],

    street: (l.street ?? '').toString(),
    city: (l.city ?? '').toString(),
    zip: (l.zip ?? '').toString(),
    houseNumber: (l.houseNumber ?? '').toString(),
    country: (l.country ?? 'CZ').toString(),

    isUser: !!l.isUser,
    isLandlord: !!l.isLandlord,
    isLandlordDelegate: !!l.isLandlordDelegate,
    isTenant: l.isTenant !== undefined ? !!l.isTenant : true,
    isTenantDelegate: !!l.isTenantDelegate,
    isMaintenance: !!l.isMaintenance,
    isMaintenanceDelegate: !!l.isMaintenanceDelegate,

    isArchived: !!l.isArchived,
  }
}

function isNewId(id: string | null | undefined) {
  const s = String(id ?? '').trim()
  return !s || s === 'new'
}

// =====================
// 3) COMPONENT
// =====================

export default function TenantDetailFrame({
  tenant,
  viewMode,
  initialSectionId,
  onActiveSectionChange,
  onRegisterSubmit,
  onDirtyChange,
  onSaved,
  onCreateDelegateFromUser,
  onOpenNewDelegateForm,
}: Props) {
  // DB truth (subjects)
  const [resolvedTenant, setResolvedTenant] = useState<UiTenant>(tenant)
  const resolveSeqRef = useRef(0)
  const searchParams = useSearchParams()

  // Subject types pro změnu typu v edit mode
  const [subjectTypes, setSubjectTypes] = useState<SubjectType[]>([])
  const [selectedSubjectType, setSelectedSubjectType] = useState<string | null>(tenant.subjectType || null)

  // Dirty state - wrapper který volá onDirtyChange callback
  const setDirtyAndNotify = useCallback(
    (dirty: boolean) => {
      onDirtyChange?.(dirty)
    },
    [onDirtyChange]
  )
  const toast = useToast()
  const initialSnapshotRef = useRef<string>('')
  const firstRenderRef = useRef(true)

  const [formValue, setFormValue] = useState<TenantFormValue>(() => buildInitialFormValue(tenant))
  const formValueRef = useRef<TenantFormValue>(formValue) // Ref pro aktuální hodnotu

  // Aktualizovat ref při změně formValue
  useEffect(() => {
    formValueRef.current = formValue
  }, [formValue])

  // Načíst typy subjektů pro select v edit mode
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const types = await fetchSubjectTypes()
        if (!mounted) return

        // Filtrovat jen očekávané typy
        const filtered = EXPECTED_SUBJECT_TYPES.map((code) =>
          types.find((t) => t.code === code)
        ).filter((t): t is SubjectType => !!t && (t.active ?? true))

        setSubjectTypes(filtered)
      } catch (err: any) {
        logger.error('fetchSubjectTypes failed', err)
        // Není kritické - pouze pro select v edit mode
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  // Aktualizovat selectedSubjectType když se změní resolvedTenant.subjectType (při načtení dat)
  useEffect(() => {
    if (resolvedTenant.subjectType && resolvedTenant.subjectType !== selectedSubjectType) {
      setSelectedSubjectType(resolvedTenant.subjectType)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedTenant.id, resolvedTenant.subjectType]) // Aktualizovat když se změní ID nebo subjectType

  // Aktualizovat formValue když se změní tenant prop (např. při výběru typu subjektu)
  useEffect(() => {
    if (viewMode === 'create' || isNewId(tenant?.id)) {
      const init = buildInitialFormValue(tenant)
      setFormValue(init)
      initialSnapshotRef.current = JSON.stringify(init)
      firstRenderRef.current = true
      setDirtyAndNotify(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant?.subjectType, viewMode]) // Aktualizovat když se změní subjectType nebo viewMode

  // Resolve DB truth on open / tenant change
  useEffect(() => {
    // fast: show whatever we already have
    setResolvedTenant(tenant)

    // create/new => no DB resolve
    if (viewMode === 'create' || isNewId(tenant?.id)) {
      const init = buildInitialFormValue(tenant)
      setFormValue(init)
      initialSnapshotRef.current = JSON.stringify(init)
      firstRenderRef.current = true
      setDirtyAndNotify(false)
      return
    }

    // read/edit => resolve from Supabase (jen pokud není 'new')
    const subjectId = String(tenant?.id ?? '').trim()
    if (!subjectId || subjectId === 'new') {
      // Nový tenant - zkontrolovat, jestli máme fromUserId pro předvyplnění dat uživatele
      const fromUserId = searchParams?.get('fromUserId')?.trim() ?? null
      const typeFromUrl = searchParams?.get('type')?.trim() ?? null
      const subjectType = tenant.subjectType || typeFromUrl // Použít type z URL pokud není v tenant
      if (fromUserId && subjectType === 'zastupce') {
        // Načíst data uživatele a předvyplnit formulář
        const mySeq = ++resolveSeqRef.current
        let mounted = true

        ;(async () => {
          try {
            logger.log('TenantDetailFrame: loading user data for delegate', { fromUserId })
            const userDetail = await getUserDetail(fromUserId)
            if (!mounted) return
            if (mySeq !== resolveSeqRef.current) return

            const s = userDetail.subject
            logger.log('TenantDetailFrame: user data loaded', { userDetail: s })

            // Předvyplnit formulář daty uživatele
            const presetTenant: UiTenant = {
              ...tenant,
              id: 'new',
              subjectType: subjectType || 'zastupce',
              displayName: s.display_name ?? '',
              email: s.email ?? null,
              phone: s.phone ?? null,
              titleBefore: s.title_before ?? null,
              firstName: s.first_name ?? null,
              lastName: s.last_name ?? null,
              birthDate: s.birth_date ?? null,
              personalIdNumber: s.personal_id_number ?? null,
              idDocType: s.id_doc_type ?? null,
              idDocNumber: s.id_doc_number ?? null,
              street: (s as any).street ?? null,
              city: (s as any).city ?? null,
              zip: (s as any).zip ?? null,
              houseNumber: (s as any).house_number ?? null,
              country: (s as any).country ?? 'CZ',
              note: (s as any).note ?? null,
            }

            setResolvedTenant(presetTenant)
            const init = buildInitialFormValue(presetTenant)
            setFormValue(init)
            initialSnapshotRef.current = JSON.stringify(init)
            firstRenderRef.current = true
            setDirtyAndNotify(false)
          } catch (e: any) {
            if (!mounted) return
            logger.error('getUserDetail failed', { fromUserId, error: e, message: e?.message, code: e?.code })
            toast.showError(e?.message || 'Nepodařilo se načíst data uživatele')
            // Použít standardní inicializaci
            const init = buildInitialFormValue(tenant)
            setFormValue(init)
            initialSnapshotRef.current = JSON.stringify(init)
            firstRenderRef.current = true
            setDirtyAndNotify(false)
          }
        })()

        return () => {
          mounted = false
        }
      } else {
        // Nový tenant bez fromUserId - použij initial hodnoty
        const init = buildInitialFormValue(tenant)
        setFormValue(init)
        initialSnapshotRef.current = JSON.stringify(init)
        firstRenderRef.current = true
        setDirtyAndNotify(false)
        return
      }
    }

    const mySeq = ++resolveSeqRef.current
    let mounted = true

    ;(async () => {
      try {
        logger.log('TenantDetailFrame: loading detail', { subjectId, viewMode })
        const detail = await getTenantDetail(subjectId)
        if (!mounted) return
        if (mySeq !== resolveSeqRef.current) return

        const s: any = detail ?? {}
        logger.log('TenantDetailFrame: detail loaded', { detail: s })

        const nextTenant: UiTenant = {
          ...tenant,
          id: String(s.id ?? subjectId),
          displayName: String(s.display_name ?? tenant.displayName ?? ''),
          email: s.email ?? tenant.email ?? null,
          phone: s.phone ?? tenant.phone ?? null,
          subjectType: s.subject_type ?? tenant.subjectType ?? null,
          isArchived: !!(s.is_archived ?? tenant.isArchived),
          createdAt: String(s.created_at ?? tenant.createdAt ?? ''),

          titleBefore: s.title_before ?? tenant.titleBefore ?? null,
          firstName: s.first_name ?? tenant.firstName ?? null,
          lastName: s.last_name ?? tenant.lastName ?? null,
          note: s.note ?? tenant.note ?? null,

          birthDate: s.birth_date ?? tenant.birthDate ?? null,
          personalIdNumber: s.personal_id_number ?? tenant.personalIdNumber ?? null,
          idDocType: s.id_doc_type ?? tenant.idDocType ?? null,
          idDocNumber: s.id_doc_number ?? tenant.idDocNumber ?? null,

          companyName: s.company_name ?? tenant.companyName ?? null,
          ic: s.ic ?? tenant.ic ?? null,
          dic: s.dic ?? tenant.dic ?? null,
          icValid: s.ic_valid ?? tenant.icValid ?? null,
          dicValid: s.dic_valid ?? tenant.dicValid ?? null,
          delegateIds: (s as any).delegateIds ?? tenant.delegateIds ?? [],

          street: s.street ?? tenant.street ?? null,
          city: s.city ?? tenant.city ?? null,
          zip: s.zip ?? tenant.zip ?? null,
          houseNumber: s.house_number ?? tenant.houseNumber ?? null,
          country: s.country ?? tenant.country ?? 'CZ',
        }

        setResolvedTenant(nextTenant)

        const init = buildInitialFormValue(nextTenant)
        setFormValue(init)
        initialSnapshotRef.current = JSON.stringify(init)
        firstRenderRef.current = true
        setDirtyAndNotify(false)
      } catch (e: any) {
        if (!mounted) return
        logger.error('getTenantDetail failed', { subjectId, error: e, message: e?.message, code: e?.code })
        toast.showError(e?.message || 'Nepodařilo se načíst detail pronajimatele')
        // Necháme tenant z prop, aby se formulář alespoň zobrazil
      }
    })()

    return () => {
      mounted = false
    }
  }, [tenant?.id, tenant?.subjectType, viewMode, toast, onDirtyChange, logger]) // eslint-disable-line react-hooks/exhaustive-deps

  // =====================
  // 4) ACTION HANDLERS
  // =====================

  const computeDirty = useCallback((nextFormSnap?: string) => {
    const formSnap = typeof nextFormSnap === 'string' ? nextFormSnap : JSON.stringify(formValue ?? {})
    const dirty = formSnap !== initialSnapshotRef.current
    setDirtyAndNotify(dirty)
  }, [formValue, setDirtyAndNotify])

  const markDirtyIfChanged = useCallback(
    (nextVal: any) => {
      const snap = JSON.stringify(nextVal ?? {})
      if (firstRenderRef.current) {
        // První render - nastavit snapshot, ale neoznačovat jako dirty
        firstRenderRef.current = false
        initialSnapshotRef.current = snap
        setDirtyAndNotify(false)
        return
      }
      // Následující změny - zkontrolovat, jestli se skutečně změnilo
      computeDirty(snap)
    },
    [computeDirty, setDirtyAndNotify]
  )

  // Register save submit
  useEffect(() => {
    if (!onRegisterSubmit) return

    onRegisterSubmit(async () => {
      try {
        // Použít ref místo state pro získání aktuální hodnoty
        const v = formValueRef.current ?? buildInitialFormValue(resolvedTenant)
        
        console.log('[TenantDetailFrame] Validating form values - companyName:', v.companyName, 'ic:', v.ic, 'city:', v.city, 'email:', v.email)

        // Použít změněný subjectType pokud je v edit mode, jinak použít z resolvedTenant
        const subjectType = selectedSubjectType || resolvedTenant.subjectType || 'osoba'
        console.log('[TenantDetailFrame] Subject type:', subjectType)
        
        if (!subjectType) {
          toast.showError('Typ subjektu je povinný')
          return null
        }

        // Validace podle typu subjektu
        const missingFields: string[] = []

        // E-mail je vždy povinný
        if (!v.email?.trim()) {
          missingFields.push('E-mail')
        }

        // Adresa je vždy povinná (minimálně město)
        if (!v.city?.trim()) {
          missingFields.push('Město')
        }

        // Pro fyzické osoby (osoba, osvc, zastupce)
        const isPersonType = ['osoba', 'osvc', 'zastupce'].includes(subjectType)
        if (isPersonType) {
          if (!v.firstName?.trim()) missingFields.push('Jméno')
          if (!v.lastName?.trim()) missingFields.push('Příjmení')
        }

        // Pro firmy, spolky, státní organizace
        const isCompanyType = ['firma', 'spolek', 'statni'].includes(subjectType)
        if (isCompanyType) {
          console.log('[TenantDetailFrame] Checking company fields:', {
            companyName: v.companyName,
            ic: v.ic
          })
          if (!v.companyName?.trim()) missingFields.push('Název společnosti')
          if (!v.ic?.trim()) missingFields.push('IČ')
        }

        console.log('[TenantDetailFrame] Missing fields:', missingFields)

        // Pokud chybí nějaká pole, zobrazit chybu
        if (missingFields.length > 0) {
          const fieldList = missingFields.join(', ')
          toast.showError(`Vyplňte prosím povinná pole: ${fieldList}`)
          return null
        }

        // Mapovat formValue na SaveTenantInput
        const input: SaveTenantInput = {
          id: isNewId(resolvedTenant.id) ? 'new' : resolvedTenant.id,
          subjectType,

          // displayName je povinné v DB - fallback na název firmy nebo email
          displayName: v.displayName.trim() || v.companyName.trim() || v.email.trim() || 'Bez názvu',
          email: v.email.trim() || null,
          phone: v.phone.trim() || null,
          isArchived: v.isArchived,

          titleBefore: v.titleBefore.trim() || null,
          firstName: v.firstName.trim() || null,
          lastName: v.lastName.trim() || null,
          note: v.note.trim() || null,

          birthDate: v.birthDate.trim() || null,
          personalIdNumber: v.personalIdNumber.trim() || null,
          idDocType: v.idDocType.trim() || null,
          idDocNumber: v.idDocNumber.trim() || null,

          companyName: v.companyName.trim() || null,
          ic: v.ic.trim() || null,
          dic: v.dic.trim() || null,
          icValid: v.icValid,
          dicValid: v.dicValid,
          delegateIds: Array.isArray(v.delegateIds) ? v.delegateIds.filter((id) => id && id.trim()) : [],

          street: v.street.trim() || null,
          city: v.city.trim() || null,
          zip: v.zip.trim() || null,
          houseNumber: v.houseNumber.trim() || null,
          country: v.country.trim() || null,
        }

        const saved = await saveTenant(input)
        logger.log('Tenant saved', { id: saved.id })

        toast.showSuccess('Nájemník byl úspěšně uložen')

        // Aktualizovat resolvedTenant s uloženými daty
        const updated: UiTenant = {
          ...resolvedTenant,
          id: saved.id,
          displayName: saved.display_name ?? '',
          email: saved.email,
          phone: saved.phone,
          subjectType: saved.subject_type,
          isArchived: saved.is_archived ?? false,
          createdAt: saved.created_at ?? resolvedTenant.createdAt,

          titleBefore: saved.title_before ?? null,
          firstName: saved.first_name ?? null,
          lastName: saved.last_name ?? null,
          note: saved.note ?? null,

          birthDate: saved.birth_date ?? null,
          personalIdNumber: saved.personal_id_number ?? null,
          idDocType: saved.id_doc_type ?? null,
          idDocNumber: saved.id_doc_number ?? null,

          companyName: saved.company_name ?? null,
          ic: saved.ic ?? null,
          dic: saved.dic ?? null,
          icValid: saved.ic_valid ?? null,
          dicValid: saved.dic_valid ?? null,
          delegateIds: (saved as any).delegateIds ?? [],

          street: saved.street ?? null,
          city: saved.city ?? null,
          zip: saved.zip ?? null,
          houseNumber: saved.house_number ?? null,
          country: saved.country ?? 'CZ',
        }

        setResolvedTenant(updated)
        const newInit = buildInitialFormValue(updated)
        setFormValue(newInit)
        initialSnapshotRef.current = JSON.stringify(newInit)
        firstRenderRef.current = true
        setDirtyAndNotify(false)

        // Callback pro rodiče (TenantsTile)
        onSaved?.(updated)

        return updated
      } catch (err: any) {
        logger.error('saveTenant failed', err)
        toast.showError(err?.message || 'Nepodařilo se uložit pronajimatele')
        return null
      }
    })
  }, [formValue, resolvedTenant, selectedSubjectType, toast, onRegisterSubmit, setDirtyAndNotify, onSaved])

  // =====================
  // 5) RENDER
  // =====================

  const readOnly = viewMode === 'read'
  const subjectType = selectedSubjectType || resolvedTenant.subjectType || 'osoba'
  const detailMode: DetailViewMode = readOnly ? 'view' : 'edit'

  const sectionIds: DetailSectionId[] = useMemo(() => ['detail', 'users', 'accounts', 'delegates', 'attachments', 'system'], [])

  const handleSubjectTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newType = e.target.value
      const oldType = selectedSubjectType

      // Pokud se typ změnil, upozornit uživatele
      if (oldType && oldType !== newType) {
        const ok = confirm(
          'Změna typu subjektu může způsobit ztrátu dat v polích specifických pro původní typ. Chceš pokračovat?'
        )
        if (!ok) {
          // Vrátit původní hodnotu - musím použít setSelectedSubjectType, protože e.target.value se nedá jednoduše resetovat
          return
        }
      }

      setSelectedSubjectType(newType || null)
      // Aktualizovat resolvedTenant s novým typem
      setResolvedTenant((prev) => ({
        ...prev,
        subjectType: newType || null,
      }))

      // Reset formuláře pro nový typ - znovu inicializovat formValue podle nového typu
      // Key prop na TenantDetailForm způsobí remount, ale formValue musí být také aktualizován
      const updatedTenant: UiTenant = {
        ...resolvedTenant,
        subjectType: newType || null,
      }
      const resetFormValue = buildInitialFormValue(updatedTenant)
      setFormValue(resetFormValue)
      initialSnapshotRef.current = JSON.stringify(resetFormValue)
      firstRenderRef.current = true

      // Označit jako dirty (změna typu je změna)
      setDirtyAndNotify(true)
    },
    [selectedSubjectType, resolvedTenant, setDirtyAndNotify]
  )

  const systemBlocks = useMemo(() => {
    // Najít aktuálně vybraný typ subjektu
    const currentSubjectType = subjectTypes.find((t) => t.code === selectedSubjectType)

    return [
      {
        title: 'Systémové údaje',
        content: (
          <div className="detail-form__grid detail-form__grid--narrow">
            <div className="detail-form__field">
              <label className="detail-form__label">ID</label>
              <input
                className="detail-form__input detail-form__input--readonly"
                type="text"
                value={resolvedTenant.id}
                readOnly
              />
            </div>

            <div className="detail-form__field">
              <label className="detail-form__label">Typ subjektu</label>
              {readOnly ? (
                <input
                  className="detail-form__input detail-form__input--readonly"
                  type="text"
                  value={currentSubjectType?.name || resolvedTenant.subjectType || '—'}
                  readOnly
                />
              ) : (
                <select
                  className="detail-form__input"
                  value={selectedSubjectType || resolvedTenant.subjectType || ''}
                  onChange={handleSubjectTypeChange}
                  style={{ maxWidth: '100%' }}
                >
                  <option value="" disabled>
                    — vyber typ subjektu —
                  </option>
                  {subjectTypes.map((type) => (
                    <option key={type.code} value={type.code}>
                      {type.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="detail-form__field">
              <label className="detail-form__label">Vytvořeno</label>
              <input
                className="detail-form__input detail-form__input--readonly"
                type="text"
                value={resolvedTenant.createdAt ? formatDateTime(resolvedTenant.createdAt) : '—'}
                readOnly
              />
            </div>

            <div className="detail-form__field">
              <label className="detail-form__label">Archivován</label>
              <input
                className="detail-form__input detail-form__input--readonly"
                type="text"
                value={resolvedTenant.isArchived ? 'Ano' : 'Ne'}
                readOnly
              />
            </div>
          </div>
        ),
        visible: true,
      },
    ]
  }, [resolvedTenant, subjectTypes, selectedSubjectType, readOnly, handleSubjectTypeChange])

  const tenantName = resolvedTenant.displayName || 'Nájemník'
  
  // Najít název typu subjektu
  const subjectTypeName = useMemo(() => {
    const type = selectedSubjectType || resolvedTenant.subjectType
    if (!type) return null
    const typeMeta = subjectTypes.find((t) => t.code === type)
    return typeMeta?.name || type
  }, [selectedSubjectType, resolvedTenant.subjectType, subjectTypes])
  
  let title = 'Nájemník'
  if (resolvedTenant.id === 'new' || viewMode === 'create') {
    title = subjectTypeName ? `Nový nájemník - ${subjectTypeName}` : 'Nový nájemník'
  } else if (viewMode === 'edit') {
    title = subjectTypeName ? `Editace pronajimatele - ${subjectTypeName}: ${tenantName}` : `Editace pronajimatele: ${tenantName}`
  } else {
    title = subjectTypeName ? `Nájemník - ${subjectTypeName}: ${tenantName}` : `Nájemník: ${tenantName}`
  }

  return (
    <div className="tile-layout">
      <div className="tile-layout__header">
        <h1 className="tile-layout__title">{title}</h1>
      </div>
      <div className="tile-layout__content">
        <DetailView
          mode={detailMode}
          sectionIds={sectionIds}
          initialActiveId={initialSectionId ?? 'detail'}
          onActiveSectionChange={(id) => {
            onActiveSectionChange?.(id)
          }}
          ctx={
            {
              entityType: 'subjects',
              // Pro create mode nastavit entityId na 'new', aby byly záložky viditelné
              entityId: resolvedTenant.id === 'new' ? 'new' : resolvedTenant.id || undefined,
              entityLabel: resolvedTenant.displayName ?? null,
              showSystemEntityHeader: false,
              mode: detailMode,
                  onCreateDelegateFromUser, // Předat do DelegatesSection přes ctx
                  onOpenNewDelegateForm, // Předat do DelegatesSection přes ctx

              detailContent: (
                <TenantDetailForm
                  key={`form-${resolvedTenant.id}-${subjectType}`}
                  subjectType={subjectType}
                  tenant={formValue}
                  readOnly={readOnly}
                  onDirtyChange={(dirty) => {
                    if (dirty) {
                      markDirtyIfChanged(formValue)
                    } else {
                      computeDirty()
                    }
                  }}
                  onValueChange={(val) => {
                    console.log('[TenantDetailFrame] onValueChange - companyName:', val.companyName, 'ic:', val.ic, 'city:', val.city)
                    setFormValue(val)
                    formValueRef.current = val // Synchronně aktualizovat ref
                    markDirtyIfChanged(val)
                  }}
                />
              ),

            systemBlocks,
          } as any}
        />
      </div>
    </div>
  )
}

