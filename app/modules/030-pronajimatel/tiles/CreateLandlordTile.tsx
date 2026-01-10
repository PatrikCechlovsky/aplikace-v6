'use client'

// FILE: app/modules/030-pronajimatel/tiles/CreateLandlordTile.tsx
// PURPOSE: Tile pro vytvoření nového pronajimatele - stejný jako v LandlordsTile (výběr typu subjektu + LandlordDetailFrame)
// POZNÁMKA: Tento tile je nyní jen wrapper, který přesměruje na LandlordsTile s create mode

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { fetchSubjectTypes, type SubjectType } from '@/app/modules/900-nastaveni/services/subjectTypes'
import { getIcon, type IconKey } from '@/app/UI/icons'
import LandlordDetailFrame, { type UiLandlord as DetailUiLandlord } from '../forms/LandlordDetailFrame'
import type { CommonActionId, ViewMode } from '@/app/UI/CommonActions'
import { useToast } from '@/app/UI/Toast'
import createLogger from '@/app/lib/logger'

import '@/app/styles/components/PaletteCard.css'
import '@/app/styles/components/TileLayout.css'

const logger = createLogger('CreateLandlordTile')

// Očekávané typy subjektů pro pronajimatele
const EXPECTED_SUBJECT_TYPES = ['osoba', 'osvc', 'firma', 'spolek', 'statni', 'zastupce']

type Props = {
  onRegisterCommonActions?: (actions: CommonActionId[]) => void
  onRegisterCommonActionsState?: (state: { viewMode: ViewMode; hasSelection: boolean; isDirty: boolean }) => void
  onRegisterCommonActionHandler?: (fn: (id: CommonActionId) => void) => void
}

export default function CreateLandlordTile({
  onRegisterCommonActions,
  onRegisterCommonActionsState,
  onRegisterCommonActionHandler,
}: Props) {
  const toast = useToast()
  const router = useRouter()
  const [subjectTypes, setSubjectTypes] = useState<SubjectType[]>([])
  const [selectedSubjectType, setSelectedSubjectType] = useState<string | null>(null)
  const [detailLandlord, setDetailLandlord] = useState<DetailUiLandlord | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [detailInitialSectionId, setDetailInitialSectionId] = useState<any>('detail')

  const submitRef = useRef<null | (() => Promise<DetailUiLandlord | null>)>(null)

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
    const actions: CommonActionId[] = []
    if (!selectedSubjectType) {
      // Pokud není vybrán typ, žádné akce
    } else {
      // Pokud je vybrán typ, zobrazit save a close (stejně jako v LandlordsTile)
      actions.push('save', 'close')
    }
    onRegisterCommonActions?.(actions)
    onRegisterCommonActionsState?.({
      viewMode: 'create',
      hasSelection: false,
      isDirty,
    })
  }, [selectedSubjectType, isDirty, onRegisterCommonActions, onRegisterCommonActionsState])

  // CommonActions handler
  useEffect(() => {
    if (!onRegisterCommonActionHandler) return

    onRegisterCommonActionHandler(async (id: CommonActionId) => {
      if (id === 'close') {
        if (isDirty) {
          const ok = confirm('Máš neuložené změny. Opravdu chceš zavřít?')
          if (!ok) return
        }
        // Zavřít tile - přesměrovat na seznam pronajímatelů
        router.push('/modules/030-pronajimatel?t=landlords-list')
        return
      }

      if (id === 'save') {
        if (submitRef.current) {
          const saved = await submitRef.current()
          if (saved) {
            toast.showSuccess('Pronajímatel byl úspěšně vytvořen')
            // Přesměrovat na detail nově vytvořeného pronajimatele v seznamu pronajímatelů
            router.push(`/modules/030-pronajimatel?t=landlords-list&id=${saved.id}&vm=read`)
          }
        }
        return
      }
    })
  }, [onRegisterCommonActionHandler, isDirty, router, toast])

  const handleTypeSelect = useCallback(
    (typeCode: string) => {
      const isSame = selectedSubjectType === typeCode
      if (isSame) {
        setSelectedSubjectType(null)
        setDetailLandlord(null)
      } else {
        setSelectedSubjectType(typeCode)
        // Vytvořit nový landlord s vybraným typem
        const newLandlord: DetailUiLandlord = {
          id: 'new',
          displayName: '',
          email: null,
          phone: null,
          subjectType: typeCode,
          isArchived: false,
          createdAt: '',
          titleBefore: null,
          firstName: null,
          lastName: null,
          note: null,
          birthDate: null,
          personalIdNumber: null,
          idDocType: null,
          idDocNumber: null,
          companyName: null,
          ic: null,
          dic: null,
          icValid: null,
          dicValid: null,
          delegateId: null,
          street: null,
          city: null,
          zip: null,
          houseNumber: null,
          country: 'CZ',
        }
        setDetailLandlord(newLandlord)
        setIsDirty(false)
        setDetailInitialSectionId('detail')
      }
    },
    [selectedSubjectType]
  )

  // Pokud není vybrán typ subjektu, zobrazit výběr typu (6 dlaždic)
  if (!selectedSubjectType || !detailLandlord) {
    return (
      <div className="tile-layout">
        <div className="tile-layout__header">
          <h1 className="tile-layout__title">Nový pronajímatel</h1>
          <p className="tile-layout__description">Vyberte typ subjektu pro vytvoření nového pronajimatele</p>
        </div>
        <div className="tile-layout__content" style={{ padding: '1.5rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
            }}
          >
            {subjectTypes.map((type) => {
              const isSelected = selectedSubjectType === type.code
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
        </div>
      </div>
    )
  }

  // Pokud je vybrán typ, zobrazit LandlordDetailFrame (stejný jako v LandlordsTile)
  return (
    <LandlordDetailFrame
      landlord={detailLandlord}
      viewMode="create"
      initialSectionId={detailInitialSectionId}
      onActiveSectionChange={(id) => {
        setDetailInitialSectionId(id)
      }}
      onRegisterSubmit={(fn) => {
        submitRef.current = fn
      }}
      onDirtyChange={setIsDirty}
      onSaved={(saved) => {
        // Po uložení přesměrovat na detail v seznamu pronajímatelů
        router.push(`/modules/030-pronajimatel?t=landlords-list&id=${saved.id}&vm=read`)
      }}
    />
  )
}
