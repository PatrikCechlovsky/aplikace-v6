/*
 * FILE: app/api/place-details/route.ts
 * PURPOSE: API route pro získání detailů místa z Google Places API (včetně PSČ)
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * Endpoint pro získání detailů místa podle place_id
 * Vrací kompletní adresu včetně PSČ
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const placeId = searchParams.get('place_id')

    if (!placeId) {
      return NextResponse.json(
        { error: 'Missing place_id parameter' },
        { status: 400 }
      )
    }

    const googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY

    if (!googlePlacesApiKey) {
      return NextResponse.json(
        { error: 'Google Places API key not configured' },
        { status: 500 }
      )
    }

    console.log('[Place Details API] Fetching details for place_id:', placeId)

    // Volání Place Details API
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=address_components,formatted_address&key=${googlePlacesApiKey}&language=cs`
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Next.js/14',
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error('[Place Details API] HTTP error:', response.status)
      return NextResponse.json(
        { error: 'Failed to fetch place details' },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('[Place Details API] Response status:', data.status)

    if (data.status !== 'OK') {
      console.error('[Place Details API] API error:', data.status, data.error_message)
      return NextResponse.json(
        { error: data.error_message || `API error: ${data.status}` },
        { status: 400 }
      )
    }

    const result = data.result
    const addressComponents = result?.address_components || []

    // Parsování address_components
    let street = ''
    let houseNumber = ''
    let city = ''
    let zip = ''
    let country = 'CZ'

    for (const component of addressComponents) {
      const types = component.types || []
      
      if (types.includes('route')) {
        street = component.long_name
      }
      if (types.includes('street_number')) {
        houseNumber = component.long_name
      }
      if (types.includes('locality')) {
        city = component.long_name
      }
      if (types.includes('postal_code')) {
        zip = component.long_name
      }
      if (types.includes('country')) {
        country = component.short_name
      }
    }

    console.log('[Place Details API] Parsed:', { street, houseNumber, city, zip, country })

    // Formát fullAddress: "Ulice ČísloPopisné, PSČ Město"
    const streetPart = [street, houseNumber].filter(Boolean).join(' ')
    const cityPart = [zip, city].filter(Boolean).join(' ')
    const fullAddress = streetPart && cityPart 
      ? `${streetPart}, ${cityPart}` 
      : result?.formatted_address || ''

    return NextResponse.json({
      street,
      houseNumber,
      city,
      zip,
      country,
      fullAddress: fullAddress,
      placeId,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400', // Cache na 24 hodin
      },
    })

  } catch (error: any) {
    console.error('[Place Details API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
