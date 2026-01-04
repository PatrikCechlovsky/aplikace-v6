import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Use environment variables instead of hardcoded credentials
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
});

// Only expose to window in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.supabase = supabase; // pro konzoli
  console.log("[SUPABASE INIT]", SUPABASE_URL);
}
