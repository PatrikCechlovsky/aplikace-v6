// FILE: app/lib/supabaseClient.ts
// PURPOSE: Supabase client initialization with validated environment variables

import { createClient } from '@supabase/supabase-js'
import { env, validateEnv } from './env'

// Validate environment variables
validateEnv()

export const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
