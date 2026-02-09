'use client'

// FILE: app/modules/800-subjekty/tiles/CreateSubjectTile.tsx
// PURPOSE: Tile pro vytvoření nového subjektu - výběr typu + SubjectDetailFrame
// NOTES: Wrapper, který přesměruje na SubjectsTile s create mode

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { fetchSubjectTypes, type SubjectType } from '@/app/modules/900-nastaveni/services/subjectTypes'
import { getIcon, type IconKey } from '@/app/UI/icons'
import SubjectDetailFrame, { type UiSubject as DetailUiSubject } from '../forms/SubjectDetailFrame'
import type { CommonActionId, ViewMode } from '@/app/UI/CommonActions'
import { useToast } from '@/app/UI/Toast'
import createLogger from '@/app/lib/logger'

import '@/app/styles/components/PaletteCard.css'
import '@/app/styles/components/TileLayout.css'

const logger = createLogger('CreateSubjectTile')

// Očekávané typy subjektů
const EXPECTED_SUBJECT_TYPES = ['osoba', 'osvc', 'firma', 'spolek', 'statni', 'zastupce']

type Props = {
  onRegisterCommonActions?: (actions: CommonActionId[]) => void
  onRegisterCommonActionsState?: (state: { viewMode: ViewMode; hasSelection: boolean; isDirty: boolean }) => void
  onRegisterCommonActionHandler?: (fn: (id: CommonActionId) => void) => void
}

export default function CreateSubjectTile({
  onRegisterCommonActions,
  onRegisterCommonActionsState,
  onRegisterCommonActionHandler,
}: Props) {
  const toast = useToast()
  const router = useRouter()
  const [subjectTypes, setSubjectTypes] = useState<SubjectType[]>([])
  const [selectedSubjectType, setSelectedSubjectType] = useState<string | null>(null)
  const [detailSubject, setDetailSubject] = useState<DetailUiSubject | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [detailInitialSectionId, setDetailInitialSectionId] = useState<any>('detail')

  const submitRef = useRef<null | (() => Promise<DetailUiSubject | null>)>(null)

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
      // Pokud je vybrán typ, zobrazit save a close
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
        router.push('/modules/800-subjekty?t=subjects-list')
        return
      }

      if (id === 'save') {
        if (submitRef.current) {
          const saved = await submitRef.current()
          if (saved) {
            toast.showSuccess('Subjekt byl úspěšně vytvořen')
            router.push(`/modules/800-subjekty?t=subjects-list&id=${saved.id}&vm=read`)
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
        setDetailSubject(null)
      } else {
        setSelectedSubjectType(typeCode)
        const newSubject: DetailUiSubject = {
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
          delegateIds: [],
          street: null,
          city: null,
          zip: null,
          houseNumber: null,
          country: 'CZ',
          isUser: false,
          isLandlord: false,
          isLandlordDelegate: false,
          isTenant: false,
          isTenantDelegate: false,
          isMaintenance: false,
          isMaintenanceDelegate: false,
        }
        setDetailSubject(newSubject)
        setIsDirty(false)
        setDetailInitialSectionId('detail')
      }
    },
    [selectedSubjectType]
  )

  // Pokud není vybrán typ subjektu, zobrazit výběr typu (6 dlaždic)
  if (!selectedSubjectType || !detailSubject) {
    return (
      <div className="tile-layout">
        <div className="tile-layout__header">
          <h1 className="tile-layout__title">Nový subjekt</h1>
          <p className="tile-layout__description">Vyberte typ subjektu pro vytvoření nového subjektu</p>
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

  // Pokud je vybrán typ, zobrazit SubjectDetailFrame
  return (
    <SubjectDetailFrame
      subject={detailSubject}
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
        setDetailSubject(saved)
      }}
    />
  )
}
