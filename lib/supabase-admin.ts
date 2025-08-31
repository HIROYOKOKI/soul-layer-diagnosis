// lib/supabase-admin.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let cached: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient | null {
  if (cached) return cached
  // どちらの名前でも動くように両対応
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE ?? process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) return null
  cached = createClient(url, serviceKey, { auth: { persistSession: false } })
  return cached
}
