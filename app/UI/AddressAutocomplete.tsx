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
 * Používáme veřejné REST API: https://github.com/jindrichskupa/ruian-api
 * 
 * Veřejný endpoint (bez API klíče):
 * - https://ruian-api.skaut.cz/api/v1/search
 * 
 * Nebo RUIAN API od fnx.io (vyžaduje API klíč):
 * - https://ruian.fnx.io/api/v1/address
 * - API klíč: c24d82cff9e807c08544e149c2a1dc4d11600c49589704d6d7b49ce4cbca50c8
 */
const RUIAN_API_BASE_PUBLIC = 'https://ruian-api.skaut.cz/api/v1/search'
const RUIAN_API_BASE_FNX = 'https://ruian.fnx.io/api/v1/address'

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

  try {
    // API klíč z environment variables nebo fallback na hardcoded klíč
    const apiKey = process.env.NEXT_PUBLIC_RUIAN_API_KEY || 'c24d82cff9e807c08544e149c2a1dc4d11600c49589704d6d7b49ce4cbca50c8'
    
    // RUIAN API od fnx.io - endpoint pro vyhledávání adres
    // Dokumentace: https://ruian.fnx.io/
    // Zkusíme více formátů endpointu a autentizace
    let response: Response | null = null
    let lastError: Error | null = null
    
    // Zkusíme několik možností endpointu a formátu
    // 1. Veřejné API (skaut.cz) - bez API klíče
    // 2. Fnx.io API - s API klíčem
    const endpointConfigs: Array<{ url: string; headers: Record<string, string> }> = [
      // Veřejné API (skaut.cz) - formát: /api/v1/search?q={query}
      { url: `${RUIAN_API_BASE_PUBLIC}?q=${encodeURIComponent(query)}`, headers: { 'Accept': 'application/json' } },
      // Fnx.io API - formát: /api/v1/address?q={query}&apiKey={key}
      { url: `${RUIAN_API_BASE_FNX}?q=${encodeURIComponent(query)}&limit=10&apiKey=${apiKey}`, headers: { 'Accept': 'application/json' } },
      // Alternativní formát s Bearer tokenem
      { url: `${RUIAN_API_BASE_FNX}?q=${encodeURIComponent(query)}&limit=10`, headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${apiKey}` } },
      // Alternativní formát s X-API-Key headerem
      { url: `${RUIAN_API_BASE_FNX}?q=${encodeURIComponent(query)}&limit=10`, headers: { 'Accept': 'application/json', 'X-API-Key': apiKey } },
    ]
    
    for (const config of endpointConfigs) {
      try {
        response = await fetch(config.url, {
          method: 'GET',
          headers: config.headers,
        })
        
        if (response.ok) {
          break
        }
      } catch (error) {
        lastError = error as Error
        continue
      }
    }
    
    if (!response || !response.ok) {
      console.warn('RÚIAN API error:', response?.status, response?.statusText, lastError?.message)
      console.warn('Zkoušené endpointy:', endpointConfigs.map(c => c.url))
      return []
    }

    const data = await response.json()
    console.log('RÚIAN API response:', data) // Debug log

    // Transformace dat z RÚIAN API do našeho formátu
    // Formát odpovědi se může lišit - upravte podle skutečného formátu API
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        street: item.streetName || item.street || item.nazev_ulice || '',
        city: item.cityName || item.city || item.nazev_obce || '',
        zip: item.zipCode || item.zip || item.psc || '',
        houseNumber: item.houseNumber || item.house_number || item.cislo_domovni || '',
        ruianId: item.id?.toString() || item.ruianId?.toString() || item.id_adm || '',
        fullAddress: [
          item.streetName || item.street || item.nazev_ulice,
          item.houseNumber || item.house_number || item.cislo_domovni,
          item.cityName || item.city || item.nazev_obce,
          item.zipCode || item.zip || item.psc,
        ]
          .filter(Boolean)
          .join(', '),
      }))
    }

    // Pokud API vrací objekt s daty
    if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
      return data.data.map((item: any) => ({
        street: item.streetName || item.street || item.nazev_ulice || '',
        city: item.cityName || item.city || item.nazev_obce || '',
        zip: item.zipCode || item.zip || item.psc || '',
        houseNumber: item.houseNumber || item.house_number || item.cislo_domovni || '',
        ruianId: item.id?.toString() || item.ruianId?.toString() || item.id_adm || '',
        fullAddress: [
          item.streetName || item.street || item.nazev_ulice,
          item.houseNumber || item.house_number || item.cislo_domovni,
          item.cityName || item.city || item.nazev_obce,
          item.zipCode || item.zip || item.psc,
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

