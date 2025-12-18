// Printed page configuration (ES module)
// IMPORTANT: Supabase anon key is expected in client-side apps. Secure your data via RLS policies.
export const CFG = (() => {
  // Backward compatibility: if something sets window.PrintedConfig, prefer it.
  const w = typeof window !== "undefined" ? window : {};
  const cfg = w.PrintedConfig || w.PrintedConfig || null;
  if (cfg) return cfg;
  // Default config (from this project)
  return {
    SUPABASE_URL: "https://umrczwoxjhxwvrezocrm.supabase.co",
    SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtcmN6d294amh4d3ZyZXpvY3JtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5ODA0MTUsImV4cCI6MjA3OTU1NjQxNX0.88PDM2h93rhGhOxVRDa5q3rismemqJJEpmBdwWmfgVQ", // <-- keep empty if you inject via window.PrintedConfig elsewhere
    TABLE_NAME: "printed_mariages",
    STORAGE_BUCKET: "images",
    STORAGE_PREFIX: "printed"
  };
})();

// Make it accessible for non-module legacy code as well.
if (typeof window !== "undefined") {
  window.PrintedConfig = window.PrintedConfig || CFG;
}
