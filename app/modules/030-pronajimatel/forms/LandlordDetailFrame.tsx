'use client'

// FILE: app/modules/030-pronajimatel/forms/LandlordDetailFrame.tsx
// PURPOSE: Detail view pro pronajimatele (read/edit mode) - bez role/permissions

import React, { useEffect, useMemo, useRef, useState } from 'react'
import DetailView, { type DetailSectionId, type DetailViewMode } from '@/app/UI/DetailView'
import type { ViewMode } from '@/app/UI/CommonActions'

import LandlordDetailForm, { type LandlordFormValue } from './LandlordDetailForm'
import { getLandlordDetail, saveLandlord, type SaveLandlordInput } from '@/app/lib/services/landlords'
import { formatDateTime } from '@/app/lib/formatters/formatDateTime'
import createLogger from '@/app/lib/logger'
import { useToast } from '@/app/UI/Toast'
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
  delegateId?: string | null

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
}

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
    delegateId: (l.delegateId ?? '').toString(),

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
}: Props) {
  // DB truth (subjects)
  const [resolvedLandlord, setResolvedLandlord] = useState<UiLandlord>(landlord)
  const resolveSeqRef = useRef(0)

  // Dirty
  const [_isDirty, setIsDirty] = useState(false)
  const toast = useToast()
  const initialSnapshotRef = useRef<string>('')
  const firstRenderRef = useRef(true)

  const [formValue, setFormValue] = useState<LandlordFormValue>(() => buildInitialFormValue(landlord))

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
      setIsDirty(false)
      onDirtyChange?.(false)
      return
    }

    // read/edit => resolve from Supabase (jen pokud není 'new')
    const subjectId = String(landlord?.id ?? '').trim()
    if (!subjectId || subjectId === 'new') {
      // Nový landlord - použij initial hodnoty
      const init = buildInitialFormValue(landlord)
      setFormValue(init)
      initialSnapshotRef.current = JSON.stringify(init)
      firstRenderRef.current = true
      setIsDirty(false)
      onDirtyChange?.(false)
      return
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
          delegateId: s.delegate_id ?? landlord.delegateId ?? null,

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

        setIsDirty(false)
        onDirtyChange?.(false)
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
  }, [landlord?.id, viewMode, toast, onDirtyChange, logger]) // eslint-disable-line react-hooks/exhaustive-deps

  // =====================
  // 4) ACTION HANDLERS
  // =====================

  const computeDirty = (nextFormSnap?: string) => {
    const formSnap = typeof nextFormSnap === 'string' ? nextFormSnap : JSON.stringify(formValue ?? {})
    const dirty = formSnap !== initialSnapshotRef.current

    setIsDirty(dirty)
    onDirtyChange?.(dirty)
  }

  const markDirtyIfChanged = (nextVal: any) => {
    const snap = JSON.stringify(nextVal ?? {})
    if (firstRenderRef.current) {
      firstRenderRef.current = false
      initialSnapshotRef.current = snap
      setIsDirty(false)
      onDirtyChange?.(false)
      return
    }
    computeDirty(snap)
  }

  // Register save submit
  useEffect(() => {
    if (!onRegisterSubmit) return

    onRegisterSubmit(async () => {
      try {
        const v = formValue ?? buildInitialFormValue(resolvedLandlord)

        if (!v.email?.trim()) {
          toast.showError('E-mail je povinný')
          return null
        }

        const subjectType = resolvedLandlord.subjectType || 'osoba'

        // Mapovat formValue na SaveLandlordInput
        const input: SaveLandlordInput = {
          id: isNewId(resolvedLandlord.id) ? 'new' : resolvedLandlord.id,
          subjectType,

          displayName: v.displayName.trim() || null,
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
          delegateId: v.delegateId.trim() || null,

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
          delegateId: saved.delegate_id ?? null,

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
        setIsDirty(false)
        onDirtyChange?.(false)

        // Callback pro rodiče (LandlordsTile)
        onSaved?.(updated)

        return updated
      } catch (err: any) {
        logger.error('saveLandlord failed', err)
        toast.showError(err?.message || 'Nepodařilo se uložit pronajimatele')
        return null
      }
    })
  }, [formValue, resolvedLandlord, toast, onRegisterSubmit, onDirtyChange, onSaved])

  // =====================
  // 5) RENDER
  // =====================

  const readOnly = viewMode === 'read'
  const subjectType = resolvedLandlord.subjectType || 'osoba'
  const detailMode: DetailViewMode = readOnly ? 'view' : 'edit'

  const sectionIds: DetailSectionId[] = useMemo(() => ['detail', 'accounts', 'attachments', 'system'], [])

  const systemBlocks = useMemo(() => {
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
              <input
                className="detail-form__input detail-form__input--readonly"
                type="text"
                value={resolvedLandlord.subjectType || '—'}
                readOnly
              />
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
  }, [resolvedLandlord])

  const landlordName = resolvedLandlord.displayName || 'Pronajímatel'
  let title = 'Pronajímatel'
  if (resolvedLandlord.id === 'new' || viewMode === 'create') {
    title = 'Nový pronajímatel'
  } else if (viewMode === 'edit') {
    title = `Editace pronajimatele: ${landlordName}`
  } else {
    title = `Pronajímatel: ${landlordName}`
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
          ctx={{
            entityType: 'subjects',
            // Pro create mode nastavit entityId na 'new', aby byly záložky viditelné
            entityId: resolvedLandlord.id === 'new' ? 'new' : resolvedLandlord.id || undefined,
            entityLabel: resolvedLandlord.displayName ?? null,
            showSystemEntityHeader: false,
            mode: detailMode,

            detailContent: (
              <LandlordDetailForm
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
                  markDirtyIfChanged(val)
                }}
              />
            ),

            systemBlocks,
          }}
        />
      </div>
    </div>
  )
}

