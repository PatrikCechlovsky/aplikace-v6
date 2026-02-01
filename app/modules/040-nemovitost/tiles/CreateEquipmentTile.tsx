'use client'

// FILE: app/modules/040-nemovitost/tiles/CreateEquipmentTile.tsx
// PURPOSE: Tile pro vytvoření nového vybavení - výběr typu vybavení (dlaždice) + formulář
// PATTERN: Stejný jako CreateUnitTile - krásné dlaždice s ikonami a barvami z generic_types

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { listActiveByCategory, type GenericTypeRow } from '@/app/modules/900-nastaveni/services/genericTypes'
import { getIcon, type IconKey } from '@/app/UI/icons'
import EquipmentCatalogDetailFormComponent from '../forms/EquipmentCatalogDetailFormComponent'
import type { EquipmentCatalogFormValue } from '../forms/EquipmentCatalogDetailForm'
import type { CommonActionId, ViewMode } from '@/app/UI/CommonActions'
import { createEquipmentCatalog } from '@/app/lib/services/equipment'
import { useToast } from '@/app/UI/Toast'
import createLogger from '@/app/lib/logger'

import '@/app/styles/components/PaletteCard.css'
import '@/app/styles/components/TileLayout.css'

const logger = createLogger('CreateEquipmentTile')

type Props = {
  onRegisterCommonActions?: (actions: CommonActionId[]) => void
  onRegisterCommonActionsState?: (state: { viewMode: ViewMode; hasSelection: boolean; isDirty: boolean }) => void
  onRegisterCommonActionHandler?: (fn: (id: CommonActionId) => void) => void
}

export default function CreateEquipmentTile({
  onRegisterCommonActions,
  onRegisterCommonActionsState,
  onRegisterCommonActionHandler,
}: Props) {
  const toast = useToast()
  const router = useRouter()
  const [equipmentTypes, setEquipmentTypes] = useState<GenericTypeRow[]>([])
  const [selectedEquipmentType, setSelectedEquipmentType] = useState<string | null>(null)
  const [equipmentData, setEquipmentData] = useState<EquipmentCatalogFormValue | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Načíst typy vybavení
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const types = await listActiveByCategory('equipment_types')
        if (!mounted) return
        
        // Seřadit podle order_index a name
        const sorted = types.sort((a, b) => {
          const orderA = a.order_index ?? 999
          const orderB = b.order_index ?? 999
          if (orderA !== orderB) return orderA - orderB
          return (a.name || '').localeCompare(b.name || '', 'cs')
        })

        setEquipmentTypes(sorted)
      } catch (err: any) {
        logger.error('fetchEquipmentTypes failed', err)
        toast.showError('Nepodařilo se načíst typy vybavení')
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
    if (selectedEquipmentType) {
      actions.push('save', 'close')
    } else {
      actions.push('close')
    }
    
    onRegisterCommonActions(actions)
    onRegisterCommonActionsState({
      viewMode: 'create',
      hasSelection: false,
      isDirty,
    })
  }, [selectedEquipmentType, isDirty])

  // CommonActions handler
  useEffect(() => {
    if (!onRegisterCommonActionHandler) return

    onRegisterCommonActionHandler(async (id: CommonActionId) => {
      if (id === 'close') {
        if (isDirty) {
          const ok = confirm('Máš neuložené změny. Opravdu chceš zavřít?')
          if (!ok) return
        }
        router.push('/modules/040-nemovitost?t=equipment-catalog')
        return
      }

      if (id === 'save') {
        await handleSave()
        return
      }
    })
  }, [isDirty, router, toast, equipmentData])

  const handleTypeSelect = useCallback(
    (typeCode: string) => {
      const isSame = selectedEquipmentType === typeCode
      if (isSame) {
        setSelectedEquipmentType(null)
        setEquipmentData(null)
        setIsDirty(false)
      } else {
        setSelectedEquipmentType(typeCode)
        // Najít ID typu podle code
        const type = equipmentTypes.find((t) => t.code === typeCode)
        // Vytvořit nové vybavení s vybraným typem
        const newEquipment: EquipmentCatalogFormValue = {
          equipment_name: '',
          equipment_type_id: type?.id || '',
          room_type_id: undefined,
          purchase_price: undefined,
          purchase_date: undefined,
          default_lifespan_months: undefined,
          default_revision_interval: undefined,
          default_state: 'working',
          default_description: undefined,
          active: true,
          is_archived: false,
        }
        setEquipmentData(newEquipment)
        setIsDirty(false)
      }
    },
    [selectedEquipmentType, equipmentTypes]
  )

  const handleSave = useCallback(async () => {
    if (!equipmentData) return

    try {
      setIsSaving(true)
      const saved = await createEquipmentCatalog(equipmentData)
      toast.showSuccess('Vybavení bylo úspěšně vytvořeno')
      // Přesměrovat na detail nově vytvořeného vybavení
      router.push(`/modules/040-nemovitost?t=equipment-catalog&id=${saved.id}&vm=view`)
    } catch (err: any) {
      logger.error('Chyba při ukládání vybavení:', err)
      toast.showError(err.message || 'Nepodařilo se uložit vybavení')
    } finally {
      setIsSaving(false)
    }
  }, [equipmentData, router, toast])

  // Pokud není vybrán typ, zobrazit výběr typu (dlaždice)
  if (!selectedEquipmentType || !equipmentData) {
    return (
      <div className="tile-layout">
        <div className="tile-layout__header">
          <h1 className="tile-layout__title">➕ Přidat vybavení</h1>
        </div>
        <div className="tile-layout__content" style={{ padding: '1.5rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
            }}
          >
            {equipmentTypes.map((type) => {
              const isSelected = selectedEquipmentType === type.code
              const iconKey = (type.icon?.trim() || 'wrench') as IconKey
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

  // Pokud je vybrán typ, zobrazit formulář
  const selectedType = equipmentTypes.find((t) => t.code === selectedEquipmentType)
  
  return (
    <div className="tile-layout">
      <div className="tile-layout__header">
        <h1 className="tile-layout__title">
          ➕ Nové vybavení - {selectedType?.name || 'Detail'}
        </h1>
      </div>
      <div className="tile-layout__content">
        {isSaving ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Ukládání...</div>
        ) : (
          <EquipmentCatalogDetailFormComponent
            equipment={equipmentData}
            readOnly={false}
            onValueChange={(val) => {
              setEquipmentData(val)
              setIsDirty(true)
            }}
            onDirtyChange={setIsDirty}
          />
        )}
      </div>
    </div>
  )
}
