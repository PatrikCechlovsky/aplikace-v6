/*
 * FILE: app/api/address-search/route.ts
 * PURPOSE: Proxy API route pro RÚIAN address autocomplete (řeší CORS problémy)
 */

import { NextRequest, NextResponse } from 'next/server'

// Node.js runtime - potřebujeme setTimeout a další Node.js API
export const runtime = 'nodejs'

/**
 * Proxy endpoint pro vyhledávání adres v RÚIAN
 * Řeší CORS problémy tím, že volá API z serveru
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query || query.trim().length < 3) {
      return NextResponse.json(
        { error: 'Query must be at least 3 characters long' },
        { status: 400 }
      )
    }

    const trimmedQuery = query.trim()
    
    // API klíče z environment variables
    // Preferovat server-only klíče (bez NEXT_PUBLIC_)
    const googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
    const visidooApiKey = process.env.VISIDOO_API_KEY || process.env.NEXT_PUBLIC_VISIDOO_API_KEY
    const ruianApiKey = process.env.RUIAN_API_KEY || process.env.NEXT_PUBLIC_RUIAN_API_KEY

    // Debug: Zkontroluj, zda máme API klíče
    console.log('[API Route] Address search request for:', trimmedQuery)
    console.log('[API Route] API keys available:')
    console.log('  - Google Places:', googlePlacesApiKey ? 'YES' : 'NO')
    console.log('  - Visidoo:', visidooApiKey ? 'YES' : 'NO')
    console.log('  - RÚIAN:', ruianApiKey ? 'YES' : 'NO')

    // Priorita: Google Places > Visidoo > ostatní RÚIAN endpointy
    const endpoints: Array<{ name: string; url: string; headers: Record<string, string> }> = []
    
    // 1. Google Places API (nejspolehlivější)
    // Registrace: https://console.cloud.google.com/google/maps-apis
    // Dokumentace: https://developers.google.com/maps/documentation/places/web-service/autocomplete
    if (googlePlacesApiKey) {
      endpoints.push({
        name: 'google-places',
        url: `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(trimmedQuery)}&components=country:cz&key=${googlePlacesApiKey}&language=cs`,
        headers: { 
          'Accept': 'application/json',
          'User-Agent': 'Next.js/14',
        },
      })
    }
    
    // 2. Visidoo API (nejlepší pro české adresy - RÚIAN)
    // Registrace: https://www.visidoo.cz/docs/autocomplete
    // Dokumentace: https://www.visidoo.cz/docs/autocomplete
    if (visidooApiKey) {
      endpoints.push({
        name: 'visidoo',
        url: `https://api.visidoo.cz/v1/address/autocomplete?q=${encodeURIComponent(trimmedQuery)}&limit=10`,
        headers: { 
          'Accept': 'application/json', 
          'X-API-Key': visidooApiKey,
          'User-Agent': 'Next.js/14',
        },
      })
    }
    
    // MOCK DATA pro development (když žádné API není dostupné)
    if (endpoints.length === 0) {
      console.log('[API Route] No API keys available - returning mock data for development')
      
      // Realistická mock data různých českých adres
      const allMockAddresses = [
        { street: 'Václavské náměstí', city: 'Praha 1', zip: '11000', houseNumber: '1' },
        { street: 'Václavské náměstí', city: 'Praha 1', zip: '11000', houseNumber: '28' },
        { street: 'Václavské náměstí', city: 'Praha 1', zip: '11000', houseNumber: '56' },
        { street: 'Karlovo náměstí', city: 'Praha 2', zip: '12000', houseNumber: '13' },
        { street: 'Náměstí Míru', city: 'Praha 2', zip: '12000', houseNumber: '1' },
        { street: 'Hlavní', city: 'Praha 10', zip: '10000', houseNumber: '123' },
        { street: 'Masarykova', city: 'Brno', zip: '60200', houseNumber: '1' },
        { street: 'Palackého', city: 'Brno', zip: '61200', houseNumber: '44' },
        { street: 'Krátká', city: 'Ostrava', zip: '70200', houseNumber: '5' },
        { street: 'Dlouhá', city: 'Plzeň', zip: '30100', houseNumber: '10' },
        { street: 'Nová', city: 'Olomouc', zip: '77200', houseNumber: '8' },
      ]
      
      const mockData = allMockAddresses
        .filter(item => {
          const addressStr = `${item.street} ${item.houseNumber}, ${item.city}, ${item.zip}`.toLowerCase()
          return addressStr.includes(trimmedQuery.toLowerCase())
        })
        .slice(0, 5) // Max 5 výsledků
        .map((item, index) => ({
          ...item,
          ruianId: `mock-${index}`,
          fullAddress: `${item.street} ${item.houseNumber}, ${item.city}, ${item.zip}`,
        }))
      
      return NextResponse.json(mockData, {
        headers: {
          'X-Debug-Mode': 'mock',
          'X-Debug-Message': 'Using mock data - configure Google Places API key in .env.local for real data',
          'Cache-Control': 'no-cache', // Mock data by neměla být cachována
        },
      })
    }

    // Zkusíme každý endpoint
    const errors: string[] = []
    for (const endpoint of endpoints) {
      try {
        console.log(`[API Route] Trying endpoint: ${endpoint.name}`, endpoint.url)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 sekund timeout

        const response = await fetch(endpoint.url, {
          method: 'GET',
          headers: endpoint.headers,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          const contentType = response.headers.get('content-type')
          
          if (!contentType?.includes('application/json')) {
            const text = await response.text()
            const errorMsg = `[${endpoint.name}] Non-JSON response: ${contentType}, body: ${text.substring(0, 200)}`
            console.warn(errorMsg)
            errors.push(errorMsg)
            continue
          }

          const data = await response.json()
          console.log(`[API Route] ${endpoint.name} response:`, JSON.stringify(data).substring(0, 500))
          
          // Transformace dat podle formátu API (různé API mají různé formáty)
          let results: any[] = []

          if (endpoint.name === 'google-places') {
            // Google Places API vrací { predictions: [...], status: 'OK' | 'ZERO_RESULTS' | 'REQUEST_DENIED' | ... }
            console.log(`[API Route] google-places response status:`, data.status)
            
            if (data.status === 'OK' && data.predictions && Array.isArray(data.predictions)) {
              results = data.predictions
              console.log(`[API Route] google-places: Found ${results.length} predictions`)
            } else if (data.status === 'ZERO_RESULTS') {
              console.log(`[API Route] google-places: No results found`)
              errors.push(`[google-places] No results found`)
            } else if (data.status === 'REQUEST_DENIED') {
              const errorMsg = `[google-places] Request denied - check API key and enable Places API in Google Cloud Console. Error: ${data.error_message || 'No error message'}`
              console.error(errorMsg)
              errors.push(errorMsg)
            } else if (data.status === 'INVALID_REQUEST') {
              const errorMsg = `[google-places] Invalid request: ${data.error_message || 'Check query format'}`
              console.error(errorMsg)
              errors.push(errorMsg)
            } else if (data.status === 'OVER_QUERY_LIMIT') {
              const errorMsg = `[google-places] Over query limit - API quota exceeded`
              console.error(errorMsg)
              errors.push(errorMsg)
            } else if (data.status && data.status !== 'OK') {
              const errorMsg = `[google-places] API error: ${data.status} - ${data.error_message || 'Unknown error'}`
              console.error(errorMsg)
              errors.push(errorMsg)
            } else {
              console.warn(`[API Route] google-places: Unexpected response format:`, Object.keys(data))
              errors.push(`[google-places] Unexpected response format: ${Object.keys(data).join(', ')}`)
            }
          } else if (endpoint.name === 'visidoo') {
            // Visidoo API vrací { data: [...] } nebo přímo pole
            if (Array.isArray(data)) {
              results = data
              console.log(`[API Route] visidoo: Found array with ${results.length} items`)
            } else if (data && typeof data === 'object' && Array.isArray(data.data)) {
              results = data.data
              console.log(`[API Route] visidoo: Found data.data array with ${results.length} items`)
            } else if (data && typeof data === 'object' && Array.isArray(data.results)) {
              results = data.results
              console.log(`[API Route] visidoo: Found data.results array with ${results.length} items`)
            } else {
              console.warn(`[API Route] visidoo: Unexpected response format, keys:`, Object.keys(data))
              errors.push(`[visidoo] Unexpected response format: ${Object.keys(data).join(', ')}`)
            }
          } else {
            // Ostatní RÚIAN API endpointy
            if (Array.isArray(data)) {
              results = data
              console.log(`[API Route] ${endpoint.name}: Found array with ${results.length} items`)
            } else if (data && typeof data === 'object') {
              if (Array.isArray(data.data)) {
                results = data.data
                console.log(`[API Route] ${endpoint.name}: Found data.data array with ${results.length} items`)
              } else if (Array.isArray(data.results)) {
                results = data.results
                console.log(`[API Route] ${endpoint.name}: Found data.results array with ${results.length} items`)
              } else if (Array.isArray(data.items)) {
                results = data.items
                console.log(`[API Route] ${endpoint.name}: Found data.items array with ${results.length} items`)
              } else {
                console.warn(`[API Route] ${endpoint.name}: Unexpected response format, keys:`, Object.keys(data))
                errors.push(`[${endpoint.name}] Unexpected response format: ${Object.keys(data).join(', ')}`)
              }
            } else {
              console.warn(`[API Route] ${endpoint.name}: Response is not array or object:`, typeof data)
              errors.push(`[${endpoint.name}] Response is not array or object: ${typeof data}`)
            }
          }

          if (results.length > 0) {
            console.log(`[API Route] ${endpoint.name}: Parsing ${results.length} items`)
            
            // Transformace do jednotného formátu podle typu API
            let transformed: any[] = []
            
            if (endpoint.name === 'google-places') {
              // Google Places API: predictions mají strukturu { description, place_id, structured_formatting }
              transformed = results.map((prediction: any) => {
                const structured = prediction.structured_formatting || {}
                const description = prediction.description || ''
                
                // Parsování adresy z description (např. "Pivovarská, Praha, Česká republika")
                const parts = description.split(',').map((p: string) => p.trim())
                const street = parts[0] || ''
                const city = parts[1] || ''
                
                return {
                  street: structured.main_text || street || '',
                  city: structured.secondary_text || city || '',
                  zip: '', // Google Places autocomplete nevrátí PSČ bez dalšího requestu
                  houseNumber: '', // Google Places autocomplete nevrátí číslo popisné bez dalšího requestu
                  ruianId: prediction.place_id || '',
                  placeId: prediction.place_id || '', // Uložíme place_id pro případné další použití
                  fullAddress: description,
                }
              })
            } else {
              // Visidoo a ostatní RÚIAN API endpointy
              transformed = results.map((item: any) => ({
                street: item.streetName || item.street || item.nazev_ulice || item.ulice || item.main_text || '',
                city: item.cityName || item.city || item.nazev_obce || item.mesto || item.secondary_text || '',
                zip: item.zipCode || item.zip || item.psc || '',
                houseNumber: item.houseNumber || item.house_number || item.cislo_domovni || item.cislo_popisne || '',
                ruianId: item.id?.toString() || item.ruianId?.toString() || item.id_adm || item.place_id || '',
                fullAddress: item.fullAddress || item.description || [
                  item.streetName || item.street || item.nazev_ulice || item.ulice || item.main_text,
                  item.houseNumber || item.house_number || item.cislo_domovni || item.cislo_popisne,
                  item.cityName || item.city || item.nazev_obce || item.mesto || item.secondary_text,
                  item.zipCode || item.zip || item.psc,
                ]
                  .filter(Boolean)
                  .join(', '),
              }))
            }
            
            const validResults = transformed.filter((r: any) => r.fullAddress.trim().length > 0)

            console.log(`[API Route] ${endpoint.name}: Transformed ${validResults.length} valid addresses`)
            if (validResults.length > 0) {
              return NextResponse.json(validResults, {
                headers: {
                  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400', // Cache na 1 hodinu
                },
              })
            }
          } else {
            console.warn(`[API Route] ${endpoint.name}: No results found in response`)
            errors.push(`[${endpoint.name}] No results found`)
          }
        } else {
          const errorMsg = `[${endpoint.name}] HTTP ${response.status}: ${response.statusText}`
          console.warn(errorMsg)
          
          // Zkusíme získat response body pro debug (zejména pro Google Places API)
          try {
            const contentType = response.headers.get('content-type')
            if (contentType?.includes('application/json')) {
              const jsonData = await response.json()
              console.error(`[API Route] ${endpoint.name} error response:`, JSON.stringify(jsonData))
              
              // Pro Google Places API může být chyba v JSON formátu
              if (endpoint.name === 'google-places' && jsonData.status) {
                const detailedError = `[google-places] Status: ${jsonData.status}, Error: ${jsonData.error_message || 'No error message'}`
                errors.push(detailedError)
              } else {
                errors.push(errorMsg)
              }
            } else {
              const text = await response.text()
              console.warn(`[API Route] ${endpoint.name} error body:`, text.substring(0, 500))
              errors.push(errorMsg)
            }
          } catch (e) {
            errors.push(errorMsg)
          }
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          const errorMsg = `[${endpoint.name}] Timeout after 5s`
          console.warn(errorMsg)
          errors.push(errorMsg)
        } else {
          const errorMsg = `[${endpoint.name}] Error: ${error.message}`
          console.warn(errorMsg)
          errors.push(errorMsg)
        }
        continue
      }
    }

    // Pokud všechny endpointy selhaly, vrátíme prázdný výsledek s informacemi o chybách
    console.error(`[API Route] All endpoints failed for query "${trimmedQuery}":`, errors)
    return NextResponse.json([], { 
      status: 200,
      headers: {
        'X-Debug-Errors': JSON.stringify(errors),
      },
    })
  } catch (error: any) {
    console.error('Address search API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

