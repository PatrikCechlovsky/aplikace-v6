// FILE: app/api/subjects/check-duplicates/route.ts
// PURPOSE: API endpoint pro kontrolu duplicitních subjektů podle IČ, emailu a dalších polí
// USAGE: POST /api/subjects/check-duplicates

import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { ic, email, excludeSubjectId } = body

    if (!ic && !email) {
      return Response.json({ duplicates: [] }, { status: 200 })
    }

    // Vytvořit Supabase client
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const conditions: string[] = []
    
    // Kontrola IČ (jen pro firmy)
    if (typeof ic === 'string' && ic.trim()) {
      const icTrimmed = ic.trim()
      conditions.push(`ic.eq.${icTrimmed}`)
    }

    // Kontrola emailu (vždy)
    if (email?.trim()) {
      const emailNormalized = email.trim().toLowerCase()
      conditions.push(`email.eq.${emailNormalized}`)
    }

    if (conditions.length === 0) {
      return NextResponse.json({ duplicates: [] })
    }

    // Dotaz na databázi
    let query = supabase
      .from('subjects')
      .select('id, display_name, email, ic, company_name, first_name, last_name, subject_type, is_landlord, is_tenant, is_user')
      .or(conditions.join(','))
      .limit(10)

    // Vyloučit aktuálně editovaný subjekt
    if (excludeSubjectId && excludeSubjectId !== 'new') {
      query = query.neq('id', excludeSubjectId)
    }

    const { data, error } = await query

    if (error) {
      console.error('[check-duplicates] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ duplicates: data || [] })
  } catch (err: any) {
    console.error('[check-duplicates] Error:', err)
    return NextResponse.json({ error: err.message || 'Chyba při kontrole duplicit' }, { status: 500 })
  }
}
