"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient, Session } from "@supabase/supabase-js";

let _sb: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient {
  if (_sb) return _sb;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!url || !anon) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  _sb = createBrowserClient(url, anon);
  return _sb;
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data } = await getBrowserSupabase().auth.getSession();
  return data.session ?? null;
}
