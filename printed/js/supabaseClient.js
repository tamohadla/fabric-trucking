import { CFG } from "./config.js";

export const sb = (() => {
  if (typeof supabase === "undefined" || !supabase.createClient) {
    throw new Error("Supabase library not loaded. Ensure the CDN script is included before modules.");
  }
  if (!CFG?.SUPABASE_URL || !CFG?.SUPABASE_ANON_KEY) {
    throw new Error("Missing Supabase configuration (SUPABASE_URL / SUPABASE_ANON_KEY).");
  }
  return supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
})();
