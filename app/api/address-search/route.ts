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
    const visidooApiKey = process.env.NEXT_PUBLIC_VISIDOO_API_KEY
    const googlePlacesApiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
    const ruianApiKey = process.env.NEXT_PUBLIC_RUIAN_API_KEY || 'c24d82cff9e807c08544e149c2a1dc4d11600c49589704d6d7b49ce4cbca50c8'

    // Priorita: Visidoo > Google Places > ostatní RÚIAN endpointy
    const endpoints: Array<{ name: string; url: string; headers: Record<string, string> }> = []
    
    // 1. Visidoo API (nejlepší pro české adresy - RÚIAN)
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
    
    // 2. Google Places API (spolehlivé, podporuje české adresy)
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
    
    // 3. Fallback: ostatní RÚIAN endpointy (pravděpodobně nefungují, ale zkusíme)
    endpoints.push(
      {
        name: 'ruian.cuzk.cz',
        url: `https://ruian.cuzk.cz/api/v1/search?q=${encodeURIComponent(trimmedQuery)}&limit=10`,
        headers: { 'Accept': 'application/json', 'User-Agent': 'Next.js/14' },
      },
      {
        name: 'cuzk.ruian.cz',
        url: `https://cuzk.ruian.cz/api/v1/address?q=${encodeURIComponent(trimmedQuery)}&limit=10`,
        headers: { 'Accept': 'application/json', 'User-Agent': 'Next.js/14' },
      },
      {
        name: 'skaut.cz',
        url: `https://ruian-api.skaut.cz/api/v1/search?q=${encodeURIComponent(trimmedQuery)}&limit=10`,
        headers: { 'Accept': 'application/json', 'User-Agent': 'Next.js/14' },
      },
      {
        name: 'fnx.io',
        url: `https://ruian.fnx.io/api/v1/address?q=${encodeURIComponent(trimmedQuery)}&limit=10&apiKey=${ruianApiKey}`,
        headers: { 'Accept': 'application/json', 'User-Agent': 'Next.js/14' },
      },
    )

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
            // Google Places API vrací { predictions: [...] }
            if (data.predictions && Array.isArray(data.predictions)) {
              results = data.predictions
              console.log(`[API Route] google-places: Found ${results.length} predictions`)
            } else if (data.status === 'ZERO_RESULTS') {
              console.log(`[API Route] google-places: No results found`)
              errors.push(`[google-places] No results found`)
            } else if (data.status && data.status !== 'OK') {
              const errorMsg = `[google-places] API error: ${data.status} - ${data.error_message || ''}`
              console.warn(errorMsg)
              errors.push(errorMsg)
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
          errors.push(errorMsg)
          
          // Zkusíme získat response body pro debug
          try {
            const text = await response.text()
            console.warn(`[API Route] ${endpoint.name} error body:`, text.substring(0, 200))
          } catch (e) {
            // Ignore
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

