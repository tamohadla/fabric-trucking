import { CFG } from "./config.js";

function ensureSupabaseLoaded() {
  if (typeof window === "undefined") return null;
  const s = window.supabase;
  if (!s || !s.createClient) {
    throw new Error("Supabase library not loaded. Check the CDN <script> tag in printed.html.");
  }
  return s;
}

export const sb = (() => {
  const s = ensureSupabaseLoaded();
  if (!CFG.SUPABASE_URL || !CFG.SUPABASE_ANON_KEY) {
    throw new Error("Missing Supabase config. Please set SUPABASE_URL and SUPABASE_ANON_KEY in printed/js/config.js (or window.PrintedConfig).");
  }
  return s.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
})();
