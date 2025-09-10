import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let __sb__: SupabaseClient | null = null

export function getBrowserSupabase(): SupabaseClient {
  if (typeof window === 'undefined') throw new Error('supabase_client_on_server')
  if (!__sb__) {
    const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    __sb__ = createClient(url, anon, { auth: { persistSession: true, autoRefreshToken: true } })
  }
  return __sb__
}
