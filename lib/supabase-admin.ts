// lib/supabase-admin.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let _admin: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient | null {
  if (_admin) return _admin

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    console.error("Supabase admin env vars are missing")
    return null
  }

  _admin = createClient(url, key, {
    auth: { persistSession: false }, // サーバーはセッション保持不要
  })

  return _admin
}
