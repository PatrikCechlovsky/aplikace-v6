// FILE: app/UI/detail-sections/DelegatesSection.tsx
// PURPOSE: Sekce pro zobrazení a správu zástupců

'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { getAvailableDelegates, getLandlordDelegates, type DelegateOption } from '@/app/lib/services/landlords'
import { supabase } from '@/app/lib/supabaseClient'
import { useToast } from '@/app/UI/Toast'
import createLogger from '@/app/lib/logger'
import ListView, { type ListViewColumn, type ListViewRow, type ListViewSortState } from '@/app/UI/ListView'
import { getIcon, type IconKey } from '@/app/UI/icons'

const logger = createLogger('DelegatesSection')

type Props = {
  subjectId: string
  mode?: 'view' | 'edit'
  onCreateDelegateFromUser?: (userId: string) => void // Callback pro vytvoření zástupce z uživatele
  onOpenNewDelegateForm?: (type: string, fromUserId?: string) => void // Callback pro otevření formuláře nového zástupce
}

// Sloupce stejné jako v seznamu pronajímatelů (displayName, email, phone)
const AVAILABLE_DELEGATES_COLUMNS: ListViewColumn[] = [
  { key: 'displayName', label: 'Zobrazované jméno', width: 220, sortable: true },
  { key: 'email', label: 'E-mail', width: 260, sortable: true },
  { key: 'phone', label: 'Telefon', width: 180, sortable: true },
  { key: 'type', label: 'Typ', width: 150, sortable: true },
]

const DELEGATES_COLUMNS: ListViewColumn[] = [
  { key: 'displayName', label: 'Zobrazované jméno', width: 220, sortable: true },
  { key: 'email', label: 'E-mail', width: 260, sortable: true },
  { key: 'phone', label: 'Telefon', width: 180, sortable: true },
  { key: 'type', label: 'Typ', width: 150, sortable: true },
  { key: 'actions', label: 'Akce', width: 100, align: 'center', sortable: false },
]

// Výchozí řazení stejné jako pronajímatelé (podle emailu)
const DEFAULT_SORT: ListViewSortState = { key: 'email', dir: 'asc' }

export default function DelegatesSection({ subjectId, mode = 'edit', onCreateDelegateFromUser, onOpenNewDelegateForm }: Props) {
  const toast = useToast()
  const [delegates, setDelegates] = useState<DelegateOption[]>([])
  const [loading, setLoading] = useState(true)
  
  const [availableDelegates, setAvailableDelegates] = useState<DelegateOption[]>([])
  const [loadingAvailable, setLoadingAvailable] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [listFilter, setListFilter] = useState('')
  const [sort, setSort] = useState<ListViewSortState>(DEFAULT_SORT)

  const [selectedAvailableDelegateId, setSelectedAvailableDelegateId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Načíst zástupce
  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        const data = await getLandlordDelegates(subjectId)
        if (cancelled) return
        setDelegates(data)
      } catch (e: any) {
        if (cancelled) return
        logger.error('getLandlordDelegates failed', e)
        toast.showError(e?.message ?? 'Chyba při načítání zástupců')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [subjectId, toast])

  // Načíst dostupné zástupce (pro výběr)
  useEffect(() => {
    if (mode === 'view') return // V read-only režimu nemusíme načítat dostupné zástupce
    
    let cancelled = false

    async function load() {
      try {
        setLoadingAvailable(true)
        const data = await getAvailableDelegates(searchText || undefined)
        if (cancelled) return
        setAvailableDelegates(data)
      } catch (e: any) {
        if (cancelled) return
        logger.error('getAvailableDelegates failed', e)
        // Nezobrazovat chybu, jen logovat
      } finally {
        if (!cancelled) setLoadingAvailable(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [searchText, mode])

  // Seřadit dostupné zástupce podle sort state
  const sortedAvailableDelegates = useMemo(() => {
    const filtered = availableDelegates.filter((d) => !delegates.find((existing) => existing.id === d.id)) // Vyloučit již přidané
    
    if (!sort) return filtered

    const sorted = [...filtered].sort((a, b) => {
      let aVal: string | number = ''
      let bVal: string | number = ''

      switch (sort.key) {
        case 'displayName':
          aVal = (a.displayName || '').toLowerCase()
          bVal = (b.displayName || '').toLowerCase()
          break
        case 'email':
          aVal = (a.email || '').toLowerCase()
          bVal = (b.email || '').toLowerCase()
          break
        case 'phone':
          aVal = (a.phone || '').toLowerCase()
          bVal = (b.phone || '').toLowerCase()
          break
        case 'type':
          aVal = (a.subjectType || '').toLowerCase()
          bVal = (b.subjectType || '').toLowerCase()
          break
        default:
          return 0
      }

      if (aVal < bVal) return sort.dir === 'asc' ? -1 : 1
      if (aVal > bVal) return sort.dir === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }, [availableDelegates, delegates, sort])

  // Přidat zástupce do seznamu
  const handleAdd = useCallback(async () => {
    if (mode === 'view') return
    if (!selectedAvailableDelegateId) {
      toast.showWarning('Vyber zástupce k přidání')
      return
    }

    // Kontrola, jestli už není přidaný
    if (delegates.find((d) => d.id === selectedAvailableDelegateId)) {
      toast.showWarning('Tento zástupce je již přidaný')
      return
    }

    try {
      setSaving(true)

      // Vložit do subject_delegates
      const { error } = await supabase
        .from('subject_delegates')
        .insert({
          subject_id: subjectId,
          delegate_subject_id: selectedAvailableDelegateId,
        })

      if (error) throw new Error(error.message)

      // Obnovit seznam
      const refreshed = await getLandlordDelegates(subjectId)
      setDelegates(refreshed)
      setSelectedAvailableDelegateId(null)
      toast.showSuccess('Zástupce přidán')
    } catch (e: any) {
      logger.error('addDelegate failed', e)
      toast.showError(e?.message ?? 'Chyba při přidávání zástupce')
    } finally {
      setSaving(false)
    }
  }, [selectedAvailableDelegateId, subjectId, delegates, mode, toast])

  // Odebrat zástupce
  const handleRemove = useCallback(
    async (delegateId: string) => {
      if (mode === 'view') return

      try {
        const { error } = await supabase
          .from('subject_delegates')
          .delete()
          .eq('subject_id', subjectId)
          .eq('delegate_subject_id', delegateId)

        if (error) throw new Error(error.message)

        // Obnovit seznam
        const refreshed = await getLandlordDelegates(subjectId)
        setDelegates(refreshed)
        toast.showSuccess('Zástupce odebrán')
      } catch (e: any) {
        logger.error('removeDelegate failed', e)
        toast.showError(e?.message ?? 'Chyba při odebírání zástupce')
      }
    },
    [subjectId, mode, toast]
  )

  // Přidat nového zástupce (otevřít formulář)
  const handleAddNewDelegate = useCallback(() => {
    if (onOpenNewDelegateForm) {
      onOpenNewDelegateForm('zastupce')
    }
  }, [onOpenNewDelegateForm])

  // Zpracování kliknutí na řádek v seznamu dostupných zástupců
  const handleAvailableDelegateClick = useCallback(
    (row: ListViewRow<DelegateOption>) => {
      if (mode === 'view') return
      const delegate = row.raw
      if (!delegate) return

      if (delegate.source === 'user' && onCreateDelegateFromUser) {
        // Uživatel - zobrazit potvrzení a přesměrovat na formulář pro vytvoření zástupce
        const confirmed = window.confirm(
          `Uživatel "${delegate.displayName}" není zástupce. Chcete vytvořit zástupce z tohoto uživatele? Formulář se otevře s předvyplněnými údaji.`
        )
        if (confirmed) {
          onCreateDelegateFromUser(delegate.id)
        }
      } else {
        // Zástupce - jednoduše vybrat
        setSelectedAvailableDelegateId(delegate.id)
      }
    },
    [mode, onCreateDelegateFromUser]
  )

  const readOnly = mode === 'view'

  // Převést dostupné zástupce na ListView řádky
  const availableDelegateRows: ListViewRow<DelegateOption>[] = useMemo(() => {
    return sortedAvailableDelegates.map((delegate) => ({
      id: delegate.id,
      data: {
        displayName: delegate.displayName || '—',
        email: delegate.email || '—',
        phone: delegate.phone || '—',
        type:
          delegate.source === 'user' && delegate.roleCode ? (
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Uživatel ({delegate.roleCode})</span>
          ) : (
            delegate.subjectType || '—'
          ),
      },
      raw: delegate,
      className: selectedAvailableDelegateId === delegate.id ? 'generic-type__row--selected' : '',
    }))
  }, [sortedAvailableDelegates, selectedAvailableDelegateId])

  // Převést zástupce na ListView řádky
  const delegateRows: ListViewRow<DelegateOption>[] = useMemo(() => {
    const norm = (v: any) => String(v ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const q = norm(listFilter)

    const filtered = q
      ? delegates.filter((delegate) => {
          return (
            norm(delegate.displayName).includes(q) ||
            norm(delegate.email).includes(q) ||
            norm(delegate.phone).includes(q) ||
            norm(delegate.subjectType).includes(q) ||
            norm(delegate.roleCode).includes(q)
          )
        })
      : delegates

    return filtered.map((delegate) => ({
      id: delegate.id,
      data: {
        displayName: delegate.displayName || '—',
        email: delegate.email || '—',
        phone: delegate.phone || '—',
        type:
          delegate.source === 'user' && delegate.roleCode ? (
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Uživatel ({delegate.roleCode})</span>
          ) : (
            delegate.subjectType || '—'
          ),
        actions: !readOnly ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleRemove(delegate.id)
            }}
            style={{
              padding: '4px 8px',
              border: '1px solid var(--color-error)',
              borderRadius: '4px',
              background: 'var(--color-surface)',
              color: 'var(--color-error)',
              cursor: 'pointer',
              fontSize: '12px',
            }}
            title="Odebrat zástupce"
          >
            {getIcon('delete' as IconKey)}
          </button>
        ) : null,
      },
      raw: delegate,
    }))
  }, [delegates, listFilter, readOnly, handleRemove])

  return (
    <div className="detail-form">
      {/* Seznam zástupců */}
      <section className="detail-form__section">
        <h3 className="detail-form__section-title">Seznam zástupců</h3>

        {loading && <div className="detail-form__hint">Načítám zástupce…</div>}

        {!loading && delegates.length === 0 && <div className="detail-form__hint">Zatím žádní zástupci.</div>}

        {!loading && delegates.length > 0 && (
          <ListView
            columns={DELEGATES_COLUMNS}
            rows={delegateRows}
            filterValue={listFilter}
            onFilterChange={setListFilter}
            emptyText="Žádní zástupci"
            selectedId={null}
            onRowClick={() => {}}
          />
        )}
      </section>

      {/* Vybrat zástupce */}
      {!readOnly && (
        <section className="detail-form__section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 className="detail-form__section-title">Vybrat zástupce</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              {/* Tlačítko Přidat (ikonka) */}
              <button
                type="button"
                onClick={handleAdd}
                disabled={saving || !selectedAvailableDelegateId}
                style={{
                  padding: '6px 12px',
                  border: '1px solid var(--color-primary)',
                  borderRadius: '8px',
                  background: 'var(--color-primary)',
                  color: 'white',
                  cursor: saving || !selectedAvailableDelegateId ? 'not-allowed' : 'pointer',
                  opacity: saving || !selectedAvailableDelegateId ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                title="Přidat vybraného zástupce"
              >
                <span>{getIcon('add' as IconKey)}</span>
                <span>{saving ? 'Ukládám…' : 'Přidat'}</span>
              </button>

              {/* Tlačítko Přidat nového zástupce (ikonka) */}
              <button
                type="button"
                onClick={handleAddNewDelegate}
                style={{
                  padding: '6px 12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  background: 'var(--color-surface)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                title="Přidat nového zástupce"
              >
                <span>{getIcon('add' as IconKey)}</span>
                <span>Nový zástupce</span>
              </button>
            </div>
          </div>

          {loadingAvailable ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Načítání zástupců...</div>
          ) : availableDelegateRows.length > 0 ? (
            <ListView
              columns={AVAILABLE_DELEGATES_COLUMNS}
              rows={availableDelegateRows}
              filterValue={searchText}
              onFilterChange={setSearchText}
              filterPlaceholder="Hledat zástupce..."
              emptyText={searchText ? 'Žádní zástupci nenalezeni' : 'Žádní dostupní zástupci'}
              selectedId={selectedAvailableDelegateId}
              onRowClick={handleAvailableDelegateClick}
              sort={sort}
              onSortChange={setSort}
            />
          ) : (
            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              {searchText ? 'Žádní zástupci nenalezeni' : 'Žádní dostupní zástupci'}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
