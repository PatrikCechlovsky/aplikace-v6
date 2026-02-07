// FILE: scripts/check-types-colors.js
// PURPOSE: Check if generic_types have colors and icons set

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTypes() {
  console.log('\n🔍 Checking generic_types...\n')
  
  const { data, error } = await supabase
    .from('generic_types')
    .select('category, code, name, icon, color, order_index, active')
    .in('category', ['unit_types', 'property_types'])
    .order('category')
    .order('order_index')
  
  if (error) {
    console.error('❌ Error:', error.message)
    return
  }
  
  if (!data || data.length === 0) {
    console.log('⚠️  No types found')
    return
  }
  
  console.log('📊 Found', data.length, 'types:\n')
  
  let currentCategory = null
  for (const type of data) {
    if (type.category !== currentCategory) {
      currentCategory = type.category
      console.log(`\n━━━ ${currentCategory.toUpperCase()} ━━━`)
    }
    
    const icon = type.icon || '❌'
    const color = type.color || '❌ NO COLOR'
    const status = type.active ? '✅' : '🚫'
    
    console.log(`${icon} ${type.code.padEnd(20)} | ${type.name.padEnd(25)} | ${color.padEnd(15)} | ${status}`)
  }
  
  console.log('\n✅ Done\n')
}

checkTypes().catch(console.error)
