// app/api/mypage/quick-latest/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/_utils/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EV = "E" | "V" | "Λ" | "Ǝ";
type QuickKey = "EVΛƎ" | "EΛVƎ";
type Env = "dev" | "prod";

function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "cache-control": "no-store" },
  });
}
function err(message: string, status = 500) {
  return NextResponse.json(
    { ok: false, error: message },
    { status, headers: { "cache-control": "no-store" } }
  );
}

export async function GET(req: Request) {
  try {
    const sb = createSupabaseServerClient();

    // 認証ユーザー取得（未ログインは空を返す）
    const { data: auth, error: userErr } = await sb.auth.getUser();
    if (userErr || !auth?.user) {
      return ok({ ok: true, item: null, unauthenticated: true });
    }
    const userId = auth.user.id;

    // env/theme 切替（?env=prod で本番）
    const sp = new URL(req.url).searchParams;
    const env: Env =
      (sp.get("env") ?? "dev").toLowerCase() === "prod" ? "prod" : "dev";

    // ===== 取得（最新1件）=====
    const { data, error } = await sb
      .from("quick_results")
      .select("type_key, type_label, points_v2, order_v2, theme, created_at")
      .eq("user_id", userId)
      .eq("theme", env) // dev/prod を明示
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return err(error.message, 500);
    if (!data) return ok({ ok: true, item: null }); // レコードなし

    // ===== 互換フォーマットに整形（既存フロントの型に合わせる）=====
    const scores = (data.points_v2 ?? {}) as Partial<Record<EV, number>>;
    const res = {
      type_key: data.type_key as QuickKey | null,
      type_label: data.type_label ?? null,
      created_at: data.created_at,
      scores, // ← MyPage 既存の期待フィールド

      // 旧スキーマ互換（安全のため残す）
      model: data.type_key as QuickKey | null,
      label: data.type_label ?? null,

      // 参考に返す追加フィールド
      order_v2: data.order_v2 ?? null,
      theme: data.theme ?? env,
    };

    return ok({ ok: true, item: res });
  } catch (e: any) {
    console.error("[mypage/quick-latest] fatal:", e);
    return err(e?.message ?? "unknown");
  }
}
