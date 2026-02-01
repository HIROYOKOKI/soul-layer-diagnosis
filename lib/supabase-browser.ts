"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// ブラウザで単一インスタンス化（Multiple GoTrueClientも抑制）
let _client: ReturnType<typeof createClientComponentClient> | null = null;

export function getBrowserSupabase() {
  if (_client) return _client;
  _client = createClientComponentClient();
  return _client;
}
