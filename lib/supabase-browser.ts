// lib/supabase-browser.ts
"use client";
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import type { SupabaseClient, Session } from "@supabase/supabase-js";

let _sb: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient {
  if (!_sb) _sb = createBrowserSupabaseClient();
  return _sb;
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data } = await getBrowserSupabase().auth.getSession();
  return data.session ?? null;
}
