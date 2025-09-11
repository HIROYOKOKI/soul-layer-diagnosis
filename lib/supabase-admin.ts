// lib/supabase-admin.ts
import { createClient } from "@supabase/supabase-js"

let _admin: ReturnType<typeof createClient> | null = null
export function getSupabaseAdmin() {
  if (_admin) return _admin
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  _admin = createClient(url, key, { auth: { persistSession: false } })
  return _admin
}
