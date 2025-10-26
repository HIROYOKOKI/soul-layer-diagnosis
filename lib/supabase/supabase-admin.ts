// lib/supabase-admin.ts
import { createClient } from "@supabase/supabase-js";

let _admin: ReturnType<typeof createClient> | null = null;

/**
 * 管理者権限（service_role key）で Supabase クライアントを作成
 * - API ルート（/api/...）専用
 * - フロント側では絶対に import しないこと！
 */
export function getSupabaseAdmin() {
  if (_admin) return _admin;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("[supabase-admin] Missing environment variables", {
      url: !!url,
      key: !!key,
    });
    return null;
  }

  _admin = createClient(url, key);
  return _admin;
}
