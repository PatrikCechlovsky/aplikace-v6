// FILE: app/modules/040-nemovitost/components/EquipmentTab.tsx
// PURPOSE: Záložka vybavení pro Property/Unit - seznam nahoře, detail dole (RelationListWithDetail pattern)
// NOTES: Použitelná pro properties i units, podle entityType

'use client'

import React, { useCallback, useEffect, useState } from 'react'
import RelationListWithDetail, { type RelationItem } from '@/app/UI/RelationListWithDetail'
import {
  listPropertyEquipment,
  listUnitEquipment,
  type PropertyEquipmentRow,
  type UnitEquipmentRow,
  savePropertyEquipment,
  saveUnitEquipment,
  deletePropertyEquipment,
  deleteUnitEquipment,
  listEquipmentCatalog,
  type EquipmentCatalogRow,
} from '@/app/lib/services/equipment'
import { EQUIPMENT_STATES } from '@/app/lib/constants/properties'
import { useToast } from '@/app/UI/Toast'
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

// =====================
// COMPONENT
// =====================

export default function EquipmentTab({ entityType, entityId, readOnly = false }: Props) {
  const toast = useToast()
  
  const [items, setItems] = useState<EquipmentRow[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [catalog, setCatalog] = useState<EquipmentCatalogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Form state pro detail
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState<Partial<EquipmentRow>>({})
  
  // =====================
  // DATA LOADING
  // =====================
  
  const loadEquipment = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = entityType === 'property' 
        ? await listPropertyEquipment(entityId)
        : await listUnitEquipment(entityId)
      setItems(data)
      
      // Pokud bylo něco vybráno a už neexistuje, resetuj
      if (selectedId && !data.find(item => item.id === selectedId)) {
        setSelectedId(null)
      }
    } catch (err: any) {
      logger.error('Failed to load equipment:', err)
      setError(err.message || 'Nepodařilo se načíst vybavení')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [entityType, entityId, selectedId])
  
  const loadCatalog = useCallback(async () => {
    try {
      const data = await listEquipmentCatalog({ includeArchived: false })
      setCatalog(data)
    } catch (err: any) {
      logger.error('Failed to load equipment catalog:', err)
    }
  }, [])
  
  useEffect(() => {
    loadEquipment()
    loadCatalog()
  }, [loadEquipment, loadCatalog])
  
  // =====================
  // SELECTION
  // =====================
  
  const handleSelect = useCallback((id: string | number) => {
    const item = items.find(i => i.id === id)
    if (!item) return
    
    setSelectedId(String(id))
    setFormData(item)
    setEditMode(false)
  }, [items])
  
  // =====================
  // CRUD OPERATIONS
  // =====================
  
  const handleSave = useCallback(async () => {
    if (!formData.equipment_id) {
      toast.showError('Vyberte vybavení z katalogu')
      return
    }
    
    try {
      const input = {
        id: formData.id || null,
        [entityType === 'property' ? 'property_id' : 'unit_id']: entityId,
        equipment_id: formData.equipment_id,
        quantity: formData.quantity || 1,
        state: formData.state || 'good',
        installation_date: formData.installation_date || null,
        note: formData.note || null,
      }
      
      if (entityType === 'property') {
        await savePropertyEquipment(input as any)
      } else {
        await saveUnitEquipment(input as any)
      }
      
      toast.showSuccess('Vybavení uloženo')
      setEditMode(false)
      await loadEquipment()
    } catch (err: any) {
      logger.error('Failed to save equipment:', err)
      toast.showError('Nepodařilo se uložit vybavení')
    }
  }, [formData, entityType, entityId, toast, loadEquipment])
  
  const handleDelete = useCallback(async () => {
    if (!selectedId) return
    if (!confirm('Opravdu chcete odstranit toto vybavení?')) return
    
    try {
      if (entityType === 'property') {
        await deletePropertyEquipment(selectedId)
      } else {
        await deleteUnitEquipment(selectedId)
      }
      
      toast.showSuccess('Vybavení odstraňeno')
      setSelectedId(null)
      await loadEquipment()
    } catch (err: any) {
      logger.error('Failed to delete equipment:', err)
      toast.showError('Nepodařilo se odstranit vybavení')
    }
  }, [selectedId, entityType, toast, loadEquipment])
  
  const handleAdd = useCallback(() => {
    setFormData({
      equipment_id: '',
      quantity: 1,
      state: 'good',
      installation_date: null,
      note: null,
    })
    setSelectedId(null)
    setEditMode(true)
  }, [])
  
  // =====================
  // RENDER
  // =====================
  
  const relationItems: RelationItem[] = items.map((item) => {
    const stateDef = EQUIPMENT_STATES.find(s => s.value === item.state)
    const stateLabel = stateDef ? `${stateDef.icon} ${stateDef.label}` : item.state
    
    return {
      id: item.id,
      primary: item.catalog_equipment_name || 'Bez názvu',
      secondary: `${item.quantity}× | ${stateLabel} | ${item.total_price ? `${item.total_price.toLocaleString('cs-CZ')} Kč` : '—'}`,

      badge: item.equipment_type_name ? (
        <span style={{ 
          fontSize: '0.75rem', 
          padding: '0.125rem 0.5rem',
          borderRadius: '0.25rem',
          backgroundColor: 'var(--color-primary-light)',
          color: 'var(--color-primary-dark)'
        }}>
          {item.equipment_type_name}
        </span>
      ) : undefined,
    }
  })
  
  const selectedItem = items.find(i => i.id === selectedId)
  
  // =====================
  // LOADING STATE
  // =====================
  
  if (loading) {
    return (
      <div className="detail-form">
        <section className="detail-form__section">
          <div className="detail-form__hint">Načítám vybavení…</div>
        </section>
      </div>
    )
  }
  
  // =====================
  // ERROR STATE
  // =====================
  
  if (error) {
    return (
      <div className="detail-form">
        <section className="detail-form__section">
          <div style={{ 
            padding: '2rem', 
            textAlign: 'center', 
            color: 'var(--color-danger)',
            backgroundColor: 'var(--color-danger-soft)',
            borderRadius: '0.5rem'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Nelze načíst vybavení</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              {error}
            </div>
            <div style={{ fontSize: '0.875rem', marginTop: '1rem', color: 'var(--color-text-muted)' }}>
              💡 Tip: Zkontrolujte, zda byla spuštěna migrace 077 v databázi
            </div>
            <button
              type="button"
              className="button button--primary"
              onClick={loadEquipment}
              style={{ marginTop: '1rem' }}
            >
              🔄 Zkusit znovu
            </button>
          </div>
        </section>
      </div>
    )
  }
  
  // =====================
  // MAIN CONTENT
  // =====================
  
  return (
    <RelationListWithDetail
      title={`Vybavení (${items.length})`}
      items={relationItems}
      selectedId={selectedId}
      onSelect={handleSelect}
      emptyText={`Tato ${entityType === 'property' ? 'nemovitost' : 'jednotka'} nemá přiřazeno žádné vybavení.`}
    >
      {selectedItem && !editMode && (
        <div className="detail-form">
          <div className="detail-form__section">
            <div className="detail-form__header">
              <h3 className="detail-form__section-title">
                {selectedItem.catalog_equipment_name || 'Vybavení'}
              </h3>
              {!readOnly && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="button button--secondary button--small"
                    onClick={() => setEditMode(true)}
                  >
                    ✏️ Upravit
                  </button>
                  <button
                    type="button"
                    className="button button--danger button--small"
                    onClick={handleDelete}
                  >
                    🗑️ Odstranit
                  </button>
                </div>
              )}
            </div>
            
            <div className="detail-form__grid">
              <div className="detail-form__field">
                <label className="detail-form__label">Typ vybavení</label>
                <input
                  className="detail-form__input detail-form__input--readonly"
                  value={selectedItem.equipment_type_name || '—'}
                  readOnly
                />
              </div>
              
              <div className="detail-form__field">
                <label className="detail-form__label">Množství</label>
                <input
                  className="detail-form__input detail-form__input--readonly"
                  value={selectedItem.quantity}
                  readOnly
                />
              </div>
              
              <div className="detail-form__field">
                <label className="detail-form__label">Stav</label>
                <input
                  className="detail-form__input detail-form__input--readonly"
                  value={EQUIPMENT_STATES.find(s => s.value === selectedItem.state)?.label || selectedItem.state || '—'}
                  readOnly
                />
              </div>
              
              <div className="detail-form__field">
                <label className="detail-form__label">Katalogová cena (ks)</label>
                <input
                  className="detail-form__input detail-form__input--readonly"
                  value={selectedItem.catalog_purchase_price ? `${selectedItem.catalog_purchase_price.toLocaleString('cs-CZ')} Kč` : '—'}
                  readOnly
                />
              </div>
              
              <div className="detail-form__field">
                <label className="detail-form__label">Celková cena</label>
                <input
                  className="detail-form__input detail-form__input--readonly"
                  value={selectedItem.total_price ? `${selectedItem.total_price.toLocaleString('cs-CZ')} Kč` : '—'}
                  readOnly
                />
              </div>
              
              <div className="detail-form__field">
                <label className="detail-form__label">Datum instalace</label>
                <input
                  className="detail-form__input detail-form__input--readonly"
                  value={selectedItem.installation_date || '—'}
                  readOnly
                />
              </div>
              
              <div className="detail-form__field detail-form__field--span-2">
                <label className="detail-form__label">Poznámka</label>
                <textarea
                  className="detail-form__textarea detail-form__input--readonly"
                  value={selectedItem.note || ''}
                  readOnly
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {editMode && (
        <div className="detail-form">
          <div className="detail-form__section">
            <div className="detail-form__header">
              <h3 className="detail-form__section-title">
                {formData.id ? 'Upravit vybavení' : 'Přidat vybavení'}
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="button button--primary button--small"
                  onClick={handleSave}
                >
                  💾 Uložit
                </button>
                <button
                  type="button"
                  className="button button--secondary button--small"
                  onClick={() => {
                    setEditMode(false)
                    if (selectedId) {
                      const item = items.find(i => i.id === selectedId)
                      if (item) setFormData(item)
                    } else {
                      setFormData({})
                    }
                  }}
                >
                  ✖️ Zrušit
                </button>
              </div>
            </div>
            
            <div className="detail-form__grid">
              <div className="detail-form__field">
                <label className="detail-form__label">
                  Vybavení z katalogu <span className="detail-form__required">*</span>
                </label>
                <select
                  className="detail-form__input"
                  value={formData.equipment_id || ''}
                  onChange={(e) => setFormData({ ...formData, equipment_id: e.target.value })}
                  required
                >
                  <option value="">— vyberte —</option>
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
                  type="number"
                  min="1"
                  className="detail-form__input"
                  value={formData.quantity || 1}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
              
              <div className="detail-form__field">
                <label className="detail-form__label">Stav</label>
                <select
                  className="detail-form__input"
                  value={formData.state || 'good'}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                >
                  {EQUIPMENT_STATES.map((state) => (
                    <option key={state.value} value={state.value}>
                      {state.icon} {state.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="detail-form__field">
                <label className="detail-form__label">Datum instalace</label>
                <input
                  type="date"
                  className="detail-form__input"
                  value={formData.installation_date || ''}
                  onChange={(e) => setFormData({ ...formData, installation_date: e.target.value || null })}
                />
              </div>
              
              <div className="detail-form__field detail-form__field--span-2">
                <label className="detail-form__label">Poznámka</label>
                <textarea
                  className="detail-form__textarea"
                  value={formData.note || ''}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value || null })}
                  rows={3}
                  placeholder="Poznámky k vybavení..."
                />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {!selectedItem && !editMode && !readOnly && (
        <div className="detail-form">
          <div className="detail-form__section">
            <button
              type="button"
              className="button button--primary"
              onClick={handleAdd}
            >
              ➕ Přidat vybavení
            </button>
          </div>
        </div>
      )}
    </RelationListWithDetail>
  )
}
