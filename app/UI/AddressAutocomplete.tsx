// FILE: app/UI/AddressAutocomplete.tsx
// PURPOSE: Autocomplete komponenta pro adresy pomocí RÚIAN API (ČÚZK)

'use client'

import React, { useEffect, useRef, useState } from 'react'

export type AddressSuggestion = {
  street: string
  city: string
  zip: string
  houseNumber: string
  ruianId?: string
  fullAddress: string
}

export type AddressAutocompleteProps = {
  street: string
  city: string
  zip: string
  houseNumber: string
  country: string
  onAddressChange: (address: {
    street: string
    city: string
    zip: string
    houseNumber: string
    country: string
  }) => void
  disabled?: boolean
  className?: string
  placeholder?: string
}

/**
 * RÚIAN API endpoint pro autocomplete
 * Používáme Next.js API route jako proxy (řeší CORS problémy)
 */
const API_ROUTE = '/api/address-search'

/**
 * Funkce pro vyhledávání adres v RÚIAN
 * 
 * POZNÁMKA: Tato funkce je připravená pro integraci s RÚIAN API.
 * V produkci bude potřeba:
 * 1. Zaregistrovat se u poskytovatele RÚIAN API (např. fnx.io, ASAPI, Visidoo)
 * 2. Získat API klíč
 * 3. Upravit endpoint a přidat autentizaci
 * 4. Upravit transformaci dat podle formátu API
 */
async function searchRuianAddresses(query: string): Promise<AddressSuggestion[]> {
  if (!query || query.trim().length < 3) {
    return []
  }

  const trimmedQuery = query.trim()
  console.log('🔍 Searching RÚIAN addresses for:', trimmedQuery)

  try {
    // Použijeme Next.js API route jako proxy (řeší CORS problémy)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 sekund timeout
    
    const response = await fetch(`${API_ROUTE}?q=${encodeURIComponent(trimmedQuery)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error('❌ API route returned:', response.status, response.statusText)
      const errorData = await response.json().catch(() => ({}))
      console.error('Error data:', errorData)
      return []
    }

    // Zkontrolujme debug headers z API route
    const debugErrors = response.headers.get('X-Debug-Errors')
    if (debugErrors) {
      try {
        const errors = JSON.parse(debugErrors)
        console.error('❌ API route debug errors:', errors)
      } catch (e) {
        console.warn('⚠️ Could not parse debug errors:', debugErrors)
      }
    }

    const data = await response.json()
    console.log('✅ API response:', data)
    console.log('Data type:', Array.isArray(data) ? 'array' : typeof data)
    console.log('Results count:', Array.isArray(data) ? data.length : 0)
    
    if (Array.isArray(data) && data.length === 0 && debugErrors) {
      console.warn('⚠️ No results found - check server logs for details')
    }

    // API route už vrací transformovaná data ve správném formátu
    if (Array.isArray(data)) {
      return data.filter((r: AddressSuggestion) => r.fullAddress.trim().length > 0)
    }

    return []
  } catch (error) {
    console.error('❌ Error fetching RÚIAN addresses:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    return []
  }
}

export default function AddressAutocomplete({
  street,
  city,
  zip,
  houseNumber,
  country,
  onAddressChange,
  disabled = false,
  className = '',
  placeholder = 'Začněte psát adresu...',
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Sestavit query z aktuálních hodnot
  const buildQuery = () => {
    const parts = [street, city, zip, houseNumber].filter(Boolean)
    return parts.join(' ')
  }

  // Načíst návrhy při změně query
  useEffect(() => {
    if (!query || query.trim().length < 3 || country !== 'CZ') {
      setSuggestions([])
      setIsOpen(false)
      setLoading(false)
      return
    }

    let cancelled = false

    async function loadSuggestions() {
      setLoading(true)
      setIsOpen(false) // Skrýt předchozí výsledky během načítání
      try {
        console.log('🔍 Loading suggestions for query:', query)
        const results = await searchRuianAddresses(query)
        console.log('✅ Received', results.length, 'suggestions')
        
        if (!cancelled) {
          setSuggestions(results)
          setIsOpen(results.length > 0)
          if (results.length === 0) {
            console.warn('⚠️ No suggestions found for query:', query)
          }
        }
      } catch (error) {
        console.error('❌ Error loading address suggestions:', error)
        if (!cancelled) {
          setSuggestions([])
          setIsOpen(false)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    const timeoutId = setTimeout(loadSuggestions, 500) // Debounce 500ms (zvýšeno z 300ms)

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
      setLoading(false)
    }
  }, [query, country])

  // Zavřít dropdown při kliknutí mimo
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)

    // Pokud uživatel ručně edituje, aktualizovat hodnoty
    if (value.trim().length < 3) {
      setIsOpen(false)
    }
  }

  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    onAddressChange({
      street: suggestion.street,
      city: suggestion.city,
      zip: suggestion.zip,
      houseNumber: suggestion.houseNumber,
      country: country || 'CZ',
    })

    setQuery(suggestion.fullAddress)
    setIsOpen(false)
  }

  const handleInputFocus = () => {
    const currentQuery = buildQuery()
    if (currentQuery.trim().length >= 3) {
      setQuery(currentQuery)
    }
  }

  return (
    <div className={`address-autocomplete ${className}`} style={{ position: 'relative', width: '100%' }}>
      <input
        ref={inputRef}
        type="text"
        className={className || 'detail-form__input'}
        value={query || buildQuery()}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        style={{ width: '100%' }}
      />

      {loading && (
        <div 
          className="address-autocomplete__loading" 
          style={{ 
            position: 'absolute', 
            right: country === 'CZ' ? '32px' : '8px', // Posunout doprava, pokud je tam tlačítko X
            top: '50%', 
            transform: 'translateY(-50%)',
            fontSize: '0.875rem',
            color: 'var(--color-text-soft, #6b7280)',
            pointerEvents: 'none',
          }}
        >
          Načítám...
        </div>
      )}

      {isOpen && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="address-autocomplete__suggestions"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            backgroundColor: 'var(--color-surface, #fff)',
            border: '1px solid var(--color-border-soft, #e5e7eb)',
            borderRadius: '4px',
            maxHeight: '300px',
            overflowY: 'auto',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            marginTop: '4px',
          }}
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 12px',
                textAlign: 'left',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-primary-soft, #f3f4f6)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <div style={{ fontWeight: 500 }}>{suggestion.fullAddress}</div>
              {suggestion.ruianId && (
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-soft, #6b7280)', marginTop: '2px' }}>
                  RÚIAN ID: {suggestion.ruianId}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Tlačítko pro ruční vyplnění (skrýt autocomplete) */}
      {country === 'CZ' && !loading && (
        <button
          type="button"
          onClick={() => {
            setIsOpen(false)
            setQuery('')
            setSuggestions([])
          }}
          style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
            color: 'var(--color-text-soft, #6b7280)',
            zIndex: 1,
          }}
          title="Vyplnit ručně"
        >
          ✕
        </button>
      )}
    </div>
  )
}

