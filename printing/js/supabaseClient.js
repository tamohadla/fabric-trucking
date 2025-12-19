import { CFG } from "./config.js";

// Create a single Supabase client instance for this page
export const sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
