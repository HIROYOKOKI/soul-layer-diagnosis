import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let _sb: SupabaseClient | null = null

export function getBrowserSupabase(): SupabaseClient {
  if (_sb) return _sb
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing")
  if (!anon) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing")

  _sb = createClient(url, anon, {
    auth: {
      persistSession: true,   // ブラウザでログイン状態を保持
      autoRefreshToken: true, // トークン自動更新
    },
  })
  return _sb
}
