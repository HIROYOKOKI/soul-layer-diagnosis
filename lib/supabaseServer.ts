// lib/supabaseServer.ts

// 今は UUID 紐付けを使わないのでスタブにする。
// 後で @supabase/auth-helpers-nextjs を導入して戻す。

import type { SupabaseClient } from "@supabase/supabase-js";

export function getSupabaseServer(): SupabaseClient {
  throw new Error("getSupabaseServer is disabled in this build");
}

