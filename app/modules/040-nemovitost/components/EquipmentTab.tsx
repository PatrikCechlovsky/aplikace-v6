// FILE: app/modules/040-nemovitost/components/EquipmentTab.tsx
// PURPOSE: Záložka vybavení pro Property/Unit - pattern jako AccountsSection (seznam nahoře, formulář dole)
// NOTES: Použitelná pro properties i units, podle entityType

'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  listPropertyEquipment,
  listUnitEquipment,
  type PropertyEquipmentRow,
  type UnitEquipmentRow,
  savePropertyEquipment,
  saveUnitEquipment,
  listEquipmentCatalog,
  type EquipmentCatalogRow,
  type SavePropertyEquipmentInput,
  type SaveUnitEquipmentInput,
} from '@/app/lib/services/equipment'
import { EQUIPMENT_STATES } from '@/app/lib/constants/properties'
import { useToast } from '@/app/UI/Toast'
import { getIcon, type IconKey } from '@/app/UI/icons'
import createLogger from '@/app/lib/logger'

import '@/app/styles/components/DetailForm.css'

const logger = createLogger('EquipmentTab')

// =====================
// TYPES
// =====================

type EntityType = 'property' | 'unit'
type EquipmentRow = PropertyEquipmentRow | UnitEquipmentRow

type Props = {
  entityType: EntityType
  entityId: string
  readOnly?: boolean
}

type EquipmentFormValue = {
  equipmentId: string
  quantity: number
  state: string
  installationDate: string
  note: string
}

// =====================
// COMPONENT
// =====================

export default function EquipmentTab({ entityType, entityId, readOnly = false }: Props) {
  const toast = useToast()
  
  const [equipmentList, setEquipmentList] = useState<EquipmentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [catalog, setCatalog] = useState<EquipmentCatalogRow[]>([])
  const [loadingCatalog, setLoadingCatalog] = useState(true)
  
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null)
  const currentIndexRef = useRef(-1)
  const [formValue, setFormValue] = useState<EquipmentFormValue>({
    equipmentId: '',
    quantity: 1,
    state: 'good',
    installationDate: '',
    note: '',
  })
  const [isDirty, setIsDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  // Načíst seznam vybavení
  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        const data = entityType === 'property' 
          ? await listPropertyEquipment(entityId)
          : await listUnitEquipment(entityId)
        if (cancelled) return
        setEquipmentList(data)
      } catch (e: any) {
        if (cancelled) return
        logger.error('listEquipment failed', e)
        toast.showError(e?.message ?? 'Chyba při načítání vybavení')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [entityType, entityId, toast])

  // Načíst katalog vybavení
  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoadingCatalog(true)
        const data = await listEquipmentCatalog({ includeArchived: false })
        if (cancelled) return
        setCatalog(data)
      } catch (e: any) {
        if (cancelled) return
        logger.error('listEquipmentCatalog failed', e)
        toast.showError(e?.message ?? 'Chyba při načítání katalogu')
      } finally {
        if (!cancelled) setLoadingCatalog(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [toast])

  // =====================
  // SELECTION
  // =====================
  
  const selectEquipment = useCallback(
    (equipmentId: string | null) => {
      setSelectedEquipmentId(equipmentId)
      currentIndexRef.current = equipmentId ? equipmentList.findIndex((e) => e.id === equipmentId) : -1

      if (equipmentId) {
        const equipment = equipmentList.find((e) => e.id === equipmentId)
        if (equipment) {
          setFormValue({
            equipmentId: equipment.equipment_id ?? '',
            quantity: equipment.quantity ?? 1,
            state: equipment.state ?? 'good',
            installationDate: equipment.installation_date ?? '',
            note: equipment.note ?? '',
          })
          setIsDirty(false)
        }
      } else {
        setFormValue({
          equipmentId: '',
          quantity: 1,
          state: 'good',
          installationDate: '',
          note: '',
        })
        setIsDirty(false)
      }
    },
    [equipmentList]
  )

  // =====================
  // CRUD OPERATIONS
  // =====================
  
  // Nové vybavení
  const handleAdd = useCallback(() => {
    setSelectedEquipmentId(null)
    currentIndexRef.current = -1
    setFormValue({
      equipmentId: '',
      quantity: 1,
      state: 'good',
      installationDate: '',
      note: '',
    })
    setIsDirty(false)
  }, [])

  // Předchozí/Další
  const handlePrevious = useCallback(() => {
    if (currentIndexRef.current > 0) {
      const prevEquipment = equipmentList[currentIndexRef.current - 1]
      selectEquipment(prevEquipment.id)
    }
  }, [equipmentList, selectEquipment])

  const handleNext = useCallback(() => {
    if (currentIndexRef.current < equipmentList.length - 1) {
      const nextEquipment = equipmentList[currentIndexRef.current + 1]
      selectEquipment(nextEquipment.id)
    }
  }, [equipmentList, selectEquipment])

  // Uložit
  const handleSave = useCallback(async () => {
    try {
      // Validace povinných polí
      if (!formValue.equipmentId?.trim()) {
        toast.showWarning('Vyberte vybavení z katalogu.')
        return
      }

      setSaving(true)

      if (entityType === 'property') {
        const payload: SavePropertyEquipmentInput = {
          id: selectedEquipmentId || undefined,
          property_id: entityId,
          equipment_id: formValue.equipmentId,
          quantity: formValue.quantity || 1,
          state: formValue.state || 'good',
          installation_date: formValue.installationDate || undefined,
          note: formValue.note || undefined,
        }
        await savePropertyEquipment(payload)
      } else {
        const payload: SaveUnitEquipmentInput = {
          id: selectedEquipmentId || undefined,
          unit_id: entityId,
          equipment_id: formValue.equipmentId,
          quantity: formValue.quantity || 1,
          state: formValue.state || 'good',
          installation_date: formValue.installationDate || undefined,
          note: formValue.note || undefined,
        }
        await saveUnitEquipment(payload)
      }

      // Obnovit seznam
      const refreshed = entityType === 'property'
        ? await listPropertyEquipment(entityId)
        : await listUnitEquipment(entityId)
      setEquipmentList(refreshed)

      // Pokud bylo nové vybavení, vybrat ho
      if (!selectedEquipmentId && refreshed.length > 0) {
        selectEquipment(refreshed[refreshed.length - 1].id)
      }

      setIsDirty(false)
      toast.showSuccess('Vybavení uloženo')
    } catch (e: any) {
      logger.error('saveEquipment failed', e)
      toast.showError(e?.message ?? 'Chyba při ukládání vybavení')
    } finally {
      setSaving(false)
    }
  }, [selectedEquipmentId, entityType, entityId, formValue, selectEquipment, toast])

  const canGoPrevious = currentIndexRef.current > 0
  const canGoNext = currentIndexRef.current >= 0 && currentIndexRef.current < equipmentList.length - 1

  // =====================
  // RENDER
  // =====================
  
  return (
    <div className="detail-form">
      {/* Seznam vybavení */}
      <section className="detail-form__section">
        <h3 className="detail-form__section-title">Seznam vybavení</h3>

        {loading && <div className="detail-form__hint">Načítám vybavení…</div>}

        {!loading && equipmentList.length === 0 && <div className="detail-form__hint">Zatím žádné vybavení.</div>}

        {!loading && equipmentList.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Název</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Typ</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Množství</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Stav</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Cena (ks)</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Celkem</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Instalováno</th>
                </tr>
              </thead>
              <tbody>
                {equipmentList.map((equipment) => (
                  <tr
                    key={equipment.id}
                    onClick={() => selectEquipment(equipment.id)}
                    style={{
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--color-border-soft)',
                      backgroundColor: selectedEquipmentId === equipment.id ? 'var(--color-primary-soft)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '8px' }}>{equipment.catalog_equipment_name || '—'}</td>
                    <td style={{ padding: '8px' }}>{equipment.equipment_type_name || '—'}</td>
                    <td style={{ padding: '8px' }}>{equipment.quantity || 1}×</td>
                    <td style={{ padding: '8px' }}>
                      {EQUIPMENT_STATES.find((s) => s.value === equipment.state)?.label || equipment.state}
                    </td>
                    <td style={{ padding: '8px' }}>
                      {equipment.catalog_purchase_price ? `${equipment.catalog_purchase_price.toLocaleString('cs-CZ')} Kč` : '—'}
                    </td>
                    <td style={{ padding: '8px' }}>
                      {equipment.total_price ? `${equipment.total_price.toLocaleString('cs-CZ')} Kč` : '—'}
                    </td>
                    <td style={{ padding: '8px' }}>{equipment.installation_date || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Formulář */}
      {!readOnly && (
        <section className="detail-form__section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 className="detail-form__section-title">Formulář</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={handlePrevious}
                disabled={!canGoPrevious}
                className="common-actions__btn"
                title="Předchozí vybavení"
              >
                <span className="common-actions__icon">{getIcon('chevron-left' as IconKey)}</span>
                <span className="common-actions__label">Předchozí</span>
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={!canGoNext}
                className="common-actions__btn"
                title="Další vybavení"
              >
                <span className="common-actions__icon">{getIcon('chevron-right' as IconKey)}</span>
                <span className="common-actions__label">Další</span>
              </button>
              <button
                type="button"
                onClick={handleAdd}
                className="common-actions__btn"
                title="Přidat nové vybavení"
              >
                <span className="common-actions__icon">{getIcon('add' as IconKey)}</span>
                <span className="common-actions__label">Přidat</span>
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !isDirty}
                className="common-actions__btn"
                title={saving ? 'Ukládám…' : 'Uložit vybavení'}
              >
                <span className="common-actions__icon">{getIcon('save' as IconKey)}</span>
                <span className="common-actions__label">{saving ? 'Ukládám…' : 'Uložit'}</span>
              </button>
            </div>
          </div>

          <div className="detail-form__grid detail-form__grid--narrow">
            {/* Řádek 1: Vybavení z katalogu + Množství */}
            <div className="detail-form__field">
              <label className="detail-form__label">
                Vybavení z katalogu <span className="detail-form__required">*</span>
              </label>
              <select
                className="detail-form__input"
                value={formValue.equipmentId}
                disabled={loadingCatalog}
                onChange={(e) => {
                  setFormValue((prev) => ({ ...prev, equipmentId: e.target.value }))
                  setIsDirty(true)
                }}
              >
                <option value="">{loadingCatalog ? 'Načítám…' : '— vyberte vybavení —'}</option>
                {catalog.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.equipment_type_icon && `${item.equipment_type_icon} `}
                    {item.equipment_name}
                    {item.purchase_price && ` (${item.purchase_price.toLocaleString('cs-CZ')} Kč)`}
                  </option>
                ))}
              </select>
            </div>
            <div className="detail-form__field">
              <label className="detail-form__label">Množství</label>
              <input
                className="detail-form__input"
                type="number"
                min="1"
                value={formValue.quantity}
                onChange={(e) => {
                  setFormValue((prev) => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))
                  setIsDirty(true)
                }}
              />
            </div>

            {/* Řádek 2: Stav + Datum instalace */}
            <div className="detail-form__field">
              <label className="detail-form__label">Stav</label>
              <select
                className="detail-form__input"
                value={formValue.state}
                onChange={(e) => {
                  setFormValue((prev) => ({ ...prev, state: e.target.value }))
                  setIsDirty(true)
                }}
              >
                {EQUIPMENT_STATES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.icon} {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="detail-form__field">
              <label className="detail-form__label">Datum instalace</label>
              <input
                className="detail-form__input"
                type="date"
                value={formValue.installationDate}
                onChange={(e) => {
                  setFormValue((prev) => ({ ...prev, installationDate: e.target.value }))
                  setIsDirty(true)
                }}
              />
            </div>

            {/* Poznámka */}
            <div className="detail-form__field detail-form__field--span-2">
              <label className="detail-form__label">Poznámka</label>
              <textarea
                className="detail-form__input"
                maxLength={500}
                value={formValue.note}
                onChange={(e) => {
                  setFormValue((prev) => ({ ...prev, note: e.target.value }))
                  setIsDirty(true)
                }}
                rows={3}
                placeholder="Poznámky k vybavení..."
              />
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
