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
  placeId?: string  // Google Places ID pro načtení detailů včetně PSČ
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
 * Vrací pole návrhů a informaci o mock mode
 */
async function searchRuianAddresses(query: string): Promise<{ suggestions: AddressSuggestion[]; isMock: boolean }> {
  if (!query || query.trim().length < 3) {
    return { suggestions: [], isMock: false }
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
      return { suggestions: [], isMock: false }
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
    
    // Zkontroluj mock mode
    const debugMode = response.headers.get('X-Debug-Mode')
    const debugMessage = response.headers.get('X-Debug-Message')
    const isMock = debugMode === 'mock'
    if (isMock) {
      console.log('ℹ️ Using mock data:', debugMessage)
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
      return { 
        suggestions: data.filter((r: AddressSuggestion) => r.fullAddress.trim().length > 0),
        isMock 
      }
    }

    return { suggestions: [], isMock }
  } catch (error) {
    console.error('❌ Error fetching RÚIAN addresses:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    return { suggestions: [], isMock: false }
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
  // Sestavit query z aktuálních hodnot ve formátu: "Ulice ČísloPopisné, PSČ Město"
  const buildQuery = () => {
    // Formát: "Čs. armády 514, 41108 Štětí"
    const streetPart = [street, houseNumber].filter(Boolean).join(' ')
    const cityPart = [zip, city].filter(Boolean).join(' ')
    
    if (streetPart && cityPart) {
      return `${streetPart}, ${cityPart}`
    }
    if (streetPart) return streetPart
    if (cityPart) return cityPart
    return ''
  }

  const [query, setQuery] = useState(buildQuery())
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isMockMode, setIsMockMode] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Aktualizovat query když se změní props (např. z ARES API)
  useEffect(() => {
    const newQuery = buildQuery()
    if (newQuery && newQuery !== query) {
      console.log('🔄 Updating query from props:', newQuery)
      setQuery(newQuery)
    }
  }, [street, city, zip, houseNumber])

  // Načíst návrhy při změně query
  useEffect(() => {
    if (!query || query.trim().length < 3 || country !== 'CZ') {
      setSuggestions([])
      setIsOpen(false)
      setLoading(false)
      setIsMockMode(false)
      return
    }

    let cancelled = false

    async function loadSuggestions() {
      setLoading(true)
      setIsOpen(false) // Skrýt předchozí výsledky během načítání
      try {
        console.log('🔍 Loading suggestions for query:', query)
        
        const { suggestions: results, isMock } = await searchRuianAddresses(query)
        setIsMockMode(isMock)
        
        console.log('✅ Received', results.length, 'suggestions', isMock ? '(mock data)' : '')
        
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

  const handleSuggestionClick = async (suggestion: AddressSuggestion) => {
    console.log('📍 Clicked suggestion:', suggestion)
    
    // Pokud máme place_id, načíst kompletní detaily včetně PSČ
    if (suggestion.placeId) {
      try {
        console.log('🔄 Fetching place details for placeId:', suggestion.placeId)
        const response = await fetch(`/api/place-details?place_id=${encodeURIComponent(suggestion.placeId)}`)
        
        if (!response.ok) {
          console.error('❌ Failed to fetch place details:', response.status)
          throw new Error('Failed to fetch place details')
        }
        
        const details = await response.json()
        console.log('✅ Place details received:', details)
        
        onAddressChange({
          street: details.street || suggestion.street,
          city: details.city || suggestion.city,
          zip: details.zip || suggestion.zip,
          houseNumber: details.houseNumber || suggestion.houseNumber,
          country: details.country || country || 'CZ',
        })
        
        setQuery(details.fullAddress || suggestion.fullAddress)
        setIsOpen(false)
        return
      } catch (error) {
        console.error('❌ Error fetching place details:', error)
        // Fallback na původní data ze suggestion
      }
    }
    
    // Fallback: použít data ze suggestions (pokud place_id není nebo selhalo)
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

  return (
    <div className={`address-autocomplete ${className}`} style={{ position: 'relative', width: '100%' }}>
      <input
        ref={inputRef}
        type="text"
        className={className || 'detail-form__input'}
        value={query}
        onChange={handleInputChange}

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

      {/* Info zpráva pokud autocomplete nefunguje */}
      {country === 'CZ' && !loading && query.trim().length >= 3 && suggestions.length === 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            padding: '8px 12px',
            backgroundColor: 'var(--color-surface, #fff)',
            border: '1px solid var(--color-border-soft, #e5e7eb)',
            borderRadius: '4px',
            fontSize: '0.875rem',
            color: 'var(--color-text-soft, #6b7280)',
            zIndex: 1000,
          }}
        >
          {isMockMode 
            ? 'Mock data nenalezena. Vyplňte adresu ručně níže.'
            : 'Autocomplete adres momentálně není k dispozici. Prosím vyplňte adresu ručně.'
          }
        </div>
      )}

      {/* Mock mode indikátor */}
      {isMockMode && isOpen && suggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            padding: '4px 8px',
            backgroundColor: 'var(--color-warning-soft, #fff3cd)',
            border: '1px solid var(--color-warning, #ffc107)',
            borderRadius: '4px',
            fontSize: '0.75rem',
            color: 'var(--color-warning-dark, #856404)',
            zIndex: 999,
          }}
        >
          ⚠️ Testovací data - Nakonfigurujte Google Places API pro skutečné adresy
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

