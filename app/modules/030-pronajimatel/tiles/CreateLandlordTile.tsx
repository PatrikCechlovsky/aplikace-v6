'use client'

// FILE: app/modules/030-pronajimatel/tiles/CreateLandlordTile.tsx
// PURPOSE: Tile pro vytvoření nového pronajimatele - zobrazí 6 dlaždic podle typů subjektů a formulář pod vybranou dlaždicí

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { fetchSubjectTypes, type SubjectType } from '@/app/modules/900-nastaveni/services/subjectTypes'
import { getIcon, type IconKey } from '@/app/UI/icons'
import { saveLandlord, type SaveLandlordInput } from '@/app/lib/services/landlords'
import { useToast } from '@/app/UI/Toast'
import createLogger from '@/app/lib/logger'
import TileLayout from '@/app/UI/TileLayout'
import LandlordDetailForm, { type LandlordFormValue } from '../forms/LandlordDetailForm'
import '@/app/styles/components/PaletteCard.css'
import '@/app/styles/components/TileLayout.css'
import '@/app/styles/components/DetailForm.css'

const logger = createLogger('CreateLandlordTile')

// Očekávané typy subjektů pro pronajimatele
const EXPECTED_SUBJECT_TYPES = ['osoba', 'osvc', 'firma', 'spolek', 'statni', 'zastupce']

type CommonActionId = 'save' | 'cancel' | 'new' | 'delete' | 'archive'

type Props = {
  onRegisterCommonActions?: (actions: CommonActionId[]) => void
  onRegisterCommonActionsState?: (state: { isDirty: boolean; viewMode: 'list' | 'edit' | 'create' }) => void
  onRegisterCommonActionHandler?: (handler: (id: CommonActionId) => void) => void
}

export default function CreateLandlordTile({
  onRegisterCommonActions,
  onRegisterCommonActionsState,
  onRegisterCommonActionHandler,
}: Props) {
  const toast = useToast()
  const router = useRouter()
  const [subjectTypes, setSubjectTypes] = useState<SubjectType[]>([])
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [formDirty, setFormDirty] = useState(false)
  const [formValue, setFormValue] = useState<LandlordFormValue | null>(null)
  const savingRef = useRef(false)

  // Načíst typy subjektů
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const types = await fetchSubjectTypes()
        if (!mounted) return

        // Filtrovat jen očekávané typy a seřadit podle EXPECTED_SUBJECT_TYPES
        const filtered = EXPECTED_SUBJECT_TYPES.map((code) =>
          types.find((t) => t.code === code)
        ).filter((t): t is SubjectType => !!t && (t.active ?? true))

        setSubjectTypes(filtered)
      } catch (err: any) {
        logger.error('fetchSubjectTypes failed', err)
        toast.showError('Nepodařilo se načíst typy subjektů')
      }
    })()
    return () => {
      mounted = false
    }
  }, [toast])

  // Registrace CommonActions
  useEffect(() => {
    const actions: CommonActionId[] = selectedType ? ['save', 'cancel'] : []
    onRegisterCommonActions?.(actions)
    onRegisterCommonActionsState?.({ isDirty: formDirty, viewMode: 'create' })
  }, [formDirty, selectedType, onRegisterCommonActions, onRegisterCommonActionsState])

  useEffect(() => {
    onRegisterCommonActionHandler?.(async (id: CommonActionId) => {
      if (id === 'save' && selectedType && formValue) {
        if (savingRef.current) return
        savingRef.current = true
        setLoading(true)

        try {
          // Mapovat formValue na SaveLandlordInput
          const input: SaveLandlordInput = {
            id: 'new', // nový záznam
            subjectType: selectedType,

            displayName: formValue.displayName.trim() || null,
            email: formValue.email.trim() || null,
            phone: formValue.phone.trim() || null,
            isArchived: formValue.isArchived,

            // Person fields
            titleBefore: formValue.titleBefore.trim() || null,
            firstName: formValue.firstName.trim() || null,
            lastName: formValue.lastName.trim() || null,
            note: formValue.note.trim() || null,

            // Personal identification
            birthDate: formValue.birthDate.trim() || null,
            personalIdNumber: formValue.personalIdNumber.trim() || null,
            idDocType: formValue.idDocType.trim() || null,
            idDocNumber: formValue.idDocNumber.trim() || null,

            // Company fields
            companyName: formValue.companyName.trim() || null,
            ic: formValue.ic.trim() || null,
            dic: formValue.dic.trim() || null,
            icValid: formValue.icValid,
            dicValid: formValue.dicValid,
            delegateId: formValue.delegateId.trim() || null,

            // Address
            street: formValue.street.trim() || null,
            city: formValue.city.trim() || null,
            zip: formValue.zip.trim() || null,
            houseNumber: formValue.houseNumber.trim() || null,
            country: formValue.country.trim() || null,
            ruianAddressId: null,
            ruianValidated: false,
            addressSource: null,
          }

          const saved = await saveLandlord(input)
          logger.log('Landlord saved', { id: saved.id })

          toast.showSuccess('Pronajímatel byl úspěšně vytvořen')

          // Přesměrovat na detail nově vytvořeného pronajimatele
          // TODO: Aktualizovat URL na detail (bude implementováno v LandlordsTile)
          router.push(`/modules/030-pronajimatel?t=landlords-list&id=${saved.id}&vm=read`)

          // Reset formuláře
          setSelectedType(null)
          setFormDirty(false)
          setFormValue(null)
        } catch (err: any) {
          logger.error('saveLandlord failed', err)
          toast.showError(err?.message || 'Nepodařilo se uložit pronajimatele')
        } finally {
          setLoading(false)
          savingRef.current = false
        }
      }
      if (id === 'cancel') {
        setSelectedType(null)
        setFormDirty(false)
        setFormValue(null)
      }
    })
  }, [selectedType, formValue, toast, router, onRegisterCommonActionHandler])

  const handleTypeSelect = useCallback((typeCode: string) => {
    const isSame = selectedType === typeCode
    setSelectedType(isSame ? null : typeCode)
    setFormDirty(false)
    // Inicializovat prázdný formulář pro nový typ
    if (!isSame && typeCode) {
      const emptyForm: LandlordFormValue = {
        displayName: '',
        email: '',
        phone: '',
        note: '',
        isArchived: false,
        street: '',
        city: '',
        zip: '',
        houseNumber: '',
        country: 'CZ',
        titleBefore: '',
        firstName: '',
        lastName: '',
        birthDate: '',
        personalIdNumber: '',
        idDocType: '',
        idDocNumber: '',
        companyName: '',
        ic: '',
        dic: '',
        icValid: false,
        dicValid: false,
        delegateId: '',
      }
      setFormValue(emptyForm)
    } else {
      setFormValue(null)
    }
  }, [selectedType])

  const handleFormValueChange = useCallback((val: LandlordFormValue) => {
    setFormValue(val)
  }, [])

  return (
    <TileLayout
      title="Přidat pronajimatele"
      description="Vyberte typ subjektu pro vytvoření nového pronajimatele"
    >
      <div style={{ padding: '1.5rem' }}>
        {/* Grid dlaždic podle typů subjektů */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: selectedType ? '2rem' : '0',
          }}
        >
          {subjectTypes.map((type) => {
            const isSelected = selectedType === type.code
            const iconKey = (type.icon?.trim() || 'home') as IconKey
            const icon = getIcon(iconKey)
            const color = type.color?.trim() || '#666666'

            return (
              <button
                key={type.code}
                type="button"
                className={`palette-card ${isSelected ? 'palette-card--active' : ''}`}
                onClick={() => handleTypeSelect(type.code)}
                style={{
                  backgroundColor: isSelected ? color : 'var(--color-surface-subtle)',
                  borderColor: color,
                  borderWidth: '2px',
                  borderStyle: 'solid',
                  padding: '1.5rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.5rem',
                  }}
                >
                  <span style={{ fontSize: '2rem' }}>{icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{type.name}</div>
                    {type.description && (
                      <div style={{ fontSize: '0.875rem', opacity: 0.8, marginTop: '0.25rem' }}>
                        {type.description}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Formulář pod vybranou dlaždicí */}
        {selectedType && (
          <div
            style={{
              marginTop: '2rem',
              padding: '1.5rem',
              backgroundColor: 'var(--color-surface)',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
            }}
          >
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 600 }}>
              Formulář pro typ: {subjectTypes.find((t) => t.code === selectedType)?.name}
            </h3>

            {loading && (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                Ukládání...
              </div>
            )}

            {!loading && formValue && (
              <LandlordDetailForm
                subjectType={selectedType}
                landlord={formValue}
                readOnly={false}
                onDirtyChange={setFormDirty}
                onValueChange={handleFormValueChange}
              />
            )}
          </div>
        )}
      </div>
    </TileLayout>
  )
}

