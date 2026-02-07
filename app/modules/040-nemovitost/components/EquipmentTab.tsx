// FILE: app/modules/040-nemovitost/components/EquipmentTab.tsx
// PURPOSE: Záložka vybavení pro Property/Unit - pattern jako AccountsSection (seznam nahoře, formulář dole)
// NOTES: Použitelná pro properties i units, podle entityType

'use client'

import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react'
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
import { applyColumnPrefs, loadViewPrefs, saveViewPrefs, type ViewPrefs } from '@/app/lib/services/viewPrefs'
import ListViewColumnsDrawer from '@/app/UI/ListViewColumnsDrawer'
import type { ListViewColumn } from '@/app/UI/ListView'
import AttachmentsManagerFrame, { type AttachmentsManagerApi, type AttachmentsManagerUiState } from '@/app/UI/attachments/AttachmentsManagerFrame'
import DetailAttachmentsSection from '@/app/UI/detail-sections/DetailAttachmentsSection'

import '@/app/styles/components/DetailForm.css'

const logger = createLogger('EquipmentTab')

// =====================
// COLUMNS & PREFS
// =====================

const BASE_COLUMNS: ListViewColumn[] = [
  { key: 'catalog_equipment_name', label: 'Název', sortable: true },
  { key: 'equipment_type_name', label: 'Typ', sortable: false },
  { key: 'room_type_name', label: 'Místnost', sortable: false },
  { key: 'quantity', label: 'Množství', sortable: false, align: 'center' },
  { key: 'state', label: 'Stav', sortable: false },
  { key: 'catalog_purchase_price', label: 'Cena (ks)', sortable: false, align: 'right' },
  { key: 'total_price', label: 'Celkem', sortable: false, align: 'right' },
]

// =====================
// TYPES
// =====================

type EntityType = 'property' | 'unit'
type EquipmentRow = PropertyEquipmentRow | UnitEquipmentRow
type ViewMode = 'list' | 'detail' | 'attachments'
type DetailMode = 'read' | 'edit' | 'create'

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
  equipmentTypeId: string | null
  roomTypeId: string | null
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
    equipmentTypeId: null,
    roomTypeId: null,
  })
  const [isDirty, setIsDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Column prefs
  const [colPrefs, setColPrefs] = useState<Pick<ViewPrefs, 'colWidths' | 'colOrder' | 'colHidden'>>({
    colWidths: {},
    colOrder: [],
    colHidden: [],
  })
  
  const columns = useMemo(() => {
    return applyColumnPrefs(BASE_COLUMNS, colPrefs)
  }, [colPrefs])
  
  const [colsOpen, setColsOpen] = useState(false)
  const prefsLoadedRef = useRef(false)
  const saveTimerRef = useRef<any>(null)
  
  // Režim: katalog vs vlastní
  const [isCustomEquipment, setIsCustomEquipment] = useState(false)
  
  // Tab state - formulář nebo přílohy
  const [activeTab, setActiveTab] = useState<'form' | 'attachments'>('form')

  // View mode - seznam / detail / správa příloh
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [detailMode, setDetailMode] = useState<DetailMode>('read')
  const [attachmentsReturnView, setAttachmentsReturnView] = useState<'list' | 'detail'>('list')
  
  // API ref pro AttachmentsManagerFrame
  const attachmentsApiRef = useRef<AttachmentsManagerApi | null>(null)
  const [attachmentsUiState, setAttachmentsUiState] = useState<AttachmentsManagerUiState>({
    hasSelection: false,
    isDirty: false,
    mode: 'list',
  })
  
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

  // Načíst column prefs
  useEffect(() => {
    const VIEW_KEY = `equipment-table:${entityType}:${entityId}`
    
    void (async () => {
      const prefs = await loadViewPrefs(VIEW_KEY, { v: 1, sort: null, colWidths: {}, colOrder: [], colHidden: [] })
      setColPrefs({
        colWidths: prefs.colWidths ?? {},
        colOrder: prefs.colOrder ?? [],
        colHidden: prefs.colHidden ?? [],
      })
      prefsLoadedRef.current = true
    })()
  }, [entityType, entityId])

  // Uložit column prefs (debounced)
  useEffect(() => {
    if (!prefsLoadedRef.current) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)

    const VIEW_KEY = `equipment-table:${entityType}:${entityId}`
    const payload: ViewPrefs = {
      v: 1,
      sort: null,
      colWidths: colPrefs.colWidths ?? {},
      colOrder: colPrefs.colOrder ?? [],
      colHidden: colPrefs.colHidden ?? [],
    }

    saveTimerRef.current = setTimeout(() => {
      void saveViewPrefs(VIEW_KEY, payload)
    }, 500)
  }, [entityType, entityId, colPrefs])

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
            equipmentTypeId: equipment.equipment_type_id ?? null,
            roomTypeId: equipment.room_type_id ?? null,
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
          equipmentTypeId: null,
          roomTypeId: null,
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
    setIsCustomEquipment(false) // Reset na katalog
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
      equipmentTypeId: null,
      roomTypeId: null,
    })
    setIsDirty(false)
  }, [])

  const openDetailRead = useCallback(() => {
    if (!selectedEquipmentId) return
    selectEquipment(selectedEquipmentId)
    setDetailMode('read')
    setViewMode('detail')
    setActiveTab('form')
  }, [selectedEquipmentId, selectEquipment])

  const openDetailEdit = useCallback(() => {
    if (!selectedEquipmentId || readOnly) return
    selectEquipment(selectedEquipmentId)
    setDetailMode('edit')
    setViewMode('detail')
    setActiveTab('form')
  }, [selectedEquipmentId, selectEquipment, readOnly])

  const openDetailCreate = useCallback(() => {
    if (readOnly) return
    handleAdd()
    setDetailMode('create')
    setViewMode('detail')
    setActiveTab('form')
  }, [handleAdd, readOnly])

  const closeDetail = useCallback(() => {
    setViewMode('list')
    setActiveTab('form')
    setDetailMode('read')
    setIsDirty(false)
  }, [])

  const openAttachmentsManager = useCallback(
    (returnTo: 'list' | 'detail') => {
      if (!selectedEquipmentId) return
      setAttachmentsReturnView(returnTo)
      setViewMode('attachments')
    },
    [selectedEquipmentId]
  )

  const closeAttachmentsManager = useCallback(() => {
    setViewMode(attachmentsReturnView)
    setActiveTab('form')
  }, [attachmentsReturnView])

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
      if (!isCustomEquipment && !formValue.equipmentId?.trim()) {
        toast.showWarning('Vyberte vybavení z katalogu nebo použijte režim "Vlastní vybavení".')
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
          equipment_id: formValue.equipmentId || undefined,
          name: formValue.name,
          description: formValue.description || undefined,
          quantity: formValue.quantity || 1,
          purchase_price: formValue.purchasePrice || undefined,
          state: formValue.state || 'good',
          installed_at: formValue.installationDate || undefined,
          last_revision: formValue.lastRevision || undefined,
          lifespan_months: formValue.lifespanMonths || undefined,
          note: formValue.note || undefined,
          equipment_type_id: formValue.equipmentTypeId || undefined,
          room_type_id: formValue.roomTypeId || undefined,
        }
        await savePropertyEquipment(payload)
      } else {
        const payload: SaveUnitEquipmentInput = {
          id: selectedEquipmentId || undefined,
          unit_id: entityId,
          equipment_id: formValue.equipmentId || undefined,
          name: formValue.name,
          description: formValue.description || undefined,
          quantity: formValue.quantity || 1,
          purchase_price: formValue.purchasePrice || undefined,
          state: formValue.state || 'good',
          installed_at: formValue.installationDate || undefined,
          last_revision: formValue.lastRevision || undefined,
          lifespan_months: formValue.lifespanMonths || undefined,
          note: formValue.note || undefined,
          equipment_type_id: formValue.equipmentTypeId || undefined,
          room_type_id: formValue.roomTypeId || undefined,
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

      setDetailMode('read')
      setViewMode('detail')
      setActiveTab('form')
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
  const isFormReadOnly = readOnly || detailMode === 'read'

  // =====================
  // RENDER
  // =====================
  
  return (
    <div className="detail-form">
      {viewMode === 'list' && (
        <section className="detail-form__section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 className="detail-form__section-title">Seznam vybavení</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setColsOpen(true)}
                className="common-actions__btn"
                title="Nastavit sloupce"
              >
                <span className="common-actions__icon">{getIcon('settings' as IconKey)}</span>
                <span className="common-actions__label">Sloupce</span>
              </button>
              {!readOnly && (
                <button
                  type="button"
                  onClick={openDetailCreate}
                  className="common-actions__btn"
                  title="Přidat nové vybavení"
                >
                  <span className="common-actions__icon">{getIcon('add' as IconKey)}</span>
                  <span className="common-actions__label">Přidat</span>
                </button>
              )}
              <button
                type="button"
                onClick={openDetailRead}
                disabled={!selectedEquipmentId}
                className="common-actions__btn"
                title="Číst vybrané vybavení"
              >
                <span className="common-actions__icon">{getIcon('view' as IconKey)}</span>
                <span className="common-actions__label">Číst</span>
              </button>
              {!readOnly && (
                <button
                  type="button"
                  onClick={openDetailEdit}
                  disabled={!selectedEquipmentId}
                  className="common-actions__btn"
                  title="Upravit vybrané vybavení"
                >
                  <span className="common-actions__icon">{getIcon('edit' as IconKey)}</span>
                  <span className="common-actions__label">Editovat</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => openAttachmentsManager('list')}
                disabled={!selectedEquipmentId}
                className="common-actions__btn"
                title="Správa příloh vybraného vybavení"
              >
                <span className="common-actions__icon">{getIcon('attach' as IconKey)}</span>
                <span className="common-actions__label">Přílohy</span>
              </button>
            </div>
          </div>

          {loading && <div className="detail-form__hint">Načítám vybavení…</div>}

          {!loading && equipmentList.length === 0 && <div className="detail-form__hint">Zatím žádné vybavení.</div>}

          {!loading && equipmentList.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        style={{
                          padding: '8px',
                          textAlign: col.align === 'center' ? 'center' : col.align === 'right' ? 'right' : 'left',
                          fontWeight: 600,
                          width: col.width,
                        }}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {equipmentList.map((equipment) => (
                    <tr
                      key={equipment.id}
                      onClick={() => selectEquipment(equipment.id)}
                      onDoubleClick={() => {
                        selectEquipment(equipment.id)
                        setDetailMode('read')
                        setViewMode('detail')
                        setActiveTab('form')
                      }}
                      style={{
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--color-border-soft)',
                        backgroundColor: selectedEquipmentId === equipment.id ? 'var(--color-primary-soft)' : 'transparent',
                        height: '32px',
                      }}
                    >
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          style={{
                            padding: '8px',
                            textAlign: col.align === 'center' ? 'center' : col.align === 'right' ? 'right' : 'left',
                            width: col.width,
                          }}
                        >
                          {col.key === 'catalog_equipment_name' && (equipment.catalog_equipment_name || '—')}
                          {col.key === 'equipment_type_name' && (equipment.equipment_type_name || '—')}
                          {col.key === 'room_type_name' && (equipment.room_type_name || '—')}
                          {col.key === 'quantity' && `${equipment.quantity || 1}×`}
                          {col.key === 'state' && (EQUIPMENT_STATES.find((s) => s.value === equipment.state)?.label || equipment.state)}
                          {col.key === 'catalog_purchase_price' && (
                            equipment.catalog_purchase_price ? `${equipment.catalog_purchase_price.toLocaleString('cs-CZ')} Kč` : '—'
                          )}
                          {col.key === 'total_price' && (
                            equipment.total_price ? `${equipment.total_price.toLocaleString('cs-CZ')} Kč` : '—'
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Detail vybavení */}
      {viewMode === 'detail' && (
      <section className="detail-form__section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 className="detail-form__section-title">Detail vybavení</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            {detailMode === 'read' && (
              <>
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
                {!readOnly && (
                  <button
                    type="button"
                    onClick={openDetailCreate}
                    className="common-actions__btn"
                    title="Přidat nové vybavení"
                  >
                    <span className="common-actions__icon">{getIcon('add' as IconKey)}</span>
                    <span className="common-actions__label">Přidat</span>
                  </button>
                )}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={openDetailEdit}
                    disabled={!selectedEquipmentId}
                    className="common-actions__btn"
                    title="Změnit vybrané vybavení"
                  >
                    <span className="common-actions__icon">{getIcon('edit' as IconKey)}</span>
                    <span className="common-actions__label">Změnit</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openAttachmentsManager('detail')}
                  disabled={!selectedEquipmentId}
                  className="common-actions__btn"
                  title="Správa příloh vybraného vybavení"
                >
                  <span className="common-actions__icon">{getIcon('attach' as IconKey)}</span>
                  <span className="common-actions__label">Přílohy</span>
                </button>
                <button
                  type="button"
                  onClick={closeDetail}
                  className="common-actions__btn"
                  title="Zavřít detail"
                >
                  <span className="common-actions__icon">{getIcon('close' as IconKey)}</span>
                  <span className="common-actions__label">Zavřít</span>
                </button>
              </>
            )}

            {detailMode === 'create' && !readOnly && (
              <>
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
                <button
                  type="button"
                  onClick={closeDetail}
                  className="common-actions__btn"
                  title="Zavřít bez uložení"
                >
                  <span className="common-actions__icon">{getIcon('close' as IconKey)}</span>
                  <span className="common-actions__label">Zavřít</span>
                </button>
              </>
            )}

            {detailMode === 'edit' && !readOnly && (
              <>
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
                  onClick={handleSave}
                  disabled={saving || !isDirty}
                  className="common-actions__btn"
                  title={saving ? 'Ukládám…' : 'Uložit vybavení'}
                >
                  <span className="common-actions__icon">{getIcon('save' as IconKey)}</span>
                  <span className="common-actions__label">{saving ? 'Ukládám…' : 'Uložit'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => openAttachmentsManager('detail')}
                  disabled={!selectedEquipmentId}
                  className="common-actions__btn"
                  title="Správa příloh vybraného vybavení"
                >
                  <span className="common-actions__icon">{getIcon('attach' as IconKey)}</span>
                  <span className="common-actions__label">Přílohy</span>
                </button>
                <button
                  type="button"
                  onClick={closeDetail}
                  className="common-actions__btn"
                  title="Zavřít detail"
                >
                  <span className="common-actions__icon">{getIcon('close' as IconKey)}</span>
                  <span className="common-actions__label">Zavřít</span>
                </button>
              </>
            )}
          </div>
        </div>

          {/* Záložky: Formulář / Přílohy */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid var(--color-border)' }}>
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              style={{
                padding: '8px 16px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                borderBottom: activeTab === 'form' ? '2px solid var(--color-primary)' : '2px solid transparent',
                color: activeTab === 'form' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              }}
            >
              Formulář
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('attachments')}
              disabled={!selectedEquipmentId}
              style={{
                padding: '8px 16px',
                border: 'none',
                background: 'transparent',
                cursor: selectedEquipmentId ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: 500,
                borderBottom: activeTab === 'attachments' ? '2px solid var(--color-primary)' : '2px solid transparent',
                color: activeTab === 'attachments' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                opacity: selectedEquipmentId ? 1 : 0.5,
              }}
            >
              📎 Přílohy
            </button>
          </div>

          {/* Tab Content: Formulář */}
          {activeTab === 'form' && (
          <div className="detail-form__grid detail-form__grid--narrow">
            {/* Toggle: Katalog vs Vlastní */}
            <div className="detail-form__field detail-form__field--span-2" style={{ marginBottom: 16, padding: 12, background: 'var(--color-bg-secondary)', borderRadius: 4 }}>
              <label className="detail-form__label" style={{ marginBottom: 8 }}>Typ vybavení</label>
              <div style={{ display: 'flex', gap: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="equipment-type"
                    checked={!isCustomEquipment}
                    disabled={isFormReadOnly}
                    onChange={() => {
                      setIsCustomEquipment(false)
                      setFormValue((prev) => ({ ...prev, equipmentId: '' }))
                      setIsDirty(true)
                    }}
                  />
                  <span>Z katalogu</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="equipment-type"
                    checked={isCustomEquipment}
                    disabled={isFormReadOnly}
                    onChange={() => {
                      setIsCustomEquipment(true)
                      setFormValue((prev) => ({ ...prev, equipmentId: '' }))
                      setIsDirty(true)
                    }}
                  />
                  <span>Vlastní vybavení</span>
                </label>
              </div>
            </div>

            {/* Filtry katalogu - jen když je "Z katalogu" */}
            {!isCustomEquipment && (
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
            )}
            
            {/* Řádek 1: Vybavení z katalogu - jen když je "Z katalogu" */}
            {!isCustomEquipment && (
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
            )}

            {/* Řádek 2: Název + Popis */}
            <div className="detail-form__field">
              <label className="detail-form__label">
                Název konkrétního kusu <span className="detail-form__required">*</span>
              </label>
              <input
                className="detail-form__input"
                type="text"
                maxLength={100}
                disabled={isFormReadOnly}
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
                disabled={isFormReadOnly}
                value={formValue.description}
                onChange={(e) => {
                  setFormValue((prev) => ({ ...prev, description: e.target.value }))
                  setIsDirty(true)
                }}
                placeholder="Volitelný popis..."
              />
            </div>

            {/* Řádek 3: Typ + Místnost */}
            <div className="detail-form__field">
              <label className="detail-form__label">Typ vybavení (konkrétní)</label>
              <select
                className="detail-form__input"
                disabled={isFormReadOnly}
                value={formValue.equipmentTypeId || ''}
                onChange={(e) => {
                  setFormValue((prev) => ({ ...prev, equipmentTypeId: e.target.value || null }))
                  setIsDirty(true)
                }}
              >
                <option value="">— z katalogu —</option>
                {equipmentTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="detail-form__field">
              <label className="detail-form__label">Místnost</label>
              <select
                className="detail-form__input"
                disabled={isFormReadOnly}
                value={formValue.roomTypeId || ''}
                onChange={(e) => {
                  setFormValue((prev) => ({ ...prev, roomTypeId: e.target.value || null }))
                  setIsDirty(true)
                }}
              >
                <option value="">—</option>
                {roomTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Řádek 4: Množství + Jednotková cena */}
            <div className="detail-form__field">
              <label className="detail-form__label">Množství</label>
              <input
                className="detail-form__input"
                type="number"
                min="1"
                disabled={isFormReadOnly}
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
                disabled={isFormReadOnly}
                value={formValue.purchasePrice ?? ''}
                onChange={(e) => {
                  setFormValue((prev) => ({ ...prev, purchasePrice: e.target.value ? parseFloat(e.target.value) : null }))
                  setIsDirty(true)
                }}
                placeholder="Cena pořízení..."
              />
            </div>

            {/* Řádek 5: Stav + Životnost */}
            <div className="detail-form__field">
              <label className="detail-form__label">Stav</label>
              <select
                className="detail-form__input"
                disabled={isFormReadOnly}
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
                disabled={isFormReadOnly}
                value={formValue.lifespanMonths ?? ''}
                onChange={(e) => {
                  setFormValue((prev) => ({ ...prev, lifespanMonths: e.target.value ? parseInt(e.target.value) : null }))
                  setIsDirty(true)
                }}
                placeholder="např. 120"
              />
            </div>

            {/* Řádek 6: Datum instalace + Poslední revize */}
            <div className="detail-form__field">
              <label className="detail-form__label">Datum instalace</label>
              <input
                className="detail-form__input"
                type="date"
                disabled={isFormReadOnly}
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
                disabled={isFormReadOnly}
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
                disabled={isFormReadOnly}
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
        )}

        {/* Tab Content: Přílohy */}
        {activeTab === 'attachments' && selectedEquipmentId && (
          <div style={{ marginTop: '20px' }}>
            <DetailAttachmentsSection
              entityType={entityType === 'property' ? 'property_equipment_binding' : 'equipment_binding'}
              entityId={selectedEquipmentId}
              entityLabel={equipmentList.find((e) => e.id === selectedEquipmentId)?.catalog_equipment_name || equipmentList.find((e) => e.id === selectedEquipmentId)?.name || 'Vybavení'}
              mode="view"
              variant="list"
              canManage={false}
            />
          </div>
        )}
      </section>
      )}

      {viewMode === 'attachments' && selectedEquipmentId && (
        <section className="detail-form__section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 className="detail-form__section-title">Správa příloh</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              {attachmentsUiState.mode === 'list' && (
                <>
                  {attachmentsUiState.hasSelection && (
                    <>
                      <button
                        type="button"
                        onClick={() => attachmentsApiRef.current?.view()}
                        className="common-actions__btn"
                        title="Zobrazit detail přílohy"
                      >
                        <span className="common-actions__icon">{getIcon('view' as IconKey)}</span>
                        <span className="common-actions__label">Zobrazit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => attachmentsApiRef.current?.edit()}
                        className="common-actions__btn"
                        title={readOnly ? "Upravit název a popis (můžeš editovat jen svoje soubory)" : "Upravit název a popis"}
                      >
                        <span className="common-actions__icon">{getIcon('edit' as IconKey)}</span>
                        <span className="common-actions__label">Upravit</span>
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => attachmentsApiRef.current?.add()}
                    className="common-actions__btn"
                    title="Přidat novou přílohu"
                  >
                    <span className="common-actions__icon">{getIcon('add' as IconKey)}</span>
                    <span className="common-actions__label">Přidat</span>
                  </button>
                </>
              )}

              {attachmentsUiState.mode === 'read' && (
                <>
                  <button
                    type="button"
                    onClick={() => attachmentsApiRef.current?.edit()}
                    className="common-actions__btn"
                    title={readOnly ? "Upravit název a popis (můžeš editovat jen svoje soubory)" : "Upravit název a popis"}
                  >
                    <span className="common-actions__icon">{getIcon('edit' as IconKey)}</span>
                    <span className="common-actions__label">Upravit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => attachmentsApiRef.current?.newVersion()}
                    className="common-actions__btn"
                    title={readOnly ? "Nahrát novou verzi (můžeš upravit jen svoje soubory)" : "Nahrát novou verzi"}
                  >
                    <span className="common-actions__icon">{getIcon('upload' as IconKey)}</span>
                    <span className="common-actions__label">Nová verze</span>
                  </button>
                </>
              )}

              {(attachmentsUiState.mode === 'edit' || attachmentsUiState.mode === 'new') && (
                <button
                  type="button"
                  onClick={() => void attachmentsApiRef.current?.save()}
                  disabled={!attachmentsUiState.isDirty}
                  className="common-actions__btn"
                  title="Uložit"
                >
                  <span className="common-actions__icon">{getIcon('save' as IconKey)}</span>
                  <span className="common-actions__label">Uložit</span>
                </button>
              )}

              <button
                type="button"
                onClick={closeAttachmentsManager}
                className="common-actions__btn"
                title="Zavřít správu příloh"
              >
                <span className="common-actions__icon">{getIcon('close' as IconKey)}</span>
                <span className="common-actions__label">Zavřít</span>
              </button>
            </div>
          </div>

          <AttachmentsManagerFrame
            entityType={entityType === 'property' ? 'property_equipment_binding' : 'equipment_binding'}
            entityId={selectedEquipmentId}
            entityLabel={equipmentList.find((e) => e.id === selectedEquipmentId)?.catalog_equipment_name || equipmentList.find((e) => e.id === selectedEquipmentId)?.name || 'Vybavení'}
            canManage={!readOnly}
            onRegisterManagerApi={(api) => {
              attachmentsApiRef.current = api
            }}
            onManagerStateChange={(state) => {
              setAttachmentsUiState(state)
            }}
          />
        </section>
      )}

      {/* Columns Drawer */}
      <ListViewColumnsDrawer
        open={colsOpen}
        title="Sloupce vybavení"
        columns={BASE_COLUMNS}
        fixedFirstKey="catalog_equipment_name"
        requiredKeys={['catalog_equipment_name']}
        value={{
          order: colPrefs.colOrder ?? [],
          hidden: colPrefs.colHidden ?? [],
        }}
        onChange={(next) => {
          setColPrefs((p) => ({
            ...p,
            colOrder: next.order,
            colHidden: next.hidden,
          }))
        }}
        onReset={() => {
          setColPrefs((p) => ({
            ...p,
            colOrder: [],
            colHidden: [],
          }))
        }}
        onClose={() => setColsOpen(false)}
      />
    </div>
  )
}
