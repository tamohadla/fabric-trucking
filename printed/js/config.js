// printed/js/config.js
// Configuration for the Printed Orders page.
// IMPORTANT: SUPABASE_ANON_KEY is safe to be used on client side ONLY with proper RLS policies.

const DEFAULT_CFG = {
  // Fill these two values from Supabase > Project Settings > API
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",

  // Database / Storage
  TABLE_NAME: "printed_mariages",
  STORAGE_BUCKET: "images",
  STORAGE_PREFIX: "printed", // folder inside the bucket

  // Sorting fallbacks (we try in order until one works)
  ORDER_FIELDS: ["date", "order_date", "created_at", "id"]
};

// Allow overriding from window BEFORE modules run:
// <script>window.PrintedConfig = { ... };</script>
export const CFG = (typeof window !== "undefined" && window.PrintedConfig)
  ? { ...DEFAULT_CFG, ...window.PrintedConfig }
  : DEFAULT_CFG;

// expose (optional)
if (typeof window !== "undefined") {
  window.PrintedConfig = { ...DEFAULT_CFG, ...(window.PrintedConfig || {}) };
}
