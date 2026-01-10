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
    
    // API klíč z environment variables
    const apiKey = process.env.NEXT_PUBLIC_RUIAN_API_KEY || 'c24d82cff9e807c08544e149c2a1dc4d11600c49589704d6d7b49ce4cbca50c8'

    // Zkusíme několik endpointů v pořadí podle pravděpodobnosti úspěchu
    const endpoints = [
      // 1. Veřejné API (skaut.cz) - bez API klíče - zkusíme jako první
      {
        name: 'skaut.cz',
        url: `https://ruian-api.skaut.cz/api/v1/search?q=${encodeURIComponent(trimmedQuery)}&limit=10`,
        headers: { 'Accept': 'application/json', 'User-Agent': 'Next.js/14' },
      },
      // 2. Alternativní endpoint pro skaut.cz
      {
        name: 'skaut.cz (alt)',
        url: `https://ruian-api.skaut.cz/api/v1/address?q=${encodeURIComponent(trimmedQuery)}&limit=10`,
        headers: { 'Accept': 'application/json', 'User-Agent': 'Next.js/14' },
      },
      // 3. Fnx.io API s API klíčem jako query param (z serveru není CORS problém)
      {
        name: 'fnx.io (query param)',
        url: `https://ruian.fnx.io/api/v1/address?q=${encodeURIComponent(trimmedQuery)}&limit=10&apiKey=${apiKey}`,
        headers: { 'Accept': 'application/json', 'User-Agent': 'Next.js/14' },
      },
    ]

    // Zkusíme každý endpoint
    for (const endpoint of endpoints) {
      try {
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
            console.warn(`[${endpoint.name}] Non-JSON response:`, contentType, text.substring(0, 200))
            continue
          }

          const data = await response.json()
          
          // Transformace dat podle formátu API
          let results: any[] = []

          if (Array.isArray(data)) {
            results = data
          } else if (data && typeof data === 'object') {
            if (Array.isArray(data.data)) {
              results = data.data
            } else if (Array.isArray(data.results)) {
              results = data.results
            } else if (Array.isArray(data.items)) {
              results = data.items
            }
          }

          if (results.length > 0) {
            // Transformace do jednotného formátu
            const transformed = results.map((item: any) => ({
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
            })).filter((r: any) => r.fullAddress.trim().length > 0)

            if (transformed.length > 0) {
              return NextResponse.json(transformed, {
                headers: {
                  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400', // Cache na 1 hodinu
                },
              })
            }
          }
        } else {
          console.warn(`[${endpoint.name}] HTTP ${response.status}: ${response.statusText}`)
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.warn(`[${endpoint.name}] Timeout`)
        } else {
          console.warn(`[${endpoint.name}] Error:`, error.message)
        }
        continue
      }
    }

    // Pokud všechny endpointy selhaly, vrátíme prázdný výsledek
    return NextResponse.json([], { status: 200 })
  } catch (error: any) {
    console.error('Address search API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

