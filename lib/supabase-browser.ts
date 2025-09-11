// lib/supabase-browser.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let _sb: SupabaseClient | null = null

export function getBrowserSupabase(): SupabaseClient {
  // ブラウザ以外では実行しない（ビルド/SSRガード）
  if (typeof window === "undefined") {
    throw new Error("getBrowserSupabase should only run in the browser")
  }
  if (_sb) return _sb
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  _sb = createClient(url, anon, {
    auth: { persistSession: true, autoRefreshToken: true },
  })
  return _sb
}
