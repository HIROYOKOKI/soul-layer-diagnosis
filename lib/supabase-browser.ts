// lib/supabase-browser.ts
"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let _sb: SupabaseClient | null = null;

/**
 * 旧: getBrowserSupabase() を使っていたコード互換のため、この名前でexportする
 */
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

/**
 * もし他の場所で getSupabaseBrowserClient / getBrowserSupabaseClient を期待してても大丈夫なように別名も用意
 */
export const getSupabaseBrowserClient = getBrowserSupabase;
export const getBrowserSupabaseClient = getBrowserSupabase;
