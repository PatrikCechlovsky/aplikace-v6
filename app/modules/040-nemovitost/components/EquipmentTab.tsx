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
import { supabase } from '@/app/lib/supabaseClient'

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
  name: string
  description: string
  quantity: number
  purchasePrice: number | null
  state: string
  installationDate: string
  lastRevision: string
  lifespanMonths: number | null
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
  const [catalogSearch, setCatalogSearch] = useState('')
  const [catalogEquipmentType, setCatalogEquipmentType] = useState<string | null>(null)
  const [catalogRoomType, setCatalogRoomType] = useState<string | null>(null)
  
  // Generic types pro filtry
  const [equipmentTypes, setEquipmentTypes] = useState<Array<{ id: string; name: string; icon?: string }>>([])
  const [roomTypes, setRoomTypes] = useState<Array<{ id: string; name: string; icon?: string }>>([])
  
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null)
  const currentIndexRef = useRef(-1)
  const [formValue, setFormValue] = useState<EquipmentFormValue>({
    equipmentId: '',
    name: '',
    description: '',
    quantity: 1,
    purchasePrice: null,
    state: 'good',
    installationDate: '',
    lastRevision: '',
    lifespanMonths: null,
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

  // Načíst generic types pro filtry
  useEffect(() => {
    let cancelled = false

    async function loadTypes() {
      try {
        // Equipment types
        const { data: eqTypes, error: eqError } = await supabase
          .from('generic_types')
          .select('id, name, icon')
          .eq('category', 'equipment_types')
          .order('name')
        
        if (eqError) {
          logger.error('loadEquipmentTypes failed', eqError)
          throw eqError
        }
        if (!cancelled && eqTypes) {
          logger.log('Equipment types loaded:', eqTypes.length)
          setEquipmentTypes(eqTypes)
        }

        // Room types  
        const { data: rmTypes, error: rmError } = await supabase
          .from('generic_types')
          .select('id, name, icon')
          .eq('category', 'room_types')
          .order('name')
        
        if (rmError) {
          logger.error('loadRoomTypes failed', rmError)
          throw rmError
        }
        if (!cancelled && rmTypes) {
          logger.log('Room types loaded:', rmTypes.length)
          setRoomTypes(rmTypes)
        }
      } catch (e: any) {
        if (!cancelled) {
          logger.error('loadGenericTypes failed', e)
          toast.showError(e?.message ?? 'Chyba při načítání typů')
        }
      }
    }

    void loadTypes()
    return () => {
      cancelled = true
    }
  }, [])

  // Načíst katalog vybavení
  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoadingCatalog(true)
        const data = await listEquipmentCatalog({ 
          includeArchived: false,
          searchText: catalogSearch || undefined,
          equipmentTypeId: catalogEquipmentType || undefined,
          roomTypeId: catalogRoomType || undefined,
        })
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
  }, [toast, catalogSearch, catalogEquipmentType, catalogRoomType])

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
            name: equipment.name ?? '',
            description: equipment.description ?? '',
            quantity: equipment.quantity ?? 1,
            purchasePrice: equipment.purchase_price ?? null,
            state: equipment.state ?? 'good',
            installationDate: equipment.installed_at ?? '',
            lastRevision: equipment.last_revision ?? '',
            lifespanMonths: equipment.lifespan_months ?? null,
            note: equipment.note ?? '',
          })
          setIsDirty(false)
        }
      } else {
        setFormValue({
          equipmentId: '',
          name: '',
          description: '',
          quantity: 1,
          purchasePrice: null,
          state: 'good',
          installationDate: '',
          lastRevision: '',
          lifespanMonths: null,
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
      name: '',
      description: '',
      quantity: 1,
      purchasePrice: null,
      state: 'good',
      installationDate: '',
      lastRevision: '',
      lifespanMonths: null,
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
      if (!formValue.name?.trim()) {
        toast.showWarning('Zadejte název konkrétního kusu vybavení.')
        return
      }

      setSaving(true)

      if (entityType === 'property') {
        const payload: SavePropertyEquipmentInput = {
          id: selectedEquipmentId || undefined,
          property_id: entityId,
          equipment_id: formValue.equipmentId,
          name: formValue.name,
          description: formValue.description || undefined,
          quantity: formValue.quantity || 1,
          purchase_price: formValue.purchasePrice || undefined,
          state: formValue.state || 'good',
          installation_date: formValue.installationDate || undefined,
          last_revision: formValue.lastRevision || undefined,
          lifespan_months: formValue.lifespanMonths || undefined,
          note: formValue.note || undefined,
        }
        await savePropertyEquipment(payload)
      } else {
        const payload: SaveUnitEquipmentInput = {
          id: selectedEquipmentId || undefined,
          unit_id: entityId,
          equipment_id: formValue.equipmentId,
          name: formValue.name,
          description: formValue.description || undefined,
          quantity: formValue.quantity || 1,
          purchase_price: formValue.purchasePrice || undefined,
          state: formValue.state || 'good',
          installed_at: formValue.installationDate || undefined,
          last_revision: formValue.lastRevision || undefined,
          lifespan_months: formValue.lifespanMonths || undefined,
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
                    <td style={{ padding: '8px' }}>{equipment.installed_at || '—'}</td>
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
            {/* Filtry katalogu */}
            <div className="detail-form__field detail-form__field--span-2" style={{ marginBottom: 16, padding: 12, background: 'var(--color-bg-secondary)', borderRadius: 4 }}>
              <label className="detail-form__label" style={{ marginBottom: 8 }}>🔍 Filtrovat katalog vybavení</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <input
                  type="text"
                  className="detail-form__input"
                  placeholder="Hledat název..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                />
                <select
                  className="detail-form__input"
                  value={catalogEquipmentType || ''}
                  onChange={(e) => setCatalogEquipmentType(e.target.value || null)}
                >
                  <option value="">— všechny typy —</option>
                  {equipmentTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
                <select
                  className="detail-form__input"
                  value={catalogRoomType || ''}
                  onChange={(e) => setCatalogRoomType(e.target.value || null)}
                >
                  <option value="">— všechny místnosti —</option>
                  {roomTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Řádek 1: Vybavení z katalogu */}
            <div className="detail-form__field detail-form__field--span-2">
              <label className="detail-form__label">
                Vybavení z katalogu <span className="detail-form__required">*</span>
              </label>
              <select
                className="detail-form__input"
                value={formValue.equipmentId}
                disabled={loadingCatalog}
                onChange={(e) => {
                  const selectedId = e.target.value
                  const selectedItem = catalog.find((item) => item.id === selectedId)
                  
                  setFormValue((prev) => ({ 
                    ...prev, 
                    equipmentId: selectedId,
                    // Předvyplnit název z katalogu, pokud ještě není vyplněn
                    name: prev.name ? prev.name : (selectedItem?.equipment_name || ''),
                    // Předvyplnit cenu z katalogu, pokud ještě není vyplněna
                    purchasePrice: prev.purchasePrice !== null ? prev.purchasePrice : (selectedItem?.purchase_price || null),
                  }))
                  setIsDirty(true)
                }}
              >
                <option value="">{loadingCatalog ? 'Načítám…' : '— vyberte vybavení —'}</option>
                {catalog.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.equipment_name}
                    {item.purchase_price && ` — ${item.purchase_price.toLocaleString('cs-CZ')} Kč`}
                  </option>
                ))}
              </select>
            </div>

            {/* Řádek 2: Název + Popis */}
            <div className="detail-form__field">
              <label className="detail-form__label">
                Název konkrétního kusu <span className="detail-form__required">*</span>
              </label>
              <input
                className="detail-form__input"
                type="text"
                maxLength={100}
                value={formValue.name}
                onChange={(e) => {
                  setFormValue((prev) => ({ ...prev, name: e.target.value }))
                  setIsDirty(true)
                }}
                placeholder="např. Sporák Whirlpool v kuchyni"
              />
            </div>
            <div className="detail-form__field">
              <label className="detail-form__label">Popis</label>
              <input
                className="detail-form__input"
                type="text"
                maxLength={200}
                value={formValue.description}
                onChange={(e) => {
                  setFormValue((prev) => ({ ...prev, description: e.target.value }))
                  setIsDirty(true)
                }}
                placeholder="Volitelný popis..."
              />
            </div>

            {/* Řádek 3: Množství + Jednotková cena */}
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
            <div className="detail-form__field">
              <label className="detail-form__label">Jednotková cena (Kč)</label>
              <input
                className="detail-form__input"
                type="number"
                min="0"
                step="0.01"
                value={formValue.purchasePrice ?? ''}
                onChange={(e) => {
                  setFormValue((prev) => ({ ...prev, purchasePrice: e.target.value ? parseFloat(e.target.value) : null }))
                  setIsDirty(true)
                }}
                placeholder="Cena pořízení..."
              />
            </div>

            {/* Řádek 4: Stav + Životnost */}
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
              <label className="detail-form__label">Životnost (měsíce)</label>
              <input
                className="detail-form__input"
                type="number"
                min="0"
                value={formValue.lifespanMonths ?? ''}
                onChange={(e) => {
                  setFormValue((prev) => ({ ...prev, lifespanMonths: e.target.value ? parseInt(e.target.value) : null }))
                  setIsDirty(true)
                }}
                placeholder="např. 120"
              />
            </div>

            {/* Řádek 5: Datum instalace + Poslední revize */}
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
            <div className="detail-form__field">
              <label className="detail-form__label">Poslední revize</label>
              <input
                className="detail-form__input"
                type="date"
                value={formValue.lastRevision}
                onChange={(e) => {
                  setFormValue((prev) => ({ ...prev, lastRevision: e.target.value }))
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
