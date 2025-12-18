import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

export function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase keys are missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY.");
  }
  // global supabase from CDN
  if (!window.supabase) throw new Error("Supabase library not loaded.");
  return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
