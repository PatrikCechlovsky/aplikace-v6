// FILE: app/UI/detail-sections/DelegatesSection.tsx
// PURPOSE: Sekce pro zobrazení a správu zástupců

'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { getAvailableDelegates, getLandlordDelegates, type DelegateOption } from '@/app/lib/services/landlords'
import { supabase } from '@/app/lib/supabaseClient'
import { useToast } from '@/app/UI/Toast'
import createLogger from '@/app/lib/logger'
const logger = createLogger('DelegatesSection')

type Props = {
  subjectId: string
  mode?: 'view' | 'edit'
  onCreateDelegateFromUser?: (userId: string) => void // Callback pro vytvoření zástupce z uživatele
}

export default function DelegatesSection({ subjectId, mode = 'edit', onCreateDelegateFromUser }: Props) {
  const toast = useToast()
  const [delegates, setDelegates] = useState<DelegateOption[]>([])
  const [loading, setLoading] = useState(true)
  
  const [availableDelegates, setAvailableDelegates] = useState<DelegateOption[]>([])
  const [loadingAvailable, setLoadingAvailable] = useState(false)
  const [searchText, setSearchText] = useState('')

  const [selectedDelegateId, setSelectedDelegateId] = useState<string | null>(null)
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

  // Přidat zástupce
  const handleAdd = useCallback(() => {
    if (mode === 'view') return
    setSelectedDelegateId(null)
  }, [mode])

  // Přidat zástupce do seznamu
  const handleSave = useCallback(async () => {
    if (mode === 'view') return
    if (!selectedDelegateId) {
      toast.showWarning('Vyber zástupce k přidání')
      return
    }

    // Kontrola, jestli už není přidaný
    if (delegates.find((d) => d.id === selectedDelegateId)) {
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
          delegate_subject_id: selectedDelegateId,
        })

      if (error) throw new Error(error.message)

      // Obnovit seznam
      const refreshed = await getLandlordDelegates(subjectId)
      setDelegates(refreshed)
      setSelectedDelegateId(null)
      toast.showSuccess('Zástupce přidán')
    } catch (e: any) {
      logger.error('addDelegate failed', e)
      toast.showError(e?.message ?? 'Chyba při přidávání zástupce')
    } finally {
      setSaving(false)
    }
  }, [selectedDelegateId, subjectId, delegates, mode, toast])

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

  const readOnly = mode === 'view'

  return (
    <div className="detail-form">
      {/* Seznam zástupců */}
      <section className="detail-form__section">
        <h3 className="detail-form__section-title">Seznam zástupců</h3>

        {loading && <div className="detail-form__hint">Načítám zástupce…</div>}

        {!loading && delegates.length === 0 && <div className="detail-form__hint">Zatím žádní zástupci.</div>}

        {!loading && delegates.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Jméno</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Email</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Telefon</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Typ</th>
                  {!readOnly && <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Akce</th>}
                </tr>
              </thead>
              <tbody>
                {delegates.map((delegate) => (
                  <tr
                    key={delegate.id}
                    style={{
                      cursor: readOnly ? 'default' : 'pointer',
                      borderBottom: '1px solid var(--color-border-soft)',
                      backgroundColor: selectedDelegateId === delegate.id ? 'var(--color-primary-soft)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '8px' }}>{delegate.displayName || '—'}</td>
                    <td style={{ padding: '8px' }}>{delegate.email || '—'}</td>
                    <td style={{ padding: '8px' }}>{delegate.phone || '—'}</td>
                    <td style={{ padding: '8px' }}>
                      {delegate.source === 'user' && delegate.roleCode ? `Uživatel (${delegate.roleCode})` : delegate.subjectType || '—'}
                    </td>
                    {!readOnly && (
                      <td style={{ padding: '8px' }}>
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
                        >
                          Odebrat
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Formulář pro přidání zástupce */}
      {!readOnly && (
        <section className="detail-form__section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 className="detail-form__section-title">Formulář</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={handleAdd}
                style={{
                  padding: '6px 12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  background: 'var(--color-surface)',
                  cursor: 'pointer',
                }}
              >
                Přidat
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !selectedDelegateId}
                style={{
                  padding: '6px 12px',
                  border: '1px solid var(--color-primary)',
                  borderRadius: '8px',
                  background: 'var(--color-primary)',
                  color: 'white',
                  cursor: saving || !selectedDelegateId ? 'not-allowed' : 'pointer',
                  opacity: saving || !selectedDelegateId ? 0.5 : 1,
                }}
              >
                {saving ? 'Ukládám…' : 'Uložit'}
              </button>
            </div>
          </div>

          <div className="detail-form__grid detail-form__grid--narrow">
            <div className="detail-form__field detail-form__field--span-2">
              <label className="detail-form__label">
                Zástupce <span className="detail-form__required">*</span>
              </label>
              {/* Vyhledávání */}
              <input
                className="detail-form__input"
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Hledat zástupce..."
                style={{ marginBottom: '0.5rem' }}
              />
              {/* Seznam dostupných zástupců */}
              {loadingAvailable ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Načítání zástupců...</div>
              ) : availableDelegates.length > 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    border: '1px solid var(--color-border)',
                    borderRadius: '4px',
                    padding: '0.75rem',
                  }}
                >
                  {availableDelegates
                    .filter((d) => !delegates.find((existing) => existing.id === d.id)) // Vyloučit již přidané
                    .map((delegate) => {
                      const isSelected = selectedDelegateId === delegate.id
                      return (
                        <label
                          key={delegate.id}
                          style={{
                            display: 'flex',
                            gap: '0.75rem',
                            alignItems: 'flex-start',
                            padding: '0.5rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            backgroundColor: isSelected ? 'var(--color-primary-soft)' : 'transparent',
                          }}
                          onClick={() => {
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
                              setSelectedDelegateId(delegate.id)
                            }
                          }}
                        >
                          <input
                            type="radio"
                            name="delegate-select"
                            checked={isSelected}
                            onChange={() => setSelectedDelegateId(delegate.id)}
                            style={{ marginTop: '0.25rem' }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: isSelected ? 600 : 400 }}>
                              {delegate.displayName}
                              {delegate.source === 'user' && delegate.roleCode && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}>
                                  ({delegate.roleCode})
                                </span>
                              )}
                            </div>
                            {delegate.email && (
                              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{delegate.email}</div>
                            )}
                            {delegate.phone && (
                              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{delegate.phone}</div>
                            )}
                          </div>
                        </label>
                      )
                    })}
                </div>
              ) : (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  {searchText ? 'Žádní zástupci nenalezeni' : 'Žádní dostupní zástupci'}
                </div>
              )}
              {/* Tlačítko pro přidání nového zástupce */}
              <button
                type="button"
                className="detail-form__button"
                onClick={() => {
                  // Otevřít novou kartu pro vytvoření zástupce
                  window.location.href = '/modules/030-pronajimatel?t=landlords-list&id=new&vm=create&type=zastupce'
                }}
                style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}
              >
                + Přidat nového zástupce
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

