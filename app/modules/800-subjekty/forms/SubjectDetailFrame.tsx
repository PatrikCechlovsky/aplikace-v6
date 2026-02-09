'use client'

// FILE: app/modules/800-subjekty/forms/SubjectDetailFrame.tsx
// PURPOSE: Detail view pro subjekt (read/edit/create) se stejným vzhledem jako pronajímatel
// NOTES: Používá stejný formulář jako pronajímatel, ale ukládá role bez vynucení pronajímatele

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import DetailView, { type DetailSectionId, type DetailViewMode } from '@/app/UI/DetailView'
import type { ViewMode } from '@/app/UI/CommonActions'

import LandlordDetailForm, { type LandlordFormValue } from '@/app/modules/030-pronajimatel/forms/LandlordDetailForm'
import { getSubjectDetail, saveSubject, type SaveSubjectInput } from '@/app/lib/services/subjects'
import { getLandlordDelegates } from '@/app/lib/services/landlords'
import { formatDateTime } from '@/app/lib/formatters/formatDateTime'
import createLogger from '@/app/lib/logger'
import { useToast } from '@/app/UI/Toast'
import { fetchSubjectTypes, type SubjectType } from '@/app/modules/900-nastaveni/services/subjectTypes'
import { listBankAccounts } from '@/app/lib/services/bankAccounts'
import { listAttachments } from '@/app/lib/attachments'
import '@/app/styles/components/TileLayout.css'
import '@/app/styles/components/DetailForm.css'

const logger = createLogger('SubjectDetailFrame')

// =====================
// 1) TYPES
// =====================

export type UiSubject = {
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
  subject: UiSubject
  viewMode: ViewMode
  embedded?: boolean
  initialSectionId?: DetailSectionId
  onActiveSectionChange?: (id: DetailSectionId) => void
  onRegisterSubmit?: (fn: () => Promise<UiSubject | null>) => void
  onDirtyChange?: (dirty: boolean) => void
  onSaved?: (subject: UiSubject) => void // Callback po uložení
  onCreateDelegateFromUser?: (userId: string) => void // Callback pro vytvoření zástupce z uživatele
  onOpenNewDelegateForm?: (type: string, fromUserId?: string) => void // Callback pro otevření formuláře nového zástupce
}

// Očekávané typy subjektů
const EXPECTED_SUBJECT_TYPES = ['osoba', 'osvc', 'firma', 'spolek', 'statni', 'zastupce']

// =====================
// 2) HELPERS
// =====================

function buildInitialFormValue(s: UiSubject): LandlordFormValue {
  return {
    displayName: (s.displayName ?? '').toString(),
    email: (s.email ?? '').toString(),
    phone: (s.phone ?? '').toString(),
    note: (s.note ?? '').toString(),

    titleBefore: (s.titleBefore ?? '').toString(),
    firstName: (s.firstName ?? '').toString(),
    lastName: (s.lastName ?? '').toString(),

    birthDate: (s.birthDate ?? '').toString(),
    personalIdNumber: (s.personalIdNumber ?? '').toString(),
    idDocType: (s.idDocType ?? '').toString(),
    idDocNumber: (s.idDocNumber ?? '').toString(),

    companyName: (s.companyName ?? '').toString(),
    ic: (s.ic ?? '').toString(),
    dic: (s.dic ?? '').toString(),
    icValid: !!s.icValid,
    dicValid: !!s.dicValid,
    delegateIds: Array.isArray(s.delegateIds) ? s.delegateIds : [],

    street: (s.street ?? '').toString(),
    city: (s.city ?? '').toString(),
    zip: (s.zip ?? '').toString(),
    houseNumber: (s.houseNumber ?? '').toString(),
    country: (s.country ?? 'CZ').toString(),

    isUser: !!s.isUser,
    isLandlord: !!s.isLandlord,
    isLandlordDelegate: !!s.isLandlordDelegate,
    isTenant: !!s.isTenant,
    isTenantDelegate: !!s.isTenantDelegate,
    isMaintenance: !!s.isMaintenance,
    isMaintenanceDelegate: !!s.isMaintenanceDelegate,

    isArchived: !!s.isArchived,
  }
}

function isNewId(id: string | null | undefined) {
  const s = String(id ?? '').trim()
  return !s || s === 'new'
}

// =====================
// 3) COMPONENT
// =====================

export default function SubjectDetailFrame({
  subject,
  viewMode,
  embedded = false,
  initialSectionId,
  onActiveSectionChange,
  onRegisterSubmit,
  onDirtyChange,
  onSaved,
  onCreateDelegateFromUser,
  onOpenNewDelegateForm,
}: Props) {
  // DB truth (subjects)
  const [resolvedSubject, setResolvedSubject] = useState<UiSubject>(subject)
  const resolveSeqRef = useRef(0)
  const searchParams = useSearchParams()

  // Subject types pro změnu typu v edit mode
  const [subjectTypes, setSubjectTypes] = useState<SubjectType[]>([])
  const [selectedSubjectType, setSelectedSubjectType] = useState<string | null>(subject.subjectType || null)
  const [accountsCount, setAccountsCount] = useState(0)
  const [delegatesCount, setDelegatesCount] = useState(0)
  const [attachmentsCount, setAttachmentsCount] = useState(0)

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

  const [formValue, setFormValue] = useState<LandlordFormValue>(() => buildInitialFormValue(subject))
  const formValueRef = useRef<LandlordFormValue>(formValue) // Ref pro aktuální hodnotu

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

  // Aktualizovat selectedSubjectType když se změní resolvedSubject.subjectType (při načtení dat)
  useEffect(() => {
    if (resolvedSubject.subjectType && resolvedSubject.subjectType !== selectedSubjectType) {
      setSelectedSubjectType(resolvedSubject.subjectType)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedSubject.id, resolvedSubject.subjectType])

  // Aktualizovat formValue když se změní subject prop (např. při výběru typu subjektu)
  useEffect(() => {
    if (viewMode === 'create' || isNewId(subject?.id)) {
      const init = buildInitialFormValue(subject)
      setFormValue(init)
      initialSnapshotRef.current = JSON.stringify(init)
      firstRenderRef.current = true
      setDirtyAndNotify(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject?.subjectType, viewMode])

  // Resolve DB truth on open / subject change
  useEffect(() => {
    // fast: show whatever we already have
    setResolvedSubject(subject)

    // create/new => no DB resolve
    if (viewMode === 'create' || isNewId(subject?.id)) {
      const init = buildInitialFormValue(subject)
      setFormValue(init)
      initialSnapshotRef.current = JSON.stringify(init)
      firstRenderRef.current = true
      setDirtyAndNotify(false)
      return
    }

    // read/edit => resolve from Supabase (jen pokud není 'new')
    const subjectId = String(subject?.id ?? '').trim()
    if (!subjectId || subjectId === 'new') {
      // Nový subjekt - zkontrolovat, jestli máme fromUserId pro předvyplnění dat uživatele
      const fromUserId = searchParams?.get('fromUserId')?.trim() ?? null
      const typeFromUrl = searchParams?.get('type')?.trim() ?? null
      const subjectType = subject.subjectType || typeFromUrl
      if (fromUserId && subjectType === 'zastupce') {
        const mySeq = ++resolveSeqRef.current
        let mounted = true

        ;(async () => {
          try {
            const detail = await getSubjectDetail(fromUserId)
            if (!mounted) return
            if (mySeq !== resolveSeqRef.current) return

            const s: any = detail?.subject ?? {}
            const presetSubject: UiSubject = {
              ...subject,
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
              isUser: !!s.is_user,
              isLandlord: !!s.is_landlord,
              isLandlordDelegate: !!s.is_landlord_delegate,
              isTenant: !!s.is_tenant,
              isTenantDelegate: !!s.is_tenant_delegate,
              isMaintenance: !!s.is_maintenance,
              isMaintenanceDelegate: !!s.is_maintenance_delegate,
            }

            setResolvedSubject(presetSubject)
            const init = buildInitialFormValue(presetSubject)
            setFormValue(init)
            initialSnapshotRef.current = JSON.stringify(init)
            firstRenderRef.current = true
            setDirtyAndNotify(false)
          } catch (e) {
            logger.error('getSubjectDetail (fromUserId) failed', e)
          }
        })()

        return () => {
          mounted = false
        }
      }

      return
    }

    const mySeq = ++resolveSeqRef.current
    let mounted = true

    ;(async () => {
      try {
        const detail = await getSubjectDetail(subjectId)
        if (!mounted) return
        if (mySeq !== resolveSeqRef.current) return

        const s: any = detail?.subject ?? {}

        const nextSubject: UiSubject = {
          ...subject,
          id: String(s.id ?? subjectId),
          displayName: String(s.display_name ?? subject.displayName ?? ''),
          email: s.email ?? subject.email ?? null,
          phone: s.phone ?? subject.phone ?? null,
          subjectType: s.subject_type ?? subject.subjectType ?? null,
          isArchived: !!(s.is_archived ?? subject.isArchived),
          createdAt: String(s.created_at ?? subject.createdAt ?? ''),

          titleBefore: s.title_before ?? subject.titleBefore ?? null,
          firstName: s.first_name ?? subject.firstName ?? null,
          lastName: s.last_name ?? subject.lastName ?? null,
          note: s.note ?? subject.note ?? null,

          birthDate: s.birth_date ?? subject.birthDate ?? null,
          personalIdNumber: s.personal_id_number ?? subject.personalIdNumber ?? null,
          idDocType: s.id_doc_type ?? subject.idDocType ?? null,
          idDocNumber: s.id_doc_number ?? subject.idDocNumber ?? null,

          companyName: s.company_name ?? subject.companyName ?? null,
          ic: s.ic ?? subject.ic ?? null,
          dic: s.dic ?? subject.dic ?? null,
          icValid: s.ic_valid ?? subject.icValid ?? null,
          dicValid: s.dic_valid ?? subject.dicValid ?? null,
          delegateIds: (s as any).delegateIds ?? subject.delegateIds ?? [],

          street: s.street ?? subject.street ?? null,
          city: s.city ?? subject.city ?? null,
          zip: s.zip ?? subject.zip ?? null,
          houseNumber: s.house_number ?? subject.houseNumber ?? null,
          country: s.country ?? subject.country ?? 'CZ',

          isUser: !!s.is_user,
          isLandlord: !!s.is_landlord,
          isLandlordDelegate: !!s.is_landlord_delegate,
          isTenant: !!s.is_tenant,
          isTenantDelegate: !!s.is_tenant_delegate,
          isMaintenance: !!s.is_maintenance,
          isMaintenanceDelegate: !!s.is_maintenance_delegate,
        }

        setResolvedSubject(nextSubject)

        const init = buildInitialFormValue(nextSubject)
        setFormValue(init)
        initialSnapshotRef.current = JSON.stringify(init)
        firstRenderRef.current = true
        setDirtyAndNotify(false)
      } catch (e: any) {
        if (!mounted) return
        logger.error('getSubjectDetail failed', { subjectId, error: e, message: e?.message, code: e?.code })
        toast.showError(e?.message || 'Nepodařilo se načíst detail subjektu')
      }
    })()

    return () => {
      mounted = false
    }
  }, [subject?.id, subject?.subjectType, viewMode, toast, onDirtyChange, logger]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isNewId(resolvedSubject.id)) {
      setAccountsCount(0)
      setDelegatesCount(0)
      setAttachmentsCount(0)
      return
    }

    let cancelled = false

    ;(async () => {
      try {
        const [accounts, delegates, attachments] = await Promise.all([
          listBankAccounts(resolvedSubject.id),
          getLandlordDelegates(resolvedSubject.id),
          listAttachments({ entityType: 'subjects', entityId: resolvedSubject.id, includeArchived: false }),
        ])

        if (cancelled) return
        setAccountsCount(accounts.filter((a) => !a.is_archived).length)
        setDelegatesCount(delegates.length)
        setAttachmentsCount(attachments.length)
      } catch (err) {
        if (!cancelled) logger.error('Failed to load subject counts', err)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [resolvedSubject.id])

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
        const v = formValueRef.current ?? buildInitialFormValue(resolvedSubject)

        // Použít změněný subjectType pokud je v edit mode, jinak použít z resolvedSubject
        const subjectType = selectedSubjectType || resolvedSubject.subjectType || 'osoba'

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
          if (!v.companyName?.trim()) missingFields.push('Název společnosti')
          if (!v.ic?.trim()) missingFields.push('IČ')
        }

        // Pokud chybí nějaká pole, zobrazit chybu
        if (missingFields.length > 0) {
          const fieldList = missingFields.join(', ')
          toast.showError(`Vyplňte prosím povinná pole: ${fieldList}`)
          return null
        }

        // Mapovat formValue na SaveSubjectInput
        const input: SaveSubjectInput = {
          id: isNewId(resolvedSubject.id) ? 'new' : resolvedSubject.id,
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

          isUser: v.isUser,
          isLandlord: v.isLandlord,
          isLandlordDelegate: v.isLandlordDelegate,
          isTenant: v.isTenant,
          isTenantDelegate: v.isTenantDelegate,
          isMaintenance: v.isMaintenance,
          isMaintenanceDelegate: v.isMaintenanceDelegate,
        }

        const saved = await saveSubject(input)
        logger.log('Subject saved', { id: saved.id })

        toast.showSuccess('Subjekt byl úspěšně uložen')

        // Aktualizovat resolvedSubject s uloženými daty
        const updated: UiSubject = {
          ...resolvedSubject,
          id: saved.id,
          displayName: saved.display_name ?? '',
          email: saved.email,
          phone: saved.phone,
          subjectType: saved.subject_type,
          isArchived: saved.is_archived ?? false,
          createdAt: saved.created_at ?? resolvedSubject.createdAt,

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

          isUser: saved.is_user ?? false,
          isLandlord: saved.is_landlord ?? false,
          isLandlordDelegate: saved.is_landlord_delegate ?? false,
          isTenant: saved.is_tenant ?? false,
          isTenantDelegate: saved.is_tenant_delegate ?? false,
          isMaintenance: saved.is_maintenance ?? false,
          isMaintenanceDelegate: saved.is_maintenance_delegate ?? false,
        }

        setResolvedSubject(updated)
        const newInit = buildInitialFormValue(updated)
        setFormValue(newInit)
        initialSnapshotRef.current = JSON.stringify(newInit)
        firstRenderRef.current = true
        setDirtyAndNotify(false)

        // Callback pro rodiče (SubjectsTile)
        onSaved?.(updated)

        return updated
      } catch (err: any) {
        logger.error('saveSubject failed', err)
        toast.showError(err?.message || 'Nepodařilo se uložit subjekt')
        return null
      }
    })
  }, [formValue, resolvedSubject, selectedSubjectType, toast, onRegisterSubmit, setDirtyAndNotify, onSaved])

  // =====================
  // 5) RENDER
  // =====================

  const readOnly = viewMode === 'read'
  const subjectType = selectedSubjectType || resolvedSubject.subjectType || 'osoba'
  const detailMode: DetailViewMode = readOnly ? 'view' : 'edit'

  const sectionIds: DetailSectionId[] = useMemo(() => ['detail', 'accounts', 'delegates', 'attachments', 'system'], [])

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
          return
        }
      }

      setSelectedSubjectType(newType || null)
      // Aktualizovat resolvedSubject s novým typem
      setResolvedSubject((prev) => ({
        ...prev,
        subjectType: newType || null,
      }))

      // Reset formuláře pro nový typ
      const updatedSubject: UiSubject = {
        ...resolvedSubject,
        subjectType: newType || null,
      }
      const resetFormValue = buildInitialFormValue(updatedSubject)
      setFormValue(resetFormValue)
      initialSnapshotRef.current = JSON.stringify(resetFormValue)
      firstRenderRef.current = true

      // Označit jako dirty (změna typu je změna)
      setDirtyAndNotify(true)
    },
    [selectedSubjectType, resolvedSubject, setDirtyAndNotify]
  )

  const systemBlocks = useMemo(() => {
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
                value={resolvedSubject.id}
                readOnly
              />
            </div>

            <div className="detail-form__field">
              <label className="detail-form__label">Typ subjektu</label>
              {readOnly ? (
                <input
                  className="detail-form__input detail-form__input--readonly"
                  type="text"
                  value={currentSubjectType?.name || resolvedSubject.subjectType || '—'}
                  readOnly
                />
              ) : (
                <select
                  className="detail-form__input"
                  value={selectedSubjectType || resolvedSubject.subjectType || ''}
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
                value={resolvedSubject.createdAt ? formatDateTime(resolvedSubject.createdAt) : '—'}
                readOnly
              />
            </div>

            <div className="detail-form__field">
              <label className="detail-form__label">Archivován</label>
              <input
                className="detail-form__input detail-form__input--readonly"
                type="text"
                value={resolvedSubject.isArchived ? 'Ano' : 'Ne'}
                readOnly
              />
            </div>
          </div>
        ),
        visible: true,
      },
    ]
  }, [resolvedSubject, subjectTypes, selectedSubjectType, readOnly, handleSubjectTypeChange])

  const subjectName = resolvedSubject.displayName || 'Subjekt'

  // Najít název typu subjektu
  const subjectTypeName = useMemo(() => {
    const type = selectedSubjectType || resolvedSubject.subjectType
    if (!type) return null
    const typeMeta = subjectTypes.find((t) => t.code === type)
    return typeMeta?.name || type
  }, [selectedSubjectType, resolvedSubject.subjectType, subjectTypes])

  let title = 'Subjekt'
  if (resolvedSubject.id === 'new' || viewMode === 'create') {
    title = subjectTypeName ? `Nový subjekt - ${subjectTypeName}` : 'Nový subjekt'
  } else if (viewMode === 'edit') {
    title = subjectTypeName ? `Editace subjektu - ${subjectTypeName}: ${subjectName}` : `Editace subjektu: ${subjectName}`
  } else {
    title = subjectTypeName ? `Subjekt - ${subjectTypeName}: ${subjectName}` : `Subjekt: ${subjectName}`
  }

  const detailView = (
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
          entityId: resolvedSubject.id === 'new' ? 'new' : resolvedSubject.id || undefined,
          entityLabel: resolvedSubject.displayName ?? null,
          showSystemEntityHeader: false,
          mode: detailMode,
          sectionCounts: {
            accounts: accountsCount,
            delegates: delegatesCount,
            attachments: attachmentsCount,
          },
          onCreateDelegateFromUser,
          onOpenNewDelegateForm,

          detailContent: (
            <LandlordDetailForm
              key={`form-${resolvedSubject.id}-${subjectType}`}
              subjectType={subjectType}
              landlord={formValue}
              readOnly={readOnly}
              onDirtyChange={(dirty) => {
                if (dirty) {
                  markDirtyIfChanged(formValue)
                } else {
                  computeDirty()
                }
              }}
              onValueChange={(val) => {
                setFormValue(val)
                formValueRef.current = val
                markDirtyIfChanged(val)
              }}
            />
          ),

          systemBlocks,
        } as any
      }
    />
  )

  if (embedded) {
    return detailView
  }

  return (
    <div className="tile-layout">
      <div className="tile-layout__header">
        <h1 className="tile-layout__title">{title}</h1>
      </div>
      <div className="tile-layout__content">{detailView}</div>
    </div>
  )
}
