// lib/supabaseServer.ts
import { cookies } from "next/headers"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

export function getSupabaseServer(): SupabaseClient {
  const cookieStore = cookies()
  const supabaseUrl = process.env.SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !anonKey) {
    throw new Error("supabase_server_env_missing")
  }

  // Next.jsのサーバ側で、Authクッキーを読み書きできるクライアント
  return createServerClient(supabaseUrl, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try { cookieStore.set(name, value, options) } catch { /* read-only in edge cases */ }
      },
      remove(name: string, options: CookieOptions) {
        try { cookieStore.set(name, "", { ...options, expires: new Date(0) }) } catch {}
      },
    },
  })
}
