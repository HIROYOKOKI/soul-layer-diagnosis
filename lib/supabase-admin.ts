// lib/supabase-admin.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _admin: SupabaseClient | null = null;

export function getSupabaseAdmin() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) return null; // ← ここで null を返せばAPI側で 500 文言化できる

  if (!_admin) {
    _admin = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { "X-Client": "soul-layer-admin" } },
    });
  }
  return _admin;
}
