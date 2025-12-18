// FILE: app/lib/supabase/client.ts
// PURPOSE: Compatibility shim – některé služby/importy používají "@/app/lib/supabase/client".
// V našem projektu je ale skutečný klient v "@/app/lib/supabaseClient" (export const supabase).

import { supabase } from '@/app/lib/supabaseClient'

export function createClient() {
  return supabase
}

// (volitelné) pro pohodlí, kdyby někde někdo importoval default:
export default createClient
