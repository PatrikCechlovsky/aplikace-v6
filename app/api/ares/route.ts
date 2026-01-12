/*
 * FILE: app/api/ares/route.ts
 * PURPOSE: API route pro načítání dat z ARES (Automatizovaný Rejstřík Ekonomických Subjektů)
 */

import { NextRequest, NextResponse } from 'next/server'

// Node.js runtime - potřebujeme fetch
export const runtime = 'nodejs'
// Dynamická route - používá searchParams
export const dynamic = 'force-dynamic'

/**
 * ARES API endpoint pro získání dat o firmě podle IČO
 * Dokumentace: https://ares.gov.cz/
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const ico = searchParams.get('ico')

    if (!ico || !ico.trim()) {
      return NextResponse.json({ error: 'IČO je povinné' }, { status: 400 })
    }

    const trimmedIco = ico.trim().replace(/\s+/g, '')

    // Validace IČO (8 číslic)
    if (!/^\d{8}$/.test(trimmedIco)) {
      return NextResponse.json({ error: 'IČO musí obsahovat 8 číslic' }, { status: 400 })
    }

    // ARES API endpoint
    // Dokumentace: https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/{ico}
    const aresUrl = `https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${trimmedIco}`

    console.log(`[ARES API] Fetching data for IČO: ${trimmedIco}`)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 sekund timeout

    try {
      const response = await fetch(aresUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Next.js/14',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        if (response.status === 404) {
          return NextResponse.json({ error: 'Firma s tímto IČO nebyla nalezena v ARES' }, { status: 404 })
        }
        const errorText = await response.text()
        console.error(`[ARES API] HTTP ${response.status}:`, errorText)
        return NextResponse.json(
          { error: `ARES API vrátilo chybu: ${response.status} ${response.statusText}` },
          { status: response.status }
        )
      }

      const contentType = response.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        const text = await response.text()
        console.error(`[ARES API] Non-JSON response:`, text.substring(0, 500))
        return NextResponse.json({ error: 'ARES API vrátilo neplatnou odpověď' }, { status: 500 })
      }

      const data = await response.json()
      console.log(`[ARES API] Response received for IČO ${trimmedIco}`)
      console.log('[ARES API] Full response data:', JSON.stringify(data, null, 2))

      // ARES API vrací data v struktuře:
      // {
      //   "obchodniJmeno": "Název firmy",
      //   "ico": "12345678",
      //   "dic": "CZ12345678",
      //   "sidlo": {
      //     "nazevObce": "Praha",
      //     "nazevUlice": "Václavské náměstí",
      //     "cisloDomovni": "1",
      //     "psc": "11000",
      //     "kodStatu": "CZ"
      //   },
      //   ...
      // }

      // Transformace dat do našeho formátu
      const transformed = {
        companyName: data.obchodniJmeno || data.nazev || '',
        ic: data.ico || trimmedIco,
        dic: data.dic || '',
        icValid: true, // Pokud ARES vrátil data, IČO je validní
        dicValid: !!data.dic,
        // Adresa
        street: data.sidlo?.nazevUlice || data.sidlo?.ulice || '',
        houseNumber: data.sidlo?.cisloDomovni ? String(data.sidlo.cisloDomovni) : (data.sidlo?.cisloPopisne ? String(data.sidlo.cisloPopisne) : ''),
        city: data.sidlo?.nazevObce || data.sidlo?.obec || '',
        zip: data.sidlo?.psc ? String(data.sidlo.psc) : '',
        country: data.sidlo?.kodStatu || 'CZ', // Použít kód státu (CZ, SK, ...)
        // Raw data pro případné další použití
        aresData: data,
      }

      console.log('[ARES API] Transformed data:', JSON.stringify(transformed, null, 2))

      return NextResponse.json(transformed, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400', // Cache na 1 hodinu
        },
      })
    } catch (error: any) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        console.error(`[ARES API] Timeout after 10s for IČO ${trimmedIco}`)
        return NextResponse.json({ error: 'Timeout při načítání dat z ARES' }, { status: 504 })
      }
      throw error
    }
  } catch (error: any) {
    console.error('[ARES API] Error:', error)
    return NextResponse.json(
      { error: 'Chyba při načítání dat z ARES', message: error.message },
      { status: 500 }
    )
  }
}

