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

  const trimmedQuery = query.trim()
  console.log('🔍 Searching RÚIAN addresses for:', trimmedQuery)

  try {
    // API klíč z environment variables nebo fallback na hardcoded klíč
    const apiKey = process.env.NEXT_PUBLIC_RUIAN_API_KEY || 'c24d82cff9e807c08544e149c2a1dc4d11600c49589704d6d7b49ce4cbca50c8'
    
    let response: Response | null = null
    let lastError: Error | null = null
    let successfulEndpoint: string | null = null
    
    // Zkusíme několik možností endpointu a formátu
    // 1. Veřejné API (skaut.cz) - bez API klíče (zkusíme jako první)
    // 2. Fnx.io API - s API klíčem
    const endpointConfigs: Array<{ url: string; headers: Record<string, string>; name: string }> = [
      // Veřejné API (skaut.cz) - formát: /api/v1/search?q={query}
      { 
        name: 'skaut.cz public API',
        url: `${RUIAN_API_BASE_PUBLIC}?q=${encodeURIComponent(trimmedQuery)}`, 
        headers: { 'Accept': 'application/json' } 
      },
      // Fnx.io API - formát: /api/v1/address?q={query}&apiKey={key}
      { 
        name: 'fnx.io API (query param)',
        url: `${RUIAN_API_BASE_FNX}?q=${encodeURIComponent(trimmedQuery)}&limit=10&apiKey=${apiKey}`, 
        headers: { 'Accept': 'application/json' } 
      },
      // Alternativní formát s Bearer tokenem
      { 
        name: 'fnx.io API (Bearer)',
        url: `${RUIAN_API_BASE_FNX}?q=${encodeURIComponent(trimmedQuery)}&limit=10`, 
        headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${apiKey}` } 
      },
      // Alternativní formát s X-API-Key headerem
      { 
        name: 'fnx.io API (X-API-Key)',
        url: `${RUIAN_API_BASE_FNX}?q=${encodeURIComponent(trimmedQuery)}&limit=10`, 
        headers: { 'Accept': 'application/json', 'X-API-Key': apiKey } 
      },
    ]
    
    // Zkusíme každý endpoint s timeoutem 5 sekund
    for (const config of endpointConfigs) {
      try {
        console.log(`🔄 Trying endpoint: ${config.name}`, config.url)
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 sekund timeout
        
        response = await fetch(config.url, {
          method: 'GET',
          headers: config.headers,
          signal: controller.signal,
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          successfulEndpoint = config.name
          console.log(`✅ Success with endpoint: ${config.name}`, response.status)
          break
        } else {
          console.warn(`❌ Endpoint ${config.name} returned:`, response.status, response.statusText)
          const text = await response.text()
          console.warn(`Response body:`, text.substring(0, 200))
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.warn(`⏱️ Timeout for endpoint: ${config.name}`)
        } else {
          console.warn(`❌ Error for endpoint ${config.name}:`, error.message)
        }
        lastError = error as Error
        continue
      }
    }
    
    if (!response || !response.ok) {
      console.error('❌ All RÚIAN API endpoints failed')
      console.error('Last error:', lastError?.message)
      console.error('Tried endpoints:', endpointConfigs.map(c => `${c.name}: ${c.url}`))
      return []
    }

    const contentType = response.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      const text = await response.text()
      console.error('❌ API returned non-JSON response:', contentType)
      console.error('Response text:', text.substring(0, 500))
      return []
    }

    const data = await response.json()
    console.log(`✅ API response from ${successfulEndpoint}:`, data)
    console.log('Data type:', Array.isArray(data) ? 'array' : typeof data)
    console.log('Data keys:', data && typeof data === 'object' ? Object.keys(data) : 'N/A')

    // Transformace dat z RÚIAN API do našeho formátu
    // Formát odpovědi se může lišit - upravte podle skutečného formátu API
    let results: AddressSuggestion[] = []

    // Pokud API vrací přímo pole
    if (Array.isArray(data)) {
      console.log(`📦 Parsing array with ${data.length} items`)
      results = data.map((item: any, index: number) => {
        const suggestion = {
          street: item.streetName || item.street || item.nazev_ulice || item.ulice || '',
          city: item.cityName || item.city || item.nazev_obce || item.mesto || '',
          zip: item.zipCode || item.zip || item.psc || '',
          houseNumber: item.houseNumber || item.house_number || item.cislo_domovni || item.cislo_popisne || '',
          ruianId: item.id?.toString() || item.ruianId?.toString() || item.id_adm || '',
          fullAddress: [
            item.streetName || item.street || item.nazev_ulice || item.ulice,
            item.houseNumber || item.house_number || item.cislo_domovni || item.cislo_popisne,
            item.cityName || item.city || item.nazev_obce || item.mesto,
            item.zipCode || item.zip || item.psc,
          ]
            .filter(Boolean)
            .join(', '),
        }
        if (index < 3) console.log(`  Item ${index}:`, item, '→', suggestion)
        return suggestion
      })
    }
    // Pokud API vrací objekt s daty
    else if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
      console.log(`📦 Parsing object.data array with ${data.data.length} items`)
      results = data.data.map((item: any, index: number) => {
        const suggestion = {
          street: item.streetName || item.street || item.nazev_ulice || item.ulice || '',
          city: item.cityName || item.city || item.nazev_obce || item.mesto || '',
          zip: item.zipCode || item.zip || item.psc || '',
          houseNumber: item.houseNumber || item.house_number || item.cislo_domovni || item.cislo_popisne || '',
          ruianId: item.id?.toString() || item.ruianId?.toString() || item.id_adm || '',
          fullAddress: [
            item.streetName || item.street || item.nazev_ulice || item.ulice,
            item.houseNumber || item.house_number || item.cislo_domovni || item.cislo_popisne,
            item.cityName || item.city || item.nazev_obce || item.mesto,
            item.zipCode || item.zip || item.psc,
          ]
            .filter(Boolean)
            .join(', '),
        }
        if (index < 3) console.log(`  Item ${index}:`, item, '→', suggestion)
        return suggestion
      })
    }
    // Pokud API vrací objekt s results
    else if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
      console.log(`📦 Parsing object.results array with ${data.results.length} items`)
      results = data.results.map((item: any, index: number) => {
        const suggestion = {
          street: item.streetName || item.street || item.nazev_ulice || item.ulice || '',
          city: item.cityName || item.city || item.nazev_obce || item.mesto || '',
          zip: item.zipCode || item.zip || item.psc || '',
          houseNumber: item.houseNumber || item.house_number || item.cislo_domovni || item.cislo_popisne || '',
          ruianId: item.id?.toString() || item.ruianId?.toString() || item.id_adm || '',
          fullAddress: [
            item.streetName || item.street || item.nazev_ulice || item.ulice,
            item.houseNumber || item.house_number || item.cislo_domovni || item.cislo_popisne,
            item.cityName || item.city || item.nazev_obce || item.mesto,
            item.zipCode || item.zip || item.psc,
          ]
            .filter(Boolean)
            .join(', '),
        }
        if (index < 3) console.log(`  Item ${index}:`, item, '→', suggestion)
        return suggestion
      })
    }
    else {
      console.warn('⚠️ Unexpected API response format:', data)
      console.warn('Trying to extract any array from response...')
      // Zkusíme najít jakoukoli pole v objektu
      for (const key in data) {
        if (Array.isArray(data[key]) && data[key].length > 0) {
          console.log(`Found array in key "${key}" with ${data[key].length} items`)
          results = data[key].slice(0, 10).map((item: any) => ({
            street: item.streetName || item.street || item.nazev_ulice || item.ulice || '',
            city: item.cityName || item.city || item.nazev_obce || item.mesto || '',
            zip: item.zipCode || item.zip || item.psc || '',
            houseNumber: item.houseNumber || item.house_number || item.cislo_domovni || item.cislo_popisne || '',
            ruianId: item.id?.toString() || item.ruianId?.toString() || item.id_adm || '',
            fullAddress: [
              item.streetName || item.street || item.nazev_ulice || item.ulice,
              item.houseNumber || item.house_number || item.cislo_domovni || item.cislo_popisne,
              item.cityName || item.city || item.nazev_obce || item.mesto,
              item.zipCode || item.zip || item.psc,
            ]
              .filter(Boolean)
              .join(', '),
          }))
          break
        }
      }
    }

    console.log(`✅ Parsed ${results.length} suggestions`)
    return results.filter(r => r.fullAddress.trim().length > 0) // Filtrujeme prázdné výsledky
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

