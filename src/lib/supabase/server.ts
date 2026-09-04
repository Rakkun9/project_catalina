import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./config";

let cached: SupabaseClient | null = null;

/** Read-only client for public content. Returns null when unconfigured. */
export function getSupabaseReadClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  cached ??= createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
  return cached;
}
