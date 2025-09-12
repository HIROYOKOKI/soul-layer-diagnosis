// lib/supabase-browser.ts
"use client";

import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import type { Session, SupabaseClient } from "@supabase/supabase-js";

let _sb: SupabaseClient | null = null;

/** ブラウザ専用の Supabase クライアント（Cookieモード） */
export function getBrowserSupabase(): SupabaseClient {
  if (!_sb) _sb = createBrowserSupabaseClient();
  return _sb;
}

/** 現在のセッションを取得（未ログインなら null） */
export async function getCurrentSession(): Promise<Session | null> {
  const supabase = getBrowserSupabase();
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}
