'use client'

// FILE: app/modules/030-pronajimatel/forms/LandlordDetailFrame.tsx
// PURPOSE: Detail view pro pronajimatele (read/edit mode) - bez role/permissions

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import DetailView, { type DetailSectionId, type DetailViewMode } from '@/app/UI/DetailView'
import type { ViewMode } from '@/app/UI/CommonActions'

import LandlordDetailForm, { type LandlordFormValue } from './LandlordDetailForm'
import { getLandlordDetail, saveLandlord, type SaveLandlordInput } from '@/app/lib/services/landlords'
import { getUserDetail } from '@/app/lib/services/users'
import { formatDateTime } from '@/app/lib/formatters/formatDateTime'
import createLogger from '@/app/lib/logger'
import { useToast } from '@/app/UI/Toast'
import { fetchSubjectTypes, type SubjectType } from '@/app/modules/900-nastaveni/services/subjectTypes'
import '@/app/styles/components/TileLayout.css'
import '@/app/styles/components/DetailForm.css'

const logger = createLogger('LandlordDetailFrame')

// =====================
// 1) TYPES
// =====================

export type UiLandlord = {
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
}

type Props = {
  landlord: UiLandlord
  viewMode: ViewMode
  initialSectionId?: DetailSectionId
  onActiveSectionChange?: (id: DetailSectionId) => void
  onRegisterSubmit?: (fn: () => Promise<UiLandlord | null>) => void
  onDirtyChange?: (dirty: boolean) => void
  onSaved?: (landlord: UiLandlord) => void // Callback po uložení
  onCreateDelegateFromUser?: (userId: string) => void // Callback pro vytvoření zástupce z uživatele
  onOpenNewDelegateForm?: (type: string, fromUserId?: string) => void // Callback pro otevření formuláře nového zástupce
}

// Očekávané typy subjektů pro pronajimatele
const EXPECTED_SUBJECT_TYPES = ['osoba', 'osvc', 'firma', 'spolek', 'statni', 'zastupce']

// =====================
// 2) HELPERS
// =====================

function buildInitialFormValue(l: UiLandlord): LandlordFormValue {
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

export default function LandlordDetailFrame({
  landlord,
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
  const [resolvedLandlord, setResolvedLandlord] = useState<UiLandlord>(landlord)
  const resolveSeqRef = useRef(0)
  const searchParams = useSearchParams()

  // Subject types pro změnu typu v edit mode
  const [subjectTypes, setSubjectTypes] = useState<SubjectType[]>([])
  const [selectedSubjectType, setSelectedSubjectType] = useState<string | null>(landlord.subjectType || null)

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

  const [formValue, setFormValue] = useState<LandlordFormValue>(() => buildInitialFormValue(landlord))
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

  // Aktualizovat selectedSubjectType když se změní resolvedLandlord.subjectType (při načtení dat)
  useEffect(() => {
    if (resolvedLandlord.subjectType && resolvedLandlord.subjectType !== selectedSubjectType) {
      setSelectedSubjectType(resolvedLandlord.subjectType)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedLandlord.id, resolvedLandlord.subjectType]) // Aktualizovat když se změní ID nebo subjectType

  // Aktualizovat formValue když se změní landlord prop (např. při výběru typu subjektu)
  useEffect(() => {
    if (viewMode === 'create' || isNewId(landlord?.id)) {
      const init = buildInitialFormValue(landlord)
      setFormValue(init)
      initialSnapshotRef.current = JSON.stringify(init)
      firstRenderRef.current = true
      setDirtyAndNotify(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [landlord?.subjectType, viewMode]) // Aktualizovat když se změní subjectType nebo viewMode

  // Resolve DB truth on open / landlord change
  useEffect(() => {
    // fast: show whatever we already have
    setResolvedLandlord(landlord)

    // create/new => no DB resolve
    if (viewMode === 'create' || isNewId(landlord?.id)) {
      const init = buildInitialFormValue(landlord)
      setFormValue(init)
      initialSnapshotRef.current = JSON.stringify(init)
      firstRenderRef.current = true
      setDirtyAndNotify(false)
      return
    }

    // read/edit => resolve from Supabase (jen pokud není 'new')
    const subjectId = String(landlord?.id ?? '').trim()
    if (!subjectId || subjectId === 'new') {
      // Nový landlord - zkontrolovat, jestli máme fromUserId pro předvyplnění dat uživatele
      const fromUserId = searchParams?.get('fromUserId')?.trim() ?? null
      const typeFromUrl = searchParams?.get('type')?.trim() ?? null
      const subjectType = landlord.subjectType || typeFromUrl // Použít type z URL pokud není v landlord
      if (fromUserId && subjectType === 'zastupce') {
        // Načíst data uživatele a předvyplnit formulář
        const mySeq = ++resolveSeqRef.current
        let mounted = true

        ;(async () => {
          try {
            logger.log('LandlordDetailFrame: loading user data for delegate', { fromUserId })
            const userDetail = await getUserDetail(fromUserId)
            if (!mounted) return
            if (mySeq !== resolveSeqRef.current) return

            const s = userDetail.subject
            logger.log('LandlordDetailFrame: user data loaded', { userDetail: s })

            // Předvyplnit formulář daty uživatele
            const presetLandlord: UiLandlord = {
              ...landlord,
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

            setResolvedLandlord(presetLandlord)
            const init = buildInitialFormValue(presetLandlord)
            setFormValue(init)
            initialSnapshotRef.current = JSON.stringify(init)
            firstRenderRef.current = true
            setDirtyAndNotify(false)
          } catch (e: any) {
            if (!mounted) return
            logger.error('getUserDetail failed', { fromUserId, error: e, message: e?.message, code: e?.code })
            toast.showError(e?.message || 'Nepodařilo se načíst data uživatele')
            // Použít standardní inicializaci
            const init = buildInitialFormValue(landlord)
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
        // Nový landlord bez fromUserId - použij initial hodnoty
        const init = buildInitialFormValue(landlord)
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
        logger.log('LandlordDetailFrame: loading detail', { subjectId, viewMode })
        const detail = await getLandlordDetail(subjectId)
        if (!mounted) return
        if (mySeq !== resolveSeqRef.current) return

        const s: any = detail ?? {}
        logger.log('LandlordDetailFrame: detail loaded', { detail: s })

        const nextLandlord: UiLandlord = {
          ...landlord,
          id: String(s.id ?? subjectId),
          displayName: String(s.display_name ?? landlord.displayName ?? ''),
          email: s.email ?? landlord.email ?? null,
          phone: s.phone ?? landlord.phone ?? null,
          subjectType: s.subject_type ?? landlord.subjectType ?? null,
          isArchived: !!(s.is_archived ?? landlord.isArchived),
          createdAt: String(s.created_at ?? landlord.createdAt ?? ''),

          titleBefore: s.title_before ?? landlord.titleBefore ?? null,
          firstName: s.first_name ?? landlord.firstName ?? null,
          lastName: s.last_name ?? landlord.lastName ?? null,
          note: s.note ?? landlord.note ?? null,

          birthDate: s.birth_date ?? landlord.birthDate ?? null,
          personalIdNumber: s.personal_id_number ?? landlord.personalIdNumber ?? null,
          idDocType: s.id_doc_type ?? landlord.idDocType ?? null,
          idDocNumber: s.id_doc_number ?? landlord.idDocNumber ?? null,

          companyName: s.company_name ?? landlord.companyName ?? null,
          ic: s.ic ?? landlord.ic ?? null,
          dic: s.dic ?? landlord.dic ?? null,
          icValid: s.ic_valid ?? landlord.icValid ?? null,
          dicValid: s.dic_valid ?? landlord.dicValid ?? null,
          delegateIds: (s as any).delegateIds ?? landlord.delegateIds ?? [],

          street: s.street ?? landlord.street ?? null,
          city: s.city ?? landlord.city ?? null,
          zip: s.zip ?? landlord.zip ?? null,
          houseNumber: s.house_number ?? landlord.houseNumber ?? null,
          country: s.country ?? landlord.country ?? 'CZ',
        }

        setResolvedLandlord(nextLandlord)

        const init = buildInitialFormValue(nextLandlord)
        setFormValue(init)
        initialSnapshotRef.current = JSON.stringify(init)
        firstRenderRef.current = true
        setDirtyAndNotify(false)
      } catch (e: any) {
        if (!mounted) return
        logger.error('getLandlordDetail failed', { subjectId, error: e, message: e?.message, code: e?.code })
        toast.showError(e?.message || 'Nepodařilo se načíst detail pronajimatele')
        // Necháme landlord z prop, aby se formulář alespoň zobrazil
      }
    })()

    return () => {
      mounted = false
    }
  }, [landlord?.id, landlord?.subjectType, viewMode, toast, onDirtyChange, logger]) // eslint-disable-line react-hooks/exhaustive-deps

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
        const v = formValueRef.current ?? buildInitialFormValue(resolvedLandlord)
        
        console.log('[LandlordDetailFrame] Validating form values:', v)

        // Použít změněný subjectType pokud je v edit mode, jinak použít z resolvedLandlord
        const subjectType = selectedSubjectType || resolvedLandlord.subjectType || 'osoba'
        console.log('[LandlordDetailFrame] Subject type:', subjectType)
        
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
          console.log('[LandlordDetailFrame] Checking company fields:', {
            companyName: v.companyName,
            ic: v.ic
          })
          if (!v.companyName?.trim()) missingFields.push('Název společnosti')
          if (!v.ic?.trim()) missingFields.push('IČ')
        }

        console.log('[LandlordDetailFrame] Missing fields:', missingFields)

        // Pokud chybí nějaká pole, zobrazit chybu
        if (missingFields.length > 0) {
          const fieldList = missingFields.join(', ')
          toast.showError(`Vyplňte prosím povinná pole: ${fieldList}`)
          return null
        }

        // Mapovat formValue na SaveLandlordInput
        const input: SaveLandlordInput = {
          id: isNewId(resolvedLandlord.id) ? 'new' : resolvedLandlord.id,
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

        const saved = await saveLandlord(input)
        logger.log('Landlord saved', { id: saved.id })

        toast.showSuccess('Pronajímatel byl úspěšně uložen')

        // Aktualizovat resolvedLandlord s uloženými daty
        const updated: UiLandlord = {
          ...resolvedLandlord,
          id: saved.id,
          displayName: saved.display_name ?? '',
          email: saved.email,
          phone: saved.phone,
          subjectType: saved.subject_type,
          isArchived: saved.is_archived ?? false,
          createdAt: saved.created_at ?? resolvedLandlord.createdAt,

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

        setResolvedLandlord(updated)
        const newInit = buildInitialFormValue(updated)
        setFormValue(newInit)
        initialSnapshotRef.current = JSON.stringify(newInit)
        firstRenderRef.current = true
        setDirtyAndNotify(false)

        // Callback pro rodiče (LandlordsTile)
        onSaved?.(updated)

        return updated
      } catch (err: any) {
        logger.error('saveLandlord failed', err)
        toast.showError(err?.message || 'Nepodařilo se uložit pronajimatele')
        return null
      }
    })
  }, [formValue, resolvedLandlord, selectedSubjectType, toast, onRegisterSubmit, setDirtyAndNotify, onSaved])

  // =====================
  // 5) RENDER
  // =====================

  const readOnly = viewMode === 'read'
  const subjectType = selectedSubjectType || resolvedLandlord.subjectType || 'osoba'
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
          // Vrátit původní hodnotu - musím použít setSelectedSubjectType, protože e.target.value se nedá jednoduše resetovat
          return
        }
      }

      setSelectedSubjectType(newType || null)
      // Aktualizovat resolvedLandlord s novým typem
      setResolvedLandlord((prev) => ({
        ...prev,
        subjectType: newType || null,
      }))

      // Reset formuláře pro nový typ - znovu inicializovat formValue podle nového typu
      // Key prop na LandlordDetailForm způsobí remount, ale formValue musí být také aktualizován
      const updatedLandlord: UiLandlord = {
        ...resolvedLandlord,
        subjectType: newType || null,
      }
      const resetFormValue = buildInitialFormValue(updatedLandlord)
      setFormValue(resetFormValue)
      initialSnapshotRef.current = JSON.stringify(resetFormValue)
      firstRenderRef.current = true

      // Označit jako dirty (změna typu je změna)
      setDirtyAndNotify(true)
    },
    [selectedSubjectType, resolvedLandlord, setDirtyAndNotify]
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
                value={resolvedLandlord.id}
                readOnly
              />
            </div>

            <div className="detail-form__field">
              <label className="detail-form__label">Typ subjektu</label>
              {readOnly ? (
                <input
                  className="detail-form__input detail-form__input--readonly"
                  type="text"
                  value={currentSubjectType?.name || resolvedLandlord.subjectType || '—'}
                  readOnly
                />
              ) : (
                <select
                  className="detail-form__input"
                  value={selectedSubjectType || resolvedLandlord.subjectType || ''}
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
                value={resolvedLandlord.createdAt ? formatDateTime(resolvedLandlord.createdAt) : '—'}
                readOnly
              />
            </div>

            <div className="detail-form__field">
              <label className="detail-form__label">Archivován</label>
              <input
                className="detail-form__input detail-form__input--readonly"
                type="text"
                value={resolvedLandlord.isArchived ? 'Ano' : 'Ne'}
                readOnly
              />
            </div>
          </div>
        ),
        visible: true,
      },
    ]
  }, [resolvedLandlord, subjectTypes, selectedSubjectType, readOnly, handleSubjectTypeChange])

  const landlordName = resolvedLandlord.displayName || 'Pronajímatel'
  
  // Najít název typu subjektu
  const subjectTypeName = useMemo(() => {
    const type = selectedSubjectType || resolvedLandlord.subjectType
    if (!type) return null
    const typeMeta = subjectTypes.find((t) => t.code === type)
    return typeMeta?.name || type
  }, [selectedSubjectType, resolvedLandlord.subjectType, subjectTypes])
  
  let title = 'Pronajímatel'
  if (resolvedLandlord.id === 'new' || viewMode === 'create') {
    title = subjectTypeName ? `Nový pronajímatel - ${subjectTypeName}` : 'Nový pronajímatel'
  } else if (viewMode === 'edit') {
    title = subjectTypeName ? `Editace pronajimatele - ${subjectTypeName}: ${landlordName}` : `Editace pronajimatele: ${landlordName}`
  } else {
    title = subjectTypeName ? `Pronajímatel - ${subjectTypeName}: ${landlordName}` : `Pronajímatel: ${landlordName}`
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
              entityId: resolvedLandlord.id === 'new' ? 'new' : resolvedLandlord.id || undefined,
              entityLabel: resolvedLandlord.displayName ?? null,
              showSystemEntityHeader: false,
              mode: detailMode,
                  onCreateDelegateFromUser, // Předat do DelegatesSection přes ctx
                  onOpenNewDelegateForm, // Předat do DelegatesSection přes ctx

              detailContent: (
                <LandlordDetailForm
                  key={`form-${resolvedLandlord.id}-${subjectType}`}
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
                    console.log('[LandlordDetailFrame] onValueChange called with:', val)
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

