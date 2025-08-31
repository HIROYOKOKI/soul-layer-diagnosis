import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let admin: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE
  if (!url || !key) return null
  if (!admin) admin = createClient(url, key, { auth: { persistSession: false } })
  return admin
}
