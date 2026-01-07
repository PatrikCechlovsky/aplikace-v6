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
 * Dokumentace: https://api.cuzk.cz/
 */
const RUIAN_API_BASE = 'https://api.cuzk.cz/v1/address'

/**
 * Funkce pro vyhledávání adres v RÚIAN
 */
async function searchRuianAddresses(query: string): Promise<AddressSuggestion[]> {
  if (!query || query.trim().length < 3) {
    return []
  }

  try {
    // RÚIAN API pro vyhledávání adres
    // Formát: https://api.cuzk.cz/v1/address?q={query}&limit=10
    const response = await fetch(`${RUIAN_API_BASE}?q=${encodeURIComponent(query)}&limit=10`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.warn('RÚIAN API error:', response.status, response.statusText)
      return []
    }

    const data = await response.json()

    // Transformace dat z RÚIAN API do našeho formátu
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        street: item.streetName || '',
        city: item.cityName || '',
        zip: item.zipCode || '',
        houseNumber: item.houseNumber || '',
        ruianId: item.id?.toString(),
        fullAddress: [
          item.streetName,
          item.houseNumber,
          item.cityName,
          item.zipCode,
        ]
          .filter(Boolean)
          .join(', '),
      }))
    }

    return []
  } catch (error) {
    console.error('Error fetching RÚIAN addresses:', error)
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
      return
    }

    let cancelled = false

    async function loadSuggestions() {
      setLoading(true)
      try {
        const results = await searchRuianAddresses(query)
        if (!cancelled) {
          setSuggestions(results)
          setIsOpen(results.length > 0)
        }
      } catch (error) {
        console.error('Error loading address suggestions:', error)
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

    const timeoutId = setTimeout(loadSuggestions, 300) // Debounce 300ms

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
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
    <div className={`address-autocomplete ${className}`} style={{ position: 'relative' }}>
      <input
        ref={inputRef}
        type="text"
        className="detail-form__input"
        value={query || buildQuery()}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
      />

      {loading && (
        <div className="address-autocomplete__loading" style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)' }}>
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
      {country === 'CZ' && (
        <button
          type="button"
          onClick={() => {
            setIsOpen(false)
            setQuery('')
          }}
          style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.75rem',
            color: 'var(--color-text-soft, #6b7280)',
          }}
          title="Vyplnit ručně"
        >
          ✕
        </button>
      )}
    </div>
  )
}

