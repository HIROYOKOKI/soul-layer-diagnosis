// lib/supabaseServer.ts
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * API Route（app/api/*/route.ts）から呼ぶサーバ用Supabaseクライアント。
 * - セッションはNextのCookieから自動連携
 * - envは NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY を利用
 * - 404/401時にthrowしない（auth.getUser()は {data:{user|null}} を返す）
 */
export function getSupabaseServer(): SupabaseClient {
  return createRouteHandlerClient({ cookies });
}

