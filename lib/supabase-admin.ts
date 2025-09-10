import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let admin: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL // サーバー用の Project URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY // サーバー用 service_role key

  if (!url || !key) return null

  if (!admin) {
    admin = createClient(url, key, { auth: { persistSession: false } })
  }
  return admin
}
