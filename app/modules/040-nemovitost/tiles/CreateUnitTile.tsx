'use client'

// FILE: app/modules/040-nemovitost/tiles/CreateUnitTile.tsx
// PURPOSE: Tile pro vytvoření nové jednotky - výběr typu jednotky + UnitDetailFrame
// PATTERN: Stejný jako CreateLandlordTile - krásné dlaždice s ikonami a barvami

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { listActiveByCategory, type GenericTypeRow } from '@/app/modules/900-nastaveni/services/genericTypes'
import { getIcon, type IconKey } from '@/app/UI/icons'
import UnitDetailFrame, { type UiUnit as DetailUiUnit } from '../components/UnitDetailFrame'
import type { CommonActionId, ViewMode } from '@/app/UI/CommonActions'
import { useToast } from '@/app/UI/Toast'
import createLogger from '@/app/lib/logger'

import '@/app/styles/components/PaletteCard.css'
import '@/app/styles/components/TileLayout.css'

const logger = createLogger('CreateUnitTile')

// Očekávané typy jednotek (podle module.config.js)
const EXPECTED_UNIT_TYPES = [
  'byt',
  'kancelar',
  'obchod',
  'puda',
  'sklep',
  'garaz',
  'sklad',
  'zahrada',
  'jina_jednotka',
]

type Props = {
  onRegisterCommonActions?: (actions: CommonActionId[]) => void
  onRegisterCommonActionsState?: (state: { viewMode: ViewMode; hasSelection: boolean; isDirty: boolean }) => void
  onRegisterCommonActionHandler?: (fn: (id: CommonActionId) => void) => void
}

export default function CreateUnitTile({
  onRegisterCommonActions,
  onRegisterCommonActionsState,
  onRegisterCommonActionHandler,
}: Props) {
  const toast = useToast()
  const router = useRouter()
  const [unitTypes, setUnitTypes] = useState<GenericTypeRow[]>([])
  const [selectedUnitType, setSelectedUnitType] = useState<string | null>(null)
  const [detailUnit, setDetailUnit] = useState<DetailUiUnit | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [detailInitialSectionId, setDetailInitialSectionId] = useState<any>('detail')

  const submitRef = useRef<null | (() => Promise<DetailUiUnit | null>)>(null)

  // Načíst typy jednotek
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const types = await listActiveByCategory('unit_types')
        if (!mounted) return

        // Filtrovat jen očekávané typy a seřadit podle EXPECTED_UNIT_TYPES
        const filtered = EXPECTED_UNIT_TYPES.map((code) =>
          types.find((t) => t.code === code)
        ).filter((t): t is GenericTypeRow => !!t)

        setUnitTypes(filtered)
      } catch (err: any) {
        logger.error('fetchUnitTypes failed', err)
        toast.showError('Nepodařilo se načíst typy jednotek')
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
    if (selectedUnitType) {
      actions.push('save', 'close')
    }
    
    onRegisterCommonActions(actions)
    onRegisterCommonActionsState({
      viewMode: 'create',
      hasSelection: false,
      isDirty,
    })
  }, [selectedUnitType, isDirty])
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
        // Zavřít tile - přesměrovat na seznam jednotek
        router.push('/modules/040-nemovitost?t=units-list')
        return
      }

      if (id === 'save') {
        if (submitRef.current) {
          const saved = await submitRef.current()
          if (saved) {
            toast.showSuccess('Jednotka byla úspěšně vytvořena')
            // Přesměrovat na detail nově vytvořené jednotky v seznamu jednotek
            router.push(`/modules/040-nemovitost?t=units-list&id=${saved.id}&vm=read`)
          }
        }
        return
      }
    })
  }, [isDirty, router, toast])
  // POZNÁMKA: onRegisterCommonActionHandler není v dependencies (stabilní funkce z AppShell)

  const handleTypeSelect = useCallback(
    (typeCode: string) => {
      const isSame = selectedUnitType === typeCode
      if (isSame) {
        setSelectedUnitType(null)
        setDetailUnit(null)
      } else {
        setSelectedUnitType(typeCode)
        // Najít ID typu podle code
        const type = unitTypes.find((t) => t.code === typeCode)
        // Vytvořit novou jednotku s vybraným typem
        const newUnit: DetailUiUnit = {
          id: 'new',
          propertyId: null,
          unitTypeId: type?.id || null,
          displayName: '',
          internalCode: null,
          floor: null,
          doorNumber: null,
          area: null,
          rooms: null,
          status: 'available',
          street: null,
          houseNumber: null,
          city: null,
          zip: null,
          country: 'CZ',
          region: null,
          note: null,
          originModule: null,
          isArchived: false,
          createdAt: null,
          updatedAt: null,
        }
        setDetailUnit(newUnit)
        setIsDirty(false)
        setDetailInitialSectionId('detail')
      }
    },
    [selectedUnitType, unitTypes]
  )

  // Pokud není vybrán typ jednotky, zobrazit výběr typu (9 dlaždic)
  if (!selectedUnitType || !detailUnit) {
    return (
      <div className="tile-layout">
        <div className="tile-layout__header">
          <h1 className="tile-layout__title">Nová jednotka</h1>
          <p className="tile-layout__description">Vyberte typ jednotky</p>
        </div>
        <div className="tile-layout__content" style={{ padding: '1.5rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
            }}
          >
            {unitTypes.map((type) => {
              const isSelected = selectedUnitType === type.code
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

  // Pokud je vybrán typ, zobrazit UnitDetailFrame
  return (
    <UnitDetailFrame
      unit={detailUnit}
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
        // Po uložení přesměrovat na detail v seznamu jednotek
        router.push(`/modules/040-nemovitost?t=units-list&id=${saved.id}&vm=read`)
      }}
    />
  )
}
