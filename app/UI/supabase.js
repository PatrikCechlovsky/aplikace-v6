import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// DOPLŇ své klíče z Supabase → Settings → API
export const SUPABASE_URL = "https://viwxxerhmounbymcbroi.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpd3h4ZXJobW91bmJ5bWNicm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwOTgwMzgsImV4cCI6MjA3OTY3NDAzOH0.0f0kbXm85m50dfd2WOuGBCCHxAht4MLQxiO_9z_RVNk";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
});

window.supabase = supabase; // pro konzoli
console.log("[SUPABASE INIT]", SUPABASE_URL);
