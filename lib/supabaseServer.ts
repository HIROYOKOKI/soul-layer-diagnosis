// lib/supabaseServer.ts
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";

// API Route (app/api/*)/route.ts から呼ぶサーバ用Supabaseクライアント。
// - セッションは Next の Cookie から自動連携
// - env は NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY を利用
// - auth.getUser() は 404/401 時に throw せず { data: { user|null } } を返す
export function getSupabaseServer(): SupabaseClient {
  return createRouteHandlerClient({ cookies });
}
