// FILE: scripts/check-ui-prefs-table.js
// PURPOSE: Zkontrolovat jestli existuje tabulka ui_view_prefs

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load .env.local manually
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
      process.env[match[1]] = match[2]
    }
  })
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.log('❌ Chybí env vars - zkontroluj .env.local')
  process.exit(1)
}

const supabase = createClient(url, key)

async function checkTable() {
  const { data, error } = await supabase.from('ui_view_prefs').select('*').limit(0)
  
  if (error) {
    console.log('❌ Tabulka ui_view_prefs neexistuje nebo nemá správné permissions:')
    console.log(error.message)
    console.log('\n📝 Musíš spustit SQL migraci v Supabase Dashboard:')
    console.log('1. Otevři: https://supabase.com/dashboard/project/' + url.split('//')[1].split('.')[0] + '/sql/new')
    console.log('2. Vlož obsah z supabase/migrations/069_create_ui_view_prefs.sql')
    console.log('3. Klikni RUN')
  } else {
    console.log('✅ Tabulka ui_view_prefs existuje a je přístupná')
  }
}

checkTable()
