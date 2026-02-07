'use client'

// FILE: app/modules/040-nemovitost/tiles/CreatePropertyTile.tsx
// PURPOSE: Tile pro vytvoření nové nemovitosti - výběr typu nemovitosti + PropertyDetailFrame
// PATTERN: Stejný jako CreateUnitTile - krásné dlaždice s ikonami a barvami

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { listActiveByCategory, type GenericTypeRow } from '@/app/modules/900-nastaveni/services/genericTypes'
import { getIcon, type IconKey } from '@/app/UI/icons'
import PropertyDetailFrame, { type UiProperty as DetailUiProperty } from '../components/PropertyDetailFrame'
import type { CommonActionId, ViewMode } from '@/app/UI/CommonActions'
import { useToast } from '@/app/UI/Toast'
import createLogger from '@/app/lib/logger'

import '@/app/styles/components/PaletteCard.css'
import '@/app/styles/components/TileLayout.css'

const logger = createLogger('CreatePropertyTile')

// Očekávané typy nemovitostí (podle module.config.js)
const EXPECTED_PROPERTY_TYPES = [
  'rodinny_dum',
  'bytovy_dum',
  'admin_budova',
  'jiny_objekt',
  'pozemek',
  'prumyslovy_objekt',
]

type Props = {
  onRegisterCommonActions?: (actions: CommonActionId[]) => void
  onRegisterCommonActionsState?: (state: { viewMode: ViewMode; hasSelection: boolean; isDirty: boolean }) => void
  onRegisterCommonActionHandler?: (fn: (id: CommonActionId) => void) => void
}

export default function CreatePropertyTile({
  onRegisterCommonActions,
  onRegisterCommonActionsState,
  onRegisterCommonActionHandler,
}: Props) {
  console.log('🎨 CreatePropertyTile: Rendering...')
  const toast = useToast()
  const router = useRouter()
  const [propertyTypes, setPropertyTypes] = useState<GenericTypeRow[]>([])
  const [selectedPropertyType, setSelectedPropertyType] = useState<string | null>(null)
  const [detailProperty, setDetailProperty] = useState<DetailUiProperty | null>(null)
  
  console.log('🎨 CreatePropertyTile: propertyTypes.length =', propertyTypes.length, 'selectedPropertyType =', selectedPropertyType)
  const [isDirty, setIsDirty] = useState(false)
  const [detailInitialSectionId, setDetailInitialSectionId] = useState<any>('detail')

  const submitRef = useRef<null | (() => Promise<DetailUiProperty | null>)>(null)

  // Načíst typy nemovitostí
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        logger.log('🔍 Fetching property types...')
        const types = await listActiveByCategory('property_types')
        logger.log('🔍 Loaded property types:', types.length, types.map(t => t.code))
        if (!mounted) return

        // Filtrovat jen očekávané typy a seřadit podle EXPECTED_PROPERTY_TYPES
        const filtered = EXPECTED_PROPERTY_TYPES.map((code) =>
          types.find((t) => t.code === code)
        ).filter((t): t is GenericTypeRow => !!t)

        logger.log('🔍 Filtered property types:', filtered.length, filtered.map(t => t.code))
        setPropertyTypes(filtered)
      } catch (err: any) {
        logger.error('fetchPropertyTypes failed', err)
        toast.showError('Nepodařilo se načíst typy nemovitostí')
      }
    })()
    return () => {
      mounted = false
    }
  }, [toast])

  // Registrace CommonActions
  useEffect(() => {
    if (!onRegisterCommonActions || !onRegisterCommonActionsState) return
    
    const actions: CommonActionId[] = []
    if (selectedPropertyType) {
      actions.push('save', 'close')
    }
    
    onRegisterCommonActions(actions)
    onRegisterCommonActionsState({
      viewMode: 'create',
      hasSelection: false,
      isDirty,
    })
  }, [selectedPropertyType, isDirty])
  // POZNÁMKA: onRegisterCommonActions a onRegisterCommonActionsState NEJSOU v dependencies!
  // Jsou stabilní (useCallback v AppShell), ale jejich přidání do dependencies způsobuje problémy.

  // CommonActions handler
  useEffect(() => {
    if (!onRegisterCommonActionHandler) return

    onRegisterCommonActionHandler(async (id: CommonActionId) => {
      if (id === 'close') {
        if (isDirty) {
          const ok = confirm('Máš neuložené změny. Opravdu chceš zavřít?')
          if (!ok) return
        }
        // Zavřít tile - přesměrovat na seznam nemovitostí
        router.push('/modules/040-nemovitost?t=properties-list')
        return
      }

      if (id === 'save') {
        if (submitRef.current) {
          const saved = await submitRef.current()
          if (saved) {
            toast.showSuccess('Nemovitost byla úspěšně vytvořena')
            // Přesměrovat na detail nově vytvořené nemovitosti v seznamu nemovitostí
            router.push(`/modules/040-nemovitost?t=properties-list&id=${saved.id}&vm=read`)
          }
        }
        return
      }
    })
  }, [isDirty, router, toast])
  // POZNÁMKA: onRegisterCommonActionHandler není v dependencies (stabilní funkce z AppShell)

  const handleTypeSelect = useCallback(
    (typeCode: string) => {
      const isSame = selectedPropertyType === typeCode
      if (isSame) {
        setSelectedPropertyType(null)
        setDetailProperty(null)
      } else {
        setSelectedPropertyType(typeCode)
        // Najít ID typu podle code
        const type = propertyTypes.find((t) => t.code === typeCode)
        // Vytvořit novou nemovitost s vybraným typem
        const newProperty: DetailUiProperty = {
          id: 'new',
          landlordId: null,
          propertyTypeId: type?.id || null,
          displayName: '',
          internalCode: null,
          street: null,
          houseNumber: null,
          city: null,
          zip: null,
          country: 'CZ',
          region: null,
          landArea: null,
          builtUpArea: null,
          buildingArea: null,
          numberOfFloors: null,
          floorsAboveGround: null,
          floorsBelowGround: null,
          unitsCount: null,
          buildYear: null,
          reconstructionYear: null,
          cadastralArea: null,
          parcelNumber: null,
          lvNumber: null,
          note: null,
          originModule: null,
          isArchived: false,
          createdAt: null,
          updatedAt: null,
        }
        setDetailProperty(newProperty)
        setIsDirty(false)
        setDetailInitialSectionId('detail')
      }
    },
    [selectedPropertyType, propertyTypes]
  )

  // Pokud není vybrán typ nemovitosti, zobrazit výběr typu (6 dlaždic)
  if (!selectedPropertyType || !detailProperty) {
    console.log('🎨 CreatePropertyTile: Rendering type selector. propertyTypes:', propertyTypes.length)
    return (
      <div className="tile-layout">
        <div className="tile-layout__header">
          <h1 className="tile-layout__title">Nová nemovitost</h1>
          <p className="tile-layout__description">Vyberte typ nemovitosti</p>
        </div>
        <div className="tile-layout__content" style={{ padding: '1.5rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
            }}
          >
            {propertyTypes.map((type) => {
              const isSelected = selectedPropertyType === type.code
              const iconKey = (type.icon?.trim() || 'building') as IconKey
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

  // Pokud je vybrán typ, zobrazit PropertyDetailFrame
  return (
    <PropertyDetailFrame
      property={detailProperty}
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
        // Po uložení přesměrovat na detail v seznamu nemovitostí
        router.push(`/modules/040-nemovitost?t=properties-list&id=${saved.id}&vm=read`)
      }}
    />
  )
}
