// lib/supabase-browser.ts などに分離してOK
import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

let _sb: SupabaseClient | null = null

export function getBrowserSupabase(): SupabaseClient {
  if (_sb) return _sb
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing")
  if (!anon) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing")
  _sb = createBrowserClient(url, anon)
  return _sb
}
